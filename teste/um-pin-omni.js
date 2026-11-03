/* Teste automático: "um PIN só" no OmniLifeONE (decisão do dono, 03/Nov/2026).
   O cofre comum de chaves (cofre.js 1.4.1) abre com o PIN das Senhas da casa (no modo "só neste aparelho", com a senha
   principal); a digital da casa abre tudo; a janela própria do cofre.js não aparece na entrada.
     - entrada sem janela (abrir, recarregar, outra página e voltar, esconder e mostrar), no celular e no computador,
       visitante, "só neste aparelho" e nuvem simulada; o desvio já existe antes do diretrizes.js; corrida no F5
     - modo local: criar com a senha principal, janela "Confirme que é você", esperas da senha principal (a digital passa),
       PIN antigo (outro app), "Não lembro", pausa do cofre de chaves, duas pessoas no mesmo navegador, sair tranca
     - nuvem simulada sem rede: PIN e digital (PRF de mentira) abrem casa e chaves; casa aberta = chave sem janela;
       "Mostrar a chave guardada" pede sempre (digital só depois do toque); PIN errado e bloqueio; digital ligada antes;
       trocar o PIN; "aguardando"; sair tranca
     - revisão: "Esqueci o PIN" sem código não mexe nas chaves; "Mostrar a chave" não pega carona; trocar o PIN pede o atual;
       digital à vista de verdade; digital antiga das chaves no passo "PIN antigo"; textos da senha principal no modo local;
       🚗 e tela de IA sem Senhas da casa; "Trancar o cofre agora" com a casa aberta
     - nada em claro (localStorage, sessionStorage, preferências e IndexedDB "kv"); nenhuma janela nativa nem erro de script
   Só valores de mentira (PIN, senha e chaves inventados): nenhuma chave, token ou senha de verdade.
   Uso: node teste/rodar.js   (ou, com um servidor no ar: BASE=http://localhost:8098 node teste/um-pin-omni.js) */
const fs = require('fs'), path = require('path');
const { criarConferir, abrirApp, iniciar, terminar, VP } = require('./_base');
const { falhas, conferir } = criarConferir();

const SENHA = 'senha-de-mentira-123', PIN = '582913', PIN2 = '642819', PIN3 = '731846', PIN_INTRUSO = '479135', ANTIGO = 'outro-pin-de-mentira';
const GEM = 'mentira-gemini-0123456789', GROQ_MT = 'mentira-groq-mt-0123456789';
const lixoTodo = { nativos: [], erros: [] };
const juntar = (l) => { lixoTodo.nativos.push(...l.nativos); lixoTodo.erros.push(...l.erros); };

/* chaves de mentira em texto aberto: a do OmniLifeONE (investifyme.chaves.v1) e a do MoneyTRIO (dgo:global:ia, que fica de propósito) */
function semear(c) {
  try {
    if (localStorage.getItem('__semeado')) return;
    localStorage.setItem('__semeado', '1');
    localStorage.setItem('investifyme.chaves.v1', JSON.stringify({ cifrado: false, chaves: { gemini: c.gem } }));
    localStorage.setItem('dgo:global:ia', JSON.stringify({ provedor: 'groq', chaves: { groq: c.groq } }));
  } catch (e) {}
}
/* anota toda janela de PIN que aparecer (a do cofre.js e a do app) e se o desvio já existe quando o diretrizes.js chega */
function vigiar() {
  window.__janelas = []; window.__desvioAntes = null;
  new MutationObserver((ms) => ms.forEach((m) => {
    m.addedNodes.forEach((n) => {
      if (n.nodeType !== 1) return;
      if (n.tagName === 'SCRIPT' && /diretrizes\.js$/.test(n.src || '') && window.__desvioAntes === null) window.__desvioAntes = !!(window.SolverCofre && window.SolverCofre.__omniUmPin);
      if ((n.matches && n.matches('#solver-cofre, .omni-chaves')) || (n.querySelector && n.querySelector('#solver-cofre, .omni-chaves'))) window.__janelas.push((n.querySelector && n.querySelector('.omni-chaves')) || (n.matches && n.matches('.omni-chaves')) ? 'omni-chaves' : 'solver-cofre');
    });
  })).observe(document, { childList: true, subtree: true });
  document.addEventListener('DOMContentLoaded', () => { window.__desvioNoDom = !!(window.SolverCofre && window.SolverCofre.__omniUmPin); });
}
const novoCtx = async (browser, nome, sem) => {
  const ctx = await browser.newContext({ viewport: VP[nome], hasTouch: nome === 'celular', serviceWorkers: 'block', locale: 'pt-BR' });
  if (sem !== false) await ctx.addInitScript(semear, { gem: GEM, groq: GROQ_MT });
  await ctx.addInitScript(vigiar);
  return ctx;
};
async function entrarLocal(p) {
  await p.evaluate(() => ACT['gate.local']());
  await p.waitForSelector('#fn', { timeout: 10000 });
  await p.fill('#fn', 'Familia Teste'); await p.fill('#mn', 'Pessoa Teste'); await p.click('#go');
  await p.waitForFunction(() => S.booted, null, { timeout: 15000 }); await p.waitForTimeout(600);
  await p.evaluate(() => { document.querySelectorAll('dialog[open]').forEach((d) => { try { d.close(); } catch (e) {} }); window.__janelas = []; });
}
const pronto = (p) => p.waitForFunction(() => typeof S !== 'undefined' && typeof ACT !== 'undefined' && window.SolverJanela, null, { timeout: 15000 });
/* espera 2,5 s e confere: nenhuma janela de PIN apareceu e as chaves estão trancadas */
const semJanela = async (p, msg) => {
  await p.waitForTimeout(2500);
  const r = await p.evaluate(() => ({ j: (window.__janelas || []).slice(), agora: !!document.querySelector('#solver-cofre, .omni-chaves'), ab: SolverCofre.aberto() }));
  conferir(!r.j.length && !r.agora && !r.ab, msg + (r.j.length || r.agora || r.ab ? ' ' + JSON.stringify(r) : ''));
};
const voltarDeOutraPagina = async (p) => {
  await p.goto(p.url().split('#')[0].split('?')[0].replace('index.html', 'sw.js')); await p.waitForTimeout(300);
  await p.goto(p.url().split('#')[0].replace('sw.js', 'index.html')); await pronto(p);
};
const esconderEMostrar = (p) => p.evaluate(async () => {
  Object.defineProperty(document, 'hidden', { configurable: true, get: () => true }); document.dispatchEvent(new Event('visibilitychange'));
  await new Promise((r) => setTimeout(r, 200));
  delete document.hidden; document.dispatchEvent(new Event('visibilitychange'));
});
/* Keys.need sem esperar: a resposta fica em window.__v */
const usarChave = (p, nome) => p.evaluate((n) => { window.__v = 'esperando'; Keys.need(n, { pt: 'Teste', en: 'Test' }).then((v) => { window.__v = v; }, (e) => { window.__v = 'erro:' + e.message; }); }, nome);
const esperarV = (p) => p.waitForFunction(() => window.__v !== 'esperando', null, { timeout: 20000 }).then(() => p.evaluate(() => window.__v));
const janelaApp = (p) => p.waitForSelector('.omni-chaves', { timeout: 8000 }).then(() => true, () => false);
const digitar = async (p, sel, v) => { await p.fill('.omni-chaves ' + sel, v); await p.click('.omni-chaves [data-ok]'); };
const msgJanela = (p) => p.evaluate(() => { const m = document.querySelector('.omni-chaves [data-msg]'); return m ? m.textContent : ''; });
const agoraNao = async (p) => { await p.click('.omni-chaves [data-x]:not(.xbtn)'); await p.waitForTimeout(400); };
/* o botão está à vista de verdade (display calculado, e não só o atributo hidden) */
const aVista = (p, sel) => p.evaluate((s) => { const b = document.querySelector(s); return !!b && getComputedStyle(b).display !== 'none'; }, sel);
const toasts = (p) => p.evaluate(() => [...document.querySelectorAll('.toast')].map((t) => t.textContent).join(' | '));
/* a digital da casa (de mentira) no modo "só neste aparelho": a senha principal embrulhada pelo PRF falso */
const ligarDigitalLocal = (p, senha) => p.evaluate(async (s) => {
  const out = new Uint8Array(32).fill(9); Cofre.prfAvaliar = async () => new Uint8Array(out);
  const reg = Object.assign({ cred: 'cred-de-mentira', sal: b64FromBuf(Cofre.rnd(32)) }, await Cofre.cifrar(await Cofre.hkdf(out, 'omnilife-cofre-local'), new TextEncoder().encode(s)));
  await IDB.set('kv', Vault.famKey(), reg);
}, senha);
const errosChaves = (p) => p.evaluate(() => JSON.parse(localStorage.getItem('dgo:global:cofre:erros') || '{"n":0}').n);
/* nada de segredo em texto aberto: localStorage, sessionStorage, preferências e IndexedDB "kv" (a cópia do MoneyTRIO em dgo:global:ia fica de propósito) */
const nadaEmClaro = (p, pedacos) => p.evaluate(async (ped) => {
  const tudo = [];
  for (const s of [localStorage, sessionStorage]) for (let i = 0; i < s.length; i++) { const k = s.key(i); if (k !== 'dgo:global:ia') tudo.push(k + '=' + s.getItem(k)); }
  tudo.push('prefs=' + JSON.stringify(S.prefs || {}));
  try { for (const [k, v] of await IDB.entries('kv')) tudo.push('kv:' + k + '=' + JSON.stringify(v)); } catch (e) {}
  return tudo.filter((t) => ped.some((x) => t.indexOf(x) !== -1)).map((t) => t.slice(0, 50));
}, pedacos);

(async () => {
  const browser = await iniciar();
  const arquivo = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  conferir(arquivo.indexOf('cofre.tela') === -1 && arquivo.indexOf('painelDigital') === -1, 'o index.html não abre a tela do cofre do módulo nem encaixa painel da digital (seria uma 4ª digital)');

  /* ================= A. entrada sem janela ================= */
  for (const nome of ['celular', 'computador']) {
    console.log('\n[' + nome + ': entrada sem janela]');
    /* visitante, com chaves antigas em texto aberto (era o que fazia aparecer "🔐 Proteger as chaves de IA") */
    {
      const ctx = await novoCtx(browser, nome);
      const { p, lixo } = await abrirApp(browser, nome, { ctx, semEntrar: true });
      conferir(await p.evaluate(() => window.__desvioAntes === true && window.__desvioNoDom === true), 'o desvio "um PIN só" já existe antes do diretrizes.js e no DOMContentLoaded');
      await semJanela(p, 'abrir com chaves antigas em texto aberto: nenhuma janela de PIN');
      await p.evaluate(() => ACT['gate.visitor']()); await p.waitForFunction(() => S.booted, null, { timeout: 15000 });
      await semJanela(p, 'entrar como visitante: nenhuma janela de PIN');
      await p.reload(); await pronto(p);
      await semJanela(p, 'recarregar (F5): nenhuma janela de PIN');
      await voltarDeOutraPagina(p);
      await semJanela(p, 'ir a outra página e voltar: nenhuma janela de PIN');
      await esconderEMostrar(p);
      await semJanela(p, 'esconder e mostrar o app: nenhuma janela de PIN');
      juntar(lixo); await ctx.close();
    }
    /* "só neste aparelho", com Senhas da casa e chaves já trancadas pela senha principal */
    {
      const ctx = await novoCtx(browser, nome);
      const { p, lixo } = await abrirApp(browser, nome, { ctx, semEntrar: true });
      await entrarLocal(p);
      await p.evaluate(async (s) => { await Vault.setup(s); await ChavesPin._p; }, SENHA);
      await p.reload(); await pronto(p); await p.waitForFunction(() => S.booted, null, { timeout: 15000 }).catch(() => {});
      await semJanela(p, 'só neste aparelho, recarregar com casa e chaves abertas (corrida do F5): nenhuma janela, as duas trancadas');
      conferir(await p.evaluate(() => !S.vaultKey && SolverCofre.existe()), 'depois do F5 as Senhas da casa também ficam trancadas');
      await voltarDeOutraPagina(p); await p.waitForFunction(() => S.booted, null, { timeout: 15000 }).catch(() => {});
      await semJanela(p, 'só neste aparelho, ir a outra página e voltar: nenhuma janela');
      await esconderEMostrar(p);
      await semJanela(p, 'só neste aparelho, esconder e mostrar: nenhuma janela');
      juntar(lixo); await ctx.close();
    }
  }

  /* ================= B. modo "só neste aparelho" ================= */
  console.log('\n[celular: só neste aparelho]');
  {
    const ctx = await novoCtx(browser, 'celular');
    const { p, lixo } = await abrirApp(browser, 'celular', { ctx, semEntrar: true });
    await entrarLocal(p);
    await p.evaluate(async (s) => { await Vault.setup(s); await ChavesPin._p; }, SENHA);
    let r = await p.evaluate(() => ({ ab: SolverCofre.aberto(), g: Keys.get('ia:gemini'), m: ChavesPin.marca() }));
    conferir(r.ab && r.g === GEM && r.m && r.m.ok === true && /^l:/.test(r.m.dono), 'Vault.setup com chave pendente cria e abre o cofre de chaves com a senha principal, e a chave migra');
    r = await p.evaluate(async (s) => { await SolverCofre.trancar(); return SolverCofre.abrir(s).then(() => true, () => false); }, SENHA);
    conferir(r === true, 'depois de trancar, o cofre de chaves abre com a senha principal');
    conferir(!(await nadaEmClaro(p, [SENHA, 'senha-de-mentira', 'mentira-gemini'])).length, 'nem a senha principal nem a chave em texto aberto (localStorage, sessionStorage, preferências, IndexedDB)');

    /* a janela do app (nunca a do cofre.js) */
    await p.evaluate(async () => { await SolverCofre.trancar(); Vault.lock(); window.__janelas = []; });
    await usarChave(p, 'ia:gemini');
    conferir(await janelaApp(p) && await p.evaluate(() => !document.querySelector('#solver-cofre')), 'Keys.need mostra a janela "Confirme que é você" do app, e não a do cofre.js');
    await p.waitForTimeout(400);
    conferir(!(await aVista(p, '.omni-chaves [data-dig]')), 'digital desligada: o botão "👆 Usar a digital" não aparece (display calculado)');
    conferir(/Confirme que é você/.test(await p.evaluate(() => document.querySelector('.omni-chaves').textContent)) && /senha principal/.test(await p.evaluate(() => document.querySelector('.omni-chaves').textContent)), 'a janela pede a senha principal das Senhas da casa (é a mesma de sempre)');
    await digitar(p, '#omni-pin', 'errada-de-mentira'); await p.waitForTimeout(1200);
    r = await p.evaluate(() => ({ v: window.__v, ab: SolverCofre.aberto(), casa: !!S.vaultKey, n: (JSON.parse(localStorage.getItem('omnilife.vault.erros:' + Vault.famKey()) || '{}')).n }));
    conferir(r.v === 'esperando' && !r.ab && !r.casa && r.n === 1 && (await errosChaves(p)) === 0 && /Senha errada/.test(await msgJanela(p)), 'senha errada: continua trancado, conta 1 na casa e nada no cofre de chaves (' + JSON.stringify(r) + ')');
    await digitar(p, '#omni-pin', SENHA);
    conferir(await esperarV(p) === GEM && await p.evaluate(() => !!S.vaultKey && SolverCofre.aberto() && !document.querySelector('.omni-chaves')), 'senha certa: devolve a chave e abre também as Senhas da casa');
    conferir(await p.evaluate(() => !localStorage.getItem('omnilife.vault.erros:' + Vault.famKey())), 'senha certa zera a contagem de erros');

    /* esperas da senha principal; a digital não é barrada */
    r = await p.evaluate(async (s) => {
      Vault.lock(); for (let i = 0; i < 5; i++) await Vault.unlock('errada-de-mentira-' + i);
      const certa = await Vault.unlock(s); return { certa, espera: Vault.espera() };
    }, SENHA);
    conferir(r.certa === false && r.espera > 0, 'com 5 senhas erradas, a 6ª (certa) é recusada até passar a espera (' + JSON.stringify(r) + ')');
    await p.evaluate(() => go('house', 'vault')); await p.waitForTimeout(500);
    await p.fill('#vpw', SENHA); await p.evaluate(() => ACT['vault.unlock']()); await p.waitForTimeout(300);
    conferir(await p.evaluate(() => [...document.querySelectorAll('.toast')].some((t) => /Espere/.test(t.textContent))), 'a tela das Senhas da casa diz "Muitas tentativas. Espere…"');
    r = await p.evaluate(async (s) => {
      const out = new Uint8Array(32).fill(9); Cofre.prfAvaliar = async () => new Uint8Array(out);
      const reg = Object.assign({ cred: 'cred-de-mentira', sal: b64FromBuf(Cofre.rnd(32)) }, await Cofre.cifrar(await Cofre.hkdf(out, 'omnilife-cofre-local'), new TextEncoder().encode(s)));
      await IDB.set('kv', Vault.famKey(), reg); await SolverCofre.trancar();
      const ok = await Vault.unlockBio(); await ChavesPin._p; return { ok, casa: !!S.vaultKey, chaves: SolverCofre.aberto() };
    }, SENHA);
    conferir(r.ok && r.casa && r.chaves, 'a digital (de mentira) não é barrada pela espera e abre casa e chaves (' + JSON.stringify(r) + ')');

    /* pausa do cofre de chaves (erros em outro app): a casa abre, as chaves esperam, a contagem não sobe */
    await p.evaluate(async () => { await SolverCofre.trancar(); Vault.lock(); lsDel('omnilife.vault.erros:' + Vault.famKey()); localStorage.setItem('dgo:global:cofre:erros', JSON.stringify({ n: 5, ate: Date.now() + 60000 })); });
    await usarChave(p, 'ia:gemini'); await janelaApp(p);
    await digitar(p, '#omni-pin', SENHA); await p.waitForTimeout(2500);
    r = await p.evaluate(() => ({ casa: !!S.vaultKey, ch: SolverCofre.aberto() }));
    conferir(r.casa && !r.ch && /pausa/.test(await msgJanela(p)) && (await errosChaves(p)) === 5, 'pausa do cofre de chaves: a casa abre, as chaves continuam trancadas, aparece o aviso e a contagem fica em 5');
    await agoraNao(p);
    const recusa = await esperarV(p);
    conferir(/^erro:/.test(recusa), '"Agora não" devolve "trancado" a quem pediu a chave');
    conferir(/senha principal/.test(recusa) && !/seu PIN/.test(recusa), 'só neste aparelho: o aviso de chaves trancadas fala da senha principal, e não de PIN (' + recusa + ')');
    /* a digital, com as chaves em pausa: vai direto ao aviso da pausa, sem pedir para digitar */
    await p.evaluate(async () => { await SolverCofre.trancar(); Vault.lock(); });
    await usarChave(p, 'ia:gemini'); await janelaApp(p);
    await p.waitForFunction(() => { const b = document.querySelector('.omni-chaves [data-dig]'); return b && getComputedStyle(b).display !== 'none'; }, null, { timeout: 5000 }).catch(() => {});
    conferir(await aVista(p, '.omni-chaves [data-dig]'), 'digital ligada: o botão "👆 Usar a digital" aparece');
    await p.click('.omni-chaves [data-dig]'); await p.waitForTimeout(2000);
    r = await msgJanela(p);
    conferir(/pausa/.test(r) && !/Só desta vez/.test(r), 'só neste aparelho, digital com as chaves em pausa: mostra a pausa, sem "Só desta vez, digite o PIN" (' + r + ')');
    await agoraNao(p); await esperarV(p);
    await p.evaluate(() => localStorage.removeItem('dgo:global:cofre:erros'));

    /* sair tranca as chaves */
    await p.evaluate(async (s) => { await SolverCofre.abrir(s); }, SENHA);
    r = await p.evaluate(async () => { const antes = SolverCofre.aberto(); await signOut(); await new Promise((x) => setTimeout(x, 300)); return { antes, depois: SolverCofre.aberto() }; });
    conferir(r.antes && !r.depois, 'sair (modo só neste aparelho) tranca as chaves');
    juntar(lixo); await ctx.close();
  }

  /* sem chave pendente: a senha principal não cria cofre de chaves à toa */
  {
    const ctx = await novoCtx(browser, 'celular', false);
    const { p, lixo } = await abrirApp(browser, 'celular', { ctx, semEntrar: true });
    await entrarLocal(p);
    await p.evaluate(async (s) => { await Vault.setup(s); await ChavesPin._p; }, SENHA);
    conferir(await p.evaluate(() => !SolverCofre.existe()), 'Vault.setup SEM chave pendente não cria cofre de chaves');
    juntar(lixo); await ctx.close();
  }

  /* PIN antigo: cofre de chaves criado antes em outro app */
  console.log('\n[celular: PIN antigo e "Não lembro"]');
  {
    const ctx = await novoCtx(browser, 'celular', false);
    const { p, lixo } = await abrirApp(browser, 'celular', { ctx, semEntrar: true });
    await p.evaluate(async (a) => { await SolverCofre.criar(a); await SolverCofre.gravar('ia:groq', 'mentira-groq-0123456789'); await SolverCofre.trancar(); }, ANTIGO);
    await entrarLocal(p);
    await p.evaluate(async (s) => { await Vault.setup(s); await ChavesPin._p; }, SENHA);
    let r = await p.evaluate(() => ({ ab: SolverCofre.aberto(), m: ChavesPin.marca() }));
    conferir(!r.ab && (await errosChaves(p)) === 1 && r.m && r.m.ok === false, 'cofre de chaves com outro PIN: Vault.setup gasta UMA tentativa e marca ok:false');
    await p.evaluate(async (s) => { Vault.lock(); await Vault.unlock(s); await ChavesPin._p; }, SENHA);
    conferir((await errosChaves(p)) === 1, 'fechar e abrir a casa de novo não gasta outra tentativa');
    await p.evaluate(() => { window.__janelas = []; });
    await usarChave(p, 'ia:groq'); await janelaApp(p);
    await digitar(p, '#omni-pin', SENHA);
    await p.waitForFunction(() => { const a = document.querySelector('.omni-chaves [data-antigo]'); return a && !a.hidden; }, null, { timeout: 10000 }).catch(() => {});
    conferir(await p.evaluate(() => { const a = document.querySelector('.omni-chaves [data-antigo]'); return !!a && !a.hidden && /PIN antigo/.test(a.textContent) && !document.querySelector('#solver-cofre'); }), 'com a senha da casa, a janela do app passa ao passo "PIN antigo" (nunca a janela do cofre.js)');
    const tAntigo = await p.evaluate(() => document.querySelector('.omni-chaves [data-antigo] p').textContent);
    conferir(!/criado em outro app\)/.test(tAntigo) && /aqui ou em outro app SolverONE/.test(tAntigo), 'o passo "PIN antigo" não afirma que o PIN foi criado em outro app');
    conferir(/só a senha principal das Senhas da casa/.test(tAntigo) && !/só o PIN das Senhas/.test(tAntigo), 'só neste aparelho: o passo "PIN antigo" diz que depois vale a senha principal (e não "o PIN")');
    await digitar(p, '#omni-antigo', ANTIGO);
    conferir(await esperarV(p) === 'mentira-groq-0123456789', 'o PIN antigo abre as chaves');
    const tPronto = await toasts(p);
    conferir(/mesma senha principal das Senhas da casa/.test(tPronto) && !/mesmo PIN das Senhas/.test(tPronto), 'só neste aparelho: o aviso "Pronto" fala da senha principal (' + tPronto.slice(0, 120) + ')');
    r = await p.evaluate(async ([s, a]) => {
      await SolverCofre.trancar(); const comCasa = await SolverCofre.abrir(s).then(() => true, () => false);
      await SolverCofre.trancar(); const comAntigo = await SolverCofre.abrir(a).then(() => true, () => false);
      return { comCasa, comAntigo, m: ChavesPin.marca() };
    }, [SENHA, ANTIGO]);
    conferir(r.comCasa && !r.comAntigo && r.m && r.m.ok, 'depois: o cofre de chaves abre com a senha da casa e recusa o PIN antigo (' + JSON.stringify(r) + ')');
    juntar(lixo); await ctx.close();
  }
  {
    const ctx = await novoCtx(browser, 'celular');
    const { p, lixo } = await abrirApp(browser, 'celular', { ctx, semEntrar: true });
    /* o cofre de chaves "do outro app" (já leva a cópia do MoneyTRIO) */
    await p.evaluate(async (a) => { await SolverCofre.criar(a); await SolverCofre.trancar(); }, ANTIGO);
    await entrarLocal(p);
    await p.evaluate(async (s) => { await Vault.setup(s); await ChavesPin._p; }, SENHA);
    await usarChave(p, 'ia:groq'); await janelaApp(p);
    await digitar(p, '#omni-pin', SENHA);
    await p.waitForFunction(() => { const a = document.querySelector('.omni-chaves [data-antigo]'); return a && !a.hidden; }, null, { timeout: 10000 });
    await p.click('.omni-chaves [data-naolembro]');
    await p.waitForSelector('dialog[open] [data-yes]', { timeout: 5000 });
    conferir(/só as chaves de IA/.test(await p.evaluate(() => document.querySelector('dialog[open] [data-yes]').closest('.modal').textContent)), '"Não lembro" confirma antes: apaga só as chaves de IA, as Senhas da casa não mudam');
    await p.click('dialog[open] [data-yes]');
    conferir(await esperarV(p) === GROQ_MT, 'depois de "Não lembro", o cofre de chaves novo abre e a chave do MoneyTRIO (dgo:global:ia) volta');
    conferir(await p.evaluate(() => [...document.querySelectorAll('.toast')].some((t) => /Cole de novo/.test(t.textContent))), 'o aviso diz para colar de novo as chaves que não voltaram sozinhas');
    conferir(await p.evaluate(() => [...document.querySelectorAll('.toast')].some((t) => /Cole de novo/.test(t.textContent) && /com a senha principal das Senhas da casa/.test(t.textContent))), 'só neste aparelho: o aviso do "Não lembro" fala da senha principal, e não de PIN');
    conferir(await p.evaluate(async (s) => { await SolverCofre.trancar(); return SolverCofre.abrir(s).then(() => true, () => false); }, SENHA), 'o cofre de chaves novo abre com a senha da casa');
    juntar(lixo); await ctx.close();
  }

  /* digital da casa com o cofre de chaves em outro PIN: vai direto ao passo "PIN antigo"; e a digital antiga das chaves abre sem o PIN antigo */
  {
    const ctx = await novoCtx(browser, 'celular', false);
    const { p, lixo } = await abrirApp(browser, 'celular', { ctx, semEntrar: true });
    await p.evaluate(async (a) => { await SolverCofre.criar(a); await SolverCofre.gravar('ia:groq', 'mentira-groq-0123456789'); await SolverCofre.trancar(); }, ANTIGO);
    await entrarLocal(p);
    await p.evaluate(async (s) => { await Vault.setup(s); await ChavesPin._p; }, SENHA);
    await ligarDigitalLocal(p, SENHA);
    /* a digital antiga do cofre.js (de mentira): abre o cofre de chaves sem digitar o PIN antigo */
    await p.evaluate(async (a) => { Vault.lock(); window.__dv = 0; SolverCofre.digitalAtiva = () => true; SolverCofre.abrirComDigital = async () => { window.__dv++; await SolverCofre.abrir(a); }; }, ANTIGO);
    await usarChave(p, 'ia:groq'); await janelaApp(p);
    await p.waitForFunction(() => { const b = document.querySelector('.omni-chaves [data-dig]'); return b && getComputedStyle(b).display !== 'none'; }, null, { timeout: 5000 }).catch(() => {});
    await p.click('.omni-chaves [data-dig]');
    const foi = await p.waitForFunction(() => { const a = document.querySelector('.omni-chaves [data-antigo]'); return a && !a.hidden; }, null, { timeout: 8000 }).then(() => true, () => false);
    let r = await msgJanela(p);
    conferir(foi && !/Só desta vez/.test(r) && await p.evaluate(() => !!S.vaultKey), 'só neste aparelho, a digital da casa com as chaves em outro PIN leva direto ao passo "PIN antigo", sem pedir a senha (' + r + ')');
    conferir(await aVista(p, '.omni-chaves [data-digvelha]') && await p.evaluate(() => window.__dv === 0), 'passo "PIN antigo": aparece "👆 Usar a digital das chaves de IA" (que só é chamada depois do toque)');
    await p.click('.omni-chaves [data-naolembro]');
    await p.waitForSelector('dialog[open] [data-yes]', { timeout: 5000 });
    conferir(/Usar a digital das chaves de IA/.test(await p.evaluate(() => document.querySelector('dialog[open] [data-yes]').closest('.modal').textContent)), '"Não lembro" avisa antes para tentar a digital das chaves de IA');
    await p.click('dialog[open] [data-no]'); await p.waitForTimeout(400);
    await p.click('.omni-chaves [data-digvelha]');
    conferir(await esperarV(p) === 'mentira-groq-0123456789' && await p.evaluate(() => window.__dv === 1), 'a digital antiga das chaves abre sem o PIN antigo e devolve a chave');
    r = await p.evaluate(async ([s, a]) => {
      await SolverCofre.trancar(); const comCasa = await SolverCofre.abrir(s).then(() => true, () => false);
      await SolverCofre.trancar(); const comAntigo = await SolverCofre.abrir(a).then(() => true, () => false);
      return { comCasa, comAntigo, m: ChavesPin.marca() };
    }, [SENHA, ANTIGO]);
    conferir(r.comCasa && !r.comAntigo && r.m && r.m.ok === true, 'depois da digital antiga: o cofre de chaves passa para a senha da casa e o marcador fica ok (' + JSON.stringify(r) + ')');
    juntar(lixo); await ctx.close();
  }

  /* duas pessoas no mesmo navegador: o cofre de chaves alinhado por outra não é tocado */
  console.log('\n[celular: duas pessoas no mesmo navegador]');
  {
    const ctx = await novoCtx(browser, 'celular', false);
    const { p, lixo } = await abrirApp(browser, 'celular', { ctx, semEntrar: true });
    await p.evaluate(async (s) => {
      await SolverCofre.criar(s); await SolverCofre.gravar('ia:gemini', 'mentira-gemini-outra-0123456789'); await SolverCofre.trancar();
      const r = JSON.parse(localStorage.getItem('dgo:global:cofre'));
      localStorage.setItem('omnilife.chaves.pin', JSON.stringify({ id: r.criado + '|' + r.sal, ok: true, dono: 'l:outra' }));
    }, ANTIGO);
    await entrarLocal(p);
    const r = await p.evaluate(async (s) => {
      let trocas = 0; const o = SolverCofre.trocarPin; SolverCofre.trocarPin = function () { trocas++; return o.apply(this, arguments); };
      await Vault.setup(s); await ChavesPin._p; Vault.lock(); await Vault.unlock(s); await ChavesPin._p;
      SolverCofre.trocarPin = o;
      return { n: JSON.parse(localStorage.getItem('dgo:global:cofre:erros') || '{"n":0}').n, trocas, ab: SolverCofre.aberto() };
    }, SENHA);
    conferir(r.n === 0 && r.trocas === 0 && !r.ab, 'marcador de outra pessoa: a senha da casa não tenta abrir nem troca o PIN dela (' + JSON.stringify(r) + ')');
    await usarChave(p, 'ia:gemini');
    conferir(await p.waitForSelector('dialog#solver-cofre[open]', { timeout: 8000 }).then(() => true, () => false) && await p.evaluate(() => !document.querySelector('.omni-chaves')), 'e Keys.need cai na janela do cofre.js (o PIN dela)');
    await p.keyboard.press('Escape');
    juntar(lixo); await ctx.close();
  }

  /* ================= C. nuvem simulada, sem rede ================= */
  console.log('\n[celular: nuvem simulada sem rede]');
  {
    const ctx = await novoCtx(browser, 'celular');
    const { p, lixo } = await abrirApp(browser, 'celular', { ctx });
    await ctx.setOffline(true);
    /* responsável na nuvem que ainda não tem Senhas da casa neste aparelho (sem L, Cofre.status ainda não lido) */
    let r = await p.evaluate(() => {
      S.mode = 'cloud'; S.family = { id: 'fam-de-mentira', members: {} }; S.role = 'admin'; Conta.uid = () => 'conta-de-mentira'; Cofre.status = null;
      return { tc: ChavesPin.temCasa(), outro: /Não existe outro PIN/.test(KeyVault.view()) };
    });
    conferir(r.tc === false && !r.outro, 'nuvem sem Senhas da casa neste aparelho: a tela de IA não diz "Não existe outro PIN" (' + JSON.stringify(r) + ')');
    /* 🚗 "Abrir as Senhas da casa" sem casa neste aparelho (responsável antes de "Começar" e contato de emergência): leva até lá */
    for (const quem of ['responsável', 'contato de emergência']) {
      await p.evaluate((q) => {
        window.__userAntes = window.__userAntes || { u: S.user };
        if (q !== 'responsável') { S.role = 'membro'; S.user = { uid: 'conta-de-mentira' }; S.family.members = { 'conta-de-mentira': { emergencyVault: true } }; }
        window.__ac = 'esperando'; ACT['car.abrircasa']().then(() => { window.__ac = 'ok'; });
      }, quem);
      const aviso = await p.waitForSelector('dialog[open] [data-yes]', { timeout: 5000 }).then(() => p.evaluate(() => document.querySelector('dialog[open] [data-yes]').closest('.modal').textContent), () => '');
      conferir(/abra ou crie as 🔐 Senhas da casa/.test(aviso) && /Ir para as Senhas da casa/.test(aviso), '🚗 nuvem, ' + quem + ' sem Senhas da casa neste aparelho: o botão avisa e oferece ir para as Senhas da casa');
      if (aviso) await p.click('dialog[open] [data-no]');
      await p.waitForFunction(() => window.__ac === 'ok', null, { timeout: 5000 }).catch(() => {});
    }
    await p.evaluate(() => { S.role = 'admin'; S.family.members = {}; S.user = window.__userAntes.u; });
    await p.evaluate(async (pin) => {
      S.mode = 'cloud'; S.family = { id: 'fam-de-mentira', members: {} }; S.role = 'admin'; Conta.uid = () => 'conta-de-mentira';
      const dukRaw = Cofre.rnd(32), duk = await Cofre.aes(dukRaw), sal = b64FromBuf(Cofre.rnd(16)), cf = Cofre.rnd(32);
      window.__out = new Uint8Array(32).fill(7); window.__prf = 0; Cofre.prfAvaliar = async () => { window.__prf++; return new Uint8Array(window.__out); };
      window.__abriuCasa = 0; const ac = CloudDriver.abrirCofre; CloudDriver.abrirCofre = async function () { window.__abriuCasa++; return ac.apply(this, arguments); };
      const L = { v: 1, uid: 'conta-de-mentira', pin: Object.assign({ sal, iter: COFRE_ITER }, await Cofre.cifrar(await Cofre.kdf(pin, sal, COFRE_ITER), dukRaw)),
        prf: Object.assign({ cred: 'cred-de-mentira', sal: b64FromBuf(Cofre.rnd(32)) }, await Cofre.cifrar(await Cofre.hkdf(window.__out, 'omnilife-cofre-prf'), dukRaw)),
        sk: null, fam: { 'fam-de-mentira': Object.assign({ kv: 1, fk: 'fk1' }, await Cofre.cifrar(duk, cf)) }, erros: 0, ate: 0, bloqueado: false };
      await Cofre.gravarLocal(L); window.__janelas = [];
    }, PIN);
    /* a "entrada" na nuvem: os pedidos automáticos (sem a marca omni) não mostram janela */
    await p.evaluate(() => { SolverCofre.pedir({ motivo: { pt: 'Teste', en: 'Test' } }); });
    await esconderEMostrar(p);
    await semJanela(p, 'nuvem: pedido automático (regras do PIN, módulo) e esconder/mostrar não mostram janela');

    r = await p.evaluate(async () => { const x = await Cofre.destrancarPin('582913'); await ChavesPin._p; const L = await Cofre.local(); return { x, casa: Cofre.aberto(), ch: SolverCofre.aberto(), tem: !!(L.chaves && L.chaves.ct), claro: JSON.stringify(L).indexOf('582913') !== -1 }; });
    conferir(r.x.ok && r.casa && r.ch && r.tem && !r.claro, 'PIN da casa abre a casa e cria as chaves; o PIN fica embrulhado em L.chaves e nunca em claro (' + JSON.stringify(r) + ')');
    r = await p.evaluate(async () => { Cofre.trancar(); await SolverCofre.trancar(); const x = await Cofre.destrancarDigital(); await ChavesPin._p; return { x, casa: Cofre.aberto(), ch: SolverCofre.aberto() }; });
    conferir(r.x.ok && r.casa && r.ch, 'digital (de mentira) abre a casa e as chaves num toque, sem digitar');
    r = await p.evaluate(async () => {
      await SolverCofre.trancar(); window.__abriuCasa = 0; let maxJ = 0; const t = setInterval(() => { maxJ = Math.max(maxJ, SolverJanela.quantas()); }, 20);
      const v = await Keys.need('ia:gemini'); clearInterval(t); return { v, maxJ, abriuCasa: window.__abriuCasa };
    });
    conferir(r.v === GEM && r.maxJ === 0 && r.abriuCasa === 0, 'casa aberta e chaves trancadas: Keys.need devolve a chave SEM janela e sem reabrir a casa (' + JSON.stringify(r) + ')');
    /* "🔒 Trancar o cofre agora" com a casa aberta: o aviso não promete que o app vai pedir o PIN */
    await p.evaluate(async () => { document.querySelectorAll('.toast').forEach((t) => t.remove()); await ACT['cofre.lock'](); });
    r = await toasts(p);
    conferir(!/pede o PIN/.test(r) && /abrem sozinhas/.test(r) && await p.evaluate(() => !SolverCofre.aberto()), 'nuvem, casa aberta: "Trancar o cofre agora" avisa que as chaves abrem sozinhas enquanto a casa estiver aberta (' + r.slice(0, 80) + ')');

    /* "Mostrar a chave guardada": pede sempre, por cima da janela da chave; a digital só depois do toque */
    await p.evaluate(() => { window.__prf = 0; KeyVault.open('gemini'); }); await p.waitForTimeout(600);
    await p.click('dialog.sj[open] [data-act="keys.show"]');
    conferir(await janelaApp(p), '"Mostrar a chave guardada" com a casa aberta: tranca e abre "Confirme que é você"');
    await p.waitForTimeout(400);
    r = await p.evaluate(() => ({ q: SolverJanela.quantas(), prf: window.__prf, foco: document.activeElement && document.activeElement.id, dig: getComputedStyle(document.querySelector('.omni-chaves [data-dig]')).display !== 'none' }));
    conferir(r.q === 2 && r.prf === 0 && r.foco !== 'omni-pin' && r.dig, 'por cima da janela da chave; a digital não dispara sozinha e o campo do PIN fica sem foco no celular (' + JSON.stringify(r) + ')');
    await p.click('.omni-chaves [data-dig]');
    await p.waitForFunction(() => { const b = document.querySelector('[data-shown="ia:gemini"]'); return b && /mentira-gemini/.test(b.textContent); }, null, { timeout: 10000 }).catch(() => {});
    conferir(await p.evaluate(() => /Chave guardada \(some em 30 s\)/.test((document.querySelector('[data-shown="ia:gemini"]') || {}).textContent || '') && window.__prf === 1), 'depois do toque na digital, a chave aparece por 30 s');
    await p.evaluate(() => { Keys._show = null; document.querySelectorAll('dialog[open]').forEach((d) => { try { d.close(); } catch (e) {} }); }); await p.waitForTimeout(400);
    /* "Mostrar a chave guardada" logo depois de um uso de IA em curso (sem confirmar): não pega carona, pede de novo */
    await p.evaluate(async () => {
      await SolverCofre.trancar(); window.__v = 'esperando'; window.__sh = 'esperando';
      Keys.need('ia:gemini').then((v) => { window.__v = v; }, (e) => { window.__v = 'erro:' + e.message; });
      ACT['keys.show']({ k: 'ia:gemini' }, document.createElement('button')).then(() => { window.__sh = 'fim'; });
    });
    r = await janelaApp(p);
    conferir(r && await p.evaluate(() => !Keys._show), '"Mostrar a chave" com outro pedido em curso: abre "Confirme que é você" e a chave não aparece sozinha');
    conferir(await esperarV(p) === GEM, 'o uso de IA em curso recebe a chave normalmente');
    if (r) await agoraNao(p);
    await p.waitForFunction(() => window.__sh === 'fim', null, { timeout: 5000 }).catch(() => {});
    conferir(await p.evaluate(() => !Keys._show && !SolverCofre.aberto()), '"Agora não" deixa a chave escondida e as chaves trancadas');
    await p.evaluate(() => { document.querySelectorAll('dialog[open]').forEach((d) => { try { d.close(); } catch (e) {} }); }); await p.waitForTimeout(300);

    /* PIN errado conta só na casa; bloqueio mostra o texto da casa e nunca a janela do cofre.js */
    await p.evaluate(async () => { Cofre.trancar(); await SolverCofre.trancar(); window.__janelas = []; });
    await usarChave(p, 'ia:gemini'); await janelaApp(p);
    await digitar(p, '#omni-pin', '000000'); await p.waitForTimeout(2500);
    r = await p.evaluate(async () => ({ erros: (await Cofre.local()).erros, msg: document.querySelector('.omni-chaves [data-msg]').textContent }));
    conferir(r.erros === 1 && /PIN errado/.test(r.msg) && (await errosChaves(p)) === 0, 'PIN errado na janela: soma 1 na casa e nada no cofre de chaves');
    await agoraNao(p); await esperarV(p);
    await p.evaluate(async () => { const L = await Cofre.local(); L.bloqueado = true; await Cofre.gravarLocal(L); });
    await usarChave(p, 'ia:gemini'); await janelaApp(p);
    r = await p.evaluate(() => ({ t: document.querySelector('.omni-chaves').textContent, pin: !!document.querySelector('.omni-chaves #omni-pin:not([hidden])') && !document.querySelector('.omni-chaves [data-casa]').hidden }));
    conferir(/10 vezes/.test(r.t) && !r.pin, 'casa bloqueada: a janela mostra o bloqueio (sem campo de PIN)');
    await agoraNao(p); await esperarV(p);
    conferir(await p.evaluate(() => !window.__janelas.includes('solver-cofre')), 'a janela do cofre.js nunca apareceu na nuvem');
    await p.evaluate(async () => { const L = await Cofre.local(); L.bloqueado = false; L.erros = 0; L.ate = 0; await Cofre.gravarLocal(L); });

    /* digital ligada antes do "um PIN só" (L.prf existe, L.chaves não): uma vez com o PIN, depois a digital abre tudo */
    await p.evaluate(async () => { const L = await Cofre.local(); delete L.chaves; await Cofre.gravarLocal(L); Cofre.trancar(); await SolverCofre.trancar(); });
    await usarChave(p, 'ia:gemini'); await janelaApp(p);
    await p.click('.omni-chaves [data-dig]'); await p.waitForTimeout(1500);
    conferir(/Só desta vez, digite o PIN/.test(await msgJanela(p)) && await p.evaluate(() => Cofre.aberto() && !SolverCofre.aberto()), 'digital ligada antes: abre a casa e pede o PIN uma vez, com o aviso');
    await digitar(p, '#omni-pin', PIN);
    conferir(await esperarV(p) === GEM && await p.evaluate(async () => !!(await Cofre.local()).chaves), 'com o PIN, as chaves abrem e o L.chaves passa a existir');
    r = await p.evaluate(async () => { Cofre.trancar(); await SolverCofre.trancar(); const x = await Cofre.destrancarDigital(); await ChavesPin._p; return x.ok && Cofre.aberto() && SolverCofre.aberto(); });
    conferir(r, 'e a digital seguinte abre tudo');

    /* trocar o PIN da casa pede o PIN de agora (mesmo com a casa aberta): errado não troca nada */
    r = await p.evaluate(async ([n, v]) => {
      const antes = JSON.stringify((await Cofre.local()).pin); let novos = 0; window.__perguntas = 0;
      window.__prfOk = Cofre.prfAvaliar; Cofre.prfAvaliar = async () => null;   /* a digital não confirma: cai no PIN de agora */
      window.askText = async () => { window.__perguntas++; return '000000'; }; Cofre.pedirNovoPin = async () => { novos++; return n; };
      document.querySelectorAll('.toast').forEach((t) => t.remove());
      await Cofre.trocarPin(); await ChavesPin._p;
      const L = await Cofre.local(), t = [...document.querySelectorAll('.toast')].map((x) => x.textContent).join(' | ');
      await SolverCofre.trancar(); const velho = await SolverCofre.abrir(v).then(() => true, () => false);
      L.erros = 0; L.ate = 0; await Cofre.gravarLocal(L); Cofre.prfAvaliar = window.__prfOk;
      return { mesmo: JSON.stringify(L.pin) === antes, novos, velho, perguntas: window.__perguntas, t };
    }, [PIN2, PIN]);
    conferir(r.perguntas === 1 && r.mesmo && r.novos === 0 && r.velho && /PIN errado/.test(r.t), 'trocar o PIN com a casa aberta pede o PIN de agora; errado não troca nem o PIN da casa nem o das chaves (' + JSON.stringify(r) + ')');
    /* só com a digital (o dono esqueceu o PIN de agora): o toque da digital da casa basta para trocar */
    r = await p.evaluate(async ([n, v]) => {
      let perguntas = 0; window.askText = async () => { perguntas++; return ''; }; Cofre.pedirNovoPin = async () => n; window.__prf = 0;
      await Cofre.trocarPin(); await ChavesPin._p;
      await SolverCofre.trancar(); const novo = await SolverCofre.abrir(n).then(() => true, () => false);
      /* volta ao PIN de antes (casa e chaves), para o resto do teste */
      window.askText = async () => n; Cofre.pedirNovoPin = async () => v; const prfOk = Cofre.prfAvaliar; Cofre.prfAvaliar = async () => null; await Cofre.trocarPin(); await ChavesPin._p; Cofre.prfAvaliar = prfOk;
      await SolverCofre.trancar(); const voltou = await SolverCofre.abrir(v).then(() => true, () => false);
      return { perguntas, prf: window.__prf, novo, voltou };
    }, [PIN3, PIN]);
    conferir(r.perguntas === 0 && r.prf >= 1 && r.novo && r.voltou, 'trocar o PIN só com a digital da casa (sem saber o PIN de agora) funciona (' + JSON.stringify(r) + ')');
    await p.evaluate(() => localStorage.removeItem('dgo:global:cofre:erros'));
    /* trocar o PIN da casa troca o das chaves */
    r = await p.evaluate(async ([n, v]) => {
      window.askText = async () => v; Cofre.pedirNovoPin = async () => n; await Cofre.trocarPin();
      await SolverCofre.trancar(); const novo = await SolverCofre.abrir(n).then(() => true, () => false);
      await SolverCofre.trancar(); const velho = await SolverCofre.abrir(v).then(() => true, () => false);
      const pin = await ChavesPin.lerPin(Cofre.dukRaw, await Cofre.local());
      return { novo, velho, igual: pin === n };
    }, [PIN2, PIN]);
    conferir(r.novo && !r.velho && r.igual, 'trocar o PIN da casa (com o PIN de agora): as chaves abrem com o novo, recusam o antigo e L.chaves guarda o novo (' + JSON.stringify(r) + ')');
    await p.evaluate(() => localStorage.removeItem('dgo:global:cofre:erros'));
    /* chaves em pausa: o PIN da casa troca, mas o aviso não diz que as chaves mudaram */
    r = await p.evaluate(async ([n, v]) => {
      await SolverCofre.trancar(); localStorage.setItem('dgo:global:cofre:erros', JSON.stringify({ n: 5, ate: Date.now() + 60000 }));
      document.querySelectorAll('.toast').forEach((t) => t.remove());
      window.askText = async () => v; Cofre.pedirNovoPin = async () => n; await Cofre.trocarPin(); await ChavesPin._p;
      const t = [...document.querySelectorAll('.toast')].map((x) => x.textContent).join(' | ');
      localStorage.removeItem('dgo:global:cofre:erros');
      const chavesVelho = await SolverCofre.abrir(v).then(() => true, () => false);
      /* volta a casa ao PIN de antes (o das chaves), para o resto do teste */
      const L = await Cofre.local(), sal = b64FromBuf(Cofre.rnd(16));
      L.pin = Object.assign({ sal, iter: COFRE_ITER }, await Cofre.cifrar(await Cofre.kdf(v, sal, COFRE_ITER), Cofre.dukRaw)); L.chaves = await ChavesPin.embrulhar(v, Cofre.dukRaw); await Cofre.gravarLocal(L);
      return { t, chavesVelho };
    }, [PIN3, PIN2]);
    conferir(/continuam com o PIN antigo/.test(r.t) && !/vale também para as chaves/.test(r.t) && r.chavesVelho, 'trocar o PIN com as chaves em pausa: avisa que as chaves continuam com o PIN antigo (' + r.t.slice(0, 90) + ')');

    /* ligar a digital das Senhas da casa (que agora abre também as chaves) pede o PIN de agora: errado não liga */
    r = await p.evaluate(async ([v]) => {
      if (!Cofre.aberto()) await Cofre.destrancarPin(v);
      const antes = JSON.stringify((await Cofre.local()).prf); let pedidos = 0, perguntas = 0;
      Cofre.prfNovo = async () => { pedidos++; return { cred: 'cred-nova-de-mentira', sal: b64FromBuf(Cofre.rnd(32)), out: new Uint8Array(32).fill(3) }; };
      window.askText = async () => { perguntas++; return '000000'; }; await Cofre.ligarDigital();
      const errado = { mesmo: JSON.stringify((await Cofre.local()).prf) === antes, pedidos, perguntas };
      const L0 = await Cofre.local(); L0.erros = 0; L0.ate = 0; await Cofre.gravarLocal(L0);
      window.askText = async () => { perguntas++; return v; }; await Cofre.ligarDigital();
      return { errado, certo: JSON.stringify((await Cofre.local()).prf) !== antes, pedidos, perguntas };
    }, [PIN2]);
    conferir(r.errado.mesmo && r.errado.pedidos === 0 && r.errado.perguntas === 1 && r.certo && r.pedidos === 1, 'ligar a digital com a casa aberta pede o PIN de agora; errado não liga (' + JSON.stringify(r) + ')');

    /* "aguardando": a casa não abre neste aparelho, mas o PIN estava certo e as chaves abrem */
    r = await p.evaluate(async (n) => {
      const L = await Cofre.local(); L.fam = {}; L.sk = null; await Cofre.gravarLocal(L);
      Cofre.trancar(); await SolverCofre.trancar();
      const x = await Cofre.destrancarPin(n); await ChavesPin._p; return { x, ch: SolverCofre.aberto(), casa: Cofre.aberto() };
    }, PIN2);
    conferir(r.x.erro === 'aguardando' && r.ch && !r.casa, 'caso "aguardando": a casa espera outro responsável, mas as chaves abrem (' + JSON.stringify(r) + ')');
    conferir(!(await nadaEmClaro(p, [PIN, PIN2, PIN3, 'mentira-gemini'])).length, 'nuvem: nenhum PIN nem chave em texto aberto (localStorage, sessionStorage, preferências, IndexedDB "kv")');

    /* sair da conta tranca as chaves */
    r = await p.evaluate(async () => { Cloud.logout = async () => {}; const antes = SolverCofre.aberto(); await ACT['cloud.logout'](); await new Promise((x) => setTimeout(x, 300)); return { antes, depois: SolverCofre.aberto() }; });
    conferir(r.antes && !r.depois, 'sair da conta (nuvem) tranca as chaves');
    juntar(lixo); await ctx.close();
  }

  /* ================= D. "Esqueci o PIN" sem o código, com as chaves abertas e a casa trancada ================= */
  console.log('\n[celular: nuvem simulada, "Esqueci o PIN" sem o código]');
  {
    const ctx = await novoCtx(browser, 'celular');
    const { p, lixo } = await abrirApp(browser, 'celular', { ctx });
    await p.evaluate(async (pin) => {
      S.mode = 'cloud'; S.family = { id: 'fam-de-mentira', members: {} }; S.role = 'admin'; Conta.uid = () => 'conta-de-mentira';
      const dukRaw = Cofre.rnd(32), duk = await Cofre.aes(dukRaw), sal = b64FromBuf(Cofre.rnd(16)), cf = Cofre.rnd(32);
      await Cofre.gravarLocal({ v: 1, uid: 'conta-de-mentira', pin: Object.assign({ sal, iter: COFRE_ITER }, await Cofre.cifrar(await Cofre.kdf(pin, sal, COFRE_ITER), dukRaw)), prf: null, sk: null,
        fam: { 'fam-de-mentira': Object.assign({ kv: 1, fk: 'fk1' }, await Cofre.cifrar(duk, cf)) }, erros: 0, ate: 0, bloqueado: false });
      await Cofre.destrancarPin(pin); await ChavesPin._p;
      Vault.lock();   /* a casa tranca (Trava, 🔒), as chaves continuam abertas */
      /* o caminho do servidor, de mentira: já usou em outro aparelho, "Não tenho o código", ninguém liberou ainda */
      CloudDriver.sync = async () => {}; CloudDriver.linha = async () => ({ dados: { fk: 'fk1' } });
      Cofre.minhasNoBanco = async () => ({ pub: { kid: 'kid-de-mentira' }, bk: 'bk-de-mentira' });
      Cofre.escolher = async () => 'novo'; Cofre.mostrarCodigo = async () => true; Cofre.publicarPar = async () => {}; Cofre.buscarMinha = async () => null;
      window.confirmBox = async () => true;
    }, PIN);
    await p.evaluate((n) => { Cofre.pedirNovoPin = async () => n; }, PIN_INTRUSO);
    conferir(await p.evaluate(() => !Cofre.aberto() && SolverCofre.aberto()), 'preparo: casa trancada e chaves abertas');
    await p.evaluate(() => { Cofre.esqueci(); });
    conferir(await p.waitForFunction(() => [...document.querySelectorAll('dialog[open]')].some((d) => /Falta liberar/.test(d.textContent)), null, { timeout: 30000 }).then(() => true, () => false), '"Esqueci o PIN" sem o código chega em "Falta liberar"');
    await p.evaluate(async () => { await ChavesPin._p; document.querySelectorAll('dialog[open]').forEach((d) => { try { d.close(); } catch (e) {} }); });
    conferir(await p.evaluate(() => !SolverCofre.aberto()), '"Esqueci o PIN" tranca também as chaves de IA');
    /* "Mostrar a chave guardada" com o PIN que quem pegou o aparelho acabou de escolher */
    await p.evaluate(() => { window.__sh = 'esperando'; ACT['keys.show']({ k: 'ia:gemini' }, document.createElement('button')).then(() => { window.__sh = 'fim'; }); });
    if (await janelaApp(p)) { await digitar(p, '#omni-pin', PIN_INTRUSO); await p.waitForTimeout(3000); if (await p.$('.omni-chaves')) await agoraNao(p); }
    await p.waitForFunction(() => window.__sh === 'fim', null, { timeout: 10000 }).catch(() => {});
    const r = await p.evaluate(async (pin) => {
      const vista = !!Keys._show, aberto = SolverCofre.aberto();
      await SolverCofre.trancar(); const dono = await SolverCofre.abrir(pin).then(() => true, () => false);
      return { vista, aberto, dono };
    }, PIN);
    conferir(!r.vista && !r.aberto && r.dono, 'sem o código e sem liberação: o PIN novo não mostra a chave e as chaves continuam abrindo com o PIN do dono (' + JSON.stringify(r) + ')');
    juntar(lixo); await ctx.close();
  }

  /* ================= E. chaves abertas antes, sem prova do PIN delas: criar/começar as Senhas da casa não toma as chaves ================= */
  console.log('\n[celular: só neste aparelho, criar as Senhas da casa com as chaves abertas por outro PIN]');
  {
    const ctx = await novoCtx(browser, 'celular');
    const { p, lixo } = await abrirApp(browser, 'celular', { ctx, semEntrar: true });
    await entrarLocal(p);
    /* as chaves foram criadas e abertas com o PIN delas (o do dono), sem Senhas da casa */
    await p.evaluate(async (a) => { if (!SolverCofre.existe()) await SolverCofre.criar(a); else await SolverCofre.abrir(a); await Keys.set('ia:gemini', 'mentira-gemini-0123456789'); }, ANTIGO);
    conferir(await p.evaluate(() => SolverCofre.aberto() && !Vault.meta()), 'preparo: chaves abertas com o PIN delas e sem Senhas da casa');
    /* quem pegou o aparelho cria as Senhas da casa com uma senha dele */
    await p.evaluate(async (x) => { await Vault.setup(x); await ChavesPin._p; }, 'senha-do-intruso-de-mentira');
    let r = await p.evaluate(async ([x, a]) => {
      await SolverCofre.trancar();
      const intruso = await SolverCofre.abrir(x).then(() => true, () => false); if (intruso) await SolverCofre.trancar();
      const dono = await SolverCofre.abrir(a).then(() => true, () => false);
      localStorage.removeItem('dgo:global:cofre:erros'); return { intruso, dono };
    }, ['senha-do-intruso-de-mentira', ANTIGO]);
    conferir(!r.intruso && r.dono, 'criar as Senhas da casa com as chaves abertas: a senha nova NÃO abre as chaves e o PIN do dono continua abrindo (' + JSON.stringify(r) + ')');
    /* o mesmo para "Começar" na nuvem (alinhar com trocar, sem prova): a raiz do problema */
    r = await p.evaluate(async ([x, a]) => {
      if (!SolverCofre.aberto()) await SolverCofre.abrir(a);
      localStorage.removeItem('omnilife.chaves.pin');
      const ok = await ChavesPin.alinhar(x, { trocar: true });
      await SolverCofre.trancar();
      const intruso = await SolverCofre.abrir(x).then(() => true, () => false); if (intruso) await SolverCofre.trancar();
      const dono = await SolverCofre.abrir(a).then(() => true, () => false);
      localStorage.removeItem('dgo:global:cofre:erros'); return { ok, intruso, dono };
    }, ['999888', ANTIGO]);
    conferir(r.ok === false && !r.intruso && r.dono, 'alinhar com "trocar" e as chaves já abertas, sem prova do PIN delas: não troca (' + JSON.stringify(r) + ')');
    juntar(lixo); await ctx.close();
  }

  conferir(lixoTodo.nativos.length === 0, 'nenhum alert/confirm/prompt nativo' + (lixoTodo.nativos.length ? ': ' + lixoTodo.nativos.join(' | ') : ''));
  conferir(lixoTodo.erros.length === 0, 'nenhum erro de script' + (lixoTodo.erros.length ? ': ' + lixoTodo.erros.join(' | ') : ''));
  await terminar(falhas, browser, 'um PIN só (Senhas da casa + chaves de IA) no OmniLifeONE.');
})().catch((e) => { console.error('Erro no teste:', e.message); process.exit(1); });
