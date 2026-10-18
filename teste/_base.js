/* Ajudantes comuns dos testes do OmniLifeONE. Só valores de mentira: nenhuma chave, token ou senha de verdade. */
const { chromium } = require('playwright');
const BASE = process.env.BASE || 'http://localhost:8098';
const VP = { celular: { width: 390, height: 844 }, computador: { width: 1280, height: 800 } };

function criarConferir() {
  const falhas = [];
  const conferir = (ok, msg) => { if (!ok) { falhas.push(msg); process.stdout.write('  ✗ ' + msg + '\n'); } else process.stdout.write('  ✓ ' + msg + '\n'); };
  return { falhas, conferir };
}
/* abre o app em modo visitante (dados de mentira na memória), sem o anúncio de entrada e vigiando diálogos nativos */
async function abrirApp(browser, nome, opcoes) {
  opcoes = opcoes || {};
  const vp = VP[nome];
  const ctx = opcoes.ctx || await browser.newContext({ viewport: vp, hasTouch: nome === 'celular', serviceWorkers: 'block', locale: 'pt-BR' });
  const p = await ctx.newPage();
  const lixo = { nativos: [], erros: [] };
  p.on('dialog', d => { lixo.nativos.push(d.type() + ': ' + d.message()); d.dismiss().catch(() => {}); });
  p.on('pageerror', e => lixo.erros.push(e.message));
  if (!opcoes.anuncio) await p.addInitScript(() => {
    try { sessionStorage.setItem('omnilife.pop.depois', String(Date.now())); sessionStorage.setItem('omnilife.pop.antes', '1'); } catch (e) {}
  });
  if (opcoes.antes) await p.addInitScript(opcoes.antes, opcoes.antesArg);
  await p.goto(BASE + '/index.html');
  await p.waitForFunction(() => typeof S !== 'undefined' && typeof ACT !== 'undefined' && window.SolverJanela, null, { timeout: 15000 });
  if (!opcoes.semEntrar) {
    await p.evaluate(() => ACT['gate.visitor']());
    await p.waitForFunction(() => S.booted, null, { timeout: 15000 });
    await p.waitForTimeout(400);
  }
  return { ctx, p, lixo };
}
async function iniciar() { return chromium.launch({ executablePath: process.env.CHROME || undefined }); }
async function terminar(falhas, browser, ok) {
  await browser.close();
  if (falhas.length) { console.log('\nFALHOU:\n - ' + falhas.join('\n - ')); process.exit(1); }
  console.log('\nOK: ' + ok);
}
module.exports = { BASE, VP, criarConferir, abrirApp, iniciar, terminar };
