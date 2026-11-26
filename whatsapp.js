// Conversa com a API do WhatsApp (Meta).
import crypto from "node:crypto";
import { dividir } from "./format.js";

const GRAPH = "https://graph.facebook.com/v23.0";

// Confirma que a mensagem veio mesmo da Meta (assinatura com o segredo do app).
export function assinaturaValida(corpoBruto, cabecalho, segredo) {
  if (!corpoBruto || !cabecalho || !cabecalho.startsWith("sha256=")) return false;
  const esperado = crypto.createHmac("sha256", segredo).update(corpoBruto).digest("hex");
  const recebido = cabecalho.slice("sha256=".length);
  const a = Buffer.from(esperado);
  const b = Buffer.from(recebido);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

// Números permitidos, só dígitos. Para o Brasil, aceita com e sem o 9 depois do DDD.
function variantes(numero) {
  const n = String(numero).replace(/\D/g, "");
  const v = new Set([n]);
  if (n.startsWith("55") && n.length === 13 && n[4] === "9") v.add(n.slice(0, 4) + n.slice(5));
  if (n.startsWith("55") && n.length === 12) v.add(n.slice(0, 4) + "9" + n.slice(4));
  return v;
}
export function criarFiltro(listaTexto) {
  const permitidos = new Set();
  for (const item of String(listaTexto || "").split(",")) {
    if (item.trim()) for (const v of variantes(item)) permitidos.add(v);
  }
  return (numero) => [...variantes(numero)].some((v) => permitidos.has(v));
}

async function postar(payload) {
  const r = await fetch(`${GRAPH}/${process.env.PHONE_NUMBER_ID}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ messaging_product: "whatsapp", ...payload })
  });
  if (!r.ok) {
    const corpo = await r.text();
    console.error(`WhatsApp RECUSOU o envio (HTTP ${r.status}): ${corpo}`);
    throw new Error(`WhatsApp respondeu ${r.status}: ${corpo}`);
  }
  if (!payload.status) {
    let detalhe = "";
    try {
      const j = await r.json();
      const dest = String(j.contacts?.[0]?.wa_id || payload.to || "").replace(/\d(?=\d{4})/g, "*");
      detalhe = ` | destino ${dest} | id ${j.messages?.[0]?.id || "?"} | estado ${j.messages?.[0]?.message_status || "?"}`;
    } catch {}
    console.log("Resposta aceita pela Meta (HTTP " + r.status + ")" + detalhe);
  }
}

export async function enviarTexto(para, texto) {
  for (const parte of dividir(texto)) {
    await postar({ to: para, type: "text", text: { body: parte, preview_url: false } });
  }
}

// Botões de resposta rápida (até 3, título de até 20 caracteres).
export async function enviarBotoes(para, corpo, botoes) {
  await postar({
    to: para,
    type: "interactive",
    interactive: {
      type: "button",
      body: { text: String(corpo).slice(0, 1000) },
      action: { buttons: botoes.slice(0, 3).map((b) => ({ type: "reply", reply: { id: String(b.id).slice(0, 256), title: String(b.titulo).slice(0, 20) } })) }
    }
  });
}

export async function marcarComoLida(idMensagem) {
  await postar({ status: "read", message_id: idMensagem });
}
