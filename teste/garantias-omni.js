/* 🧾 Garantias (2.28.0), em 390 px, no modo "só neste aparelho" com as Senhas da casa abertas. Confere:
     G1 — as contas e a leitura
     - A: as contas puras (GarCalc), com a data de "hoje" vinda de fora: meses de calendário (quando o dia não existe no mês,
       vale o último: a data mais cedo), dias e datas válidas; a de fábrica (conta da nota), o prazo da lei (conta da
       entrega; CDC art. 26), a estendida (só cobre depois da de fábrica; "não sei" dá as duas leituras), a situação de hoje,
       o próximo fim, os avisos de 30 e 7 dias e do começo da estendida, o contador dos 30 dias para consertar (CDC art. 18)
       e o da seguradora; as mesmas contas em 3 fusos (Nova York, São Paulo no horário de verão de 2018 e Auckland)
     - a leitura saneada (Garantias.ler) e o "lixo": número gigante, ano 0024, link javascript: e <img onerror> em cada texto
       não derrubam nada; nenhuma conta lança erro; Início, 🔔, Agenda, 🔍 e Onde está? abrem sem alert, sem link e sem erro
     - o arquivo "omnilife.garantias" (Garantias.validar): o exemplo do desenho entra (o pedido só no que vai para as Senhas
       da casa); data errada, versão nova, __proto__, PDF que não é PDF e o resto recusam o arquivo inteiro dizendo qual item
     - B0, versão antiga: editar o objeto pelo ✏️ do Onde está? e marcar na planta mantêm a garantia; o merge3 da nuvem
       mantém o campo que só um lado tem, soma atendimentos com ids diferentes e o mesmo objeto nos 2 celulares dá o mesmo ref
     - nada vai ao MoneyTRIO (Bridge.post, sol_ponte); console, Telem e o registro do objeto sem CPF, chave ou pedido
     G2 — a aba 🧾 Garantias e a lista
     - a aba depois de 🚗 Veículos (TABS, ícone, ☰ "Casa, carro e papéis", barra de atalhos), o id casa.garantias do RootifyONE
       (Rec e recursos-do-app.json); desligada: some do ☰, da barra e da 🔍, e o endereço mostra "Função desligada"
     - a lista: vazia ("Toque em ＋…"), "Faltam dados" e "versão mais nova" sempre no topo, os 4 filtros com contagem (Valendo,
       Em 30 dias — 30 entra, 31 não —, Vai começar, Acabaram com "Saíram de casa" fechado), a ordem (o que acaba primeiro;
       o que começa primeiro; o que acabou por último), a linha (marca, modelo, "comprado em", a frase curta, "em N dias"),
       o "≈" e o rodapé; "Só responsáveis" fora para quem não é responsável; criança vê sem ＋; criança sem "ver a Casa" não
       vê a aba; 🔍 "🧾 nome · situação · loja" sem número, levando à ficha; AssistONE e dica; 💬 sabe a tela; o lixo
       não quebra; 390 px sem rolagem lateral e todo alvo de toque com 44 px, em PT e EN
     G3 — a ficha, o formulário, as Senhas da casa, os papéis, o Onde está? e o apagar
     - cadastro mínimo (nome + data da compra; o resto em "＋ Mais detalhes"), "Ligar a" um objeto que já existe, o que o
       formulário recusa; a ficha (a frase grande, as três garantias com ≈, o "próximo passo", o 🆘)
     - pedido, bilhete, série, chave da nota, valor, preço da estendida, pagamento e final do cartão só no item "gv_" + id das
       Senhas da casa (D-G11); no objeto, só os finais; "final 0001" e o 👁 só no modo aberto (a voz esconde de novo); as
       Senhas fechando com a janela aberta; fechadas e quem não é responsável: nada protegido; o editVault mantém as chaves
     - os papéis: a nota trancada, só responsáveis, "nota-fiscal.pdf" e a marca gar; o folheto com o "Quem vê" do objeto;
       Senhas fechadas sem abrir: nada guardado; "saiu de casa" (D-G9) oferece apagar a nota e os números
     - o selo "🧾 garantia até …" no Onde está?; excluir pelo ✏️ leva os papéis e os números; as sobras de versão antiga
       (com confirmação, só o responsável); fora do "Passar o bastão"; criança e versão mais nova não gravam
     - o Giro (no Supabase de mentira, como o giro-omni.js): depois da troca da chave e do "Terminar a troca", a nota abre e o
       👁 mostra o número
   Só valores de mentira ("Purificador Exemplo", "Loja Exemplo", CPF 123.456.789-00, que tem dígito inválido). Uso: node teste/rodar.js */
const { criarConferir, abrirApp, iniciar, terminar, VP } = require('./_base');
const fs = require('fs'), path = require('path');
const { falhas, conferir } = criarConferir();
const CPF = '123.456.789-00', PEDIDO = 'PEDIDO-EXEMPLO-0001', CHAVE = '35240312345678000190550010000012341000123456';
const XSS = '<img src=x onerror="window.__xss=1">';
const fecharJanelas = (p) => p.evaluate(() => { document.querySelectorAll('dialog[open]').forEach((d) => { try { d.close(); } catch (e) {} }); });

/* ---------- ajudantes do lado do Node ---------- */
const ehObj = (x) => !!x && typeof x === 'object' && !Array.isArray(x);
const fundir = (a, b) => { const o = Object.assign({}, a); for (const k of Object.keys(b || {})) o[k] = ehObj(b[k]) && ehObj(a[k]) ? fundir(a[k], b[k]) : b[k]; return o; };
/* o esperado pode ser parcial: só as chaves escritas contam; função = conferência livre */
const bate = (r, e) => {
  if (typeof e === 'function') { try { return !!e(r); } catch (x) { return false; } }
  if (e === null || typeof e !== 'object') return r === e;
  if (Array.isArray(e)) return Array.isArray(r) && r.length === e.length && e.every((x, i) => bate(r[i], x));
  return ehObj(r) && Object.keys(e).every((k) => bate(r[k], e[k]));
};
const canon = (x) => JSON.stringify(x, (k, v) => (ehObj(v) ? Object.keys(v).sort().reduce((o, kk) => ((o[kk] = v[kk]), o), {}) : v));

/* padrão do desenho: compra 2024-03-10, 12 meses de fábrica (até 2025-03-10), "não sei" se a lei está dentro */
const BASE = { v: 1, compra: { data: '2024-03-10' }, fabrica: { meses: 12, legalInclusa: 'naosei' } };
const G = (o) => fundir(BASE, o || {});
const E = (o) => G({ estendida: Object.assign({ tem: 'sim' }, o) });
const F = (o) => Object.assign({ v: 1, compra: { data: '2024-03-10' }, fabrica: { fim: '2025-03-12' } }, o || {});   /* folheto até 2025-03-12 */
const A1 = { id: 'a1', d: '2025-01-01', quem: 'loja', situacao: 'aberto', defeito: 'df1' }, A2 = { id: 'a2', d: '2025-01-20', quem: 'loja', situacao: 'aberto', defeito: 'df1' };
const SEG = { id: 's1', d: '2024-12-20', quem: 'seguradora', situacao: 'aberto', defeito: 'df1' };
const SAIU = { como: 'doado', em: '2025-01-01', obs: '' };
const AT = (lista) => G({ atendimentos: lista });

/* [função, argumentos, esperado, nome] — "ler" e "validar" vão para Garantias; o resto para GarCalc */
const CASOS = [
  /* meses de calendário, dias e datas */
  ['somaMeses', ['2024-01-31', 1], '2024-02-29', '31/jan/2024 + 1 mês = 29/fev (último dia)'],
  ['somaMeses', ['2023-01-31', 1], '2023-02-28', '31/jan/2023 + 1 mês = 28/fev'],
  ['somaMeses', ['2024-02-29', 12], '2025-02-28', '29/fev/2024 + 12 meses = 28/fev/2025'],
  ['somaMeses', ['2024-03-31', 1], '2024-04-30', '31/mar + 1 mês = 30/abr'],
  ['somaMeses', ['2024-11-30', 3], '2025-02-28', '30/nov + 3 meses = 28/fev'],
  ['somaMeses', ['2024-03-10', 12], '2025-03-10', '10/mar/2024 + 12 meses = 10/mar/2025'],
  ['somaMeses', ['2024-12-15', 1], '2025-01-15', 'dezembro + 1 mês vira o ano'],
  ['somaMeses', ['2024-03-10', 0], '2024-03-10', '+ 0 meses = a mesma data'],
  ['somaMeses', ['2024-03-10', 1e9], null, '+ 1 bilhão de meses = nada (null), sem erro'],
  ['somaMeses', ['x', 1], null, 'data ruim + 1 mês = null'],
  ['somaMeses', ['2024-03-10', 1.5], null, 'meio mês = null'],
  ['somaDias', ['2025-03-10', 90], '2025-06-08', '10/mar/2025 + 90 dias = 08/jun'],
  ['somaDias', ['2023-02-28', 1], '2023-03-01', '28/fev/2023 + 1 = 01/mar'],
  ['somaDias', ['2024-12-31', 1], '2025-01-01', '31/dez + 1 = 01/jan'],
  ['somaDias', ['2024-03-10', 'x'], null, 'dias ruins = null'],
  ['diasEntre', ['2024-02-28', '2024-03-01'], 2, 'de 28/fev a 01/mar de 2024: 2 dias (ano bissexto)'],
  ['diasEntre', ['2025-01-01', 'x'], null, 'dias até uma data ruim = null'],
  ['ehData', ['2023-02-29'], false, '29/fev/2023 não existe'],
  ['ehData', ['2024-02-29'], true, '29/fev/2024 existe'],
  ['ehData', ['2024-13-01'], false, 'mês 13 não existe'],
  ['ehData', ['2024-1-01'], false, 'mês com um algarismo não vale'],
  ['ehData', [''], false, 'vazio não é data'],
  ['ehData', ['1989-12-31'], false, 'antes de 1990 não vale'],
  ['ehData', ['2100-12-31'], true, '2100 ainda vale'],
  ['ehData', ['2101-01-01'], false, 'depois de 2100 não vale'],
  ['ehData', [20240310], false, 'número não é data'],
  /* fábrica: conta da nota */
  ['fabrica', [G({ fabrica: { meses: null } })], { fim: '2025-03-10', est: true, pelo: 'padrao' }, 'fábrica: só a data da compra → ≈12 meses, até 10/mar/2025 ≈'],
  ['fabrica', [G({ compra: { entrega: '2024-03-12' }, fabrica: { meses: null } })], { fim: '2025-03-10', est: true }, 'fábrica: com a entrega 2 dias depois, continua contando da nota (10/mar/2025)'],
  ['fabrica', [G({ fabrica: { meses: null, fim: '2025-01-01' } })], { fim: '2025-01-01', est: false, pelo: 'folheto' }, 'fábrica: o fim escrito no folheto vale como está'],
  ['fabrica', [G({ fabrica: { meses: 0 } })], null, 'fábrica: 0 meses = não tem'],
  ['fabrica', [G({ fabrica: { meses: 3 } })], { fim: '2024-06-10', est: false, pelo: 'meses' }, 'fábrica: 3 meses da nota → 10/jun/2024'],
  ['fabrica', [G({ duravel: false, fabrica: { meses: null } })], null, 'fábrica: coisa que não dura e sem os meses → não conta'],
  ['fabrica', [G({ fabrica: { meses: null }, estendida: { tem: 'sim', inicio: '2024-09-10', fim: '2026-09-10' } })], { fim: '2024-09-09', est: true, pelo: 'bilhete' }, 'fábrica não informada e bilhete que começa 6 meses depois → a de fábrica ia até a véspera (≈)'],
  ['fabrica', [{ v: 1, compra: { entrega: '2024-03-12' }, fabrica: { meses: 12 } }], { fim: '2025-03-12', est: true }, 'fábrica: sem a data da nota, conta da entrega (≈)'],
  ['fabrica', [{}], null, 'fábrica: sem nada → null'],
  /* lei: conta da entrega */
  ['lei', [G({ compra: { entrega: '2024-03-10' }, fabrica: { meses: 0 } })], { fim: '2024-06-08', alt: null, est: false }, 'lei sem fábrica, coisa que dura: 90 dias da entrega (08/jun/2024)'],
  ['lei', [G({ duravel: false, compra: { entrega: '2024-03-10' }, fabrica: { meses: 0 } })], { fim: '2024-04-09', alt: null }, 'lei sem fábrica, coisa que não dura: 30 dias (09/abr/2024)'],
  ['lei', [G({ compra: { entrega: '2024-03-10' }, fabrica: { legalInclusa: 'nao' } })], { fim: '2025-06-08', alt: null }, 'lei depois da de fábrica, "não está dentro": fim da fábrica + 90 (08/jun/2025)'],
  ['lei', [G({ compra: { entrega: '2024-03-10' }, fabrica: { legalInclusa: 'sim' } })], { fim: '2025-03-10', alt: null }, 'lei "já está dentro" da de fábrica: acaba junto (10/mar/2025)'],
  ['lei', [G({ compra: { entrega: '2024-03-10' }, fabrica: { legalInclusa: 'naosei' } })], { fim: '2025-03-10', alt: '2025-06-08' }, 'lei "não sei": até 10/mar/2025, talvez até 08/jun/2025'],
  ['lei', [G({ compra: { entrega: '2024-03-10' }, fabrica: { meses: 1, legalInclusa: 'sim' } })], { fim: '2024-06-08', alt: null }, 'lei nunca fica abaixo dos 90 dias da entrega (fábrica de 1 mês "dentro")'],
  ['lei', [G({ compra: { entrega: '2024-03-12' }, fabrica: { meses: 0 } })], { fim: '2024-06-10' }, 'lei conta da entrega (12/mar → 10/jun/2024)'],
  ['lei', [G({ fabrica: { meses: 0 } })], { fim: '2024-06-08', est: true }, 'lei sem a entrega: conta da compra, com ≈'],
  ['lei', [{}], null, 'lei: sem nada → null'],
  /* estendida */
  ['estendida', [E({ inicio: '2025-03-11', fim: '2026-03-10' })], { inicio: '2025-03-11', fim: '2026-03-10', alt: null, contrato: null, est: false, falta: false }, 'estendida com as datas do bilhete: igual ao bilhete'],
  ['estendida', [E({ meses: 12, contaDe: 'fimFabrica' })], { inicio: '2025-03-11', fim: '2026-03-10', alt: null, est: true }, 'estendida 12 meses depois da de fábrica: 11/mar/2025 → 10/mar/2026 ≈'],
  ['estendida', [E({ meses: 24, contaDe: 'compra' })], { inicio: '2025-03-11', fim: '2026-03-10', alt: null }, 'estendida 24 meses desde a compra: 11/mar/2025 → 10/mar/2026'],
  ['estendida', [E({ meses: 24, contaDe: 'naosei' })], { inicio: '2025-03-11', fim: '2026-03-10', alt: '2027-03-10' }, 'estendida 24 meses "não sei": até 10/mar/2026, talvez até 10/mar/2027'],
  ['estendida', [E({ meses: 12, contaDe: 'naosei' })], { fim: '2025-03-10', alt: '2026-03-10' }, 'estendida 12 meses "não sei": pela compra já acabou junto com a de fábrica; talvez até 10/mar/2026'],
  ['estendida', [G({ compra: { entrega: '2024-03-10' }, fabrica: { meses: 0 }, estendida: { tem: 'sim', meses: 12, contaDe: 'fimFabrica' } })], { inicio: '2024-06-09', fim: '2025-06-08' }, 'estendida sem fábrica: começa depois do prazo da lei (09/jun/2024 → 08/jun/2025)'],
  ['estendida', [E({ fim: '2026-01-01' })], { inicio: '2025-03-11', fim: '2026-01-01' }, 'estendida só com o fim: começa no dia seguinte ao fim da de fábrica'],
  ['estendida', [E({ inicio: '2025-03-11' })], { inicio: '2025-03-11', fim: null, falta: true }, 'estendida só com o início: falta o fim'],
  ['estendida', [E({ inicio: '2024-03-10', fim: '2027-03-10' })], { inicio: '2025-03-11', fim: '2027-03-10', contrato: { inicio: '2024-03-10', fim: '2027-03-10' } }, 'bilhete que começa na compra: é a vigência do contrato; o seguro só cobre a partir de 11/mar/2025'],
  ['estendida', [E({ inicio: '2025-03-11', fim: '2026-03-10', cancelada: true })], null, 'estendida cancelada não conta'],
  ['estendida', [G({ estendida: { tem: 'nao', inicio: '2025-03-11', fim: '2026-03-10' } })], null, 'sem estendida ("não") não conta'],
  ['estendida', [E({ quem: 'seguradora', inicio: '2025-03-11', fim: '2026-03-10' })], { quem: 'seguradora' }, 'estendida diz quem cobre (seguradora)'],
  ['estendida', [E({ quem: 'xyz', inicio: '2025-03-11', fim: '2026-03-10' })], { quem: 'naosei' }, 'quem cobre desconhecido vira "não sei"'],
  /* situação de hoje */
  ...[['2024-12-01', { k: 'fabrica', ate: '2025-03-10' }], ['2025-03-10', { k: 'fabrica', ate: '2025-03-10' }], ['2025-03-11', { k: 'estendida', ate: '2026-03-10' }], ['2026-03-10', { k: 'estendida', ate: '2026-03-10' }], ['2026-03-11', { k: 'encerrados', ate: '2026-03-10' }]]
    .map(([h, e]) => ['situacao', [G({ compra: { entrega: '2024-03-12' }, estendida: { tem: 'sim', meses: 12, contaDe: 'fimFabrica' } }), h], e, 'situação em ' + h + ' (fábrica, depois estendida 12 meses): ' + e.k]),
  ['situacao', [G(), '2025-04-01'], { k: 'lei', ate: '2025-03-10', alt: '2025-06-08' }, 'situação sem estendida depois da de fábrica: prazo da lei, talvez até 08/jun/2025'],
  ['situacao', [{ v: 1 }, '2025-04-01'], { k: 'faltam' }, 'situação só com o nome: falta a data da compra'],
  ['situacao', [G({ fabrica: { meses: null, fim: '2025-03-10', legalInclusa: 'sim' }, estendida: { tem: 'sim', inicio: '2025-09-01' } }), '2025-05-01'], { k: 'espera', ate: '2025-09-01' }, 'situação com a estendida começando depois: "começa em 01/set/2025"'],
  ['situacao', [E({ meses: 24, contaDe: 'naosei' }), '2026-06-01'], { k: 'talvezEst', ate: '2026-03-10', alt: '2027-03-10' }, 'situação 24 meses "não sei" em jun/2026: talvez ainda na estendida'],
  ['situacao', [E({ inicio: '2025-03-11' }), '2025-04-01'], { k: 'faltaFim' }, 'situação com a estendida sem fim: "falta o fim"'],
  ['situacao', [AT([{ id: 'a1', d: '2025-05-01', quem: 'loja', situacao: 'aberto' }]), '2025-08-01'], { k: 'reclamado', desde: '2025-05-01', dias: 92 }, 'situação com reclamação aberta na loja, feita no prazo: "reclamação aberta desde 01/mai (92 dias)"'],
  ['situacao', [AT([{ id: 'a1', d: '2025-05-01', quem: 'loja', situacao: 'negado' }]), '2025-08-01'], { k: 'encerrados' }, 'situação com a reclamação negada: as garantias acabaram'],
  ['situacao', [AT([{ id: 'a1', d: '2025-08-01', quem: 'loja', situacao: 'aberto' }]), '2025-09-01'], { k: 'encerrados' }, 'reclamação feita depois de todos os prazos não segura nada'],
  ['situacao', [G({ defeitos: [{ id: 'd1', desc: 'Botão Exemplo', apareceu: '2025-07-01' }] }), '2025-08-01'], { k: 'defeito', desde: '2025-07-01', ate: '2025-09-29' }, 'situação com defeito anotado e sem reclamar: "reclame até 29/set/2025"'],
  ['situacao', [G({ saiu: SAIU }), '2025-02-01'], { k: 'saiu', desde: '2025-01-01' }, 'situação de coisa que saiu de casa (doada): só histórico'],
  ['situacao', [G({ fabrica: { meses: null }, estendida: { tem: 'sim', inicio: '2024-09-10', fim: '2026-09-10' } }), '2025-01-01'], { k: 'estendida', ate: '2026-09-10' }, 'situação com bilhete 2024→2026 e fábrica não informada: na estendida'],
  ['situacao', [{ v: 2, compra: { data: '2024-03-10' } }, '2025-01-01'], null, 'situação de garantia de versão mais nova: null'],
  ['situacao', [G(), 'x'], null, 'situação com "hoje" ruim: null'],
  /* próximo fim */
  ['proximoFim', [G(), '2025-01-01'], '2025-03-10', 'próximo fim na de fábrica: 10/mar/2025'],
  ['proximoFim', [G(), '2025-04-01'], '2025-06-08', 'próximo fim depois da de fábrica: o "talvez" da lei'],
  ['proximoFim', [G(), '2025-07-01'], null, 'próximo fim quando tudo acabou: null'],
  ['proximoFim', [G({ saiu: SAIU }), '2024-06-01'], null, 'próximo fim de coisa que saiu de casa: null'],
  ['proximoFim', [E({ meses: 12, contaDe: 'fimFabrica' }), '2025-07-01'], '2026-03-10', 'próximo fim na estendida: 10/mar/2026'],
  /* avisos */
  ['avisos', [F(), '2025-02-10'], [{ tipo: 'fab', marco: 30, data: '2025-03-12', dias: 30, depois: false }], 'aviso de 30 dias da de fábrica'],
  ['avisos', [F(), '2025-02-09'], [], '31 dias antes: nenhum aviso'],
  ['avisos', [F(), '2025-03-05'], [{ tipo: 'fab', marco: 7, dias: 7 }], 'aviso de 7 dias da de fábrica'],
  ['avisos', [F(), '2025-03-12'], [{ tipo: 'fab', marco: 7, dias: 0 }], 'aviso no último dia ("hoje")'],
  ['avisos', [F(), '2025-03-13'], [], 'depois de acabar: nenhum aviso'],
  ['avisos', [F({ estendida: { tem: 'sim', inicio: '2025-03-13', fim: '2026-03-12' } }), '2025-03-13'], [{ tipo: 'estIni', marco: 0, data: '2025-03-13' }], 'aviso "hoje começou a estendida"'],
  ['avisos', [F({ estendida: { tem: 'sim', inicio: '2025-03-13', fim: '2026-03-12' } }), '2025-03-16'], [{ tipo: 'estIni' }], 'o aviso do começo fica até 3 dias'],
  ['avisos', [F({ estendida: { tem: 'sim', inicio: '2025-03-13', fim: '2026-03-12' } }), '2025-03-17'], [], 'no 4º dia, o aviso do começo some'],
  ['avisos', [F({ saiu: SAIU }), '2025-03-05'], [], 'coisa que saiu de casa: nenhum aviso'],
  ['avisos', [G({ fabrica: { meses: 24 }, estendida: { tem: 'sim', inicio: '2026-03-11', fim: '2027-03-10' } }), '2027-02-08'], [{ tipo: 'est', marco: 30, data: '2027-03-10' }], 'aviso de 30 dias do fim da estendida'],
  ['avisos', [G({ fabrica: { meses: 24 }, estendida: { tem: 'sim', inicio: '2026-03-11', fim: '2027-03-10' } }), '2027-03-03'], [{ tipo: 'est', marco: 7, data: '2027-03-10' }], 'aviso de 7 dias do fim da estendida'],
  ['avisos', [E({ inicio: '2024-03-10', fim: '2027-03-10' }), '2025-03-11'], [{ tipo: 'estIni', data: '2025-03-11' }], 'bilhete desde a compra: o começo é avisado quando o seguro passa a cobrir'],
  ['avisos', [E({ inicio: '2024-03-10', fim: '2027-03-10' }), '2024-03-12'], [], '... e nunca no começo do contrato'],
  ['avisos', [E({ meses: 24, contaDe: 'naosei' }), '2026-02-08'], [{ tipo: 'est', marco: 30, data: '2026-03-10' }], 'estendida "não sei": avisa pela data mais cedo'],
  ['avisos', [E({ meses: 12, contaDe: 'naosei' }), '2026-02-08'], [{ tipo: 'est', marco: 30, data: '2026-03-10' }], 'estendida que pela compra já acabou: avisa no "talvez"'],
  ['avisos', [E({ meses: 12, contaDe: 'fimFabrica' }), '2025-02-08'], [{ tipo: 'fab', marco: 30, depois: true }], 'aviso da de fábrica sabe que a estendida emenda no dia seguinte'],
  ['avisos', [G(), '2025-02-08'], [{ tipo: 'fab', marco: 30, depois: false }], 'sem estendida: "depois" falso'],
  ['avisos', [E({ inicio: '2025-03-11', fim: '2026-03-10', cancelada: true }), '2026-03-05'], [], 'estendida cancelada: sem aviso'],
  ['avisos', [{ v: 2, compra: { data: '2024-03-10' }, fabrica: { fim: '2025-03-12' } }, '2025-03-05'], [], 'versão mais nova: sem aviso'],
  /* contador dos 30 dias (CDC art. 18) e o da seguradora */
  ['art18', [AT([A1, A2]), 'df1', '2025-01-31'], { primeira: '2025-01-01', dias: 30, idas: 2, aberto: true, negado: false, hoje30: true, passou30: false }, 'contador: 2 contatos com a loja, hoje é o 30º dia'],
  ['art18', [AT([A1, A2]), 'df1', '2025-02-01'], { dias: 31, hoje30: false, passou30: true }, 'contador: passaram os 30 dias (31)'],
  ['art18', [AT([A1, Object.assign({}, A2, { d: '2025-01-15', situacao: 'resolvido' })]), 'df1', '2025-02-01'], { dias: 14, aberto: false, hoje30: false, passou30: false }, 'contador: resolvido em 15/jan para em 14 dias'],
  ['art18', [AT([A1, Object.assign({}, A2, { situacao: 'negado' })]), 'df1', '2025-01-25'], { aberto: true, negado: true }, 'contador: a última resposta foi "não"'],
  ['art18', [AT([A1, A2, SEG]), 'df1', '2025-01-31'], { primeira: '2025-01-01', idas: 2, dias: 30 }, 'a seguradora fica fora do contador dos 30 dias para consertar'],
  ['seguro', [AT([A1, A2, SEG]), 'df1', '2025-01-31'], { primeira: '2024-12-20', idas: 1, dias: 42, aberto: true }, '... e entra no contador da seguradora (42 dias desde o aviso)'],
  ['seguro', [AT([A1, A2]), 'df1', '2025-01-31'], null, 'sem ida à seguradora: o contador dela não existe'],
  ['art18', [AT([A1, A2, { id: 'a3', d: '2024-12-01', quem: 'loja', situacao: 'aberto', defeito: 'df2' }]), 'df1', '2025-01-31'], { primeira: '2025-01-01', idas: 2 }, 'contato de outro defeito não entra na conta'],
  ['art18', [G({ saiu: SAIU, atendimentos: [A1, A2] }), 'df1', '2025-02-01'], { aberto: false, hoje30: false, passou30: false }, 'coisa que saiu de casa: o contador fica só como histórico'],
  ['art18', [G(), 'df1', '2025-01-31'], null, 'sem contatos: sem contador'],
  /* final4 e a leitura */
  ['final4', ['PED-00012345'], '2345', 'final de "PED-00012345" = "2345"'],
  ['final4', ['12'], '12', 'final de "12" = "12"'],
  ['final4', [null], '', 'final de nada = ""'],
  ['ler', [{ id: 't1', garantia: { fabrica: { meses: 1e9 } } }], { fabrica: { meses: null } }, 'ler: 1 bilhão de meses vira "não sei"'],
  ['ler', [{ id: 't1', garantia: { compra: { data: '0024-03-10' } } }], { compra: { data: '' } }, 'ler: o ano 0024 vira vazio'],
  ['ler', [{ id: 't1', garantia: { estendida: { acionar: { app: 'javascript:alert(1)' } } } }], { estendida: { acionar: { app: '' } } }, 'ler: link "javascript:" sai'],
  ['ler', [{ id: 't1', garantia: { estendida: { acionar: { app: 'http://exemplo.com.br' } } } }], { estendida: { acionar: { app: '' } } }, 'ler: link sem https sai'],
  ['ler', [{ id: 't1', garantia: { estendida: { acionar: { app: 'https://exemplo.com.br' } } } }], { estendida: { acionar: { app: 'https://exemplo.com.br' } } }, 'ler: link https fica'],
  ['ler', [{ id: 't1', garantia: { estendida: { quem: 'xyz' } } }], { estendida: { quem: 'naosei' } }, 'ler: quem cobre desconhecido vira "não sei"'],
  ['ler', [{ id: 't1', garantia: 'texto' }], null, 'ler: garantia que não é objeto → null'],
  ['ler', [{ id: 't1', garantia: { atendimentos: Array.from({ length: 3000 }, (_, i) => ({ id: 'at' + i, d: '2025-01-01', quem: 'loja' })) } }], (r) => r.atendimentos.length === 50, 'ler: 3000 atendimentos viram 50'],
  ['ler', [{ id: 't1', garantia: { defeitos: Array.from({ length: 100 }, (_, i) => ({ id: 'df' + i })), arquivos: Array.from({ length: 100 }, (_, i) => ({ id: 'f' + i, tipo: 'xyz' })) } }], (r) => r.defeitos.length === 20 && r.arquivos.length === 30 && r.arquivos[0].tipo === 'nota', 'ler: até 20 defeitos e 30 papéis; papel de tipo desconhecido vira "nota" (o mais protegido)'],
  ['ler', [{ id: 't1', garantia: { atendimentos: [{ d: '2025-01-01' }, { id: 'a1' }, { id: 'a1' }, null, 5, { id: { x: 1 } }] } }], (r) => r.atendimentos.length === 1 && r.atendimentos[0].id === 'a1', 'ler: item sem id (ou repetido, ou que não é objeto) sai'],
  ['ler', [{ id: 't1', garantia: { v: 2, compra: { data: '2024-03-10' } } }], (r) => JSON.stringify(r) === '{"_novo":true}', 'ler: versão mais nova → { _novo: true }'],
  ['ler', [{ id: 't1', garantia: { ref: 5, vaultId: 'item-do-carro' } }], { ref: 'gar_t1', vaultId: 'gv_t1' }, 'ler: ref fixo "gar_" + id e o item das Senhas sempre "gv_" + id (nunca o de outra coisa)'],
  ['ler', [{ id: 't1', garantia: { ref: 'exemplo-0001' } }], { ref: 'exemplo-0001' }, 'ler: o ref de um arquivo trazido fica'],
  ['ler', [{ id: 't1', garantia: { obs: 'x'.repeat(5000), estendida: { acionar: { tel: 'x'.repeat(400), whats: 'x'.repeat(50) } }, atendimentos: [{ id: 'a1', protocolo: 'x'.repeat(100), oque: 'x'.repeat(900), com: 'x'.repeat(100) }] } }],
    (r) => r.obs.length === 1000 && r.estendida.acionar.tel.length === 300 && r.estendida.acionar.whats.length === 30 && r.atendimentos[0].protocolo.length === 60 && r.atendimentos[0].oque.length === 500 && r.atendimentos[0].com.length === 80, 'ler: textos cortados nos limites (obs 1000, telefones 300, WhatsApp 30, protocolo 60, o que disseram 500, com quem 80)'],
  ['ler', [{ id: 't1', garantia: { finais: { pedido: PEDIDO, bilhete: 12345678, serie: 'SN-ABC-9876' } } }], { finais: { pedido: '0001', bilhete: '', serie: '9876' } }, 'ler: os "finais" nunca guardam o número completo'],
  ['ler', [{ id: 't1', garantia: { saiu: 'doado' } }], { saiu: null }, 'ler: "saiu" que não é objeto não vale'],
  ['ler', [{ id: 't1', garantia: { saiu: { como: 'xyz', em: '2025-02-30' } } }], { saiu: { como: 'outro', em: '' } }, 'ler: "saiu" com jeito desconhecido vira "outro"'],
  ['ler', [{ id: 't1', garantia: {} }], { v: 1, ref: 'gar_t1', duravel: true, compra: { data: '', entrega: '', loja: '' }, fabrica: { meses: null, fim: '', legalInclusa: 'naosei' }, estendida: { tem: 'naosei', quem: 'naosei', contaDe: 'naosei', cancelada: false, acionar: { daIA: false } }, saiu: null, origem: 'manual', obs: '' }, 'ler: garantia vazia ganha os padrões'],
  ['ler', [null], null, 'ler: sem objeto → null'],
  ['ler', [{ id: 't1' }], null, 'ler: objeto sem garantia → null'],
  ['ler', [{ id: 't1', garantia: [] }], null, 'ler: garantia em lista → null'],
  ['ler', [{ id: 't1', garantia: { marca: 5, modelo: XSS } }], { marca: '', modelo: XSS }, 'ler: texto que não é texto vira vazio (o resto é escapado ao desenhar)']
];

/* o exemplo do desenho (§5.2), só com valores de mentira */
const EX = { formato: 'omnilife.garantias', versao: 1, geradoEm: '2026-11-23',
  itens: [{ ref: 'exemplo-0001', nome: 'Purificador Exemplo', marca: 'Marca Exemplo', modelo: 'PX-100', duravel: true,
    compra: { data: '2024-03-10', entrega: '', loja: 'Loja Exemplo', vendedor: '' },
    fabrica: { meses: 12, fim: '', legalInclusa: 'naosei' },
    estendida: { tem: 'sim', quem: 'loja', seguradora: '', contaDe: 'naosei', inicio: '', fim: '', meses: 24, emitidoEm: '', acionar: { tel: 'Central: 0800 000 0000', whats: '', app: 'https://exemplo.com.br' }, situacao: '' },
    saiu: null,
    protegido: { pedido: PEDIDO, bilhete: '', serie: '', chaveNF: CHAVE, valorCent: 50000, precoCent: 9990, pagamento: 'cartao', cartaoFinal: '0000' },
    arquivos: [], atendimentos: [{ data: '2026-11-20', quem: 'loja', com: 'Central Exemplo', protocolo: 'PROT-0001', oque: 'Aguardando peça', situacao: 'aberto', defeito: 'Botão Exemplo' }],
    obs: 'Entrega não informada no e-mail' }] };
const X1 = (o) => Object.assign({}, EX, { itens: [fundir(EX.itens[0], o)] });
const PDF64 = Buffer.from('%PDF-1.4\n% exemplo\n').toString('base64'), JPG64 = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0, 16, 74, 70, 73, 70, 0, 1]).toString('base64'), HTML64 = Buffer.from('<html><script>alert(1)</script></html>').toString('base64');
const nao = (re) => (r) => r && r.ok === false && typeof r.erro === 'string' && (!re || re.test(r.erro));
const CASOS_VALIDAR = [
  ['validar', [EX], (r) => r.ok === true && r.itens.length === 1, 'arquivo: o exemplo do desenho entra'],
  ['validar', [JSON.stringify(EX)], (r) => r.ok === true && r.itens.length === 1, 'arquivo: o mesmo exemplo em texto (como vem do arquivo) entra'],
  ['validar', ['{"formato":"omnilife.garantias","itens":[' + PEDIDO], nao(/^(?!.*PEDIDO)/), 'arquivo quebrado: recusado com mensagem fixa (sem um pedaço do arquivo)'],
  ['validar', [Object.assign({}, EX, { formato: 'outra.coisa' })], nao(), 'arquivo de outro formato: recusado'],
  ['validar', [Object.assign({}, EX, { versao: 2 })], nao(/mais nova/), 'arquivo de versão mais nova: "Atualize o app"'],
  ['validar', [Object.assign({}, EX, { versao: '1' })], nao(), 'versão que não é número: recusado'],
  ['validar', [Object.assign({}, EX, { itens: [] })], nao(), 'arquivo sem garantias: recusado'],
  ['validar', [Object.assign({}, EX, { itens: Array.from({ length: 301 }, (_, i) => fundir(EX.itens[0], { ref: 'exemplo-' + i })) })], nao(), 'arquivo com mais de 300 garantias: recusado'],
  ['validar', [X1({ ref: 'a b' })], nao(/Item 1/), 'ref com espaço: recusa dizendo o item'],
  ['validar', [Object.assign({}, EX, { itens: [EX.itens[0], EX.itens[0]] })], nao(/Item 2/), 'ref repetido no arquivo: recusa o 2º'],
  ['validar', [X1({ ref: 'constructor' })], (r) => r.ok === true && r.itens[0].ref === 'constructor', 'ref "constructor" (como valor) entra'],
  ['validar', ['{"formato":"omnilife.garantias","versao":1,"itens":[{"ref":"exemplo-0001","nome":"X","__proto__":{"ok":1}}]}'], nao(), 'chave "__proto__" no arquivo: recusado'],
  ['validarObj', ['{"formato":"omnilife.garantias","versao":1,"itens":[{"ref":"exemplo-0001","nome":"X","compra":{"constructor":{"prototype":1}}}]}'], nao(), 'chave "constructor" num objeto já lido: recusado'],
  ['validar', [X1({ compra: { data: '2024-02-30' } })], nao(/Item 1, 'Purificador Exemplo': data da compra inválida/), "data inválida: \"Item 1, 'Purificador Exemplo': data da compra inválida\""],
  ['validar', [X1({ estendida: { situacao: 'cancelada' } })], (r) => r.ok && r.itens[0].garantia.estendida.cancelada === true, 'estendida "cancelada" vira cancelada'],
  ['validar', [X1({ estendida: { situacao: 'reemitida' } })], (r) => r.ok && r.itens[0].garantia.estendida.cancelada === false && /bilhete reemitido/.test(r.itens[0].garantia.obs), 'estendida "reemitida" fica valendo, com "bilhete reemitido" nas observações'],
  ['validar', [X1({ estendida: { situacao: 'ativa' } })], (r) => r.ok && r.itens[0].garantia.estendida.cancelada === false && r.itens[0].garantia.obs === 'Entrega não informada no e-mail', 'estendida "ativa" é ignorada (o estado sai das datas)'],
  ['validar', [X1({ estendida: { situacao: 'xyz' } })], nao(/Item 1/), 'situação da estendida desconhecida: recusado'],
  ['validar', [X1({ saiu: { como: 'doado', em: '2025-01-01', obs: 'Doado a um parente' } })], (r) => r.ok && r.itens[0].garantia.saiu.como === 'doado' && r.itens[0].garantia.saiu.em === '2025-01-01', '"saiu de casa" (doado) entra'],
  ['validar', [X1({ protegido: { valorCent: -1 } })], nao(), 'valor negativo: recusado'],
  ['validar', [X1({ protegido: { valorCent: 1.5 } })], nao(), 'valor com fração de centavo: recusado'],
  ['validar', [X1({ protegido: { valorCent: 2e9 } })], nao(), 'valor acima de 10 milhões: recusado'],
  ['validar', [X1({ protegido: { cartaoFinal: '12' } })], nao(), 'final do cartão sem 4 números: recusado'],
  ['validar', [X1({ arquivos: [{ tipo: 'termo', base64: PDF64 }, { tipo: 'manual', base64: JPG64 }] })], (r) => r.ok && r.itens[0].arquivos.length === 2 && r.itens[0].arquivos[0].mime === 'application/pdf' && r.itens[0].arquivos[0].nome === 'folheto.pdf' && r.itens[0].arquivos[1].mime === 'image/jpeg' && r.itens[0].arquivos[1].nome === 'manual.jpg', 'folheto em PDF e manual em JPG entram, com o tipo pelos primeiros bytes e o nome pelo tipo'],
  ['validar', [X1({ arquivos: [{ tipo: 'nota', base64: PDF64 }] })], nao(), 'nota fiscal no arquivo: recusado (só folheto e manual)'],
  ['validar', [X1({ arquivos: [{ tipo: 'termo', base64: HTML64 }] })], nao(), '"PDF" que é uma página HTML: recusado'],
  ['validar', [X1({ arquivos: [{ tipo: 'termo', base64: '###' }] })], nao(), 'base64 inválido: recusado'],
  ['validar', [X1({ estendida: { quem: 'xyz' } })], nao(), 'quem cobre desconhecido: recusado'],
  ['validar', [X1({ foo: 1, estendida: { bar: 2 } })], (r) => r.ok && !('foo' in r.itens[0].garantia) && !('bar' in r.itens[0].garantia.estendida), 'chave desconhecida é ignorada'],
  ['validar', [X1({ estendida: { acionar: { app: 'javascript:alert(1)' } } })], nao(), 'link "javascript:" no app: recusado'],
  ['validar', [X1({ nome: 'x'.repeat(81) })], nao(), 'nome com mais de 80 letras: recusado'],
  ['validar', [X1({ nome: '' })], nao(), 'sem nome: recusado'],
  ['validar', [X1({ atendimentos: Array.from({ length: 51 }, () => ({ data: '2026-11-20', quem: 'loja' })) })], nao(), 'mais de 50 atendimentos: recusado'],
  ['validar', [null], nao(), 'nada: recusado sem erro'],
  ['validar', [5], nao(), 'número: recusado sem erro'],
  ['validar', ['[]'], nao(), 'lista vazia: recusada sem erro'],
  ['validar', ['{"a":'.repeat(5000) + '1' + '}'.repeat(5000)], nao(), 'arquivo com 5000 níveis: recusado sem erro']
];

/* roda os casos na página e devolve [{ r } | { lancou }] */
const rodar = (p, casos) => p.evaluate((casos) => casos.map(([fn, args]) => {
  try {
    if (fn === 'ler') return { r: Garantias.ler(args[0]) };
    if (fn === 'validar') return { r: Garantias.validar(args[0]) };
    if (fn === 'validarObj') return { r: Garantias.validar(JSON.parse(args[0])) };
    return { r: GarCalc[fn].apply(GarCalc, args) };
  } catch (e) { return { lancou: String((e && e.message) || e) }; }
}), casos.map((c) => [c[0], c[1]]));
const conferirCasos = (casos, res, prefixo) => casos.forEach((c, i) => {
  const x = res[i];
  conferir(!x.lancou && bate(x.r, c[2]), (prefixo || '') + c[3] + (x.lancou ? ' (lançou: ' + x.lancou + ')' : bate(x.r, c[2]) ? '' : ' (veio ' + JSON.stringify(x.r) + ')'));
});

(async () => {
  const browser = await iniciar();
  console.log('\n[celular, só neste aparelho]');
  const { p, lixo } = await abrirApp(browser, 'celular', { semEntrar: true });
  const consoleTxt = []; p.on('console', (m) => consoleTxt.push(m.text()));
  await p.evaluate(() => ACT['gate.local']());
  await p.waitForSelector('#fn', { timeout: 10000 });
  await p.fill('#fn', 'Família Teste'); await p.fill('#mn', 'Pessoa Teste'); await p.click('#go');
  await p.waitForFunction(() => S.booted, null, { timeout: 15000 });
  await p.waitForTimeout(600); await fecharJanelas(p);
  await p.evaluate(async () => {
    await Vault.setup('senha-de-mentira-123'); AOne.save({ hello: 1, tips: { house: 1, cars: 1, garantias: 1 } });
    S.prefs.telem = true;
    window.__mt = []; Bridge.post = (m) => { window.__mt.push(m); };
    window.__rpc = []; const rpc0 = Conta.rpc.bind(Conta); Conta.rpc = (n, a) => { window.__rpc.push(n); return rpc0(n, a); };
  });

  /* ---------- A: as contas ---------- */
  console.log('\n— A: as contas (GarCalc) e a leitura (Garantias.ler)');
  conferirCasos(CASOS, await rodar(p, CASOS));

  /* ---------- o arquivo "omnilife.garantias" ---------- */
  console.log('\n— o arquivo de garantias prontas (Garantias.validar)');
  conferirCasos(CASOS_VALIDAR, await rodar(p, CASOS_VALIDAR));
  const ex = await p.evaluate((ex) => { try { const r = Garantias.validar(ex); if (!r.ok) return { erro: r.erro }; const it = r.itens[0]; return { it, ida: Garantias.ler({ id: 'x1', garantia: it.garantia }) }; } catch (e) { return { erro: e.message }; } }, EX);
  const it = ex.it || {}, g = it.garantia || {};
  conferir(it.ref === 'exemplo-0001' && it.nome === 'Purificador Exemplo' && g.marca === 'Marca Exemplo' && g.modelo === 'PX-100' && g.compra && g.compra.data === '2024-03-10' && g.compra.loja === 'Loja Exemplo' && g.fabrica.meses === 12 && g.origem === 'importado' && g.ref === 'exemplo-0001', 'arquivo: o item vira uma garantia com o ref do arquivo, a marca, o modelo, a compra, a fábrica e "importado"');
  conferir(g.estendida && g.estendida.tem === 'sim' && g.estendida.quem === 'loja' && g.estendida.contaDe === 'naosei' && g.estendida.meses === 24 && g.estendida.acionar.tel === 'Central: 0800 000 0000' && g.estendida.acionar.app === 'https://exemplo.com.br' && g.estendida.cancelada === false, 'arquivo: a estendida pela loja, 24 meses "não sei", com o telefone e o app');
  const at0 = (g.atendimentos || [])[0] || {}, df0 = (g.defeitos || [])[0] || {};
  conferir(at0.d === '2026-11-20' && at0.quem === 'loja' && at0.com === 'Central Exemplo' && at0.protocolo === 'PROT-0001' && at0.oque === 'Aguardando peça' && at0.situacao === 'aberto' && !!at0.id && !!df0.id && at0.defeito === df0.id && df0.desc === 'Botão Exemplo', 'arquivo: o atendimento entra com id, e o defeito em texto vira um defeito ligado a ele');
  const pr = it.protegido || {};
  conferir(pr.pedido === PEDIDO && pr.chaveNF === CHAVE && pr.valorCent === 50000 && pr.precoCent === 9990 && pr.pagamento === 'cartao' && pr.cartaoFinal === '0000' && pr.number === '', 'arquivo: pedido, chave da nota, valor, preço da estendida, pagamento e final do cartão ficam à parte (para as Senhas da casa)');
  conferir(g.finais && g.finais.pedido === '0001' && !JSON.stringify(g).includes(PEDIDO) && !JSON.stringify(g).includes(CHAVE) && !JSON.stringify(g).includes('50000'), 'arquivo: na garantia (que vai em claro para o objeto) só o final do pedido; nem o pedido, nem a chave, nem o valor');
  conferir(!!ex.ida && canon(ex.ida) === canon(Object.assign({}, g, { vaultId: 'gv_x1' })), 'arquivo: o que o arquivo monta passa pela leitura sem mudar nada');

  /* ---------- lixo: nenhuma conta lança erro ---------- */
  console.log('\n— lixo');
  const lancou = await p.evaluate((XSS) => {
    const ruins = [null, undefined, 5, 'x', [], {}, { v: 'x' }, { v: 1, compra: 'x', fabrica: 5, estendida: [], atendimentos: 'x', defeitos: {}, arquivos: 7, saiu: [] },
      { v: 1, compra: { data: {}, entrega: [] }, fabrica: { meses: '12', fim: 20250101, legalInclusa: {} }, estendida: { tem: 'sim', inicio: [], fim: {}, meses: -5, contaDe: {}, quem: [], acionar: 'x' }, atendimentos: [null, 5, 'x', { d: {}, quem: [], defeito: {} }, { id: 'a', d: '2025-01-01', quem: 'loja', situacao: {} }], defeitos: [null, { apareceu: 5 }, { id: 'd', apareceu: '2025-01-01' }], saiu: 'x' },
      { v: 1, compra: { data: '2024-03-10' }, fabrica: { meses: 1e9 }, estendida: { tem: 'sim', inicio: '0024-01-01', fim: '9999-99-99', meses: 1e9, acionar: { app: 'javascript:window.__xss=1', tel: XSS } }, obs: XSS },
      { v: 1, compra: { data: '2100-12-31' }, fabrica: { meses: 240 }, estendida: { tem: 'sim', meses: 240 } }, { v: 1, compra: { data: '1990-01-01' }, estendida: { tem: 'sim', inicio: '1990-01-01' } }];
    const hojes = ['2025-01-01', '', null, 5, '2025-02-30'], fns = ['fabrica', 'lei', 'estendida', 'legalDias', 'situacao', 'curta', 'proximoFim', 'avisos', 'art18', 'seguro', 'final4', 'ehData', 'somaDias', 'diasEntre', 'somaMeses'];
    const out = [];
    for (const g of ruins) for (const h of hojes) for (const fn of fns) {
      try { if (typeof GarCalc[fn] !== 'function') throw new Error('sem a função ' + fn); GarCalc[fn](g, fn === 'art18' || fn === 'seguro' ? 'd' : h, h); GarCalc[fn](Garantias.ler({ id: 't', garantia: g }), h); GarCalc.curta(GarCalc.situacao(Garantias.ler({ id: 't', garantia: g }), h)); } catch (e) { out.push(fn + '(' + JSON.stringify(g) + ', ' + JSON.stringify(h) + '): ' + e.message); }
    }
    for (const g of ruins) { try { Garantias.ler({ id: 't', garantia: g }); Garantias.ler(g); Garantias.validar(g); } catch (e) { out.push('ler/validar(' + JSON.stringify(g) + '): ' + e.message); } }
    return out;
  }, XSS);
  conferir(!lancou.length, 'nenhuma conta, leitura ou conferência lança erro com lixo' + (lancou.length ? ': ' + lancou.slice(0, 3).join(' | ') : ''));
  const curtas = await p.evaluate(() => typeof GarCalc === 'undefined' ? [] : ['fabrica', 'estendida', 'talvezEst', 'lei', 'reclamado', 'defeito', 'espera', 'encerrados', 'faltam', 'faltaFim', 'saiu'].map((k) => GarCalc.curta({ k, ate: '2025-03-10', alt: '2025-06-08', desde: '2025-01-01', dias: 3, est: true })));
  conferir(curtas.length === 11 && curtas.every((c) => typeof c === 'string' && c.length > 3) && new Set(curtas).size === 11 && /^✅/.test(curtas[0]) && /10\/Mar\/2025/.test(curtas[0]) && /≈/.test(curtas[0]) && /^📦/.test(curtas[10]), 'cada situação tem a sua frase curta (✅ Fábrica até ≈10/Mar/2025 … 📦 Saiu de casa)');

  /* ---------- lixo nas telas que já existem ---------- */
  const ids = await p.evaluate(async (XSS) => {
    const pl = await DB.put('places', { name: 'Cozinha Exemplo', kind: 'comodo', parent: '' }, true);
    const cheio = { v: 1, ref: XSS, duravel: XSS, marca: XSS, modelo: XSS, dono: XSS, compra: { data: '0024-03-10', entrega: XSS, loja: XSS, vendedor: XSS }, fabrica: { meses: 1e9, fim: XSS, legalInclusa: XSS },
      estendida: { tem: 'sim', quem: XSS, seguradora: XSS, contaDe: XSS, inicio: XSS, fim: XSS, meses: XSS, emitidoEm: XSS, cancelada: XSS, acionar: { tel: XSS, whats: XSS, app: 'javascript:window.__xss=1', daIA: XSS } },
      saiu: { como: XSS, em: XSS, obs: XSS }, finais: { pedido: XSS, bilhete: XSS, serie: XSS }, vaultId: XSS, arquivos: [{ id: XSS, tipo: XSS, hash: XSS, em: XSS }], assistencia: XSS,
      defeitos: [{ id: 'df1', desc: XSS, apareceu: XSS }], atendimentos: [{ id: 'at1', d: XSS, quem: XSS, com: XSS, protocolo: XSS, oque: XSS, situacao: XSS, defeito: XSS }], origem: XSS, obs: XSS };
    const lista = [cheio, 'texto', { v: 99 }, null, { compra: 5, fabrica: [], estendida: 'x', saiu: 'doado', arquivos: { a: 1 }, atendimentos: [{ id: {}, d: [] }] }, { v: 1, compra: { data: '2024-03-10' }, fabrica: { meses: 1e9 }, estendida: { tem: 'sim', acionar: { app: 'javascript:window.__xss=1' } } }];
    const out = [];
    for (let i = 0; i < lista.length; i++) out.push((await DB.put('things', { name: 'Lixo ' + (i + 1) + (i === 0 ? ' ' + XSS : ''), place: pl.id, tags: ['lixo'], vis: 'familia', garantia: lista[i] }, true)).id);
    return { pl: pl.id, things: out };
  }, XSS);
  const limpo = async (onde) => {
    const r = await p.evaluate(() => ({ xss: !!window.__xss, onerror: [...document.querySelectorAll('[onerror]')].filter((e) => /__xss/.test(e.getAttribute('onerror'))).length,   /* o app tem onerror próprio (anúncio, guia) */ js: [...document.querySelectorAll('a[href], [src]')].filter((a) => /^\s*javascript:/i.test(a.getAttribute('href') || a.getAttribute('src') || '')).length }));
    conferir(!r.xss && !r.onerror && !r.js && !lixo.erros.length && !lixo.nativos.length, onde + ' abre com o lixo: sem alert, sem link javascript:, sem <img onerror> e sem erro' + (lixo.erros.length ? ' (' + lixo.erros[0] + ')' : '') + (r.xss || r.onerror || r.js ? ' (xss ' + r.xss + ', onerror ' + r.onerror + ', js ' + r.js + ')' : ''));
  };
  await p.evaluate(() => go('home')); await p.waitForTimeout(600); await limpo('Início');
  await p.evaluate(() => ACT.bell()); await p.waitForTimeout(400); await limpo('🔔 Avisos'); await fecharJanelas(p);
  await p.evaluate(() => go('agenda')); await p.waitForTimeout(600); await limpo('Agenda');
  await p.evaluate(() => Search.open()); await p.waitForSelector('#gsq', { timeout: 5000 }); await p.fill('#gsq', 'Lixo'); await p.waitForTimeout(500);
  conferir(await p.evaluate(() => document.querySelectorAll('#gsr .gsi').length >= 6), '🔍 acha os objetos com lixo'); await limpo('🔍 Buscar'); await fecharJanelas(p);
  await p.evaluate(() => { S.whereQ = 'Lixo'; go('house', 'where'); }); await p.waitForTimeout(500); await limpo('Onde está? (busca)');
  await p.evaluate((id) => { S.whereQ = ''; go('house', 'where', id); }, ids.pl); await p.waitForTimeout(500); await limpo('Onde está? (o lugar com os objetos)');
  /* a ficha da garantia entra na G3; o 🔔 e a Agenda com garantia, na G4 */

  /* ---------- B0: versão antiga editando o objeto ---------- */
  console.log('\n— B0: retrocompatibilidade');
  const G0 = { v: 1, ref: 'gar_x', duravel: true, marca: 'Marca Exemplo', modelo: 'PX-100', dono: '', compra: { data: '2024-03-10', entrega: '2024-03-12', loja: 'Loja Exemplo', vendedor: '' },
    fabrica: { meses: 12, fim: '', legalInclusa: 'naosei' }, estendida: { tem: 'sim', quem: 'loja', seguradora: '', contaDe: 'naosei', inicio: '', fim: '', meses: 24, emitidoEm: '', cancelada: false, acionar: { tel: 'Central: 0800 000 0000', whats: '', app: 'https://exemplo.com.br', daIA: false } },
    saiu: null, finais: { pedido: '0001', bilhete: '', serie: '' }, vaultId: 'gv_x', arquivos: [], assistencia: '', defeitos: [{ id: 'df1', desc: 'Botão Exemplo', apareceu: '2026-11-01' }],
    atendimentos: [{ id: 'at1', d: '2026-11-20', quem: 'loja', com: 'Central Exemplo', protocolo: 'PROT-0001', oque: 'Aguardando peça', situacao: 'aberto', defeito: 'df1' }], origem: 'manual', obs: '' };
  const tid = await p.evaluate(async (a) => (await DB.put('things', { name: 'Purificador Exemplo', place: a.pl, tags: ['agua'], vis: 'familia', garantia: a.g }, true)).id, { pl: ids.pl, g: G0 });
  await p.evaluate((id) => { S.whereQ = ''; go('house', 'where', id); }, ids.pl); await p.waitForTimeout(500);
  await p.click('[data-act="th.edit"][data-id="' + tid + '"]');
  const abriu = await p.waitForSelector('.modal [name="name"]', { timeout: 5000 }).then(() => true, () => false);
  conferir(abriu, 'o ✏️ do Onde está? abre o objeto com garantia');
  if (abriu) { await p.fill('.modal [name="desc"]', 'Na bancada da cozinha'); await p.click('.modal:has([name="name"]) [data-ok]'); await p.waitForTimeout(500); }
  const depois = await p.evaluate((id) => DB.get('things', id), tid);
  conferir(depois && depois.desc === 'Na bancada da cozinha' && canon(depois.garantia) === canon(G0), 'editar e salvar o objeto pelo formulário de antes mantém a garantia igual');
  await p.evaluate((pl) => { pinHere(pl, 10, 20); }, ids.pl);
  const pinAbriu = await p.waitForSelector('.modal [name="sel"]', { timeout: 5000 }).then(() => true, () => false);
  if (pinAbriu) { await p.selectOption('.modal [name="sel"]', 't:' + tid); await p.click('.modal:has([name="sel"]) [data-ok]'); await p.waitForTimeout(500); }
  const pin = await p.evaluate((id) => DB.get('things', id), tid);
  conferir(pinAbriu && pin && pin.pin && pin.pin.x === 10 && canon(pin.garantia) === canon(G0), '"Marcar na planta" mantém a garantia');
  const m3 = await p.evaluate((G0) => {
    const base = { id: 'x', name: 'Purificador Exemplo', place: '', updatedAt: '2026-11-01T00:00:00Z' };
    const a = merge3(base, Object.assign({}, base, { desc: 'mudou aqui' }), Object.assign({}, base, { garantia: G0 }));
    const comAt = (lista) => Object.assign({}, base, { garantia: Object.assign({}, G0, { atendimentos: lista }) });
    const at1 = G0.atendimentos[0], at2 = Object.assign({}, at1, { id: 'at2', d: '2026-11-21' }), at3 = Object.assign({}, at1, { id: 'at3', d: '2026-11-22', situacao: 'resolvido' });
    const b = merge3(comAt([at1]), comAt([at1, at2]), comAt([at1, at3]));
    /* dois celulares põem a garantia no mesmo objeto ao mesmo tempo */
    if (typeof Garantias === 'undefined') return { a: { conf: a.conflitos.length, g: JSON.stringify(a.doc.garantia) === JSON.stringify(G0), desc: a.doc.desc }, b: { conf: b.conflitos.length, ids: b.doc.garantia.atendimentos.map((x) => x.id).sort() }, c: {}, d: [] };
    const t = { id: 'th1', name: 'Purificador Exemplo' }, gA = Garantias.ler({ id: 'th1', garantia: { compra: { data: '2024-03-10' } } }), gB = Garantias.ler({ id: 'th1', garantia: { compra: { data: '2024-03-10' } } });
    const c = merge3(t, Object.assign({}, t, { garantia: gA }), Object.assign({}, t, { garantia: gB }));
    const gC = Garantias.ler({ id: 'th1', garantia: { compra: { data: '2024-03-10' }, obs: 'outro texto' } });
    const d = merge3(t, Object.assign({}, t, { garantia: gA }), Object.assign({}, t, { garantia: gC }));
    return { a: { conf: a.conflitos.length, g: JSON.stringify(a.doc.garantia) === JSON.stringify(G0), desc: a.doc.desc }, b: { conf: b.conflitos.length, ids: b.doc.garantia.atendimentos.map((x) => x.id).sort() },
      c: { conf: c.conflitos.length, refA: gA.ref, refB: gB.ref, v: gA.vaultId === gB.vaultId }, d: d.conflitos.map((x) => x.path.join('.')) };
  }, G0);
  conferir(m3.a.conf === 0 && m3.a.g && m3.a.desc === 'mudou aqui', 'nuvem: um celular sem a garantia muda o objeto e o outro põe a garantia → ficam as duas coisas, sem conflito');
  conferir(m3.b.conf === 0 && m3.b.ids.join(',') === 'at1,at2,at3', 'nuvem: atendimentos com ids diferentes nos dois celulares → ficam os dois');
  conferir(m3.c.conf === 0 && m3.c.refA === 'gar_th1' && m3.c.refB === 'gar_th1' && m3.c.v, 'nuvem: o mesmo objeto nos 2 celulares tem o mesmo ref e o mesmo item das Senhas, sem conflito');
  conferir(m3.d.length === 1 && m3.d[0] === 'garantia.obs', 'nuvem: se os dois mudam o mesmo texto, o conflito é só daquele campo (nunca do ref)');

  /* =====================================================================
     G2 — a aba 🧾 Garantias e a lista
     ===================================================================== */
  console.log('\n— G2: a aba 🧾 Garantias e a lista');
  const aba = await p.evaluate(() => {
    const ts = TABS().map((t) => t.id), subs = DRAWER_SUBS().garantias || [];
    return { depois: ts.includes('garantias') && ts.indexOf('garantias') === ts.indexOf('cars') + 1, ic: !!ICONS.garantias, vis: visibleTabs().some((t) => t.id === 'garantias'),
      casa: (DRAWER_GROUPS().find((g) => g.id === 'casa') || {}).tabs, barra: BarEd.choices().some((t) => t.id === 'garantias'),
      rec: Rec.TAB.garantias, acao: Rec.acao('gar.filtro'), ajuda: (Rec.AJUDA.garantias || []).join(','), subs: subs.map((x) => x[0]) };
  });
  conferir(aba.depois && aba.ic && aba.vis, 'a aba 🧾 Garantias existe, com ícone próprio, logo depois de 🚗 Veículos');
  conferir(JSON.stringify(aba.casa) === JSON.stringify(['house', 'cars', 'garantias', 'docs']), 'no ☰, no grupo "Casa, carro e papéis", depois de Veículos (' + JSON.stringify(aba.casa) + ')');
  conferir(aba.barra, 'dá para pôr a aba na barra de atalhos');
  conferir(aba.rec === 'casa.garantias' && aba.acao === 'casa.garantias' && aba.ajuda === 'casa.garantias' && aba.subs.includes('lista'), 'RootifyONE: a aba, os botões gar.* e a ajuda com o id casa.garantias (D-G6); a parte "Lista" no ☰');
  const recs = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'recursos-do-app.json'), 'utf8')).recursos, iG = recs.findIndex((r) => r.id === 'casa.garantias'), iP = recs.findIndex((r) => r.id === 'pets');
  conferir(iG > 0 && iG === iP + 1 && /Garantias/.test(recs[iG].nome.pt) && /Warranties/.test(recs[iG].nome.en) && /Função desligada/.test(recs[iG].onde.pt) && /turned off/.test(recs[iG].onde.en), 'recursos-do-app.json: casa.garantias (PT e EN) logo depois de pets');
  await p.evaluate(() => go('home')); await p.waitForTimeout(300);
  await p.click('#hambbtn'); await p.waitForTimeout(400);
  const gav = await p.evaluate(() => [...document.querySelectorAll('#drawer .ditem[data-dtab]')].map((b) => b.dataset.dtab));
  conferir(gav.includes('garantias') && gav.indexOf('garantias') === gav.indexOf('cars') + 1, 'o ☰ mostra 🧾 Garantias logo abaixo de 🚗 Veículos');
  await fecharJanelas(p); await p.waitForTimeout(200);

  /* a lista abre com o lixo da G1, o objeto do B0 e mais dois com <img onerror> no nome, na marca, no modelo e na loja */
  await p.evaluate(async (XSS) => {
    await DB.put('things', { name: 'Lixo G2a ' + XSS, place: '', tags: [], vis: 'familia', garantia: { v: 1, marca: XSS, modelo: XSS, compra: { data: GarCalc.somaDias(today(), -10), loja: XSS }, fabrica: { meses: 12 } } }, true);
    await DB.put('things', { name: 'Lixo G2b ' + XSS, place: '', tags: [], vis: 'familia', garantia: { v: 1, marca: XSS } }, true);
    S.garF = 'valendo'; go('garantias');
  }, XSS); await p.waitForTimeout(600);
  await limpo('🧾 Garantias (lista com o lixo, Valendo)');
  const lx = await p.evaluate(() => ({ novos: (document.querySelector('#screen .gar-novos') || {}).textContent || '', faltam: (document.querySelector('#screen .gar-faltam') || {}).textContent || '', lista: (document.querySelector('#screen .gar-lista') || {}).textContent || '', fb: Fb.tela() }));
  conferir(/Lixo 3/.test(lx.novos) && /atualize/i.test(lx.novos), 'garantia gravada por um app mais novo (v 99): aparece no topo, com "atualize o app"');
  conferir(/Lixo 5/.test(lx.faltam) && /Lixo G2b <img/.test(lx.faltam) && /Lixo G2a <img/.test(lx.lista), 'garantia estragada vai para "Faltam dados"; o <img onerror> aparece como texto, sem rodar');
  conferir(lx.fb.tela === 'garantias' && lx.fb.titulo === 'Garantias', '💬 "Dar uma opinião" sabe que a tela é a de Garantias (' + JSON.stringify(lx.fb) + ')');
  await p.evaluate(() => { S.garF = 'acabaram'; go('garantias'); }); await p.waitForTimeout(500);
  await p.evaluate(() => document.querySelectorAll('#screen .gar details').forEach((d) => (d.open = true))); await p.waitForTimeout(200);
  await limpo('🧾 Garantias (lista com o lixo, Acabaram e "Saíram de casa" aberto)');
  conferir(await p.evaluate(() => /Lixo 1 <img/.test((document.querySelector('#screen .gar-saiu') || {}).textContent || '')), 'o lixo com "saiu" de mentira fica em "Saíram de casa", sem quebrar');
  await p.evaluate(() => Search.open()); await p.waitForSelector('#gsq', { timeout: 5000 }); await p.fill('#gsq', 'Lixo G2'); await p.waitForTimeout(500);
  conferir(await p.evaluate(() => [...document.querySelectorAll('#gsr .gsi')].filter((b) => /Lixo G2a/.test(b.textContent)).length === 2), '🔍 acha o lixo na Casa e em Garantias'); await limpo('🔍 Buscar (garantias com lixo)'); await fecharJanelas(p);

  /* sem nenhuma garantia */
  await p.evaluate(async () => { for (const t of DB.raw('things')) await DB.del('things', t.id); go('garantias'); }); await p.waitForTimeout(500);
  const vz = await p.evaluate(() => ({ txt: document.querySelector('#screen').textContent, mais: document.querySelectorAll('#screen [data-act="gar.new"]').length }));
  conferir(/Nenhuma garantia ainda\. Toque em ＋ e escreva só o nome e a data da compra\./.test(vz.txt) && vz.mais === 1, 'sem garantia: "Nenhuma garantia ainda. Toque em ＋ e escreva só o nome e a data da compra." e um ＋');

  /* as garantias de mentira, com datas a partir de hoje */
  const fx = await p.evaluate(async () => {
    const h = today(), d = (n) => GarCalc.somaDias(h, n);
    const novo = async (name, garantia, vis) => (await DB.put('things', Object.assign({ name, place: '', tags: [], vis: vis || 'familia' }, garantia === undefined ? {} : { garantia }), true)).id;
    const fab = (fim, o) => Object.assign({ v: 1, compra: { data: d(-300), loja: 'Loja Exemplo' }, fabrica: { fim, legalInclusa: 'sim' } }, o || {});
    return {
      a: await novo('G2 Fab30', fab(d(30), { marca: 'Marca Exemplo', modelo: 'PX-100', finais: { pedido: '0001', bilhete: '', serie: '' } })),
      b: await novo('G2 Fab31', fab(d(31))),
      c: await novo('G2 Fab200', fab(d(200))),
      i: await novo('G2 Restrita', fab(d(100)), 'restrito'),
      e1: await novo('G2 Espera', { v: 1, compra: { data: d(-800) }, fabrica: { meses: 0 }, estendida: { tem: 'sim', inicio: d(10), fim: d(400) } }),
      e2: await novo('G2 Espera logo', { v: 1, compra: { data: d(-800) }, fabrica: { meses: 0 }, estendida: { tem: 'sim', inicio: d(5), fim: d(500) } }),
      f1: await novo('G2 Acabou recente', { v: 1, compra: { data: d(-800) }, fabrica: { meses: 12 } }),
      f2: await novo('G2 Acabou antiga', { v: 1, compra: { data: d(-2000) }, fabrica: { meses: 12 } }),
      s: await novo('G2 Doada', fab(d(30), { saiu: { como: 'doado', em: d(-10), obs: '' } })),
      x: await novo('G2 Sem data', { v: 1 }),
      n: await novo('G2 Nova versão', { v: 2, compra: { data: d(-10) } }),
      o: await novo('G2 Objeto sem garantia')
    };
  });
  const tela = (f) => p.evaluate((f) => {
    if (f) { S.garF = f; go('garantias'); }
    const scr = document.querySelector('#screen'), nomes = (sel) => [...scr.querySelectorAll(sel + ' .li .t')].map((e) => e.textContent.trim());
    const seg = scr.querySelector('.garf'), falt = scr.querySelector('.gar-faltam'), nov = scr.querySelector('.gar-novos'), saiu = scr.querySelector('.gar-saiu details');
    return { lista: nomes('.gar-lista > .list'), faltam: nomes('.gar-faltam'), novos: nomes('.gar-novos'), saiu: nomes('.gar-saiu'), saiuAberto: saiu ? saiu.open : null, saiuTit: saiu ? saiu.querySelector('summary').textContent : '',
      filtros: seg ? [...seg.querySelectorAll('[data-f]')].map((b) => b.dataset.f + ':' + b.textContent.replace(/\s+/g, ' ').trim() + (b.classList.contains('active') ? '*' : '')) : [],
      topo: !!(seg && falt && nov && (falt.compareDocumentPosition(seg) & Node.DOCUMENT_POSITION_FOLLOWING) && (nov.compareDocumentPosition(seg) & Node.DOCUMENT_POSITION_FOLLOWING)),
      txt: scr.textContent, linhas: [...scr.querySelectorAll('.gar-lista .li')].map((l) => [...l.querySelectorAll('.s')].map((e) => e.textContent).join(' | ')) };
  }, f);
  await p.evaluate(() => { S.garF = 'valendo'; go('garantias'); }); await p.waitForTimeout(500);
  let L = await tela();
  conferir(L.filtros.join(' / ') === 'valendo:✅ Valendo 4* / em30:⏰ Em 30 dias 1 / vai:⏳ Vai começar 2 / acabaram:— Acabaram 3', 'os 4 filtros com a contagem: ' + L.filtros.join(' / '));
  conferir(L.lista.join('|') === 'G2 Fab30|G2 Fab31|G2 Restrita|G2 Fab200', 'Valendo: o que acaba primeiro vem antes (' + L.lista.join(', ') + ')');
  conferir(L.faltam.join('|') === 'G2 Sem data' && L.novos.join('|') === 'G2 Nova versão' && L.topo, '"⚠️ Faltam dados (1)" e a de versão mais nova ficam no topo, antes dos filtros');
  conferir(/⚠️ Faltam dados \(1\)/.test(L.txt) && !L.lista.includes('G2 Objeto sem garantia') && !/G2 Objeto sem garantia/.test(L.txt), 'objeto do Onde está? sem garantia fica fora da lista');
  conferir(/^Marca Exemplo PX-100 · comprado em [A-Z][a-z]{2}\/\d{4} \| ✅ Fábrica até \d{2}\/[A-Z][a-z]{2}\/\d{4} · ⏰ em 30 dias$/.test(L.linhas[0]) && !/⏰/.test(L.linhas[1]), 'a linha: marca e modelo, "comprado em Mês/Ano", a frase curta e "em 30 dias" (só até 30) — ' + L.linhas[0]);
  conferir((L.txt.match(/≈ = conta do app; confira no folheto ou no bilhete/g) || []).length === 1, '"≈ = conta do app; confira no folheto ou no bilhete" uma vez, no topo da lista');
  conferir(/📌 Datas ≈ com o que você informou; vale o folheto e o bilhete\. Não é assessoria jurídica\./.test(L.txt) && /Pela lei brasileira \(CDC arts\. 18, 24, 26 e 50; Lei 15\.040\/2024; Circ\. SUSEP 659\/2022; Res\. CNSP 496\/2026\), conferido em 23\/Nov\/2026/.test(L.txt), 'rodapé de uma linha ("Não é assessoria jurídica") e as fontes, "pela lei brasileira", conferido em 23/Nov/2026');
  conferir(await p.evaluate((id) => !!document.querySelector('#screen .gar-lista .li[data-act="go"][data-tab="garantias"][data-sub="ficha"][data-arg="' + id + '"]'), fx.a), 'tocar na linha leva à ficha (garantias/ficha/<id>)');
  await p.click('#screen .garf [data-f="em30"]', { timeout: 3000 }).catch(() => {}); await p.waitForTimeout(400);
  L = await tela();
  conferir(L.lista.join('|') === 'G2 Fab30' && /em30:.*\*/.test(L.filtros[1]), 'Em 30 dias: a que acaba em 30 dias entra, a de 31 não');
  await tela('vai'); await p.waitForTimeout(400); L = await tela();
  conferir(L.lista.join('|') === 'G2 Espera logo|G2 Espera', 'Vai começar: só as estendidas que ainda não começaram, a que começa primeiro antes (' + L.lista.join(', ') + ')');
  await tela('acabaram'); await p.waitForTimeout(400); L = await tela();
  conferir(L.lista.join('|') === 'G2 Acabou recente|G2 Acabou antiga', 'Acabaram: a que acabou por último vem antes (' + L.lista.join(', ') + ')');
  conferir(L.saiu.join('|') === 'G2 Doada' && L.saiuAberto === false && /📦 Saíram de casa \(1\)/.test(L.saiuTit) && /📦 Saiu de casa/.test(L.txt), 'Acabaram: "📦 Saíram de casa (1)" fechado, com a doada');
  await tela('valendo'); await p.waitForTimeout(400); L = await tela();
  conferir(!L.lista.some((n) => /Espera|Doada|Acabou|Sem data|Nova/.test(n)), 'Valendo não tem a que vai começar, a que saiu de casa, as que acabaram nem as do topo');

  /* 🔍 */
  const bu = await p.evaluate(() => {
    const g = Search.find('G2 Fab30').find((x) => x.grp === 'Garantias'), todos = Search.sources().filter((x) => x.grp === 'Garantias');
    return { g: g ? { t: g.t, s: g.s, grp: g.grp } : null, n: todos.length, nums: todos.filter((x) => /0001/.test(x.s + ' ' + x.q)).length, fn: Search.find('garantias').some((x) => x.t === 'Garantias' && x.grp === 'Funções') };
  });
  conferir(bu.g && bu.g.t === 'G2 Fab30' && /^✅ Fábrica até .* · Loja Exemplo$/.test(bu.g.s) && bu.g.grp === 'Garantias', '🔍 acha a garantia: "🧾 nome · situação · loja" (' + JSON.stringify(bu.g) + ')');
  conferir(bu.n === 11 && !bu.nums && bu.fn, '🔍 traz as 11 garantias que esta pessoa vê, sem número (nem o final do pedido), e a função Garantias');
  await p.evaluate(() => Search.find('G2 Fab30').find((x) => x.grp === 'Garantias').fn()); await p.waitForTimeout(300);
  conferir(await p.evaluate((id) => S.route.tab === 'garantias' && S.route.sub === 'ficha' && S.route.arg === id, fx.a), 'e o toque na 🔍 leva à ficha dela');

  /* AssistONE e dica */
  const ao = await p.evaluate(() => { const h = AOne.HERE().garantias, t = AOne.TIPS().garantias; return { t: h && h[0], frase: h && h[1], acts: h ? h[2].map((a) => a[0]) : [], tip: t }; });
  conferir(ao.t === 'Garantias' && ao.acts.some((a) => /⏰ O que vence\?/.test(a)) && ao.acts.some((a) => /❓ Como funciona/.test(a)) && typeof ao.tip === 'string' && /data da compra/.test(ao.tip), 'AssistONE desta tela ("⏰ O que vence?", "❓ Como funciona") e a dica da tela (' + ao.acts.join(', ') + ')');
  await p.evaluate(() => { S.garF = 'valendo'; go('garantias'); }); await p.waitForTimeout(400);
  await p.evaluate(() => AOne.open()); await p.waitForTimeout(200);
  conferir(await p.evaluate(() => /Garantias/.test((document.querySelector('.aone-here') || {}).textContent || '')), 'o balão do AssistONE mostra a ajuda desta tela');
  await p.evaluate(() => { const a = AOne.HERE().garantias[2].find((x) => /O que vence/.test(x[0])); AOne.close(); a[1](); }); await p.waitForTimeout(400);
  conferir(await p.evaluate(() => S.garF === 'em30' && S.route.tab === 'garantias' && !!document.querySelector('#screen .garf [data-f="em30"].active')), '"⏰ O que vence?" abre a lista no filtro "Em 30 dias"');

  /* 390 px: nada passa da largura, todo alvo com 44 px */
  const alvos = () => p.evaluate(() => {
    const els = [...document.querySelectorAll('#screen .gar button, #screen .gar a[href], #screen .gar summary, #screen .gar [data-act], #screen .gar select, #screen .gar input')].filter((b) => { const r = b.getBoundingClientRect(); return r.width && r.height; });
    return { n: els.length, peq: els.map((b) => { const r = b.getBoundingClientRect(); return r.height < 44 || r.width < 44 ? (b.innerText || b.tagName).replace(/\s+/g, ' ').trim().slice(0, 30) + ' (' + Math.round(r.width) + '×' + Math.round(r.height) + ')' : ''; }).filter(Boolean), larg: document.documentElement.scrollWidth <= innerWidth + 1, w: innerWidth };
  });
  for (const lang of ['pt', 'en']) for (const f of ['valendo', 'acabaram']) {
    await p.evaluate((a) => { if (S.lang !== a.lang) setLang(a.lang); S.garF = a.f; go('garantias'); }, { lang, f }); await p.waitForTimeout(500);
    await p.evaluate(() => document.querySelectorAll('#screen .gar details').forEach((d) => (d.open = true))); await p.waitForTimeout(100);
    const a = await alvos();
    conferir(a.w === 390 && a.larg && a.n >= 6 && !a.peq.length, '390 px (' + lang.toUpperCase() + ', ' + f + '): nada passa da largura e os ' + a.n + ' alvos de toque têm 44 px' + (a.peq.length ? ': ' + a.peq.join(' · ') : ''));
  }
  const en = await p.evaluate(() => { S.garF = 'valendo'; go('garantias'); return new Promise((r) => setTimeout(() => r(document.querySelector('#screen').textContent), 400)); });
  conferir(/Warranties/.test(en) && /Active/.test(en) && /Within 30 days/.test(en) && /Starting soon/.test(en) && /Ended/.test(en) && /Missing details/.test(en) && /Brazilian consumer law/.test(en) && /legal advice/.test(en) && /Factory until/.test(en) && /bought in/.test(en) && !/Faltam dados|Valendo|Vai começar|assessoria|comprado em/.test(en), 'EN: a tela em inglês (filtros, linha, rodapé com "Brazilian consumer law")');
  await p.evaluate(() => setLang('pt')); await p.waitForTimeout(300);

  /* quem vê: "Só responsáveis", criança, criança sem "ver a Casa" */
  const papel0 = await p.evaluate(() => S.role);
  await p.evaluate(() => { S.role = 'adulto'; S.garF = 'valendo'; go('garantias'); }); await p.waitForTimeout(500);
  L = await tela();
  const memBusca = await p.evaluate(() => Search.sources().filter((x) => x.grp === 'Garantias').map((x) => x.t));
  conferir(L.lista.join('|') === 'G2 Fab30|G2 Fab31|G2 Fab200' && /valendo:✅ Valendo 3/.test(L.filtros[0]) && !/G2 Restrita/.test(L.txt) && !memBusca.includes('G2 Restrita') && memBusca.length === 10, '"Só responsáveis": quem não é responsável não vê na lista, na contagem nem na 🔍');
  conferir(await p.evaluate(() => document.querySelectorAll('#screen [data-act="gar.new"]').length === 1), 'adulto que não é responsável também tem o ＋');
  await p.evaluate(() => { S.role = 'crianca'; go('garantias'); }); await p.waitForTimeout(500);
  const cri = await p.evaluate(() => ({ ok: canTab('garantias') && S.route.tab === 'garantias', mexe: [...document.querySelectorAll('#screen [data-act^="gar."]')].map((b) => b.dataset.act).filter((a) => a !== 'gar.filtro'), n: document.querySelectorAll('#screen .gar-lista .li').length }));
  conferir(cri.ok && !cri.mexe.length && cri.n === 3, 'criança vê a lista (como a Casa) e não tem ＋ nem ✏️' + (cri.mexe.length ? ' (' + cri.mexe.join(', ') + ')' : ''));
  await p.evaluate(() => { me().controls = Object.assign({}, me().controls, { seeHouse: false }); go('garantias'); }); await p.waitForTimeout(500);
  const cri2 = await p.evaluate(() => ({ can: canTab('garantias'), vis: visibleTabs().some((t) => t.id === 'garantias'), tab: S.route.tab, busca: Search.sources().filter((x) => x.grp === 'Garantias' || x.ic === '🧾').length }));
  conferir(!cri2.can && !cri2.vis && cri2.tab === 'home' && !cri2.busca, 'criança sem "ver a Casa": a aba some do menu e da 🔍, e o endereço volta ao Início (' + JSON.stringify(cri2) + ')');
  await p.evaluate((papel) => { const c = Object.assign({}, me().controls); delete c.seeHouse; me().controls = c; S.role = papel; }, papel0);

  /* desligada no RootifyONE */
  await p.evaluate(() => { const o = SolverRecursos.ligado; window.__lig0 = o; SolverRecursos.ligado = function (id, d) { return id === 'casa.garantias' ? false : o.call(this, id, d); }; go('garantias'); }); await p.waitForTimeout(500);
  const off = await p.evaluate(() => ({ txt: document.querySelector('#screen').textContent, vis: visibleTabs().some((t) => t.id === 'garantias'), barra: BarEd.choices().some((t) => t.id === 'garantias'), busca: Search.sources().filter((x) => x.ic === '🧾' || /^Garantias/.test(x.t)).map((x) => x.t) }));
  await p.click('#hambbtn'); await p.waitForTimeout(400);
  const gavOff = await p.evaluate(() => document.querySelectorAll('#drawer [data-dtab="garantias"]').length);
  await fecharJanelas(p); await p.waitForTimeout(200);
  conferir(/Função desligada por enquanto/.test(off.txt) && !off.vis && !off.barra && !off.busca.length && !gavOff, 'desligada no RootifyONE (casa.garantias): some do ☰, da barra e da 🔍, e o endereço mostra "Função desligada por enquanto"' + (off.busca.length ? ' (🔍: ' + off.busca.join(', ') + ')' : ''));
  await p.evaluate(() => { SolverRecursos.ligado = window.__lig0; go('garantias'); }); await p.waitForTimeout(400);
  conferir(await p.evaluate(() => !!document.querySelector('#screen .gar-lista')), 'religada: a lista volta');
  conferir(!lixo.erros.length && !lixo.nativos.length, 'G2: nenhum erro de página e nenhum alert/confirm nativo' + (lixo.erros.length ? ': ' + lixo.erros.slice(0, 2).join(' | ') : ''));

  /* =====================================================================
     G3 — a ficha, o formulário, as Senhas da casa, os papéis, o Onde está? e o apagar
     ===================================================================== */
  console.log('\n— G3: a ficha, o formulário, as Senhas da casa e os papéis');
  await p.evaluate((papel) => { S.role = papel; }, papel0);
  const BILHETE = 'BILHETE-EXEMPLO-0002', SERIE = 'SERIE-EXEMPLO-0003';
  const okForm = async () => { await p.click('dialog[open] [data-ok]'); await p.waitForTimeout(500); };
  const telaTxt = () => p.evaluate(() => document.querySelector('#screen').innerText);
  const ficha = async (id) => { await p.evaluate((id) => go('garantias', 'ficha', id), id); await p.waitForTimeout(500); };
  /* a ação, sem esperar por ela (uma janela aberta seguraria o evaluate): o objeto pelo nome */
  const tocar = (act, nome, extra) => p.evaluate(([a, n, x]) => { const t = n ? DB.raw('things').find((y) => y.name === n) : null; ACT[a](Object.assign(t ? { id: t.id } : {}, x || {})); }, [act, nome || '', extra || null]);
  const semJanela = async (act, nome) => { await tocar(act, nome); return !(await p.waitForSelector('dialog[open] [name="name"]', { timeout: 700 }).then(() => true, () => false)); };
  const semArquivo = async (nome, tipo) => { const ev = p.waitForEvent('filechooser', { timeout: 1200 }).then(() => true, () => false); await tocar('gar.papel', nome, { tipo }); return !(await ev); };
  const hojeISO = await p.evaluate(() => today());

  /* cadastro mínimo: nome + data da compra */
  await p.evaluate(() => { S.garF = 'valendo'; go('garantias'); }); await p.waitForTimeout(400);
  const n0 = await p.evaluate(() => DB.raw('things').length);
  await p.click('#screen [data-act="gar.new"]');
  const abriuNovo = await p.waitForSelector('dialog[open] [name="garantia.compra.data"]', { timeout: 5000 }).then(() => true, () => false);
  const vista = await p.evaluate(() => {
    const m = document.querySelector('dialog[open]'), vis = (n) => { const i = m && m.querySelector('[name="' + n + '"]'); return !!i && !!(i.offsetWidth || i.offsetHeight); };
    return { nome: vis('name'), data: vis('garantia.compra.data'), tem: vis('garantia.estendida.tem'), ligar: vis('_ligar'), marca: vis('garantia.marca'), loja: vis('garantia.compra.loja'), pedido: vis('_sec.pedido'),
      mais: !!(m && m.querySelector('#garmais')), tem0: ((m && m.querySelector('[name="garantia.estendida.tem"]')) || {}).value, txt: m ? m.innerText : '' };
  });
  conferir(abriuNovo && vista.nome && vista.data && vista.tem && vista.ligar && !vista.marca && !vista.loja && !vista.pedido && vista.mais && vista.tem0 === 'naosei' && /Use o dia 1º do mês/.test(vista.txt),
    'G3. ＋ Nova garantia: à vista só "Ligar a", o nome, a data da compra e "Tem estendida?" (Não sei); o resto em "＋ Mais detalhes" (' + JSON.stringify(Object.assign({}, vista, { txt: '' })) + ')');
  const dCompra = await p.evaluate(() => GarCalc.somaDias(today(), -100));
  if (abriuNovo) { await p.fill('dialog[open] [name="name"]', 'Purificador Exemplo G3'); await p.fill('dialog[open] [name="garantia.compra.data"]', dCompra); await okForm(); }
  const g3 = await p.evaluate(() => { const t = DB.raw('things').find((x) => x.name === 'Purificador Exemplo G3'); return t ? { id: t.id, g: t.garantia, vis: t.vis, rota: [S.route.tab, S.route.sub, S.route.arg].join('/'), n: DB.raw('things').length } : null; });
  const tid3 = g3 ? g3.id : 'nenhum';
  conferir(g3 && g3.g && g3.g.v === 1 && g3.g.ref === 'gar_' + tid3 && g3.g.compra.data === dCompra && g3.g.estendida.tem === 'naosei' && g3.g.origem === 'manual' && g3.vis === 'familia' && g3.n === n0 + 1,
    'G3. cadastro mínimo (nome + data): um objeto novo com a garantia v1, ref "gar_" + id, "não sei" da estendida, "Toda a família" (' + JSON.stringify(g3 && g3.g) + ')');
  conferir(g3 && g3.rota === 'garantias/ficha/' + tid3, 'G3. depois de salvar, abre a ficha da garantia (' + (g3 && g3.rota) + ')');
  let ft = await telaTxt();
  const fimFab = await p.evaluate((d) => fmtDate(GarCalc.somaMeses(d, 12)), dCompra);
  conferir(ft.includes('Na garantia de fábrica até ≈' + fimFab) && (ft.split('≈' + fimFab).length - 1) >= 2 && /De fábrica/.test(ft) && /Prazo da lei para reclamar/.test(ft) && /Estendida \(seguro\)/.test(ft),
    'G3. a ficha: a frase grande ("Na garantia de fábrica até ≈' + fimFab + '") e as três garantias (de fábrica, prazo da lei, estendida), com ≈');
  conferir(/Para avisar certo, diga quantos meses tem a de fábrica/.test(ft) && /Tem estendida\? Procure no e-mail/.test(ft), 'G3. o "próximo passo": quantos meses tem a de fábrica e se tem estendida');
  conferir((ft.match(/≈ = conta do app; confira no folheto ou no bilhete/g) || []).length === 1 && /Não é assessoria jurídica/.test(ft) && /🧾 Garantias\s*›/.test(ft), 'G3. o caminho "🧾 Garantias › nome", "≈ = conta do app…" uma vez e o rodapé');
  conferir(!!(await p.$('#screen [data-tab="garantias"][data-sub="estragou"][data-arg="' + tid3 + '"]')) && !!(await p.$('#screen [data-act="gar.edit"][data-id="' + tid3 + '"]')), 'G3. a ficha tem o 🆘 "Estragou? E agora?" e o ✏️');

  /* "Ligar a": a garantia entra num objeto do Onde está? que ainda não tem */
  const semG = await p.evaluate(() => (DB.raw('things').find((x) => x.name === 'G2 Objeto sem garantia') || {}).id);
  await p.evaluate(() => { ACT['gar.new'](); });
  const temLigar = await p.waitForSelector('dialog[open] [name="_ligar"]', { timeout: 5000 }).then(() => true, () => false);
  let nomeAuto = '';
  if (temLigar) { await p.selectOption('dialog[open] [name="_ligar"]', semG); nomeAuto = await p.inputValue('dialog[open] [name="name"]'); await p.fill('dialog[open] [name="garantia.compra.data"]', dCompra); await okForm(); }
  const lig = await p.evaluate((id) => ({ n: DB.raw('things').length, t: DB.raw('things').find((x) => x.id === id) }), semG);
  conferir(temLigar && nomeAuto === 'G2 Objeto sem garantia' && lig.n === n0 + 1 && lig.t && lig.t.garantia && lig.t.garantia.ref === 'gar_' + semG && lig.t.garantia.compra.data === dCompra,
    'G3. "Ligar a" um objeto do Onde está? sem garantia: ela entra nele, com o nome dele, sem objeto novo');
  await fecharJanelas(p);

  /* o formulário recusa, com a janela aberta */
  await p.evaluate(() => { ACT['gar.new'](); });
  const abriuR = await p.waitForSelector('dialog[open] #garmais', { timeout: 5000 }).then(() => true, () => false);
  if (abriuR) { await p.click('dialog[open] #garmais'); await p.fill('dialog[open] [name="name"]', 'G3 Recusa'); }
  const RECUSA = [
    [{ 'garantia.compra.data': '2025-03-10', 'garantia.compra.entrega': '2025-03-01' }, 'a entrega antes da compra'],
    [{ 'garantia.compra.data': '2025-03-10', 'garantia.estendida.tem': 'sim', 'garantia.estendida.inicio': '2026-05-01', 'garantia.estendida.fim': '2026-04-01' }, 'o início da estendida depois do fim'],
    [{ 'garantia.compra.data': '1989-12-31' }, 'o ano fora de 1990…2100'],
    [{ 'garantia.compra.data': '2025-03-10', '_sec.cartaoFinal': '12' }, 'o final do cartão sem 4 números'],
    [{ 'garantia.compra.data': '2025-03-10', 'garantia.estendida.tem': 'sim', 'garantia.estendida.acionar.app': 'http://exemplo.com.br' }, 'o link do app sem https'],
    [{ 'garantia.compra.data': '2025-03-10', '_fabMeses': 'outro', '_fabOutro': '0' }, '"outro número" de meses com 0'],
    [{ 'garantia.compra.data': '2025-03-10', '_fabMeses': 'outro', '_fabOutro': '241' }, '"outro número" de meses com 241']];
  for (const [vals, oque] of RECUSA) {
    const r = !abriuR ? { falta: 'a janela' } : await p.evaluate(async (vals) => {
      const m = document.querySelector('dialog[open]'), padrao = { 'garantia.compra.entrega': '', 'garantia.estendida.tem': 'naosei', 'garantia.estendida.inicio': '', 'garantia.estendida.fim': '', '_sec.cartaoFinal': '', 'garantia.estendida.acionar.app': '', _fabMeses: '', _fabOutro: '' };
      for (const [k, v] of Object.entries(Object.assign({}, padrao, vals))) { const i = m.querySelector('[name="' + k + '"]'); if (!i) return { falta: k }; i.value = v; i.dispatchEvent(new Event('change', { bubbles: true })); }
      const n = DB.raw('things').length; m.querySelector('[data-ok]').click(); await new Promise((x) => setTimeout(x, 400));
      return { aberta: !!document.querySelector('dialog[open] [name="name"]'), n: DB.raw('things').length - n, toast: [...document.querySelectorAll('#toasts .toast')].map((t) => t.textContent).pop() || '' };
    }, vals);
    conferir(!r.falta && r.aberta && r.n === 0, 'G3. o formulário recusa, com a janela aberta e nada gravado: ' + oque + (r.falta ? ' (falta ' + r.falta + ')' : ' — "' + r.toast + '"'));
  }
  await fecharJanelas(p); await p.waitForTimeout(200);

  /* os números e o dinheiro: só nas Senhas da casa (o item gv_ + id) */
  await ficha(tid3);
  await p.click('#screen [data-act="gar.edit"]').catch(() => {});
  const abriuE = await p.waitForSelector('dialog[open] [name="_sec.pedido"]', { state: 'attached', timeout: 5000 }).then(() => true, () => false);
  if (abriuE) {
    if (!(await p.evaluate(() => { const i = document.querySelector('dialog[open] [name="_sec.pedido"]'); return !!(i.offsetWidth || i.offsetHeight); }))) await p.click('dialog[open] #garmais');
    for (const [k, v] of [['pedido', PEDIDO], ['number', BILHETE], ['serie', SERIE], ['chaveNF', CHAVE], ['valor', '1299.9'], ['preco', '199.9'], ['pagamento', 'Cartão de crédito em 10x'], ['cartaoFinal', '4321']]) await p.fill('dialog[open] [name="_sec.' + k + '"]', v);
    await okForm();
  }
  const sg = await p.evaluate(async (id) => {
    const t = DB.raw('things').find((x) => x.id === id), v = DB.col('vault').get('gv_' + id); let o = null; try { o = await Vault.decObj(v.enc); } catch (e) {}
    return { t: JSON.stringify(t), finais: t && t.garantia && t.garantia.finais, v: v ? { kind: v.kind, vis: v.vis, cru: JSON.stringify(v) } : null, o,
      idb: JSON.stringify(await IDB.entries('docs')), ls: JSON.stringify(Object.assign({}, localStorage)) + JSON.stringify(Object.assign({}, sessionStorage)), busca: JSON.stringify(Search.sources()) };
  }, tid3);
  const LONGOS = [PEDIDO, BILHETE, SERIE, CHAVE, 'Cartão de crédito em 10x'];
  conferir(abriuE && !LONGOS.some((x) => sg.t.includes(x)) && !/_sec|129990|19990|1299[.,]9|valorCent|precoCent|cartaoFinal|"pagamento"/.test(sg.t), 'G3. o objeto não guarda número, valor, pagamento nem final do cartão (nem "_sec")');
  conferir(sg.finais && sg.finais.pedido === '0001' && sg.finais.bilhete === '0002' && sg.finais.serie === '0003', 'G3. no objeto, só os finais: 0001, 0002 e 0003 (' + JSON.stringify(sg.finais) + ')');
  conferir(sg.v && sg.v.kind === 'seguro' && sg.v.vis === 'restrito' && !LONGOS.some((x) => sg.v.cru.includes(x)) && sg.o && sg.o.pedido === PEDIDO && sg.o.number === BILHETE && sg.o.serie === SERIE && sg.o.chaveNF === CHAVE &&
    sg.o.valorCent === '129990' && sg.o.precoCent === '19990' && sg.o.pagamento === 'Cartão de crédito em 10x' && sg.o.cartaoFinal === '4321' && sg.o.garantiaDe === tid3 && sg.o.title === 'Purificador Exemplo G3 — números da garantia',
    'G3. pedido, bilhete, série, chave da nota, valor, preço da estendida, pagamento e final do cartão trancados no item "gv_" + id das Senhas da casa (seguro, só responsáveis) (' + JSON.stringify(sg.o && Object.keys(sg.o)) + ')');
  conferir(!LONGOS.slice(0, 4).some((x) => sg.idb.includes(x) || sg.ls.includes(x) || sg.busca.includes(x)), 'G3. nada aberto no aparelho (IndexedDB, localStorage) nem na 🔍');
  await ficha(tid3);
  await p.waitForFunction(() => document.querySelector('#garnum [data-olho]'), null, { timeout: 5000 }).catch(() => {});
  ft = await telaTxt();
  conferir(/final 0001/.test(ft) && /final 0002/.test(ft) && /final 0003/.test(ft) && !LONGOS.slice(0, 4).some((x) => ft.includes(x)), 'G3. a ficha mostra "final 0001" (pedido, bilhete, série) e esconde o número completo');
  conferir(/1\.299,90/.test(ft) && /199,90/.test(ft) && /final 4321/.test(ft) && /nada é enviado ao MoneyTRIO/.test(ft), 'G3. "💰 Referência" no modo aberto (valor, preço da estendida, cartão final 4321) e "nada é enviado ao MoneyTRIO"');
  const olho = await p.$('#garnum [data-olho]');
  if (olho) await olho.click();
  conferir(!!olho && (await p.locator('#garnum').innerText()).includes(PEDIDO), 'G3. o 👁 mostra o número completo');
  conferir(await p.evaluate((x) => { A11y.read(); try { A11y.stop(); } catch (e) {} return !document.querySelector('#garnum').innerText.includes(x); }, PEDIDO), 'G3. ler a tela em voz alta esconde o número de novo');
  /* editar: vem preenchido; salvar sem mudar não regrava o item das Senhas */
  const u0 = await p.evaluate((id) => (DB.col('vault').get('gv_' + id) || {}).updatedAt, tid3);
  await p.click('#screen [data-act="gar.edit"]').catch(() => {});
  const abriuE2 = await p.waitForSelector('dialog[open] [name="_sec.pedido"]', { state: 'attached', timeout: 5000 }).then(() => true, () => false);
  const pre = abriuE2 ? { pedido: await p.inputValue('dialog[open] [name="_sec.pedido"]'), valor: await p.inputValue('dialog[open] [name="_sec.valor"]'), cartao: await p.inputValue('dialog[open] [name="_sec.cartaoFinal"]') } : {};
  if (abriuE2) await okForm();
  const u1 = await p.evaluate((id) => (DB.col('vault').get('gv_' + id) || {}).updatedAt, tid3);
  conferir(abriuE2 && pre.pedido === PEDIDO && pre.valor === '1299.9' && pre.cartao === '4321' && u0 && u1 === u0, 'G3. editar: os números vêm preenchidos (Senhas abertas); salvar sem mudar não regrava o item das Senhas (' + JSON.stringify(pre) + ')');
  const ref1 = await p.evaluate((id) => DB.get('things', id).garantia.ref, tid3);
  conferir(ref1 === 'gar_' + tid3, 'G3. o ref não muda ao editar (' + ref1 + ')');
  /* as Senhas fecham com a janela aberta */
  await ficha(tid3);
  await p.click('#screen [data-act="gar.edit"]').catch(() => {});
  await p.waitForSelector('dialog[open] [name="_sec.pedido"]', { state: 'attached', timeout: 5000 }).catch(() => {});
  await p.evaluate(() => Vault.lock()); await p.waitForTimeout(1500);
  const fechou = await p.evaluate(() => { const i = document.querySelector('dialog[open] [name="_sec.pedido"]'); return !!i && i.value === '' && i.closest('.fld').classList.contains('hidden'); });
  if (await p.$('dialog[open] [data-ok]')) await okForm();
  await p.evaluate(async () => { await Vault.unlock('senha-de-mentira-123'); });
  const depF = await p.evaluate(async (id) => { const o = await Garantias.segredo(DB.get('things', id)); return { o, finais: DB.get('things', id).garantia.finais }; }, tid3);
  conferir(fechou && depF.o && depF.o.pedido === PEDIDO && depF.o.valorCent === '129990' && depF.finais && depF.finais.pedido === '0001', 'G3. as Senhas fecham com a janela aberta: os números somem dela, e salvar não apaga nem muda o que estava trancado');
  await fecharJanelas(p);
  /* Senhas fechadas: nada protegido na tela nem no formulário */
  await p.evaluate(() => Vault.lock()); await ficha(tid3);
  ft = await telaTxt();
  conferir(/final 0001/.test(ft) && !ft.includes(PEDIDO) && !(await p.$('#garnum [data-olho]')) && !!(await p.$('#screen [data-act="gar.abrircasa"]')) && !/1\.299,90/.test(ft), 'G3. Senhas fechadas: só "final 0001", sem 👁 e sem o valor, com "🔓 Abrir as Senhas da casa"');
  await p.click('#screen [data-act="gar.edit"]').catch(() => {});
  await p.waitForSelector('dialog[open] [name="name"]', { timeout: 5000 }).catch(() => {});
  const semSec = await p.evaluate(() => { const m = document.querySelector('dialog[open]'); return m ? { sec: m.querySelectorAll('[name^="_sec."]').length, txt: m.innerText } : { sec: -1, txt: '' }; });
  if (await p.$('dialog[open] [data-ok]')) await okForm();
  conferir(semSec.sec === 0 && /abra as Senhas da casa/i.test(semSec.txt), 'G3. Senhas fechadas: o formulário não tem os campos protegidos e diz para abrir as Senhas antes');
  conferir(await p.evaluate(async (id) => { await Vault.unlock('senha-de-mentira-123'); const o = await Garantias.segredo(DB.get('things', id)); return o && o.pedido; }, tid3) === PEDIDO, 'G3. ... e salvar com as Senhas fechadas não mexe no que está trancado');
  /* quem não é responsável */
  await p.evaluate(() => { S.role = 'adulto'; }); await ficha(tid3); await p.waitForTimeout(300);
  ft = await telaTxt();
  conferir(/final 0001/.test(ft) && !ft.includes(PEDIDO) && !(await p.$('#garnum [data-olho]')) && !/1\.299,90/.test(ft) && /Só os responsáveis veem os números completos/.test(ft), 'G3. quem não é responsável: "final 0001", sem 👁 e sem o valor ("Só os responsáveis veem os números completos")');
  await p.evaluate((papel) => { S.role = papel; }, papel0);

  /* os papéis */
  await ficha(tid3);
  const ARQ_NOTA = Buffer.from('%PDF-1.4\n% nota de mentira\n'), ARQ_FOLHETO = Buffer.from('%PDF-1.4\n% folheto de mentira\n');
  const anexa = async (tipo, nome, buf) => {
    const b = await p.$('#screen [data-act="gar.papel"][data-tipo="' + tipo + '"]'); if (!b) return false;
    const [fc] = await Promise.all([p.waitForEvent('filechooser', { timeout: 5000 }), b.click()]);
    await fc.setFiles({ name: nome, mimeType: 'application/pdf', buffer: buf }); return true;
  };
  const nN = await anexa('nota', 'NF ' + CPF + ' Loja Exemplo.pdf', ARQ_NOTA);
  await p.waitForFunction((id) => ((DB.get('things', id).garantia || {}).arquivos || []).length === 1, tid3, { timeout: 5000 }).catch(() => {});
  const nT = await anexa('termo', 'folheto-original.pdf', ARQ_FOLHETO);
  await p.waitForFunction((id) => ((DB.get('things', id).garantia || {}).arquivos || []).length === 2, tid3, { timeout: 5000 }).catch(() => {});
  const pp = await p.evaluate(async (id) => {
    const t = DB.get('things', id), out = {};
    for (const a of (t.garantia.arquivos || [])) { const m = Files.meta(a.id) || {}; let txt = ''; try { txt = await (await Files.blob(a.id)).text(); } catch (e) {} out[a.tipo] = { id: a.id, em: a.em, name: m.name, enc: !!m.enc, vis: m.vis, gar: m.gar, txt }; }
    return { out, files: JSON.stringify(DB.raw('files')) };
  }, tid3);
  const pn = pp.out.nota || {}, pt = pp.out.termo || {};
  conferir(nN && pn.enc && pn.vis === 'restrito' && pn.name === 'nota-fiscal.pdf' && pn.gar === tid3 && pn.txt.startsWith('%PDF-1.4\n% nota') && pn.em === hojeISO, 'G3. "＋ Nota fiscal": trancada, só responsáveis, com o nome neutro "nota-fiscal.pdf" e a marca gar; abre de volta (' + JSON.stringify(Object.assign({}, pn, { txt: '' })) + ')');
  conferir(nT && !pt.enc && pt.vis === 'familia' && pt.name === 'folheto.pdf' && pt.gar === tid3 && pt.txt.startsWith('%PDF-1.4\n% folheto'), 'G3. "＋ Folheto de garantia": sem cadeado, com o "Quem vê" do objeto, nome "folheto.pdf" e a marca gar');
  conferir(!pp.files.includes(CPF) && !pp.files.includes('Loja Exemplo.pdf'), 'G3. o nome original do arquivo (com CPF) não é guardado');
  ft = await telaTxt();
  conferir(/Nota fiscal/.test(ft) && /Folheto de garantia/.test(ft) && !!(await p.$('#screen [data-act="file.open"][data-id="' + pn.id + '"]')), 'G3. a ficha lista os papéis, com o botão de abrir');
  /* Senhas fechadas e a pessoa não abre: a nota não é guardada */
  await p.evaluate(() => Vault.lock());
  const nArq = await p.evaluate((id) => (DB.get('things', id).garantia.arquivos || []).length, tid3);
  const pedeSenha = p.waitForSelector('dialog[open] #askv', { timeout: 4000 }).then(() => true, () => false);
  const evArq = p.waitForEvent('filechooser', { timeout: 2500 }).then(() => true, () => false);
  await p.evaluate((id) => { ACT['gar.papel']({ id, tipo: 'nota' }); }, tid3);
  const pediu = await pedeSenha;
  if (pediu) await p.click('dialog[open]:has(#askv) [data-x]').catch(() => {});
  const escolheu = await evArq;
  conferir(pediu && !escolheu && await p.evaluate((id) => (DB.get('things', id).garantia.arquivos || []).length, tid3) === nArq, 'G3. Senhas fechadas: "＋ Nota fiscal" pede para abrir ali mesmo; sem abrir, nada é guardado');
  await p.evaluate(async () => { await Vault.unlock('senha-de-mentira-123'); });
  /* quem não é responsável vê que a nota existe, sem abrir */
  await p.evaluate(() => { S.role = 'adulto'; }); await ficha(tid3);
  ft = await telaTxt();
  conferir(/Nota fiscal/.test(ft) && /só um responsável abre/.test(ft) && !(await p.$('#screen [data-act="file.open"][data-id="' + pn.id + '"]')), 'G3. quem não é responsável: a nota aparece com "🔒 só um responsável abre", sem abrir');
  await p.evaluate((papel) => { S.role = papel; }, papel0);

  /* 390 px e EN na ficha */
  for (const lang of ['pt', 'en']) {
    await p.evaluate((a) => { if (S.lang !== a.lang) setLang(a.lang); go('garantias', 'ficha', a.id); }, { lang, id: tid3 }); await p.waitForTimeout(600);
    await p.evaluate(() => document.querySelectorAll('#screen .gar details').forEach((d) => (d.open = true))); await p.waitForTimeout(100);
    const a = await alvos();
    conferir(a.w === 390 && a.larg && a.n >= 10 && !a.peq.length, 'G3. 390 px (' + lang.toUpperCase() + ', ficha): nada passa da largura e os ' + a.n + ' alvos de toque têm 44 px' + (a.peq.length ? ': ' + a.peq.join(' · ') : ''));
  }
  ft = await telaTxt();
  conferir(/Factory warranty/.test(ft) && /Legal deadline to complain/.test(ft) && /Extended warranty/.test(ft) && /Brazilian consumer law/.test(ft) && /ending 0001/.test(ft) && !/Na garantia de fábrica|Prazo da lei|Papéis/.test(ft), 'G3. EN: a ficha em inglês');
  await p.evaluate(() => setLang('pt')); await p.waitForTimeout(300);

  /* Senhas da casa: o item avisa onde mudar e, editado lá, mantém as chaves da garantia */
  await p.evaluate((id) => { editVault(DB.col('vault').get('gv_' + id)); }, tid3);
  const abriuV = await p.waitForSelector('dialog[open] [name="title"]', { timeout: 5000 }).then(() => true, () => false);
  const evTxt = abriuV ? await p.locator('dialog[open]').innerText() : '';
  if (abriuV) { await p.fill('dialog[open] [name="notes"]', 'Anotação de mentira'); await p.click('dialog[open] [data-ok]'); await p.waitForTimeout(500); }
  const ev = await p.evaluate(async (id) => { try { return await Vault.decObj(DB.col('vault').get('gv_' + id).enc); } catch (e) { return null; } }, tid3);
  conferir(abriuV && /🧾/.test(evTxt) && /Garantias/.test(evTxt) && ev && ev.garantiaDe === tid3 && ev.pedido === PEDIDO && ev.valorCent === '129990' && ev.notes === 'Anotação de mentira',
    'G3. nas Senhas da casa, o item da garantia diz que se muda em 🧾 Garantias e, editado lá, mantém garantiaDe, o pedido e o valor');

  /* "Passar o bastão" não oferece o item da garantia */
  await p.evaluate(async () => { await DB.put('vault', { kind: 'senha', enc: await Vault.encObj({ title: 'Wi-Fi de mentira', pass: 'senha-de-mentira' }), files: [], vis: 'restrito' }); });
  await p.evaluate(() => { ACT['ho.start'](); });
  await p.waitForSelector('dialog[open] #hov', { timeout: 5000 }).catch(() => {});
  const chips = await p.evaluate(() => [...document.querySelectorAll('dialog[open] #hov .chip')].map((c) => c.textContent));
  await fecharJanelas(p); await p.waitForTimeout(200);
  conferir(chips.includes('Wi-Fi de mentira') && !chips.some((c) => /garantia/.test(c)), 'G3. "Passar o bastão" não oferece o item com os números da garantia (' + chips.join(', ') + ')');

  /* AssistONE e o aviso legal */
  const aq = await p.evaluate(() => AOne.HERE().garantias[2].map((a) => a[0]));
  conferir(aq.some((a) => /＋ Nova garantia/.test(a)), 'G3. o AssistONE desta tela tem "＋ Nova garantia" (' + aq.join(', ') + ')');
  await p.evaluate(() => ACT.legal()); await p.waitForTimeout(300);
  const lg = await p.evaluate(() => (document.querySelector('dialog[open]') || {}).innerText || '');
  await fecharJanelas(p);
  conferir(/Garantias/.test(lg) && /estimadas/.test(lg) && /folheto/.test(lg) && /não é assessoria jurídica/i.test(lg) && /só neste aparelho/.test(lg) && /não vende seguro/.test(lg), 'G3. o aviso legal fala das garantias (datas estimadas, vale o folheto e o bilhete, não é assessoria jurídica, a nota só neste aparelho, o app não vende seguro)');

  /* "saiu de casa" (D-G9): oferece apagar a nota e os números; fica o histórico */
  await ficha(tid3);
  await p.click('#screen [data-act="gar.edit"]').catch(() => {});
  const abriuS = await p.waitForSelector('dialog[open] [name="_saiuComo"]', { state: 'attached', timeout: 5000 }).then(() => true, () => false);
  let pergunta = false, ptxt = '';
  if (abriuS) {
    if (!(await p.evaluate(() => { const i = document.querySelector('dialog[open] [name="_saiuComo"]'); return !!(i.offsetWidth || i.offsetHeight); }))) await p.click('dialog[open] #garmais');
    await p.selectOption('dialog[open] [name="_saiuComo"]', 'doado'); await p.fill('dialog[open] [name="_saiuEm"]', hojeISO);
    await p.click('dialog[open] [data-ok]');
    pergunta = await p.waitForSelector('dialog[open] [data-yes]', { timeout: 5000 }).then(() => true, () => false);
    if (pergunta) { ptxt = await p.locator('dialog[open]:has([data-yes])').innerText(); await p.click('dialog[open] [data-yes]'); }
    await p.waitForTimeout(700);
  }
  const sd = await p.evaluate((id) => { const t = DB.get('things', id), g = t.garantia; return { saiu: g.saiu, arq: (g.arquivos || []).map((a) => a.tipo), files: DB.raw('files').filter((f) => f.gar === id).map((f) => f.name), vault: !!DB.col('vault').get('gv_' + id), finais: g.finais || {} }; }, tid3);
  conferir(pergunta && /Apagar a nota, o bilhete e os números\? Fica só o histórico/.test(ptxt), 'G3. ao marcar "saiu de casa", pergunta "Apagar a nota, o bilhete e os números? Fica só o histórico"');
  conferir(sd.saiu && sd.saiu.como === 'doado' && sd.saiu.em === hojeISO && JSON.stringify(sd.arq) === '["termo"]' && JSON.stringify(sd.files) === '["folheto.pdf"]' && !sd.vault && !sd.finais.pedido,
    'G3. com o "sim": saem a nota e os números (o item das Senhas e os finais); ficam o folheto e o histórico (' + JSON.stringify(sd) + ')');
  ft = await telaTxt();
  conferir(/Saiu de casa: doado em/.test(ft) && /Fica como histórico/.test(ft) && !(await p.$('#screen [data-sub="estragou"]')) && !(await p.$('#screen [data-act="gar.papel"]')) && !!(await p.$('#screen [data-act="gar.edit"]')),
    'G3. a ficha de coisa que saiu de casa: "Saiu de casa: doado em…", sem 🆘 e sem ＋ papel; o ✏️ fica');

  /* o selo no Onde está? */
  const selos = await p.evaluate(async (pl) => {
    const h = today(), d = (n) => GarCalc.somaDias(h, n);
    const novo = async (name, garantia) => (await DB.put('things', { name, place: pl, tags: [], vis: 'familia', garantia }, true)).id;
    return { vale: await novo('G3 Selo vale', { v: 1, compra: { data: d(-10) }, fabrica: { fim: d(100), legalInclusa: 'sim' } }), doado: await novo('G3 Selo doado', { v: 1, compra: { data: d(-10) }, saiu: { como: 'doado', em: d(-1), obs: '' } }),
      acabou: await novo('G3 Selo acabou', { v: 1, compra: { data: d(-2000) }, fabrica: { meses: 12 } }), fim: fmtDate(d(100)) };
  }, ids.pl);
  const linhaDe = () => p.evaluate(() => Object.fromEntries([...document.querySelectorAll('#screen .li[data-act="th.edit"]')].map((li) => [li.dataset.id, li.innerText.replace(/\s+/g, ' ')])));
  await p.evaluate((pl) => { S.whereQ = ''; go('house', 'where', pl); }, ids.pl); await p.waitForTimeout(400);
  let ls = await linhaDe();
  conferir((ls[selos.vale] || '').includes('🧾 garantia até ' + selos.fim) && (ls[selos.doado] || '').includes('📦 saiu de casa') && !/🧾|📦/.test(ls[selos.acabou] || '🧾'), 'G3. Onde está?: o selo "🧾 garantia até …" (e "📦 saiu de casa"); o que acabou fica sem selo (' + JSON.stringify([ls[selos.vale], ls[selos.doado], ls[selos.acabou]]) + ')');
  const busca = await p.evaluate(() => Where.search('G3 Selo').map((r) => r.title + ' | ' + r.sub));
  conferir(busca.some((s) => /G3 Selo vale \|.*🧾 garantia até/.test(s)) && busca.some((s) => /G3 Selo doado \|.*📦 saiu de casa/.test(s)), 'G3. a busca do Onde está? também mostra o selo (' + busca.join(' · ') + ')');
  await p.evaluate(() => { const o = SolverRecursos.ligado; window.__lig1 = o; SolverRecursos.ligado = function (id, d) { return id === 'casa.garantias' ? false : o.call(this, id, d); }; render(); }); await p.waitForTimeout(400);
  ls = await linhaDe();
  await p.evaluate(() => { SolverRecursos.ligado = window.__lig1; });
  conferir(!/🧾 garantia|📦 saiu/.test(Object.values(ls).join(' ')), 'G3. Garantias desligada no RootifyONE: sem selo no Onde está?');

  /* apagar pelo ✏️ do Onde está?: vão junto os papéis e os números */
  const ap = await p.evaluate(async (a) => {
    const t = await DB.put('things', { name: 'G3 Apagar', place: a.pl, tags: [], vis: 'familia', garantia: { v: 1, compra: { data: today() } } }, true);
    const fid = await Files.save(new File([new TextEncoder().encode('%PDF-1.4 nota')], 'nota-fiscal.pdf', { type: 'application/pdf' }), { encrypt: true, vis: 'restrito', raw: true });
    await DB.put('files', Object.assign({}, Files.meta(fid), { gar: t.id }), true);
    const vid = await Garantias.guardarSegredo(t, { pedido: a.pedido });
    await DB.put('things', Object.assign({}, DB.get('things', t.id), { garantia: Object.assign({}, t.garantia, { vaultId: vid, arquivos: [{ id: fid, tipo: 'nota', hash: '', em: today() }] }) }), true);
    return { id: t.id, fid, vid };
  }, { pl: ids.pl, pedido: PEDIDO });
  await p.evaluate((pl) => { S.whereQ = ''; go('house', 'where', pl); }, ids.pl); await p.waitForTimeout(400);
  await p.click('#screen [data-act="th.edit"][data-id="' + ap.id + '"]').catch(() => {});
  const abriuA = await p.waitForSelector('dialog[open] [data-del]', { timeout: 5000 }).then(() => true, () => false);
  const atxt = abriuA ? await p.locator('dialog[open]').innerText() : '';
  if (abriuA) { await p.click('dialog[open] [data-del]'); await p.waitForSelector('dialog[open] [data-yes]', { timeout: 5000 }).catch(() => {}); await p.click('dialog[open] [data-yes]').catch(() => {}); await p.waitForTimeout(800); }
  const apd = await p.evaluate((a) => ({ t: !!DB.col('things').get(a.id), f: !!DB.col('files').get(a.fid) || DB.raw('files').some((f) => f.gar === a.id), v: !!DB.col('vault').get('gv_' + a.id) }), ap);
  conferir(abriuA && /Este objeto tem garantia\. Excluir apaga junto os papéis, os números e os atendimentos\./.test(atxt), 'G3. o ✏️ do Onde está? avisa: "🧾 Este objeto tem garantia. Excluir apaga junto os papéis, os números e os atendimentos."');
  conferir(ap.vid === 'gv_' + ap.id && !apd.t && !apd.f && !apd.v, 'G3. excluir pelo ✏️ do Onde está?: o objeto, a nota (files) e os números (Senhas da casa) saem juntos (' + JSON.stringify(apd) + ')');

  /* sobras de coisa apagada (por um app de antes): aparecem para o responsável e só saem com confirmação */
  const sob = await p.evaluate(async () => {
    const fid = await Files.save(new File([new TextEncoder().encode('%PDF-1.4 sobra')], 'nota-fiscal.pdf', { type: 'application/pdf' }), { encrypt: true, vis: 'restrito', raw: true });
    await DB.put('files', Object.assign({}, Files.meta(fid), { gar: 'th-sumiu' }), true);
    await DB.put('vault', { id: 'gv_th-sumiu', kind: 'seguro', enc: await Vault.encObj({ title: 'Coisa Sumida — números da garantia', pedido: 'PED-SOBRA-0009', garantiaDe: 'th-sumiu' }), files: [], vis: 'restrito' }, true);
    S.garF = 'valendo'; go('garantias'); return fid;
  });
  await p.waitForFunction(() => /Sobrou de coisa apagada/.test((document.querySelector('#garsobras') || {}).innerText || ''), null, { timeout: 5000 }).catch(() => {});
  const stx = await p.evaluate(() => (document.querySelector('#garsobras') || {}).innerText || '');
  conferir(/Sobrou de coisa apagada: 1 papel e 1 número/.test(stx), 'G3. "Sobrou de coisa apagada: 1 papel e 1 número" na lista, para o responsável com as Senhas abertas (' + stx.replace(/\s+/g, ' ') + ')');
  const tiraSobras = async (sim) => { await p.click('#screen [data-act="gar.sobras"]').catch(() => {}); const ok = await p.waitForSelector('dialog[open] [data-yes]', { timeout: 5000 }).then(() => true, () => false); const t = ok ? await p.locator('dialog[open]:has([data-yes])').innerText() : ''; if (ok) await p.click(sim ? 'dialog[open] [data-yes]' : 'dialog[open] [data-no]'); await p.waitForTimeout(600); return t; };
  const tx1 = await tiraSobras(false);
  const ainda = await p.evaluate((fid) => !!DB.col('files').get(fid) && !!DB.col('vault').get('gv_th-sumiu'), sob);
  conferir(/nota-fiscal\.pdf/.test(tx1) && /Coisa Sumida — números da garantia/.test(tx1) && ainda, 'G3. tocar mostra os nomes antes; "Cancelar" não apaga nada');
  await tiraSobras(true);
  const foi = await p.evaluate((fid) => !DB.col('files').get(fid) && !DB.col('vault').get('gv_th-sumiu'), sob);
  conferir(foi && !(await p.evaluate(() => /Sobrou/.test((document.querySelector('#garsobras') || {}).innerText || ''))), 'G3. confirmando, as sobras saem e o cartão some');
  await p.evaluate(async () => { const fid = await Files.save(new File([new TextEncoder().encode('%PDF-1.4 sobra 2')], 'bilhete.pdf', { type: 'application/pdf' }), { encrypt: true, vis: 'restrito', raw: true }); await DB.put('files', Object.assign({}, Files.meta(fid), { gar: 'th-sumiu2' }), true); S.role = 'adulto'; go('garantias'); });
  await p.waitForTimeout(600);
  conferir(!(await p.$('#screen [data-act="gar.sobras"]')) && !/Sobrou/.test(await telaTxt()), 'G3. quem não é responsável não vê as sobras');
  await p.evaluate((papel) => { S.role = papel; }, papel0);

  /* bloqueios: criança e garantia de um app mais novo */
  const v2 = await p.evaluate(async () => (await DB.put('things', { name: 'G3 Nova versão', place: '', tags: [], vis: 'familia', garantia: { v: 2, compra: { data: today() } } }, true)).id);
  await ficha(v2); ft = await telaTxt();
  conferir(/atualize o app/i.test(ft) && !(await p.$$('#screen [data-act^="gar."]')).length, 'G3. garantia de um app mais novo: a ficha só mostra "atualize o app", sem botões');
  const c0 = await p.evaluate(() => JSON.stringify(DB.raw('things')));
  conferir(await semJanela('gar.edit', 'G3 Nova versão') && await semArquivo('G3 Nova versão', 'termo'),
    'G3. garantia de um app mais novo: ✏️ e ＋ papel recusam (nem abrem)');
  await p.evaluate(() => { S.role = 'crianca'; }); await ficha(tid3);
  const criM = await p.evaluate(() => [...document.querySelectorAll('#screen [data-act^="gar."]')].map((b) => b.dataset.act));
  conferir(!criM.length && await semJanela('gar.edit', 'Purificador Exemplo G3') && await semJanela('gar.new') && await semArquivo('Purificador Exemplo G3', 'termo'),
    'G3. criança vê a ficha e não muda nada: sem ✏️ nem ＋, e as ações recusam' + (criM.length ? ' (' + criM.join(', ') + ')' : ''));
  conferir(await p.evaluate(() => JSON.stringify(DB.raw('things'))) === c0, 'G3. ... e nada foi gravado');
  await p.evaluate((papel) => { S.role = papel; }, papel0);
  conferir(!lixo.erros.length && !lixo.nativos.length, 'G3: nenhum erro de página e nenhum alert/confirm nativo' + (lixo.erros.length ? ': ' + lixo.erros.slice(0, 2).join(' | ') : ''));

  /* ---------- fusos: as mesmas contas em outros relógios ---------- */
  console.log('\n— fusos');
  const fusos = [['America/New_York', ['somaDias', ['2025-11-02', 1], '2025-11-03', 'Nova York, fim do horário de verão: 02/nov + 1 = 03/nov']],
    ['America/Sao_Paulo', ['somaDias', ['2018-02-17', 1], '2018-02-18', 'São Paulo, fim do horário de verão de 2018: 17/fev + 1 = 18/fev']],
    ['Pacific/Auckland', ['diasEntre', ['2025-04-05', '2025-04-07'], 2, 'Auckland, fim do horário de verão: de 05/abr a 07/abr = 2 dias']]];
  for (const [tz, caso] of fusos) {
    const ctx = await browser.newContext({ viewport: VP.celular, hasTouch: true, serviceWorkers: 'block', locale: 'pt-BR', timezoneId: tz });
    const { p: pz } = await abrirApp(browser, 'celular', { ctx });
    conferir(await pz.evaluate(() => Intl.DateTimeFormat().resolvedOptions().timeZone) === tz, '[' + tz + '] o navegador está mesmo nesse fuso');
    conferirCasos([caso], await rodar(pz, [caso]), '[' + tz + '] ');
    const todos = CASOS.filter((c) => c[0] !== 'ler'), res = await rodar(pz, todos), erradas = todos.filter((c, i) => res[i].lancou || !bate(res[i].r, c[2]));
    conferir(!erradas.length, '[' + tz + '] as ' + todos.length + ' contas da seção A dão o mesmo resultado' + (erradas.length ? ' (erradas: ' + erradas.slice(0, 3).map((c) => c[3]).join(' | ') + ')' : ''));
    await ctx.close();
  }

  /* ---------- nada sai e nada vaza ---------- */
  console.log('\n— nada sai do aparelho');
  const fim = await p.evaluate(() => ({ mt: window.__mt.length, ponte: window.__rpc.filter((n) => /ponte/.test(n)).length, things: JSON.stringify(DB.raw('things')), telem: JSON.stringify(Telem.list()) }));
  conferir(fim.mt === 0 && fim.ponte === 0, 'nada vai ao MoneyTRIO (nem Bridge.post, nem sol_ponte)');
  conferir(!/_sec/.test(fim.things) && ![PEDIDO, CHAVE, CPF].some((x) => fim.things.includes(x)), 'o registro dos objetos não tem "_sec", pedido, chave da nota nem CPF');
  const logs = consoleTxt.join('\n') + fim.telem;
  conferir(![PEDIDO, CHAVE, CPF].some((x) => logs.includes(x)), 'console e Telem sem pedido, chave da nota ou CPF');
  conferir(!lixo.erros.length && !lixo.nativos.length, 'nenhum erro de página e nenhum alert/confirm nativo' + (lixo.erros.length ? ': ' + lixo.erros.slice(0, 2).join(' | ') : ''));

  /* ---------- G3, o Giro: a troca da chave da família leva junto os papéis e os números das garantias ----------
     No "Supabase de mentira" (teste/mock-sol.js), como o giro-omni.js: a Ana (chefe) abre as Senhas da casa com a chave de
     antes, guarda a nota e os números de uma garantia pelo app, troca a chave (Giro.executar) e termina a troca
     (Giro.descartar). Depois, sem a chave de antes no aparelho, a nota abre e o 👁 mostra o número. */
  console.log('\n— G3: a troca da chave da família (Giro) leva junto os papéis e os números das garantias');
  {
    const { M, db, prepararChaves, ANA, DAVI, GID } = require('./mock-sol');
    const { aparelho, entrarOmni, senhasDaCasa, cadeado225 } = require('./_nuvem');
    await prepararChaves({ soPub: [DAVI] });
    const A = await aparelho(browser, { nome: 'GAR-ana', base: require('./_base').BASE, vp: 'celular' }), a = A.p;
    const FK0 = 'fk-teste', PIN_A = '736251';
    try {
      await entrarOmni(a, ANA);
      await a.evaluate(() => { AOne.save({ hello: 1, tour: 1, tips: Object.assign({}, AOne.cfg().tips, { home: 1, settings: 1, house: 1, family: 1, garantias: 1 }) }); if (AOne.view) AOne.close(); lsSet(GuiaCofre.K, Date.now()); });
      await a.evaluate(() => { Sol.ligadoAp = false; Sol.ligadoPin = false; });
      await senhasDaCasa(a); await cadeado225(a, ANA, PIN_A);
      await a.waitForFunction(() => Cofre.status && Cofre.status.fase === 'aberto' && !document.querySelector('.modal'), null, { timeout: 20000 });
      await a.evaluate(() => { Sol.ligadoAp = null; Sol.ligadoPin = null; });
      await a.evaluate(async () => { for (let i = 0; i < 100 && Cofre._distP; i++) await new Promise((r) => setTimeout(r, 100)); });
      const subir = () => a.evaluate(async () => { for (let i = 0; i < 80; i++) { if (!CloudDriver._flushing) await CloudDriver.flush(true); if (!CloudDriver._flushing && !CloudDriver.fila.size) return; await new Promise((r) => setTimeout(r, 100)); } });
      /* a garantia, os números (pelo formulário) e a nota (pelo botão da ficha) */
      const gid = await a.evaluate(async () => (await DB.put('things', { name: 'Purificador Exemplo', place: '', tags: [], vis: 'familia', garantia: { v: 1, compra: { data: today() } } })).id);
      await a.evaluate((id) => go('garantias', 'ficha', id), gid); await a.waitForTimeout(500);
      await a.click('#screen [data-act="gar.edit"]');
      await a.waitForSelector('dialog[open] [name="_sec.pedido"]', { state: 'attached', timeout: 8000 });
      if (!(await a.evaluate(() => { const i = document.querySelector('dialog[open] [name="_sec.pedido"]'); return !!(i.offsetWidth || i.offsetHeight); }))) await a.click('dialog[open] #garmais');
      await a.fill('dialog[open] [name="_sec.pedido"]', PEDIDO); await a.fill('dialog[open] [name="_sec.valor"]', '500');
      await a.click('dialog[open] [data-ok]'); await a.waitForTimeout(600);
      await a.evaluate((id) => go('garantias', 'ficha', id), gid); await a.waitForTimeout(500);
      const [fc] = await Promise.all([a.waitForEvent('filechooser', { timeout: 8000 }), a.click('#screen [data-act="gar.papel"][data-tipo="nota"]')]);
      await fc.setFiles({ name: 'nota.pdf', mimeType: 'application/pdf', buffer: Buffer.from('%PDF-1.4\n% nota do giro\n') });
      await a.waitForFunction((id) => ((DB.get('things', id).garantia || {}).arquivos || []).length === 1, gid, { timeout: 8000 });
      await subir();
      const antes = await a.evaluate(async (id) => { const t = DB.get('things', id), f = Files.meta(t.garantia.arquivos[0].id); return { fid: f.id, fk: f.enc && f.enc.fk, temV: !!DB.col('vault').get('gv_' + id), fk0: Cofre.fk }; }, gid);
      const linhaV = db.omni_docs.find((d) => d.grupo_id === GID && d.colecao === 'vault' && d.id === 'gv_' + gid);
      conferir(antes.fk === FK0 && antes.fk0 === FK0 && antes.temV && linhaV && JSON.parse(linhaV.dados_cifrado).fk === FK0 && !linhaV.dados_cifrado.includes(PEDIDO), 'Giro. antes: a nota e o item "gv_" das Senhas da casa fechados com a chave de antes (no banco, embaralhado)');
      /* a troca e o "Terminar a troca" */
      const r = await a.evaluate(async () => { try { const x = await Giro.executar(() => {}, {}, { novo: true }); return { ok: true, anexos: x && x.anexos }; } catch (e) { return { erro: e.message }; } });
      const fkN = ((db.omni_docs.find((d) => d.grupo_id === GID && d.colecao === 'settings' && d.id === 'giro') || {}).dados || {}).para;
      conferir(r.ok && fkN && fkN.fk && fkN.fk !== FK0, 'Giro. a troca terminou com uma chave nova (' + JSON.stringify(r.erro || r.anexos) + ')');
      /* como o botão "Terminar a troca" (Giro.descartarPelaTela): apaga as versões antigas e depois este aparelho solta as de antes */
      const d = await a.evaluate(async () => { try { const n = await Giro.descartar(); await Giro.soltarVelhas(); return { n }; } catch (e) { return { erro: e.message }; } });
      const soltou = await a.waitForFunction(() => !Cofre.outras.length, null, { timeout: 15000 }).then(() => true, () => false);
      const depois = await a.evaluate(async (a) => {
        const t = DB.get('things', a.id), f = Files.meta(a.fid); let txt = '', o = null;
        try { txt = await (await Files.blob(a.fid)).text(); } catch (e) { txt = 'erro: ' + e.message; }
        try { o = await Garantias.segredo(t); } catch (e) {}
        return { txt, fk: f.enc && f.enc.fk, o, fkAgora: Cofre.fk, outras: Cofre.outras.length };
      }, { id: gid, fid: antes.fid });
      const linhaV2 = db.omni_docs.find((x) => x.grupo_id === GID && x.colecao === 'vault' && x.id === 'gv_' + gid);
      conferir(d.n != null && soltou && depois.outras === 0 && depois.fkAgora === fkN.fk, 'Giro. "Terminar a troca": a versão antiga é apagada e o aparelho solta a chave de antes (' + JSON.stringify(d) + ')');
      conferir(depois.fk === fkN.fk && depois.txt.startsWith('%PDF-1.4\n% nota do giro'), 'Giro. a nota da garantia passou para a chave nova e abre (' + depois.txt.slice(0, 30) + ')');
      conferir(depois.o && depois.o.pedido === PEDIDO && depois.o.valorCent === '50000' && depois.o.garantiaDe === gid && linhaV2 && JSON.parse(linhaV2.dados_cifrado).fk === fkN.fk, 'Giro. os números da garantia (item "gv_" das Senhas) passaram para a chave nova e abrem');
      await a.evaluate((id) => go('garantias', 'ficha', id), gid);
      await a.waitForFunction(() => document.querySelector('#garnum [data-olho]'), null, { timeout: 8000 }).catch(() => {});
      const olhoG = await a.$('#garnum [data-olho]'); if (olhoG) await olhoG.click();
      conferir(!!olhoG && (await a.locator('#garnum').innerText()).includes(PEDIDO), 'Giro. depois da troca e do "Terminar a troca", o 👁 da ficha mostra o número');
      conferir(!A.lixo.erros.length && !A.lixo.nativos.length, 'Giro. nenhum erro de página nem alert nativo' + (A.lixo.erros.length ? ': ' + A.lixo.erros[0] : ''));
    } catch (e) { conferir(false, 'Giro: o teste parou no meio — ' + String((e && e.message) || e).split('\n')[0]); }
    await A.ctx.close().catch(() => {});
  }
  await terminar(falhas, browser, 'garantias (G1: contas, leitura, arquivo, lixo, B0 e fusos; G2: a aba e a lista; G3: a ficha, o formulário, as Senhas da casa, os papéis, o Onde está?, o apagar e o Giro)');
})().catch((e) => { console.error(e); process.exit(1); });
