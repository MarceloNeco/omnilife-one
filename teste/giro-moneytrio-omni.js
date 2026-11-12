/* Parte E (2.27.0), G6 do desenho (9.4): "o MoneyTRIO acompanha" a troca da chave de segurança da família, com o MoneyTRIO 3.66
   DE VERDADE (o index.html e o nuvem.js da pasta MONEYTRIO, só lidos: nada lá é mudado), servido em outro endereço localhost, e o
   OmniLifeONE desta pasta. Os dois falam com o MESMO "Supabase de mentira" (teste/mock-sol.js, no processo do Node). Cada aparelho
   é um contexto do navegador. Nada vai para a internet nem para o Supabase de verdade. A moldura é a do aparelhos-cruzado-omni.js.
   A família de mentira já está como a ordem D-E11 pede: o MoneyTRIO terminou a preparação dos "dois cofres" (as linhas dele na
   chave da casa e na reservada, o marcador e money_migracao), e a Ana (chefe) e a Bia (responsável, "Tudo") têm essas chaves.
     G6a  antes: o Omni da Ana (código + PIN da conta) e o MoneyTRIO da Ana e o da Bia abertos com a chave de antes; a Saúde manda um
          resumo com a de antes (não lido)
     G6b  a Ana troca no Omni (Giro.executar, a troca de verdade): "feito", a nova (kv 2) entregue à Ana e à Bia (D-E1); o resumo velho
          marcado como lido PELO OMNI (antes do "feito", C10) e o resumo de novo com a nova
     G6c  no MoneyTRIO da Ana, ainda com a de antes: a ponte vê a mensagem nova (outra fk, kv maior) → cfNova, sem abrir nem marcar;
          Cadeado.buscarMinha(sk, GID) → kv 2, fk = a do registro, os bytes = a nova; conferirCf com o cadeado feito com a de antes →
          true e L.fam[GID].fk novo (as chaves próprias do MoneyTRIO continuam no cadeado); usarSoCf(nova) + Cadeado.abrir do resumo
          novo → o resumo; o velho → null (e já lido, marcado pelo Omni); as linhas da família no MoneyTRIO ("dois cofres": casa e
          reservado) continuam abrindo — elas não dependem da chave da família; uma linha ainda na chave de antes (como antes da
          preparação do MoneyTRIO) NÃO abre mais: é por isso que a troca só vem depois da migração (D-E11)
     G6d  o MoneyTRIO da Bia, fechado e aberto de novo pelo PIN (o caminho de verdade): conferirCf adota a nova sozinho, as linhas da
          família continuam na tela, e a ponte abre o resumo novo e o aplica (marca como lido)
     G6e  o MoneyTRIO nunca lê as Senhas da casa (nenhum pedido a omni_docs): elas são do Omni e só abrem nele (as linhas do cofre da
          família no OMNI não são do MoneyTRIO e não devem abrir lá — ele nem as busca)
   A ponte automática do MoneyTRIO fica PARADA no teste (só nesta página, sem mudar o arquivo) enquanto existem o resumo velho e o
   novo não lidos: assim o teste prova que quem marca o velho é o Omni, e controla quando o MoneyTRIO lê o novo.
   Sem MONEYTRIO=<pasta do investify-me> o teste diz "PULADO" e sai com 0 (não falha a suíte).
   Pessoas, senhas, códigos e chaves de mentira (teste/mock-sol.js).
   Uso: MONEYTRIO=<pasta> node teste/rodar.js   ·   sozinho: MONEYTRIO=<pasta> BASE=http://localhost:8099 node teste/giro-moneytrio-omni.js */
'use strict';
const fs = require('fs'), path = require('path'), crypto = require('crypto');
const PASTA = process.env.MONEYTRIO ? path.resolve(process.env.MONEYTRIO) : '';
if (!PASTA) { console.log('PULADO: o G6 (o MoneyTRIO acompanha a troca) precisa de MONEYTRIO=<pasta do investify-me> (o MoneyTRIO neste computador).'); process.exit(0); }
if (!fs.existsSync(path.join(PASTA, 'nuvem.js')) || !fs.existsSync(path.join(PASTA, 'index.html'))) {
  console.log('  ✗ MONEYTRIO=' + PASTA + ' não é a pasta do MoneyTRIO (faltam nuvem.js e index.html)'); process.exit(1);
}
const { BASE, criarConferir, iniciar, terminar } = require('./_base');
const { M, db, rpcs, prepararChaves, prepararMoneyChaves, agora, PESSOAS, ANA, BIA, GID } = require('./mock-sol');
const { servir, aparelho, entrarOmni, entrarMoney, senhasDaCasa } = require('./_nuvem');

const PIN_A = '590317', PIN_B = '271846', PINS = [PIN_A, PIN_B], FK0 = 'fk-teste';
const temPin = (t) => PINS.some((n) => new RegExp('(^|[^0-9])' + n + '([^0-9]|$)').test(String(t)));
const subtle = crypto.webcrypto.subtle, utf8 = (t) => new TextEncoder().encode(t), b64 = (b) => Buffer.from(b).toString('base64');
const unb64 = (s) => new Uint8Array(Buffer.from(s, 'base64'));
const hex = (b) => crypto.createHash('sha256').update(Buffer.from(b)).digest('hex');
const espere = (ms) => new Promise((r) => setTimeout(r, ms));
async function ate(fn, ms) { const fim = Date.now() + (ms || 8000); while (Date.now() < fim) { if (fn()) return true; await espere(150); } return !!fn(); }

/* ---- as contas em Node (o mesmo formato do Cofre do Omni e do Cadeado do MoneyTRIO) ---- */
const aes = (raw) => subtle.importKey('raw', raw, { name: 'AES-GCM' }, false, ['encrypt', 'decrypt']);
async function cifrar(raw, bytes) { const iv = crypto.randomBytes(12); return { iv: b64(iv), ct: b64(await subtle.encrypt({ name: 'AES-GCM', iv }, await aes(raw), bytes)) }; }
async function decifrar(raw, o) { return new Uint8Array(await subtle.decrypt({ name: 'AES-GCM', iv: unb64(o.iv) }, await aes(raw), unb64(o.ct))); }
/* uma linha das Senhas da casa: {c:1, kv, fk, iv, ct} e dentro o item com a parte interna (a MESMA CF) */
async function selar(raw, kv, fk, doc) { return JSON.stringify(Object.assign({ c: 1, kv, fk }, await cifrar(raw, utf8(JSON.stringify(doc))))); }
/* a CF de uma pessoa (a versão mais alta dela em sol_grupo_chaves), aberta em Node com M.PKCS8 (só o teste): {raw, kv, fk} */
async function chaveDaPessoa(uid) {
  const c = db.sol_grupo_chaves.filter((x) => x.grupo_id === GID && x.user_id === uid).sort((a, b) => b.versao - a.versao)[0];
  const sk = await subtle.importKey('pkcs8', M.PKCS8[uid], { name: 'RSA-OAEP', hash: 'SHA-256' }, false, ['decrypt']);
  const o = JSON.parse(new TextDecoder().decode(await subtle.decrypt({ name: 'RSA-OAEP' }, sk, Buffer.from(String(c.chave_embrulhada).replace(/^1\./, ''), 'base64'))));
  return { raw: unb64(o.k), kv: o.kv, fk: o.fk };
}
const linha = (col, id) => db.omni_docs.find((d) => d.grupo_id === GID && d.colecao === col && d.id === id);
/* uma linha do MoneyTRIO "dois cofres" (money_docs): {c:1, m:'c'|'r', mv, iv, ct} com a chave da casa ou a reservada */
async function linhaMoney(col, id, raw, m, obj) {
  const h = agora();
  db.money_docs.push({ grupo_id: GID, colecao: col, id, dados_cifrado: JSON.stringify(Object.assign({ c: 1, m, mv: 1 }, await cifrar(raw, utf8(JSON.stringify(obj))))),
    escopo: m === 'r' ? 'reservado' : 'casa', versao: 1, criado_por: ANA, criado_em: h, atualizado_por: ANA, atualizado_em: h, apagado_em: null });
}
const moneyDe = (col, id) => db.money_docs.find((d) => d.grupo_id === GID && d.colecao === col && d.id === id);

/* ---- OmniLifeONE (como o aparelhos-cruzado-omni.js) ---- */
const janela = (p, re, ms) => p.waitForFunction((re) => [...document.querySelectorAll('.modal h3')].some((h) => new RegExp(re).test(h.textContent)), re.source, { timeout: ms || 10000 }).then(() => true, () => false);
const abriu = (p) => p.waitForFunction(() => Cofre.aberto() && !document.querySelector('.modal'), null, { timeout: 60000 }).then(() => true, () => false);
const quieto = (p) => p.evaluate(() => { AOne.save({ hello: 1, tour: 1, tips: Object.assign({}, AOne.cfg().tips, { home: 1, settings: 1, house: 1, family: 1 }) }); if (AOne.view) AOne.close(); lsSet(GuiaCofre.K, Date.now()); });
/* o cadeado do Omni pelo código antigo ("kit") e o PIN da conta ("Crie o PIN" ou "Digite o PIN da sua conta") */
async function codigoOmni(p, uid, pin) {
  await senhasDaCasa(p); await p.click('#screen [data-act="cofre.comecar"]'); await janela(p, /Primeira vez neste/);
  await p.click('.modal #apCodigo'); await p.waitForSelector('.modal #apCod', { timeout: 8000 });
  await p.fill('.modal #apCod', PESSOAS[uid].codigo); await p.click('.modal #apCodOk');
  if (await janela(p, /Crie o PIN da sua conta SolverONE/, 20000)) { await p.fill('.modal #pcP1', pin); await p.fill('.modal #pcP2', pin); await p.click('.modal #pcOk'); }
  else { await janela(p, /Digite o PIN da sua conta/, 5000); await p.fill('.modal #pcPin', pin); await p.click('.modal #pcOk'); }
  return abriu(p);
}
/* a fila do Omni sobe até o fim */
const subir = (p) => p.evaluate(async () => {
  for (let i = 0; i < 80; i++) {
    if (!CloudDriver._flushing) await CloudDriver.flush(true);
    if (!CloudDriver._flushing && !CloudDriver.fila.size) return;
    await new Promise((r) => setTimeout(r, 100));
  }
});

/* ---- MoneyTRIO (as peças que o próprio nuvem.js expõe para os testes dele: MoneyNuvem._teste) ---- */
const abriuMoney = (p) => p.waitForFunction(() => window.MoneyNuvem && MoneyNuvem._teste.Cadeado.aberto() && MoneyNuvem.iniciado && !!document.getElementById('nvSelo'), null, { timeout: 90000 }).then(() => true, () => false);
const textoMoney = (p) => p.evaluate(() => { const c = document.querySelector('.nv-card'); return c ? c.innerText : ''; });
/* o MoneyTRIO pelo código antigo (como a 3.66 faz): "kit" e o PIN — "Crie o PIN da sua conta" ou "Digite o PIN da sua conta" */
async function codigoMoney(p, uid, pin) {
  await p.click('#nvCodigoAntigo', { timeout: 20000 }); await p.waitForSelector('#nvCod');
  await p.fill('#nvCod', PESSOAS[uid].codigo); await p.click('#nvCodOk');
  await p.waitForSelector('#nvP1, #nvPC', { timeout: 30000 });
  const criar = !!(await p.$('#nvP1'));
  if (criar) { await p.fill('#nvP1', pin); await p.fill('#nvP2', pin); await p.click('#nvPOk'); }
  else { await p.fill('#nvPC', pin); await p.click('#nvPCOk'); }
  return abriuMoney(p);
}
/* o que o cadeado do MoneyTRIO tem agora (na memória e no aparelho), sem bytes: {fk, kv, mk, Lfk, Lkv, Lmk, cfNova} */
const estadoMoney = (p, gid) => p.evaluate(async (gid) => {
  const T = MoneyNuvem._teste, L = await T.Cadeado.local(), f = (L && L.fam && L.fam[gid]) || {};
  return { fk: T.Cadeado.fk, kv: T.Cadeado.kv, mk: !!T.Cadeado.mk, Lfk: f.fk || null, Lkv: f.kv || 0, Lmk: !!f.mk, cfNova: !!MoneyNuvem.escopos.estado().cfNova };
}, gid);
/* a ponte automática do MoneyTRIO parada (só nesta página) ou de volta */
const pararPonte = (p) => p.evaluate(() => { const P = MoneyNuvem._teste.Ponte; if (!window.__pb) window.__pb = P.buscar; P.buscar = async function () { return []; }; });
const voltarPonte = (p) => p.evaluate(() => { const P = MoneyNuvem._teste.Ponte; if (window.__pb) { P.buscar = window.__pb; window.__pb = null; } });
/* os sol_ponte_marcar_lido que este aparelho pediu: [p_id] */
const marcadosPor = (x) => x.reqs.filter((r) => /\/rpc\/sol_ponte_marcar_lido$/.test(r.url.split('?')[0])).map((r) => { try { return JSON.parse(r.corpo).p_id; } catch (e) { return null; } });

(async () => {
  const browser = await iniciar();
  const { falhas, conferir } = criarConferir();
  const mt = await servir(PASTA);
  const vNuvem = (fs.readFileSync(path.join(PASTA, 'nuvem.js'), 'utf8').match(/var VERSAO = '([^']+)'/) || [])[1] || '?';
  console.log('MoneyTRIO de ' + PASTA + ' (nuvem.js ' + vNuvem + ') em ' + mt.base + ' · OmniLifeONE em ' + BASE);

  /* ---- a família de mentira: a CF de antes (kv 1, fk-teste), as chaves do MoneyTRIO (casa e reservada) da Ana e da Bia, as linhas
     da família no MoneyTRIO já nos "dois cofres" (a preparação terminou: o marcador e money_migracao) e três itens nas Senhas da casa ---- */
  await prepararChaves();
  const mk = await prepararMoneyChaves({ tudo: [BIA] }), VELHA = new Uint8Array(M.cfVelha);
  await linhaMoney('bancos', 'b1', mk.c, 'c', { id: 'b1', nome: 'Banco da casa de mentira' });
  await linhaMoney('metas', 'r.m1', mk.r, 'r', { id: 'm1', nome: 'Meta reservada de mentira' });
  await linhaMoney('config', 'r.escopos', mk.r, 'r', { v: { v: 1, em: agora() } });
  db.money_migracao.push({ grupo_id: GID, concluida_em: agora(), por: ANA });
  for (let i = 0; i < 3; i++) {
    const h = agora(), doc = { kind: 'senha', enc: await cifrar(VELHA, utf8(JSON.stringify({ title: 'Item de mentira ' + i }))), files: [], vis: 'restrito', updatedAt: h };
    db.omni_docs.push({ grupo_id: GID, colecao: 'vault', id: 'v' + i, vis: 'restrito', dados: null, dados_cifrado: await selar(VELHA, 1, FK0, doc), versao: 1, criado_por: ANA, criado_em: h, atualizado_por: ANA, atualizado_em: h, apagado_em: null });
  }

  const todos = [];
  const novo = async (nome, vp, base) => { const x = await aparelho(browser, { nome, vp, base }); x.reqs = []; x.ctx.on('request', (r) => x.reqs.push({ url: r.url(), corpo: r.postData() })); todos.push(x); return x; };

  /* ===================== G6a ===================== */
  console.log('G6a. Antes da troca: o Omni da Ana, o MoneyTRIO da Ana e o da Bia abertos com a chave de antes; a Saúde manda um resumo');
  const OA = await novo('Omni computador da Ana', 'computador', BASE), oa = OA.p;
  await entrarOmni(oa, ANA); await quieto(oa);
  conferir(await codigoOmni(oa, ANA, PIN_A) && await oa.evaluate(() => Cofre.fk === 'fk-teste' && Cofre.kv === 1), 'G6a. o Omni da Ana abre as Senhas da casa (código + "Crie o PIN da sua conta") com a chave de antes (kv 1)');
  const MA = await novo('MoneyTRIO celular da Ana', 'celular', mt.base), ma = MA.p;
  await entrarMoney(ma, ANA);
  const abriuMA = await codigoMoney(ma, ANA, PIN_A);
  await pararPonte(ma);
  const eMA0 = await estadoMoney(ma, GID);
  conferir(abriuMA && eMA0.fk === FK0 && eMA0.kv === 1 && eMA0.Lfk === FK0 && eMA0.mk && eMA0.Lmk, 'G6a. o MoneyTRIO da Ana abre (código + o mesmo PIN da conta) com a chave de antes e com as chaves próprias dele (casa e reservada) (' + JSON.stringify(eMA0) + ')');
  const MB = await novo('MoneyTRIO computador da Bia', 'computador', mt.base), mb = MB.p;
  await entrarMoney(mb, BIA);
  const abriuMB = await codigoMoney(mb, BIA, PIN_B);
  await pararPonte(mb);
  const eMB0 = await estadoMoney(mb, GID);
  conferir(abriuMB && eMB0.fk === FK0 && eMB0.kv === 1 && eMB0.mk, 'G6a. o MoneyTRIO da Bia (responsável, "Tudo") abre com a chave de antes (' + JSON.stringify(eMB0) + ')');
  /* a Saúde → MoneyTRIO ligada no Omni: um resumo com a chave de antes */
  await oa.evaluate(async () => { await DB.saveSetting({ mt: Object.assign({}, Bridge.cfg(), { saude: true }) }); });
  await subir(oa);
  const env0 = await oa.evaluate(async () => { lsSet(LS.saudeMT, S.family.id); return SaudeMT.enviar(); });
  const velhas = db.sol_ponte.filter((x) => x.de_app === 'omnilife-one' && x.tipo === 'saude-resumo');
  const VELHO = velhas[0], oVelho = VELHO && JSON.parse(VELHO.dados.cif);
  conferir(env0 === true && velhas.length === 1 && oVelho.fk === FK0 && oVelho.kv === 1 && !VELHO.lido_em, 'G6a. o Omni manda o resumo da Saúde com a chave de antes; ninguém leu ainda');
  const s0 = await oa.evaluate(async () => { const p = await Giro.pode(); return { ok: !!p.ok, motivo: p.motivo || null, ponte: p.ponte }; });
  conferir(s0.ok && s0.ponte === 1, 'G6a. o Omni pode trocar: o MoneyTRIO terminou a preparação (nenhuma linha dele na chave da família) e há 1 aviso da Saúde esperando o MoneyTRIO (' + JSON.stringify(s0) + ')');

  /* ===================== G6b ===================== */
  console.log('G6b. A Ana troca a chave de segurança da família no Omni (a troca de verdade)');
  const r = await oa.evaluate(async () => { try { return { ok: true, r: JSON.parse(JSON.stringify(await Giro.executar(() => {}, {}, { novo: true }))) }; } catch (e) { return { erro: e.message, motivo: e.giro || null }; } });
  const g = (linha('settings', 'giro') || {}).dados || {}, reg = (linha('settings', 'cofre') || {}).dados || {}, fkN = g.para && g.para.fk;
  const nA = await chaveDaPessoa(ANA), nB = await chaveDaPessoa(BIA);
  conferir(r.ok && g.estado === 'feito' && fkN && fkN !== FK0 && reg.fk === fkN && reg.kv === 2 && nA.fk === fkN && nA.kv === 2 && nB.fk === fkN && Buffer.from(nA.raw).equals(Buffer.from(nB.raw)) && !Buffer.from(nA.raw).equals(Buffer.from(VELHA)),
    'G6b. a troca termina ("feito"): o registro e a chave nova (kv 2) entregue à Ana e à Bia (chefe e responsável, D-E1) (' + JSON.stringify([r.erro || 'ok', g.estado, fkN]) + ')');
  await ate(() => db.sol_ponte.filter((x) => x.de_app === 'omnilife-one' && x.tipo === 'saude-resumo').length === 2, 10000);
  const NOVO = db.sol_ponte.find((x) => x.de_app === 'omnilife-one' && x.tipo === 'saude-resumo' && x.id !== VELHO.id), oNovo = NOVO && JSON.parse(NOVO.dados.cif);
  const marcouOmni = marcadosPor(OA);
  conferir(VELHO.lido_em && VELHO.lido_por === ANA && marcouOmni.includes(VELHO.id) && !marcadosPor(MA).length && !marcadosPor(MB).length,
    'G6b. o resumo velho já está lido — e quem marcou foi o Omni (D-E10/C10), não o MoneyTRIO (a ponte dele estava parada)');
  conferir(NOVO && oNovo.fk === fkN && oNovo.kv === 2 && !NOVO.lido_em, 'G6b. o resumo vai de novo com a chave nova (fk do registro, kv 2), ainda não lido');

  /* ===================== G6c ===================== */
  console.log('G6c. O MoneyTRIO da Ana (aberto com a chave de antes) acompanha: buscarMinha, conferirCf, usarSoCf + abrir');
  await voltarPonte(ma);
  const pc = await ma.evaluate(async () => { const T = MoneyNuvem._teste; T.Ponte.vistos.clear(); const out = await T.Ponte.buscar(); return { n: out.length, cfNova: !!MoneyNuvem.escopos.estado().cfNova }; });
  await pararPonte(ma);
  conferir(pc.n === 0 && pc.cfNova && !NOVO.lido_em, 'G6c. a ponte do MoneyTRIO (ainda com a de antes) vê a mensagem nova com outra fk e kv maior: acende "a chave da família mudou" (cfNova), não abre e não marca (' + JSON.stringify(pc) + ')');
  const bm = await ma.evaluate(async (gid) => {
    const T = MoneyNuvem._teste, L = await T.Cadeado.local(), duk = await T.Cifra.aes(T.Cadeado.dukRaw);
    const sk = await T.Cifra.importarSk(await T.Cifra.decifrar(duk, L.sk)), x = await T.Cadeado.buscarMinha(sk, gid);
    if (!x) return null;
    const h = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', x.raw)), (b) => b.toString(16).padStart(2, '0')).join(''); x.raw.fill(0);
    return { kv: x.kv, fk: x.fk, h };
  }, GID);
  conferir(bm && bm.kv === 2 && bm.fk === reg.fk && bm.h === hex(nA.raw), 'G6c. Cadeado.buscarMinha(sk, GID) no MoneyTRIO → kv 2, fk = a do registro do Omni, os bytes = a chave nova (' + JSON.stringify(bm && { kv: bm.kv, fk: bm.fk }) + ')');
  const cc = await ma.evaluate(async (gid) => {
    const T = MoneyNuvem._teste, L = await T.Cadeado.local(), antes = { fk: L.fam[gid].fk, kv: L.fam[gid].kv }, duk = await T.Cifra.aes(T.Cadeado.dukRaw);
    const ok = await T.Cadeado.conferirCf(L, duk, gid), L2 = await T.Cadeado.local(), f = L2.fam[gid], raw = await T.Cifra.decifrar(duk, f);
    const h = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', raw)), (b) => b.toString(16).padStart(2, '0')).join(''); raw.fill(0);
    return { antes, ok, fk: f.fk, kv: f.kv, h, mk: !!(f.mk && f.mk.c), mkv: f.mk && f.mk.v };
  }, GID);
  conferir(cc.antes.fk === FK0 && cc.antes.kv === 1 && cc.ok === true && cc.fk === fkN && cc.kv === 2 && cc.h === hex(nA.raw) && cc.mk && cc.mkv === 1,
    'G6c. conferirCf(L, duk, GID) com o cadeado feito com a de antes → true; L.fam[GID] agora com a nova (fk novo, kv 2, os mesmos bytes) e as chaves próprias do MoneyTRIO continuam lá (' + JSON.stringify(Object.assign({}, cc, { h: undefined })) + ')');
  const cifCasa = moneyDe('bancos', 'b1').dados_cifrado, cifRes = moneyDe('metas', 'r.m1').dados_cifrado;
  const cifAntes = JSON.stringify(Object.assign({ c: 1, kv: 1, fk: FK0 }, await cifrar(VELHA, utf8(JSON.stringify({ id: 'x1', nome: 'Linha de antes da preparação' })))));
  const ab = await ma.evaluate(async (a) => {
    const T = MoneyNuvem._teste, L = await T.Cadeado.local(), f = L.fam[a.gid], duk = await T.Cifra.aes(T.Cadeado.dukRaw);
    await T.Cadeado.usarSoCf(await T.Cifra.decifrar(duk, f), f.kv, f.fk);
    const novo = await T.Cadeado.abrir(a.novo), velho = await T.Cadeado.abrir(a.velho);
    return { fk: T.Cadeado.fk, kv: T.Cadeado.kv, novo: novo && { v: novo.v, pessoas: Array.isArray(novo.pessoas), enviado: !!novo.enviado_em }, velho,
      casa: await T.Cadeado.abrir(a.casa), res: await T.Cadeado.abrir(a.res), antes: await T.Cadeado.abrir(a.antes) };
  }, { gid: GID, novo: NOVO.dados.cif, velho: VELHO.dados.cif, casa: cifCasa, res: cifRes, antes: cifAntes });
  conferir(ab.fk === fkN && ab.kv === 2 && ab.novo && ab.novo.v === 1 && ab.novo.pessoas && ab.novo.enviado, 'G6c. Cadeado.usarSoCf(nova…) + Cadeado.abrir do saude-resumo reenviado → o resumo (v 1, a lista de pessoas, a data)');
  conferir(ab.velho === null && !!VELHO.lido_em, 'G6c. o resumo velho → null no MoneyTRIO com a nova (e ele já estava lido: marcado pelo Omni, não fica preso na frente da fila)');
  conferir(ab.casa && ab.casa.id === 'b1' && ab.res && ab.res.id === 'm1', 'G6c. as linhas da família no MoneyTRIO (os "dois cofres": a da casa e a reservada) continuam abrindo depois da troca — não dependem da chave da família');
  conferir(ab.antes === null, 'G6c. uma linha do MoneyTRIO ainda na chave de antes (como antes da preparação dos "dois cofres") NÃO abre mais: por isso a troca só vem depois da preparação do MoneyTRIO (D-E11; o Omni nem deixa trocar antes)');

  /* ===================== G6d ===================== */
  console.log('G6d. O MoneyTRIO da Bia é aberto de novo pelo PIN (o caminho de verdade) e adota a nova sozinho');
  await mb.evaluate(() => MoneyNuvem._teste.Cadeado.trancar());
  await mb.reload();
  await mb.waitForSelector('#nvPin', { timeout: 30000 });
  await mb.fill('#nvPin', PIN_B); await mb.click('#nvPinOk');
  const abriuMB2 = await abriuMoney(mb), eMB = await estadoMoney(mb, GID);
  conferir(abriuMB2 && eMB.fk === fkN && eMB.kv === 2 && eMB.Lfk === fkN && eMB.Lkv === 2 && eMB.mk && eMB.Lmk,
    'G6d. aberto pelo PIN, o MoneyTRIO da Bia busca e adota a nova (conferirCf ao abrir): na memória e no aparelho, com as chaves próprias dele (' + JSON.stringify(eMB) + ')');
  /* a ponte (a automática ou esta chamada) abre o resumo novo e o aplica: o módulo ponte-omnilife marca como lido */
  await mb.evaluate(async () => { const T = MoneyNuvem._teste; T.Ponte.vistos.clear(); await T.Ponte.buscar(); });
  const leu = await ate(() => !!NOVO.lido_em, 20000);
  const aplicado = await mb.evaluate((id) => { const l = (Store.estado.ponte_omnilife || []).find((x) => x.id === 'saude-resumo'); return !!(l && l.msg === id); }, NOVO.id);
  conferir(leu && NOVO.lido_por === BIA && marcadosPor(MB).includes(NOVO.id) && aplicado, 'G6d. o MoneyTRIO da Bia abre o resumo novo pela ponte, aplica (o registro "saude-resumo" aponta para ele) e marca como lido');
  const tela = await mb.evaluate(() => ({ b1: (Store.estado.bancos || []).some((x) => x.id === 'b1'), m1: (Store.estado.metas || []).some((x) => x.id === 'm1') }));
  conferir(tela.b1 && tela.m1, 'G6d. as finanças da família continuam no MoneyTRIO da Bia depois da troca (o item da casa e o reservado)');
  if (eMB.cfNova) console.log('  ℹ o aviso "a chave da família mudou" (cfNova) ficou aceso no MoneyTRIO da Bia depois de adotar: é a sugestão 7.4 a (ele nunca volta a false)');

  /* ===================== G6e ===================== */
  console.log('G6e. O MoneyTRIO nunca lê as Senhas da casa');
  const leuOmniDocs = [MA, MB].some((x) => x.reqs.some((q) => /\/rest\/v1\/omni_docs/.test(q.url)));
  conferir(!leuOmniDocs, 'G6e. nenhum pedido do MoneyTRIO a omni_docs: as linhas do cofre da família no Omni (Senhas da casa) não são do MoneyTRIO e ele nem as busca (só o Omni as abre)');
  const vivas = db.omni_docs.filter((d) => d.grupo_id === GID && d.colecao === 'vault' && !d.apagado_em && d.id !== '_em');
  conferir(vivas.length === 3 && vivas.every((d) => JSON.parse(d.dados_cifrado).fk === fkN), 'G6e. as Senhas da casa no Omni: as 3 linhas vivas com a chave nova');
  /* o que o MoneyTRIO pediu e o banco de mentira não tem (as funções e tabelas que ele chama ao abrir e na troca): só informa */
  const faltam = [...new Set([MA, MB].flatMap((x) => x.reqs.map((q) => q.url)).filter((u) => u.includes('/rest/v1/')).map((u) => u.split('/rest/v1/')[1].split('?')[0])
    .filter((n) => (n.startsWith('rpc/') ? !rpcs[n.slice(4)] : !db[n])))];
  console.log('  ℹ pedidos do MoneyTRIO que o banco de mentira não tem: ' + (faltam.length ? faltam.join(', ') : 'nenhum'));

  /* ===================== limpeza ===================== */
  const guardados = [];
  for (const x of todos) guardados.push(await x.p.evaluate(() => JSON.stringify(Object.assign({}, localStorage)) + JSON.stringify(Object.assign({}, sessionStorage))).catch(() => ''));
  const sujos = todos.filter((x) => x.lixo.erros.length || x.lixo.nativos.length);
  conferir(!sujos.length, 'nenhum erro de script nem diálogo nativo nos dois apps' + (sujos.length ? ': ' + sujos.map((x) => x.p.nome + ': ' + x.lixo.erros.concat(x.lixo.nativos).join(' | ')).join(' || ') : ''));
  conferir(!todos.some((x) => x.lixo.fora.some((u) => /supabase/i.test(u))), 'nada vai para o Supabase de verdade: os dois apps só falam com o banco de mentira');
  conferir(!todos.some((x) => x.lixo.console.some(temPin)) && !guardados.some(temPin), 'nenhum PIN no console, no localStorage nem no sessionStorage');
  const nb = b64(nA.raw), vb = b64(VELHA);
  conferir(!OA.lixo.console.some((t) => t.includes(nb) || t.includes(vb)) && !guardados[0].includes(nb) && !guardados[0].includes(vb), 'a chave nova e a de antes nunca no console nem no armazenamento do Omni');
  for (const x of todos) await x.ctx.close().catch(() => {});
  await Promise.race([mt.fechar(), new Promise((res) => setTimeout(res, 3000))]);
  await terminar(falhas, browser, 'G6: o MoneyTRIO ' + vNuvem + ' acompanha a troca da chave de segurança feita no Omni (buscarMinha, conferirCf, a ponte com o resumo novo; o velho marcado pelo Omni; as finanças da família continuam abrindo).');
})().catch((e) => { console.error('Erro no teste:', e && e.stack || e); process.exit(1); });
