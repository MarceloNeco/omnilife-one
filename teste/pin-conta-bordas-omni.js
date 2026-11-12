/* PIN da conta SolverONE no OmniLifeONE (2.26.0) — os cantos que a revisão das etapas 1–4 achou sem teste ou com defeito.
   No "Supabase de mentira" (teste/mock-sol.js): nada vai para a internet nem para o Supabase de verdade. A Ana, num computador
   com o cadeado da 2.25 (código do papel + um PIN só deste aparelho) e a conta já com o PIN da conta (outro PIN). Confere:
     K13 o PIN deste aparelho é conferido UMA vez por abertura (aparelho fora da lista e ainda no PIN antigo): o erro local
         conta uma vez só e a conta gasta uma tentativa só
     K14 bloqueado neste aparelho: sem o PIN da conta neste aparelho (sem L.srv), nem o card nem a janela "Digite o seu PIN"
         mostram o campo (só "Esqueci o PIN"); com L.srv e internet, o campo aparece e o PIN da conta desbloqueia; sem internet,
         some de novo; com as Senhas da casa abertas (só confirmar), o campo não aparece (a conferência é só daqui)
     K12 sem o SQL do PIN da conta (Sol.ligadoPin false), um aparelho que JÁ passou para o PIN da conta não troca só o PIN daqui
     tirado: um aparelho que saiu da lista da conta e tenta criar ou trocar o PIN da conta sai da conta (antes dizia "Sem conexão")
     conta bloqueada: a renovação da sessão que acontece no meio do registro do aparelho apaga o cadeado e não trava o app; e a que
         acontece DENTRO da trava do cadeado também não (2.26.0: a saída da conta bloqueada é o Saida, que ninguém espera dentro da trava)
     nada de PIN no console; sem erro de script, sem diálogo nativo, nada fora do banco de mentira
   Pessoas, senhas, PINs e chaves de mentira. Uso: node teste/rodar.js   ·   sozinho: BASE=http://localhost:8099 node teste/pin-conta-bordas-omni.js */
const crypto = require('crypto');
const { BASE, criarConferir, iniciar, terminar } = require('./_base');
const { M, db, rpcs, prepararChaves, PESSOAS, ANA, b64u } = require('./mock-sol');
const { aparelho, entrarOmni, senhasDaCasa, semRede, cadeado225 } = require('./_nuvem');

const PIN_K = '736251', PIN_CONTA = '590317', PIN_NOVO = '638291', PIN_K2 = '482915';
const PINS = [PIN_K, PIN_CONTA, PIN_NOVO, PIN_K2];

const linhas = (uid) => db.sol_aparelhos.filter((a) => a.user_id === uid && !a.removido_em);
const pinDaConta = (uid) => db.sol_pin_conta.find((x) => x.user_id === uid);
const vNode = (pin, sal) => b64u(crypto.pbkdf2Sync(Buffer.from(String(pin), 'utf8'), Buffer.from(sal, 'base64url'), 600000, 32, 'sha256'));
const local = (p) => p.evaluate(async () => { const L = await Cofre.local(); return L && { ap: L.ap || null, como: L.como || null, srv: !!L.srv, pinVersao: L.pinVersao || 0, erros: L.erros || 0, bloqueado: !!L.bloqueado, ct: L.pin && L.pin.ct }; });
const mudar = (p, campos) => p.evaluate((c) => Cofre.mudarLocal(null, (L) => { Object.keys(c).forEach((k) => { if (c[k] === null) delete L[k]; else L[k] = c[k]; }); return L; }).then(() => true), campos);
const tranca = (p) => p.evaluate(async () => { await SolverCofre.trancar(); Cofre.trancar(); });
const toasts = (p) => p.evaluate(() => document.querySelector('#toasts').textContent);
const naTela = (p, sel) => p.evaluate((s) => !!document.querySelector(s), sel);
/* o cadeado de um aparelho de antes (como a 2.25 gravava: o código do papel e um PIN só deste aparelho; ver cadeado225 no
   _nuvem.js), com o SQL novo "desligado" no preparo */
async function cadeadoAntigo(p, uid, pin) {
  /* o "Olá" e as dicas do AssistONE abrem sozinhos (1,4 s depois de desenhar, sem janela aberta) e cobririam os botões */
  await p.evaluate(() => { Sol.ligadoAp = false; Sol.ligadoPin = false; AOne.save({ hello: 1, tour: 1, tips: Object.assign({}, AOne.cfg().tips, { home: 1, settings: 1, house: 1 }) }); if (AOne.view) AOne.close(); });
  await senhasDaCasa(p);
  await cadeado225(p, uid, pin);
  await p.waitForFunction(() => Cofre.status && Cofre.status.fase === 'aberto' && !document.querySelector('.modal'), null, { timeout: 20000 });
  await p.evaluate(() => { Sol.ligadoAp = null; Sol.ligadoPin = null; });
}
/* Casa → Senhas da casa com o estado de agora (relê a Jornada e redesenha) */
async function casa(p) {
  await senhasDaCasa(p);
  await p.evaluate(async () => { Jornada.limpar(); await Cofre.atualizar(); render(); });
  await p.waitForTimeout(400);
  return p.evaluate(() => ({ campo: !!document.querySelector('#cfpin'), esqueci: !!document.querySelector('#screen [data-act="cofre.esqueci"]'),
    digital: !!document.querySelector('#screen [data-act="cofre.digital"]'), texto: document.querySelector('#screen').innerText }));
}
/* a janela "Digite o seu PIN" (a das chaves de IA): o que ela mostra; fecha com "Agora não" */
async function janelaPin(p) {
  await p.evaluate(() => { window.__pedido = PinUnico.pedir({}); });
  await p.waitForSelector('.modal [data-esq]', { timeout: 8000 });
  const o = await p.evaluate(() => { const m = document.querySelector('.modal:has([data-esq])'); return { campo: !!m.querySelector('#upin'), abrir: !!m.querySelector('[data-ok]'), texto: m.innerText }; });
  await p.click('.modal:has([data-esq]) .mf [data-x]');
  o.resposta = await p.evaluate(() => window.__pedido);
  return o;
}

(async () => {
  const browser = await iniciar();
  const { falhas, conferir } = criarConferir();
  await prepararChaves();
  const K = await aparelho(browser, { nome: 'Ana', vp: 'computador', base: BASE }), k = K.p;

  /* ---------- preparo: o cadeado de antes (PIN deste aparelho) e a conta com OUTRO PIN (o da conta) ---------- */
  console.log('Preparo: aparelho de antes da Ana e a conta com o PIN da conta');
  await entrarOmni(k, ANA);
  await cadeadoAntigo(k, ANA, PIN_K);
  await k.evaluate(() => Aparelhos.registrar());
  let L = await local(k);
  const sal = b64u(crypto.randomBytes(16));
  const d0 = rpcs.sol_pin_definir(ANA, { p_v_novo: vNode(PIN_CONTA, sal), p_sal_novo: sal, p_v_atual: null, p_ap: L.ap });
  conferir(L.ap && !L.srv && d0.ok && d0.versao === 1, 'preparo: o aparelho na lista da conta, ainda no PIN dele; a conta com o PIN da conta (versão 1)');

  /* ---------- K13: o PIN deste aparelho conferido uma vez só ---------- */
  console.log('K13. O PIN deste aparelho é conferido uma vez por abertura');
  await mudar(k, { ap: null, como: null }); await tranca(k);
  await k.evaluate(() => { window.__locais = 0; const o = Cofre._pinRaw; Cofre._pinRaw = function () { window.__locais++; return o.apply(this, arguments); }; });
  const k13 = await k.evaluate(async (pin) => { window.__locais = 0; const r = await Cofre.destrancarPin(pin); if (r.raw) r.raw.fill(0); return { erro: r.erro || null, locais: window.__locais, aberto: Cofre.aberto() }; }, PIN_K);
  L = await local(k);
  conferir(k13.erro === 'pinConta' && k13.locais === 1 && !k13.aberto && L.erros === 0 && L.ap && L.como === 'kit' && pinDaConta(ANA).tentativas === 1,
    'K13. aparelho fora da lista, PIN antigo certo: entra na lista ("kit"), o PIN daqui é conferido UMA vez (' + k13.locais + ') e a conta gasta uma tentativa só → "Agora o PIN é um só"');
  const k13b = await k.evaluate(async () => { window.__locais = 0; const r = await Cofre.destrancarPin('000000'); return { erro: r.erro || null, conta: !!r.conta, locais: window.__locais }; });
  L = await local(k);
  conferir(k13b.erro === 'pin' && k13b.conta && k13b.locais === 1 && L.erros === 1 && pinDaConta(ANA).tentativas === 2,
    'K13. PIN errado (aparelho ainda no PIN antigo): o erro deste aparelho conta UMA vez (' + L.erros + ') e o da conta uma vez');
  Object.assign(pinDaConta(ANA), { tentativas: 0, espera_ate: null });

  /* ---------- K14: bloqueado neste aparelho ---------- */
  console.log('K14. Bloqueado neste aparelho: o campo do PIN só quando o PIN da conta pode liberar');
  await mudar(k, { bloqueado: true, erros: 10 });
  const c1 = await casa(k);
  conferir(!c1.campo && c1.esqueci && !c1.digital && /errou muitas vezes neste/.test(c1.texto) && /Esqueci o PIN/.test(c1.texto) && !/digite o PIN da conta/.test(c1.texto),
    'K14. sem o PIN da conta neste aparelho: o card não mostra o campo do PIN (nem a digital), só "Esqueci o PIN" e como liberar');
  const j1 = await janelaPin(k);
  conferir(!j1.campo && !j1.abrir && /errou muitas vezes neste/.test(j1.texto) && j1.resposta === false, 'K14. a janela "Digite o seu PIN" também: sem campo e sem "Abrir" ("Agora não" responde que não abriu)');
  /* passa este aparelho para o PIN da conta ("Falta só um passo": o PIN da conta e o antigo uma vez) */
  await mudar(k, { bloqueado: false, erros: 0 });
  const mig = await k.evaluate(async (x) => { Cofre.trancar(); const r = await Cofre.destrancarPin(x.conta); if (r.erro !== 'pinAntigo') return 'erro: ' + r.erro; const m = await Pin.migrarAntigo(r, x.antigo); return m.ok ? 'ok' : 'erro: ' + m.erro; }, { conta: PIN_CONTA, antigo: PIN_K });
  L = await local(k);
  conferir(mig === 'ok' && L.srv && L.pinVersao === 1, 'preparo: o aparelho passou para o PIN da conta (L.srv, versão 1)');
  await tranca(k); await mudar(k, { bloqueado: true, erros: 10 });
  const c2 = await casa(k);
  conferir(c2.campo && !c2.digital && /digite o PIN da conta/.test(c2.texto), 'K14. já no PIN da conta e com internet: o campo aparece ("digite o PIN da conta")');
  await k.fill('#cfpin', PIN_CONTA); await k.click('[data-act="cofre.pin"]');
  const abriu = await k.waitForFunction(() => Cofre.aberto(), null, { timeout: 20000 }).then(() => true, () => false);
  L = await local(k);
  conferir(abriu && !L.bloqueado && L.erros === 0, 'K14. o PIN da conta abre e desbloqueia este aparelho');
  await mudar(k, { bloqueado: true, erros: 10 });
  const j2 = await janelaPin(k);
  conferir(!j2.campo && !j2.abrir && !/digite o PIN da conta/.test(j2.texto) && /Esqueci o PIN/.test(j2.texto),
    'K14. com as Senhas da casa abertas (só confirmar, a conferência é daqui): bloqueado, a janela não mostra um campo que não serviria');
  await tranca(k);
  await semRede(K.ctx, true);
  const c3 = await casa(k);
  await semRede(K.ctx, false);
  conferir(!c3.campo && /errou muitas vezes neste/.test(c3.texto), 'K14. bloqueado e sem internet: o campo some (o PIN da conta não tem como liberar)');
  await mudar(k, { bloqueado: false, erros: 0 });

  /* ---------- K12: sem o SQL do PIN da conta, quem já está no PIN da conta não troca só o daqui ---------- */
  console.log('K12. Sem o SQL do PIN da conta, um aparelho já no PIN da conta não troca o PIN só daqui');
  const ok12 = await k.evaluate(async (pin) => { const r = await Cofre.destrancarPin(pin); return r.ok === true; }, PIN_CONTA);
  L = await local(k); const ctAntes = L.ct;
  /* o aviso é um toast de 5 s: guardado quando aparece (com o computador ocupado, ler a tela depois das idas e voltas o perdia) */
  await k.evaluate(() => { window.__avisos = []; const t = document.querySelector('#toasts'); new MutationObserver(() => window.__avisos.push(t.textContent)).observe(t, { childList: true, subtree: true }); });
  await k.evaluate(() => { document.querySelector('#toasts').innerHTML = ''; Sol.ligadoPin = false; window.__novo = 0; const f = TelaConta.formPin; TelaConta.formPin = function (op) { window.__novo++; return f.call(this, op); }; window.__troca = TelaConta.trocarPin(); });
  await k.waitForTimeout(1500);
  const k12 = await k.evaluate(async () => ({ prova: !!document.querySelector('.modal #ppin'), form: !!document.querySelector('.modal #pcAtual, .modal #pcP1'), novo: window.__novo }));
  await k.evaluate(() => closeModals());
  const r12 = await k.evaluate(() => window.__troca);
  L = await local(k);
  const avisos12 = await k.evaluate(() => window.__avisos.join(' | '));
  const bom12 = ok12 && !k12.prova && !k12.form && k12.novo === 0 && r12 === false && L.ct === ctAntes && /Para trocar o PIN da conta, ligue a internet/.test(avisos12);
  conferir(bom12, 'K12. "Trocar o PIN" sem o SQL do PIN da conta: só diz para ligar a internet; o PIN deste aparelho não muda' +
    (bom12 ? '' : ' — ' + JSON.stringify({ ok12, k12, r12, igual: L.ct === ctAntes, avisos: avisos12 })));
  await k.evaluate(() => { Sol.ligadoPin = null; });

  /* ---------- tirado da conta: criar/trocar o PIN da conta não diz "Sem conexão" ---------- */
  console.log('Tirado: um aparelho fora da lista da conta tenta criar ou trocar o PIN da conta');
  L = await local(k);
  rpcs.sol_aparelho_tirar(ANA, { p_id: L.ap });
  const v0 = pinDaConta(ANA).versao, t0 = pinDaConta(ANA).tentativas;
  const diretos = await k.evaluate(async (x) => [(await Pin.criar(x.novo)).erro, (await Pin.trocar(x.atual, x.novo)).erro], { novo: PIN_NOVO, atual: PIN_CONTA });
  conferir(diretos[0] === 'aparelho' && diretos[1] === 'aparelho' && pinDaConta(ANA).versao === v0 && pinDaConta(ANA).tentativas === t0,
    'tirado: Pin.criar e Pin.trocar devolvem "aparelho" (não "rede"); nada muda no banco nem gasta tentativa');
  await k.evaluate(() => { document.querySelector('#toasts').innerHTML = ''; ACT['conta.pin.trocar'](); });
  await k.waitForSelector('.modal #pcAtual', { timeout: 8000 });
  await k.fill('.modal #pcAtual', PIN_CONTA); await k.fill('.modal #pcP1', PIN_NOVO); await k.fill('.modal #pcP2', PIN_NOVO); await k.click('.modal #pcOk');
  const saiu = await k.waitForFunction(() => S.gate === 'welcome', null, { timeout: 15000 }).then(() => true, () => false);
  const fimT = await k.evaluate(async (u) => ({ conta: Conta.on(), L: !!(await IDB.get('kv', 'cofre|' + u)), erro: ((document.querySelector('.modal #pcErr') || {}).textContent || '') }), ANA);
  conferir(saiu && !fimT.conta && !fimT.L && /foi tirado da sua conta em outro aparelho/.test(await toasts(k)) && !/Sem conexão/.test(fimT.erro + (await toasts(k))) && pinDaConta(ANA).versao === v0,
    'tirado: "Trocar o PIN" num aparelho tirado da conta → confirma com o banco e sai da conta (o cadeado sai), sem "Sem conexão"');

  /* ---------- conta bloqueada: a renovação no meio do registro do aparelho não trava ---------- */
  console.log('Conta bloqueada: a renovação da sessão no meio do registro do aparelho');
  /* o "Olá" e as dicas do AssistONE abririam sozinhos na volta e cobririam os botões */
  await k.evaluate(() => { AOne.save({ hello: 1, tour: 1, tips: Object.assign({}, AOne.cfg().tips, { home: 1, settings: 1, house: 1 }) }); });
  await entrarOmni(k, ANA);
  await cadeadoAntigo(k, ANA, PIN_K2);
  L = await local(k);
  M.banidas[ANA] = true;
  /* 2.26.0: a conta bloqueada sai de verdade (Saida), que no fim recarrega a página: aqui o recarregar só fica anotado, para
     conferir o que aconteceu na mesma página; depois a página recarrega de verdade e a tela de entrar diz o motivo */
  const ban = await k.evaluate(async (u) => {
    Cloud.stopPoll(); window.__recarregou = 0; Saida.recarregar = () => { window.__recarregou = 1; };
    const s = JSON.parse(localStorage.getItem('solverone.sessao.v1')); s.expira = 0; localStorage.setItem('solverone.sessao.v1', JSON.stringify(s));
    const fim = await Promise.race([Aparelhos.registrar().then(() => 'acabou', () => 'acabou'), new Promise((r) => setTimeout(() => r('travou'), 8000))]);
    const pin = await Promise.race([Cofre._pinRaw('000000').then(() => 'respondeu'), new Promise((r) => setTimeout(() => r('travou'), 4000))]);
    for (let i = 0; i < 80 && !window.__recarregou; i++) await new Promise((r) => setTimeout(r, 100));
    return { fim, pin, saiu: window.__recarregou === 1, motivo: sessionStorage.getItem('omnilife.saiu'), L: !!(await IDB.get('kv', 'cofre|' + u)), conta: Conta.on() };
  }, ANA);
  delete M.banidas[ANA];
  await k.reload();
  const entrada = await k.waitForFunction(() => typeof S !== 'undefined' && S.gate === 'welcome', null, { timeout: 15000 }).then(() => true, () => false);
  conferir(!L.ap && ban.fim === 'acabou' && ban.pin === 'respondeu' && ban.saiu && ban.motivo === 'bloqueada' && !ban.L && !ban.conta && entrada && /bloqueada/.test(await toasts(k)),
    'conta bloqueada: o registro termina, o cadeado deste aparelho é apagado, a conta sai (tela de entrar com "Esta conta está bloqueada…") e o PIN continua respondendo (nada travado)');
  /* P2 (revisão 1): a renovação que acontece DENTRO da trava do cadeado (quem grava e fala com o banco ao mesmo tempo): a saída da
     conta bloqueada não é esperada por quem está com a trava — senão o apagar (que espera a trava) e ele esperariam um pelo outro */
  await entrarOmni(k, ANA);
  await cadeadoAntigo(k, ANA, PIN_K2);
  M.banidas[ANA] = true;
  const ban2 = await k.evaluate(async (u) => {
    Cloud.stopPoll(); window.__recarregou = 0; Saida.recarregar = () => { window.__recarregou = 1; };
    const s = JSON.parse(localStorage.getItem('solverone.sessao.v1')); s.expira = 0; localStorage.setItem('solverone.sessao.v1', JSON.stringify(s));
    const fim = await Promise.race([Cofre.mudarLocal(null, async () => { await Conta.token(); }).then(() => 'acabou', () => 'acabou'), new Promise((r) => setTimeout(() => r('travou'), 8000))]);
    for (let i = 0; i < 80 && !window.__recarregou; i++) await new Promise((r) => setTimeout(r, 100));
    return { fim, saiu: window.__recarregou === 1, L: !!(await IDB.get('kv', 'cofre|' + u)), conta: Conta.on() };
  }, ANA);
  delete M.banidas[ANA];
  conferir(ban2.fim === 'acabou' && ban2.saiu && !ban2.L && !ban2.conta, 'conta bloqueada (P2): a renovação dentro da trava do cadeado não trava — quem está com a trava termina e o cadeado é apagado depois');
  await k.reload(); await k.waitForFunction(() => typeof S !== 'undefined' && S.gate === 'welcome', null, { timeout: 15000 });

  /* ---------- nada de PIN no console; nada fora do banco de mentira ---------- */
  const temPin = (t) => PINS.some((pin) => new RegExp('(^|[^0-9])' + pin + '([^0-9]|$)').test(t));
  const segredos = db.sol_aparelho_pin.map((x) => x.segredo);
  conferir(!K.lixo.console.some((t) => temPin(t) || segredos.some((s) => t.includes(s))), 'nenhum PIN nem segredo do aparelho no console');
  conferir(!K.lixo.erros.length, 'nenhum erro de script' + (K.lixo.erros.length ? ': ' + K.lixo.erros.join(' | ') : ''));
  conferir(!K.lixo.nativos.length, 'nenhum alert/confirm/prompt do navegador');
  conferir(!K.lixo.fora.some((u) => /supabase/i.test(u)), 'o Supabase só pelo banco de mentira');
  await K.ctx.close();

  await terminar(falhas, browser, 'PIN da conta (cantos): o PIN deste aparelho conferido uma vez, bloqueado só com campo quando o PIN da conta libera, sem o SQL o aparelho no PIN da conta não troca só o daqui, aparelho tirado sai ao criar/trocar o PIN, conta bloqueada no meio do registro não trava, nada de PIN no console.');
})().catch((e) => { console.error('Erro no teste:', e.message); process.exit(1); });
