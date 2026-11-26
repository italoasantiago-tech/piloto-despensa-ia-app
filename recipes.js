import { LIVRO } from "./recipes_livro.js";
import { LIVRO2 } from "./recipes_livro2.js";
/* ---------- Biblioteca de receitas verificadas (Dayane Mello · Nutrição) ---------- */
const FONTE_F = "25 Receitas Fáceis para Lanche";
const FONTE_D = "8 Doces Permitidos na Dieta";
const DAYANE = [
{id:1,nome:"Sanduíche de Frango e Mostarda",nivel:"Simples",ref:["Café da manhã","Lanche"],itens:["peito de frango cozido","pão integral","molho de mostarda","alface","tomate"],
 ing:["100 g de peito de frango cozido, em pedaços ou desfiado","2 fatias de pão integral","1 colher (chá) de molho de mostarda","2 folhas de alface","1 tomate em rodelas"],
 passos:["Espalhe o molho de mostarda em uma das fatias de pão.","Distribua a alface, o tomate e o frango.","Cubra com a outra fatia e sirva."],dica:"Se gostar, toste o pão na frigideira antes de montar.",fonte:FONTE_F},
{id:2,nome:"Sanduíche de Peru e Ricota",nivel:"Simples",ref:["Café da manhã","Lanche"],itens:["pão integral","peito de peru","ricota","alface","tomate"],
 ing:["2 fatias de pão integral","2 fatias de peito de peru","1 colher (sopa) de ricota amassada","2 folhas de alface","1 tomate em rodelas","Orégano a gosto"],
 passos:["Amasse a ricota com um garfo e misture o orégano.","Espalhe o creme em uma fatia de pão e monte com o peru, a alface e o tomate.","Feche com a outra fatia. Se quiser, corte em quadradinhos para servir."],dica:"",fonte:FONTE_F},
{id:3,nome:"Sanduíche de Presunto",nivel:"Simples",ref:["Café da manhã","Lanche"],itens:["pão integral","presunto magro","tomate","alface"],
 ing:["2 fatias de pão integral","50 g de presunto magro","Tomate em rodelas","Alface","Pimenta biquinho (opcional)"],
 passos:["Monte o sanduíche em camadas: presunto, tomate e alface.","Finalize com a pimenta biquinho, se desejar, e sirva."],dica:"",fonte:FONTE_F},
{id:4,nome:"Wrap de Presunto",nivel:"Simples",ref:["Café da manhã","Lanche"],itens:["pão sírio ou wrap integral","presunto magro","maionese light ou requeijão light","alface"],
 ing:["1 folha de pão sírio ou wrap integral","1 fatia de presunto magro","1 colher (chá) de maionese light ou requeijão light","Alface à vontade"],
 passos:["Espalhe a maionese ou o requeijão sobre a folha.","Coloque o presunto e bastante alface.","Enrole bem e corte ao meio."],dica:"",fonte:FONTE_F},
{id:5,nome:"Sanduíche de Ricota no Pão Sírio",nivel:"Simples",ref:["Café da manhã","Lanche"],itens:["pão sírio integral","iogurte natural","ricota","tomate","alface"],
 ing:["1 pão sírio integral","1 colher (sopa) de iogurte natural","1 colher (sopa) de ricota","1 tomate","2 folhas de alface"],
 passos:["Corte o tomate e a ricota em cubinhos.","Passe o iogurte por dentro do pão.","Recheie com a ricota, o tomate e a alface e dobre ao meio."],dica:"Para levar na bolsa ou na marmita, embale bem e mantenha refrigerado até a hora de comer.",fonte:FONTE_F},
{id:6,nome:"Sanduíche Grelhado de Ricota e Tomate",nivel:"Simples",ref:["Café da manhã","Lanche"],itens:["pão integral","ricota","tomate"],
 ing:["2 fatias de pão integral","2 colheres (sopa) de ricota amassada","3 rodelas de tomate","1 pitada de orégano"],
 passos:["Espalhe a ricota amassada em uma fatia e tempere com o orégano.","Acrescente as rodelas de tomate e feche com a outra fatia.","Doure na frigideira, pressionando de leve, dos dois lados."],dica:"",fonte:FONTE_F},
{id:7,nome:"Torrada com Ovo",nivel:"Simples",ref:["Café da manhã","Lanche"],itens:["ovo","pão integral"],
 ing:["1 ovo","1 fatia de pão integral","Sal e pimenta a gosto"],
 passos:["Com um copo ou cortador, faça um buraco no centro da fatia de pão.","Aqueça uma frigideira antiaderente, coloque o pão e quebre o ovo dentro do buraco.","Tempere, deixe firmar, vire e doure o outro lado. Sirva quentinho."],dica:"",fonte:FONTE_F},
{id:8,nome:"Omelete de Liquidificador",nivel:"Médio",ref:["Café da manhã","Lanche","Jantar"],itens:["ovo","farinha de trigo","parmesão ralado","presunto","tomate","azeitona verde","cheiro-verde"],
 ing:["5 ovos","3 colheres (sopa) de óleo","2 colheres (sopa) rasas de farinha de trigo","1 colher (sopa) de parmesão ralado","1 colher (café) de alho amassado","1 xícara (chá) de presunto em cubos","1 tomate picado, sem sementes","½ xícara (chá) de azeitonas verdes em rodelas","Sal, pimenta-do-reino e cheiro-verde a gosto","1 colher (chá) de azeite para untar"],
 passos:["Bata no liquidificador os ovos, o óleo, a farinha, o parmesão e o alho até ficar homogêneo.","Despeje em uma tigela e misture o presunto, o tomate, as azeitonas, o cheiro-verde, o sal e a pimenta.","Unte uma frigideira antiaderente com o azeite, aqueça em fogo médio e despeje a massa.","Deixe dourar dos dois lados e sirva."],dica:"",fonte:FONTE_F},
{id:9,nome:"Omelete de Espinafre",nivel:"Simples",ref:["Café da manhã","Lanche","Jantar"],itens:["ovo","espinafre","tomate"],
 ing:["3 claras","1 gema","1 dente de alho picado","1 xícara (chá) de espinafre picado","1 tomate picado","Sal e pimenta-do-reino a gosto","Fio de azeite para untar"],
 passos:["Bata as claras e a gema com um garfo e tempere com sal e pimenta.","Aqueça uma frigideira antiaderente com um fio de azeite e retire o excesso com papel toalha.","Despeje os ovos e distribua o espinafre, o alho e o tomate.","Deixe dourar de um lado, vire e sirva."],dica:"",fonte:FONTE_F},
{id:10,nome:"Omelete de Frango",nivel:"Simples",ref:["Café da manhã","Lanche","Jantar"],itens:["ovo","tomate","frango desfiado"],
 ing:["2 claras","½ tomate picado, sem sementes","60 g de frango desfiado temperado com orégano","Azeite para untar","Sal e pimenta a gosto"],
 passos:["Bata as claras com um garfo (ou em neve, se preferir uma omelete mais aerada).","Misture o tomate, o frango, o sal e a pimenta.","Despeje em uma frigideira untada com azeite e doure dos dois lados."],dica:"",fonte:FONTE_F},
{id:11,nome:"Crepioca Fit",nivel:"Simples",ref:["Café da manhã","Lanche","Ceia"],itens:["ovo","goma de tapioca","peito de peru"],
 ing:["1 ovo","2 colheres (sopa) de goma de tapioca","1 colher (sopa) de água","2 fatias de peito de peru","Sal, pimenta-do-reino, orégano ou parmesão ralado a gosto","Fio de azeite para untar"],
 passos:["Em uma tigela, bata o ovo, a goma e a água com um garfo e tempere a gosto.","Aqueça uma frigideira em fogo médio e unte com o azeite.","Espalhe a massa e deixe dourar dos dois lados.","Recheie com o peito de peru, dobre e sirva."],dica:"",fonte:FONTE_F},
{id:12,nome:"Crepioca de Queijo e Peito de Peru",nivel:"Simples",ref:["Café da manhã","Lanche","Ceia"],itens:["ovo","goma de tapioca hidratada","queijo minas","peito de peru","cheiro-verde","manjericão"],
 ing:["2 ovos","2 colheres (sopa) de goma de tapioca hidratada","Sal e cheiro-verde a gosto","2 fatias de queijo minas","2 fatias de peito de peru","Folhas de manjericão a gosto"],
 passos:["Bata os ovos até ficarem aerados e misture a tapioca, o cheiro-verde e o sal.","Despeje metade da massa em uma frigideira antiaderente, em fogo baixo, formando uma camada fina.","Quando firmar, vire e deixe firmar do outro lado. Repita com o restante da massa.","Recheie com o queijo, o peru e o manjericão e sirva."],dica:"",fonte:FONTE_F},
{id:13,nome:"Tapioca Recheada com Frango",nivel:"Simples",ref:["Café da manhã","Lanche","Jantar"],itens:["goma de tapioca","chia","aveia em flocos","frango desfiado"],
 ing:["2 colheres (sopa) de goma de tapioca","1 colher (chá) de chia","1 colher (chá) de aveia em flocos","2 colheres (sopa) de frango desfiado temperado","Orégano e sal a gosto"],
 passos:["Misture a goma com a chia, a aveia e uma pitada de sal.","Espalhe a mistura em uma frigideira bem quente até a tapioca firmar e vire.","Acrescente o frango e o orégano, dobre ao meio e sirva."],dica:"",fonte:FONTE_F},
{id:14,nome:"Tapioca de Queijo Minas e Peru",nivel:"Simples",ref:["Café da manhã","Lanche","Ceia"],itens:["goma de tapioca","queijo minas","peito de peru","linhaça dourada"],
 ing:["1 xícara (chá) de goma de tapioca peneirada","1 fatia de queijo minas","2 fatias de peito de peru","1 colher (sopa) de linhaça dourada (opcional)","Orégano e sal a gosto"],
 passos:["Tempere a goma com o sal, o orégano e a linhaça.","Espalhe em uma frigideira aquecida até formar um disco e vire quando firmar.","Coloque o queijo e o peru por cima, dobre e deixe derreter um pouco.","Sirva em seguida."],dica:"Se quiser, acrescente legumes picados e salteados no azeite ao recheio.",fonte:FONTE_F},
{id:15,nome:"Pão de Queijo de Frigideira",nivel:"Simples",ref:["Café da manhã","Lanche"],itens:["ovo","leite","goma de tapioca","parmesão ralado"],
 ing:["1 ovo","1 colher (sopa) de leite","2 colheres (sopa) de goma de tapioca","1 colher (sopa) de parmesão ralado","Sal a gosto"],
 passos:["Misture tudo em uma vasilha até obter uma massa homogênea.","Aqueça uma frigideira antiaderente e despeje parte da massa, como uma panqueca.","Deixe até as bordas dourarem, vire e sirva."],dica:"",fonte:FONTE_F},
{id:16,nome:"Pizza de Frango e Rúcula",nivel:"Médio",ref:["Lanche","Jantar"],itens:["pão sírio integral ou massa de wrap","molho de tomate","frango","rúcula","tomate-cereja ou tomate"],
 ing:["1 pão sírio integral ou massa de wrap","1 colher (sopa) de molho de tomate","125 g de frango desfiado","1 punhado de rúcula","Tomate-cereja ou tomate comum para decorar"],
 passos:["Grelhe o frango sem óleo, tempere a gosto, desfie e reserve.","Aqueça o pão rapidamente na frigideira.","Monte por cima as camadas: molho, rúcula, frango e tomates."],dica:"Cozinhe frango a mais e guarde desfiado na geladeira ou no freezer: fica pronto para vários lanches da semana.",fonte:FONTE_F},
{id:17,nome:"Wrap de Frango e Rúcula",nivel:"Médio",ref:["Lanche","Jantar"],itens:["filé de peito de frango","pão sírio integral","rúcula","creme de ricota"],
 ing:["1 filé de peito de frango (100 g)","1 pão sírio integral","1 xícara (chá) de rúcula","1 colher (sopa) de creme de ricota"],
 passos:["Grelhe o frango sem óleo, tempere e desfie.","Espalhe o creme de ricota sobre o pão.","Coloque a rúcula e o frango, enrole e sirva."],dica:"",fonte:FONTE_F},
{id:18,nome:"Wrap de Carne Moída",nivel:"Médio",ref:["Almoço","Jantar","Lanche"],itens:["wrap ou pão sírio","carne moída já refogada","tomate","azeitona preta","mussarela","alface","cenoura","agrião"],
 ing:["1 disco de wrap ou pão sírio","Carne moída já refogada","Tomate picadinho","Azeitona preta picada","2 fatias de mussarela","Azeite, sal e pimenta a gosto","Para acompanhar: alface, cenoura ralada e agrião"],
 passos:["Toste o disco dos dois lados em uma frigideira e reserve em um prato com as fatias de mussarela por cima.","Na mesma frigideira, com um pouco de azeite, refogue o tomate e a azeitona e tempere.","Quando o tomate começar a murchar, junte a carne moída.","Recheie o disco com o refogado, dobre ao meio e sirva com a saladinha."],dica:"",fonte:FONTE_F},
{id:19,nome:"Queijo Coalho e Tomates",nivel:"Simples",ref:["Lanche","Ceia","Café da manhã"],itens:["queijo coalho","tomate"],
 ing:["2 fatias de queijo coalho","2 tomates","Fio de azeite","Orégano a gosto"],
 passos:["Aqueça uma frigideira com um fio de azeite.","Grelhe o queijo coalho e os tomates até dourarem.","Sirva quentinho, com orégano por cima."],dica:"",fonte:FONTE_F},
{id:20,nome:"Chips Assados",nivel:"Médio",ref:["Lanche"],itens:["batata-doce","beterraba","cenoura"],
 ing:["1 batata-doce crua","1 beterraba","1 cenoura","Azeite e sal a gosto"],
 passos:["Pré-aqueça o forno a 180 °C. Descasque o legume escolhido e corte em fatias finas e uniformes.","Se usar batata-doce, deixe de molho em água com sal por 15 minutos e seque bem com papel toalha.","Misture azeite e sal e pincele uma camada fina sobre as fatias, dispostas em uma assadeira com papel manteiga.","Asse por 20 minutos, vire as fatias, baixe o forno para 160 °C e continue assando, conferindo a cada 5 a 10 minutos."],dica:"Os chips escurecem rápido no final. Fique de olho para não queimar.",fonte:FONTE_F},
{id:21,nome:"Batata-doce Rústica Assada",nivel:"Complexo",ref:["Almoço","Jantar","Lanche","Marmita (lote)"],itens:["batata-doce","alho","alecrim"],
 ing:["2 batatas-doces médias","1 colher (chá) de sal","1 colher (sopa) de azeite","3 dentes de alho sem casca","Alecrim e pimenta-do-reino a gosto"],
 passos:["Descasque as batatas e corte em pedaços grandes.","Cozinhe em água com o sal. Quando ferver, conte 5 minutos e desligue o fogo.","Seque bem com papel toalha e acomode em uma forma antiaderente.","Regue com o azeite, tempere com a pimenta e o alecrim e junte o alho.","Asse em forno pré-aquecido a 250 °C por cerca de 40 minutos, virando na metade do tempo."],dica:"",fonte:FONTE_F},
{id:22,nome:"Empadinha Fit de Palmito",nivel:"Médio",ref:["Lanche"],itens:["batata-doce","ovo","fermento em pó","requeijão light","palmito"],
 ing:["1 batata-doce média","2 claras","1 pitada de fermento em pó","1 colher (sopa) de requeijão light","2 colheres (sobremesa) de palmito picado"],
 passos:["Cozinhe a batata-doce, descasque e amasse até virar um purê.","Misture o purê com as claras e o fermento.","Forre 4 forminhas individuais de silicone com a massa e recheie com o requeijão e o palmito.","Cubra com mais massa e leve ao micro-ondas por cerca de 6 minutos, ou até assar. O tempo varia conforme a potência do aparelho."],dica:"",fonte:FONTE_F},
{id:23,nome:"Salada de Frutas com Iogurte",nivel:"Simples",ref:["Café da manhã","Lanche","Ceia"],itens:["frutas (banana, manga, abacaxi, laranja, maçã)","iogurte natural","aveia ou sementes"],
 ing:["1 xícara (chá) de frutas picadas (banana, manga, abacaxi, laranja, maçã…)","1 copo de iogurte natural","2 colheres (sopa) de aveia ou sementes de sua preferência"],
 passos:["Misture as frutas em uma tigela e leve à geladeira.","Na hora de servir, acrescente o iogurte e polvilhe a aveia ou as sementes."],dica:"",fonte:FONTE_F},
{id:24,nome:"Panqueca de Banana e Aveia",nivel:"Simples",ref:["Café da manhã","Lanche"],itens:["banana madura","ovo","aveia em flocos","canela"],
 ing:["2 bananas maduras","1 ovo","15 g de aveia em flocos","1 colher (chá) de canela","1 colher (chá) de extrato de baunilha (opcional)","1 colher (sopa) de cacau em pó (opcional)","Um pouco de óleo para untar"],
 passos:["Amasse as bananas em uma tigela funda e misture o ovo.","Acrescente a aveia, a canela e, se quiser, a baunilha e o cacau.","Unte uma frigideira e aqueça. Coloque uma concha da massa e cozinhe por 2 a 3 minutos.","Quando surgirem bolhinhas, vire e deixe mais 1 a 2 minutos. Repita com o restante."],dica:"",fonte:FONTE_F},
{id:25,nome:"Panqueca Proteica",nivel:"Simples",ref:["Café da manhã","Lanche"],itens:["ovo","farinha de aveia","fermento químico","banana"],
 ing:["2 ovos","2 colheres (sopa) de farinha de aveia","¼ de colher (sobremesa) de fermento químico","1 banana"],
 passos:["Amasse a banana e misture com os demais ingredientes.","Aqueça uma frigideira, despeje uma concha de massa e espalhe.","Doure dos dois lados, em fogo baixo a médio, sem pressa, e sirva."],dica:"",fonte:FONTE_F},
{id:26,nome:"Gelatina com Frutas e Chia",nivel:"Médio",ref:["Lanche","Ceia"],itens:["gelatina incolor sem sabor","frutas (morango, maçã, uva)","chia"],
 ing:["1 envelope (12 g) de gelatina incolor sem sabor","½ xícara (chá) de água quente","1 xícara (chá) de água fria ou suco natural sem açúcar","1 xícara (chá) de frutas picadas (morango, maçã, uva)","1 colher (sopa) de chia"],
 passos:["Hidrate a gelatina em 4 colheres (sopa) de água fria por 5 minutos.","Junte a água quente e mexa até dissolver. Acrescente a água fria ou o suco e, quando estiver morna, misture a chia.","Distribua as frutas em taças ou forminhas de silicone e cubra com a gelatina.","Leve à geladeira por cerca de 4 horas, até firmar."],dica:"Em forminhas individuais, cada porção já fica pronta para o lanche.",fonte:FONTE_D},
{id:27,nome:"Panqueca de Banana com Doce de Leite",nivel:"Simples",ref:["Café da manhã","Lanche","Ceia"],itens:["banana madura","ovo","aveia em flocos","canela","doce de leite zero açúcar"],
 ing:["1 banana madura amassada","1 ovo","1 colher (sopa) de aveia em flocos","1 pitada de canela","1 colher (sopa) de doce de leite zero açúcar","½ banana em rodelas para finalizar"],
 passos:["Misture a banana amassada, o ovo, a aveia e a canela até formar uma massa homogênea.","Aqueça uma frigideira antiaderente levemente untada e coloque pequenas porções de massa.","Doure dos dois lados, virando quando surgirem bolhinhas.","Finalize com uma pequena porção de doce de leite e as rodelas de banana."],dica:"Escolha doce de leite zero açúcar e mantenha a porção pequena.",fonte:FONTE_D},
{id:28,nome:"Queijo com Goiabada",nivel:"Simples",ref:["Lanche","Ceia"],itens:["queijo minas","goiabada zero açúcar"],
 ing:["2 fatias de queijo minas (ou queijo branco de sua preferência)","1 fatia fina de goiabada zero açúcar"],
 passos:["Corte o queijo e a goiabada em cubos do mesmo tamanho.","Monte camadas alternadas de queijo e goiabada, no estilo Romeu e Julieta.","Sirva em temperatura ambiente ou gelado."],dica:"Para levar na bolsa, guarde em um potinho bem fechado.",fonte:FONTE_D},
{id:29,nome:"Banana e Morango com Chocolate 70%",nivel:"Médio",ref:["Lanche","Ceia"],itens:["banana","morango","chocolate 70% cacau","palitos de churrasquinho"],
 ing:["1 banana","6 morangos","30 g de chocolate 70% cacau","Palitos de churrasquinho"],
 passos:["Corte a banana em rodelas grossas e seque bem os morangos.","Derreta o chocolate em banho-maria ou no micro-ondas, em intervalos de 30 segundos, mexendo a cada pausa.","Monte os espetinhos alternando banana e morango e cubra com o chocolate derretido.","Leve à geladeira até firmar, por cerca de 20 a 30 minutos."],dica:"Frutas bem secas fazem o chocolate aderir melhor.",fonte:FONTE_D},
{id:30,nome:"Morango com Tâmaras",nivel:"Simples",ref:["Lanche","Ceia"],itens:["tâmara","morango"],
 ing:["4 tâmaras","2 morangos picados em pedaços"],
 passos:["Abra as tâmaras ao meio e retire o caroço.","Recheie cada tâmara com um pedaço de morango.","Feche levemente e sirva em seguida."],dica:"Uma combinação naturalmente doce: 1 ou 2 tâmaras por vez já resolvem.",fonte:FONTE_D},
{id:31,nome:"Sorvete de Banana",nivel:"Médio",ref:["Lanche","Ceia"],itens:["banana madura","canela ou cacau em pó","leite","processador"],
 ing:["3 bananas maduras, em rodelas e congeladas","1 colher (chá) de canela ou 1 colher (sopa) de cacau em pó (opcional)","1 colher (sopa) de leite, se precisar"],
 passos:["Congele as rodelas de banana por pelo menos 4 horas.","Bata no processador, raspando as laterais, até obter uma textura cremosa.","Acrescente a canela ou o cacau e bata rapidamente.","Sirva na hora. Para uma textura mais firme, leve ao freezer por 30 minutos."],dica:"Quanto mais madura a banana, mais doce fica o sorvete.",fonte:FONTE_D},
{id:32,nome:"Mousse de Chocolate 70% com Abacate",nivel:"Médio",ref:["Lanche","Ceia"],itens:["abacate","chocolate 70% cacau","leite ou bebida vegetal","liquidificador ou processador"],
 ing:["1 abacate maduro pequeno","40 g de chocolate 70% cacau derretido","2 a 3 colheres (sopa) de leite ou bebida vegetal","1 colher (chá) de extrato de baunilha (opcional)","Raspas de chocolate 70% para decorar"],
 passos:["Derreta o chocolate em banho-maria ou no micro-ondas e deixe amornar.","Bata o abacate com o chocolate, o leite e a baunilha até ficar liso e cremoso.","Distribua em potinhos e leve à geladeira por 1 hora.","Finalize com raspas de chocolate antes de servir."],dica:"Rende 2 porções pequenas.",fonte:FONTE_D},
{id:33,nome:"Bananinha sem Adição de Açúcar",nivel:"Simples",ref:["Lanche","Ceia"],itens:["bananinha sem adição de açúcar"],
 ing:["1 unidade de bananinha sem adição de açúcar"],
 passos:["Confira o rótulo: a banana deve ser o ingrediente principal e não deve haver açúcar adicionado.","Guarde na bolsa, na embalagem original.","Quando bater a vontade de doce, coma uma unidade e aproveite com calma."],dica:"Perfeita para deixar na bolsa e ter uma opção prática sempre à mão.",fonte:FONTE_D}
];
export const AUTORA = "Dayane Mello · Nutrição";
/* Biblioteca completa: receitas da nutricionista (sem campo "autora") + e-book de outra autora (com "autora") */
export const VERIFICADAS = [...DAYANE, ...LIVRO, ...LIVRO2];

/* Substituições práticas do guia "Como fazer receitas usando o que tem em casa" (Jaana Thoen), usadas só como contexto para a IA */
export const SUBSTITUICOES = `Substituições possíveis (do guia de receitas com o que tem em casa):
- Farinha de aveia, de arroz, de coco ou de linhaça podem substituir umas às outras (a consistência muda um pouco).
- Açúcar de coco: qualquer açúcar ou adoçante (demerara, mascavo, xilitol, eritritol); em algumas receitas, mel.
- Pasta de amendoim: pasta de castanha de caju ou de avelã; em receitas com pouca quantidade, manteiga ou óleo de coco.
- Banana: em alguns casos é opcional; também pode ser trocada por abacate ou maçã amassada ou por pasta de amendoim.
- Scoop de whey: 2 colheres (sopa) de leite em pó (com cacau em pó para o sabor de chocolate).
- Ovo: em receitas doces, banana amassada ou pasta de amendoim; em salgadas, 1 colher (sopa) de chia ou linhaça com 3 colheres (sopa) de água, descansando 10 minutos.
- Óleo de coco: manteiga, pasta de amendoim ou azeite (em receitas doces prefira manteiga).
- Iogurte: em doces, creme de leite light ou leite; em salgadas, requeijão light ou creme de ricota.
- Batata-doce, batata inglesa, macaxeira, abóbora e inhame podem substituir uns aos outros.
- Itens em geral opcionais: cacau, baunilha, canela, chocolate amargo, chia e outros grãos, temperos.`;

/* Referência do estilo do cardápio da nutricionista (usada só como contexto para as receitas da IA) */
export const ESTILO_NUTRI = `Cardápio de referência da nutricionista, com 5 refeições por dia (café da manhã, almoço, lanche da tarde, jantar e ceia), por volta de 2.100 kcal:
- Café da manhã: pão integral, ovos mexidos, queijo branco ou peito de peru, fruta ou suco de fruta.
- Almoço: arroz, feijão carioca, salada de verdura crua à vontade e uma proteína grelhada ou na airfryer (frango, patinho, almôndega).
- Lanche da tarde: iogurte natural, fruta, castanhas.
- Jantar: proteína grelhada (frango, salmão, peixe), vegetais, e um carboidrato como batata-doce, lentilha, quinoa ou macarrão integral.
- Ceia: leite desnatado, crepioca ou tapioca com queijo minas.
Estilo: comida simples, caseira e brasileira, porções controladas, azeite em pouca quantidade, nenhum alimento proibido.`;
