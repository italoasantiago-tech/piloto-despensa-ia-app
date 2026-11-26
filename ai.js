// Todas as chamadas à IA ficam aqui.
import Anthropic from "@anthropic-ai/sdk";
import { REFEICOES, NIVEIS, EQUIP, OBJETIVOS, perfilTexto } from "./config.js";
import { VERIFICADAS, ESTILO_NUTRI, SUBSTITUICOES } from "./recipes.js";
import { rejeitadaAtiva, textoPrefsIA } from "./prefs.js";

const MODELO_PRINCIPAL = process.env.MODEL_MAIN || "claude-sonnet-5-5";
const MODELO_RAPIDO = process.env.MODEL_FAST || "claude-haiku-5-5";

let cliente = null;
let chamador = async ({ model, system, prompt, maxTokens }) => {
  cliente ??= new Anthropic({ timeout: 90_000, maxRetries: 2 }); // lê ANTHROPIC_API_KEY do ambiente
  const r = await cliente.messages.create({
    model,
    max_tokens: maxTokens,
    system,
    messages: [{ role: "user", content: prompt }]
  });
  return r.content.filter((b) => b.type === "text").map((b) => b.text).join("");
};
export function definirChamador(fn) { chamador = fn; } // usado nos testes

function lerJSON(texto) {
  const a = texto.indexOf("{");
  const b = texto.lastIndexOf("}");
  if (a < 0 || b < a) throw new Error("A IA não devolveu JSON");
  return JSON.parse(texto.slice(a, b + 1));
}
async function perguntar(opcoes) {
  try {
    return lerJSON(await chamador(opcoes));
  } catch {
    // uma segunda tentativa, reforçando o formato
    return lerJSON(await chamador({ ...opcoes, prompt: opcoes.prompt + "\n\nIMPORTANTE: responda somente com JSON válido, sem texto antes ou depois." }));
  }
}

const SISTEMA = `Você é o cérebro do "Despensa Fit", um assistente de WhatsApp para uma pessoa que treina e quer comer bem com pouco tempo. Seu escopo é só: registrar o que a pessoa tem em casa (despensa), sugerir receitas e refeições com o que ela tem, e ajustar o perfil dela. Você não é médico nem nutricionista e não faz recomendações médicas. Escreva sempre em português do Brasil.`;

const limpa = (s, max = 60) => String(s ?? "").replace(/[\r\n]+/g, " ").trim().slice(0, max);
const despensaTexto = (d) => d.map((i) => (i.qtd ? `${limpa(i.nome)} (${limpa(i.qtd, 20)})` : limpa(i.nome))).join("; ");

/* 1. Entender o que a pessoa escreveu */
export async function interpretar(texto, estado, refeicaoPadrao) {
  const historico = estado.historico.slice(-6).map((h) => `${h.r === "u" ? "Pessoa" : "Assistente"}: ${h.t}`).join("\n");
  const prompt =
`MENSAGEM DA PESSOA
${limpa(texto, 800)}

CONTEXTO
Refeição provável pelo horário agora: ${refeicaoPadrao}.
Despensa atual: ${estado.despensa.length ? despensaTexto(estado.despensa) : "(vazia)"}.
Perfil: ${perfilTexto(estado.perfil).replace(/\n/g, " ")}
Conversa recente:
${historico || "(início)"}

TAREFA
Descubra o que a pessoa quer e preencha o JSON abaixo.
- "adicionar": alimentos e bebidas que a pessoa disse que TEM ou comprou. Nome simples e no singular quando fizer sentido (ex.: "ovo", "peito de frango", "batata-doce"). "quantidade" só se ela disse (ex.: "uma dúzia" vira "12 un"); senão "".
- "remover": alimentos que acabaram ou que ela disse que não tem mais.
- "limpar": true só se ela pedir para zerar a despensa inteira.
- "mostrar_despensa": true se pedir para ver ou listar o que tem.
- "sugerir": true se ela pede receita, ideia, o que comer, cardápio, ou refere-se à sugestão anterior ("outra", "mais simples", "com ovo"). Se só listou o que tem, sem pedir nada, é false.
- "refeicao": uma de ${JSON.stringify(REFEICOES)}, só se ela mencionou; senão null.
- "nivel": uma de ${JSON.stringify(NIVEIS)}. "rápido", "fácil", "simples" = "Simples"; "caprichado", "elaborado" = "Complexo"; só se ela indicou; senão null.
- "pedido_extra": preferência específica ("com ovo", "sem forno", "mais proteína"), senão "".
- "perfil": só se ela informou mudança nos próprios dados. Campos possíveis: "idade", "altura" (cm), "peso" (kg), "kcal", "prot" (g), "restr" (texto), "nao" (o que não gosta, texto), "objetivos" (lista entre ${JSON.stringify(OBJETIVOS)}), "equip_add" e "equip_remove" (listas entre ${JSON.stringify(EQUIP)}). Senão {}.
- "ajuda": true se pedir ajuda ou perguntar o que você faz.
- "resposta": no máximo 2 frases, só para conversa simples, para recusar com gentileza o que está fora do escopo (e lembrar o que você faz), ou para avisar algo importante. Senão "".
- Se ela quiser registrar o que COMEU ou contar calorias do dia, isso ainda não existe: explique em "resposta" que chega em breve e deixe as ações vazias.
- Nunca dê conselho médico.

Responda SOMENTE com JSON neste formato:
{"adicionar":[{"nome":"","quantidade":""}],"remover":[""],"limpar":false,"mostrar_despensa":false,"sugerir":false,"refeicao":null,"nivel":null,"pedido_extra":"","perfil":{},"ajuda":false,"resposta":""}`;

  const r = await perguntar({ model: MODELO_RAPIDO, system: SISTEMA, prompt, maxTokens: 900 });
  const lista = (x) => (Array.isArray(x) ? x : []);
  return {
    adicionar: lista(r.adicionar).map((i) => ({ nome: limpa(i?.nome), qtd: limpa(i?.quantidade, 20) })).filter((i) => i.nome).slice(0, 60),
    remover: lista(r.remover).map((x) => limpa(x)).filter(Boolean).slice(0, 60),
    limpar: r.limpar === true,
    mostrar: r.mostrar_despensa === true,
    sugerir: r.sugerir === true,
    refeicao: REFEICOES.includes(r.refeicao) ? r.refeicao : null,
    nivel: NIVEIS.includes(r.nivel) ? r.nivel : null,
    extra: limpa(r.pedido_extra, 120),
    perfil: r.perfil && typeof r.perfil === "object" ? r.perfil : {},
    ajuda: r.ajuda === true,
    resposta: limpa(r.resposta, 400)
  };
}

/* 2. Escolher, entre as receitas validadas, as que a despensa permite */
export async function escolherVerificadas(estado, pedido) {
  const catalogo = VERIFICADAS
    .filter((r) => r.ref.includes(pedido.refeicao) && (pedido.nivel === "Um de cada" || r.nivel === pedido.nivel) && !rejeitadaAtiva(estado.prefs, "L" + r.id))
    .map((r) => ({ id: r.id, nome: r.nome, nivel: r.nivel, origem: r.autora ? "e-book" : "nutricionista", ...(estado.prefs.curtidas.includes("L" + r.id) ? { curtida: true } : {}), itens: r.itens, ...(r.equip && r.equip.length ? { equip: r.equip } : {}) }));
  if (!catalogo.length) return [];
  const p = estado.perfil;
  const prompt =
`Você escolhe receitas de uma biblioteca de receitas prontas (da nutricionista e de um e-book de receitas doces), para quem tem estes alimentos em casa.

DESPENSA
${despensaTexto(estado.despensa)}

PREFERÊNCIAS
Restrições: ${p.restr || "nenhuma"}. Não gosta de: ${p.nao || "nada informado"}.
Equipamentos: ${p.equip.length ? p.equip.join(", ") : "só o básico"}.
Refeição pedida: ${pedido.refeicao}. Nível pedido: ${pedido.nivel}.${pedido.extra ? "\nPedido específico: " + pedido.extra : ""}

${SUBSTITUICOES}

CATÁLOGO (JSON)
${JSON.stringify(catalogo)}

REGRAS
- Escolha no máximo 3 receitas do catálogo que a pessoa consegue fazer agora. Receitas com \"curtida\":true são do gosto da pessoa: prefira-as quando servirem. Se alguma receita com origem \"nutricionista\" servir, inclua pelo menos uma; complete com as de \"e-book\". Varie os tipos de receita.
- Considere "feita agora" quando todos os "itens" estão na despensa ou falta no máximo 1 item. Aceite equivalências razoáveis (ex.: "frango" serve para "frango desfiado"; "queijo branco" serve para "queijo minas"). Ignore sal, pimenta, orégano, azeite, óleo, alho e cebola.
- Descarte receitas com algo que a pessoa não come ou não gosta, ou que exijam equipamento que ela não tem (ex.: forno, micro-ondas, liquidificador, processador). Quando o catálogo trouxer \"equip\", é o equipamento necessário (geladeira e freezer podem ser considerados disponíveis).
- Se o nível for "Um de cada", varie os níveis quando possível. Prefira receitas que usem mais itens que a pessoa já tem.
- Se nenhuma servir, devolva lista vazia. Não invente ids.
Responda SOMENTE com JSON: {"escolhidas":[{"id":0,"faltando":["..."],"motivo":"frase curta explicando por que combina com a despensa"}]}`;
  const r = await perguntar({ model: MODELO_RAPIDO, system: SISTEMA, prompt, maxTokens: 900 });
  const vistos = new Set();
  const saida = [];
  for (const e of Array.isArray(r.escolhidas) ? r.escolhidas : []) {
    const rec = VERIFICADAS.find((x) => x.id === Number(e.id));
    if (!rec || vistos.has(rec.id) || !rec.ref.includes(pedido.refeicao)) continue;
    if (pedido.nivel !== "Um de cada" && rec.nivel !== pedido.nivel) continue;
    vistos.add(rec.id);
    saida.push({ rec, falta: Array.isArray(e.faltando) ? e.faltando.map((x) => limpa(x)) : [], motivo: limpa(e.motivo, 160) });
    if (saida.length === 3) break;
  }
  return saida;
}

/* 3. Gerar sugestões extras com IA */
export async function gerarIA(estado, pedido, jaSugeridas) {
  const prompt =
`PERFIL
${perfilTexto(estado.perfil)}

DESPENSA (o que a pessoa tem agora)
${despensaTexto(estado.despensa)}

REFERÊNCIA DO ESTILO DA NUTRICIONISTA DA PESSOA
${ESTILO_NUTRI}

${SUBSTITUICOES}
Use essas substituições quando a pessoa não tiver o ingrediente original, em vez de listá-lo como faltando.

PEDIDO
Refeição: ${pedido.refeicao}.${pedido.extra ? "\nObservação da pessoa: " + pedido.extra : ""}
${pedido.nivel === "Um de cada"
  ? "Níveis: entregue exatamente 3 receitas, uma de nível Simples, uma Médio e uma Complexo, nessa ordem."
  : "Nível: entregue exatamente 3 receitas diferentes entre si, todas de nível " + pedido.nivel + "."}
${jaSugeridas.length ? "Já foram sugeridas estas receitas validadas, NÃO repita nem sugira variações próximas delas: " + jaSugeridas.join("; ") + "." : ""}
${textoPrefsIA(estado.prefs)}

DEFINIÇÃO DOS NÍVEIS
- Simples: até 15 minutos, 3 a 6 ingredientes, uma panela ou frigideira (ou só montar), no máximo 4 passos.
- Médio: de 20 a 40 minutos, duas etapas de preparo (ex.: base e finalização), até 6 passos.
- Complexo: mais de 40 minutos, várias etapas ou técnicas (ex.: marinar, assar, molho separado), até 8 passos. Deve valer o esforço.

REGRAS DE QUALIDADE (muito importantes)
- Só sugira pratos que existem de verdade na culinária brasileira ou internacional comum, ou variações óbvias deles. Nada de combinações inventadas ou estranhas. Se um prato não tem nome conhecido, descreva-o de forma simples e honesta (ex.: "Frango grelhado com purê de batata-doce").
- NÃO tente usar todos os itens da despensa. Escolha os 2 a 5 que combinam bem entre si, como um cozinheiro experiente faria. Itens que ficaram de fora simplesmente não entram.
- Respeite a lógica da refeição: café da manhã, lanche e ceia são leves; almoço e jantar têm proteína, carboidrato e vegetais; marmita precisa aguentar a geladeira e o reaquecimento.
- Cada ingrediente da lista precisa aparecer no modo de preparo, e cada passo precisa fazer sentido na ordem (ex.: não bater frango cru com iogurte, respeitar o ponto de cozimento, tempos e temperaturas realistas).
- Presuma apenas sal, óleo ou azeite, pimenta-do-reino, alho e cebola. Qualquer outro item fora da despensa entra em "faltando"; no máximo 2 itens faltando por receita, de preferência 0 ou 1.
- Use só os equipamentos do perfil. Se o prato exigir um que a pessoa não tem, escolha outro prato.
- Objetivos do perfil: boa quantidade de proteína, saciedade, carboidrato de qualidade e porção controlada, sem dietas extremas e sem prometer resultado. Considere as metas do perfil, se houver, e o estilo da nutricionista descrito acima.
- Use medidas caseiras brasileiras (xícara, colher de sopa, unidade) e gramas quando ajudar.
- Calorias, proteína, carboidrato e gordura por porção são estimativas aproximadas e precisam ser plausíveis para os ingredientes e as quantidades que você listou. Não faça recomendação médica.
- Passos curtos, no imperativo, em português do Brasil natural.
- Antes de responder, releia cada receita como se fosse cozinhá-la e corrija qualquer incoerência.

Responda SOMENTE com JSON neste formato:
{"receitas":[{"nome":"","nivel":"Simples|Médio|Complexo","tempo_min":0,"porcoes":0,"kcal_por_porcao":0,"proteina_g_por_porcao":0,"carboidrato_g_por_porcao":0,"gordura_g_por_porcao":0,"da_despensa":["..."],"faltando":["..."],"ingredientes":["quantidade + item"],"passos":["..."],"dica":""}]}`;
  const r = await perguntar({ model: MODELO_PRINCIPAL, system: SISTEMA, prompt, maxTokens: 4000 });
  const lista = Array.isArray(r.receitas) ? r.receitas : [];
  if (!lista.length) throw new Error("A IA não devolveu receitas");
  return lista.slice(0, 3);
}
