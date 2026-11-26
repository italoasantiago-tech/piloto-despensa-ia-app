// Servidor web: recebe as mensagens do WhatsApp (webhook) e passa para o bot.
import express from "express";
import * as store from "./store.js";
import { tratarMensagem, enfileirar } from "./bot.js";
import { montarWeb } from "./web.js";
import { assinaturaValida, criarFiltro, enviarTexto, enviarBotoes, marcarComoLida } from "./whatsapp.js";

// Dois modos, que podem funcionar juntos:
//  - site: precisa de CODIGOS_ACESSO (códigos separados por vírgula) e ANTHROPIC_API_KEY
//  - WhatsApp: precisa de todas as variáveis do WhatsApp
if (!process.env.ANTHROPIC_API_KEY) {
  console.error("Falta a variável ANTHROPIC_API_KEY");
  process.exit(1);
}
const varsZap = ["WHATSAPP_TOKEN", "PHONE_NUMBER_ID", "VERIFY_TOKEN", "APP_SECRET", "ALLOWED_NUMBERS"];
const zapPresentes = varsZap.filter((n) => process.env[n]);
const zapAtivo = zapPresentes.length === varsZap.length;
if (zapPresentes.length && !zapAtivo) {
  console.error("WhatsApp configurado pela metade. Faltam: " + varsZap.filter((n) => !process.env[n]).join(", "));
  process.exit(1);
}

const mascarar = (n) => String(n).replace(/\d(?=\d{4})/g, "*");

const app = express();
app.set("trust proxy", 1); // o Railway fica na frente; assim o endereço de quem acessa é o real
app.use(express.json({ verify: (req, _res, buf) => { req.corpoBruto = buf; } }));

const siteAtivo = montarWeb(app);
if (!siteAtivo && !zapAtivo) {
  console.error("Nada para ligar: defina CODIGOS_ACESSO (site) e/ou as variáveis do WhatsApp.");
  process.exit(1);
}
if (!siteAtivo) app.get("/", (_req, res) => res.send("Despensa Fit no ar"));

if (zapAtivo) {
const permitido = criarFiltro(process.env.ALLOWED_NUMBERS);
// A Meta chama este endereço uma vez para confirmar que o servidor é seu.
app.get("/webhook", (req, res) => {
  if (req.query["hub.mode"] === "subscribe" && req.query["hub.verify_token"] === process.env.VERIFY_TOKEN) {
    return res.status(200).send(req.query["hub.challenge"]);
  }
  res.sendStatus(403);
});

app.post("/webhook", (req, res) => {
  if (!assinaturaValida(req.corpoBruto, req.get("x-hub-signature-256"), process.env.APP_SECRET)) {
    console.warn("Requisição com assinatura inválida, ignorada");
    return res.sendStatus(401);
  }
  res.sendStatus(200); // responde logo; a Meta reenvia se demorar
  console.log("Webhook recebido da Meta");

  for (const entrada of req.body?.entry || []) {
    for (const mudanca of entrada.changes || []) {
      for (const st of mudanca.value?.statuses || []) {
        const erros = st.errors?.length ? " | ERRO: " + JSON.stringify(st.errors) : "";
        console.log(`Status da mensagem: ${st.status} | destino ${mascarar(st.recipient_id || "?")} | id ${st.id}${erros}`);
      }
      for (const m of mudanca.value?.messages || []) {
        if (!permitido(m.from)) { console.log("Número não permitido, ignorado:", mascarar(m.from)); continue; }
        console.log(`Mensagem recebida de ${mascarar(m.from)} (tipo ${m.type})`);
        enfileirar(m.from, async () => {
          marcarComoLida(m.id).catch((e) => console.warn("Não consegui marcar como lida:", e.message));
          await tratarMensagem({ de: m.from, id: m.id, tipo: m.type, texto: m.text?.body, botao: m.interactive?.button_reply?.id }, enviarTexto, enviarBotoes);
        }).catch((e) => console.error("Erro na fila:", e));
      }
    }
  }
});

// Ferramenta de diagnóstico: vincula a conta do WhatsApp ao app (necessário para receber mensagens reais)
// e mostra quais apps estão vinculados. Uso: /admin/assinar?chave=SEU_VERIFY_TOKEN
// Precisa da variável WABA_ID (ID da conta do WhatsApp Business).
app.get("/admin/assinar", async (req, res) => {
  if (!process.env.WABA_ID || !req.query.chave || req.query.chave !== process.env.VERIFY_TOKEN) return res.sendStatus(403);
  try {
    const url = `https://graph.facebook.com/v23.0/${encodeURIComponent(process.env.WABA_ID)}/subscribed_apps`;
    const cab = { Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}` };
    const vincular = await fetch(url, { method: "POST", headers: cab });
    const textoVincular = await vincular.text();
    const lista = await fetch(url, { headers: cab });
    const textoLista = await lista.text();
    res.type("text/plain").send(`Vincular: HTTP ${vincular.status}\n${textoVincular}\n\nApps vinculados: HTTP ${lista.status}\n${textoLista}\n`);
  } catch (e) {
    res.status(500).type("text/plain").send("Falha: " + e.message);
  }
});
}

if (zapAtivo) await store.iniciar();
const porta = process.env.PORT || 3000;
app.listen(porta, () => console.log(`Despensa Fit ouvindo na porta ${porta} (site: ${siteAtivo ? "ligado" : "desligado"}, WhatsApp: ${zapAtivo ? "ligado" : "desligado"})`));
