/* Teste automático: os três arquivos mestres do rootify-one estão iguais aos originais (sha256), carregam na ordem certa
   (janela.js → cofre.js → diretrizes.js → diretrizes-config.js), estão no pré-carregamento do sw.js, a versão do app
   bate nos quatro lugares e não sobrou alert(), confirm() nem prompt() do navegador no código.
   Uso: node teste/rodar.js */
const fs = require('fs'), path = require('path'), crypto = require('crypto');
const raiz = path.join(__dirname, '..');
const MESTRES = {
  'janela.js': '7f38e4d94b24c4e771a0bf52add9fa1767ba0329ab0259c5155b5bf096627ef5',   /* SolverJanela 1.0.2 */
  'cofre.js': '97ec41aee7e0bdb18bd122e4f5621a836d519979f295bceac2ddff85a5a96a2c',     /* SolverCofre 1.6.1 */
  'diretrizes.js': '20ee5f6b101e2ac833989a2c9308a482e9ef69ecaccd5f60e6508321587ef132' /* módulo 1.13.1 */
};
const falhas = [];
const conferir = (ok, msg) => { if (!ok) { falhas.push(msg); console.log('  ✗ ' + msg); } else console.log('  ✓ ' + msg); };
const ler = (f) => fs.readFileSync(path.join(raiz, f), 'utf8');

for (const [f, h] of Object.entries(MESTRES)) {
  const real = crypto.createHash('sha256').update(fs.readFileSync(path.join(raiz, f))).digest('hex');
  conferir(real === h, f + ' igual ao mestre do rootify-one (sha256 ' + h.slice(0, 12) + '…)');
}
const html = ler('index.html'), sw = ler('sw.js'), cfg = ler('diretrizes-config.js'), vj = JSON.parse(ler('versoes.json'));
const ordem = ['janela.js', 'cofre.js', 'diretrizes.js', 'diretrizes-config.js'].map(f => html.indexOf('<script src="' + f + '"></script>'));
conferir(ordem.every(i => i > 0) && ordem.every((v, i) => !i || v > ordem[i - 1]), 'ordem na página: janela.js → cofre.js → diretrizes.js → diretrizes-config.js');
conferir(['janela.js', 'cofre.js', 'diretrizes.js', 'diretrizes-config.js'].every(f => sw.indexOf('"./' + f + '"') > 0), 'os quatro arquivos estão no pré-carregamento do sw.js');
const vApp = (html.match(/const APP_VERSION = "([^"]+)"/) || [])[1];
conferir(vApp && cfg.indexOf("versaoApp: '" + vApp + "'") > 0 && vj[0].v === vApp && html.indexOf('const VERSOES_EMB = [{"v": "' + vApp + '"') > 0, 'a versão ' + vApp + ' bate no index.html, no diretrizes-config.js, no versoes.json e na cópia embutida');
conferir(/cofre: \{\s*proteger: true/.test(cfg), 'cofre: { proteger: true } no diretrizes-config.js');
/* nada de janela nativa: só definições de método (ex.: "  prompt(kind) {") passam */
const nativos = [];
html.split('\n').forEach((l, i) => { if (/(^|[^.\w$])(alert|confirm|prompt)\(/.test(l) && !/^\s+(alert|confirm|prompt)\([^)]*\)\s*\{/.test(l)) nativos.push((i + 1) + ': ' + l.trim().slice(0, 80)); });
conferir(!nativos.length, 'nenhum alert(), confirm() ou prompt() do navegador no index.html' + (nativos.length ? ' — achei ' + nativos.join(' | ') : ''));
conferir(!/MutationObserver\(\(ms\) => ms\.forEach\(\(m\) => m\.removedNodes/.test(html) && !/#layer/.test(html), 'o observador antigo das janelas (#layer) saiu');
if (falhas.length) { console.log('\nFALHOU:\n - ' + falhas.join('\n - ')); process.exit(1); }
console.log('\nOK: mestres iguais, ordem e sw.js certos, sem janela nativa.');
