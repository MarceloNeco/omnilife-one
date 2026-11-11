/* "Sair" de verdade no OmniLifeONE (2.26.0, etapa 7) — todos os caminhos de sair passam pelo Saida.
   No "Supabase de mentira" (teste/mock-sol.js): nada vai para a internet nem para o Supabase de verdade. Confere:
     D1  nuvem: 👤 → "Sair" → tela de entrar SEM "Continuar como"; a sessão sai do aparelho; o banco recebeu o logout e o registro
         de acesso "logout"; nenhum dado, aba, janela, faixa nem janela do cofre das chaves de IA (G3) na tela de entrar
     D1b o "Sair" espera a resposta do logout no servidor antes de recarregar (K8: o mock responde com atraso)
     K28 durante o "Saindo…" o cabeçalho e a memória já estão vazios (nem o nome da pessoa nem o da família)
     D2  depois de sair: recarregar e o Voltar (uma e duas vezes) continuam na tela de entrar, sem dado
     D3  ⚙ → Geral → "Sair", o "Sair da conta" do cartão da conta e o "Sair da conta" da trava da digital (a digital continua ligada)
     K27 sem conta (sessão apagada em outro lugar): o Cloud.poll sai de verdade; e o "Sair" numa aba chega à outra (D9)
     K29 a página que volta da memória do navegador (pageshow persisted): na nuvem sem conta recarrega; no "só neste aparelho", não
     D4  saídas automáticas com uma janela aberta — aparelho tirado da conta, tirado da família, sessão recusada: a janela fecha, a
         tela de entrar mostra o motivo, o cadeado sai (quando é para apagar) e os dados da família neste aparelho (IDB nuvem) ficam
     A10b depois de tirado, entrar de novo no mesmo navegador: fica conectado e vê "Primeira vez" (sem sair em laço — K7)
     D5  "não sou mais membro": a família some, as janelas fecham e a conta continua ("Continuar como")
     D6  "só neste aparelho": voltar de outra página não recarrega; "Sair" → tela de entrar; recarregar e Voltar continuam nela; os
         dados locais (IDB docs) ficam
     D7  com mudanças na fila: "Sair" pergunta antes; "Cancelar" não sai; a fila fica guardada
     D8  visitante e anunciante: "Entrar"/"Sair" como antes (não tiram a conta conectada, não recarregam — K26)
     D9  duas abas: "Sair" numa → a outra cai na tela de entrar em menos de 2 s
     D7b com um trabalho no Fundo: a pergunta diz qual trabalho para; confirmando, ele para e a página vai para a tela de entrar sem o
         aviso do navegador ("sair do site?") por cima — nada preso em "Saindo…" (revisão 2.26.0)
     D10 antes de entrar na família (tela "Quase lá!"): o 👤 "Entrar" volta à tela de entrar como antes e a espera para (aprovado depois,
         nada abre por trás); o "Sair" das 4 telas antes da família sai da conta de verdade (revisão 2.26.0)
     D11 "Tirar este aparelho da conta": confirma, sai, apaga daqui o cadeado e as chaves de IA, tira das duas listas, fica no histórico
     D12 conta encerrada: tela de entrar com o aviso inteiro; o cadeado e as chaves de IA saem; os dados da família ficam
     sem erro de script, sem diálogo nativo, nada fora do banco de mentira, nenhum PIN no console
   Pessoas, senhas, PINs e chaves de mentira. Uso: node teste/rodar.js   ·   sozinho: BASE=http://localhost:8099 node teste/sair-omni.js */
const { BASE, criarConferir, iniciar, terminar } = require('./_base');
const { M, db, rpcs, prepararChaves, ANA, BIA, GID } = require('./mock-sol');
const { aparelho, entrarOmni, senhasDaCasa, cadeado225 } = require('./_nuvem');

const PIN_A = '736251';
const CHAVE = 'mentira-groq-0123456789';   /* chave de IA de mentira */
const espere = (ms) => new Promise((r) => setTimeout(r, ms));
const toasts = (p) => p.evaluate(() => document.querySelector('#toasts').textContent);
const naTela = (p, sel) => p.evaluate((s) => !!document.querySelector(s), sel);
const linhasDe = (uid) => db.sol_aparelhos.filter((a) => a.user_id === uid && !a.removido_em);
/* o "Olá" e as dicas do AssistONE abrem sozinhos e cobririam os botões; o passo a passo das Senhas da casa também */
const quieto = (p) => p.evaluate(() => { AOne.save({ hello: 1, tour: 1, tips: Object.assign({}, AOne.cfg().tips, { home: 1, settings: 1, house: 1, family: 1 }) }); if (AOne.view) AOne.close(); lsSet(GuiaCofre.K, Date.now()); });
/* na tela de entrar, depois de a página recarregar */
const naEntrada = (p, ms) => p.waitForFunction(() => typeof S !== 'undefined' && S.gate === 'welcome' && !!document.querySelector('#screen .gate'), null, { timeout: ms || 25000 }).then(() => true, () => false);
const continuarComo = (p) => naTela(p, '[data-act="conta.continuar"]');
const dadosDaFamilia = (p) => p.evaluate(() => /Família Teste|Ana Teste|Bia Teste/.test(document.body.innerText) || !!document.querySelector('#tabs button, #bottombar button'));
const nuvemDaFamilia = (p) => p.evaluate(async (g) => (await IDB.entries('nuvem')).filter(([k]) => k.startsWith(g + '|') && !k.includes('|vault|')).length, GID);
/* marca a página: se ela recarregar, a marca some */
const marcar = (p) => p.evaluate(() => { window.__marca = 1; });
const marcada = (p) => p.evaluate(() => window.__marca === 1).catch(() => false);
/* o 👤 → "Sair" (vermelho) ou "Entrar" (visitante) */
async function menu(p, cls) { await p.click('#whoami'); await p.waitForSelector('.whomenu button.' + cls, { timeout: 8000 }); await p.click('.whomenu button.' + cls); }
/* fotografa o "Saindo…" (K28): no instante em que a tela vira "Saindo…", o cabeçalho, a memória e as janelas */
const saindo = {};
async function vigiarSaindo(p) {
  await p.evaluate(() => {
    const ob = new MutationObserver(() => {
      const sc = document.querySelector('#screen'); if (!sc || !/Saindo/.test(sc.textContent)) return;
      ob.disconnect();
      window.__saindo({ nome: document.querySelector('#whonm').textContent, corpo: document.body.innerText, abas: document.querySelector('#tabs').innerHTML + document.querySelector('#bottombar').innerHTML,
        meId: S.meId, fam: !!S.family, user: !!S.user, dados: Object.keys(S.data).length, modais: document.querySelectorAll('.modal').length, faixa: !!document.querySelector('#apFaixa, #apAviso'), t: Date.now() });
    });
    ob.observe(document.querySelector('#screen'), { childList: true, subtree: true, characterData: true });
  });
}
/* um aparelho da pessoa, já dentro da família (e, com cadeado, com as Senhas da casa abertas, na lista da conta e uma chave de IA) */
async function preparar(browser, lixos, nome, uid, op) {
  op = op || {};
  const A = await aparelho(browser, { nome, vp: op.vp || 'celular', base: BASE }); lixos.push(A.lixo);
  const p = A.p; p.navs = [];
  await p.exposeFunction('__saindo', (o) => { saindo[nome] = o; });
  p.on('request', (r) => { if (r.isNavigationRequest() && r.frame() === p.mainFrame()) p.navs.push(Date.now()); });
  await entrarOmni(p, uid); await quieto(p);
  if (op.cadeado) {
    /* o cadeado como a 2.25 gravava (código do papel + PIN deste aparelho), depois a lista da conta e uma chave de IA da pessoa */
    await p.evaluate(() => { Sol.ligadoAp = false; Sol.ligadoPin = false; });
    await senhasDaCasa(p);
    await cadeado225(p, uid, PIN_A);
    await p.waitForFunction(() => Cofre.status && Cofre.status.fase === 'aberto' && !document.querySelector('.modal'), null, { timeout: 20000 });
    await p.evaluate(() => { Sol.ligadoAp = null; Sol.ligadoPin = null; });
    await p.evaluate(() => Aparelhos.registrar());
    const salvando = p.evaluate((c) => Keys.set('groq', c, { pt: 'teste', en: 'test' }).then(() => 'ok', (e) => e.message), CHAVE);
    await p.waitForSelector('.modal #upin', { timeout: 8000 }); await p.fill('#upin', PIN_A); await p.click('.modal:has(#upin) [data-ok]');
    A.chave = await salvando;
  }
  return A;
}
/* o estado deste aparelho para a pessoa */
const estado = (p, uid) => p.evaluate(async (u) => ({ conta: Conta.on(), sessao: localStorage.getItem('solverone.sessao.v1'), modo: localStorage.getItem('omnilife.mode'), L: !!(await IDB.get('kv', 'cofre|' + u)),
  chaveAp: !!(await IDB.get('kv', 'chaveAp|' + u)), ia: SolverCofre.existe(), iaPessoas: SolverCofre.pessoas(), dev: localStorage.getItem('omnilife.deviceId'), modais: document.querySelectorAll('.modal').length,
  cofreJanela: !!document.querySelector('dialog#solver-cofre[open]'), faixa: !!document.querySelector('#apFaixa, #apAviso'), booted: S.booted }), uid);

(async () => {
  const browser = await iniciar();
  const { falhas, conferir } = criarConferir();
  await prepararChaves();
  const lixos = [];

  /* ================= D1, D1b, K28, D2: 👤 → "Sair" na nuvem ================= */
  console.log('D1. A Ana sai pelo 👤 → "Sair" (com as Senhas da casa abertas e uma chave de IA guardada)');
  const A = await preparar(browser, lixos, 'Ana-celular', ANA, { cadeado: true }), a = A.p;
  conferir(A.chave === 'ok' && await a.evaluate((u) => SolverCofre.pessoas().includes(u), ANA), 'preparo: as Senhas da casa abertas, este aparelho na lista da conta e uma chave de IA da Ana');
  /* algumas telas no histórico (para o Voltar ter para onde ir: cada uma uma entrada, como seguir um link do app) */
  for (const h of ['#/family', '#/settings', '#/house/vault']) { await a.evaluate((x) => { location.hash = x; }, h); await espere(400); }
  const hist = await a.evaluate(() => history.length);
  const nuvA = await nuvemDaFamilia(a);
  M.atrasoLogout = 800; M.logoutRespondido = 0;
  const n1 = M.log.length, ac1 = M.acessos.length;
  await vigiarSaindo(a);
  const t1 = Date.now();
  await menu(a, 'danger');
  const saiu1 = await naEntrada(a);
  M.atrasoLogout = 0;
  await espere(1500);   /* tempo para o cofre das chaves de IA (que pede o PIN ao abrir) aparecer, se fosse aparecer */
  const e1 = await estado(a, ANA);
  conferir(saiu1 && !(await continuarComo(a)) && !e1.conta && !e1.sessao, 'D1. "Sair" → tela de entrar sem "Continuar como"; a sessão saiu deste aparelho (solverone.sessao.v1 apagada)');
  const logout = M.log.slice(n1).find((x) => x.caminho === '/auth/v1/logout?scope=local' && x.quem === ANA);
  conferir(!!logout && M.acessos.slice(ac1).some((x) => x.uid === ANA && x.evento === 'logout'), 'D1. o banco recebeu o logout (scope=local) e o registro de acesso "logout"');
  conferir(!(await dadosDaFamilia(a)) && !e1.modais && !e1.cofreJanela && !e1.faixa && !e1.booted,
    'D1. na tela de entrar: nenhum nome da família nem da pessoa, nenhuma aba, nenhuma janela, nenhuma janela do cofre das chaves de IA (G3) e nenhuma faixa');
  conferir(e1.L && e1.ia && !e1.modo, 'D1. sair não apaga nada do aparelho: o cadeado (fechado) e as chaves de IA ficam para a próxima entrada; o modo da nuvem sai');
  const nav1 = a.navs.find((t) => t > t1);
  conferir(M.logoutRespondido > 0 && !!nav1 && nav1 >= M.logoutRespondido, 'D1b. a página só recarregou depois de o servidor responder ao logout (K8; o banco de mentira demorou 800 ms)' + (nav1 ? ' · ' + (nav1 - (M.logoutRespondido || nav1)) + ' ms depois' : ''));
  const s1 = saindo['Ana-celular'] || {};
  conferir(s1.nome === '—' && !/Família Teste|Ana Teste/.test(s1.corpo || 'Ana Teste') && !s1.abas && s1.meId === null && !s1.fam && !s1.user && !s1.dados && !s1.modais && !s1.faixa,
    'K28. no "Saindo…": o cabeçalho sem a pessoa ("—"), sem abas, sem janela, e nada da família na memória (S.meId, S.family, S.user, S.data)');
  console.log('D2. Depois de sair: recarregar e o Voltar');
  await a.reload(); const r2 = await naEntrada(a);
  conferir(r2 && !(await dadosDaFamilia(a)) && !(await continuarComo(a)), 'D2. recarregar → continua na tela de entrar, sem dado');
  await a.goBack(); const v1 = await naEntrada(a);
  conferir(v1 && !(await dadosDaFamilia(a)) && a.url().startsWith(BASE + '/index.html'), 'D2. Voltar (uma vez) → tela de entrar, sem dado (' + a.url().replace(BASE, '') + ')');
  await a.goBack(); const v2 = await naEntrada(a);
  conferir(v2 && !(await dadosDaFamilia(a)), 'D2. Voltar (duas vezes) → tela de entrar, sem dado (' + a.url().replace(BASE, '') + ')');
  conferir(hist >= 4, 'preparo: o histórico tinha telas do app para o Voltar (' + hist + ' entradas)');
  conferir(await nuvemDaFamilia(a) === nuvA && nuvA > 0, 'D1. os dados da família guardados neste aparelho (fora das Senhas da casa) continuam (' + nuvA + ')');
  await A.ctx.close();

  /* ================= D3, K27 (poll), K29 (nuvem) ================= */
  console.log('D3. Os outros "Sair": ⚙ → Geral, o cartão da conta e a trava da digital');
  const B = await preparar(browser, lixos, 'Ana-computador', ANA, { vp: 'computador' }), b = B.p;
  await b.evaluate(() => go('settings')); await b.waitForSelector('#screen [data-act="signout"]', { timeout: 10000 });
  await b.click('#screen [data-act="signout"]');
  const s3a = await naEntrada(b), e3a = await estado(b, ANA);
  conferir(s3a && !e3a.conta && !(await continuarComo(b)), 'D3. ⚙ → Geral → "🚪 Sair" sai da conta (tela de entrar sem "Continuar como")');
  await entrarOmni(b, ANA); await quieto(b);
  await b.evaluate(() => go('settings')); await b.waitForSelector('#screen [data-act="conta.sair"]', { timeout: 10000 });
  await b.click('#screen [data-act="conta.sair"]');
  const s3b = await naEntrada(b), e3b = await estado(b, ANA);
  conferir(s3b && !e3b.conta && !(await continuarComo(b)), 'D3. o "Sair da conta neste aparelho" do cartão da conta (⚙ → Geral) também sai de verdade');
  /* K27: a sessão some sem o evento desta aba (apagada por outro app, por exemplo): o Cloud.poll sai de verdade */
  await entrarOmni(b, ANA); await quieto(b);
  await b.evaluate(() => { localStorage.removeItem('solverone.sessao.v1'); Cloud._polling = false; Cloud.poll(); });
  const s27 = await naEntrada(b);
  conferir(s27 && !(await continuarComo(b)) && /Sua sessão terminou: entre de novo/.test(await toasts(b)), 'K27. sem conta, o Cloud.poll sai de verdade: tela de entrar com "Sua sessão terminou: entre de novo."');
  /* K29: a página que volta da memória do navegador depois de a conta sair recarrega (na tela de entrar) */
  await entrarOmni(b, ANA); await quieto(b); await marcar(b);
  await b.evaluate(() => { localStorage.removeItem('solverone.sessao.v1'); window.dispatchEvent(new PageTransitionEvent('pageshow', { persisted: true })); });
  const s29 = await naEntrada(b);
  conferir(s29 && !(await marcada(b)), 'K29. nuvem: a página volta da memória do navegador (pageshow persisted) sem a conta → recarrega na tela de entrar');
  /* a trava da digital ("bioLock"): "Sair da conta" sai e a digital continua ligada */
  await entrarOmni(b, ANA); await quieto(b);
  await b.evaluate(() => { lsSet(LS.webauthn, { id: 'AAAAAAAAAAAAAAAAAAAAAA==' }); S.prefs.bioLock = true; savePrefs(); });
  await b.close();
  const b2 = await B.ctx.newPage(); b2.base = BASE; b2.nome = 'Ana-computador-2';
  b2.on('pageerror', (e) => { B.lixo.erros.push(String(e && e.message || e)); console.log('  [b2 pageerror] ' + e.message); });
  b2.on('dialog', (d) => { B.lixo.nativos.push(d.type()); d.dismiss().catch(() => {}); });
  await b2.goto(BASE + '/index.html');
  const trava = await b2.waitForSelector('.lock #bo', { timeout: 20000 }).then(() => true, () => false);
  conferir(trava, 'preparo: com a digital ligada para abrir o app, a trava aparece ao abrir');
  await b2.click('.lock #bo');
  const s3c = await naEntrada(b2), e3c = await estado(b2, ANA);
  const bio = await b2.evaluate(() => (lsGet(LS.prefs, {}) || {}).bioLock === true && !!lsGet(LS.webauthn, null));
  conferir(s3c && !e3c.conta && !(await continuarComo(b2)) && bio && !(await naTela(b2, '.lock')), 'D3. a trava da digital → "Sair da conta": sai de verdade e a digital continua ligada (S.prefs.bioLock)');
  await B.ctx.close();

  /* ================= D4 + A10b: saídas automáticas com uma janela aberta ================= */
  console.log('D4. Aparelho tirado da conta em outro aparelho, com uma janela aberta');
  const C = await preparar(browser, lixos, 'Ana-tablet', ANA, { cadeado: true }), c = C.p;
  const nuvC = await nuvemDaFamilia(c);
  const devC = await c.evaluate(() => Devices.myId()), idC = await c.evaluate(() => localStorage.getItem('omnilife.deviceId'));
  const apC = await c.evaluate(async () => (await Cofre.local()).ap);
  await c.evaluate(() => modal({ title: 'Uma janela aberta', body: '<p>dados da família</p>' }));
  rpcs.sol_aparelho_tirar(ANA, { p_id: apC });
  await vigiarSaindo(c);
  await c.evaluate(() => { Aparelhos.aoAbrir(); });
  const s4a = await naEntrada(c);
  const e4a = await estado(c, ANA), t4a = await toasts(c);
  const sc4a = saindo['Ana-tablet'] || {};
  conferir(s4a && sc4a.modais === 0 && /foi tirado da sua conta em outro aparelho/.test(t4a) && !e4a.conta,
    'D4. tirado: a janela fecha, a tela de entrar diz "Este aparelho foi tirado da sua conta em outro aparelho…" e a conta sai');
  conferir(!e4a.L && !e4a.chaveAp && !e4a.ia, 'D4/D3. tirado: o cadeado, a chave do navegador e as chaves de IA (todas da Ana) saem deste aparelho');
  const rowC = db.omni_aparelhos.find((r) => r.id === devC);
  conferir(await nuvemDaFamilia(c) === nuvC && nuvC > 0 && !!rowC && rowC.desconectado === true && e4a.dev !== idC,
    'D4/K7. os dados da família neste aparelho ficam; este aparelho sai da lista da família (desconectado) e o número dele é esquecido');
  console.log('A10b. Depois de tirado, entrar de novo no mesmo navegador');
  await entrarOmni(c, ANA); await quieto(c);
  let semLaco = false;
  try {
    for (let i = 0; i < 2; i++) await c.evaluate(async () => { for (let j = 0; j < 80 && Cloud._polling; j++) await new Promise((r) => setTimeout(r, 100)); await Cloud.poll(); });
    await espere(1500);
    semLaco = await c.evaluate(() => S.booted && S.family && Conta.on() && S.gate !== 'welcome');
  } catch (e) { semLaco = false; }
  let primeira = false;
  if (semLaco) {
    const st = await senhasDaCasa(c);
    if (st.status.caso === 'primeiraVez') { await c.click('#screen [data-act="cofre.comecar"]'); primeira = await c.waitForFunction(() => [...document.querySelectorAll('.modal h3')].some((h) => /Primeira vez neste/.test(h.textContent)), null, { timeout: 10000 }).then(() => true, () => false); }
    await c.evaluate(() => closeModals());
  }
  conferir(semLaco && primeira && (await c.evaluate(() => localStorage.getItem('omnilife.deviceId'))) !== idC,
    'A10b. entrou de novo: fica conectado (o número novo deste aparelho não está desconectado — sem laço, K7) e as Senhas da casa mostram "Primeira vez neste …"');
  /* sair com um pedido de aparelho novo esperando (sem a janela da espera aberta): o pedido é recusado no banco e esquecido daqui */
  let ped10 = null;
  if (primeira) {
    await c.click('#screen [data-act="cofre.comecar"]');
    await c.waitForSelector('.modal #apOutro', { timeout: 10000 }); await c.click('.modal #apOutro');
    await c.waitForSelector('.modal #apEsperando', { timeout: 10000 });
    ped10 = db.sol_acesso_pedidos.filter((x) => x.user_id === ANA).slice(-1)[0];
    /* a página recarregou no meio da espera: a janela sumiu, mas o pedido continua aberto e o par guardado aqui */
    await c.reload(); await c.waitForFunction(() => typeof S !== 'undefined' && S.booted && S.family, null, { timeout: 20000 });
    if (!(await c.evaluate(async (u) => !!(await IDB.get('kv', 'pedido|' + u)), ANA)) || ped10.estado !== 'aberto') ped10 = null;
    await c.evaluate(() => { signOut(); });
  }
  const s10 = await naEntrada(c);
  conferir(s10 && !!ped10 && ped10.estado === 'recusado' && !(await c.evaluate(async (u) => !!(await IDB.get('kv', 'pedido|' + u)), ANA)),
    'sair com um pedido de aparelho novo esperando: o pedido é recusado no banco (quem aprova deixa de ver) e o par esquecido deste aparelho');
  await C.ctx.close();

  console.log('D4. Aparelho tirado da família por um responsável, com uma janela aberta');
  const D = await preparar(browser, lixos, 'Ana-celular-2', ANA, { cadeado: true }), d = D.p;
  const nuvD = await nuvemDaFamilia(d), devD = await d.evaluate(() => Devices.myId()), idD = await d.evaluate(() => localStorage.getItem('omnilife.deviceId'));
  const apD = await d.evaluate(async () => (await Cofre.local()).ap);
  await d.evaluate(() => { sessionStorage.setItem('omnilife.teste', '1'); sessionStorage.setItem('outro.app', '1'); modal({ title: 'Uma janela aberta', body: '<p>dados da família</p>' }); });
  const rowD = db.omni_aparelhos.find((r) => r.id === devD); rowD.desconectado = true;
  await vigiarSaindo(d);
  await d.evaluate(() => { Cloud._polling = false; Cloud.poll(); });
  const s4b = await naEntrada(d);
  const e4b = await estado(d, ANA), sc4b = saindo['Ana-celular-2'] || {};
  const ss4b = await d.evaluate(() => ({ app: sessionStorage.getItem('omnilife.teste'), outro: sessionStorage.getItem('outro.app') }));
  conferir(s4b && sc4b.modais === 0 && /Este aparelho foi tirado da família por um responsável/.test(await toasts(d)) && !e4b.conta,
    'D4. desconectado pela família: a janela fecha, a tela de entrar diz "Este aparelho foi tirado da família por um responsável." e a conta sai');
  conferir(!e4b.L && !e4b.ia && e4b.dev !== idD && !linhasDe(ANA).some((x) => x.id === apD) && await nuvemDaFamilia(d) === nuvD && nuvD > 0,
    'D4. desconectado: o cadeado e as chaves de IA saem, o número deste aparelho é esquecido (K7), ele sai também da lista da conta; os dados da família ficam');
  conferir(!ss4b.app && ss4b.outro === '1', 'D4. desconectado: saem só as chaves do OmniLifeONE desta aba (o sessionStorage de outro app fica)');
  await D.ctx.close();

  console.log('D4. Sessão recusada pelo servidor, com uma janela aberta');
  const E = await preparar(browser, lixos, 'Ana-celular-3', ANA), e = E.p;
  const nuvE = await nuvemDaFamilia(e);
  await e.evaluate(() => modal({ title: 'Uma janela aberta', body: '<p>dados da família</p>' }));
  await vigiarSaindo(e);
  await e.evaluate(() => { const s = JSON.parse(localStorage.getItem('solverone.sessao.v1')); s.refresh_token = 'r-recusado'; s.expira = 0; localStorage.setItem('solverone.sessao.v1', JSON.stringify(s)); Conta.token(); });
  const s4c = await naEntrada(e), sc4c = saindo['Ana-celular-3'] || {};
  conferir(s4c && sc4c.modais === 0 && /Sua sessão terminou: entre de novo/.test(await toasts(e)) && !(await continuarComo(e)) && await nuvemDaFamilia(e) === nuvE && nuvE > 0,
    'D4. sessão recusada: a janela fecha, a tela de entrar diz "Sua sessão terminou: entre de novo." (sem "Continuar como") e os dados da família ficam');
  await E.ctx.close();

  /* ================= D5: não sou mais membro ================= */
  console.log('D5. A Bia deixa de ser membro da família (com uma janela aberta)');
  const F = await preparar(browser, lixos, 'Bia-celular', BIA), f = F.p;
  await f.evaluate(() => modal({ title: 'Uma janela aberta', body: '<p>dados da família</p>' }));
  const memBia = db.sol_grupo_membros.find((m) => m.user_id === BIA && m.grupo_id === GID); memBia.status = 'removido';
  await marcar(f);
  await f.evaluate(() => { Cloud._polling = false; Cloud.poll(); });
  const s5 = await f.waitForFunction(() => S.gate === 'welcome', null, { timeout: 15000 }).then(() => true, () => false);
  memBia.status = 'ativo';
  const e5 = await estado(f, BIA);
  conferir(s5 && !e5.modais && e5.conta && await continuarComo(f) && !(await dadosDaFamilia(f)) && await marcada(f),
    'D5. não é mais membro: a família some da tela, a janela fecha e a conta continua ("Continuar como"), sem recarregar');
  await F.ctx.close();

  /* ================= D6: só neste aparelho ================= */
  console.log('D6. "Só neste aparelho" (sem conta)');
  const G = await aparelho(browser, { nome: 'local', vp: 'celular', base: BASE }), g = G.p; lixos.push(G.lixo);
  await g.goto(BASE + '/index.html'); await naEntrada(g);
  await g.evaluate(() => ACT['gate.local']());
  await g.waitForSelector('#fn', { timeout: 10000 });
  await g.fill('#fn', 'Família Local'); await g.fill('#mn', 'Pessoa Local'); await g.click('#go');
  await g.waitForFunction(() => S.booted && S.mode === 'local', null, { timeout: 15000 });
  await quieto(g); await g.evaluate(() => closeModals());
  const docsG = await g.evaluate(async () => (await IDB.entries('docs')).length);
  await marcar(g);
  await g.evaluate(() => window.dispatchEvent(new PageTransitionEvent('pageshow', { persisted: true })));
  await espere(1500);
  conferir(await marcada(g) && await g.evaluate(() => S.booted && S.mode === 'local'), 'D6/K29. voltar da memória do navegador (pageshow persisted) no "só neste aparelho" NÃO recarrega');
  await g.goto(BASE + '/versoes.json'); await g.goBack();
  const volta6 = await g.waitForFunction(() => typeof S !== 'undefined' && S.booted && S.mode === 'local', null, { timeout: 15000 }).then(() => true, () => false);
  conferir(volta6, 'D6. voltar de outra página: continua no "só neste aparelho", com a pessoa (não cai na tela de entrar)');
  await quieto(g);
  await g.evaluate(() => go('settings')); await espere(300); await g.evaluate(() => go('family')); await espere(300);
  await menu(g, 'danger');
  const s6 = await naEntrada(g);
  const e6 = await g.evaluate(() => ({ modo: localStorage.getItem('omnilife.mode'), me: localStorage.getItem('omnilife.local.me') }));
  conferir(s6 && !e6.modo && !e6.me && !(await g.evaluate(() => /Família Local|Pessoa Local/.test(document.body.innerText))), 'D6. "Sair" → tela de entrar (o modo e a pessoa deste aparelho não ficam lembrados)');
  await g.reload(); const r6 = await naEntrada(g);
  await g.goBack(); const v6 = await naEntrada(g);
  conferir(r6 && v6 && !(await g.evaluate(() => /Família Local|Pessoa Local/.test(document.body.innerText))), 'D6. recarregar e Voltar continuam na tela de entrar, sem dado');
  conferir(await g.evaluate(async () => (await IDB.entries('docs')).length) === docsG && docsG > 0, 'D6. os dados locais continuam guardados neste aparelho (IDB docs: ' + docsG + ')');
  /* na escolha de perfil (ainda sem entrar), o 👤 "Entrar" volta à tela de entrar como antes: a pessoa escolhida não fica lembrada */
  await g.evaluate(() => ACT['gate.local']()); await g.waitForFunction(() => S.gate === 'profiles', null, { timeout: 10000 });
  await g.evaluate(() => ACT['gate.pick']({ id: People.list('humans')[0].id })); await g.waitForFunction(() => S.booted && S.mode === 'local', null, { timeout: 10000 });
  await quieto(g); await g.evaluate(() => { closeModals(); setGate('profiles'); });
  await menu(g, 'pri');
  const s6b = await g.waitForFunction(() => S.gate === 'welcome', null, { timeout: 10000 }).then(() => true, () => false);
  conferir(s6b && !(await g.evaluate(() => localStorage.getItem('omnilife.local.me'))), 'D6. na escolha de perfil, 👤 → "Entrar" volta à tela de entrar e esquece a pessoa escolhida (como antes)');
  await G.ctx.close();

  /* ================= D7: mudanças na fila ================= */
  console.log('D7. "Sair" com mudanças que ainda não subiram');
  const H = await preparar(browser, lixos, 'Ana-fila', ANA), h = H.p;
  await h.evaluate(async () => { CloudDriver.flush = async () => {}; await DB.put('shop', { id: 'teste-d7', name: 'Pão de teste', qty: 1 }); });
  conferir(await h.waitForFunction(() => CloudDriver.fila.size > 0, null, { timeout: 5000 }).then(() => true, () => false), 'preparo: uma mudança na fila (não subiu)');
  await menu(h, 'danger');
  const perg = await h.waitForSelector('.modal [data-no]', { timeout: 8000 }).then(() => h.evaluate(() => document.querySelector('.modal').innerText), () => '');
  await h.click('.modal [data-no]'); await espere(800);
  conferir(/ainda não subiram para a nuvem/.test(perg) && await h.evaluate(() => S.booted && Conta.on() && !Saida.saindo), 'D7. "Sair" pergunta antes ("… ainda não subiram para a nuvem …"); "Cancelar" não sai');
  await menu(h, 'danger');
  await h.waitForSelector('.modal [data-yes]', { timeout: 8000 }); await h.click('.modal [data-yes]');
  const s7 = await naEntrada(h);
  const fila7 = await h.evaluate(async () => (await IDB.entries('fila')).some(([k]) => k.endsWith('|shop|teste-d7')));
  conferir(s7 && !(await h.evaluate(() => Conta.on())) && fila7, 'D7. confirmando, sai; a mudança continua guardada na fila deste aparelho (sobe quando entrar de novo)');
  await H.ctx.close();

  /* ================= D8: visitante e anunciante ================= */
  console.log('D8. Visitante e anunciante, com a conta conectada neste aparelho');
  const V = await preparar(browser, lixos, 'Ana-visitante', ANA), v = V.p;
  await v.evaluate(() => ACT['cloud.logout']()); await v.waitForFunction(() => S.gate === 'welcome', null, { timeout: 10000 });
  await v.evaluate(() => ACT['gate.visitor']()); await v.waitForFunction(() => S.booted && S.mode === 'visitor', null, { timeout: 10000 });
  await quieto(v); await v.evaluate(() => closeModals()); await marcar(v);
  await menu(v, 'pri');
  const s8a = await v.waitForFunction(() => S.gate === 'welcome', null, { timeout: 10000 }).then(() => true, () => false);
  conferir(s8a && await marcada(v) && await v.evaluate(() => Conta.on()) && await continuarComo(v), 'D8. visitante: 👤 → "Entrar" volta à tela de entrar sem recarregar e sem tirar a conta conectada ("Continuar como")');
  await v.evaluate(() => ACT['gate.advertiser']()); await v.waitForFunction(() => S.booted && S.mode === 'advertiser', null, { timeout: 10000 });
  await v.evaluate(() => closeModals()); await marcar(v);
  await menu(v, 'danger');
  const s8b = await v.waitForFunction(() => S.gate === 'welcome', null, { timeout: 10000 }).then(() => true, () => false);
  conferir(s8b && await marcada(v) && await v.evaluate(() => Conta.on()), 'D8. anunciante: 👤 → "Sair" como antes (sem recarregar e sem tirar a conta)');
  /* a tela de entrar com a conta conectada: o "Sair da conta" de lá sai de verdade */
  await v.click('#screen .gate [data-act="conta.sair"]');
  const s8c = await naEntrada(v); await espere(500);
  conferir(s8c && !(await v.evaluate(() => Conta.on())) && !(await continuarComo(v)), 'D8. na tela de entrar, "Sair da conta" tira a conta deste aparelho (sem "Continuar como" depois)');
  await V.ctx.close();

  /* ================= D9: duas abas ================= */
  console.log('D9. Duas abas no mesmo navegador: "Sair" numa');
  const W = await preparar(browser, lixos, 'Ana-aba1', ANA, { vp: 'computador' }), w1 = W.p;
  const w2 = await W.ctx.newPage(); w2.base = BASE; w2.nome = 'Ana-aba2';
  w2.on('pageerror', (e) => { W.lixo.erros.push(String(e && e.message || e)); console.log('  [aba2 pageerror] ' + e.message); });
  w2.on('dialog', (x) => { W.lixo.nativos.push(x.type()); x.dismiss().catch(() => {}); });
  await entrarOmni(w2, ANA); await quieto(w2);
  await menu(w1, 'danger');
  const s9a = await naEntrada(w1);
  const s9b = await naEntrada(w2, 2000);
  conferir(s9a && s9b && !(await dadosDaFamilia(w2)) && !(await continuarComo(w2)), 'D9. "Sair" numa aba: a outra cai na tela de entrar em menos de 2 s (K27), sem dado e sem "Continuar como"');
  await W.ctx.close();

  /* ================= D7b: trabalho no Fundo (revisão 2.26.0) ================= */
  console.log('D7b. "Sair" com um trabalho em andamento (Fundo)');
  const K = await preparar(browser, lixos, 'Ana-fundo', ANA), k = K.p;
  await k.evaluate(() => { DGO.fundo.iniciar({ tipo: 'ocr', titulo: 'Lendo o comprovante de teste', executar: () => new Promise(() => {}), podeCancelar: true }).catch((e) => { if (e && e.cancelado) sessionStorage.setItem('teste.cancelou', '1'); }); });
  conferir(await k.evaluate(() => DGO.fundo.ativas().length === 1), 'preparo: um trabalho rodando no Fundo');
  await menu(k, 'danger');
  const perg7b = await k.waitForSelector('.modal [data-yes]', { timeout: 8000 }).then(() => k.evaluate(() => document.querySelector('.modal').innerText), () => '');
  conferir(/Ainda há trabalho em andamento \(Lendo o comprovante de teste\)/.test(perg7b), 'D7b. "Sair" pergunta antes e diz qual trabalho vai parar ("Ainda há trabalho em andamento (Lendo o comprovante de teste)…")');
  await k.click('.modal [data-yes]');
  const s7b = await naEntrada(k, 15000);
  conferir(s7b && !K.lixo.nativos.length && await k.evaluate(() => sessionStorage.getItem('teste.cancelou') === '1') && !(await k.evaluate(() => Conta.on())),
    'D7b. confirmando, o trabalho para e a página vai para a tela de entrar, sem o aviso do navegador ("sair do site?") por cima — nada preso em "Saindo…"' + (K.lixo.nativos.length ? ' (' + K.lixo.nativos.join(', ') + ')' : ''));
  await K.ctx.close();

  /* ================= D10: antes de entrar na família (as telas de entrada da nuvem) ================= */
  console.log('D10. Na tela "Quase lá!" (pedido de entrada esperando): o 👤 "Entrar" e o "Sair"');
  const P = await preparar(browser, lixos, 'Ana-portao', ANA), q = P.p;
  /* a tela de quem abriu um convite e espera a aprovação (a espera pergunta ao banco a cada 5 s) */
  const pedE = { grupo_id: GID, user_id: ANA, status: 'pendente', aprovacoes: {}, convidado_por_nome: 'Bia Teste' };
  db.omni_pedidos_entrada.push(pedE);
  const quaseLa = async () => { await q.evaluate((gid) => { Cloud.logout(); S.data = {}; S.mode = 'cloud'; Cloud.setUser(); Cloud.waitApproval(gid, 'Família Teste'); }, GID); return q.waitForFunction(() => S.gate === 'waiting' && !!Cloud.waitT && !!document.querySelector('#screen .gate'), null, { timeout: 8000 }).then(() => true, () => false); };
  conferir(await quaseLa(), 'preparo: a tela "Quase lá!" com a espera da aprovação');
  await marcar(q);
  await menu(q, 'pri');
  const e10 = await q.waitForFunction(() => S.gate === 'welcome', null, { timeout: 8000 }).then(() => true, () => false);
  const w10 = await q.evaluate(() => !!Cloud.waitT);
  pedE.status = 'aprovado';
  await espere(6500);
  const abriu10 = await q.evaluate(() => S.booted || S.gate !== 'welcome');
  pedE.status = 'pendente';
  conferir(e10 && !w10 && !abriu10 && await marcada(q) && await continuarComo(q),
    'D10. 👤 → "Entrar" na tela "Quase lá!": volta à tela de entrar como antes (a conta continua) e a espera para — aprovado depois, a família não abre sozinha por trás');
  const portoes = await q.evaluate(() => ['create', 'waiting', 'invbad', 'offline'].map((g) => GATES[g].html(g === 'waiting' ? { name: 'x' } : g === 'invbad' ? 'expired' : null)).join(''));
  conferir(!/data-act="cloud\.logout"/.test(portoes) && (portoes.match(/data-act="conta\.sair"/g) || []).length === 4,
    'D10. o "Sair" das 4 telas antes da família (criar família, "Quase lá!", convite que não vale, sem conexão) é o "Sair" de verdade');
  conferir(await quaseLa(), 'preparo: de novo a tela "Quase lá!"');
  await q.click('#screen .gate button:text-is("Sair")');
  const s10b = await naEntrada(q);
  await espere(800);
  conferir(s10b && !(await q.evaluate(() => Conta.on())) && !(await continuarComo(q)) && !(await q.evaluate(() => !!Cloud.waitT)),
    'D10. "Sair" na tela "Quase lá!" sai da conta de verdade (tela de entrar sem "Continuar como")');
  db.omni_pedidos_entrada.splice(db.omni_pedidos_entrada.indexOf(pedE), 1);
  await P.ctx.close();

  /* ================= D11: "Tirar este aparelho da conta" ================= */
  console.log('D11. "Tirar este aparelho da conta" (Casa → Senhas da casa → Opções)');
  const R = await preparar(browser, lixos, 'Ana-tirar', ANA, { cadeado: true }), t = R.p;
  const nuvR = await nuvemDaFamilia(t), devR = await t.evaluate(() => Devices.myId()), idR = await t.evaluate(() => localStorage.getItem('omnilife.deviceId'));
  const apR = await t.evaluate(async () => (await Cofre.local()).ap), h11 = db.omni_historico.length;
  await t.evaluate(() => go('house', 'vault'));
  await t.waitForSelector('#screen details:has([data-act="cofre.desconectar"]) summary', { timeout: 10000 });
  await t.click('#screen details:has([data-act="cofre.desconectar"]) summary'); await t.click('#screen [data-act="cofre.desconectar"]');
  const perg11 = await t.waitForSelector('.modal [data-yes]', { timeout: 8000 }).then(() => t.evaluate(() => document.querySelector('.modal').innerText), () => '');
  await t.click('.modal [data-yes]');
  const s11 = await naEntrada(t), e11 = await estado(t, ANA), rowR = db.omni_aparelhos.find((r) => r.id === devR);
  conferir(/Tirar este .* da conta\?/.test(perg11) && s11 && /Pronto: este .* saiu da conta/.test(await toasts(t)) && !e11.conta && !(await continuarComo(t)),
    'D11. confirma antes; depois, tela de entrar com "✓ Pronto: este … saiu da conta." (sem "Continuar como")');
  conferir(!e11.L && !e11.chaveAp && !e11.ia && e11.dev !== idR && !linhasDe(ANA).some((x) => x.id === apR) && !!rowR && rowR.desconectado === true,
    'D11. o cadeado e as chaves de IA (todas da Ana) saem; este aparelho sai da lista da conta e da família, e o número dele é esquecido (K7)');
  conferir(db.omni_historico.slice(h11).some((x) => x.acao === 'aparelho.tirado') && await nuvemDaFamilia(t) === nuvR && nuvR > 0, 'D11. fica no histórico da família ("aparelho.tirado"); os dados da família neste aparelho ficam');
  await R.ctx.close();

  /* ================= D12: conta encerrada ================= */
  console.log('D12. A conta foi encerrada (o servidor diz ao conferir a sessão), com uma janela aberta');
  const X = await preparar(browser, lixos, 'Ana-encerrada', ANA, { cadeado: true }), x = X.p;
  const nuvX = await nuvemDaFamilia(x), encerrada0 = rpcs.minha_conta_encerrada;
  await x.evaluate(() => modal({ title: 'Uma janela aberta', body: '<p>dados da família</p>' }));
  rpcs.minha_conta_encerrada = () => true;
  await x.evaluate(() => { Conta._revalidando = false; Conta.revalidar(); });
  const s12 = await naEntrada(x);
  rpcs.minha_conta_encerrada = encerrada0;
  const e12 = await estado(x, ANA);
  const aviso12 = await x.waitForFunction(() => [...document.querySelectorAll('.modal h3')].some((h) => /Sua conta SolverONE foi encerrada/.test(h.textContent)), null, { timeout: 8000 }).then(() => x.evaluate(() => document.querySelector('.modal').innerText), () => '');
  conferir(s12 && /Sua conta SolverONE foi encerrada/.test(aviso12) && /privacidade@/.test(aviso12) && !e12.conta && !(await continuarComo(x)),
    'D12. encerrada: tela de entrar com o aviso inteiro ("Sua conta SolverONE foi encerrada", com o contato) e a conta saiu deste aparelho');
  conferir(!e12.L && !e12.chaveAp && !e12.ia && await nuvemDaFamilia(x) === nuvX && nuvX > 0, 'D12. encerrada: o cadeado e as chaves de IA saem deste aparelho; os dados da família ficam');
  await X.ctx.close();

  /* ================= limpeza ================= */
  const sujos = lixos.filter((l) => l.erros.length || l.nativos.length || l.fora.some((u) => /supabase/i.test(u)));
  conferir(!sujos.length, 'sem erro de script, sem diálogo nativo e nada fora do banco de mentira' + (sujos.length ? ': ' + sujos.map((l) => l.erros.concat(l.nativos).join(' | ')).join(' || ') : ''));
  conferir(!lixos.some((l) => l.console.some((t) => t.includes(PIN_A) || t.includes(CHAVE))), 'nenhum PIN nem chave de IA no console');
  await terminar(falhas, browser, 'o "Sair" de verdade: todos os caminhos.');
})().catch((e) => { console.error(e); process.exit(1); });
