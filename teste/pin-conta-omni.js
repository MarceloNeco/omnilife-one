/* PIN da conta SolverONE no OmniLifeONE (2.26.0, Parte B) — a rede, o PIN da conta e as telas dele.
   No "Supabase de mentira" (teste/mock-sol.js): cada aparelho é um contexto do navegador e todos falam com o mesmo banco,
   que mora neste processo. Nada vai para a internet nem para o Supabase de verdade. Confere:
     1. aparelho de antes (o cadeado como a 2.25 gravava pelo "Usar neste …" com o código do papel, sem lugar na lista da conta):
        abre com o PIN dele e entra na lista como "primeiro"; a conta sem PIN CONTINUA sem PIN; sem internet abre pelo PIN de
        sempre (e o erro conta neste aparelho)
     2. com a conta já no MoneyTRIO (de mentira): a Jornada diz "outroApp" e o aparelho de antes entra na lista como "kit"
     3. registro único (Promise.all no mesmo aparelho e em duas abas) e a trava do cadeado: 20× o PIN, o aoAbrir e outra
        gravação ao mesmo tempo, com o PIN da conta trocado no banco a cada vez — nada se perde
     4. PIN da conta: criar (o PIN antigo deixa de abrir, com e sem internet); trocado em outro aparelho (o v com o sal novo,
        sem gastar tentativa, e o PIN das chaves de IA acompanha depois de abrir); trocar (o atual errado não troca);
        "não lembro" (só aparelho aprovado há pouco); aprovar com o PIN daqui (só vai ao banco se o daqui está velho)
     5. sem o SQL (M.semPin / M.semAp): o PIN do aparelho, como na 2.25; os dois sinais são separados e voltam a testar
     6. aparelho tirado da conta: nem o PIN certo nem a digital (autenticador virtual) abrem; o cadeado, a chave do
        navegador e as chaves de IA saem daqui, a conta sai, e os dados da família (Saúde, documentos…) ficam
     7. a Jornada: contaNova (Cris), naoGuardiao (Davi), semRede
     As telas (etapa 4), com a conta da Ana zerada no banco e três aparelhos de antes, cada um com o seu PIN:
     B1  celular: abre com o PIN dele → "Crie o PIN da sua conta" → cria (versão 1, "primeiro"); computador: pela janela das chaves
         de IA, por cima de outra janela → "Agora o PIN é um só para a conta" ("kit"); terceiro: o PIN da conta → "Falta só um
         passo" → o antigo uma vez. Depois de cada um, o PIN antigo não abre mais e o PIN das chaves de IA é o da conta (G1)
     B2  a Bia, conta sem PIN, aberta pela digital: "Crie o PIN" sem pedir o antigo; PIN fácil, com letra, curto ou diferente recusado
     B3  trocar o PIN no computador (o atual errado não troca) → o celular aberto tranca no aoAbrir e avisa; o novo abre (G1)
     B3b trocado há menos de 15 s: o PIN novo abre sem gastar tentativa · B4 10 erros → 24 h ("Faltam N" do 5º ao 9º)
     B6  sem internet pelo PIN que o aparelho conhece (o contador avisa a partir do 4º erro); voltou a internet → tranca e pede o novo
     B7  "Criar o PIN da conta" × "Trocar o PIN": nunca os dois, "Trocar" nunca sem PIN da conta nem sem internet
     K31 nenhuma tela da sequência fica esperando atrás de outra · K32 trocar o PIN da conta não troca as chaves de outra pessoa
     K17 a digital oferecida uma vez por aparelho, nunca na mesma entrada da oferta de abrir o app com a digital
     8. (B8) nada de PIN ou segredo no localStorage/sessionStorage, no console, no histórico nem nas chamadas (só o v); sem erro de script,
        sem diálogo nativo, nada fora do banco de mentira
   Pessoas, senhas, PINs e chaves de mentira. Uso: node teste/rodar.js   ·   sozinho: BASE=http://localhost:8099 node teste/pin-conta-omni.js */
const crypto = require('crypto');
const { BASE, criarConferir, iniciar, terminar } = require('./_base');
const { M, db, rpcs, prepararChaves, PESSOAS, ANA, BIA, CRIS, DAVI, GID, b64u } = require('./mock-sol');
const { aparelho, entrarOmni, senhasDaCasa, semRede, cadeado225 } = require('./_nuvem');

const PIN_ANA = '736251', PIN_BIA = '284613', PIN_CONTA = '590317', PIN_NOVO = '482915', PIN_X = '615048', PIN_Y = '903726';
/* Parte B (a Ana de novo, com a conta zerada no banco): o PIN antigo de cada aparelho e as versões do PIN da conta */
const PIN_CEL = '736251', PIN_PC = '482915', PIN_T = '111222', PIN_V2 = '615048', PIN_V3 = '903726', PIN_V4 = '357914', PIN_BIA_CONTA = '528061', PIN_BIA_NOVO = '640273';
const PINS = [PIN_ANA, PIN_BIA, PIN_CONTA, PIN_NOVO, PIN_X, PIN_Y, PIN_T, PIN_V4, PIN_BIA_CONTA, PIN_BIA_NOVO];
const CHAVE = 'mentira-groq-pin-conta-0123456789';

async function ate(fn, ms) { const fim = Date.now() + (ms || 8000); while (Date.now() < fim) { if (await fn()) return true; await new Promise((r) => setTimeout(r, 100)); } return !!(await fn()); }
const linhas = (uid) => db.sol_aparelhos.filter((a) => a.user_id === uid && !a.removido_em);
const pinDaConta = (uid) => db.sol_pin_conta.find((x) => x.user_id === uid);
/* o v do PIN como o app calcula (PBKDF2 600 mil sobre o sal da conta): o "outro aparelho" que troca o PIN no banco */
const vs = {};
const vNode = (pin, sal) => vs[pin + '|' + sal] || (vs[pin + '|' + sal] = b64u(crypto.pbkdf2Sync(Buffer.from(String(pin), 'utf8'), Buffer.from(sal, 'base64url'), 600000, 32, 'sha256')));
function trocarNoBanco(uid, atual, novo) {
  const p = pinDaConta(uid), sal = b64u(crypto.randomBytes(16));
  const r = rpcs.sol_pin_definir(uid, { p_v_novo: vNode(novo, sal), p_sal_novo: sal, p_v_atual: vNode(atual, p.sal), p_ap: linhas(uid)[0].id });
  if (!r.ok) throw new Error('trocarNoBanco: ' + JSON.stringify(r));
  return r.versao;
}
const tranca = (p) => p.evaluate(async () => { await SolverCofre.trancar(); Cofre.trancar(); });
const local = (p) => p.evaluate(async () => { const L = await Cofre.local(); return L && { ap: L.ap || null, como: L.como || null, srv: !!L.srv, pinVersao: L.pinVersao || 0, avisosAte: L.avisosAte || null, prf: !!L.prf, sk: !!L.sk, fam: Object.keys(L.fam || {}), erros: L.erros || 0 }; });
const abrir = (p, pin) => p.evaluate(async (pin) => { Cofre.trancar(); const r = await Cofre.destrancarPin(pin); return { ok: r.ok === true, erro: r.erro || null, conta: !!r.conta, criarPin: !!r.criarPin, aberto: Cofre.aberto(), texto: Pin.explicar(r) }; }, pin);
/* o cadeado de um aparelho de antes (como a 2.25 gravava pelo "Usar neste …": o código do papel e um PIN só deste aparelho;
   ver cadeado225 no _nuvem.js). O SQL novo "desligado" no preparo (fora da lista da conta). digital: liga a digital no fim */
async function cadeadoAntigo(p, uid, pin, digital) {
  /* o "Olá" e as dicas do AssistONE abrem sozinhos (1,4 s depois de desenhar, sem janela aberta) e cobririam os botões */
  await p.evaluate(() => { Sol.ligadoAp = false; Sol.ligadoPin = false; AOne.save({ hello: 1, tour: 1, tips: Object.assign({}, AOne.cfg().tips, { home: 1, settings: 1, house: 1 }) }); if (AOne.view) AOne.close(); });
  await senhasDaCasa(p);
  await cadeado225(p, uid, pin, digital);
  await p.waitForFunction(() => Cofre.status && Cofre.status.fase === 'aberto' && !document.querySelector('.modal'), null, { timeout: 20000 });
  await p.evaluate(() => { Sol.ligadoAp = null; Sol.ligadoPin = null; });
}
/* abre pela tela (Casa → Senhas da casa → campo do PIN → Abrir), com o cadeado fechado */
async function abrirPelaTela(p, pin) {
  await tranca(p); await senhasDaCasa(p);
  await p.waitForSelector('#cfpin', { timeout: 10000 });
  await p.fill('#cfpin', pin); await p.click('[data-act="cofre.pin"]');
}
const toasts = (p) => p.evaluate(() => document.querySelector('#toasts').textContent);
/* nada de PIN nem de segredo guardado fora do cadeado */
const guardado = (p) => p.evaluate(() => { const o = {}; for (const s of [localStorage, sessionStorage]) for (let i = 0; i < s.length; i++) o[s.key(i)] = s.getItem(s.key(i)); return JSON.stringify(o); });
/* quem abriu a família neste aparelho (para provar que NADA abriu) */
/* (2.26.0: o aparelho tirado sai e a página recarrega — a conta fica no sessionStorage da aba, fora das chaves "omnilife." que a saída limpa) */
const vigiarAbertura = (p) => p.evaluate(() => { sessionStorage.setItem('teste.abriu', '0'); const o = Cofre.usarChave; Cofre.usarChave = function () { sessionStorage.setItem('teste.abriu', String(+sessionStorage.getItem('teste.abriu') + 1)); return o.apply(this, arguments); }; });
/* ---- as telas (Parte B) ---- */
const janela = (p, re, ms) => p.waitForFunction((re) => [...document.querySelectorAll('.modal h3')].some((h) => new RegExp(re).test(h.textContent)), re.source, { timeout: ms || 10000 }).then(() => true, () => false);
const temJanela = (p, re) => p.evaluate((re) => [...document.querySelectorAll('.modal h3')].some((h) => new RegExp(re).test(h.textContent)), re);
const semFila = (p) => p.evaluate(() => SolverJanela.esperando() === 0);   /* nenhuma janela esperando atrás de outra (K31) */
const naTela = (p, sel) => p.evaluate((s) => !!document.querySelector(s), sel);
async function preencher(p, campos) { for (const [id, v] of Object.entries(campos)) await p.fill('.modal #' + id, v); await p.click('.modal #pcOk'); }
const erroEm = (p, re) => p.waitForFunction((re) => new RegExp(re).test((document.querySelector('.modal #pcErr') || {}).textContent || ''), re, { timeout: 10000 }).then(() => true, () => false);
const fechou = (p, sel) => p.waitForSelector('.modal ' + sel, { state: 'detached', timeout: 20000 }).then(() => true, () => false);
const limparToasts = (p) => p.evaluate(() => { document.querySelector('#toasts').innerHTML = ''; });
/* o PIN abre as chaves de IA como nos outros apps (a conta do cofre.js) */
const chaves = (p, pin) => p.evaluate((pin) => SolverCofre.trancar().then(() => SolverCofre.abrir(pin)).then(() => 'abriu', (e) => e.message), pin);
/* guardar a primeira chave de IA: a janela "Digite o seu PIN" das Senhas da casa (as chaves ficam ligadas à pessoa) */
async function guardarChave(p, pin) {
  const salvando = p.evaluate((c) => Keys.set('groq', c, { pt: 'teste', en: 'test' }).then(() => 'ok', (e) => e.message), CHAVE);
  await p.waitForSelector('.modal #upin', { timeout: 8000 }); await p.fill('#upin', pin); await p.click('.modal:has(#upin) [data-ok]');
  return salvando;
}
/* Casa → Senhas da casa com o estado de agora (relê a Jornada e redesenha): o texto, o HTML e o status da tela */
async function casaAgora(p) {
  await senhasDaCasa(p);
  return p.evaluate(async () => { Jornada.limpar(); await Cofre.atualizar(); render(); const s = document.querySelector('#screen'); return { texto: s.innerText, html: s.innerHTML, status: JSON.parse(JSON.stringify(Cofre.status)) }; });
}
/* a conta como nova no banco novo (sem aparelhos na lista e sem PIN da conta): a Parte B começa do zero */
function zerarConta(uid) { for (const t of ['sol_aparelhos', 'sol_pin_conta', 'sol_aparelho_pin']) { const fica = db[t].filter((x) => x.user_id !== uid); db[t].splice(0, db[t].length, ...fica); } }

(async () => {
  const browser = await iniciar();
  const { falhas, conferir } = criarConferir();
  await prepararChaves();
  const lixos = [];

  /* ---------- 1. o aparelho de antes da Ana (computador): abre pelo PIN dele e entra na lista como "primeiro" ---------- */
  console.log('1. O aparelho de antes da Ana (cadeado da 2.25) abre pelo PIN dele e entra na lista da conta');
  const A = await aparelho(browser, { nome: 'Ana', vp: 'computador', base: BASE }), a = A.p; lixos.push(A.lixo);
  await entrarOmni(a, ANA);
  await cadeadoAntigo(a, ANA, PIN_ANA);
  let L = await local(a);
  conferir(L && L.sk && L.fam.includes(GID) && !L.ap && !L.srv && !L.pinVersao && !linhas(ANA).length && !pinDaConta(ANA),
    '1. preparo: o cadeado como a 2.25 grava (chave pessoal e a família, sem lugar na lista, sem PIN da conta) — nada no banco novo');
  const n0 = M.log.length;
  await abrirPelaTela(a, PIN_ANA);
  conferir(await a.waitForFunction(() => Cofre.aberto(), null, { timeout: 20000 }).then(() => true, () => false), '1. o PIN antigo deste aparelho abre as Senhas da casa (pela tela)');
  L = await local(a);
  const l1 = linhas(ANA);
  conferir(l1.length === 1 && L.ap === l1[0].id && l1[0].como === 'primeiro' && L.como === 'primeiro' && l1[0].app === 'omnilife' && l1[0].nome === 'Linux · Chrome' && /^\d{4}-\d\d-\d\dT/.test(L.avisosAte || ''),
    '1. entrou na lista da conta como "primeiro" (app "omnilife", "Linux · Chrome"); o cadeado guarda o ap, o "como" e o avisosAte');
  conferir(!pinDaConta(ANA) && !L.srv && !L.pinVersao && !M.log.slice(n0).some((x) => /sol_pin_(definir|conferir)/.test(x.caminho)),
    '1. a conta sem PIN CONTINUA sem PIN: nada foi definido nem conferido no banco (sol_pin_conta vazio)');
  conferir(await janela(a, /Crie o PIN da sua conta SolverONE/) && await a.evaluate(() => !!document.querySelector('.modal #pcDepois') && !document.querySelector('#screen [data-act="conta.pin.trocar"]')),
    '1. logo depois de abrir, "Crie o PIN da sua conta SolverONE" (com "Agora não"); "Trocar o PIN" não aparece');
  await a.click('.modal #pcDepois');
  await a.waitForSelector('.modal #pcP1', { state: 'detached', timeout: 5000 });
  const st1 = await a.evaluate(async () => { await Cofre.atualizar(); return Cofre.status; });
  conferir(st1.caso === 'aberto' && st1.criarPin && !st1.trocarPin && !st1.tem && st1.ap === L.ap, '1. a Jornada: aberto, "Criar o PIN da conta" (e nunca "Trocar") enquanto a conta não tem PIN');
  const r1 = await abrir(a, PIN_ANA);
  conferir(r1.ok && r1.criarPin && linhas(ANA).length === 1 && !pinDaConta(ANA), '1. de novo: abre, não registra outra vez e a conta continua sem PIN');
  await semRede(A.ctx, true);
  const r1e = await abrir(a, '000000'), L1e = await local(a), r1c = await abrir(a, PIN_ANA), L1c = await local(a);
  await semRede(A.ctx, false);
  conferir(r1e.erro === 'pin' && !r1e.conta && L1e.erros === 1 && r1c.ok && r1c.aberto && L1c.erros === 0, '1. sem internet: abre pelo PIN que o aparelho conhece (o erro conta aqui, e zera ao acertar)');

  /* ---------- 3. registro único e a trava do cadeado ---------- */
  console.log('3. Registro único e a trava do cadeado (concorrência)');
  const semAp = () => a.evaluate(() => Cofre.mudarLocal(null, (L) => { delete L.ap; delete L.como; return L; }));
  await semAp(); await tranca(a);
  let n = linhas(ANA).length;
  const k6 = await a.evaluate(async (pin) => {
    const [x, y, z] = await Promise.all([Aparelhos.registrar(), Aparelhos.registrar(), Cofre.destrancarPin(pin)]);
    const L = await Cofre.local(); return { x: x && x.ap, y: y && y.ap, ok: z.ok === true, ap: L.ap, como: L.como };
  }, PIN_ANA);
  conferir(linhas(ANA).length === n + 1 && k6.ok && k6.x === k6.ap && k6.y === k6.ap && k6.como === 'kit' && linhas(ANA).some((l) => l.id === k6.ap && l.como === 'kit'),
    '3. dois registrar() e o PIN ao mesmo tempo, no mesmo aparelho: UMA linha nova (como "kit": a conta já tinha aparelho)');
  /* duas abas do mesmo aparelho: a trava do navegador (navigator.locks) e o L relido dentro dela */
  const a2 = await A.ctx.newPage(); a2.on('pageerror', (e) => A.lixo.erros.push('aba 2: ' + (e && e.message || e)));
  await a2.goto(BASE + '/index.html');
  await a2.waitForFunction((u) => typeof S !== 'undefined' && S.booted && S.family && S.user && S.user.uid === u, ANA, { timeout: 30000 });
  await semAp(); n = linhas(ANA).length;
  const abas = await Promise.all([a, a2].map((pg) => pg.evaluate(() => Aparelhos.registrar().then((L) => (L && L.ap) || 'já tinha', (e) => 'erro: ' + e.message))));
  const apAbas = (await local(a)).ap;
  conferir(linhas(ANA).length === n + 1 && abas.filter((x) => x === apAbas).length === 1 && abas.includes('já tinha'), '3. duas abas registrando ao mesmo tempo: UMA linha nova (a segunda aba relê o cadeado e vê que já tem)');
  await a2.close();
  const apAna = apAbas;

  /* ---------- 4. o PIN da conta ---------- */
  console.log('4. O PIN da conta: criar, trocado em outro aparelho, trocar, não lembro, aprovar com o PIN daqui');
  await abrir(a, PIN_ANA);
  const c4 = await a.evaluate((pin) => Pin.criar(pin), PIN_CONTA);
  L = await local(a);
  conferir(c4.ok && pinDaConta(ANA) && pinDaConta(ANA).versao === 1 && L.srv && L.pinVersao === 1 && L.ap === apAna, '4. criar o PIN da conta: versão 1 no banco; aqui o L.srv e a versão');
  conferir(await a.evaluate(async (ap) => { const L = await Cofre.local(), x = await Pin.abrirSrv(L.srv, ap); return x.length === 32; }, db.sol_aparelho_pin.find((x) => x.ap_id === apAna).segredo),
    '4. o L.srv abre com o segredo que o banco guarda para ESTE aparelho');
  const r4a = await abrir(a, PIN_ANA);
  conferir(r4a.erro === 'pin' && r4a.conta && !r4a.aberto && /PIN errado/.test(r4a.texto), '4. o PIN antigo deste aparelho não abre mais (com internet: "PIN errado", da conta)');
  await semRede(A.ctx, true);
  const r4b = await abrir(a, PIN_ANA), r4c = await abrir(a, PIN_CONTA);
  await semRede(A.ctx, false);
  conferir(r4b.erro === 'pin' && !r4b.conta && r4c.ok, '4. sem internet também: o antigo não abre, o PIN da conta abre (o L.pin foi refeito com ele)');
  const r4d = await abrir(a, PIN_CONTA);
  conferir(r4d.ok && !r4d.criarPin && pinDaConta(ANA).tentativas === 0, '4. com internet, o PIN da conta abre (e zera as tentativas da conta)');
  /* as chaves de IA nascem com o PIN da pessoa (a janela "Digite o seu PIN" das Senhas da casa) */
  const salvando = a.evaluate((c) => Keys.set('groq', c, { pt: 'teste', en: 'test' }).then(() => 'ok', (e) => e.message), CHAVE);
  await a.waitForSelector('.modal #upin', { timeout: 8000 }); await a.fill('#upin', PIN_CONTA); await a.click('.modal:has(#upin) [data-ok]');
  conferir(await salvando === 'ok' && await a.evaluate((u) => SolverCofre.pessoas().includes(u), ANA), 'preparo: a chave de IA fica guardada com o PIN da pessoa (ligada à Ana)');
  /* outro aparelho troca o PIN (versão 2, sal novo); aqui a tela tinha o PIN da conta em memória (15 s) com o sal velho */
  await a.evaluate(() => Pin.info());
  const v2 = trocarNoBanco(ANA, PIN_CONTA, PIN_NOVO);
  await tranca(a);
  const r4e = await abrir(a, PIN_NOVO); L = await local(a);
  conferir(r4e.ok && L.pinVersao === v2 && v2 === 2 && pinDaConta(ANA).tentativas === 0, '4. trocado em outro aparelho: o PIN novo abre na hora (v com o sal novo, não o da memória) e não gasta tentativa da conta');
  const g1 = await a.evaluate(async (x) => { const t = (pin) => SolverCofre.trancar().then(() => SolverCofre.abrir(pin)).then(() => 'abriu', (e) => e.message); return [await t(x.novo), await t(x.velho)]; }, { novo: PIN_NOVO, velho: PIN_CONTA });
  conferir(g1[0] === 'abriu' && g1[1] === 'pin-errado', '4. e o PIN das chaves de IA acompanhou DEPOIS de abrir: o novo abre as chaves, o velho não (um PIN só)');
  conferir(!(await abrir(a, PIN_CONTA)).ok, '4. o PIN velho da conta não abre mais as Senhas da casa');

  /* a trava do cadeado: 20× o PIN + o aoAbrir + outra gravação, com o PIN trocado no banco a cada vez */
  const ruins = [];
  for (let i = 0; i < 20; i++) {
    const versao = trocarNoBanco(ANA, PIN_NOVO, PIN_NOVO);
    const r = await a.evaluate(async (x) => {
      Cofre.trancar();
      const [o] = await Promise.all([Cofre.destrancarPin(x.pin), Aparelhos.aoAbrir(), Cofre.mudarLocal(null, (L) => { if (L) { L.avisosAte = x.marca; return L; } })]);
      const L = await Cofre.local(); return { ok: o.ok === true, aberto: Cofre.aberto(), versao: L.pinVersao, srv: !!L.srv, ap: L.ap, marca: L.avisosAte };
    }, { pin: PIN_NOVO, marca: 'marca-' + i });
    if (!(r.ok && r.aberto && r.versao === versao && r.srv && r.ap === apAna && r.marca === 'marca-' + i)) ruins.push(i + ': ' + JSON.stringify(r) + ' (banco v' + versao + ')');
  }
  const segAna = db.sol_aparelho_pin.find((x) => x.ap_id === apAna).segredo;
  conferir(!ruins.length && await a.evaluate(async (s) => (await Pin.abrirSrv((await Cofre.local()).srv, s)).length === 32, segAna) && linhas(ANA).length === n + 1,
    '3. 20× PIN + aoAbrir + outra gravação ao mesmo tempo: o L.srv, a versão, o ap e a outra gravação sempre os do fim (nenhuma linha nova)' + (ruins.length ? ': ' + ruins.join(' | ') : ''));

  const vAntes = pinDaConta(ANA).versao;
  const t1 = await a.evaluate(() => Pin.trocar('000000', '615048'));
  conferir(t1.erro === 'pin' && t1.conta && pinDaConta(ANA).versao === vAntes && (await abrir(a, PIN_NOVO)).ok, '4. trocar com o PIN atual errado: não troca nada (o banco confere)');
  const t2 = await a.evaluate((x) => Pin.trocar(x.atual, x.novo), { atual: PIN_NOVO, novo: PIN_X });
  L = await local(a);
  const g2 = await a.evaluate((pin) => SolverCofre.trancar().then(() => SolverCofre.abrir(pin)).then(() => 'abriu', (e) => e.message), PIN_X);
  conferir(t2.ok && pinDaConta(ANA).versao === vAntes + 1 && L.pinVersao === vAntes + 1 && (await abrir(a, PIN_X)).ok && g2 === 'abriu', '4. trocar com o PIN atual: versão nova no banco e aqui; o novo abre as Senhas da casa e as chaves de IA');
  const nl = await a.evaluate((ap) => Pin.naoLembro('903726', ap), apAna);
  conferir(nl.erro === 'sem_permissao' && pinDaConta(ANA).versao === vAntes + 1, '4. "não lembro" (PIN novo sem o atual): recusado para aparelho que não acabou de ser aprovado');
  const vY = trocarNoBanco(ANA, PIN_X, PIN_Y);
  const ap2 = await a.evaluate(async (pin) => { const r = await Pin.dukParaAprovar(pin); const L = await Cofre.local(); return { raw: !!(r.raw && r.raw.length === 32), versao: L.pinVersao }; }, PIN_Y);
  conferir(ap2.raw && ap2.versao === vY, '4. aprovar com o PIN daqui, trocado em outro aparelho: vai ao banco com o PIN novo e refaz o L.pin');
  const tent = pinDaConta(ANA).tentativas, n4 = M.log.length;
  const ap3 = await a.evaluate(async () => { const r = await Pin.dukParaAprovar('000000'); return r.erro + (r.conta ? ':conta' : ''); });
  conferir(ap3 === 'pin' && pinDaConta(ANA).tentativas === tent && !M.log.slice(n4).some((x) => /sol_pin_conferir/.test(x.caminho)),
    '4. com o PIN daqui em dia, a aprovação confere só aqui: PIN errado não gasta tentativa da conta (o banco nem é chamado)');

  /* ---------- 6. A11: tirado em outro aparelho, o PIN certo não abre nada ---------- */
  console.log('6. Aparelho tirado da conta: o PIN certo não abre');
  await abrir(a, PIN_Y);
  const nuvemAntes = await a.evaluate(async (g) => { const e = await IDB.entries('nuvem'); return { outros: e.filter(([k]) => k.startsWith(g + '|') && !k.includes('|vault|')).length }; }, GID);
  rpcs.sol_aparelho_tirar(ANA, { p_id: apAna });
  await tranca(a); await vigiarAbertura(a);
  const n6 = M.log.length;
  await abrirPelaTela(a, PIN_Y);
  const saiu = await a.waitForFunction(() => S.gate === 'welcome', null, { timeout: 20000 }).then(() => true, () => false);
  const fim6 = await a.evaluate(async (u) => ({ abriu: +sessionStorage.getItem('teste.abriu'), aberto: Cofre.aberto(), conta: Conta.on(), L: await IDB.get('kv', 'cofre|' + u), chaveAp: await IDB.get('kv', 'chaveAp|' + u),
    chavesIA: SolverCofre.existe() }), ANA);
  const nuvemDepois = await a.evaluate(async (g) => (await IDB.entries('nuvem')).filter(([k]) => k.startsWith(g + '|') && !k.includes('|vault|')).length, GID);
  conferir(saiu && fim6.abriu === 0 && !fim6.aberto && M.log.slice(n6).some((x) => /sol_pin_conferir/.test(x.caminho)) && M.log.slice(n6).some((x) => /sol_aparelho_visto/.test(x.caminho)), '6. o PIN certo (o L.pin conhecia) NÃO abriu nada: o banco disse "aparelho" e não caiu para o PIN local');
  conferir(!fim6.conta && !fim6.L && !fim6.chaveAp && !fim6.chavesIA && /foi tirado da sua conta em outro aparelho/.test(await toasts(a)),
    '6. confirmado o "tirado": o cadeado, a chave deste navegador e as chaves de IA (só da Ana) saíram, a conta saiu deste aparelho e o aviso apareceu');
  conferir(nuvemAntes.outros > 0 && nuvemDepois === nuvemAntes.outros, '6. os dados da família guardados neste aparelho (fora das Senhas da casa) continuam (' + nuvemDepois + ')');
  const guardA = await guardado(a);
  await A.ctx.close();

  /* ================= Parte B — as telas do PIN da conta (a Ana de novo, com a conta zerada no banco) ================= */
  console.log('B1. A mudança para o PIN da conta com um PIN diferente em cada aparelho (celular, computador e um terceiro)');
  zerarConta(ANA);
  const CEL = await aparelho(browser, { nome: 'Ana-celular', vp: 'celular', base: BASE }), cel = CEL.p; lixos.push(CEL.lixo);
  await entrarOmni(cel, ANA);
  await cadeadoAntigo(cel, ANA, PIN_CEL);
  conferir(await guardarChave(cel, PIN_CEL) === 'ok', 'B1. preparo: no celular, a chave de IA guardada com o PIN antigo dele (ligada à Ana)');
  await abrirPelaTela(cel, PIN_CEL);
  conferir(await janela(cel, /Crie o PIN da sua conta SolverONE/) && await naTela(cel, '.modal #pcDepois') && await semFila(cel),
    'B1. celular: abre com o PIN dele e logo aparece "Crie o PIN da sua conta SolverONE" (com "Agora não"), nada na fila');
  L = await local(cel);
  conferir(!pinDaConta(ANA) && linhas(ANA).length === 1 && linhas(ANA)[0].como === 'primeiro' && L.ap === linhas(ANA)[0].id && !L.srv,
    'B1. a conta continua sem PIN (nada criado sozinho) e o celular entrou na lista como "primeiro"');
  conferir(await naTela(cel, '#screen [data-act="conta.pin.criar"]') && !(await naTela(cel, '#screen [data-act="conta.pin.trocar"]')),
    'B7. conta sem PIN: nas Senhas da casa, "Criar o PIN da conta" e nunca "Trocar o PIN"');
  await preencher(cel, { pcP1: PIN_CONTA, pcP2: PIN_CONTA });
  conferir(await fechou(cel, '#pcP1'), 'B1. "Salvar o PIN": a tela fecha');
  L = await local(cel);
  conferir(pinDaConta(ANA) && pinDaConta(ANA).versao === 1 && L.srv && L.pinVersao === 1 && L.como === 'primeiro' && /PIN da conta criado/.test(await toasts(cel)),
    'B1. criou o PIN da conta: versão 1 no banco; no celular o L.srv e a versão 1 ("✓ PIN da conta criado…")');
  conferir(await chaves(cel, PIN_CONTA) === 'abriu' && await chaves(cel, PIN_CEL) === 'pin-errado', 'B1. G1: o PIN das chaves de IA passou a ser o da conta (o antigo do celular não abre mais as chaves)');
  const b1a = await abrir(cel, PIN_CEL), b1b = await abrir(cel, PIN_CONTA);
  conferir(!b1a.ok && b1a.conta && b1b.ok, 'B1. o PIN antigo do celular não abre mais as Senhas da casa; o PIN da conta abre');

  const PC = await aparelho(browser, { nome: 'Ana-computador', vp: 'computador', base: BASE }), pc = PC.p; lixos.push(PC.lixo);
  await entrarOmni(pc, ANA);
  await cadeadoAntigo(pc, ANA, PIN_PC);
  conferir(await guardarChave(pc, PIN_PC) === 'ok', 'B1. preparo: no computador, a chave de IA guardada com o PIN antigo dele');
  await tranca(pc);
  /* pela janela das chaves de IA, aberta por cima de outra janela (K31): nenhuma tela da sequência espera atrás de outra */
  await pc.evaluate(() => modal({ title: 'Groq de mentira', body: '<p>janela de baixo</p>' }));
  const lendoPc = pc.evaluate(() => Keys.need('groq', { pt: 'teste', en: 'test' }).then((v) => v, (e) => 'erro: ' + e.message));
  await pc.waitForSelector('.modal #upin', { timeout: 8000 }); await pc.fill('#upin', PIN_PC); await pc.click('.modal:has(#upin) [data-ok]');
  conferir(await janela(pc, /Agora o PIN é um só para a conta/) && await semFila(pc) && await temJanela(pc, 'Groq de mentira') && !(await naTela(pc, '.modal #upin')),
    'B1. computador (pela janela das chaves de IA, por cima de outra): o PIN antigo dele abre "Agora o PIN é um só para a conta" no lugar da janela do PIN, nada na fila');
  L = await local(pc);
  conferir(L.ap && linhas(ANA).some((l) => l.id === L.ap && l.como === 'kit') && L.como === 'kit' && !L.srv, 'B1. o computador entrou na lista como "kit" (a conta já tinha aparelho) e ainda não está no PIN da conta');
  await pc.fill('.modal #pcPin', '000000'); await pc.click('.modal #pcOk');
  conferir(await erroEm(pc, 'PIN errado') && !(await local(pc)).srv && await naTela(pc, '.modal #pcEsqueci'), 'B1. o PIN da conta errado avisa ("PIN errado") e nada muda; "Esqueci o PIN da conta" está ali');
  await pc.fill('.modal #pcPin', PIN_CONTA); await pc.click('.modal #pcOk');
  conferir(await lendoPc === CHAVE && await temJanela(pc, 'Groq de mentira') && await semFila(pc), 'B1. com o PIN da conta, a chave de IA sai e a janela de baixo continua (nada na fila)');
  L = await local(pc);
  conferir(L.srv && L.pinVersao === 1 && L.como === 'kit', 'B1. o computador passou para o PIN da conta (L.srv, versão 1)');
  conferir(await chaves(pc, PIN_CONTA) === 'abriu' && await chaves(pc, PIN_PC) === 'pin-errado', 'B1. G1: no computador, o PIN das chaves de IA passou a ser o da conta');
  conferir(!(await abrir(pc, PIN_PC)).ok && (await abrir(pc, PIN_CONTA)).ok, 'B1. o PIN antigo do computador não abre mais as Senhas da casa; o da conta abre');
  await pc.evaluate(() => closeModals());

  const T = await aparelho(browser, { nome: 'Ana-terceiro', vp: 'celular', base: BASE }), t = T.p; lixos.push(T.lixo);
  await entrarOmni(t, ANA);
  await cadeadoAntigo(t, ANA, PIN_T);
  conferir(await guardarChave(t, PIN_T) === 'ok', 'B1. preparo: no terceiro, a chave de IA guardada com o PIN antigo dele');
  await t.evaluate(() => Aparelhos.aoAbrir());   /* aberto aqui: entra na lista sem digitar PIN */
  L = await local(t);
  conferir(L.ap && L.como === 'kit' && !L.srv, 'B1. o terceiro entrou na lista ao abrir ("kit"), ainda no PIN antigo dele');
  await abrirPelaTela(t, PIN_CONTA);
  conferir(await janela(t, /Falta só um passo/) && await naTela(t, '.modal #pcAntigo') && await naTela(t, '.modal #pcEsqueci') && await semFila(t),
    'B1. terceiro: o PIN da conta abre "Falta só um passo" (o campo do PIN antigo e "Não lembro"), nada na fila');
  await preencher(t, { pcAntigo: '000000' });
  conferir(await erroEm(t, 'Esse não é o PIN antigo deste aparelho') && !(await local(t)).srv, 'B1. o PIN antigo errado: "Esse não é o PIN antigo deste aparelho." e nada muda');
  await preencher(t, { pcAntigo: PIN_T });
  conferir(await fechou(t, '#pcAntigo') && await t.waitForFunction(() => Cofre.aberto(), null, { timeout: 15000 }).then(() => true, () => false), 'B1. com o PIN antigo uma vez, as Senhas da casa abrem');
  L = await local(t);
  conferir(L.srv && L.pinVersao === 1, 'B1. o terceiro passou para o PIN da conta (L.srv, versão 1)');
  conferir(await chaves(t, PIN_CONTA) === 'abriu' && await chaves(t, PIN_T) === 'pin-errado', 'B1. G1: no terceiro, o PIN das chaves de IA passou a ser o da conta');
  conferir(!(await abrir(t, PIN_T)).ok && (await abrir(t, PIN_CONTA)).ok, 'B1. o PIN antigo do terceiro não abre mais; o da conta abre');
  const guardT = await guardado(t);
  await T.ctx.close();

  console.log('B3. Trocar o PIN num aparelho vale no outro');
  await abrir(cel, PIN_CONTA);
  await abrir(pc, PIN_CONTA);
  const sc3p = await casaAgora(pc);
  conferir(/data-act="conta.pin.trocar"/.test(sc3p.html) && !/data-act="conta.pin.criar"/.test(sc3p.html), 'B7. conta com PIN e com internet: "Trocar o PIN" e nunca "Criar o PIN da conta"');
  await pc.click('summary:has-text("Opções")'); await pc.click('[data-act="conta.pin.trocar"]');
  conferir(await janela(pc, /Trocar o PIN da conta/) && await naTela(pc, '.modal #pcAtual') && await naTela(pc, '.modal #pcP1') && await naTela(pc, '.modal #pcP2'), 'B3. "Trocar o PIN": a tela pede o PIN atual e o novo duas vezes');
  await preencher(pc, { pcAtual: PIN_CONTA, pcP1: '111111', pcP2: '111111' });
  conferir(await erroEm(pc, 'fácil de adivinhar'), 'B3. PIN novo fácil (111111) recusado');
  await preencher(pc, { pcAtual: '000000', pcP1: PIN_V2, pcP2: PIN_V2 });
  conferir(await erroEm(pc, 'PIN errado') && pinDaConta(ANA).versao === 1, 'B3. com o PIN atual errado: "PIN errado" e nada muda no banco');
  await preencher(pc, { pcAtual: PIN_CONTA, pcP1: PIN_V2, pcP2: PIN_V2 });
  conferir(await fechou(pc, '#pcAtual'), 'B3. com o PIN atual certo, a tela fecha');
  L = await local(pc);
  conferir(pinDaConta(ANA).versao === 2 && L.pinVersao === 2 && /PIN trocado. Vale em todos os seus aparelhos e apps/.test(await toasts(pc)), 'B3. trocado: versão 2 no banco e no computador ("✓ PIN trocado…")');
  await limparToasts(cel);
  await cel.evaluate(async () => { Pin.limpar(); await Aparelhos.aoAbrir(); });
  conferir(await cel.evaluate(() => !Cofre.aberto() && !SolverCofre.aberto()) && /O PIN da conta foi trocado em outro aparelho ou app: digite o PIN novo/.test(await toasts(cel)),
    'B3. o celular estava aberto: no aoAbrir, tranca (Senhas da casa e chaves de IA) e avisa "O PIN da conta foi trocado…"');
  const sc3 = await casaAgora(cel);
  conferir(/O PIN da conta foi trocado em outro aparelho ou app/.test(sc3.texto) && /É o PIN da sua conta/.test(sc3.texto), 'B3. o card trancado mostra o aviso (e que é o PIN da conta)');
  const b3a = await abrir(cel, PIN_CONTA), b3b = await abrir(cel, PIN_V2); L = await local(cel);
  conferir(!b3a.ok && b3b.ok && L.pinVersao === 2, 'B3. no celular, o PIN velho não abre; o novo abre e a versão daqui passa a 2');
  conferir(await chaves(cel, PIN_V2) === 'abriu' && await chaves(cel, PIN_CONTA) === 'pin-errado', 'B3. G1: no celular, o PIN das chaves de IA acompanhou (o novo abre, o velho não)');

  console.log('B3b. Trocado em outro aparelho há menos de 15 s: o PIN novo abre sem gastar tentativa');
  await cel.evaluate(() => Pin.info());   /* a memória de 15 s, com a versão 2 */
  const t3 = await pc.evaluate((x) => Pin.trocar(x.a, x.b), { a: PIN_V2, b: PIN_V3 });
  await tranca(cel);
  const b3c = await abrir(cel, PIN_V3); L = await local(cel);
  conferir(t3.ok && b3c.ok && pinDaConta(ANA).versao === 3 && pinDaConta(ANA).tentativas === 0 && L.pinVersao === 3, 'B3b. o PIN novo abre na hora (v com o sal novo), sem gastar tentativa da conta; versão 3 aqui');

  console.log('B4. 10 erros do PIN da conta: espera de 24 h');
  await tranca(pc);
  const t4 = [];
  for (let i = 1; i <= 10; i++) { t4.push((await abrir(pc, '000000')).texto); if (i < 10) pinDaConta(ANA).espera_ate = null; }
  conferir(pinDaConta(ANA).tentativas === 10 && pinDaConta(ANA).espera_ate > Date.now() + 23 * 3600e3, 'B4. 10 PINs errados: 10 tentativas e espera de 24 h no banco');
  conferir(t4.slice(0, 4).every((x) => /PIN errado/.test(x) && !/Faltam/.test(x)) && t4.slice(4, 9).every((x, k) => new RegExp('Faltam ' + (5 - k) + ' tentativas antes da espera de 24 h').test(x)),
    'B4. "Faltam N tentativas antes da espera de 24 h." só do 5º ao 9º erro (5, 4, 3, 2, 1)');
  const b4 = await abrir(pc, PIN_V3);
  conferir(!b4.ok && b4.erro === 'espera' && /PIN errado muitas vezes: tente de novo em 24 h ou aprove por outro aparelho seu/.test(b4.texto),
    'B4. nem o PIN certo entra: "PIN errado muitas vezes: tente de novo em 24 h ou aprove por outro aparelho seu"');
  const sc4 = await casaAgora(pc);
  conferir(/PIN errado muitas vezes/.test(sc4.texto) && await pc.evaluate(() => document.querySelector('#cfpin').disabled), 'B4. o card trancado mostra o mesmo texto e o campo do PIN fica parado');
  Object.assign(pinDaConta(ANA), { tentativas: 0, espera_ate: null });   /* o resto do teste segue sem a espera */

  console.log('B6. Sem internet, pelo PIN que o aparelho conhece');
  await tranca(cel); await semRede(CEL.ctx, true);
  const b6a = await abrir(cel, PIN_V3);
  conferir(b6a.ok && b6a.aberto, 'B6. sem internet: o celular abre com o PIN que conhece (o da conta, versão 3)');
  const sc6a = await casaAgora(cel);
  conferir(!/Trocar o PIN|Criar o PIN da conta/.test(sc6a.html) && sc6a.status.fase === 'aberto',
    'B7. sem internet: nem "Trocar o PIN" nem "Criar o PIN da conta" nas Senhas da casa');
  await limparToasts(cel);
  await cel.evaluate(() => ACT['conta.pin.trocar']());
  conferir(/Para trocar o PIN da conta, ligue a internet/.test(await toasts(cel)) && !(await naTela(cel, '.modal #pcAtual')), 'B7. sem internet, "Trocar o PIN" só diz para ligar a internet (nada muda)');
  const t6 = [];
  for (let i = 0; i < 4; i++) t6.push((await abrir(cel, '000000')).texto);
  conferir(t6.slice(0, 3).every((x) => /PIN errado. Tente de novo/.test(x) && !/Tentativas erradas/.test(x)) && /Tentativas erradas: 4 de 10. Na 10ª o PIN fica bloqueado neste /.test(t6[3]),
    'B6. sem internet, o contador deste aparelho avisa a partir do 4º erro ("Tentativas erradas: 4 de 10…")');
  const sc6 = await casaAgora(cel);
  conferir(/Tentativas erradas: 4 de 10/.test(sc6.texto) && /Espere/.test(sc6.texto), 'B6. o card trancado mostra o mesmo aviso e a espera');
  await cel.evaluate(() => Cofre.mudarLocal(null, (L) => { L.ate = 0; return L; }));   /* passou a espera de 30 s */
  await abrir(pc, PIN_V3);
  const t6b = await pc.evaluate((x) => Pin.trocar(x.a, x.b), { a: PIN_V3, b: PIN_V4 });
  const b6b = await abrir(cel, PIN_V3); L = await local(cel);
  conferir(t6b.ok && b6b.ok && L.erros === 0 && L.pinVersao === 3, 'B6. o PIN da conta mudou no computador; o celular, sem internet, ainda abre com o que conhece (e os erros zeram)');
  await semRede(CEL.ctx, false); await limparToasts(cel);
  await cel.evaluate(async () => { Pin.limpar(); await Aparelhos.aoAbrir(); });
  conferir(await cel.evaluate(() => !Cofre.aberto()) && /O PIN da conta foi trocado/.test(await toasts(cel)), 'B6. voltou a internet: o aoAbrir vê a versão nova, tranca e pede o PIN novo');
  const b6c = await abrir(cel, PIN_V4), b6d = await abrir(cel, PIN_V3); L = await local(cel);
  conferir(b6c.ok && !b6d.ok && L.pinVersao === 4, 'B6. o PIN novo abre (versão 4 aqui) e o que ele conhecia não abre mais');
  const guardCel = await guardado(cel), guardPc = await guardado(pc);
  await CEL.ctx.close(); await PC.ctx.close();

  /* ---------- 2, 5 e 6b: a Bia, com a conta já no MoneyTRIO (de mentira) e um celular com digital ---------- */
  console.log('2. A Bia já usa o MoneyTRIO: o aparelho de antes entra como "kit"; 5. sem o SQL; 6b. tirado pela digital');
  rpcs.sol_aparelho_registrar(BIA, { p_nome: 'Linux · Chrome', p_app: 'moneytrio', p_como: 'primeiro' });
  const B = await aparelho(browser, { nome: 'Bia', vp: 'celular', base: BASE, digital: true }), b = B.p; lixos.push(B.lixo);
  await entrarOmni(b, BIA);
  /* com leitor de digital, o app oferece uma vez a digital para abrir o app (não é a das Senhas da casa): agora não */
  if (await b.waitForSelector('.modal [data-no]', { timeout: 5000 }).then(() => true, () => false)) await b.click('.modal [data-no]');
  const sb = await senhasDaCasa(b);
  conferir(sb.status.caso === 'outroApp' && JSON.stringify(sb.status.outrosApps) === '["MoneyTRIO"]' && sb.status.omniOutros === 0 && sb.status.fase === 'novo', '2. sem cadeado aqui e a conta só no MoneyTRIO: a Jornada diz "outroApp" (MoneyTRIO)');
  await cadeadoAntigo(b, BIA, PIN_BIA, true);
  const rb = await abrir(b, PIN_BIA); let LB = await local(b);
  const lb = linhas(BIA);
  conferir(rb.ok && rb.criarPin && lb.length === 2 && lb.some((l) => l.app === 'moneytrio' && l.como === 'primeiro') && lb.some((l) => l.id === LB.ap && l.app === 'omnilife' && l.como === 'kit') && LB.como === 'kit' && !pinDaConta(BIA),
    '2. o aparelho de antes abre pelo PIN dele e entra como "kit" (a conta já tinha o do MoneyTRIO); a conta continua sem PIN');
  /* 5. sem o SQL do PIN: o PIN do aparelho; a aprovação (ligadoAp) continua ligada */
  M.semPin = true;
  const r5 = await abrir(b, PIN_BIA), s5 = await b.evaluate(() => ({ pin: Sol.ligadoPin, ap: Sol.ligadoAp }));
  M.semPin = false;
  const s5b = await b.evaluate(() => { Sol._t.pin -= 6 * 60e3; return Sol.ligadoPin; });
  conferir(r5.ok && s5.pin === false && s5.ap === true && s5b === null, '5. sem as funções do PIN no banco: abre pelo PIN do aparelho; só o sinal do PIN desliga, e volta a testar depois de 5 min');
  await b.evaluate(() => Cofre.mudarLocal(null, (L) => { delete L.ap; delete L.como; return L; }));
  M.semAp = true; let nb = linhas(BIA).length;
  const r5b = await abrir(b, PIN_BIA), s5c = await b.evaluate(() => Sol.ligadoAp);
  M.semAp = false; LB = await local(b);
  conferir(r5b.ok && s5c === false && !LB.ap && linhas(BIA).length === nb, '5. sem as funções dos aparelhos: abre pelo PIN do aparelho, como na 2.25, e não entra na lista');
  await b.evaluate(() => { Sol.ligadoAp = null; });
  /* aberto pela digital, o aparelho de antes também entra na lista */
  await tranca(b);
  const d6 = await b.evaluate(async () => { const r = await Cofre.destrancarDigital(); return { ok: r.ok === true, erro: r.erro || null }; });
  LB = await local(b);
  conferir(d6.ok && LB.ap && LB.como === 'kit' && linhas(BIA).length === nb + 1, '2. aberto pela digital, o aparelho de antes também entra na lista ("kit")');

  /* ---------- B2. conta sem PIN, aberta pela digital ---------- */
  console.log('B2. A conta da Bia, sem PIN, aberta pela digital: "Crie o PIN da sua conta"');
  await tranca(b); await senhasDaCasa(b); await b.waitForSelector('[data-act="cofre.digital"]', { timeout: 10000 });
  await b.click('[data-act="cofre.digital"]');
  conferir(await janela(b, /Crie o PIN da sua conta SolverONE/) && !(await naTela(b, '.modal #pcAntigo')) && !(await naTela(b, '.modal #pcPin')) && await semFila(b),
    'B2. aberta pela digital, a conta sem PIN pede "Crie o PIN da sua conta SolverONE" (sem pedir o PIN antigo), nada na fila');
  conferir(await naTela(b, '#screen [data-act="conta.pin.criar"]') && !(await naTela(b, '#screen [data-act="conta.pin.trocar"]')), 'B2/B7. "Criar o PIN da conta" aparece e "Trocar o PIN" não');
  await preencher(b, { pcP1: '111111', pcP2: '111111' });
  conferir(await erroEm(b, 'fácil de adivinhar'), 'B2. PIN fácil (111111) recusado');
  await preencher(b, { pcP1: '12345a', pcP2: '12345a' });
  conferir(await erroEm(b, 'Use só números'), 'B2. "12345a" recusado ("Use só números.")');
  await preencher(b, { pcP1: '52806', pcP2: '52806' });
  conferir(await erroEm(b, 'pelo menos 6 números'), 'B2. 5 números recusado ("pelo menos 6 números")');
  await preencher(b, { pcP1: PIN_BIA_CONTA, pcP2: '528062' });
  conferir(await erroEm(b, 'Os dois PINs ficaram diferentes') && !pinDaConta(BIA), 'B2. os dois diferentes recusado; nada foi criado no banco com os PINs recusados');
  await preencher(b, { pcP1: PIN_BIA_CONTA, pcP2: PIN_BIA_CONTA });
  conferir(await fechou(b, '#pcP1'), 'B2. com um PIN bom, a tela fecha');
  LB = await local(b);
  conferir(pinDaConta(BIA) && pinDaConta(BIA).versao === 1 && LB.srv && LB.pinVersao === 1 && !(await naTela(b, '.modal #apDigSim')), 'B2. criou o PIN da conta da Bia (versão 1); a digital já estava ligada, então não é oferecida de novo');
  const sb2 = await casaAgora(b);
  conferir(/data-act="conta.pin.trocar"/.test(sb2.html) && !/data-act="conta.pin.criar"/.test(sb2.html), 'B2/B7. agora "Trocar o PIN" e não "Criar o PIN da conta"');

  /* ---------- K32: trocar o PIN da conta (no banco) não troca as chaves de IA de outra pessoa ---------- */
  console.log('K32. Trocar o PIN da conta não troca as chaves de IA de outra pessoa neste aparelho');
  conferir(await guardarChave(b, PIN_BIA_CONTA) === 'ok', 'preparo: a Bia guarda uma chave de IA (ligada a ela, com o PIN da conta)');
  /* as chaves passam a ser de outra pessoa (como se outra pessoa as tivesse guardado neste aparelho) */
  await b.evaluate((u) => { const k = 'dgo:global:cofre', r = JSON.parse(localStorage.getItem(k)); r.envoltas.pessoas['u-outra'] = r.envoltas.pessoas[u]; delete r.envoltas.pessoas[u]; delete r.alinhado; localStorage.setItem(k, JSON.stringify(r)); }, BIA);
  await b.evaluate(() => { ACT['conta.pin.trocar'](); });   /* sem esperar: a promessa só acaba quando a tela fecha */
  await b.waitForSelector('.modal #pcAtual', { timeout: 8000 });
  await preencher(b, { pcAtual: PIN_BIA_CONTA, pcP1: PIN_BIA_NOVO, pcP2: PIN_BIA_NOVO });
  conferir(await fechou(b, '#pcAtual') && pinDaConta(BIA).versao === 2 && (await local(b)).pinVersao === 2, 'K32. a Bia trocou o PIN da conta (versão 2 no banco e aqui)');
  conferir(await chaves(b, PIN_BIA_CONTA) === 'abriu' && await chaves(b, PIN_BIA_NOVO) === 'pin-errado', 'K32. as chaves de IA de outra pessoa continuam com o PIN delas (o PIN novo da Bia não as abre)');
  /* as chaves de mentira de "outra pessoa" saem: ao recarregar, o cofre.js pediria o PIN delas na janela dele (não é o que se confere aqui) */
  await b.evaluate(() => SolverCofre.apagarCofre());

  /* ---------- K17: a digital das Senhas da casa oferecida uma vez por aparelho ---------- */
  console.log('K17. A digital oferecida uma vez por aparelho, nunca na mesma entrada da oferta de abrir o app com a digital');
  await b.evaluate(() => Cofre.desligarDigital());
  await abrirPelaTela(b, PIN_BIA_NOVO);
  await b.waitForFunction(() => Cofre.aberto(), null, { timeout: 20000 }); await b.waitForTimeout(800);
  conferir(!(await naTela(b, '.modal #apDigSim')), 'K17. nesta entrada o app já ofereceu a digital para abrir o app: a das Senhas da casa fica para a próxima');
  /* o "Olá" e as dicas do AssistONE abrem sozinhos depois de recarregar e cobririam o campo do PIN */
  await b.evaluate(() => { AOne.save({ hello: 1, tour: 1, tips: Object.assign({}, AOne.cfg().tips, { home: 1, settings: 1, house: 1 }) }); });
  await b.reload();
  await b.waitForFunction((u) => typeof S !== 'undefined' && S.booted && S.family && S.user && S.user.uid === u, BIA, { timeout: 30000 });
  await b.evaluate(() => { if (AOne.view) AOne.close(); });
  await abrirPelaTela(b, PIN_BIA_NOVO);
  conferir(await b.waitForSelector('.modal #apDigSim', { timeout: 10000 }).then(() => true, () => false) && await janela(b, /Usar a digital neste /) && await semFila(b),
    'K17. na entrada seguinte, depois de abrir pelo PIN: "Usar a digital neste …?" (nada na fila)');
  await b.click('.modal #apDigSim');
  conferir(await b.waitForFunction(async () => !!((await Cofre.local()) || {}).prf, null, { timeout: 20000 }).then(() => true, () => false) && !(await naTela(b, '.modal #ppin'))
    && await b.evaluate(async (u) => !!(await IDB.get('kv', 'digitalPerguntada|' + u)), BIA), 'K17. "Usar a digital" liga a digital das Senhas da casa sem pedir o PIN de novo, e fica anotado que já perguntou');
  await b.evaluate(() => Cofre.desligarDigital());
  await abrirPelaTela(b, PIN_BIA_NOVO);
  await b.waitForFunction(() => Cofre.aberto(), null, { timeout: 20000 }); await b.waitForTimeout(800);
  conferir(!(await naTela(b, '.modal #apDigSim')), 'K17. uma vez só: abrir de novo pelo PIN não pergunta mais (mesmo com a digital desligada)');
  await b.evaluate(() => Cofre.ligarDigital(true));
  await b.waitForFunction(async () => !!((await Cofre.local()) || {}).prf, null, { timeout: 20000 });
  /* 6b. A11b: tirado em outro aparelho, a digital não abre */
  rpcs.sol_aparelho_tirar(BIA, { p_id: LB.ap });
  await tranca(b); await vigiarAbertura(b);
  await senhasDaCasa(b); await b.waitForSelector('[data-act="cofre.digital"]', { timeout: 10000 });
  await b.click('[data-act="cofre.digital"]');
  const saiuB = await b.waitForFunction(() => S.gate === 'welcome', null, { timeout: 20000 }).then(() => true, () => false);
  const fimB = await b.evaluate(async (u) => ({ abriu: +sessionStorage.getItem('teste.abriu'), conta: Conta.on(), L: await IDB.get('kv', 'cofre|' + u) }), BIA);
  conferir(saiuB && fimB.abriu === 0 && !fimB.conta && !fimB.L && /foi tirado da sua conta em outro aparelho/.test(await toasts(b)),
    '6b. a digital (autenticador virtual) de um aparelho tirado não abre nada: o cadeado sai e a conta sai deste aparelho');
  const guardB = await guardado(b);
  await B.ctx.close();

  /* ---------- 7. a Jornada nos outros casos ---------- */
  console.log('7. A Jornada: conta nova, quem não é chefe/responsável, sem internet');
  const C = await aparelho(browser, { nome: 'Cris', vp: 'celular', base: BASE }), c = C.p; lixos.push(C.lixo);
  await entrarOmni(c, CRIS);
  const sc = await senhasDaCasa(c);
  conferir(sc.status.caso === 'contaNova' && !sc.status.temPub && !sc.status.temKit && !sc.status.tem && sc.status.fase === 'novo', '7. Cris (responsável, sem chaves, sem aparelho, sem PIN): "contaNova"');
  await semRede(C.ctx, true);
  const sr = await c.evaluate(async () => (await Jornada.ler(true)).caso);
  await semRede(C.ctx, false);
  conferir(sr === 'semRede', '7. sem cadeado e sem internet: "semRede"');
  await C.ctx.close();
  const D = await aparelho(browser, { nome: 'Davi', vp: 'celular', base: BASE }), d = D.p; lixos.push(D.lixo);
  await entrarOmni(d, DAVI);
  const sd = await d.evaluate(async () => { await Cofre.atualizar(); return Cofre.status; });
  conferir(sd.caso === 'naoGuardiao' && sd.fase === 'novo', '7. Davi (membro): "naoGuardiao"');
  await D.ctx.close();

  /* ---------- 8. nada de PIN nem de segredo fora do cadeado ---------- */
  /* o PIN como "palavra" (um número de data ou de hora pode ter os mesmos 6 algarismos no meio) */
  const segredos = db.sol_aparelho_pin.map((x) => x.segredo), temPin = (t) => PINS.some((pin) => new RegExp('(^|[^0-9])' + pin + '([^0-9]|$)').test(t));
  const corpos = M.log.map((x) => JSON.stringify(x.corpo || '')).join('\n'), hist = JSON.stringify(db.omni_historico);
  conferir(![guardA, guardB, guardCel, guardPc, guardT].some((g) => temPin(g) || segredos.some((s) => g.includes(s))), '8/B8. nenhum PIN nem segredo do aparelho no localStorage/sessionStorage (todos os aparelhos)');
  conferir(!temPin(corpos) && !temPin(hist) && !segredos.some((s) => hist.includes(s)),
    '8. nenhuma chamada ao banco levou um PIN (só o v) e nada disso foi para o histórico');
  conferir(!lixos.some((l) => l.console.some((t) => temPin(t) || segredos.some((s) => t.includes(s)))), '8/B8. nenhum PIN nem segredo do aparelho no console (todos os aparelhos)');
  conferir(lixos.every((l) => !l.erros.length), '8. nenhum erro de script' + lixos.map((l) => l.erros.join(' | ')).filter(Boolean).map((x) => ': ' + x).join(''));
  conferir(lixos.every((l) => !l.nativos.length), '8. nenhum alert/confirm/prompt do navegador');
  conferir(lixos.every((l) => !l.fora.some((u) => /supabase/i.test(u))), '8. o Supabase só pelo banco de mentira');

  await terminar(falhas, browser, 'PIN da conta — aparelho de antes entra na lista ("primeiro" ou "kit") sem criar PIN sozinho, sem internet pelo PIN de sempre, registro único e trava do cadeado, sem o SQL como na 2.25, aparelho tirado não abre nem pela digital; as telas: criar, as duas da mudança, trocar (vale no outro aparelho), 24 h depois de 10 erros, o PIN das chaves de IA sempre o da conta, a digital oferecida uma vez.');
})().catch((e) => { console.error('Erro no teste:', e.message); process.exit(1); });
