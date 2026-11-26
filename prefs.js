// Curtir, não curtir e favoritar: preferências da pessoa, guardadas junto com o estado dela.
export const DIAS_REJEITADA = 14;
const norm = (s) => String(s || "").trim().toLowerCase();

export const prefsPadrao = () => ({ curtidas: [], rejeitadas: {}, favoritos: [] });

export function normalizarPrefs(p) {
  const base = prefsPadrao();
  if (!p || typeof p !== "object") return base;
  if (Array.isArray(p.curtidas)) base.curtidas = p.curtidas.filter((k) => typeof k === "string").slice(-500);
  if (p.rejeitadas && typeof p.rejeitadas === "object" && !Array.isArray(p.rejeitadas)) base.rejeitadas = p.rejeitadas;
  if (Array.isArray(p.favoritos)) base.favoritos = p.favoritos.filter((f) => f && typeof f.k === "string").slice(0, 300);
  return base;
}

export const chaveVerificada = (rec) => "L" + rec.id;
export const chaveIA = (r) => "I:" + norm(r.nome).slice(0, 80);

export function rejeitadaAtiva(prefs, k, agora = Date.now()) {
  const t = prefs.rejeitadas[k];
  return !!t && agora - t < DIAS_REJEITADA * 86400000;
}

// Aplica um toque de botão. Devolve a confirmação curta para a pessoa.
export function aplicarAcao(prefs, acao, k, receitaIA = null, agora = Date.now()) {
  if (acao === "curtir") {
    if (prefs.curtidas.includes(k)) { prefs.curtidas = prefs.curtidas.filter((x) => x !== k); return "Tirei a curtida."; }
    prefs.curtidas.push(k);
    delete prefs.rejeitadas[k];
    return "👍 Anotado.";
  }
  if (acao === "nao") {
    if (rejeitadaAtiva(prefs, k, agora)) { delete prefs.rejeitadas[k]; return "Tirei o 👎."; }
    prefs.rejeitadas[k] = agora;
    prefs.curtidas = prefs.curtidas.filter((x) => x !== k);
    return "👎 Anotado.";
  }
  if (acao === "fav") {
    const i = prefs.favoritos.findIndex((f) => f.k === k);
    if (i >= 0) { prefs.favoritos.splice(i, 1); return "Removida dos favoritos."; }
    prefs.favoritos.unshift(receitaIA ? { k, r: receitaIA } : { k });
    if (prefs.favoritos.length > 300) prefs.favoritos.length = 300;
    return "⭐ Salva nos favoritos.";
  }
  return "";
}

// O que a IA precisa saber do gosto da pessoa (só as receitas que ela mesma gerou têm nome guardado).
export function textoPrefsIA(prefs, agora = Date.now()) {
  const nomes = (lista) => lista.filter((k) => k.startsWith("I:")).map((k) => k.slice(2)).slice(-8);
  const gosta = nomes(prefs.curtidas);
  const nao = nomes(Object.keys(prefs.rejeitadas).filter((k) => rejeitadaAtiva(prefs, k, agora)));
  return [
    gosta.length ? `A pessoa curtiu estas receitas da IA (use como inspiração de estilo, sem repetir): ${gosta.join("; ")}.` : "",
    nao.length ? `A pessoa NÃO curtiu estas receitas da IA, não repita nem sugira parecidas: ${nao.join("; ")}.` : ""
  ].filter(Boolean).join("\n");
}
