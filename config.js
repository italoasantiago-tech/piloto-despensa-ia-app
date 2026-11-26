// Constantes e perfil padrão do Despensa Fit.

export const REFEICOES = ["Café da manhã", "Almoço", "Lanche", "Jantar", "Ceia", "Marmita (lote)"];
export const NIVEIS = ["Simples", "Médio", "Complexo", "Um de cada"];
export const EQUIP = ["Fogão", "Airfryer", "Micro-ondas", "Forno", "Panela de pressão", "Liquidificador"];
export const OBJETIVOS = ["Emagrecer", "Ganhar massa muscular", "Definir o corpo", "Manter o peso", "Comer mais saudável"];

export const defaultState = () => ({
  perfil: {
    sexo: "Homem",
    idade: 30,
    altura: 189,
    peso: 126,
    objetivos: ["Emagrecer", "Ganhar massa muscular", "Definir o corpo"],
    restr: "Nenhuma",
    nao: "",
    kcal: 2100,
    prot: "",
    equip: ["Fogão"]
  },
  despensa: [],          // [{nome, qtd}]
  pedido: { nivel: "Um de cada" },
  prefs: { curtidas: [], rejeitadas: {}, favoritos: [] }, // curtir, não curtir e favoritar
  recentesIA: {},        // receitas da IA enviadas há pouco (para poder favoritar)
  historico: [],         // últimas trocas, para entender "e outra?", "mais simples"
  vistos: []             // ids de mensagens já tratadas (a Meta pode reenviar)
});

export function perfilTexto(p) {
  return [
    `${p.sexo}, ${p.idade} anos, ${p.altura} cm, ${p.peso} kg.`,
    `Objetivos: ${p.objetivos.length ? p.objetivos.join(", ") : "não informado"}.`,
    `Restrições: ${p.restr || "nenhuma"}.`,
    p.nao ? `Não gosta de: ${p.nao}.` : "",
    `Equipamentos: ${p.equip.length ? p.equip.join(", ") : "só o básico"}.`,
    p.kcal ? `Meta diária de calorias (definida por nutricionista): ${p.kcal} kcal.` : "Sem meta calórica definida.",
    p.prot ? `Meta diária de proteína (definida por nutricionista): ${p.prot} g.` : "Sem meta de proteína definida."
  ].filter(Boolean).join("\n");
}

// Refeição provável conforme o horário em São Paulo.
export function refeicaoPorHorario(data = new Date()) {
  const hora = Number(new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", hour12: false, timeZone: "America/Sao_Paulo" }).format(data)) % 24;
  if (hora < 5) return "Ceia";
  if (hora < 10) return "Café da manhã";
  if (hora < 15) return "Almoço";
  if (hora < 18) return "Lanche";
  if (hora < 22) return "Jantar";
  return "Ceia";
}

export const AJUDA = `Oi! Eu sou o *Despensa Fit* 🥗
Me diga o que você tem em casa e eu sugiro refeições práticas, com receitas verificadas pela nutricionista Dayane Mello e sugestões da IA.

*Exemplos do que você pode escrever:*
• _Comprei ovo, frango, batata-doce, brócolis e iogurte_
• _O que eu faço pro almoço?_
• _Jantar rápido e simples com o que tenho_
• _Acabou o frango_
• _Mostra minha despensa_
• _Agora tenho airfryer_
• _Meu peso agora é 124 kg_
• _Limpar despensa_
• _Favoritos_

Por enquanto eu só entendo *texto*. Áudio e foto chegam nas próximas versões.`;
