/* Teste cruzado OmniLifeONE ↔ MoneyTRIO (2.26.0, Parte C): a MESMA conta, o MESMO PIN e a aprovação de um aparelho pelo outro
   ENTRE OS DOIS APPS, com o MoneyTRIO de verdade (o index.html e o nuvem.js da pasta MONEYTRIO, só lidos: nada lá é mudado),
   servido em outro endereço localhost, e o OmniLifeONE desta pasta. Os dois falam com o MESMO "Supabase de mentira"
   (teste/mock-sol.js, no processo do Node). Cada aparelho é um contexto do navegador; o mesmo navegador nos dois apps dá o
   mesmo nome ("Linux · Chrome"), como o mesmo celular. Nada vai para a internet nem para o Supabase de verdade.
     C1  a Ana entra no MoneyTRIO pelo caminho que a 3.66 usa para a conta que ainda não tem cadeado em lugar nenhum: o código
         antigo ("kit") e "Crie o PIN da sua conta SolverONE" → PIN da conta versão 1
     C2  um celular novo no Omni: "Você já usa o MoneyTRIO…" → aprovar pelo outro aparelho → o MoneyTRIO mostra o pedido
         (OmniLifeONE) → os 6 números iguais nos dois → aprovado com o PIN → "Digite o PIN da sua conta" no Omni → o mesmo PIN
         abre; a lista dos dois apps: "Linux · Chrome · MoneyTRIO e OmniLifeONE"
     C3  a Ana troca o PIN no Omni: o MoneyTRIO aberto tranca ("trocado em outro aparelho"); o velho não abre; recarregado, o novo abre
     C4  o Omni aprova um pedido pessoal feito no MoneyTRIO (celular novo): a faixa e a janela dizem "(MoneyTRIO)"
     C5  as respostas abrem dos dois lados sem conversão: o mesmo formato {v:2, iv, ct}, a mesma chave pessoal e a mesma CF
     CP  (da etapa 9) a "digital em todos os aparelhos" ligada no Omni abre um MoneyTRIO novo ("👆 Usar a digital (passkey)"):
         a mesma aba e o mesmo autenticador virtual no endereço do MoneyTRIO (em localhost as duas portas têm o mesmo rpId)
     CK  (da etapa 9) o código novo do kit, feito no Omni, abre o MoneyTRIO (o papel antigo não); desligado no Omni, o link
         "Tenho o código de recuperação antigo" some no MoneyTRIO
     C6  "para a família" nos dois sentidos (a 3.66 ainda oferece "👪 Pedir para alguém da família aprovar"): a Bia no Omni aprova
         o MoneyTRIO da Ana; a Bia no MoneyTRIO (com as chaves próprias da família da 3.66: money_chaves) aprova o Omni da Ana —
         a carga dela leva também "mk" (as chaves do MoneyTRIO): o Omni aceita, usa só a CF e não guarda "mk"; os avisos
         "Um aparelho novo entrou na sua conta… aprovado por Bia Teste" nos dois apps
   Limite conhecido (não é defeito do Omni; anotado no registro da etapa 10 e nas pendências): o MoneyTRIO aprovado pela
   família PELO OMNI abre só com a CF, sem as chaves próprias do MoneyTRIO (o Omni não as tem; nuvem.js 3.66 l. 734 e 821-824).
   Sem MONEYTRIO=<pasta do investify-me> o teste diz "PULADO" e sai com 0 (não falha a suíte).
   Pessoas, senhas, códigos e chaves de mentira (teste/mock-sol.js).
   Uso: MONEYTRIO=<pasta> node teste/rodar.js   ·   sozinho: MONEYTRIO=<pasta> BASE=http://localhost:8099 node teste/aparelhos-cruzado-omni.js */
'use strict';
const fs = require('fs'), path = require('path'), crypto = require('crypto');
const PASTA = process.env.MONEYTRIO ? path.resolve(process.env.MONEYTRIO) : '';
if (!PASTA) { console.log('PULADO: o teste cruzado com o MoneyTRIO precisa de MONEYTRIO=<pasta do investify-me> (o MoneyTRIO neste computador).'); process.exit(0); }
if (!fs.existsSync(path.join(PASTA, 'nuvem.js')) || !fs.existsSync(path.join(PASTA, 'index.html'))) {
  console.log('  ✗ MONEYTRIO=' + PASTA + ' não é a pasta do MoneyTRIO (faltam nuvem.js e index.html)'); process.exit(1);
}
const { BASE, criarConferir, iniciar, terminar } = require('./_base');
const { M, db, prepararChaves, prepararMoneyChaves, cf, normCode, PESSOAS, ANA, BIA, GID } = require('./mock-sol');
const { servir, aparelho, entrarOmni, entrarMoney, senhasDaCasa } = require('./_nuvem');

const PIN_CONTA = '590317', PIN_NOVO = '736251', PIN_BIA = '271846', PINS = [PIN_CONTA, PIN_NOVO, PIN_BIA];
/* o PIN como número inteiro (sem dígito colado): os dois apps guardam dezenas de horários de 13 dígitos (Date.now()), que às vezes
   contêm os mesmos 6 dígitos por acaso — isso não é o PIN guardado */
const temPin = (t) => PINS.some((n) => new RegExp('(^|[^0-9])' + n + '([^0-9]|$)').test(String(t)));
const subtle = crypto.webcrypto.subtle, utf8 = (t) => new TextEncoder().encode(t), b64n = (b) => Buffer.from(b).toString('base64');
const hex = (b) => crypto.createHash('sha256').update(Buffer.from(b)).digest('hex');
const pinDaConta = (uid) => db.sol_pin_conta.find((x) => x.user_id === uid);
const pedidoDe = (uid) => db.sol_acesso_pedidos.filter((x) => x.user_id === uid && x.estado === 'aberto').slice(-1)[0];
const linha = (id) => db.sol_aparelhos.find((a) => a.id === id);
/* a chave pessoal da pessoa, aberta aqui pelo código do papel (para conferir que é a MESMA nos dois apps) */
async function privadaDe(uid) {
  const r = db.omni_chave_privada.find((x) => x.user_id === uid), o = JSON.parse(r.privada_cifrado);
  const base = await subtle.importKey('raw', utf8(normCode(PESSOAS[uid].codigo)), 'PBKDF2', false, ['deriveKey']);
  const k = await subtle.deriveKey({ name: 'PBKDF2', salt: Buffer.from(r.sal, 'base64'), iterations: r.iteracoes, hash: 'SHA-256' }, base, { name: 'AES-GCM', length: 256 }, false, ['decrypt']);
  return new Uint8Array(await subtle.decrypt({ name: 'AES-GCM', iv: Buffer.from(o.iv, 'base64') }, k, Buffer.from(o.ct, 'base64')));
}
/* a resposta que um app mandou ao aprovar (o corpo do sol_pedido_aprovar que o banco recebeu): o formato da plataforma */
const respostaDe = (id) => ((M.log.filter((x) => /\/rpc\/sol_pedido_aprovar$/.test(x.caminho.split('?')[0]) && x.corpo && x.corpo.p_id === id).pop() || {}).corpo || {}).p_resposta;
const b64ok = (t) => typeof t === 'string' && /^[A-Za-z0-9+/]+={0,2}$/.test(t) && t.length % 4 === 0;
const formatoOk = (r) => !!r && JSON.stringify(Object.keys(r).sort()) === '["ct","iv","v"]' && r.v === 2 && b64ok(r.iv) && Buffer.from(r.iv, 'base64').length === 12 && b64ok(r.ct) && Buffer.from(r.ct, 'base64').length > 16;

/* ---- OmniLifeONE ---- */
const janela = (p, re, ms) => p.waitForFunction((re) => [...document.querySelectorAll('.modal h3')].some((h) => new RegExp(re).test(h.textContent)), re.source, { timeout: ms || 10000 }).then(() => true, () => false);
/* uma janela com este texto em qualquer lugar (as confirmações não têm o texto no título) */
const janelaTxt = (p, re, ms) => p.waitForFunction((re) => [...document.querySelectorAll('.modal')].some((m) => new RegExp(re).test(m.innerText)), re.source, { timeout: ms || 10000 }).then(() => true, () => false);
const temJanela = (p, re) => p.evaluate((re) => [...document.querySelectorAll('.modal h3')].some((h) => new RegExp(re).test(h.textContent)), re.source);
const textoJanelas = (p) => p.evaluate(() => [...document.querySelectorAll('.modal')].map((m) => m.innerText).join(' | '));
const abriu = (p) => p.waitForFunction(() => Cofre.aberto() && !document.querySelector('.modal'), null, { timeout: 60000 }).then(() => true, () => false);
const cadeado = (p) => p.evaluate(async () => { const L = await Cofre.local(); return L ? { ap: L.ap || null, como: L.como || null, srv: !!L.srv, pinVersao: L.pinVersao || 0, sk: !!L.sk, fam: Object.keys(L.fam || {}), mk: JSON.stringify(L).includes('"mk"') } : null; });
const toasts = (p) => p.evaluate(() => document.querySelector('#toasts').textContent);
const sasOmni = (p) => p.waitForSelector('.modal #apSas', { timeout: 30000 }).then(() => p.evaluate(() => document.querySelector('.modal #apSas').textContent.replace(/\s/g, '')), () => '');
/* o "Olá"/dicas do AssistONE e o passo a passo das Senhas da casa abrem sozinhos e cobririam os botões */
const quieto = (p) => p.evaluate(() => { AOne.save({ hello: 1, tour: 1, tips: Object.assign({}, AOne.cfg().tips, { home: 1, settings: 1, house: 1 }) }); if (AOne.view) AOne.close(); lsSet(GuiaCofre.K, Date.now()); });
/* pergunta pelos pedidos agora (sem esperar os 20 s do Cloud.poll). Devolve o texto da faixa */
const olhar = (p) => p.evaluate(async () => {
  for (let i = 0; i < 80 && Aparelhos._olhando; i++) await new Promise((r) => setTimeout(r, 100));
  Aparelhos._vistos = {}; await Aparelhos.olharPedidos();
  const f = document.getElementById('apFaixa'); return f ? f.textContent : '';
});
async function primeiraVez(p) { await senhasDaCasa(p); await p.click('#screen [data-act="cofre.comecar"]'); return janela(p, /Primeira vez neste/); }
/* o cadeado do Omni pelo código antigo ("kit") e o PIN: "Crie o PIN" (conta sem PIN) ou "Digite o PIN da sua conta" */
async function codigoOmni(p, uid, pin) {
  await primeiraVez(p);
  await p.click('.modal #apCodigo'); await p.waitForSelector('.modal #apCod', { timeout: 8000 });
  await p.fill('.modal #apCod', PESSOAS[uid].codigo); await p.click('.modal #apCodOk');
  if (await janela(p, /Crie o PIN da sua conta SolverONE/, 20000)) { await p.fill('.modal #pcP1', pin); await p.fill('.modal #pcP2', pin); await p.click('.modal #pcOk'); }
  else { await janela(p, /Digite o PIN da sua conta/, 5000); await p.fill('.modal #pcPin', pin); await p.click('.modal #pcOk'); }
  return abriu(p);
}
const skOmni = (p) => p.evaluate(async () => {
  const L = await Cofre.local(), sk = await Cofre.decifrar(await Cofre.aes(Cofre.dukRaw), L.sk), h = new Uint8Array(await crypto.subtle.digest('SHA-256', sk)); sk.fill(0);
  return Array.from(h, (b) => b.toString(16).padStart(2, '0')).join('');
});
const cfOmni = (p) => p.evaluate(() => (Cofre.vfRaw ? b64FromBuf(Cofre.vfRaw) : ''));
/* ⚙ → Segurança e aparelhos, com o Avançado aberto e o que vem da internet já no lugar (como o kit-passkey-omni.js) */
async function avancado(p) {
  await p.evaluate(() => { closeModals(); Jornada.limpar(); TelaConta._pag = null; TelaConta._avAberto = true; go('settings', 'conta'); });
  await p.waitForFunction(() => S.route && S.route.sub === 'conta' && document.querySelector('#segAvancado[open] #segAvC .segav') && !/Carregando|Loading/.test(document.querySelector('.segap').innerText), null, { timeout: 20000 });
}
/* "Seu PIN de agora" (o reforço 2.21.2 antes do kit e da digital em todos os aparelhos) */
async function provar(p, pin) { await p.waitForSelector('.modal #ppin', { timeout: 8000 }); await p.fill('.modal #ppin', pin); await p.click('.modal:has(#ppin) [data-ok]'); }
/* num aparelho com leitor, o app oferece abrir com a digital logo depois de entrar: "Agora não" */
async function semOferta(p) { if (await p.waitForSelector('.modal [data-no]', { timeout: 5000 }).then(() => true, () => false)) await p.click('.modal [data-no]'); }

/* ---- MoneyTRIO (as peças que o próprio nuvem.js expõe para os testes dele: MoneyNuvem._teste) ---- */
const abriuMoney = (p) => p.waitForFunction(() => window.MoneyNuvem && MoneyNuvem._teste.Cadeado.aberto() && MoneyNuvem.iniciado && !!document.getElementById('nvSelo'), null, { timeout: 90000 }).then(() => true, () => false);
const cadeadoMoney = (p) => p.evaluate(async () => { const L = await MoneyNuvem._teste.Cadeado.local(); return L ? { ap: L.ap || null, como: L.como || null, srv: !!L.srv, pinVersao: L.pinVersao || 0, sk: !!L.sk, fam: Object.keys(L.fam || {}) } : null; });
const sasMoney = (p) => p.waitForSelector('#nvSas', { timeout: 30000 }).then(() => p.textContent('#nvSas')).then((t) => t.replace(/\s/g, ''), () => '');
const textoMoney = (p) => p.evaluate(() => { const c = document.querySelector('.nv-card'); return c ? c.innerText : ''; });
/* "🔔 Pedido de acesso" agora (sem esperar a busca de 20 s) e "Ver". Devolve o texto do aviso */
async function verMoney(p) {
  await p.evaluate(() => { const ap = MoneyNuvem._teste.Aparelhos; ap._vistos = {}; return ap.olharPedidos(); });
  await p.waitForSelector('#nvPedidoVer', { timeout: 15000 });
  const t = await p.textContent('#nvPedido');
  await p.click('#nvPedidoVer');
  return t;
}
const skMoney = (p) => p.evaluate(async () => {
  const T = MoneyNuvem._teste, L = await T.Cadeado.local(), sk = await T.Cifra.decifrar(await T.Cifra.aes(T.Cadeado.dukRaw), L.sk), h = new Uint8Array(await crypto.subtle.digest('SHA-256', sk)); sk.fill(0);
  return Array.from(h, (b) => b.toString(16).padStart(2, '0')).join('');
});
const cfMoney = (p) => p.evaluate(() => { const r = MoneyNuvem._teste.Cadeado.cfRaw; return r ? btoa(String.fromCharCode.apply(null, r)) : ''; });
/* o MoneyTRIO pelo código antigo (como a 3.66 faz): "kit" e o PIN — "Crie o PIN da sua conta" ou "Digite o PIN da sua conta" */
async function codigoMoney(p, uid, pin) {
  await p.click('#nvCodigoAntigo', { timeout: 20000 }); await p.waitForSelector('#nvCod');
  await p.fill('#nvCod', PESSOAS[uid].codigo); await p.click('#nvCodOk');
  await p.waitForSelector('#nvP1, #nvPC', { timeout: 30000 });
  const criar = !!(await p.$('#nvP1')), texto = await textoMoney(p);
  if (criar) { await p.fill('#nvP1', pin); await p.fill('#nvP2', pin); await p.click('#nvPOk'); }
  else { await p.fill('#nvPC', pin); await p.click('#nvPCOk'); }
  return { criar, texto, abriu: await abriuMoney(p) };
}

(async () => {
  const browser = await iniciar();
  const { falhas, conferir } = criarConferir();
  const mt = await servir(PASTA);
  await prepararChaves();
  const vNuvem = (fs.readFileSync(path.join(PASTA, 'nuvem.js'), 'utf8').match(/var VERSAO = '([^']+)'/) || [])[1] || '?';
  console.log('MoneyTRIO de ' + PASTA + ' (nuvem.js ' + vNuvem + ') em ' + mt.base + ' · OmniLifeONE em ' + BASE);
  const todos = [];   /* {nome, p, lixo, ctx}: no fim, nenhum erro de script, diálogo nativo, PIN no console nem nada fora do banco de mentira */
  const novo = async (nome, vp, base, digital) => { const x = await aparelho(browser, { nome, vp, base, digital }); todos.push(x); return x; };
  /* nenhum PIN no localStorage/sessionStorage do aparelho (conferido antes de fechar cada um) */
  const guardados = [];
  const olharGuardado = async (x) => { guardados.push({ nome: x.p.nome, txt: await x.p.evaluate(() => JSON.stringify(Object.assign({}, localStorage)) + JSON.stringify(Object.assign({}, sessionStorage))).catch(() => '') }); };
  const fechar = async (x) => { await olharGuardado(x); await x.ctx.close(); x.fechado = true; };

  /* ===================== C1 ===================== */
  console.log('C1. A Ana cria o cadeado e o PIN da conta no MoneyTRIO (o código antigo e "Crie o PIN", como a 3.66 faz)');
  const MA = await novo('MoneyTRIO computador da Ana', 'computador', mt.base), ma = MA.p;
  await entrarMoney(ma, ANA);
  await ma.waitForSelector('#nvApOutro', { timeout: 20000 });
  conferir(/Primeira vez neste/.test(await textoMoney(ma)) && !(await ma.$('#nvJaUsa')) && !db.sol_aparelhos.some((a) => a.user_id === ANA), 'C1. MoneyTRIO: "🔐 Primeira vez neste …" e nenhum "Você já usa" (a Ana ainda não está em nenhum aparelho de nenhum app)');
  const c1 = await codigoMoney(ma, ANA, PIN_CONTA);
  conferir(c1.criar && /Crie o PIN da sua conta SolverONE/.test(c1.texto) && /OmniLifeONE/.test(c1.texto), 'C1. a conta sem PIN: "🔢 Crie o PIN da sua conta SolverONE" (vale no MoneyTRIO, no OmniLifeONE e nos próximos apps)');
  const LMA = await cadeadoMoney(ma), lMA = linha(LMA && LMA.ap);
  conferir(c1.abriu && lMA && lMA.app === 'moneytrio' && lMA.como === 'kit' && LMA.como === 'kit' && LMA.sk && LMA.srv && LMA.pinVersao === 1 && pinDaConta(ANA) && pinDaConta(ANA).versao === 1,
    'C1. o MoneyTRIO abre: na lista da conta como "kit" (app moneytrio, "' + (lMA && lMA.nome) + '"), com a chave pessoal, L.srv e o PIN da conta versão 1');
  const NOME = lMA && lMA.nome;

  /* ===================== C2 ===================== */
  console.log('C2. Um celular novo no OmniLifeONE entra aprovando pelo MoneyTRIO, com o mesmo PIN da conta');
  const OA = await novo('Omni celular da Ana', 'celular', BASE), oa = OA.p;
  await entrarOmni(oa, ANA); await quieto(oa);
  const sc = await senhasDaCasa(oa);
  conferir(sc.status.caso === 'outroApp' && sc.status.tem && sc.status.outrosApps.join() === 'MoneyTRIO' && sc.status.omniOutros === 0, 'C2. Omni → Senhas da casa: a Jornada lê o estado real (a conta já está no MoneyTRIO e já tem PIN: "outroApp")');
  await oa.click('#screen [data-act="cofre.comecar"]'); await janela(oa, /Primeira vez neste/);
  const t2 = await textoJanelas(oa);
  conferir(/Você já usa o MoneyTRIO\. Para entrar aqui, aprove por um aparelho seu \(pode ser o MoneyTRIO neste mesmo \S+\) e use o mesmo PIN da sua conta\./.test(t2) && !/O PIN que você escolher agora/.test(t2) && !!(await oa.$('.modal #apOutro')),
    'C2. "Você já usa o MoneyTRIO. Para entrar aqui, aprove por um aparelho seu (pode ser o MoneyTRIO neste mesmo …) e use o mesmo PIN da sua conta." (a conta já tem PIN)');
  await oa.click('.modal #apOutro'); await oa.waitForSelector('.modal #apEsperando', { timeout: 10000 });
  const p2 = pedidoDe(ANA);
  conferir(p2 && p2.app === 'omnilife' && !p2.grupo_id && p2.nome === NOME, 'C2. o pedido do Omni: app "omnilife", pessoal, com o mesmo nome do aparelho ("' + (p2 && p2.nome) + '")');
  const f2 = await verMoney(ma);
  conferir(/Pedido de acesso: .+ · OmniLifeONE · /.test(f2), 'C2. no MoneyTRIO aparece "🔔 Pedido de acesso: … · OmniLifeONE · …"');
  const [s2m, s2o] = await Promise.all([sasMoney(ma), sasOmni(oa)]);
  conferir(/^\d{6}$/.test(s2m) && s2m === s2o, 'C2. os mesmos 6 números nos dois apps (MoneyTRIO ' + s2m + ' = Omni ' + s2o + ')');
  await ma.fill('#nvApPin', PIN_CONTA); await ma.click('#nvApOk');
  conferir(await janela(oa, /Digite o PIN da sua conta/, 30000) && !(await temJanela(oa, /Crie o PIN/)), 'C2. aprovado no MoneyTRIO → Omni: "🔢 Digite o PIN da sua conta" (não cria outro PIN)');
  await oa.fill('.modal #pcPin', PIN_CONTA); await oa.click('.modal #pcOk');
  conferir(await abriu(oa), 'C2. o PIN da conta (criado no MoneyTRIO) abre as Senhas da casa no Omni');
  const LOA = await cadeado(oa), lOA = linha(LOA && LOA.ap);
  conferir(LOA.sk && LOA.fam.join() === GID && LOA.como === 'aparelho' && LOA.srv && LOA.pinVersao === 1 && lOA && lOA.app === 'omnilife' && lOA.aprovado_por === ANA && lOA.aprovado_por_ap === LMA.ap && p2.estado === 'usado' && p2.resposta === null,
    'C2. no Omni: a chave pessoal e a da família, "aparelho", L.srv e versão 1; na lista, aprovado pela Ana PELO MoneyTRIO (aprovado_por_ap); o pedido "usado", sem resposta');
  await oa.evaluate(() => go('settings', 'conta'));
  const grupoO = await oa.waitForFunction((n) => { const e = document.querySelector('#segAps'); return e && e.innerText.includes(n + ' · MoneyTRIO e OmniLifeONE (este aparelho)') ? e.innerText : false; }, NOME, { timeout: 20000 }).then((h) => h.jsonValue(), () => '');
  conferir(!!grupoO, 'C2. Omni → Segurança e aparelhos → Seus aparelhos: "' + NOME + ' · MoneyTRIO e OmniLifeONE (este aparelho)" (o mesmo nome nos dois apps = uma linha)');
  await ma.evaluate(() => MoneyNuvem.abrirPainel());
  const grupoM = await ma.waitForFunction((n) => { const e = document.querySelector('#nvAps'); return e && e.querySelector('.nv-ap') && e.innerText.includes(n + ' · MoneyTRIO e OmniLifeONE') ? e.innerText : false; }, NOME, { timeout: 20000 }).then((h) => h.jsonValue(), () => '');
  conferir(!!grupoM, 'C2. e no MoneyTRIO (Segurança e aparelhos): "' + NOME + ' · MoneyTRIO e OmniLifeONE"');
  await ma.evaluate(() => MoneyNuvem._teste.Painel.fechar());

  /* ===================== C3 ===================== */
  console.log('C3. A Ana troca o PIN no Omni: o MoneyTRIO abre com o novo e não com o velho');
  await oa.click('#segPin [data-act="conta.pin.trocar"]'); await janela(oa, /Trocar o PIN da conta/);
  await oa.fill('.modal #pcAtual', PIN_CONTA); await oa.fill('.modal #pcP1', PIN_NOVO); await oa.fill('.modal #pcP2', PIN_NOVO); await oa.click('.modal #pcOk');
  const trocou = await oa.waitForFunction(() => /PIN trocado/.test(document.querySelector('#toasts').textContent), null, { timeout: 30000 }).then(() => true, () => false);
  conferir(trocou && pinDaConta(ANA).versao === 2 && (await cadeado(oa)).pinVersao === 2, 'C3. Omni: "✓ PIN trocado. Vale em todos os seus aparelhos e apps." (a conta na versão 2)');
  await ma.evaluate(() => MoneyNuvem._teste.Aparelhos.aoAbrir());
  const motivo = await ma.waitForSelector('#nvMotivo', { timeout: 20000 }).then(() => ma.textContent('#nvMotivo'), () => '');
  conferir(/O PIN da conta foi trocado em outro aparelho: digite o PIN novo/.test(motivo) && !(await ma.evaluate(() => MoneyNuvem._teste.Cadeado.aberto())), 'C3. o MoneyTRIO aberto confere e tranca: "O PIN da conta foi trocado em outro aparelho: digite o PIN novo."');
  await ma.fill('#nvPin', PIN_CONTA); await ma.click('#nvPinOk');
  const velho = await ma.waitForFunction(() => /PIN errado/.test((document.querySelector('#nvErro') || {}).textContent || ''), null, { timeout: 30000 }).then(() => true, () => false);
  conferir(velho && !(await ma.evaluate(() => MoneyNuvem._teste.Cadeado.aberto())), 'C3. MoneyTRIO: o PIN velho não abre ("PIN errado")');
  await ma.reload();
  await ma.waitForSelector('#nvPin', { timeout: 30000 });
  await ma.fill('#nvPin', PIN_CONTA); await ma.click('#nvPinOk');
  const velho2 = await ma.waitForFunction(() => /PIN errado/.test((document.querySelector('#nvErro') || {}).textContent || ''), null, { timeout: 30000 }).then(() => true, () => false);
  conferir(velho2, 'C3. recarregado, o PIN velho continua sem abrir');
  await ma.fill('#nvPin', PIN_NOVO); await ma.click('#nvPinOk');
  const LMA3 = (await abriuMoney(ma)) && await cadeadoMoney(ma);
  conferir(LMA3 && LMA3.pinVersao === 2 && LMA3.srv && LMA3.ap === LMA.ap && pinDaConta(ANA).tentativas === 0, 'C3. o PIN novo (trocado no Omni) abre o MoneyTRIO: versão 2 no cadeado de lá, o mesmo lugar na lista, nenhuma tentativa sobrando');

  /* ===================== C4 ===================== */
  console.log('C4. O Omni aprova um pedido pessoal feito no MoneyTRIO (um celular novo da Ana)');
  const MB = await novo('MoneyTRIO celular da Ana', 'celular', mt.base), mb = MB.p;
  await entrarMoney(mb, ANA); await mb.waitForSelector('#nvApOutro', { timeout: 20000 });
  const jaUsa = await mb.waitForSelector('#nvJaUsa', { timeout: 8000 }).then(() => mb.textContent('#nvJaUsa'), () => '');
  conferir(/Você já usa o OmniLifeONE\. Aprove por um aparelho seu/.test(jaUsa), 'C4. MoneyTRIO (celular novo): "👋 Você já usa o OmniLifeONE. Aprove por um aparelho seu…"');
  await mb.click('#nvApOutro'); await mb.waitForSelector('#nvEsperando', { timeout: 15000 });
  const p4 = pedidoDe(ANA);
  conferir(p4 && p4.app === 'moneytrio' && !p4.grupo_id, 'C4. o pedido do MoneyTRIO: app "moneytrio", pessoal');
  const f4 = await olhar(oa);
  conferir(/Pedido de acesso: .+ \(MoneyTRIO\) · /.test(f4), 'C4. Omni: a faixa "🔔 Pedido de acesso: ' + NOME + ' (MoneyTRIO) · …"');
  await oa.click('#apFaixa #apVer'); await janela(oa, /Pedido de acesso/);
  const t4 = await textoJanelas(oa);
  conferir(t4.includes('Pedido de acesso de: ' + NOME + ' (MoneyTRIO) · ') && /Só aprove se este pedido é do aparelho que você está segurando agora/.test(t4), 'C4. a janela do Omni: "Pedido de acesso de: ' + NOME + ' (MoneyTRIO) · …" e o aviso "Só aprove se…"');
  const [s4o, s4m] = await Promise.all([sasOmni(oa), sasMoney(mb)]);
  conferir(/^\d{6}$/.test(s4o) && s4o === s4m, 'C4. os mesmos 6 números (Omni ' + s4o + ' = MoneyTRIO ' + s4m + ')');
  await oa.fill('.modal #apPin', PIN_NOVO); await oa.click('.modal #apOk');
  const apr4 = await oa.waitForFunction(() => /Aprovado\. O outro aparelho já pode entrar com o PIN da sua conta/.test(document.querySelector('#toasts').textContent), null, { timeout: 30000 }).then(() => true, () => false);
  conferir(apr4, 'C4. Omni: "✓ Aprovado. O outro aparelho já pode entrar com o PIN da sua conta."');
  await mb.waitForSelector('#nvPC', { timeout: 30000 }).catch(() => {});
  conferir(/Digite o PIN da sua conta/.test(await textoMoney(mb)) && !(await mb.$('#nvP1')), 'C4. MoneyTRIO: "Digite o PIN da sua conta" (o PIN trocado no Omni)');
  await mb.fill('#nvPC', PIN_NOVO); await mb.click('#nvPCOk');
  const LMB = (await abriuMoney(mb)) && await cadeadoMoney(mb), lMB = linha(LMB && LMB.ap);
  conferir(LMB && LMB.sk && LMB.como === 'aparelho' && LMB.srv && LMB.pinVersao === 2 && LMB.fam.join() === GID && lMB && lMB.app === 'moneytrio' && lMB.aprovado_por === ANA && lMB.aprovado_por_ap === LOA.ap && p4.estado === 'usado' && p4.resposta === null,
    'C4. o MoneyTRIO abre com a chave que o Omni mandou: "aparelho", L.srv e versão 2; na lista, aprovado pela Ana PELO Omni; o pedido "usado"');

  /* ===================== C5 ===================== */
  console.log('C5. As respostas abrem dos dois lados, sem conversão');
  const r2 = respostaDe(p2.id), r4 = respostaDe(p4.id);
  conferir(formatoOk(r2) && formatoOk(r4), 'C5. a resposta do MoneyTRIO (C2) e a do Omni (C4) no mesmo formato: {v:2, iv (12 bytes), ct}, base64 padrão');
  const hPapel = hex(await privadaDe(ANA)), hOA = await skOmni(oa), hMA = await skMoney(ma), hMB = await skMoney(mb);
  conferir(hPapel === hMA && hMA === hOA && hOA === hMB, 'C5. a MESMA chave pessoal no MoneyTRIO do computador, no Omni do celular (que o MoneyTRIO mandou) e no MoneyTRIO do celular (que o Omni mandou) — a do papel');
  const cfs = [await cfMoney(ma), await cfOmni(oa), await cfMoney(mb)];
  conferir(cfs.every((x) => x === b64n(cf())), 'C5. e a MESMA chave da família (CF) nos três');
  for (const x of [MA, MB]) await fechar(x);

  /* ===================== CP (pendência da etapa 9) ===================== */
  console.log('CP. A "digital em todos os aparelhos" ligada no Omni abre um MoneyTRIO novo (a mesma passkey; em localhost as duas portas têm o mesmo rpId)');
  const OP = await novo('Omni computador da Ana (com leitor)', 'computador', BASE, true), op = OP.p;
  await entrarOmni(op, ANA); await semOferta(op); await quieto(op);
  conferir(await codigoOmni(op, ANA, PIN_NOVO), 'CP. preparo: um computador com leitor no Omni (código antigo + o PIN da conta)');
  if (await op.waitForSelector('.modal #apDigNao', { timeout: 4000 }).then(() => true, () => false)) await op.click('.modal #apDigNao');
  await avancado(op);
  await op.click('#segPasskey [data-act="conta.pk.ligar"]'); await provar(op, PIN_NOVO);
  const pkOk = await op.waitForFunction(() => /a digital abre as Senhas da casa sem precisar de outro aparelho/.test(document.querySelector('#toasts').textContent), null, { timeout: 30000 }).then(() => true, () => false);
  const pk = db.sol_passkeys.filter((k) => k.user_id === ANA && !k.removido_em);
  conferir(pkOk && pk.length === 1, 'CP. Omni → Avançado → "👆 Digital em todos os aparelhos" ligada (o PIN de agora): uma passkey na conta');
  /* a mesma aba (o mesmo autenticador, como a conta do Google/Apple leva a passkey) no endereço do MoneyTRIO: outro IndexedDB e
     outra sessão = um aparelho novo, no outro app */
  await OP.ctx.route(mt.base + '/**', (r) => r.continue());
  await op.goto(mt.base + '/'); await op.waitForSelector('#nvEm', { timeout: 20000 });
  await op.fill('#nvEm', PESSOAS[ANA].email); await op.fill('#nvPw', PESSOAS[ANA].senha); await op.click('#nvIn');
  const temPk = await op.waitForSelector('#nvApPasskey', { timeout: 20000 }).then(() => true, () => false);
  conferir(temPk, 'CP. MoneyTRIO (sem cadeado aqui, com leitor e a passkey na conta): "👆 Usar a digital (passkey)"');
  await op.click('#nvApPasskey');
  await op.waitForSelector('#nvPC', { timeout: 30000 }).catch(() => {});
  conferir(/Digite o PIN da sua conta/.test(await textoMoney(op)) && db.sol_aparelhos.some((a) => a.user_id === ANA && a.app === 'moneytrio' && a.como === 'passkey' && !a.removido_em), 'CP. a digital abriu a chave que o Omni guardou: "Digite o PIN da sua conta"; na lista como "passkey" (moneytrio)');
  await op.fill('#nvPC', PIN_NOVO); await op.click('#nvPCOk');
  if (await op.waitForSelector('#nvDigNao', { timeout: 30000 }).then(() => true, () => false)) await op.click('#nvDigNao');   /* "Usar a digital neste …?" do MoneyTRIO */
  const LOP = (await abriuMoney(op)) && await cadeadoMoney(op);
  conferir(LOP && LOP.como === 'passkey' && LOP.sk && LOP.srv && LOP.pinVersao === 2 && await skMoney(op) === hPapel, 'CP. o MoneyTRIO abre: "passkey", L.srv, versão 2 e a MESMA chave pessoal (o fechado do Omni abre no MoneyTRIO, sem conversão)');

  /* ===================== CK (pendência da etapa 9) ===================== */
  console.log('CK. O código novo do kit, feito no Omni, abre o MoneyTRIO; com o kit desligado, o link some lá');
  await avancado(oa);
  await oa.click('#segKit [data-act="conta.kit.ligar"]'); await provar(oa, PIN_NOVO);
  await janelaTxt(oa, /O papel antigo deixa de valer/); await oa.click('.modal [data-yes]');
  await janelaTxt(oa, /Anote este código num papel/);
  const CODIGO = await oa.evaluate(() => document.querySelector('.modal .vcode').textContent.trim());
  await oa.check('.modal #cfok'); await oa.click('.modal:has(#cfok) [data-ok]');
  await oa.waitForFunction(() => /Código novo salvo/.test(document.querySelector('#toasts').textContent), null, { timeout: 15000 }).catch(() => {});
  conferir(/^[A-Z2-9]{5}(-[A-Z2-9]{5}){3}$/.test(CODIGO) && CODIGO !== PESSOAS[ANA].codigo, 'CK. Omni → Avançado → "Fazer um código novo" (o PIN de agora, "o papel antigo deixa de valer, aqui e no MoneyTRIO")');
  const MK = await novo('MoneyTRIO celular da Ana (código novo)', 'celular', mt.base), mk1 = MK.p;
  await entrarMoney(mk1, ANA);
  await mk1.click('#nvCodigoAntigo', { timeout: 20000 }); await mk1.waitForSelector('#nvCod');
  await mk1.fill('#nvCod', PESSOAS[ANA].codigo); await mk1.click('#nvCodOk');
  await mk1.waitForSelector('#nvPC', { timeout: 30000 }); await mk1.fill('#nvPC', PIN_NOVO); await mk1.click('#nvPCOk');
  const velhoNao = await mk1.waitForFunction(() => /Esse código não confere/.test((document.querySelector('#nvErro') || {}).textContent || ''), null, { timeout: 60000 }).then(() => true, () => false);
  conferir(velhoNao && !(await mk1.evaluate(() => MoneyNuvem._teste.Cadeado.local())), 'CK. no MoneyTRIO o papel antigo não abre mais ("Esse código não confere…")');
  await mk1.fill('#nvCod', CODIGO); await mk1.click('#nvCodOk');
  await mk1.waitForSelector('#nvPC', { timeout: 30000 }); await mk1.fill('#nvPC', PIN_NOVO); await mk1.click('#nvPCOk');
  const LMK = (await abriuMoney(mk1)) && await cadeadoMoney(mk1);
  conferir(LMK && LMK.como === 'kit' && LMK.sk && await skMoney(mk1) === hPapel, 'CK. o código novo (feito no Omni) abre o MoneyTRIO: "kit" e a MESMA chave pessoal');
  await fechar(MK);
  await avancado(oa);
  await oa.click('#segKit [data-act="conta.kit.desligar"]'); await janelaTxt(oa, /Desligar o kit de emergência\?/); await oa.click('.modal [data-yes]');
  if (await janelaTxt(oa, /único jeito de voltar/, 2000)) await oa.click('.modal [data-yes]');
  await oa.waitForFunction(() => /Kit de emergência desligado/.test(document.querySelector('#toasts').textContent), null, { timeout: 15000 }).catch(() => {});
  conferir(!db.omni_chave_privada.some((x) => x.user_id === ANA), 'CK. Omni → "Desligar" o kit: a linha sai de omni_chave_privada (o banco de mentira já deixa apagar)');
  const MK2 = await novo('MoneyTRIO celular da Ana (sem kit)', 'celular', mt.base), mk2 = MK2.p, nBk = M.log.length;
  await entrarMoney(mk2, ANA); await mk2.waitForSelector('#nvApOutro', { timeout: 20000 });
  const leu = await (async () => { const fim = Date.now() + 15000; while (Date.now() < fim) { if (M.log.slice(nBk).some((x) => x.metodo === 'GET' && /omni_chave_privada/.test(x.caminho))) return true; await new Promise((r) => setTimeout(r, 100)); } return false; })();
  await new Promise((r) => setTimeout(r, 800));
  conferir(leu && !(await mk2.$('#nvCodigoAntigo')), 'CK. e no MoneyTRIO (aparelho novo) o link "Tenho o código de recuperação antigo" some');
  await fechar(MK2); await fechar(OP);

  /* ===================== C6 ===================== */
  console.log('C6. "Para a família" entre os apps, nos dois sentidos (a 3.66 ainda oferece "👪 Pedir para alguém da família aprovar")');
  const mk = await prepararMoneyChaves({ tudo: [BIA] });
  conferir(db.money_chaves.filter((k) => k.user_id === ANA).length === 2 && db.money_chaves.filter((k) => k.user_id === BIA).length === 2 && mk.c.length === 32,
    'C6. preparo: a família com as chaves próprias do MoneyTRIO 3.66 ("dois cofres": a da casa e a reservada) para a Ana (chefe) e a Bia ("Tudo")');
  /* C6a: a Bia, no Omni, aprova o MoneyTRIO novo da Ana pela família */
  const OB = await novo('Omni computador da Bia', 'computador', BASE), ob = OB.p;
  await entrarOmni(ob, BIA); await quieto(ob);
  const abriuB = await codigoOmni(ob, BIA, PIN_BIA), LOB = await cadeado(ob);
  conferir(abriuB && LOB.sk && LOB.como === 'kit' && LOB.srv && pinDaConta(BIA) && pinDaConta(BIA).versao === 1, 'C6a. preparo: o computador da Bia no Omni (código antigo, "kit") com o PIN da conta dela');
  const MC = await novo('MoneyTRIO celular da Ana (pela família)', 'celular', mt.base), mc = MC.p;
  await entrarMoney(mc, ANA); await mc.waitForSelector('#nvApFam', { timeout: 20000 });
  await mc.click('#nvApFam'); await mc.waitForSelector('#nvEsperando', { timeout: 15000 });
  const p6a = pedidoDe(ANA);
  conferir(p6a && p6a.app === 'moneytrio' && p6a.grupo_id === GID, 'C6a. o pedido "para a família" do MoneyTRIO: app "moneytrio", com a família');
  const f6a = await olhar(ob);
  conferir(/Pedido de acesso de Ana Teste: .+ \(MoneyTRIO\) · /.test(f6a), 'C6a. Omni da Bia: a faixa "🔔 Pedido de acesso de Ana Teste: ' + NOME + ' (MoneyTRIO) · …"');
  await ob.click('#apFaixa #apVer'); await janela(ob, /Pedido de acesso/);
  const t6a = await textoJanelas(ob);
  conferir(t6a.includes('Ana Teste (ana@teste.com) quer entrar na família Família Teste pelo aparelho ' + NOME + ' (MoneyTRIO) · ') && /Só aprove se a pessoa está com você \(ou ao telefone\) e lê o mesmo número/.test(t6a),
    'C6a. a janela do Omni: "Ana Teste (ana@teste.com) quer entrar na família Família Teste pelo aparelho ' + NOME + ' (MoneyTRIO)" e o aviso da família');
  const [s6ao, s6am] = await Promise.all([sasOmni(ob), sasMoney(mc)]);
  conferir(/^\d{6}$/.test(s6ao) && s6ao === s6am, 'C6a. os mesmos 6 números (Omni ' + s6ao + ' = MoneyTRIO ' + s6am + ')');
  await ob.fill('.modal #apPin', PIN_BIA); await ob.click('.modal #apOk');
  await mc.waitForSelector('#nvPC', { timeout: 30000 }).catch(() => {});
  conferir(/Digite o PIN da sua conta/.test(await textoMoney(mc)), 'C6a. MoneyTRIO: "Digite o PIN da sua conta" (o da Ana)');
  await mc.fill('#nvPC', PIN_NOVO); await mc.click('#nvPCOk');
  const LMC = (await abriuMoney(mc)) && await cadeadoMoney(mc), lMC = linha(LMC && LMC.ap);
  conferir(LMC && !LMC.sk && LMC.fam.join() === GID && LMC.como === 'familia' && LMC.srv && LMC.pinVersao === 2 && lMC && lMC.app === 'moneytrio' && lMC.como === 'familia' && lMC.aprovado_por === BIA && lMC.aprovado_por_ap === LOB.ap && p6a.estado === 'usado' && formatoOk(respostaDe(p6a.id)),
    'C6a. o MoneyTRIO abre só com a chave da família que o Omni mandou (sem a chave pessoal da Ana), "familia", aprovado pela Bia PELO Omni; a resposta no formato da plataforma');
  conferir(await cfMoney(mc) === b64n(cf()), 'C6a. a chave da família no MoneyTRIO é a da família (a mesma CF do Omni)');
  const est6a = await mc.evaluate(() => MoneyNuvem.escopos.estado());
  console.log('  ℹ limite (anotado): o MoneyTRIO aprovado pela família pelo Omni abre sem as chaves próprias do MoneyTRIO (mk: ' + est6a.mk + '), porque o Omni não as tem — nuvem.js 3.66 l. 734 (receber) e 821-824 (aprovar)');
  await oa.evaluate(async () => { const a = document.getElementById('apAviso'); if (a) a.remove(); await Aparelhos.aoAbrir(); });
  const av6a = await oa.waitForSelector('#apAviso', { timeout: 15000 }).then(() => oa.textContent('#apAviso'), () => '');
  conferir(/Um aparelho novo entrou na sua conta: .+ \(MoneyTRIO\), aprovado por Bia Teste · .+Não foi você\?/.test(av6a), 'C6a. o Omni da Ana avisa: "⚠️ Um aparelho novo entrou na sua conta: ' + NOME + ' (MoneyTRIO), aprovado por Bia Teste · …. Não foi você?"');
  await oa.click('#apAviso #apAvisoX');

  /* C6b: a Bia, no MoneyTRIO (com as chaves próprias da família), aprova o Omni novo da Ana pela família */
  const MBia = await novo('MoneyTRIO computador da Bia', 'computador', mt.base), mbia = MBia.p;
  await entrarMoney(mbia, BIA); await mbia.waitForSelector('#nvApOutro', { timeout: 20000 });
  const c6b = await codigoMoney(mbia, BIA, PIN_BIA);
  const LMBia = await cadeadoMoney(mbia), est6b = await mbia.evaluate(() => MoneyNuvem.escopos.estado());
  conferir(c6b.abriu && !c6b.criar && /Digite o PIN da sua conta/.test(c6b.texto) && LMBia.sk && LMBia.como === 'kit' && est6b.mk && est6b.tudo,
    'C6b. preparo: a Bia no MoneyTRIO (código antigo; "Digite o PIN da sua conta" — o mesmo PIN que ela criou no Omni) abre com as chaves próprias da família (a da casa e a reservada)');
  const OE = await novo('Omni computador da Ana (pela família)', 'computador', BASE), oe = OE.p;
  await entrarOmni(oe, ANA); await quieto(oe);
  await primeiraVez(oe);
  /* só os NOMES dos campos da carga que chegou (nada de valor sai da página) */
  await oe.evaluate(() => { const f = SolProto.lerCarga; SolProto.lerCarga = function (o) { window.__carga = { chaves: Object.keys(o || {}).sort(), mk: o && o.mk && typeof o.mk === 'object' ? Object.keys(o.mk).sort() : null }; return f.apply(this, arguments); }; });
  await oe.click('.modal #apFamilia'); await oe.waitForSelector('.modal #apEsperando', { timeout: 10000 });
  const p6b = pedidoDe(ANA);
  conferir(p6b && p6b.app === 'omnilife' && p6b.grupo_id === GID, 'C6b. o pedido "para a família" do Omni: app "omnilife", com a família');
  const f6b = await verMoney(mbia);
  conferir(/Pedido de acesso de Ana Teste: .+ · OmniLifeONE · /.test(f6b), 'C6b. no MoneyTRIO da Bia: "🔔 Pedido de acesso de Ana Teste: … · OmniLifeONE · …"');
  await mbia.waitForSelector('#nvSas', { timeout: 30000 }).catch(() => {});
  const t6b = await textoMoney(mbia);
  conferir(/Ana Teste.*\(ana@teste\.com\).*quer entrar nas finanças da família pelo aparelho/.test(t6b) && /Só aprove se a pessoa está com você/.test(t6b), 'C6b. o MoneyTRIO mostra quem pede (Ana Teste, ana@teste.com) e o aviso da família');
  const [s6bm, s6bo] = await Promise.all([sasMoney(mbia), sasOmni(oe)]);
  conferir(/^\d{6}$/.test(s6bm) && s6bm === s6bo, 'C6b. os mesmos 6 números (MoneyTRIO ' + s6bm + ' = Omni ' + s6bo + ')');
  await mbia.fill('#nvApPin', PIN_BIA); await mbia.click('#nvApOk');
  conferir(await janela(oe, /Digite o PIN da sua conta/, 30000), 'C6b. aprovado no MoneyTRIO → Omni: "Digite o PIN da sua conta"');
  await oe.fill('.modal #pcPin', PIN_NOVO); await oe.click('.modal #pcOk');
  conferir(await abriu(oe), 'C6b. o PIN da conta abre as Senhas da casa no Omni (pela família)');
  const LOE = await cadeado(oe), lOE = linha(LOE && LOE.ap), carga6b = await oe.evaluate(() => window.__carga);
  conferir(!LOE.sk && LOE.fam.join() === GID && LOE.como === 'familia' && LOE.srv && LOE.pinVersao === 2 && lOE && lOE.app === 'omnilife' && lOE.como === 'familia' && lOE.aprovado_por === BIA && lOE.aprovado_por_ap === LMBia.ap && p6b.estado === 'usado' && formatoOk(respostaDe(p6b.id)),
    'C6b. no Omni: só a chave da família (sem a pessoal), "familia", versão 2; aprovado pela Bia PELO MoneyTRIO; a resposta no formato da plataforma');
  conferir(await cfOmni(oe) === b64n(cf()), 'C6b. a chave da família no Omni é a da família (a mesma CF que o MoneyTRIO tinha)');
  conferir(carga6b && carga6b.chaves.join() === 'cf,fk,gid,kv,mk,tipo,v' && (carga6b.mk || []).join() === 'c,r,v' && !LOE.mk,
    'C6b. a carga da família do MoneyTRIO 3.66 leva também "mk" (as chaves do MoneyTRIO: c, r, v): o Omni aceita sem conversão, usa só a CF e não guarda "mk" no cadeado');
  await oa.evaluate(async () => { const a = document.getElementById('apAviso'); if (a) a.remove(); await Aparelhos.aoAbrir(); });
  const av6b = await oa.waitForSelector('#apAviso', { timeout: 15000 }).then(() => oa.textContent('#apAviso'), () => '');
  conferir(/Um aparelho novo entrou na sua conta: .+ \(OmniLifeONE\), aprovado por Bia Teste/.test(av6b), 'C6b. o Omni da Ana avisa do aparelho que a Bia aprovou pelo MoneyTRIO ("… (OmniLifeONE), aprovado por Bia Teste")');
  await mc.evaluate(() => { const a = document.getElementById('nvAvisoAp'); if (a) a.remove(); return MoneyNuvem._teste.Aparelhos.aoAbrir(); });
  const av6bm = await mc.waitForSelector('#nvAvisoAp', { timeout: 15000 }).then(() => mc.textContent('#nvAvisoAp'), () => '');
  conferir(/Um aparelho novo entrou na sua conta: .+, aprovado por Bia Teste/.test(av6bm), 'C6b. e o MoneyTRIO da Ana também avisa ("Um aparelho novo entrou na sua conta: …, aprovado por Bia Teste")');

  /* ===================== limpeza ===================== */
  for (const x of todos) if (!x.fechado) await olharGuardado(x);
  const sujos = todos.filter((x) => x.lixo.erros.length || x.lixo.nativos.length);
  conferir(!sujos.length, 'nenhum erro de script nem diálogo nativo nos dois apps' + (sujos.length ? ': ' + sujos.map((x) => x.p.nome + ': ' + x.lixo.erros.concat(x.lixo.nativos).join(' | ')).join(' || ') : ''));
  conferir(!todos.some((x) => x.lixo.fora.some((u) => /supabase/i.test(u))), 'nada vai para o Supabase de verdade: os dois apps só falam com o banco de mentira (o resto, como as cotações do MoneyTRIO, é cortado)');
  conferir(!todos.some((x) => x.lixo.console.some(temPin)), 'nenhum PIN no console dos dois apps');
  conferir(!guardados.some((g) => temPin(g.txt)), 'nenhum PIN no localStorage nem no sessionStorage de nenhum aparelho');
  for (const x of todos) if (!x.fechado) await x.ctx.close();
  await Promise.race([mt.fechar(), new Promise((r) => setTimeout(r, 3000))]);
  await terminar(falhas, browser, 'OmniLifeONE ↔ MoneyTRIO ' + vNuvem + ': a mesma conta e o mesmo PIN nos dois apps; cada um aprova o aparelho novo do outro (pessoal e pela família) com os mesmos 6 números; a troca do PIN num vale no outro; as respostas e as chaves sem conversão.');
})().catch((e) => { console.error('Erro no teste:', e && e.stack || e); process.exit(1); });
