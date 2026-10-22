/* Roda os testes automáticos do OmniLifeONE no computador.
   1) sobe um servidor de arquivos simples (só leitura) na porta 8098 (ou na PORTA=… pedida)
   2) roda cada arquivo de teste desta pasta: mestres.js, janelas-omni.js, cofre-omni.js
   Precisa do Playwright uma vez:  npm install -D playwright && npx playwright install chromium
   (num computador onde o Playwright já está instalado em outro lugar: NODE_PATH=<pasta dos node_modules>)  */
const { spawn } = require('child_process');
const http = require('http'), fs = require('fs'), path = require('path');
const raiz = path.join(__dirname, '..');
const PORTA = process.env.PORTA || '8098', BASE = 'http://localhost:' + PORTA;
try { require.resolve('playwright'); } catch (e) {
  console.error('Falta o Playwright. Rode uma vez, na pasta do OmniLifeONE:\n  npm install -D playwright\n  npx playwright install chromium');
  process.exit(2);
}
const TIPOS = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8', '.css': 'text/css', '.png': 'image/png', '.webmanifest': 'application/manifest+json' };
const servidor = http.createServer((req, res) => {
  let f = path.normalize(decodeURIComponent(req.url.split('?')[0])).replace(/^(\.\.[/\\])+/, '');
  if (f.endsWith(path.sep) || f === '.') f = path.join(f, 'index.html');
  const arq = path.join(raiz, f);
  if (!arq.startsWith(raiz)) { res.writeHead(403); return res.end(); }
  fs.readFile(arq, (e, d) => {
    if (e) { res.writeHead(404); return res.end(); }
    res.writeHead(200, { 'Content-Type': TIPOS[path.extname(arq)] || 'application/octet-stream', 'Cache-Control': 'no-store' }); res.end(d);
  });
}).listen(PORTA, async () => {
  /* um item pode ser [arquivo, argumentos...]: o sql-grants.js (sem navegador) recebe a pasta dos scripts SQL */
  const testes = [['sql-grants.js', 'supabase'], 'mestres.js', 'janelas-omni.js', 'cofre-omni.js'];
  let falhou = false;
  for (const t of testes) {
    const [arq, ...args] = Array.isArray(t) ? t : [t];
    console.log('\n▶ ' + arq);
    /* spawn (e não spawnSync): o servidor mora neste mesmo processo e precisa continuar respondendo enquanto o teste roda */
    const codigo = await new Promise((fim) => spawn(process.execPath, [path.join(__dirname, arq)].concat(args), { stdio: 'inherit', cwd: raiz, env: Object.assign({}, process.env, { BASE: BASE }) }).on('exit', fim));
    if (codigo !== 0) falhou = true;
  }
  servidor.close();
  process.exit(falhou ? 1 : 0);
});
