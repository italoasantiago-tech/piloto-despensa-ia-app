// Testes offline: usam uma "IA" e um "WhatsApp" falsos. Rode com: npm test
import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";

process.env.DATA_DIR = await fs.mkdtemp(path.join(os.tmpdir(), "despensa-"));

const store = await import("./store.js");
const ai = await import("./ai.js");
const { tratarMensagem, enfileirar } = await import("./bot.js");
const { assinaturaValida, criarFiltro } = await import("./whatsapp.js");
const { dividir } = await import("./format.js");
const { VERIFICADAS } = await import("./recipes.js");
await store.iniciar();

let ok = 0;
const teste = async (nome, fn) => { await fn(); ok++; console.log("ok -", nome); };

/* IA falsa: responde conforme o tipo de pedido */
const chamadas = [];
const iaFalsa = async ({ model, prompt }) => {
  chamadas.push({ model, prompt });
  if (prompt.includes("MENSAGEM DA PESSOA")) {
    const msg = prompt.split("MENSAGEM DA PESSOA\n")[1].split("\n")[0];
    const base = { adicionar: [], remover: [], limpar: false, mostrar_despensa: false, sugerir: false, refeicao: null, nivel: null, pedido_extra: "", perfil: {}, ajuda: false, resposta: "" };
    if (msg.startsWith("Comprei")) return JSON.stringify({ ...base, adicionar: [{ nome: "ovo", quantidade: "12 un" }, { nome: "banana", quantidade: "" }, { nome: "aveia em flocos", quantidade: "" }] });
    if (msg.startsWith("Acabou")) return JSON.stringify({ ...base, remover: ["banana"] });
    if (msg.startsWith("O que eu faço")) return JSON.stringify({ ...base, sugerir: true, refeicao: "Café da manhã", nivel: "Simples" });
    if (msg.startsWith("Meu peso")) return JSON.stringify({ ...base, perfil: { peso: 124, equip_add: ["Airfryer"], kcal: 99999 } });
    if (msg.startsWith("Mostra")) return JSON.stringify({ ...base, mostrar_despensa: true });
    if (msg.startsWith("Quem ganhou")) return JSON.stringify({ ...base, resposta: "Eu só ajudo com despensa e receitas." });
    return JSON.stringify(base);
  }
  if (prompt.includes("CATÁLOGO (JSON)")) {
    const panqueca = VERIFICADAS.find((r) => r.nome === "Panqueca Proteica");
    return JSON.stringify({ escolhidas: [{ id: panqueca.id, faltando: [], motivo: "Usa ovo, banana e aveia que você tem." }, { id: 9999, faltando: [] }] });
  }
  if (prompt.includes('"receitas"')) {
    return "Aqui está:\n" + JSON.stringify({ receitas: [{ nome: "Omelete simples", nivel: "Simples", tempo_min: 10, porcoes: 1, kcal_por_porcao: 250, proteina_g_por_porcao: 18, carboidrato_g_por_porcao: 3, gordura_g_por_porcao: 18, da_despensa: ["ovo"], faltando: [], ingredientes: ["3 ovos"], passos: ["Bata os ovos.", "Doure na frigideira."], dica: "" }] });
  }
  throw new Error("pedido inesperado");
};
ai.definirChamador(iaFalsa);

const enviadas = [];
const enviar = async (para, texto) => { enviadas.push({ para, texto }); };
const falar = async (texto, id) => { enviadas.length = 0; await tratarMensagem({ de: "5511999990000", id, tipo: "text", texto }, enviar); return enviadas.map((m) => m.texto); };

await teste("primeira mensagem envia a ajuda e adiciona itens", async () => {
  const r = await falar("Comprei ovos, banana e aveia", "m1");
  assert.ok(r[0].includes("Despensa Fit"));
  assert.ok(r.some((t) => t.includes("Adicionei: ovo (12 un), banana, aveia em flocos")));
});

await teste("mensagem repetida (reenvio da Meta) é ignorada", async () => {
  assert.deepEqual(await falar("Comprei ovos, banana e aveia", "m1"), []);
});

await teste("remover item", async () => {
  const r = await falar("Acabou a banana", "m2");
  assert.ok(r[0].includes("Tirei da despensa: banana"));
});

await teste("mostrar despensa", async () => {
  const r = await falar("Mostra minha despensa", "m3");
  assert.ok(r[0].includes("ovo (12 un)") && r[0].includes("aveia em flocos") && !r[0].includes("banana"));
});

await teste("sugerir: verificada + IA, sem ids inventados", async () => {
  await falar("Comprei ovos, banana e aveia", "m4"); // banana de volta
  const r = await falar("O que eu faço no café?", "m5");
  const tudo = r.join("\n---\n");
  assert.ok(tudo.includes("Receitas verificadas"));
  assert.ok(tudo.includes("Panqueca Proteica") && tudo.includes("Dayane Mello"));
  assert.ok(tudo.includes("Sugestões da IA") && tudo.includes("Omelete simples"));
  assert.ok(tudo.includes("estimativas aproximadas"));
  const chamadaIA = chamadas.filter((c) => c.prompt.includes('"receitas"')).at(-1);
  assert.ok(chamadaIA.prompt.includes("Panqueca Proteica"), "a IA deve receber o nome da receita verificada para não repetir");
  assert.ok(chamadaIA.model.includes("sonnet"));
});

await teste("atualizar perfil valida limites", async () => {
  const r = await falar("Meu peso agora é 124 e tenho airfryer", "m6");
  assert.ok(r[0].includes("peso: 124") && r[0].includes("+ Airfryer"));
  assert.ok(!r[0].includes("99999"));
});

await teste("fora do escopo recebe a resposta curta", async () => {
  const r = await falar("Quem ganhou o jogo?", "m7");
  assert.deepEqual(r, ["Eu só ajudo com despensa e receitas."]);
});

await teste("áudio recebe aviso amigável", async () => {
  enviadas.length = 0;
  await tratarMensagem({ de: "5511999990000", id: "m8", tipo: "audio" }, enviar);
  assert.ok(enviadas[0].texto.includes("só entendo mensagens de texto"));
});

await teste("falha da IA vira mensagem amigável, sem derrubar", async () => {
  ai.definirChamador(async () => { throw new Error("sem crédito"); });
  const antes = console.error; console.error = () => {};
  const r = await falar("Comprei arroz", "m9");
  console.error = antes;
  assert.ok(r.at(-1).includes("Tive um problema"));
});

await teste("assinatura da Meta", async () => {
  const corpo = Buffer.from('{"a":1}');
  const bom = "sha256=" + crypto.createHmac("sha256", "segredo").update(corpo).digest("hex");
  assert.equal(assinaturaValida(corpo, bom, "segredo"), true);
  assert.equal(assinaturaValida(corpo, bom, "outro"), false);
  assert.equal(assinaturaValida(corpo, "sha256=abc", "segredo"), false);
  assert.equal(assinaturaValida(corpo, undefined, "segredo"), false);
});

await teste("lista de números permitidos (com e sem o 9)", async () => {
  const f = criarFiltro("+55 (11) 98888-7777, 5521977776666");
  assert.equal(f("5511988887777"), true);
  assert.equal(f("551188887777"), true);
  assert.equal(f("5521977776666"), true);
  assert.equal(f("5521877776666"), false);
  assert.equal(f("5511900000000"), false);
});

await teste("divisão de textos longos", async () => {
  const longo = Array.from({ length: 200 }, (_, i) => "Parágrafo " + i + " " + "x".repeat(60)).join("\n\n");
  const partes = dividir(longo);
  assert.ok(partes.length > 1 && partes.every((p) => p.length <= 3800));
  assert.equal(partes.join("\n\n").replace(/\n\n/g, "\n\n"), longo);
});

await teste("fila trata mensagens da mesma pessoa em ordem", async () => {
  const ordem = [];
  const a = enfileirar("x", async () => { await new Promise((r) => setTimeout(r, 30)); ordem.push(1); });
  const b = enfileirar("x", async () => { ordem.push(2); });
  await Promise.all([a, b]);
  assert.deepEqual(ordem, [1, 2]);
});

await teste("dados das receitas verificadas completos", async () => {
  assert.equal(VERIFICADAS.length, 170);
  assert.equal(new Set(VERIFICADAS.map((r) => r.id)).size, 170);
  assert.equal(VERIFICADAS.filter((r) => r.autora).length, 137);
  for (const r of VERIFICADAS.filter((x) => x.autora)) assert.ok(r.fonte && r.nivel && r.ref.length, r.nome);
  for (const r of VERIFICADAS) assert.ok(r.nome && r.ing.length && r.passos.length && r.ref.length && r.itens.length, r.nome);
});

await teste("cartão de receita de e-book: autora própria, sem selo da nutricionista", async () => {
  const { cartaoVerificada } = await import("./format.js");
  const rec = VERIFICADAS.find((r) => r.nome === "Banana Balls");
  const c = cartaoVerificada(rec, [], "");
  assert.ok(c.includes("Jaana Thoen") && c.includes("85 kcal") && c.includes("10 unidades"));
  assert.ok(!c.includes("30 Receitas Doces FIT"), "o nome do livro não deve aparecer");
  assert.ok(!c.includes("Dayane") && !c.includes("✅"));
  assert.ok(cartaoVerificada(VERIFICADAS[0]).includes("Dayane Mello"));
});

/* Curtir, não curtir e favoritar */
ai.definirChamador(iaFalsa); // volta a IA falsa normal (o teste anterior a deixou falhando de propósito)
const botoesEnviados = [];
const enviarBotoes = async (para, corpo, lista) => { botoesEnviados.push({ para, corpo, lista }); };
const tocar = async (idBotao, idMsg) => { enviadas.length = 0; await tratarMensagem({ de: "5511999990000", id: idMsg, tipo: "interactive", botao: idBotao }, enviar, enviarBotoes); return enviadas.map((m) => m.texto); };

await teste("sugerir envia 3 botões depois de cada receita", async () => {
  botoesEnviados.length = 0;
  enviadas.length = 0;
  await tratarMensagem({ de: "5511999990000", id: "b1", tipo: "text", texto: "O que eu faço no café?" }, enviar, enviarBotoes);
  assert.equal(botoesEnviados.length, 2); // 1 verificada + 1 da IA
  for (const b of botoesEnviados) {
    assert.equal(b.lista.length, 3);
    assert.ok(b.lista.every((x) => x.titulo.length <= 20), "título do botão passa de 20 caracteres");
    assert.ok(b.lista.map((x) => x.id.split("|")[0]).join() === "curtir,nao,fav");
  }
  assert.ok(botoesEnviados[0].lista[0].id.startsWith("curtir|L"));
  assert.ok(botoesEnviados[1].lista[0].id.startsWith("curtir|I:omelete simples"));
});

await teste("curtir, não curtir e favoritar (verificada e IA)", async () => {
  const kPanqueca = botoesEnviados[0].lista[0].id.split("|")[1];
  const kIA = botoesEnviados[1].lista[0].id.split("|")[1];
  assert.deepEqual(await tocar("curtir|" + kPanqueca, "b2"), ["👍 Anotado."]);
  assert.deepEqual(await tocar("nao|" + kPanqueca, "b3"), ["👎 Anotado."]);
  let est = await store.carregar("usuario:5511999990000");
  assert.ok(!est.prefs.curtidas.includes(kPanqueca) && est.prefs.rejeitadas[kPanqueca], "não curtir tira a curtida");
  assert.deepEqual(await tocar("fav|" + kIA, "b4"), ["⭐ Salva nos favoritos."]);
  est = await store.carregar("usuario:5511999990000");
  assert.equal(est.prefs.favoritos[0].r.nome, "Omelete simples");
  assert.deepEqual(await tocar("fav|" + kIA, "b5"), ["Removida dos favoritos."]);
  assert.deepEqual(await tocar("fav|L999999", "b6"), []); // receita que não existe: ignorada
});

await teste("receita rejeitada não entra no catálogo; curtida ganha destaque; IA recebe o gosto", async () => {
  const panqueca = VERIFICADAS.find((r) => r.nome === "Panqueca Proteica");
  const est = await store.carregar("usuario:5511999990000");
  est.prefs.rejeitadas["L" + panqueca.id] = Date.now();
  const outra = VERIFICADAS.find((r) => r.nome === "Panqueca de Banana e Aveia");
  est.prefs.curtidas.push("L" + outra.id, "I:frango assado");
  chamadas.length = 0;
  await ai.escolherVerificadas(est, { refeicao: "Café da manhã", nivel: "Um de cada" });
  const prompt = chamadas.at(-1).prompt;
  assert.ok(!prompt.includes('"nome":"Panqueca Proteica"'), "rejeitada deve sair do catálogo");
  assert.ok(prompt.includes('"nome":"Panqueca de Banana e Aveia"') && /"curtida":true/.test(prompt));
  est.prefs.rejeitadas["I:omelete simples"] = Date.now();
  chamadas.length = 0;
  await ai.gerarIA(est, { refeicao: "Jantar", nivel: "Simples" }, []);
  const p2 = chamadas.at(-1).prompt;
  assert.ok(p2.includes("curtiu estas receitas da IA") && p2.includes("frango assado") && p2.includes("NÃO curtiu") && p2.includes("omelete simples"));
  // depois de 14 dias a rejeitada volta
  est.prefs.rejeitadas["L" + panqueca.id] = Date.now() - 15 * 86400000;
  chamadas.length = 0;
  await ai.escolherVerificadas(est, { refeicao: "Café da manhã", nivel: "Um de cada" });
  assert.ok(chamadas.at(-1).prompt.includes('"nome":"Panqueca Proteica"'));
});

await teste("comando favoritos lista as receitas salvas", async () => {
  const k = "L" + VERIFICADAS.find((r) => r.nome === "Torrada com Ovo").id;
  await tocar("fav|" + k, "b7");
  botoesEnviados.length = 0;
  enviadas.length = 0;
  await tratarMensagem({ de: "5511999990000", id: "b8", tipo: "text", texto: "Favoritos" }, enviar, enviarBotoes);
  const tudo = enviadas.map((m) => m.texto).join("\n");
  assert.ok(tudo.includes("Seus favoritos") && tudo.includes("Torrada com Ovo"));
  assert.ok(botoesEnviados.length >= 1 && botoesEnviados[0].lista[2].titulo === "⭐ Desfavoritar");
});

await teste("botão ainda funciona sem o envio de botões (modo texto)", async () => {
  enviadas.length = 0;
  await tratarMensagem({ de: "5511999990000", id: "b9", tipo: "text", texto: "O que eu faço no café?" }, enviar);
  assert.ok(enviadas.length >= 3);
});

/* Servidor de verdade: verificação do webhook e rejeição de assinatura falsa */
await teste("servidor: verificação, assinatura inválida e número não permitido", async () => {
  const porta = 3999;
  const env = { ...process.env, PORT: String(porta), WHATSAPP_TOKEN: "t", PHONE_NUMBER_ID: "1", VERIFY_TOKEN: "abc", APP_SECRET: "segredo", ANTHROPIC_API_KEY: "k", ALLOWED_NUMBERS: "5511999990000" };
  const filho = spawn("node", ["server.js"], { env, stdio: "pipe" });
  let saida = "";
  filho.stdout.on("data", (d) => (saida += d));
  filho.stderr.on("data", (d) => (saida += d));
  try {
    for (let i = 0; i < 50 && !saida.includes("ouvindo"); i++) await new Promise((r) => setTimeout(r, 100));
    assert.ok(saida.includes("ouvindo"), "servidor não subiu: " + saida);
    const base = `http://127.0.0.1:${porta}`;
    assert.equal(await (await fetch(`${base}/webhook?hub.mode=subscribe&hub.verify_token=abc&hub.challenge=123`)).text(), "123");
    assert.equal((await fetch(`${base}/webhook?hub.mode=subscribe&hub.verify_token=errado&hub.challenge=123`)).status, 403);
    const corpo = JSON.stringify({ entry: [{ changes: [{ value: { messages: [{ from: "5511000000000", id: "z", type: "text", text: { body: "oi" } }] } }] }] });
    const r1 = await fetch(`${base}/webhook`, { method: "POST", headers: { "content-type": "application/json", "x-hub-signature-256": "sha256=falsa" }, body: corpo });
    assert.equal(r1.status, 401);
    const assin = "sha256=" + crypto.createHmac("sha256", "segredo").update(corpo).digest("hex");
    const r2 = await fetch(`${base}/webhook`, { method: "POST", headers: { "content-type": "application/json", "x-hub-signature-256": assin }, body: corpo });
    assert.equal(r2.status, 200);
    await new Promise((r) => setTimeout(r, 200));
    assert.ok(saida.includes("Número não permitido"));
  } finally { filho.kill(); }
});

console.log(`\n${ok} testes passaram.`);
await fs.rm(process.env.DATA_DIR, { recursive: true, force: true });
process.exit(0);
