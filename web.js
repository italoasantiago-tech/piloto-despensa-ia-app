// Site do Despensa Fit (fora do Claude): entrega a página e faz a ponte com a IA.
// A chave da Anthropic fica só aqui no servidor; quem usa o site entra com um código de acesso.
import { readFileSync } from "node:fs";
import { createHash, timingSafeEqual } from "node:crypto";
import { fileURLToPath } from "node:url";
import path from "node:path";
import express from "express";
import Anthropic from "@anthropic-ai/sdk";

const PAGINA = path.join(path.dirname(fileURLToPath(import.meta.url)), "public", "index.html");
const MODELO_RAPIDO = process.env.MODEL_FAST || "claude-haiku-5-5";
const MODELO_PRINCIPAL = process.env.MODEL_MAIN || "claude-sonnet-5-5";
const MODELOS = { quick: MODELO_RAPIDO, default: MODELO_RAPIDO, complex: MODELO_PRINCIPAL };
const MAX_TOKENS = { quick: 1500, default: 3000, complex: 4500 };
const MAX_PROMPT = 16_000;
const HORA = 3_600_000;
const DIA = 24 * HORA;

const SISTEMA = `Você é o motor de receitas do app Despensa Fit. Atenda somente pedidos sobre alimentos, despensa, receitas e cozinha, sempre no formato pedido no texto do usuário. Se o pedido for sobre qualquer outro assunto, responda apenas {"erro":"fora_do_escopo"}.`;

const hash = (s) => createHash("sha256").update(s).digest();

export function montarWeb(app, opcoes = {}) {
  const {
    codigos = process.env.CODIGOS_ACESSO,
    limiteHora = Number(process.env.LIMITE_HORA) || 60,
    limiteDia = Number(process.env.LIMITE_DIA) || 800,
    agora = () => Date.now(),
    chamador = null
  } = opcoes;

  const lista = String(codigos || "").split(",").map((c) => c.trim().toLowerCase()).filter(Boolean);
  if (!lista.length) {
    console.warn("Site desativado: defina CODIGOS_ACESSO (ex.: ana-7391,beto-2845).");
    return false;
  }
  if (lista.some((c) => c.length < 6)) console.warn("Atenção: há códigos de acesso com menos de 6 caracteres.");
  const hashes = lista.map(hash);

  // devolve o número do código (0, 1, ...) ou -1; compara sempre todos, em tempo constante
  const acharCodigo = (c) => {
    const h = hash(String(c ?? "").trim().toLowerCase());
    let achou = -1;
    hashes.forEach((x, i) => { if (timingSafeEqual(h, x)) achou = i; });
    return achou;
  };

  // limites de uso, guardados na memória (zeram se o servidor reiniciar)
  const usos = new Map();
  const contar = (chave, janela) => {
    const t = agora();
    const v = (usos.get(chave) || []).filter((x) => t - x < janela);
    usos.set(chave, v);
    return v.length;
  };
  const registrar = (chave) => { const v = usos.get(chave) || []; v.push(agora()); usos.set(chave, v); };
  setInterval(() => { const t = agora(); for (const [k, v] of usos) if (!v.some((x) => t - x < DIA)) usos.delete(k); }, 10 * 60_000).unref();

  let cliente = null;
  const chamarIA = chamador || (async ({ model, system, prompt, maxTokens }) => {
    cliente ??= new Anthropic({ timeout: 90_000, maxRetries: 2 });
    const r = await cliente.messages.create({ model, max_tokens: maxTokens, system, messages: [{ role: "user", content: prompt }] });
    return { text: r.content.filter((b) => b.type === "text").map((b) => b.text).join(""), uso: r.usage };
  });

  let html = readFileSync(PAGINA);
  const cabecalhos = (res) => {
    res.set({
      "Cache-Control": "no-cache",
      "X-Content-Type-Options": "nosniff",
      "Referrer-Policy": "no-referrer",
      "X-Robots-Tag": "noindex, nofollow",
      "Content-Security-Policy": "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; img-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'"
    });
  };
  const pagina = (_req, res) => { cabecalhos(res); res.type("html").send(html); };
  app.get("/", pagina);
  app.get("/index.html", pagina);
  app.get("/saude", (_req, res) => res.type("text/plain").send("ok"));
  app.get("/robots.txt", (_req, res) => res.type("text/plain").send("User-agent: *\nDisallow: /\n"));

  const json = express.json({ limit: "64kb" });
  const MAX_FALHAS = 20; // tentativas de código errado por hora, por endereço

  app.post("/api/entrar", json, (req, res) => {
    const ip = req.ip;
    if (contar("falha:" + ip, HORA) >= MAX_FALHAS) return res.status(429).json({ erro: "limite", msg: "Muitas tentativas. Espere um pouco." });
    if (acharCodigo(req.body?.codigo) < 0) { registrar("falha:" + ip); return res.status(401).json({ erro: "codigo" }); }
    res.json({ ok: true });
  });

  app.post("/api/ia", json, async (req, res) => {
    const ip = req.ip;
    if (contar("falha:" + ip, HORA) >= MAX_FALHAS) return res.status(429).json({ erro: "limite", msg: "Muitas tentativas. Espere um pouco." });
    const idx = acharCodigo(req.get("x-codigo"));
    if (idx < 0) { registrar("falha:" + ip); return res.status(401).json({ erro: "codigo" }); }

    const prompt = req.body?.prompt;
    if (typeof prompt !== "string" || !prompt.trim() || prompt.length > MAX_PROMPT) return res.status(400).json({ erro: "pedido" });
    const tier = Object.hasOwn(MODELOS, req.body?.tier) ? req.body.tier : "default";

    if (contar("dia", DIA) >= limiteDia) return res.status(429).json({ erro: "limite", msg: "O limite de uso de hoje foi atingido. Volte amanhã." });
    if (contar("c:" + idx, HORA) >= limiteHora || contar("i:" + ip, HORA) >= limiteHora * 2)
      return res.status(429).json({ erro: "limite", msg: "Você atingiu o limite de uso por hora. Tente de novo mais tarde." });
    registrar("dia"); registrar("c:" + idx); registrar("i:" + ip);

    const t0 = agora();
    try {
      const r = await chamarIA({ model: MODELOS[tier], system: SISTEMA, prompt, maxTokens: MAX_TOKENS[tier] });
      console.log(`IA ${tier} código#${idx + 1} ${agora() - t0}ms tokens ${r.uso?.input_tokens ?? "?"}/${r.uso?.output_tokens ?? "?"}`);
      res.json({ text: String(r.text ?? "") });
    } catch (e) {
      console.error(`IA ${tier} código#${idx + 1} falhou: HTTP ${e?.status || "?"} ${e?.name || ""}`);
      res.status(502).json({ erro: "ia" });
    }
  });
  return true;
}
