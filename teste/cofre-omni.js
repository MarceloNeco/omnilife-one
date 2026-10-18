/* Teste automático: Fase 3 do cofre no OmniLifeONE (cofre.js 1.4.1 + módulo 1.12.0 + `cofre: { proteger: true }`).
   Só valores de mentira (PIN, chaves e token inventados): nenhuma chave, token ou senha de verdade.
     - sem segredo guardado, o app nunca pede PIN
     - segredos antigos (IA, clima, trânsito, token do Telegram, apikey do CallMeBot) vão sozinhos para o cofre
       e somem do lugar antigo (nada em texto aberto no localStorage, no sessionStorage nem nas preferências em memória)
     - com segredo guardado: PIN ao abrir e ao recarregar ("Agora não" deixa trancado); tranca ao sair do app,
       sem uso e escondido; o Modo Vigilante ligado conta como trabalho em andamento (não tranca por falta de uso)
     - a chave guardada nunca vem para o campo: "✓ guardado" e "Mostrar a chave guardada" (pede o PIN, some em 30 s)
     - o painel da digital aparece na tela de chaves do módulo (o app não encaixa painel próprio)
   Uso: node teste/rodar.js */
const fs = require('fs'), path = require('path');
const { criarConferir, abrirApp, iniciar, terminar, VP } = require('./_base');

const PIN = 'pin-de-mentira-123';
const FALSO = {
  gemini: 'mentira-gemini-0123456789', groq: 'mentira-groq-0123456789', clima: 'mentira-clima-0123456789', tomtom: 'mentira-transito-0123456789',
  telegram: 'mentira-robo-telegram-0123456789', whats: 'mentira-whatsapp-0123456789'
};
const PRIMEIRO = ['mentira'];   /* pedaço que nenhum texto aberto pode conter depois da mudança para o cofre */

/* semeia os lugares ONDE O APP GUARDAVA os segredos antes (uma vez só por navegador) */
function semear(f) {
  try {
    if (localStorage.getItem('__semeado')) return;
    localStorage.setItem('__semeado', '1');
    localStorage.setItem('investifyme.chaves.v1', JSON.stringify({ cifrado: false, chaves: { gemini: f.gemini, 'wx:weatherapi': f.clima, 'rt:tomtom': f.tomtom } }));
    localStorage.setItem('omnilife.prefs.v1', JSON.stringify({ keys: { groq: f.groq }, alertas: { tgOn: true, waOn: true, tgToken: f.telegram, recips: [{ id: 'r1', kind: 'outro', name: 'Ana', waPhone: '5511999990000', waKey: f.whats }] }, vigia: { tgToken: f.telegram, recips: [{ id: 'r1', kind: 'outro', name: 'Ana', waPhone: '5511999990000', waKey: f.whats }] } }));
  } catch (e) {}
}
/* tempos curtos para a regra de "sem uso" e "escondido": o app chama proteger() com os padrões e aqui só se encurta o relógio */
function encurtar() {
  let c;
  Object.defineProperty(window, 'SolverCofre', { configurable: true, get() { return c; }, set(v) {
    c = v; const o = v.proteger;
    if (typeof o === 'function') v.proteger = function (op) { return o.call(v, Object.assign({}, op, { ocioso: 2500, fora: 1500 })); };
  } });
}

(async () => {
  const browser = await iniciar();
  const { falhas, conferir } = criarConferir();
  const arquivo = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  conferir(arquivo.indexOf('painelDigital') === -1, 'o index.html não encaixa painel da digital por conta própria (vem da tela de chaves do módulo)');

  for (const nome of ['celular', 'computador']) {
    console.log('\n[' + nome + ']');
    const ctx = await browser.newContext({ viewport: VP[nome], hasTouch: nome === 'celular', serviceWorkers: 'block', locale: 'pt-BR' });

    /* ---------- 0. sem segredo guardado: nada de PIN ---------- */
    {
      const { p } = await abrirApp(browser, nome, { ctx });
      await p.waitForTimeout(800);
      conferir(await p.evaluate(() => !document.getElementById('solver-cofre') && !SolverCofre.existe()), 'sem nenhum segredo guardado o app nunca pede PIN');
      await p.close();
    }

    /* ---------- 1. segredos antigos vão para o cofre ---------- */
    await ctx.addInitScript(semear, FALSO);
    await ctx.addInitScript(encurtar);
    const { p, lixo } = await abrirApp(browser, nome, { ctx });
    const ev = (f, a) => p.evaluate(f, a);
    const esperar = (ms) => p.waitForTimeout(ms || 350);
    const aberto = () => ev(() => SolverCofre.aberto());
    const esperarPin = () => p.waitForSelector('dialog#solver-cofre[open]', { timeout: 8000 }).then(() => true, () => false);
    const digitarPin = async () => { await p.fill('#solver-cofre input[type=password]', PIN); await p.click('#solver-cofre button[type=submit]'); await p.waitForFunction(() => SolverCofre.aberto(), null, { timeout: 15000 }); await p.waitForTimeout(250); };
    const textoAberto = () => ev((peds) => {
      const tudo = []; for (const s of [localStorage, sessionStorage]) for (let i = 0; i < s.length; i++) tudo.push(s.key(i) + '=' + s.getItem(s.key(i)));
      const prefs = JSON.stringify(S.prefs || {});
      return { lugares: tudo.filter(t => peds.some(x => t.indexOf(x) !== -1) && t.indexOf('__semeado') !== 0).map(t => t.slice(0, 40)), prefs: peds.some(x => prefs.indexOf(x) !== -1) };
    }, PRIMEIRO);

    const antes = await textoAberto();
    conferir(antes.lugares.length >= 2, 'ponto de partida: os segredos antigos estão em texto aberto (' + antes.lugares.length + ' lugares)');
    await ev(() => { window.__v = 'esperando'; Keys.need('ia:gemini', { pt: 'Teste', en: 'Test' }).then(v => { window.__v = v; }, e => { window.__v = 'erro:' + e.message; }); });
    conferir(await esperarPin(), 'na primeira vez que o app precisa de uma chave, o cofre pede para criar o PIN');
    const campos = p.locator('#solver-cofre input[type=password]');
    await campos.nth(0).fill(PIN); await campos.nth(1).fill(PIN); await p.click('#solver-cofre button[type=submit]');
    await p.waitForFunction(() => window.__v !== 'esperando', null, { timeout: 15000 }); await esperar(600);
    conferir(await ev(() => window.__v) === FALSO.gemini, 'a chave antiga do Gemini chegou ao cofre e o app a recebe (ninguém perde a chave)');
    const nomes = await ev(() => SolverCofre.nomes());
    conferir(['ia:gemini', 'ia:groq', 'wx:weatherapi', 'rt:tomtom', 'telegram:omnilife-one', 'callmebot:omnilife-one:r1'].every(n => nomes.includes(n)), 'no cofre: IA, clima, trânsito, token do Telegram e apikey do WhatsApp (' + nomes.join(', ') + ')');
    const valores = await ev(() => ({ g: Keys.get('ia:gemini'), q: Keys.get('ia:groq'), w: Keys.get('wx:weatherapi'), t: Keys.get('rt:tomtom'), tg: Keys.get(TG_KEY), wa: Keys.get(WA_KEY('r1')) }));
    conferir(valores.g === FALSO.gemini && valores.q === FALSO.groq && valores.w === FALSO.clima && valores.t === FALSO.tomtom && valores.tg === FALSO.telegram && valores.wa === FALSO.whats, 'os valores no cofre são exatamente os que estavam guardados antes');
    const depois = await textoAberto();
    conferir(depois.lugares.length === 0 && !depois.prefs, 'nada de segredo em texto aberto depois (localStorage, sessionStorage e preferências em memória)' + (depois.lugares.length ? ': ' + depois.lugares.join(' | ') : ''));
    const bruto = await ev(() => localStorage.getItem('dgo:global:cofre') || '');
    conferir(bruto.length > 0 && PRIMEIRO.every(x => bruto.indexOf(x) === -1) && bruto.indexOf(PIN) === -1, 'o que fica no cofre está embaralhado (nenhum valor nem PIN em claro; só os nomes)');
    conferir(await ev(() => JSON.parse(localStorage.getItem('omnilife.prefs.v1')).alertas.recips[0].name) === 'Ana', 'o resto das preferências ficou (só os campos de segredo saíram)');

    /* ---------- 2. PIN ao abrir e ao recarregar; tranca ao sair, escondido e sem uso ---------- */
    await p.reload(); await p.waitForFunction(() => typeof SolverCofre !== 'undefined', null, { timeout: 15000 });
    conferir(await esperarPin(), 'com segredo guardado, recarregar a página pede o PIN');
    conferir(await ev(() => getComputedStyle(document.documentElement).overflow) === 'hidden', 'a janela do PIN trava a rolagem da página de trás');
    await p.keyboard.press('Escape'); await esperar(500);
    conferir(!(await aberto()) && !(await ev(() => !!document.getElementById('solver-cofre'))), '"Agora não" (Esc) deixa o cofre trancado e o app segue');
    await p.goto(p.url().split('#')[0] + '?de=novo'); await p.waitForFunction(() => typeof SolverCofre !== 'undefined', null, { timeout: 15000 });
    conferir(await esperarPin(), 'abrir o app de novo também pede o PIN');
    await digitarPin();
    conferir(await aberto(), 'o PIN certo abre o cofre');
    await p.goto(p.url().split('#')[0].replace('index.html', 'sw.js')); await esperar(300);
    await p.goto(p.url().split('#')[0].replace('sw.js', 'index.html')); await p.waitForFunction(() => typeof SolverCofre !== 'undefined', null, { timeout: 15000 });
    conferir(await esperarPin(), 'sair do app (ir para outra página) tranca: ao voltar, pede o PIN');
    await digitarPin();

    /* sem uso tranca; trabalho rodando (Modo Vigilante) só adia */
    await ev(() => ACT['gate.visitor'] && ACT['gate.visitor']()); await p.waitForFunction(() => S.booted, null, { timeout: 15000 }); await esperar(500);
    await ev(() => { Vigia.on = true; });
    await p.waitForTimeout(4200);
    conferir(await aberto(), 'com o Modo Vigilante ligado o cofre NÃO tranca por falta de uso (os alertas da vigília não esperam PIN)');
    await ev(() => { Vigia.on = false; });
    await p.waitForFunction(() => !SolverCofre.aberto(), null, { timeout: 9000 }).catch(() => {});
    conferir(!(await aberto()), 'sem Vigilante e sem uso, o cofre tranca sozinho');
    await ev(() => { window.__p = SolverCofre.pedir(); }); await esperarPin(); await digitarPin();
    await ev(() => Object.defineProperty(document, 'hidden', { configurable: true, get: () => true })); await ev(() => document.dispatchEvent(new Event('visibilitychange')));
    await p.waitForFunction(() => !SolverCofre.aberto(), null, { timeout: 9000 }).catch(() => {});
    conferir(!(await aberto()), 'com o app escondido além do prazo, o cofre tranca');
    await ev(() => { delete document.hidden; document.dispatchEvent(new Event('visibilitychange')); });
    await ev(() => { window.__p = SolverCofre.pedir(); }); await esperarPin(); await digitarPin();

    /* ---------- 3. "✓ guardado" e "Mostrar a chave guardada" ---------- */
    await ev(() => { Vigia.on = true; });   /* só para o cofre não trancar sozinho durante esta parte */
    await ev(() => { go('settings', 'ai'); }); await esperar(700);
    await ev(() => { KeyVault.open('gemini'); }); await esperar(500);
    const j = await ev(() => { const d = document.querySelector('dialog.sj[open].mback'); return d ? { vazio: d.querySelector('#vkey').value === '', guardado: /✓/.test(d.querySelector('.keyst').textContent), tipo: d.querySelector('#vkey').type, ph: d.querySelector('#vkey').placeholder } : null; });
    conferir(j && j.vazio && j.guardado && j.tipo === 'password', 'a chave guardada nunca vem para o campo: campo vazio e "✓ Guardado no cofre"');
    await p.click('dialog.sj[open] [data-act="keys.show"]');
    conferir(await esperarPin(), '"Mostrar a chave guardada" tranca o cofre e pede o PIN de novo');
    conferir(await ev(() => SolverJanela.quantas()) === 2, 'o PIN abre por cima da janela da chave');
    await digitarPin(); await esperar(400);
    const mostrou = await ev(() => { const d = document.querySelector('dialog.sj[open].mback'); return { texto: d.querySelector('[data-shown]').textContent, campo: d.querySelector('#vkey').value }; });
    conferir(mostrou.texto.indexOf(FALSO.gemini) !== -1 && mostrou.campo === '', 'depois do PIN a chave aparece num aviso de 30 s (o campo continua vazio)');
    await ev(() => { Keys._show.ate = Date.now() - 1; }); /* o prazo dos 30 s: depois dele o desenho da tela não traz mais a chave */
    conferir(await ev(() => Keys.status(true, 'ia:gemini').indexOf('mentira-gemini') === -1), 'passados os 30 s a chave some');
    /* colar uma chave e sair pergunta "Descartar?" (a chave colada conta como texto) */
    await p.fill('dialog.sj[open] #vkey', 'mentira-chave-nova-9876543210'); await p.keyboard.press('Escape'); await esperar();
    conferir(await ev(() => !!document.querySelector('.sj-pergunta[open]')), 'a chave colada e não salva pergunta "Descartar?" ao sair');
    await p.click('[data-sj=descartar]'); await esperar(450);

    /* ---------- 4. o painel da digital está na tela de chaves do módulo ---------- */
    await p.click('[data-act="cofre.tela"]'); await esperar(700);
    const painel = await ev(() => { const d = document.querySelector('dialog.sj[open] .dgo-cofre-digital'); return d ? d.textContent.trim().length : -1; });
    conferir(painel > 0, 'o painel da digital aparece na tela de chaves do módulo (texto: ' + painel + ' letras)');
    conferir(await ev(() => !!document.querySelector('dialog.sj[open].dgo-modal')), 'a tela do cofre é a janela do módulo comum');
    await p.keyboard.press('Escape'); await esperar(450);
    conferir(await ev(() => document.querySelectorAll('.dgo-cofre-digital').length) === 0, 'fora da tela de chaves do módulo não há painel da digital');

    /* ---------- 5. apikey do WhatsApp: só no cofre, campo sem a chave ---------- */
    await ev(() => { go('security', 'alertas'); }); await esperar(700);
    await ev(() => { AlertHub.editRecip('r1'); }); await esperar(500);
    const wa = await ev(() => { const d = document.querySelector('dialog.sj[open].mback'); return d ? { vazio: d.querySelector('#rwk').value === '', ph: d.querySelector('#rwk').placeholder } : null; });
    conferir(wa && wa.vazio && /cofre/.test(wa.ph), 'o campo da apikey do WhatsApp vem vazio, avisando "Guardada no cofre"');
    await p.fill('dialog.sj[open] #rwk', 'mentira-whatsapp-nova-9876543210'); await p.click('dialog.sj[open] [data-ok]'); await esperar(600);
    const novo = await ev(() => ({ cofre: Keys.get(WA_KEY('r1')), prefs: JSON.stringify(S.prefs).indexOf('mentira') !== -1, ls: (localStorage.getItem('omnilife.prefs.v1') || '').indexOf('mentira') !== -1 }));
    conferir(novo.cofre === 'mentira-whatsapp-nova-9876543210' && !novo.prefs && !novo.ls, 'a apikey nova vai para o cofre e não fica nas preferências');
    await ev(() => { Vigia.on = false; });

    conferir(lixo.nativos.length === 0, 'nenhum alert/confirm/prompt nativo (' + lixo.nativos.length + ')');
    conferir(lixo.erros.length === 0, 'nenhum erro de script' + (lixo.erros.length ? ': ' + lixo.erros.join(' | ') : ''));
    await ctx.close();
  }
  await terminar(falhas, browser, 'cofre do OmniLifeONE (Fase 3) em celular e computador.');
})().catch(e => { console.error('Erro no teste:', e.message); process.exit(1); });
