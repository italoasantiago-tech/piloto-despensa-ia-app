// Testes do site (sem internet e sem gastar IA de verdade): node test-web.js
import assert from "node:assert/strict";
import express from "express";
import { montarWeb } from "./web.js";

let ok = 0;
const teste = async (nome, fn) => { try { await fn(); ok++; console.log("ok  -", nome); } catch (e) { console.error("FALHOU -", nome, "\n", e.message); process.exitCode = 1; } };

function subir(opcoes = {}) {
  const chamadas = [];
  const app = express();
  app.set("trust proxy", 1);
  const ligado = montarWeb(app, { codigos: "ana-1234,beto-5678", chamador: async (p) => { chamadas.push(p); if (opcoes.erro) throw Object.assign(new Error("chave sk-ant-SEGREDO inválida"), { status: 401 }); return { text: '{"ok":1}', uso: { input_tokens: 10, output_tokens: 5 } }; }, ...opcoes });
  return new Promise((res) => { const srv = app.listen(0, () => res({ ligado, chamadas, base: "http://127.0.0.1:" + srv.address().port, fechar: () => srv.close() })); });
}
const ia = (base, corpo, codigo, extra = {}) => fetch(base + "/api/ia", { method: "POST", headers: { "content-type": "application/json", ...(codigo ? { "x-codigo": codigo } : {}), ...extra }, body: JSON.stringify(corpo) });

await teste("sem CODIGOS_ACESSO o site fica desligado", async () => {
  const app = express();
  assert.equal(montarWeb(app, { codigos: "" }), false);
});

await teste("página inicial abre, com cabeçalhos de segurança e sem segredo", async () => {
  const s = await subir(); const r = await fetch(s.base + "/"); const t = await r.text();
  assert.equal(r.status, 200); assert.match(t, /Despensa/); assert.ok(!/sk-ant|ANTHROPIC_API_KEY/.test(t));
  assert.match(r.headers.get("content-security-policy"), /frame-ancestors 'none'/);
  assert.match(r.headers.get("x-robots-tag"), /noindex/);
  assert.equal((await fetch(s.base + "/saude")).status, 200);
  s.fechar();
});

await teste("IA exige código: sem código e com código errado dão 401, e a IA não é chamada", async () => {
  const s = await subir();
  assert.equal((await ia(s.base, { prompt: "oi" })).status, 401);
  assert.equal((await ia(s.base, { prompt: "oi" }, "errado")).status, 401);
  assert.equal(s.chamadas.length, 0); s.fechar();
});

await teste("código certo funciona (maiúsculas e espaços não importam) e devolve o texto", async () => {
  const s = await subir(); const r = await ia(s.base, { prompt: "receita de ovo", tier: "complex" }, "  ANA-1234 ");
  assert.equal(r.status, 200); assert.deepEqual(await r.json(), { text: '{"ok":1}' });
  assert.match(s.chamadas[0].model, /sonnet/); assert.ok(s.chamadas[0].maxTokens >= 4000); s.fechar();
});

await teste("tier desconhecido cai no padrão e pedido inválido dá 400", async () => {
  const s = await subir();
  assert.equal((await ia(s.base, { prompt: "x", tier: "__proto__" }, "ana-1234")).status, 200);
  assert.match(s.chamadas[0].model, /haiku/);
  for (const corpo of [{}, { prompt: "" }, { prompt: 5 }, { prompt: "a".repeat(16_001) }]) assert.equal((await ia(s.base, corpo, "ana-1234")).status, 400);
  s.fechar();
});

await teste("limite por hora de cada código", async () => {
  const s = await subir({ limiteHora: 2 });
  assert.equal((await ia(s.base, { prompt: "a" }, "ana-1234")).status, 200);
  assert.equal((await ia(s.base, { prompt: "a" }, "ana-1234")).status, 200);
  const r = await ia(s.base, { prompt: "a" }, "ana-1234");
  assert.equal(r.status, 429); assert.match((await r.json()).msg, /limite/);
  assert.equal((await ia(s.base, { prompt: "a" }, "beto-5678")).status, 200); // outro código não é afetado
  s.fechar();
});

await teste("limite diário geral", async () => {
  const s = await subir({ limiteDia: 1 });
  assert.equal((await ia(s.base, { prompt: "a" }, "ana-1234")).status, 200);
  const r = await ia(s.base, { prompt: "a" }, "beto-5678");
  assert.equal(r.status, 429); assert.match((await r.json()).msg, /hoje/); s.fechar();
});

await teste("o limite volta depois de uma hora", async () => {
  let t = 1_000_000; const s = await subir({ limiteHora: 1, agora: () => t });
  assert.equal((await ia(s.base, { prompt: "a" }, "ana-1234")).status, 200);
  assert.equal((await ia(s.base, { prompt: "a" }, "ana-1234")).status, 429);
  t += 3_700_000; assert.equal((await ia(s.base, { prompt: "a" }, "ana-1234")).status, 200); s.fechar();
});

await teste("tentativas de código errado são bloqueadas depois de 20", async () => {
  const s = await subir(); let ultimo = 0;
  for (let i = 0; i < 22; i++) { const r = await fetch(s.base + "/api/entrar", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ codigo: "x" + i }) }); ultimo = r.status; }
  assert.equal(ultimo, 429);
  assert.equal((await ia(s.base, { prompt: "a" }, "ana-1234")).status, 429); // vale também para a IA, no mesmo endereço
  s.fechar();
});

await teste("/api/entrar aceita o código certo", async () => {
  const s = await subir(); const r = await fetch(s.base + "/api/entrar", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ codigo: "beto-5678" }) });
  assert.equal(r.status, 200); s.fechar();
});

await teste("falha da IA devolve 502 sem vazar detalhes", async () => {
  const s = await subir({ erro: true }); const r = await ia(s.base, { prompt: "a" }, "ana-1234"); const t = await r.text();
  assert.equal(r.status, 502); assert.ok(!/sk-ant|SEGREDO/.test(t)); s.fechar();
});

await teste("se o modelo principal falhar, usa o rápido e ainda responde", async () => {
  const modelos = [];
  const s = await subir({ chamador: async (p) => { modelos.push(p.model); if (/sonnet/.test(p.model)) throw Object.assign(new Error("modelo indisponível"), { status: 404 }); return { text: '{"receitas":[]}', uso: {} }; } });
  const r = await ia(s.base, { prompt: "a", tier: "complex" }, "ana-1234");
  assert.equal(r.status, 200); assert.equal(modelos.length, 2); assert.match(modelos[1], /haiku/); s.fechar();
});

console.log(`\n${ok} testes do site passaram`);
process.exit(process.exitCode || 0);
