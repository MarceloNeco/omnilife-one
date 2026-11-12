/* ⚙ → "🔐 Segurança e aparelhos" (2.26.0, etapa 8) e os textos para leigo, no "Supabase de mentira" (teste/mock-sol.js):
   nada vai para a internet nem para o Supabase de verdade. Confere:
     S1  a ordem: seus dados, PIN e digital, seus aparelhos, sair, avançado (PT e EN)
     S2  a grade: computador (1280 e 1024) 2 colunas sem nenhuma linha com coluna vazia ao lado (também no "só neste aparelho");
         390 px uma coluna; 320 px sem rolar para o lado; alvos de toque (nada menor que 24 px; "Avançado" e os links soltos com 44)
     S3  fora do "Avançado" (fechado), nenhum jargão: passkey, desconectar, cifrad, criptograf, token, robô, "registros fechados",
         "código de recuperação", "Fechar agora" (e os do inglês) — PT e EN
     S4  "Criar o PIN da conta" OU "Trocar o PIN" conforme a conta (nunca os dois); os pedidos de acesso só quando existem (na página
         e no 👤); o grupo "Android · Chrome · MoneyTRIO e OmniLifeONE"; "Este computador: …" (K24: o rótulo neutro do kit)
     S4b dois aparelhos do OmniLifeONE com o mesmo nome deste: o outro é um grupo à parte (K20), "Tirar" não toca este; este aparelho
         não tem "Tirar" na lista (nem chamando direto); a confirmação cita os apps
     S5  com os interruptores "seguranca" e "casa.senhas" desligados, a página abre e os botões funcionam (todos conta.*)
     S6  o menu do 👤: "🔐 Segurança e aparelhos" logo antes de "Sair" (vermelho e por último)
     S7  "só neste aparelho" sem conta: o cartão "🔒 Segurança" de ⚙ → Geral como antes (K30), sem a página; com a conta: só seus
         dados, PIN e digital do perfil, e sair
     D3  desta página: "Sair" sai de verdade; Avançado → "Tirar este aparelho" confirma, sai e apaga o cadeado daqui
     D4  "Começar do zero" só quando não há outro caminho (K21), com duas confirmações e o aviso do código de emergência; cancelar
         ou PIN errado não muda nada; o par novo nasce SÓ por aqui (chamar direto fora do beco é recusado)
     R3  (revisão 3) não é beco: a digital em todos os aparelhos na conta (mesmo sem leitor aqui) e a digital deste aparelho; com o
         cadeado aqui, o PIN que o abre (pelo PIN da conta guardado aqui ou pelo PIN daqui) não troca nada no "Começar do zero"
     M   (revisão 3, telas) quem não é chefe nem responsável: sem "ainda não está na lista", sem "o PIN da conta" para entrar de novo
         e sem "peça a aprovação" (na página e na confirmação de "Tirar este aparelho"), PT e EN
     e: "🔒 Bloquear agora" em todos os lugares (Senhas da casa, emergência, chaves de IA, "só neste aparelho" com a senha principal),
        sem "Fechar"/"Trancar o cofre agora"; o cartão da conta limpo; ⚙ → Geral leva à página; "📱 Aparelhos da família" e "Tirar";
        a ajuda; a Saúde → MoneyTRIO sem "cifrado"; os rótulos do histórico (K33) e "pin.criado"/"pin.trocado" gravados
     sem erro de script, sem diálogo nativo, nada fora do banco de mentira, nenhum PIN no console nem no histórico
   Prints em 1280 e 390 px (PT e EN) em PRINTS=<pasta> (sem a variável, não grava).
   Pessoas, senhas, PINs e chaves de mentira. Uso: node teste/rodar.js   ·   sozinho: BASE=http://localhost:8099 node teste/seguranca-aparelhos-omni.js */
const crypto = require('crypto'), fs = require('fs'), path = require('path');
const { BASE, criarConferir, iniciar, terminar } = require('./_base');
const { db, rpcs, prepararChaves, compromisso, agora, b64u, ANA, BIA, CRIS, DAVI, GID } = require('./mock-sol');
const { aparelho, entrarOmni, senhasDaCasa, cadeado225 } = require('./_nuvem');

const PIN_225 = '736251', PIN_A = '590317', PIN_B = '482915', PIN_X = '615048', PINS = [PIN_225, PIN_A, PIN_B, PIN_X];
const CHAVE = 'mentira-groq-seguranca-0123456789';   /* chave de IA de mentira */
const PRINTS = process.env.PRINTS || '';
const espere = (ms) => new Promise((r) => setTimeout(r, ms));
async function ate(fn, ms) { const fim = Date.now() + (ms || 8000); while (Date.now() < fim) { if (fn()) return true; await espere(100); } return !!fn(); }
const toasts = (p) => p.evaluate(() => document.querySelector('#toasts').textContent);
const naTela = (p, sel) => p.evaluate((s) => !!document.querySelector(s), sel);
const linhasDe = (uid) => db.sol_aparelhos.filter((a) => a.user_id === uid && !a.removido_em);
const quieto = (p) => p.evaluate(() => { AOne.save({ hello: 1, tour: 1, tips: Object.assign({}, AOne.cfg().tips, { home: 1, settings: 1, house: 1, family: 1 }) }); if (AOne.view) AOne.close(); lsSet(GuiaCofre.K, Date.now()); });
const naEntrada = (p, ms) => p.waitForFunction(() => typeof S !== 'undefined' && S.gate === 'welcome' && !!document.querySelector('#screen .gate'), null, { timeout: ms || 25000 }).then(() => true, () => false);
const continuarComo = (p) => naTela(p, '[data-act="conta.continuar"]');
const janela = (p, re, ms) => p.waitForFunction((re) => [...document.querySelectorAll('.modal')].some((m) => new RegExp(re).test(m.innerText)), re.source, { timeout: ms || 10000 }).then(() => true, () => false);
const textoJanelas = (p) => p.evaluate(() => [...document.querySelectorAll('.modal')].map((m) => m.innerText).join(' | '));
const vigiarPares = (p) => p.evaluate(() => { window.__pares = 0; const f = Cofre.novoPar; Cofre.novoPar = function () { window.__pares++; return f.apply(this, arguments); }; });
const pubDe = (uid) => JSON.stringify((db.sol_chave_publica.find((k) => k.user_id === uid) || {}).chave_publica || null);
/* a página "Segurança e aparelhos" desenhada e com o que vem da internet (o PIN, a lista e o avançado) já no lugar */
async function pagina(p) {
  await p.evaluate(() => { closeModals(); Jornada.limpar(); TelaConta._pag = null; go('settings', 'conta'); });   /* sem o que estava na tela antes */
  await p.waitForFunction(() => S.route && S.route.sub === 'conta' && document.querySelector('.segap') && !/Carregando|Loading/.test(document.querySelector('.segap').innerText), null, { timeout: 20000 });
}
const texto = (p) => p.evaluate(() => document.querySelector('#screen').innerText);
const ordem = (p) => p.evaluate(() => [...document.querySelectorAll('.segap > section, .segap > details')].map((e) => e.id).join(','));
const ORDEM = 'segDados,segPin,segAps,segSair,segAvancado';
/* revisão 3 (telas): as linhas da grade que NÃO chegam à borda direita (uma coluna vazia ao lado = a largura sem uso) */
const buracos = (p) => p.evaluate(() => {
  const g = document.querySelector('.segap'), dir = g.getBoundingClientRect().right, linhas = {};
  [...g.children].forEach((e) => { const r = e.getBoundingClientRect(), k = Math.round(r.top); linhas[k] = Math.max(linhas[k] || 0, r.right); });
  return Object.values(linhas).filter((r) => r < dir - 2).length;
});
/* revisão 3 (telas): os alvos de toque da página menores que o pedido (todos ≥ 24 px; "Avançado" e os links soltos ≥ 44 px) */
const alvosPequenos = (p) => p.evaluate(() => [...document.querySelectorAll('#segPedidos button, .segap button, .segap summary, .segap a, .segap select')].map((b) => {
  const r = b.getBoundingClientRect(), min = b.tagName === 'SUMMARY' || b.classList.contains('linkbtn') ? 44 : 24;
  return r.width && (r.height < min || r.width < 24) ? (b.innerText || b.tagName).replace(/\s+/g, ' ').trim().slice(0, 30) + ' (' + Math.round(r.height) + ' px)' : '';
}).filter(Boolean));
/* revisão 3 (telas): o menor espaço entre dois botões seguidos de um item do Avançado (0 = colados, um encostado no outro) */
const colados = (p, sel) => p.evaluate((sel) => {
  const bs = [...document.querySelectorAll(sel)].map((b) => b.getBoundingClientRect()).filter((r) => r.width);
  let m = 99;
  for (let i = 1; i < bs.length; i++) { const a = bs[i - 1], b = bs[i]; m = Math.min(m, a.bottom > b.top + 1 ? b.left - a.right : b.top - a.bottom); }
  return Math.round(m);
}, sel);
const JARGAO_PT = /passkey|desconect|cifrad|criptograf|token|robô|registros fechados|código de recuperação|Fechar agora/i;
const JARGAO_EN = /passkey|disconnect|encrypt|cipher|token|robot|closed records|recovery code|close now/i;
/* o menu do 👤: os itens (texto e classe), na ordem */
async function menuItens(p) {
  await p.click('#whoami'); await p.waitForSelector('.whomenu button[data-i]', { timeout: 8000 });
  return p.evaluate(() => [...document.querySelectorAll('.whomenu button[data-i]')].map((b) => ({ t: b.innerText.replace(/\s+/g, ' ').trim(), danger: b.classList.contains('danger') })));
}
async function fecharMenu(p) { await p.keyboard.press('Escape'); await p.waitForSelector('.whomenu', { state: 'detached', timeout: 5000 }).catch(() => {}); }
async function foto(p, nome) { if (!PRINTS) return; fs.mkdirSync(PRINTS, { recursive: true }); await p.evaluate(() => { document.querySelector('#toasts').innerHTML = ''; }); await espere(300); await p.screenshot({ path: path.join(PRINTS, nome), fullPage: true }); }
/* um pedido de acesso de outro aparelho da Ana (feito aqui no Node, como um celular novo faria) */
async function pedidoDe(uid, nome, app) {
  const k = await crypto.webcrypto.subtle.generateKey({ name: 'ECDH', namedCurve: 'P-256' }, true, ['deriveBits']), j = await crypto.webcrypto.subtle.exportKey('jwk', k.publicKey);
  const pub = { kty: 'EC', crv: 'P-256', x: j.x, y: j.y }, nB = b64u(crypto.randomBytes(32));
  return rpcs.sol_pedido_criar(uid, { p_nome: nome, p_app: app, p_pub: pub, p_compromisso: compromisso(pub, nB), p_grupo: null });
}
const linhaFalsa = (nome, app, seg) => ({ id: crypto.randomUUID(), user_id: ANA, nome, app, como: 'aparelho', aprovado_por: ANA, aprovado_por_ap: null,
  criado_em: new Date(Date.now() + (seg || 0) * 1000).toISOString(), visto_em: agora(), removido_em: null, removido_por: null });

(async () => {
  const browser = await iniciar();
  const { falhas, conferir } = criarConferir();
  await prepararChaves();
  const lixos = [];

  /* ================= A: o computador da Ana, com as Senhas da casa (o cadeado como a 2.25 gravava) e uma chave de IA ================= */
  console.log('A. O computador da Ana: a página "Segurança e aparelhos"');
  const A = await aparelho(browser, { nome: 'Ana-computador', vp: 'computador', base: BASE }), a = A.p; lixos.push(A.lixo);
  await entrarOmni(a, ANA); await quieto(a);
  await a.evaluate(() => { Sol.ligadoAp = false; Sol.ligadoPin = false; });
  await senhasDaCasa(a); await cadeado225(a, ANA, PIN_225);
  await a.evaluate(() => { Sol.ligadoAp = null; Sol.ligadoPin = null; });
  await a.evaluate(() => Aparelhos.registrar());
  const salvando = a.evaluate((c) => Keys.set('groq', c, { pt: 'teste', en: 'test' }).then(() => 'ok', (e) => e.message), CHAVE);
  await a.waitForSelector('.modal #upin', { timeout: 8000 }); await a.fill('#upin', PIN_225); await a.click('.modal:has(#upin) [data-ok]');
  const apA = await a.evaluate(async () => (await Cofre.local()).ap);
  conferir(await salvando === 'ok' && !!apA && linhasDe(ANA).length === 1 && linhasDe(ANA)[0].como === 'primeiro', 'preparo: Senhas da casa abertas, este computador na lista da conta ("primeiro") e uma chave de IA');

  /* S6: o menu do 👤 */
  const m6 = await menuItens(a), i6 = m6.findIndex((x) => /Segurança e aparelhos/.test(x.t));
  conferir(i6 >= 0 && i6 === m6.length - 2 && /^🚪 Sair$/.test(m6[m6.length - 1].t) && m6[m6.length - 1].danger && !m6[i6].danger,
    'S6. o menu do 👤 tem "🔐 Segurança e aparelhos" logo antes de "Sair" (vermelho e por último): ' + m6.map((x) => x.t).join(' | '));
  await a.click('.whomenu button[data-i]:has-text("Segurança e aparelhos")');
  await a.waitForFunction(() => S.route && S.route.tab === 'settings' && S.route.sub === 'conta' && document.querySelector('.segap'), null, { timeout: 10000 });
  conferir(/#\/settings\/conta/.test(a.url()), 'S6. o item do 👤 abre ⚙ → Segurança e aparelhos (#/settings/conta)');

  /* S1, S4 (conta sem PIN), S3, S2 em PT */
  await pagina(a);
  conferir(await ordem(a) === ORDEM, 'S1 (PT). a ordem: seus dados, PIN e digital, seus aparelhos, sair, avançado (' + await ordem(a) + ')');
  const segs = await a.evaluate(() => [...document.querySelectorAll('#screen .seg button')].map((b) => b.dataset.sub));
  conferir(segs[0] === 'general' && segs[1] === 'conta', 'o segmento "🔐 Segurança e aparelhos" vem logo depois de "Geral" (' + segs.slice(0, 3).join(', ') + ')');
  let t = await texto(a);
  conferir(/Ana Teste/.test(t) && /ana@teste\.com/.test(t) && /Conectado desde/.test(t) && /Família Teste/.test(t) && /Chefe da família/.test(t) && /Este computador: foi o primeiro aparelho/.test(t),
    'Seus dados: nome, e-mail, "Conectado desde", família e papel, e "Este computador: foi o primeiro aparelho"');
  conferir(await naTela(a, '#segPin [data-act="conta.pin.criar"]') && !(await naTela(a, '#segPin [data-act="conta.pin.trocar"]')) && /Ainda não tem PIN da conta/.test(t),
    'S4. conta sem PIN: "Criar o PIN da conta" e NÃO "Trocar o PIN"');
  conferir(/Bloquear agora\s*\(pede o PIN ou a digital para abrir de novo\)/.test(t) && await naTela(a, '#segPin [data-act="conta.dig.ligar"]') && await naTela(a, '#segPin [data-chg="set.biolock"]') && !(await naTela(a, '#segPin [data-act="conta.pin.esqueci"]')),
    'PIN e digital: "🔒 Bloquear agora (pede o PIN ou a digital…)", a digital deste aparelho, a digital para abrir o app (sem "Esqueci o PIN" com as Senhas da casa abertas)');
  conferir(!(await a.evaluate(() => document.querySelector('#segPedidos').innerText.trim())) && !m6.some((x) => /Pedidos de acesso/.test(x.t)), 'S4. sem pedido de acesso: nada de "Pedidos de acesso" na página nem no 👤');
  conferir(!JARGAO_PT.test(t) && !(await a.evaluate(() => document.querySelector('#segAvancado').open)), 'S3 (PT). Avançado fechado e nenhum jargão à vista' + (JARGAO_PT.test(t) ? ': ' + t.match(JARGAO_PT)[0] : ''));
  const col1280 = await a.evaluate(() => getComputedStyle(document.querySelector('.segap')).gridTemplateColumns.split(' ').length);
  conferir(col1280 >= 2 && col1280 <= 3, 'S2. 1280 px: a grade usa a largura (' + col1280 + ' colunas)');
  conferir(await a.evaluate(() => document.querySelector('#segAps').getBoundingClientRect().width > document.querySelector('#segDados').getBoundingClientRect().width * 1.5), 'S2. "Seus aparelhos" ocupa a linha inteira');
  /* revisão 3 (telas): no computador nenhuma linha fica com uma coluna vazia ao lado (1280 e 1024, Avançado aberto ou não) */
  const bur = [await buracos(a)];
  await a.evaluate(() => { document.querySelector('#segAvancado').open = true; }); bur.push(await buracos(a));
  await a.setViewportSize({ width: 1024, height: 800 }); await pagina(a); bur.push(await buracos(a));
  await a.setViewportSize({ width: 1280, height: 800 }); await a.evaluate(() => { TelaConta._avAberto = false; }); await pagina(a);
  conferir(bur.every((n) => n === 0), 'S2. 1280 e 1024 px: a grade usa a largura toda — nenhuma linha com uma coluna vazia ao lado (' + bur.join(', ') + ')');
  conferir(!(await alvosPequenos(a)).length, 'alvos de toque: nada menor que 24 px; "Avançado" e os links soltos com 44 px' + ((await alvosPequenos(a)).length ? ': ' + (await alvosPequenos(a)).join(' · ') : ''));
  /* D4: com as Senhas da casa abertas aqui e outros caminhos (a Bia, o kit), nada de "Começar do zero" — nem chamando direto */
  await vigiarPares(a);
  const zA = await a.evaluate((pin) => Cofre.criarConta(pin, true), PIN_X);
  conferir(!(await naTela(a, '#segZero')) && zA.erro === 'naoPode' && await a.evaluate(() => window.__pares) === 0, 'D4. fora do beco: sem "Começar do zero" em Avançado, e chamar direto é recusado (nenhum par novo)');

  /* ⚙ → Geral (K30 na nuvem) e o cartão da conta limpo */
  await a.evaluate(() => go('settings')); await a.waitForSelector('#screen [data-act="signout"]', { timeout: 10000 });
  const geral = await a.evaluate(() => ({ t: document.querySelector('#screen').innerText, bt: document.querySelectorAll('#screen .card [data-act="go"][data-sub="conta"]').length,
    sair: !!document.querySelector('#screen [data-act="conta.sair"], #screen [data-act="cofre.desconectar"]'), bio: !!document.querySelector('#screen [data-chg="set.biolock"]') }));
  conferir(/Conectado como ana@teste\.com/.test(geral.t) && !/Sair da conta neste aparelho|Desconectar|Sair: fecha as Senhas da casa|Vale em todos os apps/.test(geral.t) && !geral.sair && geral.bt === 2 && !geral.bio,
    'Conta.card limpo ("Conectado como … · desde …" + botão) e o cartão "🔒 Segurança" vira o botão para a página (a digital do app vai para lá)');

  /* "🔒 Bloquear agora" em todos os lugares */
  await senhasDaCasa(a);
  const casa = await a.evaluate(() => ({ t: document.querySelector('#screen').innerText, lock: !!document.querySelector('#screen [data-act="vault.lock"]'), bloq: !!document.querySelector('#screen [data-act="conta.bloquear"]'),
    velho: !!document.querySelector('#screen [data-act="cofre.codigo"], #screen [data-act="cofre.desconectar"]'), atalho: !!document.querySelector('#screen [data-act="go"][data-sub="conta"]') }));
  conferir(casa.bloq && !casa.lock && /Bloquear agora\s*\(pede o PIN ou a digital para abrir de novo\)/.test(casa.t) && !/🔒 Fechar\b/.test(casa.t), 'Senhas da casa abertas: "🔒 Bloquear agora (pede o PIN ou a digital…)" no lugar de "🔒 Fechar"');
  conferir(!casa.velho && casa.atalho && !/código de recuperação|Desconectar/.test(casa.t), 'Senhas da casa → Opções: sem "código de recuperação" nem "Desconectar"; com o atalho para "Segurança e aparelhos"');
  const emerg = await a.evaluate(() => { const g = window.isGuardian; window.isGuardian = () => false; try { return Cofre.view(); } finally { window.isGuardian = g; } });
  conferir(/data-act="conta.bloquear"/.test(emerg) && /pede o código de emergência para abrir de novo/.test(emerg) && !/vault\.lock/.test(emerg), 'Senhas da casa de emergência (quem não é responsável): "Bloquear agora (pede o código de emergência…)"');
  const keys = await a.evaluate(() => Keys.status(true, 'groq'));
  conferir(/data-act="conta.bloquear"/.test(keys) && /Bloquear agora/.test(keys) && !/Trancar o cofre agora|cofre\.lock/.test(keys), '⚙ → IA (chaves): "🔒 Bloquear agora" no lugar de "Trancar o cofre agora"');
  const fonte = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  conferir(!/tt\("Trancar o cofre agora"|🔒 ' \+ tt\("Fechar", "Close"\)|Conta SolverONE desconectada/.test(fonte), 'no app inteiro: nenhum "🔒 Fechar", "Trancar o cofre agora" nem "Conta SolverONE desconectada"');

  /* PIN da conta pela página: criar (então só "Trocar"), trocar; o histórico ganha "pin.criado" e "pin.trocado" (com rótulo, sem PIN) */
  await pagina(a);
  const h0 = db.omni_historico.length;
  await a.click('#segPin [data-act="conta.pin.criar"]'); await a.waitForSelector('.modal #pcP1', { timeout: 8000 });
  await a.fill('#pcP1', PIN_A); await a.fill('#pcP2', PIN_A); await a.click('.modal #pcOk');
  await a.waitForSelector('.modal #pcP1', { state: 'detached', timeout: 30000 });
  await a.waitForSelector('#segPin [data-act="conta.pin.trocar"]', { timeout: 15000 }).catch(() => {});
  t = await texto(a);
  conferir(await naTela(a, '#segPin [data-act="conta.pin.trocar"]') && !(await naTela(a, '#segPin [data-act="conta.pin.criar"]')) && /PIN da conta: criado/.test(t), 'S4. criado pela página: agora "Trocar o PIN" e NÃO "Criar o PIN da conta"');
  await a.click('#segPin [data-act="conta.pin.trocar"]'); await a.waitForSelector('.modal #pcAtual', { timeout: 8000 });
  await a.fill('#pcAtual', PIN_A); await a.fill('#pcP1', PIN_B); await a.fill('#pcP2', PIN_B); await a.click('.modal #pcOk');
  await a.waitForSelector('.modal #pcAtual', { state: 'detached', timeout: 30000 });
  const hist = db.omni_historico.slice(h0);
  conferir(hist.some((x) => x.acao === 'pin.criado') && hist.some((x) => x.acao === 'pin.trocado') && !hist.some((x) => PINS.some((k) => JSON.stringify(x).includes(k))),
    'K33. "pin.criado" e "pin.trocado" no histórico da família (sem PIN nenhum)');
  const rot = await a.evaluate(() => ['aparelho.recusado', 'aparelho.tirado', 'aparelho.aprovado', 'pin.criado', 'pin.trocado', 'kit.ligado', 'kit.desligado', 'aparelho.desconectado'].map((k) => [k, AUDIT_TXT(k)]));
  conferir(rot.every(([k, v]) => v && v !== k && !/desconect/i.test(v)), 'K33. rótulos PT do histórico para as ações novas: ' + rot.map((x) => x[1]).join(' · '));
  await a.evaluate(() => { const d = document.createElement('div'); d.id = 'teste-hist'; document.body.appendChild(d); });

  /* S4/S4b: a lista agrupada por nome, uma linha por app (K20) */
  const X3 = linhaFalsa('Linux · Chrome', 'omnilife', 1), X1 = linhaFalsa('Android · Chrome', 'omnilife', 2), X2 = linhaFalsa('Android · Chrome', 'moneytrio', 3);
  db.sol_aparelhos.push(X3, X1, X2);
  const idPed = await pedidoDe(ANA, 'Android · Chrome', 'moneytrio');
  await a.evaluate(async () => { for (let i = 0; i < 80 && Aparelhos._olhando; i++) await new Promise((r) => setTimeout(r, 100)); Aparelhos._vistos = {}; await Aparelhos.olharPedidos(); });
  await pagina(a);
  const lista = await a.evaluate(() => [...document.querySelectorAll('#segApsC .li')].map((li) => ({ t: li.querySelector('.t').innerText.replace(/\s+/g, ' ').trim(), tirar: !!li.querySelector('[data-act="conta.ap.tirar"]') })));
  conferir(lista.length === 3 && lista[0].t === 'Linux · Chrome · OmniLifeONE (este aparelho)' && !lista[0].tirar, 'S4b. este aparelho primeiro, "(este aparelho)" e SEM "Tirar" na lista: ' + lista.map((x) => x.t).join(' | '));
  conferir(lista.some((x) => x.t === 'Android · Chrome · MoneyTRIO e OmniLifeONE' && x.tirar), 'S4. o grupo "Android · Chrome · MoneyTRIO e OmniLifeONE" (o mesmo aparelho nos dois apps), com "Tirar"');
  conferir(lista.filter((x) => /^Linux · Chrome · OmniLifeONE$/.test(x.t) && x.tirar).length === 1, 'S4b. outro computador do OmniLifeONE com o MESMO nome deste é outro grupo, com "Tirar" (K20: uma linha por app num grupo)');
  t = await texto(a);
  conferir(/🔔 Pedidos de acesso \(1\)/.test(t) && await naTela(a, '#segPedidos [data-act="conta.ap.ver"]'), 'S4. com um pedido: "🔔 Pedidos de acesso (1)" no alto da página, com "Ver"');
  const m4 = await menuItens(a); await fecharMenu(a);
  conferir(m4.some((x) => /Pedidos de acesso \(1\)/.test(x.t)), 'S4. e no 👤: "🔔 Pedidos de acesso (1)"');
  await foto(a, 'seguranca-1280-pt.png');
  await a.click('#segPedidos [data-act="conta.ap.ver"]');
  conferir(await janela(a, /Pedido de acesso/), 'o "Ver" da página abre o pedido (a mesma tela de quem aprova)');
  await a.click('.modal #apDepois').catch(() => a.evaluate(() => closeModals()));
  await a.waitForSelector('.modal', { state: 'detached', timeout: 8000 }).catch(() => {});

  /* EN: S1, S3, os rótulos; prints em 1280 e 390 */
  await a.evaluate(() => setLang('en')); await pagina(a);
  t = await texto(a);
  conferir(await ordem(a) === ORDEM && /Your data/.test(t) && /PIN and fingerprint/.test(t) && /Your devices/.test(t) && /Sign out/.test(t) && /Advanced/i.test(t), 'S1 (EN). a mesma ordem, em inglês');
  conferir(!JARGAO_EN.test(t) && !JARGAO_PT.test(t), 'S3 (EN). nenhum jargão à vista' + (JARGAO_EN.test(t) ? ': ' + t.match(JARGAO_EN)[0] : ''));
  conferir(/Lock now\s*\(asks for the PIN or fingerprint to open again\)/.test(t) && /Change PIN/.test(t) && /Access requests \(1\)/.test(t) && /Android · Chrome · MoneyTRIO and OmniLifeONE/.test(t), 'EN: "Lock now", "Change PIN", "Access requests (1)", "MoneyTRIO and OmniLifeONE"');
  const rotEN = await a.evaluate(() => ['pin.criado', 'pin.trocado', 'kit.ligado', 'kit.desligado', 'aparelho.recusado'].map((k) => AUDIT_TXT(k)));
  conferir(rotEN.every((v) => /[A-Za-z]/.test(v) && !/\./.test(v)) && /PIN/.test(rotEN[0]), 'K33. rótulos EN: ' + rotEN.join(' · '));
  await foto(a, 'seguranca-1280-en.png');
  await a.setViewportSize({ width: 390, height: 844 }); await pagina(a);
  const col390 = await a.evaluate(() => getComputedStyle(document.querySelector('.segap')).gridTemplateColumns.split(' ').length);
  conferir(col390 === 1, 'S2. 390 px: uma coluna (' + col390 + ')');
  await foto(a, 'seguranca-390-en.png');
  await a.evaluate(() => setLang('pt')); await pagina(a);
  await foto(a, 'seguranca-390-pt.png');
  await a.setViewportSize({ width: 320, height: 700 }); await pagina(a);
  const rola = await a.evaluate(() => ({ sw: document.scrollingElement.scrollWidth, cw: document.scrollingElement.clientWidth, larga: [...document.querySelectorAll('.segap *')].filter((e) => e.getBoundingClientRect().right > document.documentElement.clientWidth + 1).length }));
  conferir(rola.sw <= rola.cw && !rola.larga, 'S2. 320 px: sem rolar para o lado (' + rola.sw + ' ≤ ' + rola.cw + ')');
  await a.evaluate(() => { document.querySelector('#segAvancado').open = true; });
  await foto(a, 'seguranca-320-pt-avancado.png');
  await a.setViewportSize({ width: 1280, height: 800 }); await pagina(a);
  await a.evaluate(() => { document.querySelector('#segAvancado').open = true; });
  await foto(a, 'seguranca-1280-pt-avancado.png');
  const av = await a.evaluate(() => document.querySelector('#segAvancado').innerText);
  conferir(/Tirar este aparelho da conta/.test(av) && /Kit de emergência \(código de recuperação\)/.test(av) && /Ligado: há uma cópia/.test(av) && /nem a SolverONE lê/.test(av) && !/Começar do zero/.test(av),
    'Avançado: "Tirar este aparelho da conta", o kit (ligado: a Ana tem o código antigo), como fica guardado; sem "Começar do zero" (há outros caminhos)');
  const gk = [await colados(a, '#segKit .btn')];
  await a.setViewportSize({ width: 320, height: 700 }); await pagina(a); await a.evaluate(() => { document.querySelector('#segAvancado').open = true; }); gk.push(await colados(a, '#segKit .btn'));
  await a.setViewportSize({ width: 1280, height: 800 }); await pagina(a); await a.evaluate(() => { document.querySelector('#segAvancado').open = true; });
  conferir(gk.every((n) => n >= 6), 'Avançado → kit ligado: "Fazer um código novo" e "Desligar" separados (não colados um no outro), em 1280 e 320 px (' + gk.join(', ') + ' px)');
  conferir(/entre e peça a aprovação/.test(av) && /Para entrar de novo: e-mail e senha \(ou Google\) e o PIN da conta/.test(await texto(a)),
    'chefe/responsável: "Sair" lembra o PIN da conta e "Tirar este aparelho" diz para pedir a aprovação (o membro não vê isso — bloco M)');
  await a.evaluate(() => { document.querySelector('#segAvancado').open = false; TelaConta._avAberto = false; });

  /* o pedido recusado: some da página */
  rpcs.sol_pedido_recusar(ANA, { p_id: idPed });
  await a.evaluate(async () => { for (let i = 0; i < 80 && Aparelhos._olhando; i++) await new Promise((r) => setTimeout(r, 100)); await Aparelhos.olharPedidos(); });
  conferir(!(await a.evaluate(() => document.querySelector('#segPedidos').innerText.trim())), 'S4. o pedido respondido: "Pedidos de acesso" some da página');

  /* S4b: "Tirar" o outro computador com o mesmo nome deste: este fica */
  const h1 = db.omni_historico.length;
  const iX3 = await a.evaluate(() => TelaConta._grupos.findIndex((g) => !g.este && g.nome === 'Linux · Chrome'));
  await a.click('#segApsC [data-act="conta.ap.tirar"][data-i="' + iX3 + '"]');
  await a.waitForSelector('.modal [data-yes]', { timeout: 8000 });
  const perg = await textoJanelas(a);
  await a.click('.modal [data-yes]');
  await a.waitForFunction(() => /Aparelho tirado da sua conta/.test(document.querySelector('#toasts').textContent), null, { timeout: 10000 }).catch(() => {});
  conferir(/Tirar este aparelho \(Linux · Chrome\) da sua conta, no OmniLifeONE\?/.test(perg) && !!X3.removido_em && linhasDe(ANA).some((x) => x.id === apA) && !X1.removido_em && !X2.removido_em,
    'S4b. "Tirar" o outro computador com o mesmo nome: confirma citando o app; só ele sai — ESTE aparelho continua na lista');
  conferir(db.omni_historico.slice(h1).some((x) => x.acao === 'aparelho.tirado'), 'K33. "Tirar" fica no histórico da família ("aparelho.tirado")');
  const direto = await a.evaluate(async () => { const g = (await Aparelhos.lista()).find((x) => x.este); return Promise.race([Aparelhos.tirarGrupo(g), new Promise((r) => setTimeout(() => r('perguntou'), 3000))]); });
  if (direto !== false) await a.click('.modal [data-no]').catch(() => {});
  conferir(direto === false && linhasDe(ANA).some((x) => x.id === apA) && !(await naTela(a, '.modal')), 'S4b. tirar o grupo DESTE aparelho pela lista é recusado (só em Avançado), sem perguntar nada');
  await pagina(a);
  const iX = await a.evaluate(() => TelaConta._grupos.findIndex((g) => g.nome === 'Android · Chrome'));
  await a.click('#segApsC [data-act="conta.ap.tirar"][data-i="' + iX + '"]');
  await a.waitForSelector('.modal [data-yes]', { timeout: 8000 });
  const perg2 = await textoJanelas(a);
  await a.click('.modal [data-yes]'); await espere(800);
  conferir(/no MoneyTRIO e no OmniLifeONE\?/.test(perg2) && !!X1.removido_em && !!X2.removido_em && linhasDe(ANA).length === 1, 'S4. "Tirar" o grupo dos dois apps: a confirmação cita "no MoneyTRIO e no OmniLifeONE" e as duas linhas saem');

  /* S5: os interruptores "seguranca" e "casa.senhas" desligados (RootifyONE de mentira): a página abre e os botões funcionam */
  await a.evaluate(() => { const o = SolverRecursos.ligado; window.__ligadoOriginal = o; SolverRecursos.ligado = function (id, d) { return ['seguranca', 'casa.senhas'].includes(id) ? false : o.call(this, id, d); }; render(); });
  await pagina(a);
  const s5 = await a.evaluate(() => ({ off: !Rec.on('seguranca') && !Rec.on('casa.senhas'), presos: [...document.querySelectorAll('#segPedidos [data-act], .segap [data-act]')].filter((el) => !Rec.livre(el)).map((el) => el.dataset.act),
    acts: [...document.querySelectorAll('.segap [data-act]')].map((el) => el.dataset.act).filter((x) => x !== 'go') }));
  conferir(s5.off && !s5.presos.length && s5.acts.length >= 6 && s5.acts.every((x) => /^conta\./.test(x)), 'S5. interruptores desligados: nenhum botão da página preso (todos conta.*: ' + s5.acts.join(', ') + ')' + (s5.presos.length ? ' — presos: ' + s5.presos.join(', ') : ''));
  await a.evaluate(async () => { if (!Cofre.aberto()) await Cofre.destrancarPin('482915'); if (!SolverCofre.aberto()) await SolverCofre.abrir('482915'); });
  conferir(await a.evaluate(() => Cofre.aberto() && SolverCofre.aberto()), 'preparo: Senhas da casa e chaves de IA abertas');
  await a.click('#segPin [data-act="conta.bloquear"]');
  await a.waitForFunction(() => /Bloqueado: as Senhas da casa e as chaves de IA/.test(document.querySelector('#toasts').textContent), null, { timeout: 8000 }).catch(() => {});
  conferir(await a.evaluate(() => !Cofre.aberto() && !SolverCofre.aberto()), 'S5. com os interruptores desligados, "🔒 Bloquear agora" fecha as Senhas da casa e as chaves de IA e avisa');
  await pagina(a);
  conferir(await naTela(a, '#segPin [data-act="conta.pin.esqueci"]'), 'PIN e digital: com as Senhas da casa fechadas aparece "Esqueci o PIN"');
  await a.setViewportSize({ width: 390, height: 844 }); await pagina(a);
  const peq = await alvosPequenos(a);
  conferir(!peq.length, '390 px, Senhas da casa fechadas: "Esqueci o PIN", "Avançado" e o link da família com 44 px de alvo (nada menor que 24)' + (peq.length ? ': ' + peq.join(' · ') : ''));
  await a.setViewportSize({ width: 1280, height: 800 }); await pagina(a);
  await a.click('#segPin [data-act="conta.pin.trocar"]');
  conferir(await a.waitForSelector('.modal #pcAtual, #toasts:has-text("Abra primeiro")', { timeout: 8000 }).then(() => true, () => false), 'S5. "Trocar o PIN" responde com os interruptores desligados');
  await a.evaluate(() => { closeModals(); SolverRecursos.ligado = window.__ligadoOriginal; render(); });

  /* Família: "📱 Aparelhos da família", "Tirar", a ajuda e a Saúde → MoneyTRIO sem jargão */
  await a.evaluate(() => go('family')); await a.waitForSelector('#devcard', { timeout: 10000 });
  const fam = await a.evaluate(() => document.querySelector('#devcard').innerText);
  conferir(/Aparelhos da família/.test(fam) && !/Aparelhos conectados|Desconectar/.test(fam), 'Família: "📱 Aparelhos da família" (sem "Aparelhos conectados" nem "Desconectar")');
  await a.evaluate(() => { ACT['dev.rm']({ id: 'x' }); }); await a.waitForSelector('.modal [data-yes]', { timeout: 8000 });
  const rm = await textoJanelas(a), rmSim = await a.evaluate(() => document.querySelector('.modal [data-yes]').innerText); await a.click('.modal [data-no]');
  conferir(/Tirar este aparelho da família\?/.test(rm) && rmSim === 'Tirar' && !/Desconectar/.test(rm), 'Família → "Tirar" um aparelho: "Tirar este aparelho da família?" e o botão "Tirar"');
  await a.evaluate((b) => { ACT['mem.help']({ id: b }); }, BIA); await janela(a, /Ajudar a entrar de novo/);
  const mh = await textoJanelas(a); await a.evaluate(() => closeModals());
  conferir(/Tirar um aparelho perdido/.test(mh) && !/Desconectar|desconecte/.test(mh), '🔑 Ajudar a entrar de novo: "Tirar um aparelho perdido"');
  const aj = await a.evaluate(() => HELP()['familia-seguranca'].steps.join(' '));
  conferir(/Aparelhos da família:<\/b> veja onde cada um entrou e tire um celular perdido/.test(aj) && !/desconecte/.test(aj), 'ajuda "Administração segura": "tire um celular perdido" (sem "desconecte")');
  const sau = await a.evaluate(() => SaudeMT.card());
  conferir(/embaralhado aqui no aparelho/.test(sau) && !/cifrad/.test(sau), 'Saúde → MoneyTRIO: "embaralhado aqui no aparelho" (sem "cifrado com a chave da família")');
  conferir(!A.lixo.erros.length && !A.lixo.nativos.length, 'A: sem erro de script e sem diálogo nativo' + (A.lixo.erros.length ? ': ' + A.lixo.erros.join(' | ') : ''));
  await A.ctx.close();

  /* ================= S7: "só neste aparelho" sem conta (e com a conta) ================= */
  console.log('S7. "Só neste aparelho"');
  const G = await aparelho(browser, { nome: 'local', vp: 'celular', base: BASE }), g = G.p; lixos.push(G.lixo);
  await g.goto(BASE + '/index.html'); await naEntrada(g);
  await g.evaluate(() => ACT['gate.local']());
  await g.waitForSelector('#fn', { timeout: 10000 });
  await g.fill('#fn', 'Família Local'); await g.fill('#mn', 'Pessoa Local'); await g.click('#go');
  await g.waitForFunction(() => S.booted && S.mode === 'local', null, { timeout: 15000 });
  await quieto(g); await g.evaluate(() => closeModals());
  await g.evaluate(() => go('settings', 'conta')); await g.waitForSelector('#screen [data-act="signout"]', { timeout: 10000 });
  const s7 = await g.evaluate(() => { const c = [...document.querySelectorAll('#screen .card')].find((x) => /^🔒/.test((x.querySelector('h3') || {}).textContent || ''));
    return { segs: [...document.querySelectorAll('#screen .seg button')].map((b) => b.dataset.sub), pagina: !!document.querySelector('.segap'), sub: S.route.sub,
      card: c ? { how: !!c.querySelector('select[data-chg="set.loginhow"]'), bio: !!c.querySelector('[data-chg="set.biolock"]'), t: c.innerText, bt: !!c.querySelector('[data-sub="conta"]') } : null }; });
  conferir(!s7.segs.includes('conta') && !s7.pagina && !!s7.card && s7.card.how && s7.card.bio && !s7.card.bt && /As Senhas da casa têm PIN ou senha própria/.test(s7.card.t),
    'S7/K30. sem conta: sem a página (o endereço cai em Geral) e o cartão "🔒 Segurança" como antes (PIN/digital do perfil e a digital para abrir o app)');
  const m7 = await menuItens(g); await fecharMenu(g);
  conferir(!m7.some((x) => /Segurança e aparelhos/.test(x.t)) && m7[m7.length - 1].danger, 'S7. sem conta: o 👤 não tem "Segurança e aparelhos"');
  /* as Senhas da casa deste aparelho (senha principal): "🔒 Bloquear agora (pede a senha principal…)" */
  await g.evaluate(() => Vault.setup('senha-de-mentira-123')); await g.evaluate(() => go('house', 'vault'));
  await g.waitForSelector('#screen [data-act="conta.bloquear"]', { timeout: 10000 });
  const vl = await texto(g);
  conferir(/Bloquear agora\s*\(pede a senha principal para abrir de novo\)/.test(vl) && !(await naTela(g, '#screen [data-act="vault.lock"]')), '"Só neste aparelho": "🔒 Bloquear agora (pede a senha principal para abrir de novo)" no lugar de "🔒 Fechar"');
  await g.click('#screen [data-act="conta.bloquear"]');
  conferir(await g.waitForFunction(() => !S.vaultKey && /senha principal/.test(document.querySelector('#screen').innerText), null, { timeout: 8000 }).then(() => true, () => false), '"Bloquear agora" fecha as Senhas da casa (pede a senha principal)');
  /* com a conta conectada (só neste aparelho): seus dados, PIN e digital do perfil, sair */
  await g.evaluate(() => { lsSet(Conta.K, { access_token: 'mentira', refresh_token: 'mentira', expira: Date.now() + 3600e3, em: Date.now(), email: 'ana@teste.com', nome: 'Ana Teste', desde: Date.now() }); go('settings', 'conta'); });
  await g.waitForSelector('.segap', { timeout: 10000 });
  const s7b = await g.evaluate(() => ({ ids: [...document.querySelectorAll('.segap > section, .segap > details')].map((e) => e.id).join(','), how: !!document.querySelector('#segPin [data-chg="set.loginhow"]'),
    bio: !!document.querySelector('#segPin [data-chg="set.biolock"]'), t: document.querySelector('#screen').innerText }));
  conferir(s7b.ids === 'segDados,segPin,segSair' && s7b.how && s7b.bio && /ana@teste\.com/.test(s7b.t) && /senha principal/.test(s7b.t) && !JARGAO_PT.test(s7b.t),
    'S7. "só neste aparelho" com a conta: seus dados, PIN e digital (do perfil, a digital do app e "Bloquear agora") e sair — sem lista nem avançado');
  await foto(g, 'seguranca-390-pt-so-neste-aparelho.png');
  await g.setViewportSize({ width: 1280, height: 800 }); await g.evaluate(() => render()); await g.waitForSelector('.segap', { timeout: 10000 });
  const bur7 = await buracos(g);
  conferir(bur7 === 0, 'S2/S7. "só neste aparelho" com a conta, 1280 px: nenhuma linha com uma coluna vazia ao lado (' + bur7 + ')');
  await g.setViewportSize({ width: 390, height: 844 });
  await g.evaluate(() => { localStorage.removeItem(Conta.K); go('settings'); });
  conferir(!G.lixo.erros.length && !G.lixo.nativos.length, 'S7: sem erro de script e sem diálogo nativo' + (G.lixo.erros.length ? ': ' + G.lixo.erros.join(' | ') : ''));
  await G.ctx.close();

  /* ================= revisão 3 (telas): quem não é chefe nem responsável (o Davi, membro adulto) =================
     ele não tem as Senhas da casa nem entra na lista da conta pelo OmniLifeONE, e volta só com e-mail e senha: nada de "ainda não
     está na lista", "o PIN da conta" para entrar de novo ou "peça a aprovação" */
  console.log('M. Quem não é chefe nem responsável');
  const MV = await aparelho(browser, { nome: 'Davi-celular', vp: 'celular', base: BASE }), mv = MV.p; lixos.push(MV.lixo);
  await entrarOmni(mv, DAVI); await quieto(mv);
  await pagina(mv); await mv.evaluate(() => { document.querySelector('#segAvancado').open = true; });
  const tm = await texto(mv);
  conferir(await ordem(mv) === ORDEM && /Davi Teste/.test(tm) && /O PIN da conta abre as Senhas da casa, que são de chefes e responsáveis/.test(tm), 'M. a página do membro: a mesma ordem, os dados dele e a frase do PIN da conta');
  conferir(!/ainda não está na lista|not on the list yet/.test(tm), 'M. "Seus dados" sem "Este celular: ainda não está na lista" (o aparelho de quem não é responsável nunca entra nessa lista)');
  conferir(/Sai da conta neste aparelho\. Para entrar de novo: e-mail e senha \(ou Google\)\./.test(tm) && !/Google\) e o PIN da conta/.test(tm), 'M. "Sair": para entrar de novo, e-mail e senha (sem "o PIN da conta", que ele não usa)');
  conferir(/Tirar este aparelho da conta/.test(tm) && !/peça a aprovação/.test(tm), 'M. Avançado → "Tirar este aparelho": sem "peça a aprovação" (ele volta só entrando)');
  await foto(mv, 'seguranca-390-pt-membro.png');
  await mv.click('#segAvancado [data-act="conta.ap.este"]'); await mv.waitForSelector('.modal [data-yes]', { timeout: 8000 });
  const cm = await textoJanelas(mv); await mv.click('.modal [data-no]');
  conferir(/Tirar este .* da conta\?/.test(cm) && !/peça a aprovação/.test(cm) && await mv.evaluate(() => Conta.on()), 'M. a confirmação de "Tirar este aparelho" também sem "peça a aprovação"; Cancelar não sai');
  await mv.evaluate(() => setLang('en')); await pagina(mv); await mv.evaluate(() => { document.querySelector('#segAvancado').open = true; });
  const tme = await texto(mv);
  conferir(!/not on the list yet|and the account PIN|ask for approval/.test(tme) && /To get back in: e-mail and password \(or Google\)\./.test(tme), 'M (EN). nem "not on the list yet", nem "the account PIN", nem "ask for approval"');
  await mv.evaluate(() => setLang('pt'));
  conferir(!MV.lixo.erros.length && !MV.lixo.nativos.length, 'M: sem erro de script e sem diálogo nativo' + (MV.lixo.erros.length ? ': ' + MV.lixo.erros.join(' | ') : ''));
  await MV.ctx.close();

  /* ================= D3 desta página: "Sair" e Avançado → "Tirar este aparelho" ================= */
  console.log('D3. Segurança e aparelhos → "Sair" e Avançado → "Tirar este aparelho"');
  const D = await aparelho(browser, { nome: 'Ana-notebook', vp: 'computador', base: BASE }), d = D.p; lixos.push(D.lixo);
  await entrarOmni(d, ANA); await quieto(d);
  await d.evaluate(() => { Sol.ligadoAp = false; Sol.ligadoPin = false; });
  await senhasDaCasa(d); await cadeado225(d, ANA, PIN_X);
  await d.evaluate(() => { Sol.ligadoAp = null; Sol.ligadoPin = null; });
  await d.evaluate(() => Aparelhos.registrar());
  await pagina(d);
  conferir(/Este computador: já usava antes \(ou entrou com o código\)/.test(await texto(d)), 'K24. o aparelho de antes que entrou na lista como "kit": "já usava antes (ou entrou com o código)"');
  await d.click('#segSair [data-act="conta.sair"]');
  const s3 = await naEntrada(d);
  conferir(s3 && !(await d.evaluate(() => Conta.on())) && !(await continuarComo(d)) && await d.evaluate(async (u) => !!(await IDB.get('kv', 'cofre|' + u)), ANA),
    'D3. "Sair" da página: tela de entrar sem "Continuar como", a conta saiu (o cadeado fica para a próxima entrada)');
  await entrarOmni(d, ANA); await quieto(d);
  const apD = await d.evaluate(async () => (await Cofre.local()).ap);
  await pagina(d);
  await d.click('#segAvancado summary'); await d.click('#segAvancado [data-act="conta.ap.este"]');
  await d.waitForSelector('.modal [data-yes]', { timeout: 8000 });
  const pD = await textoJanelas(d); await d.click('.modal [data-yes]');
  const s3b = await naEntrada(d);
  conferir(/Tirar este .* da conta\?/.test(pD) && s3b && /Pronto: este .* saiu da conta/.test(await toasts(d)) && !(await continuarComo(d)) && !(await d.evaluate(async (u) => !!(await IDB.get('kv', 'cofre|' + u)), ANA)) && !linhasDe(ANA).some((x) => x.id === apD),
    'D3. Avançado → "Tirar este aparelho": confirma, sai da conta, o cadeado sai daqui e este aparelho sai da lista');
  conferir(!D.lixo.erros.length && !D.lixo.nativos.length, 'D3: sem erro de script e sem diálogo nativo' + (D.lixo.erros.length ? ': ' + D.lixo.erros.join(' | ') : ''));
  await D.ctx.close();

  /* ================= D4: "Começar do zero" (K21: ninguém para aprovar) ================= */
  console.log('D4. "Começar do zero" só quando não há outro caminho');
  const Z = await aparelho(browser, { nome: 'Ana-tablet', vp: 'celular', base: BASE }), z = Z.p; lixos.push(Z.lixo);
  await entrarOmni(z, ANA); await quieto(z); await vigiarPares(z);
  await pagina(z);
  const z0 = await texto(z);
  conferir(/As Senhas da casa ainda não estão neste/.test(z0) && await naTela(z, '#segPin [data-act="conta.ap.usar"]') && !(await naTela(z, '#segZero')), 'D4. aparelho sem as Senhas da casa e com outros caminhos (o computador da Ana, o kit, a Bia): "Usar neste …" e nada de "Começar do zero"');
  /* o beco: sem outro aparelho, sem kit, sem passkey e sem outro chefe/responsável */
  const kit = db.omni_chave_privada.find((k) => k.user_id === ANA), papeis = {};
  db.omni_chave_privada.splice(db.omni_chave_privada.indexOf(kit), 1);
  linhasDe(ANA).forEach((x) => { x.removido_em = agora(); x.removido_por = ANA; });
  for (const u of [BIA, CRIS]) { const m = db.sol_grupo_membros.find((x) => x.grupo_id === GID && x.user_id === u); papeis[u] = m.papel; m.papel = 'membro'; }
  await entrarOmni(z, ANA); await quieto(z); await vigiarPares(z);   /* de novo: a família com os papéis de agora */
  await pagina(z);
  /* a "Primeira vez" sem saída (K21): só a explicação e o atalho para Avançado */
  await z.click('#segPin [data-act="conta.ap.usar"]'); await janela(z, /Primeira vez neste/);
  const pv = await textoJanelas(z);
  conferir(/Não há outro aparelho seu para aprovar/.test(pv) && await naTela(z, '.modal #apAvancado') && !(await naTela(z, '.modal #apOutro')), 'D4. "Primeira vez" no beco: só a explicação e o atalho para Avançado');
  await z.click('.modal #apAvancado');
  conferir(await z.waitForFunction(() => S.route.sub === 'conta' && document.querySelector('#segAvancado[open] #segZero'), null, { timeout: 15000 }).then(() => true, () => false), 'D4. o atalho abre Segurança e aparelhos com o Avançado aberto e o "Começar do zero"');
  await z.evaluate(() => { document.querySelector('#segAvancado').open = true; });
  const za = await z.evaluate(() => document.querySelector('#segAvancado').innerText);
  conferir(await naTela(z, '#segZero [data-act="conta.zero"]') && /só voltam pelo código de emergência da família ou se outro responsável liberar/.test(za), 'D4. no beco: "🧹 Começar do zero" em Avançado, com o aviso do código de emergência');
  await foto(z, 'seguranca-390-pt-comecar-do-zero.png');
  const pub0 = pubDe(ANA);
  await z.click('#segZero [data-act="conta.zero"]'); await z.waitForSelector('.modal [data-yes]', { timeout: 8000 });
  const c1 = await textoJanelas(z); await z.click('.modal [data-no]'); await espere(300);
  conferir(/Começar do zero neste/.test(c1) && /código de emergência/.test(c1) && pubDe(ANA) === pub0 && await z.evaluate(() => window.__pares) === 0 && !(await naTela(z, '.modal')), 'D4. 1ª confirmação (com o aviso) → Cancelar: nada muda');
  await z.click('#segZero [data-act="conta.zero"]'); await z.waitForSelector('.modal [data-yes]', { timeout: 8000 }); await z.click('.modal [data-yes]');
  await janela(z, /Tem certeza\?/); const c2 = await textoJanelas(z); await z.click('.modal [data-no]'); await espere(300);
  conferir(/Não dá para desfazer/.test(c2) && pubDe(ANA) === pub0 && await z.evaluate(() => window.__pares) === 0, 'D4. 2ª confirmação → Cancelar: nada muda');
  await z.click('#segZero [data-act="conta.zero"]'); await z.waitForSelector('.modal [data-yes]', { timeout: 8000 }); await z.click('.modal [data-yes]');
  await janela(z, /Tem certeza\?/); await z.click('.modal [data-yes]');
  await z.waitForSelector('.modal #pcPin', { timeout: 10000 });
  conferir(/Digite o PIN da sua conta/.test(await textoJanelas(z)) && !(await naTela(z, '.modal #pcP2')), 'D4. a conta já tem PIN: pede o PIN da conta (um campo só; ele continua valendo)');
  await z.fill('.modal #pcPin', PIN_X); await z.click('.modal #pcOk');
  await z.waitForFunction(() => /PIN errado/.test((document.querySelector('.modal #pcErr') || {}).textContent || ''), null, { timeout: 20000 }).catch(() => {});
  await ate(() => !linhasDe(ANA).length);
  conferir(/PIN errado/.test(await textoJanelas(z)) && pubDe(ANA) === pub0 && await z.evaluate(() => window.__pares) === 0 && !linhasDe(ANA).length && !(await z.evaluate(async () => !!(await Cofre.local()))),
    'D4. PIN errado: avisa e nada muda (a mesma pública, nenhum par novo, nenhum lugar novo na lista, nenhum cadeado)');
  await z.fill('.modal #pcPin', PIN_B); await z.click('.modal #pcOk');
  const fim = await janela(z, /Falta liberar|começaram do zero/, 60000);
  const tz = await textoJanelas(z);
  await z.click('.modal #apEntendi').catch(() => {});
  const Lz = await z.evaluate(async () => { const L = await Cofre.local(); return L ? { sk: !!L.sk, srv: !!L.srv, pv: L.pinVersao, ap: L.ap, como: L.como } : null; });
  const pinConta = db.sol_pin_conta.find((x) => x.user_id === ANA);
  conferir(fim && /só voltam pelo código de emergência/.test(tz) && pubDe(ANA) !== pub0 && await z.evaluate(() => window.__pares) === 1, 'D4. PIN certo: o par novo nasce (uma vez só), a pública da conta muda e o aviso diz como as Senhas da casa antigas voltam');
  conferir(!!Lz && Lz.sk && Lz.srv && Lz.pv === pinConta.versao && Lz.como === 'primeiro' && linhasDe(ANA).length === 1 && linhasDe(ANA)[0].id === Lz.ap && !db.omni_chave_privada.some((k) => k.user_id === ANA),
    'D4. este aparelho: cadeado novo com a chave pessoal e o PIN da conta (o mesmo), na lista como "primeiro"; nenhum kit criado');
  conferir(!Z.lixo.erros.length && !Z.lixo.nativos.length, 'D4: sem erro de script e sem diálogo nativo' + (Z.lixo.erros.length ? ': ' + Z.lixo.erros.join(' | ') : ''));
  await Z.ctx.close();
  db.omni_chave_privada.push(kit);
  for (const u of [BIA, CRIS]) db.sol_grupo_membros.find((x) => x.grupo_id === GID && x.user_id === u).papel = papeis[u];

  /* ================= Revisão 3 (segurança): "Começar do zero" com um caminho que o beco não via ================= */
  console.log('R3. "Começar do zero" quando há caminho: o cadeado deste aparelho, a digital daqui, a digital em todos os aparelhos');
  const W = await aparelho(browser, { nome: 'Ana-portatil', vp: 'computador', base: BASE }), w = W.p; lixos.push(W.lixo);
  await entrarOmni(w, ANA); await quieto(w);
  /* um computador com o cadeado que abre a família (a chave pessoal do papel) e o PIN da conta guardado aqui (L.srv) */
  await cadeado225(w, ANA, PIN_B);
  await w.evaluate(async (pin) => { await Aparelhos.registrar(); Cofre.trancar(); await Pin.abrir(pin); }, PIN_B);
  const cadW = () => w.evaluate(async () => { const L = await Cofre.local(); return L ? { sk: JSON.stringify(L.sk), ap: L.ap, srv: !!L.srv } : null; });
  const Lw0 = await cadW();
  conferir(!!Lw0 && !!Lw0.ap && Lw0.srv && await w.evaluate(() => Cofre.aberto()), 'R3 preparo: este computador com o cadeado (abre a família), na lista e no PIN da conta');
  /* o beco, com este computador: sem kit, sem outro aparelho, sem outro chefe/responsável */
  const kit3 = db.omni_chave_privada.find((k) => k.user_id === ANA);
  db.omni_chave_privada.splice(db.omni_chave_privada.indexOf(kit3), 1);
  linhasDe(ANA).filter((x) => x.id !== Lw0.ap).forEach((x) => { x.removido_em = agora(); x.removido_por = ANA; });
  for (const u of [BIA, CRIS]) db.sol_grupo_membros.find((x) => x.grupo_id === GID && x.user_id === u).papel = 'membro';
  await entrarOmni(w, ANA); await quieto(w); await vigiarPares(w);
  await w.evaluate(() => ACT['conta.bloquear']());
  const pub3 = pubDe(ANA), zeroDireto = (pin) => w.evaluate((p) => Cofre.criarConta(p, true), pin);
  /* a digital em todos os aparelhos na conta: este computador não tem leitor, mas um celular com ela entra e aprova daqui */
  const pk3 = { user_id: ANA, cred_id: b64u(crypto.randomBytes(16)), sal: b64u(crypto.randomBytes(32)), fechada: { iv: 'AAAAAAAAAAAAAAAA', ct: 'AAAAAAAAAAAAAAAAAAAAAA==' }, criado_em: agora(), removido_em: null };
  db.sol_passkeys.push(pk3);
  await pagina(w);
  const zPk = await zeroDireto(PIN_B);
  conferir(!(await naTela(w, '#segZero')) && zPk.erro === 'naoPode' && await w.evaluate(() => window.__pares) === 0 && pubDe(ANA) === pub3,
    'R3. a conta tem a digital em todos os aparelhos (sem leitor aqui): não é beco — sem "Começar do zero" e chamar direto é recusado');
  pk3.removido_em = agora();
  /* a digital DESTE aparelho abre o cadeado daqui */
  await w.evaluate(() => Cofre.mudarLocal(null, (L) => { L.prf = { cred: 'cred-de-mentira', sal: 'sal-de-mentira', iv: 'AAAAAAAAAAAAAAAA', ct: 'AAAAAAAAAAAAAAAAAAAAAA==' }; return L; }));
  await pagina(w);
  const zDig = await zeroDireto(PIN_X);
  conferir(!(await naTela(w, '#segZero')) && zDig.erro === 'naoPode' && await w.evaluate(() => window.__pares) === 0 && pubDe(ANA) === pub3,
    'R3. a digital deste aparelho abre o cadeado daqui: sem "Começar do zero" e chamar direto é recusado');
  await w.evaluate(() => Cofre.mudarLocal(null, (L) => { L.prf = null; return L; }));
  /* o cadeado daqui com o PIN certo: o "Começar do zero" continua (para quem esqueceu), mas o PIN que abre não troca nada */
  await pagina(w); await w.evaluate(() => { document.querySelector('#segAvancado').open = true; });
  conferir(await naTela(w, '#segZero [data-act="conta.zero"]'), 'R3. no beco com o cadeado aqui, o "Começar do zero" continua em Avançado (para quem esqueceu o PIN)');
  await w.click('#segZero [data-act="conta.zero"]'); await w.waitForSelector('.modal [data-yes]', { timeout: 8000 }); await w.click('.modal [data-yes]');
  await janela(w, /Tem certeza\?/); await w.click('.modal [data-yes]');
  await w.waitForSelector('.modal #pcPin', { timeout: 10000 });
  await w.fill('.modal #pcPin', PIN_B); await w.click('.modal #pcOk');
  await w.waitForFunction(() => /Esse PIN abre/.test(document.querySelector('#toasts').textContent) || [...document.querySelectorAll('.modal')].some((m) => /Falta liberar|começaram do zero/.test(m.innerText)), null, { timeout: 60000 }).catch(() => {});
  const Lw1 = await cadW(), tw = await toasts(w);
  conferir(/Esse PIN abre as Senhas da casa neste/.test(tw) && await w.evaluate(() => window.__pares) === 0 && pubDe(ANA) === pub3 && !!Lw1 && Lw1.sk === Lw0.sk && Lw1.ap === Lw0.ap && linhasDe(ANA).length === 1 && !(await naTela(w, '.modal')),
    'R3. o PIN da conta abre o cadeado deste computador: "Começar do zero" não troca nada (a mesma chave pessoal, a mesma pública, nenhum par novo) e diz que esse PIN abre');
  conferir(await w.evaluate(async (pin) => { const r = await Pin.abrir(pin); return !!(r && r.ok) && Cofre.aberto(); }, PIN_B), 'R3. ... e o mesmo PIN abre as Senhas da casa daqui (a família continua)');
  /* sem o PIN da conta guardado aqui (L.srv): o PIN deste aparelho que abre o cadeado também barra */
  await w.evaluate(() => { Cofre.trancar(); return Cofre.mudarLocal(null, (L) => { delete L.srv; return L; }); });
  const zLocal = await zeroDireto(PIN_B), Lw2 = await cadW();
  conferir(zLocal.erro === 'abre' && await w.evaluate(() => window.__pares) === 0 && pubDe(ANA) === pub3 && !!Lw2 && Lw2.sk === Lw0.sk, 'R3. o PIN deste aparelho abre o cadeado daqui: chamar direto não troca nada ({erro: "abre"})');
  conferir(!W.lixo.erros.length && !W.lixo.nativos.length, 'R3: sem erro de script e sem diálogo nativo' + (W.lixo.erros.length ? ': ' + W.lixo.erros.join(' | ') : ''));
  await W.ctx.close();
  db.omni_chave_privada.push(kit3);
  for (const u of [BIA, CRIS]) db.sol_grupo_membros.find((x) => x.grupo_id === GID && x.user_id === u).papel = papeis[u];

  conferir(!lixos.some((l) => l.fora.some((u) => /supabase/i.test(u))), 'nada foi para o Supabase de verdade (só o banco de mentira)');
  conferir(!lixos.some((l) => l.console.some((x) => PINS.some((k) => x.includes(k)))) && !db.omni_historico.some((x) => PINS.some((k) => JSON.stringify(x).includes(k))), 'nenhum PIN no console nem no histórico');
  await terminar(falhas, browser, 'Segurança e aparelhos — ordem, grade, sem jargão, PIN da conta, aparelhos (K20), interruptores, 👤, "só neste aparelho", Sair, Tirar este aparelho e Começar do zero.');
})().catch((e) => { console.error(e); process.exit(1); });
