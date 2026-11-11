/* PIN da conta SolverONE no OmniLifeONE (2.26.0, Parte B) — a rede e o PIN da conta, ainda sem tela nova.
   No "Supabase de mentira" (teste/mock-sol.js): cada aparelho é um contexto do navegador e todos falam com o mesmo banco,
   que mora neste processo. Nada vai para a internet nem para o Supabase de verdade. Confere:
     1. aparelho de antes (o cadeado da 2.25, feito pelo "Usar neste …" com o código do papel, sem lugar na lista da conta):
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
     8. nada de PIN ou segredo no localStorage/sessionStorage, no histórico nem nas chamadas (só o v); sem erro de script,
        sem diálogo nativo, nada fora do banco de mentira
   Pessoas, senhas, PINs e chaves de mentira. Uso: node teste/rodar.js   ·   sozinho: BASE=http://localhost:8099 node teste/pin-conta-omni.js */
const crypto = require('crypto');
const { BASE, criarConferir, iniciar, terminar } = require('./_base');
const { M, db, rpcs, prepararChaves, PESSOAS, ANA, BIA, CRIS, DAVI, GID, b64u } = require('./mock-sol');
const { aparelho, entrarOmni, senhasDaCasa, semRede } = require('./_nuvem');

const PIN_ANA = '736251', PIN_BIA = '284613', PIN_CONTA = '590317', PIN_NOVO = '482915', PIN_X = '615048', PIN_Y = '903726';
const PINS = [PIN_ANA, PIN_BIA, PIN_CONTA, PIN_NOVO, PIN_X, PIN_Y];
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
/* o "Usar neste …" da 2.25: o código do papel e um PIN só deste aparelho. O SQL novo "desligado" no preparo (o cadeado
   nasce como na 2.25, fora da lista da conta). digital: aceita a oferta da digital no fim (autenticador virtual) */
async function cadeadoAntigo(p, uid, pin, digital) {
  await p.evaluate(() => { Sol.ligadoAp = false; Sol.ligadoPin = false; });
  await senhasDaCasa(p);
  await p.click('[data-act="cofre.comecar"]');
  await p.click('.modal [data-o="codigo"]');
  await p.waitForSelector('.modal #askv'); await p.fill('.modal #askv', PESSOAS[uid].codigo); await p.click('.modal:has(#askv) [data-ok]');
  await p.waitForSelector('.modal #np1', { timeout: 20000 }); await p.fill('#np1', pin); await p.fill('#np2', pin); await p.click('.modal:has(#np1) [data-ok]');
  await p.waitForFunction(() => Cofre.aberto(), null, { timeout: 30000 });
  if (await p.waitForSelector('.modal [data-yes]', { timeout: digital ? 20000 : 1500 }).then(() => true, () => false)) await p.click(digital ? '.modal [data-yes]' : '.modal [data-no]');
  if (digital) await p.waitForFunction(async () => !!((await Cofre.local()) || {}).prf, null, { timeout: 20000 });
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
const vigiarAbertura = (p) => p.evaluate(() => { window.__abriu = 0; const o = Cofre.usarChave; Cofre.usarChave = function () { window.__abriu++; return o.apply(this, arguments); }; });

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
  conferir(await a.waitForFunction(() => /Falta criar o PIN da sua conta SolverONE/.test(document.querySelector('#toasts').textContent), null, { timeout: 5000 }).then(() => true, () => false),
    '1. por enquanto, o aviso "Falta criar o PIN da sua conta SolverONE"');
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
  const fim6 = await a.evaluate(async (u) => ({ abriu: window.__abriu, aberto: Cofre.aberto(), conta: Conta.on(), L: await IDB.get('kv', 'cofre|' + u), chaveAp: await IDB.get('kv', 'chaveAp|' + u),
    chavesIA: SolverCofre.existe() }), ANA);
  const nuvemDepois = await a.evaluate(async (g) => (await IDB.entries('nuvem')).filter(([k]) => k.startsWith(g + '|') && !k.includes('|vault|')).length, GID);
  conferir(saiu && fim6.abriu === 0 && !fim6.aberto && M.log.slice(n6).some((x) => /sol_pin_conferir/.test(x.caminho)) && M.log.slice(n6).some((x) => /sol_aparelho_visto/.test(x.caminho)), '6. o PIN certo (o L.pin conhecia) NÃO abriu nada: o banco disse "aparelho" e não caiu para o PIN local');
  conferir(!fim6.conta && !fim6.L && !fim6.chaveAp && !fim6.chavesIA && /foi tirado da sua conta em outro aparelho/.test(await toasts(a)),
    '6. confirmado o "tirado": o cadeado, a chave deste navegador e as chaves de IA (só da Ana) saíram, a conta saiu deste aparelho e o aviso apareceu');
  conferir(nuvemAntes.outros > 0 && nuvemDepois === nuvemAntes.outros, '6. os dados da família guardados neste aparelho (fora das Senhas da casa) continuam (' + nuvemDepois + ')');
  const guardA = await guardado(a);
  await A.ctx.close();

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
  /* 6b. A11b: tirado em outro aparelho, a digital não abre */
  rpcs.sol_aparelho_tirar(BIA, { p_id: LB.ap });
  await tranca(b); await vigiarAbertura(b);
  await senhasDaCasa(b); await b.waitForSelector('[data-act="cofre.digital"]', { timeout: 10000 });
  await b.click('[data-act="cofre.digital"]');
  const saiuB = await b.waitForFunction(() => S.gate === 'welcome', null, { timeout: 20000 }).then(() => true, () => false);
  const fimB = await b.evaluate(async (u) => ({ abriu: window.__abriu, conta: Conta.on(), L: await IDB.get('kv', 'cofre|' + u) }), BIA);
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
  conferir(![guardA, guardB].some((g) => temPin(g) || segredos.some((s) => g.includes(s))), '8. nenhum PIN nem segredo do aparelho no localStorage/sessionStorage');
  conferir(!temPin(corpos) && !temPin(hist) && !segredos.some((s) => hist.includes(s)),
    '8. nenhuma chamada ao banco levou um PIN (só o v) e nada disso foi para o histórico');
  conferir(lixos.every((l) => !l.erros.length), '8. nenhum erro de script' + lixos.map((l) => l.erros.join(' | ')).filter(Boolean).map((x) => ': ' + x).join(''));
  conferir(lixos.every((l) => !l.nativos.length), '8. nenhum alert/confirm/prompt do navegador');
  conferir(lixos.every((l) => !l.fora.some((u) => /supabase/i.test(u))), '8. o Supabase só pelo banco de mentira');

  await terminar(falhas, browser, 'PIN da conta (rede, sem tela nova) — aparelho de antes entra na lista ("primeiro" ou "kit") sem criar PIN sozinho, sem internet pelo PIN de sempre, registro único e trava do cadeado, PIN da conta criado/trocado/realinhado, sem o SQL como na 2.25, aparelho tirado não abre nem pela digital.');
})().catch((e) => { console.error('Erro no teste:', e.message); process.exit(1); });
