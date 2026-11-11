/* Ajudantes dos testes de nuvem do OmniLifeONE (2.26.0). Cada aparelho é um contexto do navegador (IndexedDB e
   localStorage separados) que fala com o MESMO banco de mentira (teste/mock-sol.js, no processo do Node). Tudo que não é
   o site local nem o banco de mentira é cortado (route.abort) e anotado em lixo.fora: nada sai para a internet e o
   Supabase de verdade nunca é chamado. Só valores de mentira. */
const http = require('http'), fs = require('fs'), path = require('path');
const { SB, supabase, PESSOAS } = require('./mock-sol');
const VP = { celular: { width: 390, height: 844 }, computador: { width: 1280, height: 800 } };
const TIPOS = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8', '.css': 'text/css', '.png': 'image/png', '.svg': 'image/svg+xml', '.webmanifest': 'application/manifest+json' };

/* servidor de arquivos só leitura (o Omni ou o MoneyTRIO) em localhost, numa porta livre: o WebAuthn exige localhost */
function servir(raiz) {
  raiz = path.resolve(raiz);
  const s = http.createServer((req, res) => {
    let f = path.normalize(decodeURIComponent(req.url.split('?')[0])).replace(/^(\.\.[/\\])+/, '');
    if (f.endsWith(path.sep) || f === '.') f = path.join(f, 'index.html');
    const arq = path.join(raiz, f);
    if (!arq.startsWith(raiz)) { res.writeHead(403); return res.end(); }
    fs.readFile(arq, (e, d) => {
      if (e) { res.writeHead(404); return res.end(); }
      res.writeHead(200, { 'Content-Type': TIPOS[path.extname(arq)] || 'application/octet-stream', 'Cache-Control': 'no-store' }); res.end(d);
    });
  });
  return new Promise((ok) => s.listen(0, () => ok({ base: 'http://localhost:' + s.address().port, fechar: () => new Promise((f) => s.close(f)) })));
}

/* um aparelho: op = { nome, vp: "celular" | "computador" | {width, height}, base, digital, anuncio }
   digital: autenticador virtual com digital e PRF (como um celular com leitor). Sem "anuncio", o anúncio de entrada não abre.
   Devolve { ctx, p, lixo: { erros (pageerror), nativos (alert/confirm/prompt), fora (endereços cortados), console (o texto de
   cada mensagem do console, para conferir que nenhum PIN ou segredo vai para lá) }, cdp, autenticador }. */
async function aparelho(browser, op) {
  op = op || {};
  const vp = typeof op.vp === 'object' ? op.vp : VP[op.vp || 'celular'], base = op.base;
  const ctx = await browser.newContext({ viewport: vp, hasTouch: vp.width < 600, serviceWorkers: 'block', locale: 'pt-BR' });
  const lixo = { erros: [], nativos: [], fora: [], console: [] };
  await ctx.route('**/*', (route) => {
    const u = route.request().url();
    if (u.startsWith(SB + '/')) return supabase(route);
    if (u === base || u.startsWith(base + '/')) return route.continue();
    lixo.fora.push(u); return route.abort();
  });
  if (!op.anuncio) await ctx.addInitScript(() => { try { sessionStorage.setItem('omnilife.pop.depois', String(Date.now())); sessionStorage.setItem('omnilife.pop.antes', '1'); } catch (e) {} });
  const p = await ctx.newPage();
  p.base = base; p.nome = op.nome || 'aparelho';
  p.on('pageerror', (e) => { lixo.erros.push(String(e && e.message || e)); console.log('  [' + p.nome + ' pageerror] ' + (e && e.message || e)); });
  p.on('dialog', (d) => { lixo.nativos.push(d.type() + ': ' + d.message()); d.dismiss().catch(() => {}); });
  p.on('console', (m) => lixo.console.push(m.text()));
  let cdp = null, autenticador = null;
  if (op.digital) {
    cdp = await ctx.newCDPSession(p);
    await cdp.send('WebAuthn.enable');
    autenticador = (await cdp.send('WebAuthn.addVirtualAuthenticator', { options: { protocol: 'ctap2', transport: 'internal', hasResidentKey: true, hasUserVerification: true,
      isUserVerified: true, hasPrf: true, automaticPresenceSimulation: true } })).authenticatorId;
  }
  return { ctx, p, lixo, cdp, autenticador };
}

/* entra no OmniLifeONE pela tela de entrar (E-mail e senha → janela da conta #cem/#cpw/#cin) e espera a família abrir.
   Já conectado neste aparelho: só espera a família. */
async function entrarOmni(p, uid) {
  await p.goto(p.base + '/index.html');
  await p.waitForFunction(() => typeof S !== 'undefined' && typeof Conta !== 'undefined' && window.SolverJanela && ((S.booted && S.family) || S.gate === 'welcome'), null, { timeout: 20000 });
  if (await p.evaluate(() => !S.booted)) {
    await p.click('[data-act="conta.email"]');
    await p.waitForSelector('#cem', { timeout: 10000 });
    await p.fill('#cem', PESSOAS[uid].email); await p.fill('#cpw', PESSOAS[uid].senha); await p.click('#cin');
  }
  await p.waitForFunction((u) => S.booted && S.mode === 'cloud' && S.family && S.user && S.user.uid === u, uid, { timeout: 30000 });
}
/* entra no MoneyTRIO (#nvEm/#nvPw/#nvIn) e espera sair da tela de entrar; o que vem depois cada teste confere */
async function entrarMoney(p, uid) {
  await p.goto(p.base + '/');
  await p.waitForSelector('#nvEm', { timeout: 20000 });
  await p.fill('#nvEm', PESSOAS[uid].email); await p.fill('#nvPw', PESSOAS[uid].senha); await p.click('#nvIn');
  await p.waitForSelector('#nvEm', { state: 'detached', timeout: 30000 });
}
/* Casa → Senhas da casa. Na primeira vez o passo a passo (GuiaCofre) abre sozinho: com fecharGuia (padrão) ele é fechado.
   Devolve { status: Cofre.status, guia: abriu o passo a passo?, texto: o que a tela mostra } */
async function senhasDaCasa(p, op) {
  op = Object.assign({ fecharGuia: true }, op);
  await p.evaluate(() => go('house', 'vault'));
  await p.waitForFunction(() => S.route && S.route.tab === 'house' && S.route.sub === 'vault' && Cofre.status && Cofre.status.fase && document.querySelector('#screen .card'), null, { timeout: 15000 });
  const guia = await p.waitForSelector('.modal #gbody', { timeout: 1500 }).then(() => true, () => false);
  if (guia && op.fecharGuia) { await p.click('.modal:has(#gbody) [data-x]'); await p.waitForSelector('.modal #gbody', { state: 'detached', timeout: 5000 }); }
  const r = await p.evaluate(() => ({ status: JSON.parse(JSON.stringify(Cofre.status)), texto: document.querySelector('#screen').innerText }));
  return Object.assign(r, { guia });
}
/* liga ou desliga a internet deste aparelho (navigator.onLine e os eventos online/offline) */
const semRede = (ctx, sim) => ctx.setOffline(!!sim);

/* o cadeado como a 2.25 gravava (o "Usar neste …" com o código do papel e um PIN só deste aparelho): chave pessoal e a da
   família, SEM lugar na lista da conta e sem o PIN da conta. Esse caminho saiu do app na 2.26.0 (o código antigo agora entra
   como "kit", na lista); os aparelhos que já existem continuam assim, e os testes da mudança para o PIN da conta partem dele.
   Feito com as peças do próprio Cofre, na mesma ordem da 2.25: o cadeado, a família aberta e o PIN das chaves de IA junto.
   digital: liga a digital das Senhas da casa no fim (autenticador virtual), como a oferta da 2.25 fazia. */
async function cadeado225(p, uid, pin, digital) {
  await p.evaluate(async (a) => {
    const pv = await Cofre.privadaPeloCodigo(a.codigo); if (!pv) throw new Error('cadeado225: o código não abriu');
    const r = await Cofre.buscarMinha(await Cofre.importarSk(pv.pkcs8)); if (!r) throw new Error('cadeado225: a família não liberou');
    const dukRaw = Cofre.rnd(32), duk = await Cofre.aes(dukRaw), sal = b64FromBuf(Cofre.rnd(16));
    const L = { v: 1, uid: Conta.uid(), pin: Object.assign({ sal, iter: COFRE_ITER }, await Cofre.cifrar(await Cofre.kdf(a.pin, sal, COFRE_ITER), dukRaw)), prf: null,
      sk: await Cofre.cifrar(duk, pv.pkcs8), fam: { [S.family.id]: Object.assign({ kv: r.kv, fk: r.fk }, await Cofre.cifrar(duk, r.raw)) }, erros: 0, ate: 0, bloqueado: false };
    await Cofre.mudarLocal(null, () => L);
    Cofre.dukRaw = dukRaw; await Cofre.usarChave(r.raw, r.kv, r.fk);
    if (SolverCofre.aberto()) await SolverCofre.trancar();
    if (SolverCofre.pessoas().includes(Conta.uid())) await PinUnico.trocou(a.pin); else PinUnico.junto(a.pin);
    if (a.digital) await Cofre.ligarDigital(true);
    await Cofre.atualizar(); render();
  }, { codigo: PESSOAS[uid].codigo, pin, digital: !!digital });
  if (digital) await p.waitForFunction(async () => !!((await Cofre.local()) || {}).prf, null, { timeout: 20000 });
}

module.exports = { VP, servir, aparelho, entrarOmni, entrarMoney, senhasDaCasa, semRede, cadeado225 };
