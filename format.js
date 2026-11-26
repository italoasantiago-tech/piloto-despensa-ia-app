// Formata receitas e listas para o WhatsApp (*negrito*, _itálico_).
import { AUTORA } from "./recipes.js";

const LIMITE = 3800; // o WhatsApp aceita até 4096 caracteres por mensagem

export function dividir(texto, limite = LIMITE) {
  const partes = [];
  let atual = "";
  for (const bloco of String(texto).split("\n\n")) {
    if ((atual + "\n\n" + bloco).length > limite && atual) {
      partes.push(atual);
      atual = bloco;
    } else {
      atual = atual ? atual + "\n\n" + bloco : bloco;
    }
    while (atual.length > limite) {
      partes.push(atual.slice(0, limite));
      atual = atual.slice(limite);
    }
  }
  if (atual) partes.push(atual);
  return partes;
}

const lista = (itens) => itens.map((i) => `• ${i}`).join("\n");
const passos = (itens) => itens.map((p, i) => `${i + 1}. ${p}`).join("\n");

const vir = (n) => String(n).replace(".", ",");

export function baseDaPorcao(porcao = "") {
  return /unid|\bund/i.test(porcao) ? "unidade" : /fatia/i.test(porcao) ? "fatia" : "porção";
}

// Mesma estrutura em todos os cartões: título com ícone, tags (nível, tempo, rende), nutrição (só o que existir) e a origem.
function tags({ nivel, tempo, rende }) {
  return [nivel ? `👨‍🍳 ${String(nivel).toLowerCase()}` : "", tempo ? `⏱️ ${tempo} min` : "", rende ? `🍽️ ${rende}` : ""].filter(Boolean).join("  ·  ");
}

function nutricao({ kcal, prot, carb, gord }, rotulo, aprox = false) {
  if (!kcal) return "";
  const a = aprox ? "~" : "";
  const partes = [`🔥 ${a}${vir(kcal)} kcal`];
  if (prot != null && prot !== "") partes.push(`💪 ${a}${vir(prot)} g proteína`);
  if (carb != null && carb !== "") partes.push(`🌾 ${a}${vir(carb)} g carboidrato`);
  if (gord != null && gord !== "") partes.push(`💧 ${a}${vir(gord)} g gordura`);
  return partes.join("  ·  ");
}

export function cartaoVerificada(rec, falta = [], motivo = "") {
  falta = falta.filter(Boolean);
  const livro = !!rec.autora;
  return [
    `${livro ? "📖" : "✅"} *${rec.nome}*`,
    tags({ nivel: rec.nivel, tempo: rec.tempo_min, rende: rec.porcao }),
    nutricao({ kcal: rec.kcal, prot: rec.prot, carb: rec.carb, gord: rec.gord }, `valores por ${baseDaPorcao(rec.porcao)}, conforme a fonte`),
    falta.length ? `⚠️ *Falta:* ${falta.join(", ")}` : "",
    `*Ingredientes*\n${lista(rec.ing)}`,
    `*Modo de preparo*\n${passos(rec.passos)}`,
    rec.dica ? `💡 ${rec.dica}` : "",
    livro ? `_E-book de ${rec.autora}, não validada pela nutricionista_` : `_Receita verificada · ${AUTORA}_`
  ].filter(Boolean).join("\n\n");
}

export function cartaoIA(r) {
  const falta = Array.isArray(r.faltando) ? r.faltando.filter(Boolean) : [];
  const tem = Array.isArray(r.da_despensa) ? r.da_despensa.filter(Boolean) : [];
  return [
    `🤖 *${r.nome || "Receita"}*`,
    tags({ nivel: r.nivel, tempo: r.tempo_min, rende: r.porcoes ? `${r.porcoes} ${r.porcoes == 1 ? "porção" : "porções"}` : "" }),
    nutricao({ kcal: r.kcal_por_porcao, prot: r.proteina_g_por_porcao, carb: r.carboidrato_g_por_porcao, gord: r.gordura_g_por_porcao }, "valores por porção, aproximados", true),
    falta.length ? `⚠️ *Falta:* ${falta.join(", ")}` : "",
    Array.isArray(r.ingredientes) && r.ingredientes.length ? `*Ingredientes*\n${lista(r.ingredientes)}` : "",
    Array.isArray(r.passos) && r.passos.length ? `*Modo de preparo*\n${passos(r.passos)}` : "",
    r.dica ? `💡 ${r.dica}` : "",
    "_Sugestão da IA, ainda não validada_"
  ].filter(Boolean).join("\n\n");
}

export function textoDespensa(despensa) {
  if (!despensa.length) return "Sua despensa está vazia. Me diga o que você tem em casa.";
  const itens = despensa.map((i) => (i.qtd ? `${i.nome} (${i.qtd})` : i.nome));
  return `🧺 *Sua despensa* (${despensa.length})\n${lista(itens)}`;
}
