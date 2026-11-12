/* Revisão final da 2.26.0 — os achados confirmados pelas 4 lentes (regressões, jornada, dados e segurança), cada um com o caso
   que mostrava o defeito. No "Supabase de mentira" (teste/mock-sol.js): nada vai para a internet nem para o Supabase de verdade.
     G1  a digital deixou de confirmar (autenticador que não confirma e uma credencial que ele não tem): a trava do app tem saída
         — "Sair da conta" e entrar de novo (e-mail e senha na nuvem; o perfil no "só neste aparelho") abre o app sem a trava
     A1  quem esqueceu o PIN da conta: "Abrir sem o PIN" diz que a troca só existe aprovando com a digital no outro aparelho, e a
         oferta da digital avisa que, sem ela, um PIN da conta esquecido não tem volta
     F1  rede pendurada (o navegador acha que está online; o banco não responde): abrir as Senhas da casa (campo do PIN, PIN,
         digital, 2ª abertura) não espera a rede mais que uns segundos, os itens aparecem e um redesenho com elas abertas não as
         esconde — no aparelho já na conta (com o PIN da conta) e no cadeado da 2.25 (fora da lista)
     G2  "Criar o PIN da conta" fora do "logo depois de abrir" pede o PIN de agora (ou a digital) antes: PIN errado e Cancelar não
         mudam nada (nem o PIN deste aparelho, nem o banco); o PIN certo cria
     A2  "Falta liberar" não promete o MoneyTRIO nem "abrir o app": diz para abrir as Senhas da casa no OmniLifeONE (e é isso
         mesmo: com elas fechadas, o Cloud.poll não libera)
     A3  o aparelho da 2.25 ainda no PIN antigo não diz "É o PIN da sua conta": diz para digitar o PIN que ele tinha antes (que
         abre e leva a "Agora o PIN é um só para a conta"); o aparelho já no PIN da conta continua dizendo "É o PIN da sua conta"
     F2  "Crie o PIN da sua conta" com a publicação da chave falhando: nenhuma linha fantasma na lista da conta, a Jornada continua
         "contaNova" e a 2ª tentativa (fechando, no mesmo formulário e com o "tirar" falhando junto) cria a pública, o "primeiro"
         e o PIN da conta (versão 1)
     G3  "Sair" com a rede pendurada: a tela de entrar aparece em segundos, a sessão sai deste aparelho e, ao reabrir, não há
         "Continuar como"
     A4  aprovação pela família: quem aprova lê o nome de quem pediu (não "o PIN da sua conta"); o aparelho aprovado pela família
         não diz "você aprova por este aqui" (a conta nova continua dizendo); aprovação pessoal: "Continue no outro aparelho"
     A5  "Não lembro o PIN da conta: escolher outro" só depois da aprovação pelo outro aparelho da pessoa (e lá troca o PIN, versão
         +1); depois da família, do código antigo e da digital em todos os aparelhos, a frase que explica no lugar do link
     sem erro de script, sem diálogo nativo e nada fora do banco de mentira
   Cada parte começa do mesmo banco (a foto tirada depois do prepararChaves). Só uma parte: SO=G1,F2 (separadas por vírgula).
   Pessoas, senhas, PINs e chaves de mentira. Uso: node teste/rodar.js   ·   sozinho: BASE=http://localhost:8099 node teste/revisao-final-omni.js */
const { BASE, criarConferir, iniciar, terminar } = require('./_base');
const { SB, M, db, prepararChaves, PESSOAS, ANA, BIA, CRIS } = require('./mock-sol');
const { aparelho, entrarOmni, senhasDaCasa, cadeado225 } = require('./_nuvem');

const PIN_A = '736251', PIN_B = '482915', PIN_C = '528061', PIN_CONTA = '590317', PIN_NOVO = '975318';
const espere = (ms) => new Promise((r) => setTimeout(r, ms));
const SO = (process.env.SO || '').split(',').map((s) => s.trim()).filter(Boolean);
/* o "Olá" e as dicas do AssistONE abrem sozinhos e cobririam os botões; o passo a passo das Senhas da casa também */
const quieto = (p) => p.evaluate(() => { AOne.save({ hello: 1, tour: 1, tips: Object.assign({}, AOne.cfg().tips, { home: 1, settings: 1, house: 1, family: 1 }) }); if (AOne.view) AOne.close(); lsSet(GuiaCofre.K, Date.now()); });
const janelas = (p) => p.evaluate(() => [...document.querySelectorAll('.modal')].map((m) => m.innerText.replace(/\s+/g, ' ').trim()).join(' || '));
const esperarJanela = (p, re, ms) => p.waitForFunction((s) => [...document.querySelectorAll('.modal')].some((m) => new RegExp(s).test(m.innerText)), re.source, { timeout: ms || 10000 }).then(() => true, () => false);
const esperar = (p, fn, arg, ms) => p.waitForFunction(fn, arg, { timeout: ms || 10000 }).then(() => true, () => false);
const naEntrada = (p, ms) => esperar(p, () => typeof S !== 'undefined' && S.gate === 'welcome' && !!document.querySelector('#screen .gate'), null, ms || 25000);
const linhasDe = (uid) => db.sol_aparelhos.filter((a) => a.user_id === uid && !a.removido_em);
const pinDe = (uid) => db.sol_pin_conta.find((x) => x.user_id === uid);
/* guarda cada aviso (toast) que aparece, para conferir depois */
const vigiarAvisos = (p) => p.evaluate(() => { window.__av = []; new MutationObserver(() => { document.querySelectorAll('#toasts .toast').forEach((t) => { if (!window.__av.includes(t.textContent)) window.__av.push(t.textContent); }); }).observe(document.querySelector('#toasts'), { childList: true, subtree: true, characterData: true }); });
const avisos = (p) => p.evaluate(() => (window.__av || []).join(' | '));
/* a oferta "Usar a digital para abrir o OmniLifeONE" (só nos aparelhos com leitor) fica para depois */
async function semOferta(p) { await espere(1600); for (let i = 0; i < 3; i++) { const b = await p.$('.modal [data-no]'); if (b) await b.click().catch(() => {}); else break; } }
/* na tela de entrar: e-mail e senha (sem recarregar) */
async function entrarEmail(p, uid) {
  await p.click('[data-act="conta.email"]'); await p.waitForSelector('#cem', { timeout: 10000 });
  await p.fill('#cem', PESSOAS[uid].email); await p.fill('#cpw', PESSOAS[uid].senha); await p.click('#cin');
  await p.waitForFunction(() => S.booted && S.mode === 'cloud' && S.family, null, { timeout: 30000 });
}
/* quem aprova: a faixa "🔔 Pedido de acesso" → "Ver" → os 6 números */
async function verPedido(p) {
  await p.evaluate(async () => { for (let i = 0; i < 80 && Aparelhos._olhando; i++) await new Promise((r) => setTimeout(r, 100)); Aparelhos._vistos = {}; await Aparelhos.olharPedidos(); });
  await p.waitForSelector('#apVer', { timeout: 15000 }); await p.click('#apVer');
  return esperar(p, () => !!document.querySelector('.modal #apSas'), null, 30000);
}
/* um aparelho da pessoa já dentro da família, com o cadeado como a 2.25 gravava (fora da lista da conta), trancado ou aberto.
   fora: continua fora da lista (o aoAbrir não o registra) até quem chamou trancar e soltar o Sol.ligadoAp */
async function comCadeado(p, uid, pin, op) {
  op = op || {};
  await p.evaluate(() => { Sol.ligadoAp = false; Sol.ligadoPin = false; });
  await senhasDaCasa(p);
  await cadeado225(p, uid, pin, !!op.digital);
  await p.waitForFunction(() => Cofre.status && Cofre.status.fase === 'aberto' && !document.querySelector('.modal'), null, { timeout: 20000 });
  if (!op.aberto) await p.evaluate(() => ACT['conta.bloquear']());
  if (!op.fora) await p.evaluate(() => { Sol.ligadoAp = null; Sol.ligadoPin = null; });
}

(async () => {
  const browser = await iniciar();
  const { falhas, conferir } = criarConferir();
  await prepararChaves();
  const FOTO = JSON.parse(JSON.stringify(db));
  const lixos = [];
  /* cada parte começa do mesmo banco e sem as falhas de mentira da parte anterior */
  const voltar = () => {
    for (const t of Object.keys(db)) db[t].splice(0, db[t].length, ...JSON.parse(JSON.stringify(FOTO[t] || [])));
    Object.assign(M, { falhar: {}, semPin: false, semAp: false, semDelete: false, banidas: {}, atrasoLogout: 0, ataque: null }); M.relogio = Date.now();
  };
  async function parte(id, titulo, fn) {
    if (SO.length && !SO.includes(id)) return;
    console.log('\n' + id + '. ' + titulo);
    voltar();
    const ctxs = [];
    const novo = async (nome, op) => { const A = await aparelho(browser, Object.assign({ nome, base: BASE }, op)); ctxs.push(A.ctx); lixos.push(A.lixo); return A; };
    try { await fn(novo); } catch (e) { conferir(false, id + ': o teste parou no meio — ' + String((e && e.message) || e).split('\n')[0]); }
    for (const c of ctxs) await c.close().catch(() => {});
  }

  /* ================= G1: a digital deixou de confirmar e a trava do app ================= */
  await parte('G1', 'A digital deixou de confirmar: "Sair da conta" na trava do app e entrar de novo abre o app', async (novo) => {
    const A = await novo('G1-nuvem', { vp: 'computador', digital: true }), p = A.p;
    await A.cdp.send('WebAuthn.setUserVerified', { authenticatorId: A.autenticador, isUserVerified: false });
    await entrarOmni(p, ANA); await quieto(p);
    /* a trava ligada com uma credencial que este autenticador não tem (passkey apagada, bloqueio de tela trocado) */
    await p.evaluate(() => { lsSet(LS.webauthn, { id: 'AAAAAAAAAAAAAAAAAAAAAA==' }); S.prefs.bioLock = true; savePrefs(); try { sessionStorage.clear(); } catch (e) {} });
    await p.goto(BASE + '/index.html');
    const trava = await p.waitForSelector('.lock #bo', { timeout: 20000 }).then(() => true, () => false);
    await p.click('.lock #bu').catch(() => {}); await espere(1500);
    conferir(trava && await p.evaluate(() => !!document.querySelector('.lock') && !S.unlocked), 'preparo G1: a trava aparece e "Desbloquear" não abre (a digital não confirma)');
    await p.click('.lock #bo');
    const n1 = await naEntrada(p);
    await entrarEmail(p, ANA); await espere(3000);
    const e1 = await p.evaluate(() => ({ trava: !!document.querySelector('.lock'), aberto: S.booted && !!S.family && !!document.querySelector('#screen .card') }));
    conferir(n1 && !e1.trava && e1.aberto, 'G1. nuvem: trava → "Sair da conta" → entrar com e-mail e senha → o app abre sem a trava (antes: a trava de novo, sem saída)');
    /* "só neste aparelho": sai e escolhe o perfil de novo */
    const B = await novo('G1-local', { vp: 'celular', digital: true }), g = B.p;
    await B.cdp.send('WebAuthn.setUserVerified', { authenticatorId: B.autenticador, isUserVerified: false });
    await g.goto(BASE + '/index.html');
    await g.waitForFunction(() => typeof S !== 'undefined' && S.gate === 'welcome', null, { timeout: 25000 });
    await g.evaluate(() => ACT['gate.local']()); await g.waitForSelector('#fn', { timeout: 10000 });
    await g.fill('#fn', 'Família Local'); await g.fill('#mn', 'Pessoa Local'); await g.click('#go');
    await g.waitForFunction(() => S.booted && S.mode === 'local', null, { timeout: 15000 }); await quieto(g);
    await g.evaluate(() => { lsSet(LS.webauthn, { id: 'AAAAAAAAAAAAAAAAAAAAAA==' }); S.prefs.bioLock = true; savePrefs(); try { sessionStorage.clear(); } catch (e) {} });
    await g.goto(BASE + '/index.html');
    const trava2 = await g.waitForSelector('.lock #bo', { timeout: 20000 }).then(() => true, () => false);
    await g.click('.lock #bo');
    const n2 = await naEntrada(g);
    await g.evaluate(() => ACT['gate.local']()); await espere(2000);
    if (await g.evaluate(() => S.gate === 'profiles')) await g.evaluate(() => ACT['gate.pick']({ id: People.list('humans')[0].id }));
    await espere(3000);
    const e2 = await g.evaluate(() => ({ trava: !!document.querySelector('.lock'), aberto: S.booted && S.mode === 'local' }));
    conferir(trava2 && n2 && !e2.trava && e2.aberto, 'G1. "só neste aparelho": trava → "Sair da conta" → escolher o perfil → o app abre sem a trava');
    conferir(await g.evaluate(() => !!lsGet(LS.webauthn, null) && !S.prefs.bioLock), 'G1. a trava fica desligada (dá para ligar de novo em ⚙) e a credencial da digital continua guardada');
  });

  /* ================= A1 (a oferta da digital): sem ela, um PIN da conta esquecido não tem volta ================= */
  await parte('A1', 'A oferta da digital diz por que vale a pena (sem ela, o PIN da conta esquecido não tem volta)', async (novo) => {
    const A = await novo('A1-celular', { vp: 'celular', digital: true }), p = A.p;
    await entrarOmni(p, ANA); await quieto(p); await semOferta(p);
    await comCadeado(p, ANA, PIN_A, { aberto: true });
    await p.evaluate(() => { TelaConta._ofertou = false; TelaConta.oferecerDigital(); });
    const abriu = await esperarJanela(p, /Usar a digital neste/, 10000), t = await janelas(p);
    conferir(abriu && /esquecer o PIN da conta/.test(t) && /não tem volta/.test(t), 'A1. "Usar a digital neste …?" avisa que, sem a digital, um PIN da conta esquecido não tem volta (' + t.slice(0, 260) + ')');
    await p.evaluate(async () => { S.lang = 'en'; closeModals(); TelaConta._ofertou = false; await IDB.del('kv', 'digitalPerguntada|' + Conta.uid()); });
    await p.evaluate(() => TelaConta.oferecerDigital());
    const tEn = (await esperarJanela(p, /Use your fingerprint on this/, 10000)) ? await janelas(p) : '';
    conferir(/forget the account PIN/.test(tEn) && /no way back/.test(tEn), 'A1. o mesmo aviso em inglês');
  });

  /* ================= F1: rede pendurada ao abrir as Senhas da casa ================= */
  await parte('F1', 'Rede pendurada (online, mas o banco não responde): abrir as Senhas da casa não espera a rede', async (novo) => {
    const TRAVA = { ms: 0 };
    const medir = async (nome, cadeadoDaConta) => {
      const A = await novo(nome, { vp: 'computador', digital: true }), p = A.p;
      /* depois de ligada, cada pedido ao banco fica 25 s sem resposta e só então cai (como uma rede que pendurou) */
      await A.ctx.route((u) => u.href.startsWith(SB), async (route) => { if (TRAVA.ms) { await espere(TRAVA.ms); return route.abort().catch(() => {}); } return route.fallback(); });
      await entrarOmni(p, ANA); await quieto(p); await semOferta(p);
      await comCadeado(p, ANA, PIN_A, { aberto: true, digital: true, fora: !cadeadoDaConta });
      await p.evaluate(async () => { for (let i = 1; i <= 3; i++) await DB.put('vault', { kind: 'senha', enc: await Vault.encObj({ title: 'Wi-Fi ' + i, login: 'u', pass: 'x' }), files: [], vis: 'restrito' }); });
      if (cadeadoDaConta) await p.evaluate(async (pin) => { await Aparelhos.registrar(); const r = await Pin.criar(pin); if (!r.ok) throw new Error('Pin.criar ' + JSON.stringify(r)); }, PIN_A);
      const L = await p.evaluate(async () => { const L = await Cofre.local(); return { ap: !!L.ap, srv: !!L.srv, prf: !!L.prf }; });
      conferir(L.prf && L.ap === cadeadoDaConta && L.srv === cadeadoDaConta, 'preparo F1 (' + nome + '): ' + JSON.stringify(L));
      await p.evaluate(async () => { try { await SolverCofre.trancar(); } catch (e) {} Cofre.trancar(); closeModals(); go('home'); Sol.ligadoAp = null; Sol.ligadoPin = null; });
      await espere(2500);   /* o que estava a caminho com a rede boa termina antes */
      TRAVA.ms = 25000;
      await espere(500);
      await p.evaluate(() => { Jornada.limpar(); Pin.limpar(); Cofre.status = null; });
      const t = {}, cron = async (k, fn) => { const t0 = Date.now(); const ok = await fn(); t[k] = ok ? Date.now() - t0 : null; };
      await cron('campo', () => p.evaluate(() => go('house', 'vault')).then(() => p.waitForSelector('#cfpin', { timeout: 30000 })).then(() => true, () => false));
      await p.fill('#cfpin', PIN_A).catch(() => {});
      const t0 = Date.now(); await p.click('[data-act="cofre.pin"]').catch(() => {});
      t.abrir = (await esperar(p, () => Cofre.aberto(), null, 30000)) ? Date.now() - t0 : null;
      t.itens = (await esperar(p, () => /Wi-Fi 3/.test((document.querySelector('#vlist') || {}).innerText || ''), null, 80000)) ? Date.now() - t0 : null;
      await p.evaluate(() => closeModals());
      await cron('redesenho', () => p.evaluate(() => { Jornada.limpar(); render(); }).then(() => esperar(p, () => /Wi-Fi 3/.test((document.querySelector('#vlist') || {}).innerText || ''), null, 30000)));
      await cron('digital', () => p.evaluate(async () => { Cofre.trancar(); const r = await Promise.race([Cofre.destrancarDigital(), new Promise((ok) => setTimeout(() => ok({ erro: 'demorou' }), 30000))]); return !!r.ok; }));
      await cron('pin2', () => p.evaluate(async (pin) => { Cofre.trancar(); const r = await Promise.race([Cofre.destrancarPin(pin), new Promise((ok) => setTimeout(() => ok({ erro: 'demorou' }), 30000))]); return !!r.ok; }, PIN_A));
      TRAVA.ms = 0;
      const erros = await p.evaluate(async () => (await Cofre.local()).erros || 0);
      const s = (k) => (t[k] === null ? 'não abriu' : (t[k] / 1000).toFixed(1) + ' s');
      console.log('   ' + nome + ': campo ' + s('campo') + ' · abrir ' + s('abrir') + ' · itens ' + s('itens') + ' · redesenho ' + s('redesenho') + ' · digital ' + s('digital') + ' · 2ª abertura ' + s('pin2'));
      const ate = (k, ms) => t[k] !== null && t[k] < ms;
      conferir(ate('campo', 5000) && ate('abrir', 5000), 'F1 (' + nome + '). o campo do PIN aparece e o PIN abre em menos de 5 s (campo ' + s('campo') + ', abrir ' + s('abrir') + ')');
      conferir(ate('itens', 10000), 'F1 (' + nome + '). os itens aparecem em menos de 10 s depois do toque (' + s('itens') + ')');
      conferir(ate('redesenho', 2000), 'F1 (' + nome + '). redesenhar com as Senhas abertas não esconde os itens à espera da rede (' + s('redesenho') + ')');
      conferir(ate('digital', 5000) && ate('pin2', 5000), 'F1 (' + nome + '). a digital e a 2ª abertura com o PIN em menos de 5 s (digital ' + s('digital') + ', 2ª ' + s('pin2') + ')');
      conferir(erros === 0, 'F1 (' + nome + '). o PIN certo não contou erro neste aparelho (' + erros + ')');
    };
    await medir('F1-na-conta', true);
    await medir('F1-cadeado-2.25', false);
  });

  /* ================= G2: "Criar o PIN da conta" pede o PIN de agora ================= */
  await parte('G2', '"Criar o PIN da conta" com a casa aberta pede o PIN de agora antes (reforço 2.21.2)', async (novo) => {
    const A = await novo('G2-celular', { vp: 'celular' }), p = A.p;
    await entrarOmni(p, ANA); await quieto(p);
    await comCadeado(p, ANA, PIN_A, { aberto: true });
    await p.evaluate(() => Aparelhos.registrar());
    await p.evaluate(async () => { await Cofre.atualizar(); render(); closeModals(); });
    const pinAntes = await p.evaluate(async () => JSON.stringify((await Cofre.local()).pin));
    conferir(!pinDe(ANA) && await p.evaluate(() => Cofre.aberto()), 'preparo G2: a conta sem PIN da conta e as Senhas da casa abertas aqui');
    await p.evaluate(() => { ACT['conta.pin.criar'](); });
    await p.waitForSelector('.modal #pcP1, .modal #ppin', { timeout: 10000 });
    const primeira = await p.evaluate(() => document.querySelector('.modal #ppin') ? 'ppin' : 'pcP1');
    conferir(primeira === 'ppin', 'G2. a 1ª janela pede o PIN de agora (#ppin), não o formulário do PIN novo (' + primeira + ')');
    if (primeira !== 'ppin') return;
    await p.fill('.modal #ppin', '111222'); await p.click('.modal:has(#ppin) [data-ok]'); await espere(1500);
    const errado = await p.evaluate(() => ({ txt: (document.querySelector('.modal #perr') || {}).textContent || '', form: !!document.querySelector('.modal #pcP1') }));
    conferir(/PIN errado/.test(errado.txt) && !errado.form, 'G2. PIN errado: "PIN errado. Tente de novo." e o formulário do PIN novo não abre');
    await p.click('.modal:has(#ppin) [data-x]'); await espere(800);
    const cancelou = await p.evaluate(async () => ({ form: !!document.querySelector('.modal #pcP1'), pin: JSON.stringify((await Cofre.local()).pin) }));
    conferir(!cancelou.form && cancelou.pin === pinAntes && !pinDe(ANA), 'G2. Cancelar: nada abre, o PIN deste aparelho fica e nada vai para o banco (sol_pin_conta)');
    await p.evaluate(() => { ACT['conta.pin.criar'](); });
    await p.waitForSelector('.modal #ppin', { timeout: 10000 });
    await p.fill('.modal #ppin', PIN_A); await p.click('.modal:has(#ppin) [data-ok]');
    const form = await p.waitForSelector('.modal #pcP1', { timeout: 10000 }).then(() => true, () => false);
    if (form) { await p.fill('.modal #pcP1', PIN_CONTA); await p.fill('.modal #pcP2', PIN_CONTA); await p.click('.modal #pcOk'); await p.waitForSelector('.modal #pcP1', { state: 'detached', timeout: 20000 }).catch(() => {}); }
    conferir(form && !!pinDe(ANA) && pinDe(ANA).versao === 1, 'G2. o PIN certo abre o formulário e o PIN da conta é criado (versão 1)');
  });

  /* ================= A2: "Falta liberar" diz o que destrava de verdade ================= */
  await parte('A2', '"Falta liberar": abrir as Senhas da casa no OmniLifeONE (não "abrir o app" nem o MoneyTRIO)', async (novo) => {
    const A = await novo('A2-Ana', { vp: 'celular' }), a = A.p;
    await entrarOmni(a, ANA); await quieto(a);
    await comCadeado(a, ANA, PIN_A);
    const C = await novo('A2-Cris', { vp: 'celular' }), c = C.p;
    await entrarOmni(c, CRIS); await quieto(c);
    await c.evaluate(() => { closeModals(); TelaConta.primeiraVez(); });
    const form = await esperarJanela(c, /Crie o PIN da sua conta/, 15000), tForm = await janelas(c);
    conferir(form && /você aprova por este aqui/.test(tForm), 'A4. a conta nova continua com "Não tem código para anotar: num aparelho novo, você aprova por este aqui."');
    await c.fill('.modal #pcP1', PIN_C); await c.fill('.modal #pcP2', PIN_C); await c.click('.modal #pcOk');
    const falta = await esperarJanela(c, /Falta liberar/, 60000), t = await janelas(c);
    conferir(falta && !/MoneyTRIO/.test(t) && /abrir as Senhas da casa no OmniLifeONE/.test(t) && /Casa → Senhas da casa/.test(t),
      'A2. "Falta liberar" pede para outro responsável abrir as Senhas da casa no OmniLifeONE (sem prometer o MoneyTRIO) (' + t.slice(0, 260) + ')');
    for (let i = 0; i < 2; i++) { await a.evaluate(async () => { Cofre._dist = 0; await Cloud.poll(); }); await espere(1000); }
    conferir(!db.sol_grupo_chaves.some((x) => x.user_id === CRIS), 'A2. com o app da Ana aberto e as Senhas da casa fechadas, nada é liberado (por isso o texto não diz "abrir o app")');
    await a.evaluate(() => { Cofre._dist = 0; go('house', 'vault'); }); await a.waitForSelector('#cfpin', { timeout: 15000 });
    await a.fill('#cfpin', PIN_A); await a.click('[data-act="cofre.pin"]');
    await esperar(a, () => Cofre.aberto(), null, 30000);
    let liberou = false; for (let i = 0; i < 30 && !(liberou = db.sol_grupo_chaves.some((x) => x.user_id === CRIS)); i++) await espere(1000);
    conferir(liberou, 'A2. a Ana abre as Senhas da casa → a chave da família vai para a Cris');
    await c.evaluate(() => { closeModals(); go('house', 'vault'); }); await c.waitForSelector('#cfpin', { timeout: 15000 });
    await c.fill('#cfpin', PIN_C); await c.click('[data-act="cofre.pin"]');
    conferir(await esperar(c, () => Cofre.aberto(), null, 30000), 'A2. "Depois é só voltar aqui e digitar o seu PIN": a Cris abre com o PIN dela');
  });

  /* ================= A3: o aparelho ainda no PIN antigo ================= */
  await parte('A3', 'O aparelho da 2.25 ainda no PIN antigo diz para digitar o PIN que ele tinha antes', async (novo) => {
    const P = await novo('A3-computador', { vp: 'computador' }), pc = P.p;
    await entrarOmni(pc, ANA); await quieto(pc);
    await comCadeado(pc, ANA, PIN_B);   /* o PIN antigo deste computador, fora da lista da conta */
    const A = await novo('A3-celular', { vp: 'celular' }), a = A.p;
    await entrarOmni(a, ANA); await quieto(a);
    await comCadeado(a, ANA, PIN_A, { aberto: true });
    await a.evaluate(async (pin) => { await Aparelhos.registrar(); const r = await Pin.criar(pin); if (!r.ok) throw new Error('Pin.criar ' + JSON.stringify(r)); ACT['conta.bloquear'](); }, PIN_CONTA);
    await a.evaluate(async () => { closeModals(); Jornada.limpar(); go('house', 'vault'); await Cofre.atualizar(); render(); });
    await a.waitForSelector('#cfpin', { timeout: 15000 });
    const tCel = await a.evaluate(() => document.querySelector('#screen').innerText);
    conferir(/É o PIN da sua conta/.test(tCel) && !/ainda usa o PIN que ele tinha antes/.test(tCel), 'A3. o celular já no PIN da conta continua dizendo "É o PIN da sua conta"');
    await pc.evaluate(async () => { closeModals(); Jornada.limpar(); go('house', 'vault'); await Cofre.atualizar(); render(); });
    await pc.waitForSelector('#cfpin', { timeout: 15000 });
    const st = await pc.evaluate(async () => { const s = await Jornada.ler(true); return { tem: s.tem, ap: s.ap, srv: s.srv, migrar: s.migrar }; });
    const tPc = await pc.evaluate(() => document.querySelector('#screen').innerText);
    conferir(st.tem && !st.ap && !st.srv && st.migrar, 'preparo A3: o computador fora da lista, a conta com PIN (' + JSON.stringify(st) + ')');
    conferir(!/É o PIN da sua conta/.test(tPc) && /ainda usa o PIN que ele tinha antes/.test(tPc) && /Esqueci o PIN/.test(tPc), 'A3. o computador fora da lista não diz "É o PIN da sua conta": diz para digitar o PIN que ele tinha antes');
    await pc.evaluate(() => { S.lang = 'en'; render(); }); await pc.waitForSelector('#cfpin', { timeout: 15000 });
    conferir(/still uses the PIN it had before/.test(await pc.evaluate(() => document.querySelector('#screen').innerText)), 'A3. o mesmo em inglês');
    await pc.evaluate(() => { S.lang = 'pt'; render(); }); await pc.waitForSelector('#cfpin', { timeout: 15000 });
    await pc.fill('#cfpin', PIN_B); await pc.click('[data-act="cofre.pin"]');
    const mudou = await esperarJanela(pc, /Agora o PIN é um só para a conta/, 20000);
    conferir(mudou, 'A3. o PIN antigo do computador abre e leva a "🔢 Agora o PIN é um só para a conta"');
  });

  /* ================= F2: a conta nova com a publicação da chave falhando ================= */
  for (const v of ['fecha', 'denovo', 'ambos']) {
    await parte('F2', '"Crie o PIN da sua conta" (Cris, conta nova) com a chave pública falhando — ' + ({ fecha: 'fecha e tenta de novo', denovo: 'tenta de novo no mesmo formulário', ambos: 'o "tirar" falhando junto' })[v], async (novo) => {
      const C = await novo('F2-' + v, { vp: 'celular' }), c = C.p;
      await entrarOmni(c, CRIS); await quieto(c);
      await c.evaluate(() => { closeModals(); TelaConta.primeiraVez(); });
      await c.waitForSelector('.modal #pcP1', { timeout: 15000 });
      M.falhar = v === 'ambos' ? { sol_publicar_minha_chave: 1, sol_aparelho_tirar: 1 } : { sol_publicar_minha_chave: 1 };
      await c.fill('.modal #pcP1', PIN_C); await c.fill('.modal #pcP2', PIN_C); await c.click('.modal #pcOk');
      await esperar(c, () => /conex/i.test((document.querySelector('.modal #pcErr') || {}).textContent || ''), null, 60000);
      conferir(!linhasDe(CRIS).length && !db.sol_chave_publica.some((x) => x.user_id === CRIS), 'F2 (' + v + '). a chave pública falhou: nenhuma linha fantasma na lista da conta (' + JSON.stringify(linhasDe(CRIS).map((a) => a.como)) + ')');
      M.falhar = {};
      if (v !== 'denovo') {
        await c.click('.modal [data-x]'); await espere(500);
        const caso = await c.evaluate(async () => { Jornada.limpar(); return (await Cofre.atualizar()).caso; });
        conferir(caso === 'contaNova', 'F2 (' + v + '). depois de fechar, a Jornada continua "contaNova" (não "primeiraVez" pedindo um aparelho que não existe): ' + caso);
        await c.evaluate(() => { closeModals(); TelaConta.primeiraVez(); });
        await c.waitForSelector('.modal #pcP1', { timeout: 15000 });
      }
      await c.fill('.modal #pcP1', PIN_C); await c.fill('.modal #pcP2', PIN_C); await c.click('.modal #pcOk');
      await c.waitForSelector('.modal #pcP1', { state: 'detached', timeout: 60000 }).catch(() => {});
      await espere(1000);
      const L = await c.evaluate(async () => { const L = await Cofre.local(); return L && { ap: L.ap, como: L.como, srv: !!L.srv, v: L.pinVersao }; });
      const l = linhasDe(CRIS);
      conferir(db.sol_chave_publica.some((x) => x.user_id === CRIS) && l.length === 1 && l[0].como === 'primeiro' && !!L && L.ap === l[0].id && L.srv && !!pinDe(CRIS) && pinDe(CRIS).versao === 1,
        'F2 (' + v + '). a 2ª tentativa cria a pública, este aparelho como "primeiro" e o PIN da conta (versão 1): ' + JSON.stringify({ linhas: l.map((a) => a.como), L, pin: (pinDe(CRIS) || {}).versao || 0 }));
    });
  }

  /* ================= G3: "Sair" com a rede pendurada ================= */
  await parte('G3', '"Sair" com a rede pendurada sai da conta em segundos', async (novo) => {
    const A = await novo('G3-celular', { vp: 'celular' }), p = A.p;
    await entrarOmni(p, ANA); await quieto(p); await p.evaluate(() => closeModals());
    await espere(2500);
    const banco = (u) => u.href.startsWith(SB), pendura = () => {};
    await A.ctx.route(banco, pendura);   /* nenhum pedido ao banco responde */
    await p.click('#whoami'); await p.waitForSelector('.whomenu button.danger', { timeout: 8000 });
    const t0 = Date.now(); await p.click('.whomenu button.danger');
    const saiu = await naEntrada(p, 10000), seg = ((Date.now() - t0) / 1000).toFixed(1);
    const e = await p.evaluate(() => ({ conta: Conta.on(), modo: localStorage.getItem('omnilife.mode'), sessao: !!localStorage.getItem('solverone.sessao.v1') })).catch(() => ({ conta: true }));
    conferir(saiu && !e.conta && !e.modo && !e.sessao, 'G3. a tela de entrar aparece em menos de 10 s (' + seg + ' s), a sessão e o modo da nuvem saem deste aparelho');
    await A.ctx.unroute(banco, pendura).catch(() => {});
    const p2 = await A.ctx.newPage(); await p.close().catch(() => {});
    await p2.goto(BASE + '/index.html');
    await p2.waitForFunction(() => typeof S !== 'undefined' && (S.booted || S.gate === 'welcome'), null, { timeout: 25000 }).catch(() => {});
    await espere(1500);
    const r = await p2.evaluate(() => ({ booted: S.booted, conta: Conta.on(), continuar: !!document.querySelector('[data-act="conta.continuar"]') }));
    conferir(!r.booted && !r.conta && !r.continuar, 'G3. fechar e abrir de novo: a tela de entrar, sem "Continuar como"');
  });

  /* ================= A4: aprovação pela família numa conta ainda sem PIN ================= */
  await parte('A4', 'Aprovação pela família: os textos de quem aprova e do aparelho aprovado', async (novo) => {
    const B = await novo('A4-Bia', { vp: 'celular' }), b = B.p;
    await entrarOmni(b, BIA); await quieto(b);
    await comCadeado(b, BIA, PIN_B, { aberto: true });
    const P = await novo('A4-computador', { vp: 'computador' }), pc = P.p;
    await entrarOmni(pc, ANA); await quieto(pc); await espere(1500);
    await pc.evaluate(() => { closeModals(); TelaConta.primeiraVez(); }); await esperarJanela(pc, /Primeira vez/, 10000);
    await pc.click('.modal #apFamilia'); await esperarJanela(pc, /Esperando/, 10000);
    conferir(await verPedido(b), 'preparo A4: a Bia vê o pedido da Ana e os 6 números');
    await vigiarAvisos(b);
    await b.fill('.modal #apPin', PIN_B); await b.click('.modal #apOk');
    await esperar(b, () => !document.querySelector('.modal #apSas'), null, 30000); await espere(600);
    const av = await avisos(b);
    conferir(/Aprovado\. Ana Teste já pode entrar/.test(av) && !/sua conta/.test(av), 'A4. a Bia lê "✓ Aprovado. Ana Teste já pode entrar com o PIN da conta dele(a)." (não "o PIN da sua conta"): ' + av);
    const pede = await esperarJanela(pc, /Crie o PIN da sua conta/, 30000), t = await janelas(pc);
    conferir(pede && !/você aprova por este aqui/.test(t), 'A4. o computador aprovado pela família pede o PIN da conta sem dizer "você aprova por este aqui" (ele não aprova um pedido pessoal)');
  });

  /* ================= A5 (+ A1 e A4): "Não lembro" só onde funciona ================= */
  await parte('A5', '"Não lembro o PIN da conta" só depois da aprovação pelo outro aparelho; "Abrir sem o PIN" explica a digital', async (novo) => {
    const A = await novo('A5-celular', { vp: 'celular' }), a = A.p;
    await entrarOmni(a, ANA); await quieto(a);
    await comCadeado(a, ANA, PIN_A, { aberto: true });
    await a.evaluate(async (pin) => { await Aparelhos.registrar(); const r = await Pin.criar(pin); if (!r.ok) throw new Error('Pin.criar ' + JSON.stringify(r)); closeModals(); }, PIN_CONTA);
    const B = await novo('A5-Bia', { vp: 'celular' }), b = B.p;
    await entrarOmni(b, BIA); await quieto(b);
    await comCadeado(b, BIA, PIN_B, { aberto: true });
    const P = await novo('A5-computador', { vp: 'computador' }), pc = P.p;
    await entrarOmni(pc, ANA); await quieto(pc); await espere(1500);
    /* (1) aprovado pelo outro aparelho da Ana: o link continua e troca o PIN da conta */
    await pc.evaluate(() => { closeModals(); TelaConta.primeiraVez(); }); await esperarJanela(pc, /Primeira vez/, 10000);
    await pc.click('.modal #apOutro'); await esperarJanela(pc, /Esperando o outro aparelho/, 10000);
    conferir(await verPedido(a), 'preparo A5: o celular da Ana vê o pedido e os 6 números');
    await vigiarAvisos(a);
    await a.fill('.modal #apPin', PIN_CONTA); await a.click('.modal #apOk');
    await esperar(a, () => !document.querySelector('.modal #apSas'), null, 30000); await espere(600);
    const avA = await avisos(a);
    conferir(/Aprovado\. Continue no outro aparelho/.test(avA), 'A4. aprovação pessoal: "✓ Aprovado. Continue no outro aparelho." (' + avA + ')');
    await esperarJanela(pc, /Digite o PIN da sua conta/, 30000);
    conferir(!!(await pc.$('.modal #pcNaoLembro')), 'A5. depois da aprovação pelo outro aparelho da Ana, "Não lembro o PIN da conta: escolher outro" aparece');
    await pc.click('.modal #pcNaoLembro'); await esperarJanela(pc, /Escolha o PIN novo/, 10000);
    await pc.fill('.modal #pcP1', PIN_NOVO); await pc.fill('.modal #pcP2', PIN_NOVO); await pc.click('.modal #pcOk');
    conferir(await esperar(pc, () => Cofre.aberto(), null, 60000) && pinDe(ANA).versao === 2, 'A5. e troca o PIN da conta (versão ' + (pinDe(ANA) || {}).versao + ')');
    await espere(800);
    /* (2) esqueceu: "Abrir sem o PIN" → a Bia aprova pela família */
    await pc.evaluate(() => { closeModals(); ACT['conta.bloquear'](); go('house', 'vault'); });
    await pc.waitForSelector('[data-act="cofre.esqueci"]', { timeout: 15000 }); await pc.click('[data-act="cofre.esqueci"]');
    await esperarJanela(pc, /Abrir sem o PIN/, 10000);
    const tSem = await janelas(pc);
    conferir(/No outro aparelho, aprove com a digital/.test(tSem) && /o PIN da conta não tem como ser trocado/.test(tSem), 'A1. "Abrir sem o PIN" diz que o PIN da conta esquecido só se troca aprovando com a digital no outro aparelho (' + tSem.slice(0, 200) + ')');
    await pc.click('.modal #apFamilia'); await esperarJanela(pc, /Esperando/, 10000);
    conferir(await verPedido(b), 'preparo A5: a Bia vê o pedido "para a família"');
    await b.fill('.modal #apPin', PIN_B); await b.click('.modal #apOk');
    const dFam = await esperarJanela(pc, /Digite o PIN da sua conta/, 30000), tFam = await janelas(pc);
    conferir(dFam && !(await pc.$('.modal #pcNaoLembro')) && /Ele só pode ser trocado quando outro aparelho seu aprova este/.test(tFam), 'A5. depois da família: sem "Não lembro" e com a frase que explica');
    await pc.click('.modal:has(#pcPin) [data-x]'); await esperar(pc, () => !document.querySelector('.modal #pcPin'), null, 10000); await espere(800);
    /* (3) o código de recuperação antigo */
    await pc.evaluate(() => { closeModals(); TelaConta.primeiraVez({ esqueci: true }); }); await esperarJanela(pc, /Abrir sem o PIN/, 10000);
    await pc.click('.modal #apCodigo'); await pc.waitForSelector('.modal #apCod', { timeout: 5000 });
    await pc.fill('.modal #apCod', PESSOAS[ANA].codigo); await pc.click('.modal #apCodOk');
    const dKit = await esperarJanela(pc, /Digite o PIN da sua conta/, 30000);
    conferir(dKit && !(await pc.$('.modal #pcNaoLembro')) && /Ele só pode ser trocado/.test(await janelas(pc)), 'A5. depois do código antigo: sem "Não lembro" e com a frase');
    await pc.click('.modal:has(#pcPin) [data-x]'); await esperar(pc, () => !document.querySelector('.modal #pcPin'), null, 10000); await espere(800);
    /* (4) a digital em todos os aparelhos (a chave pessoal chega como "passkey") */
    await pc.evaluate(async (codigo) => { closeModals(); const ap = await Sol.apRegistrar('passkey'); const pv = await Cofre.privadaPeloCodigo(codigo); Aparelhos.receber({ tipo: 'pessoal', sk: pv.pkcs8 }, ap, 'passkey'); }, PESSOAS[ANA].codigo);
    const dPk = await esperarJanela(pc, /Digite o PIN da sua conta/, 30000);
    conferir(dPk && !(await pc.$('.modal #pcNaoLembro')) && /Ele só pode ser trocado/.test(await janelas(pc)), 'A5. depois da digital em todos os aparelhos: sem "Não lembro" e com a frase');
    await pc.evaluate(() => { S.lang = 'en'; closeModals(); TelaConta.primeiraVez({ esqueci: true }); }); await esperarJanela(pc, /Open without the PIN/, 10000);
    conferir(/approve with your fingerprint/.test(await janelas(pc)), 'A1. "Abrir sem o PIN" em inglês');
    await pc.evaluate(() => { closeModals(); S.lang = 'pt'; });
  });

  const sujos = lixos.filter((l) => l.erros.length || l.nativos.length || l.fora.some((u) => /supabase/i.test(u)));
  conferir(!sujos.length, 'sem erro de script, sem diálogo nativo e nada fora do banco de mentira' + (sujos.length ? ': ' + sujos.map((l) => l.erros.concat(l.nativos).join(' | ')).join(' || ') : ''));
  conferir(!lixos.some((l) => l.console.some((t) => [PIN_A, PIN_B, PIN_C, PIN_CONTA, PIN_NOVO].some((x) => t.includes(x)))), 'nenhum PIN no console');
  await terminar(falhas, browser, 'revisão final 2.26.0 (G1, A1, F1, G2, A2, A3, F2, G3, A4, A5)');
})().catch((e) => { console.error(e); process.exit(1); });
