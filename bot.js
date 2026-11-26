// A lógica da conversa: entende a mensagem, atualiza a despensa e responde.
import * as store from "./store.js";
import { defaultState, EQUIP, OBJETIVOS, AJUDA, refeicaoPorHorario } from "./config.js";
import { interpretar, escolherVerificadas, gerarIA } from "./ai.js";
import { VERIFICADAS } from "./recipes.js";
import { cartaoVerificada, cartaoIA, textoDespensa } from "./format.js";
import { normalizarPrefs, chaveVerificada, chaveIA, aplicarAcao } from "./prefs.js";

const filas = new Map();
const contagemDia = new Map(); // limite simples de mensagens por dia, para controlar custo
const LIMITE_DIA = Number(process.env.MAX_MSGS_PER_DAY || 150);

// Mensagens da mesma pessoa são tratadas uma de cada vez.
export function enfileirar(usuario, tarefa) {
  const anterior = filas.get(usuario) || Promise.resolve();
  const proxima = anterior.catch(() => {}).then(tarefa);
  filas.set(usuario, proxima);
  proxima.finally(() => { if (filas.get(usuario) === proxima) filas.delete(usuario); }).catch(() => {});
  return proxima;
}

const norm = (s) => String(s || "").trim().toLowerCase();

function mesclar(despensa, item) {
  const existente = despensa.find((x) => norm(x.nome) === norm(item.nome));
  if (existente) { if (item.qtd) existente.qtd = item.qtd; }
  else despensa.push({ nome: item.nome, qtd: item.qtd || "" });
}
function remover(despensa, nome) {
  const alvo = norm(nome);
  const antes = despensa.length;
  const resto = despensa.filter((x) => !(norm(x.nome) === alvo || norm(x.nome).includes(alvo) || alvo.includes(norm(x.nome))));
  despensa.length = 0;
  despensa.push(...resto);
  return antes - resto.length;
}

function aplicarPerfil(perfil, mudancas) {
  const feitas = [];
  const num = (v) => { const n = Number(v); return Number.isFinite(n) && n > 0 ? n : null; };
  for (const [campo, faixa] of [["idade", [14, 99]], ["altura", [120, 230]], ["peso", [30, 300]], ["kcal", [800, 6000]], ["prot", [20, 400]]]) {
    const n = num(mudancas[campo]);
    if (n !== null && n >= faixa[0] && n <= faixa[1]) { perfil[campo] = n; feitas.push(`${campo}: ${n}`); }
  }
  for (const campo of ["restr", "nao"]) {
    if (typeof mudancas[campo] === "string") { perfil[campo] = mudancas[campo].slice(0, 120); feitas.push(`${campo}: ${perfil[campo] || "(vazio)"}`); }
  }
  if (Array.isArray(mudancas.objetivos)) {
    const o = mudancas.objetivos.filter((x) => OBJETIVOS.includes(x));
    if (o.length) { perfil.objetivos = o; feitas.push(`objetivos: ${o.join(", ")}`); }
  }
  const ativos = new Set(perfil.equip);
  for (const e of Array.isArray(mudancas.equip_add) ? mudancas.equip_add : []) if (EQUIP.includes(e)) { ativos.add(e); feitas.push(`+ ${e}`); }
  for (const e of Array.isArray(mudancas.equip_remove) ? mudancas.equip_remove : []) if (EQUIP.includes(e)) { ativos.delete(e); feitas.push(`- ${e}`); }
  perfil.equip = EQUIP.filter((e) => ativos.has(e));
  return feitas;
}

// Botões de curtir, não curtir e favoritar logo depois de cada receita.
async function botoesDaReceita(estado, de, nome, k, botoes) {
  if (!botoes) return;
  const curtida = estado.prefs.curtidas.includes(k);
  const fav = estado.prefs.favoritos.some((f) => f.k === k);
  await botoes(de, `*${nome}*`, [
    { id: "curtir|" + k, titulo: curtida ? "👍 Curtida" : "👍 Curtir" },
    { id: "nao|" + k, titulo: "👎 Não curtir" },
    { id: "fav|" + k, titulo: fav ? "⭐ Desfavoritar" : "⭐ Favoritar" }
  ]);
}

function guardarIA(estado, r) {
  const k = chaveIA(r);
  const copia = { nome: r.nome, nivel: r.nivel, tempo_min: r.tempo_min, porcoes: r.porcoes, kcal_por_porcao: r.kcal_por_porcao,
    proteina_g_por_porcao: r.proteina_g_por_porcao, carboidrato_g_por_porcao: r.carboidrato_g_por_porcao, gordura_g_por_porcao: r.gordura_g_por_porcao,
    faltando: r.faltando, ingredientes: r.ingredientes, passos: r.passos, dica: r.dica };
  const outros = Object.entries(estado.recentesIA || {}).filter(([x]) => x !== k).slice(-14);
  estado.recentesIA = Object.fromEntries([...outros, [k, copia]]);
  return k;
}

async function tratarBotao(estado, de, botao, enviar) {
  const [acao, ...resto] = String(botao).split("|");
  const k = resto.join("|");
  if (!["curtir", "nao", "fav"].includes(acao) || !k) return;
  let receitaIA = null;
  if (k.startsWith("I:")) {
    receitaIA = (estado.recentesIA || {})[k] || estado.prefs.favoritos.find((f) => f.k === k)?.r || null;
    if (!receitaIA && acao === "fav") { await enviar(de, "Essa receita já saiu da minha memória. Peça uma nova sugestão e favorite de novo."); return; }
  } else if (!VERIFICADAS.some((r) => chaveVerificada(r) === k)) return;
  const msg = aplicarAcao(estado.prefs, acao, k, receitaIA);
  if (msg) await enviar(de, msg);
}

async function mostrarFavoritos(estado, de, enviar, botoes) {
  const fs = estado.prefs.favoritos;
  if (!fs.length) { await enviar(de, "Você ainda não favoritou nenhuma receita."); return; }
  await enviar(de, `⭐ *Seus favoritos* (${fs.length})`);
  for (const f of fs.slice(0, 6)) {
    if (f.r) { await enviar(de, cartaoIA(f.r)); await botoesDaReceita(estado, de, f.r.nome, f.k, botoes); continue; }
    const rec = VERIFICADAS.find((r) => chaveVerificada(r) === f.k);
    if (rec) { await enviar(de, cartaoVerificada(rec)); await botoesDaReceita(estado, de, rec.nome, f.k, botoes); }
  }
  if (fs.length > 6) await enviar(de, `…e mais ${fs.length - 6}.`);
}

async function sugerir(estado, plano, de, enviar, botoes) {
  const pedido = {
    refeicao: plano.refeicao || refeicaoPorHorario(),
    nivel: plano.nivel || estado.pedido.nivel || "Um de cada",
    extra: plano.extra
  };
  estado.pedido.nivel = pedido.nivel;
  const nivelTxt = pedido.nivel === "Um de cada" ? "um de cada nível" : `nível ${pedido.nivel.toLowerCase()}`;
  await enviar(de, `Vou montar opções de *${pedido.refeicao.toLowerCase()}* (${nivelTxt}) com o que você tem. Um instante ⏳`);

  let verificadas = [];
  try { verificadas = await escolherVerificadas(estado, pedido); }
  catch (e) { console.error("Falha ao escolher receitas verificadas:", e.message); }

  const daNutri = verificadas.filter((v) => !v.rec.autora);
  const doLivro = verificadas.filter((v) => v.rec.autora);
  if (daNutri.length) {
    await enviar(de, "✅ *Receitas verificadas* pela nutricionista Dayane Mello");
    for (const v of daNutri) { await enviar(de, cartaoVerificada(v.rec, v.falta, v.motivo)); await botoesDaReceita(estado, de, v.rec.nome, chaveVerificada(v.rec), botoes); }
  }
  if (doLivro.length) {
    await enviar(de, "📖 *Receitas dos seus e-books*");
    for (const v of doLivro) { await enviar(de, cartaoVerificada(v.rec, v.falta, v.motivo)); await botoesDaReceita(estado, de, v.rec.nome, chaveVerificada(v.rec), botoes); }
  }
  if (!verificadas.length) {
    await enviar(de, "Nenhuma receita verificada combinou com o que você tem e com o pedido desta vez.");
  }

  try {
    const ia = await gerarIA(estado, pedido, verificadas.map((v) => v.rec.nome));
    await enviar(de, "🤖 *Sugestões da IA*");
    for (const r of ia) { await enviar(de, cartaoIA(r)); await botoesDaReceita(estado, de, r.nome || "Receita", guardarIA(estado, r), botoes); }
  } catch (e) {
    console.error("Falha ao gerar sugestões da IA:", e.message);
    await enviar(de, "Não consegui gerar as sugestões extras agora. Tente de novo em instantes.");
  }
  await enviar(de, "_Calorias e macros das sugestões da IA são estimativas aproximadas. Não substitui nutricionista ou médico._");
  return `Enviei opções de ${pedido.refeicao.toLowerCase()} (${nivelTxt}).`;
}

export async function tratarMensagem({ de, id, tipo, texto, botao }, enviar, botoes = null) {
  const chave = "usuario:" + de;
  const padrao = defaultState();
  const salvo = (await store.carregar(chave)) || null;
  const estado = salvo
    ? { ...padrao, ...salvo, perfil: { ...padrao.perfil, ...salvo.perfil }, pedido: { ...padrao.pedido, ...salvo.pedido }, prefs: normalizarPrefs(salvo.prefs), recentesIA: salvo.recentesIA || {} }
    : padrao;

  if (id && estado.vistos.includes(id)) return; // reenvio da Meta
  if (id) estado.vistos = [...estado.vistos.slice(-49), id];

  const hoje = new Date().toISOString().slice(0, 10);
  const usadas = (contagemDia.get(de + hoje) || 0) + 1;
  contagemDia.set(de + hoje, usadas);
  if (usadas > LIMITE_DIA) { await enviar(de, "Chegamos ao limite de mensagens de hoje. Amanhã eu volto 🙂"); return; }

  const primeira = estado.historico.length === 0 && !salvo;
  try {
    if (primeira) await enviar(de, AJUDA);

    if (botao) {
      await tratarBotao(estado, de, botao, enviar);
      await store.salvar(chave, estado);
      return;
    }

    if (tipo === "text" && /^\s*(meus\s+)?favoritos\s*[.!]?\s*$/i.test(texto || "")) {
      await mostrarFavoritos(estado, de, enviar, botoes);
      await store.salvar(chave, estado);
      return;
    }

    if (tipo !== "text" || !texto) {
      await enviar(de, "Por enquanto eu só entendo mensagens de texto. Pode escrever o que você tem ou o que quer comer? 🙂");
      await store.salvar(chave, estado);
      return;
    }

    const plano = await interpretar(texto, estado, refeicaoPorHorario());
    const resumo = [];
    let fezAlgo = false;

    const mudancasPerfil = aplicarPerfil(estado.perfil, plano.perfil);
    if (mudancasPerfil.length) { await enviar(de, `👤 Perfil atualizado: ${mudancasPerfil.join(" · ")}`); fezAlgo = true; resumo.push("atualizei o perfil"); }

    if (plano.limpar) {
      estado.despensa = [];
      await enviar(de, "🧹 Despensa limpa.");
      fezAlgo = true; resumo.push("limpei a despensa");
    }
    if (plano.adicionar.length) {
      for (const it of plano.adicionar) mesclar(estado.despensa, it);
      await enviar(de, `✅ Adicionei: ${plano.adicionar.map((i) => (i.qtd ? `${i.nome} (${i.qtd})` : i.nome)).join(", ")}`);
      fezAlgo = true; resumo.push("adicionei " + plano.adicionar.map((i) => i.nome).join(", "));
    }
    if (plano.remover.length) {
      const tirados = plano.remover.filter((n) => remover(estado.despensa, n) > 0);
      if (tirados.length) { await enviar(de, `🗑️ Tirei da despensa: ${tirados.join(", ")}`); resumo.push("tirei " + tirados.join(", ")); }
      else await enviar(de, "Não achei esse item na sua despensa.");
      fezAlgo = true;
    }
    if (plano.mostrar) { await enviar(de, textoDespensa(estado.despensa)); fezAlgo = true; resumo.push("mostrei a despensa"); }
    if (plano.ajuda) { await enviar(de, AJUDA); fezAlgo = true; }
    if (plano.resposta) { await enviar(de, plano.resposta); fezAlgo = true; resumo.push(plano.resposta); }

    if (plano.sugerir) {
      fezAlgo = true;
      if (!estado.despensa.length) await enviar(de, "Sua despensa está vazia. Me diga o que você tem em casa e eu sugiro as refeições.");
      else resumo.push(await sugerir(estado, plano, de, enviar, botoes));
    }

    if (!fezAlgo) await enviar(de, "Não entendi bem. Você pode me dizer o que tem em casa ou pedir uma refeição, por exemplo: _O que eu faço pro jantar?_ Se precisar, escreva *ajuda*.");

    estado.historico = [...estado.historico, { r: "u", t: texto.slice(0, 200) }, { r: "a", t: (resumo.join("; ") || "pedi mais detalhes").slice(0, 200) }].slice(-8);
    await store.salvar(chave, estado);
  } catch (e) {
    console.error("Erro ao tratar mensagem:", e);
    try { await store.salvar(chave, estado); } catch {}
    await enviar(de, "Tive um problema agora e não consegui responder. Tente de novo em instantes.");
  }
}
