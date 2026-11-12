/* Parte E (2.27.0) — "Trocar a chave de segurança da família" (girar a chave da família, a CF), no "Supabase de mentira"
   (teste/mock-sol.js): cada aparelho é um contexto do navegador e todos falam com o mesmo banco, que mora neste processo. Nada
   vai para a internet nem para o Supabase de verdade. Pessoas (Ana chefe, Bia responsável, Cris responsável sem chaves, Davi
   membro), senhas, PINs, códigos e chaves: tudo de mentira.
   Etapa E1 (o banco de mentira e a moldura):
     SQL  o banco de mentira faz O MESMO que o SQL da plataforma (sol_giro_situacao e sol_descartar_chaves_antigas): os casos do
          topo de scratchpad/pin-e/sol_descartar_chaves_antigas.sql (recusa nos mesmos casos, com o mesmo "descartar:<motivo>",
          apaga só o que o SQL apaga); sem o SQL (M.semGiroSql) → 404 PGRST202; o gatilho do Omni (M.soChefeGiro: só o chefe muda
          fk/kv, a kv só sobe, o registro e a troca não se apagam); M.depoisDe; a ponte de verdade; M.PKCS8, M.cfVelha, soPub
     G5   depois de uma troca "feita à mão" no banco (em Node), a CF antiga não abre nenhuma linha viva das Senhas da casa nem o
          código de emergência refeito, e a apagada fica como estava (D-E6). Com AES-GCM uma chave diferente sempre falha: o G5
          fica, mas não conta como prova (C15) — a prova é o fk/kv novo e as DUAS camadas abrindo com a nova
   Etapa E2 ("nunca devolver uma chave velha" e as guardas), com a troca feita à mão no banco e um aparelho que ficou com a velha:
     G3   o aparelho velho (Senhas abertas com a CF de antes) não embrulha a velha para ninguém (_distribuir), nem pelo registro
          que estava na fila; o registro do banco não volta (CloudDriver.enviar: fk/kv só para a frente — C4); a carga "família"
          dele recusa (T.aprovarVelho); uma carga "família" velha que chega a um aparelho novo não monta nada (T.recebeuVelha)
     G3c com uma mudança do registro na fila, o _distribuir decide pelo registro DO BANCO (C13)
     G11b a CF só para chefe e responsável (D-E1/C7): um membro com chave pública não recebe; o pedido "para a família" de um
          membro é recusado na carga (a última porta)
     M1   podeMudar e o selar: com a chave velha e no meio da troca, nada se fecha (editar, código de emergência, ficha do carro)
     M2   durante a troca (settings/giro em curso), ninguém entrega a CF; uma "troca" que não é restrito não vale (C9)
     C12  a cópia (backupJSON) não leva o registro nem a troca, e restaurar uma cópia não mexe neles
     N1   o montar com novaCF não cria uma SEGUNDA CF quando a leitura do registro falha por rede, nem com o registro apagado
          (6.1, C4); o criarConta devolve "rede" sem deixar linha na lista
   Cada parte começa do mesmo banco (a foto depois do prepararChaves e das Senhas da casa de mentira). Só uma parte: SO=SQL,G3
   Uso: node teste/rodar.js   ·   sozinho: BASE=http://localhost:8099 node teste/giro-omni.js */
const crypto = require('crypto');
const { BASE, criarConferir, iniciar, terminar } = require('./_base');
const { SB, M, db, rpcs, supabase, prepararChaves, agora, b64u, PESSOAS, ANA, BIA, CRIS, DAVI, GID } = require('./mock-sol');
const { aparelho, entrarOmni, senhasDaCasa, semRede, cadeado225 } = require('./_nuvem');

const subtle = crypto.webcrypto.subtle, utf8 = (t) => new TextEncoder().encode(t), b64 = (b) => Buffer.from(b).toString('base64');
const unb64 = (s) => new Uint8Array(Buffer.from(s, 'base64'));
const PIN_A = '736251', PIN_B = '482915', PIN_C = '528061', PINS = [PIN_A, PIN_B, PIN_C];
const CODIGO_EM = 'MNTR-AQWE-ZXCV-1234';   /* código de emergência de mentira */
const FK0 = 'fk-teste', FKN = 'fk-nova';
const espere = (ms) => new Promise((r) => setTimeout(r, ms));
/* espera uma condição do lado do banco (Node) */
async function ate(fn, ms) { const fim = Date.now() + (ms || 8000); while (Date.now() < fim) { if (fn()) return true; await espere(100); } return !!fn(); }
const SO = (process.env.SO || '').split(',').map((s) => s.trim()).filter(Boolean);
const quieto = (p) => p.evaluate(() => { AOne.save({ hello: 1, tour: 1, tips: Object.assign({}, AOne.cfg().tips, { home: 1, settings: 1, house: 1, family: 1 }) }); if (AOne.view) AOne.close(); lsSet(GuiaCofre.K, Date.now()); });
const esperar = (p, fn, arg, ms) => p.waitForFunction(fn, arg, { timeout: ms || 10000 }).then(() => true, () => false);
const janelas = (p) => p.evaluate(() => [...document.querySelectorAll('.modal')].map((m) => m.innerText.replace(/\s+/g, ' ').trim()).join(' || '));
const vigiarAvisos = (p) => p.evaluate(() => { window.__av = []; new MutationObserver(() => { document.querySelectorAll('#toasts .toast').forEach((t) => { if (!window.__av.includes(t.textContent)) window.__av.push(t.textContent); }); }).observe(document.querySelector('#toasts'), { childList: true, subtree: true, characterData: true }); });
const avisos = (p) => p.evaluate(() => (window.__av || []).join(' | '));

/* ---------------- as contas das Senhas da casa, em Node (o mesmo formato do Cofre e do Vault do app) ---------------- */
const aes = (raw, usos) => subtle.importKey('raw', raw, { name: 'AES-GCM' }, false, usos || ['encrypt', 'decrypt']);
async function cifrar(raw, bytes) { const iv = crypto.randomBytes(12); return { iv: b64(iv), ct: b64(await subtle.encrypt({ name: 'AES-GCM', iv }, await aes(raw), bytes)) }; }
async function decifrar(raw, o) { return new Uint8Array(await subtle.decrypt({ name: 'AES-GCM', iv: unb64(o.iv) }, await aes(raw), unb64(o.ct))); }
/* linha do cofre: {c:1, kv, fk, iv, ct}, e dentro o item com a parte interna enc (a MESMA CF) */
async function selar(raw, kv, fk, doc) { return JSON.stringify(Object.assign({ c: 1, kv, fk }, await cifrar(raw, utf8(JSON.stringify(doc))))); }
async function abrirLinha(raw, cif) { return JSON.parse(new TextDecoder().decode(await decifrar(raw, JSON.parse(cif)))); }
const abre = (f) => f().then(() => true, () => false);
async function kdf(code, sal) {
  const base = await subtle.importKey('raw', utf8(String(code).replace(/[\s-]/g, '').toUpperCase()), 'PBKDF2', false, ['deriveBits']);
  return new Uint8Array(await subtle.deriveBits({ name: 'PBKDF2', salt: unb64(sal), iterations: 600000, hash: 'SHA-256' }, base, 256));
}
async function envelopeEm(code, raw, kv, fk) { const sal = b64(crypto.randomBytes(16)); return JSON.stringify({ em: 1, d: { em: Object.assign({ sal, iter: 600000, kv, fk }, await cifrar(await kdf(code, sal), raw)), at: agora(), vis: 'restrito' } }); }
/* a CF embrulhada para a pública de uma pessoa ("1." + RSA-OAEP de {v:1, kv, fk, k}) e o caminho de volta com M.PKCS8 */
async function embrulhar(pub, raw, kv, fk) {
  const pk = await subtle.importKey('jwk', { kty: 'RSA', n: pub.n, e: pub.e, alg: 'RSA-OAEP-256', ext: true }, { name: 'RSA-OAEP', hash: 'SHA-256' }, false, ['encrypt']);
  return '1.' + b64(await subtle.encrypt({ name: 'RSA-OAEP' }, pk, utf8(JSON.stringify({ v: 1, kv, fk, k: b64(raw) }))));
}
async function desembrulhar(uid, txt) {
  const sk = await subtle.importKey('pkcs8', M.PKCS8[uid], { name: 'RSA-OAEP', hash: 'SHA-256' }, false, ['decrypt']);
  const o = JSON.parse(new TextDecoder().decode(await subtle.decrypt({ name: 'RSA-OAEP' }, sk, Buffer.from(String(txt).replace(/^1\./, ''), 'base64'))));
  return { kv: o.kv, fk: o.fk, raw: unb64(o.k) };
}
const igual = (a, b) => Buffer.from(a).equals(Buffer.from(b));
/* uma chave pública (só a pública, sem a CF) para alguém, como quem entra depois ou quem trocou de chave */
async function darPublica(uid) {
  const par = await subtle.generateKey({ name: 'RSA-OAEP', modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' }, true, ['encrypt', 'decrypt']);
  const j = await subtle.exportKey('jwk', par.publicKey), kid = b64u(crypto.randomBytes(9)), h = agora();
  M.PKCS8[uid] = new Uint8Array(await subtle.exportKey('pkcs8', par.privateKey));
  const ja = db.sol_chave_publica.find((k) => k.user_id === uid), pub = { kty: j.kty, n: j.n, e: j.e, alg: 'RSA-OAEP-256', kid };
  if (ja) Object.assign(ja, { chave_publica: pub, atualizado_em: h }); else db.sol_chave_publica.push({ user_id: uid, algoritmo: 'RSA-OAEP-256', chave_publica: pub, criado_em: h, atualizado_em: h });
  return kid;
}

/* ---------------- o banco de mentira: Senhas da casa, a troca "feita à mão" e chamadas REST sem navegador ---------------- */
const linha = (col, id) => db.omni_docs.find((d) => d.grupo_id === GID && d.colecao === col && d.id === id);
const vivasVault = () => db.omni_docs.filter((d) => d.grupo_id === GID && d.colecao === 'vault' && !d.apagado_em);
/* grava uma linha de omni_docs como o banco grava (versão +1, quem e quando) */
function gravarDoc(col, id, campos, por) {
  const h = agora(); let r = linha(col, id);
  if (!r) { r = { grupo_id: GID, colecao: col, id, vis: 'restrito', dados: null, dados_cifrado: null, versao: 0, criado_por: por || ANA, criado_em: h, apagado_em: null }; db.omni_docs.push(r); }
  Object.assign(r, campos, { versao: r.versao + 1, atualizado_por: por || ANA, atualizado_em: h });
  return r;
}
/* 6 itens (um com a placa do carro), o código de emergência e uma linha APAGADA que ainda guarda o texto (D-E6: fica como está) */
const ITENS = [['senha', 'Wi-Fi de casa'], ['senha', 'Banco de mentira'], ['documento', 'RG de mentira'], ['senha', 'E-mail de mentira'], ['cartao', 'Cartão de mentira'], ['seguro', 'Carro de mentira — placa']];
async function semear() {
  const cf = M.cfVelha, t = '2026-11-01T12:00:00.000Z';
  for (let i = 0; i < ITENS.length; i++) {
    const [kind, title] = ITENS[i], seg = { title, login: 'usuario' + i, pass: 'senha-de-mentira-' + i };
    const doc = Object.assign({ kind, enc: await cifrar(cf, utf8(JSON.stringify(seg))), files: [], vis: 'restrito', updatedAt: t }, kind === 'seguro' ? { carId: 'car-mentira' } : {});
    gravarDoc('vault', 'v' + i, { dados_cifrado: await selar(cf, 1, FK0, doc) });
  }
  gravarDoc('vault', '_em', { dados_cifrado: await envelopeEm(CODIGO_EM, cf, 1, FK0) });
  const velho = { kind: 'senha', enc: await cifrar(cf, utf8(JSON.stringify({ title: 'Apagado de mentira' }))), files: [], vis: 'restrito', updatedAt: t };
  gravarDoc('vault', 'vApagado', { dados_cifrado: await selar(cf, 1, FK0, velho), apagado_em: t });
}
/* a troca como a etapa E5 vai fazer, aqui à mão no banco: cada linha viva aberta com a velha e fechada com a nova (as DUAS
   camadas), o _em refeito com o mesmo código (ou invalidado), a nova embrulhada para cada chefe e responsável com pública
   (seq + 1), o registro novo e o giro "feito" (restrito, por um chefe). op: {em: "refeito"|"invalidado", estado, por, vis,
   de, pular: [ids que ficam com a velha]}. Devolve a CF nova (bytes de mentira) */
async function trocaAMao(op) {
  op = op || {};
  const velha = M.cfVelha, nova = new Uint8Array(crypto.randomBytes(32)), kv = 2, fk = FKN;
  for (const r of vivasVault()) {
    if (r.id === '_em' || (op.pular || []).includes(r.id)) continue;
    const doc = await abrirLinha(velha, r.dados_cifrado);
    if (doc.enc) doc.enc = await cifrar(nova, await decifrar(velha, doc.enc));
    gravarDoc('vault', r.id, { dados_cifrado: await selar(nova, kv, fk, doc) }, op.por || ANA);
  }
  if ((op.em || 'refeito') === 'refeito') gravarDoc('vault', '_em', { dados_cifrado: await envelopeEm(CODIGO_EM, nova, kv, fk) });
  else gravarDoc('vault', '_em', { dados_cifrado: null, apagado_em: agora() });
  const reg = JSON.parse(JSON.stringify(linha('settings', 'cofre').dados)), entregues = {};
  for (const m of db.sol_grupo_membros.filter((x) => x.grupo_id === GID && x.status === 'ativo' && ['chefe', 'responsavel'].includes(x.papel))) {
    const k = db.sol_chave_publica.find((x) => x.user_id === m.user_id); if (!k) continue;
    const vs = db.sol_grupo_chaves.filter((c) => c.grupo_id === GID && c.user_id === m.user_id).map((c) => c.versao), seq = (vs.length ? Math.max(...vs) : 0) + 1;
    db.sol_grupo_chaves.push({ grupo_id: GID, user_id: m.user_id, versao: seq, chave_embrulhada: await embrulhar(k.chave_publica, nova, kv, fk), embrulhada_por: ANA, criado_em: agora() });
    reg.membros[m.user_id] = { kid: k.chave_publica.kid, seq, fk }; entregues[m.user_id] = { kid: k.chave_publica.kid, seq };
  }
  Object.assign(reg, { fk, kv, giradoEm: agora(), giradoPor: ANA });
  gravarDoc('settings', 'cofre', { dados: reg }, ANA);
  const g = { v: 1, vis: op.vis || 'restrito', estado: op.estado || 'feito', por: ANA, ap: null, apNome: 'Android · Chrome', de: op.de || { kv: 1, fk: FK0 }, para: { kv, fk },
    inicio: agora(), batida: agora(), total: ITENS.length, feitos: ITENS.length, voltas: 0, estranhas: 0, em: op.em || 'refeito', envelopes: {}, entregues, fim: agora(), erro: null };
  gravarDoc('settings', 'giro', { vis: op.vis || 'restrito', dados: g }, op.porGiro || ANA);
  return nova;
}
/* REST do banco de mentira sem navegador (uma "rota" falsa): {status, corpo} */
async function rest(uid, metodo, caminho, corpo, prefer) {
  let out = null;
  const route = {
    request: () => ({ url: () => SB + caminho, method: () => metodo, postData: () => (corpo === undefined ? null : JSON.stringify(corpo)),
      headers: () => Object.assign({ authorization: 'Bearer h.' + b64u(JSON.stringify({ sub: uid })) + '.s' }, prefer ? { prefer } : {}) }),
    fulfill: async (o) => { out = { status: o.status, corpo: o.body ? JSON.parse(o.body) : null }; }
  };
  await supabase(route);
  return out;
}
const docUrl = (col, id) => '/rest/v1/omni_docs?grupo_id=eq.' + GID + '&colecao=eq.' + col + '&id=eq.' + id;
/* o resultado de uma função do banco: {n} ou {erro: "descartar:<motivo>", st, code} */
const tentar = (fn) => { try { return { n: fn() }; } catch (e) { return { erro: String((e && e.o && e.o.message) || e).split(' ')[0], st: e && e.st, code: e && e.o && e.o.code }; } };
const descartar = (me, ate) => tentar(() => rpcs.sol_descartar_chaves_antigas(me, { p_grupo: GID, p_ate_versao: ate }));
const situacao = (me) => rpcs.sol_giro_situacao(me || ANA, { p_grupo: GID });
const versoes = (uid) => db.sol_grupo_chaves.filter((c) => c.grupo_id === GID && c.user_id === uid).map((c) => c.versao).sort((a, b) => a - b).join(',');
/* as chamadas sol_guardar_chave_grupo desde a posição desde de M.log, abertas em Node: [{user, seq, fk, kv}] */
async function entregas(desde) {
  const out = [];
  for (const l of M.log.slice(desde)) {
    if (l.caminho !== '/rest/v1/rpc/sol_guardar_chave_grupo' || !l.corpo) continue;
    let k = null; try { k = await desembrulhar(l.corpo.p_user, l.corpo.p_chave_embrulhada); } catch (e) {}
    out.push({ user: l.corpo.p_user, seq: l.corpo.p_versao, fk: k && k.fk, kv: k && k.kv });
  }
  return out;
}
const regBanco = () => JSON.parse(JSON.stringify(linha('settings', 'cofre').dados));
const regOk = (r) => r.fk === FKN && r.kv === 2 && Object.values(r.membros).every((m) => m.fk === FKN);

/* um aparelho da pessoa com as Senhas da casa abertas com a CF de antes (o cadeado como a 2.25 gravava, com a chave pessoal) */
async function abertoComVelha(p, uid, pin) {
  await entrarOmni(p, uid); await quieto(p);
  await p.evaluate(() => { Sol.ligadoAp = false; Sol.ligadoPin = false; });
  await senhasDaCasa(p);
  await cadeado225(p, uid, pin);
  await p.waitForFunction(() => Cofre.status && Cofre.status.fase === 'aberto' && !document.querySelector('.modal'), null, { timeout: 20000 });
  await p.evaluate(() => { Sol.ligadoAp = null; Sol.ligadoPin = null; });
  /* a primeira liberação (o usarChave dispara) termina antes de o teste começar a contar */
  await p.evaluate(async () => { for (let i = 0; i < 100 && Cofre._distP; i++) await new Promise((r) => setTimeout(r, 100)); });
}
/* a fila deste aparelho sobe até o fim (agora: também o que está adiado), sem cair no "já está enviando" do flush. O DB.put e o
   DB.del da nuvem não esperam a fila (o aparelho segue na hora): chave = espera ela entrar na fila antes */
const subir = (p, agora, chave) => p.evaluate(async ([agora, chave]) => {
  for (let i = 0; i < 30 && (chave ? !CloudDriver.fila.has(chave) : i < 3); i++) await new Promise((r) => setTimeout(r, 100));
  for (let i = 0; i < 80; i++) {
    if (!CloudDriver._flushing) await CloudDriver.flush(agora);
    const resta = [...CloudDriver.fila.keys()].filter((k) => agora || !((CloudDriver.adiado.get(k) || 0) > Date.now()));
    if (!CloudDriver._flushing && !resta.length) return;
    await new Promise((r) => setTimeout(r, 100));
  }
}, [!!agora, chave || null]);
/* Cofre.distribuir(true) e espera terminar (e a fila subir, respeitando o que está adiado) */
const distribuirJa = async (p) => { await p.evaluate(async () => { for (let i = 0; i < 100 && Cofre._distP; i++) await new Promise((r) => setTimeout(r, 100)); await Cofre.distribuir(true); }); await subir(p); };

(async () => {
  const browser = await iniciar();
  const { falhas, conferir } = criarConferir();
  await prepararChaves({ soPub: [DAVI] });
  await semear();
  const FOTO = JSON.parse(JSON.stringify(db)), PKCS8 = Object.assign({}, M.PKCS8), VELHA = new Uint8Array(M.cfVelha);
  const lixos = [];
  const voltar = () => {
    for (const t of Object.keys(db)) db[t].splice(0, db[t].length, ...JSON.parse(JSON.stringify(FOTO[t] || [])));
    Object.assign(M, { falhar: {}, semPin: false, semAp: false, semDelete: false, banidas: {}, atrasoLogout: 0, ataque: null, semGiroSql: false, soChefeGiro: false, depoisDe: null, PKCS8: Object.assign({}, PKCS8), cfVelha: new Uint8Array(VELHA) });
    M.relogio = Date.now();
  };
  async function parte(id, titulo, fn) {
    if (SO.length && !SO.includes(id)) return;
    console.log('\n' + id + '. ' + titulo);
    voltar();
    const ctxs = [];
    const novo = async (nome, op) => { const A = await aparelho(browser, Object.assign({ nome, base: BASE }, op)); ctxs.push(A.ctx); lixos.push(A.lixo); return A; };
    try { await fn(novo); } catch (e) { conferir(false, id + ': o teste parou no meio — ' + String((e && e.message) || e).split('\n')[0]); }
    for (const c of ctxs) await c.close().catch(() => {});
  }

  /* ================= SQL: o banco de mentira faz o que o SQL da plataforma faz ================= */
  await parte('SQL', 'O banco de mentira: sol_giro_situacao e sol_descartar_chaves_antigas como o SQL (os casos do topo do arquivo), o gatilho do Omni, a ponte', async () => {
    /* o que o prepararChaves deixou para o teste */
    const ka = await desembrulhar(ANA, db.sol_grupo_chaves.find((c) => c.user_id === ANA).chave_embrulhada);
    conferir(ka.fk === FK0 && ka.kv === 1 && igual(ka.raw, M.cfVelha), 'M.PKCS8 abre em Node a CF embrulhada para a Ana, e ela é a M.cfVelha (fk-teste, kv 1)');
    conferir(!!db.sol_chave_publica.find((k) => k.user_id === DAVI) && !db.sol_grupo_chaves.some((c) => c.user_id === DAVI) && !regBanco().membros[DAVI] && !!M.PKCS8[DAVI],
      'soPub: o Davi (membro) tem só a chave pública: nenhuma CF, fora do registro');
    conferir(vivasVault().length === 7 && !!linha('vault', 'vApagado').dados_cifrado, 'as Senhas da casa de mentira: 6 itens + o código de emergência, e uma apagada que ainda guarda o texto');
    /* sem o SQL: as duas funções "não existem" */
    M.semGiroSql = true;
    const s404 = await rest(ANA, 'POST', '/rest/v1/rpc/sol_giro_situacao', { p_grupo: GID }), d404 = await rest(ANA, 'POST', '/rest/v1/rpc/sol_descartar_chaves_antigas', { p_grupo: GID, p_ate_versao: 1 });
    conferir(s404.status === 404 && s404.corpo.code === 'PGRST202' && d404.status === 404 && d404.corpo.code === 'PGRST202', 'M.semGiroSql: sol_giro_situacao e sol_descartar_chaves_antigas → 404 PGRST202 (como sem o SQL)');
    M.semGiroSql = false;
    /* antes da troca */
    const s0 = situacao();
    conferir(s0.registro === true && s0.maior_versao === 1 && s0.vault_fora === 0 && s0.vault_apagadas_com_texto === 0 && s0.giro === null && s0.giro_ok === false && s0.falta_entregar === 0 && s0.money_migrado === true && s0.money_usa === false,
      'situação antes da troca: registro, maior versão 1, nada fora, nenhuma troca (' + JSON.stringify(s0) + ')');
    const r1 = await rest(BIA, 'POST', '/rest/v1/rpc/sol_giro_situacao', { p_grupo: GID });
    conferir(r1.status === 403 && r1.corpo.code === '42501' && /^giro:chefe /.test(r1.corpo.message), 'situação pela Bia (responsável) → 403 42501 "giro:chefe"');
    conferir(descartar(BIA, 1).erro === 'descartar:chefe' && descartar(DAVI, 1).erro === 'descartar:chefe', 'descartar pela Bia ou pelo Davi → descartar:chefe');
    const dv = descartar(ANA, 0), dv2 = descartar(ANA, null);
    conferir(dv.erro === 'descartar:versao' && dv.code === '22023' && dv2.erro === 'descartar:versao', 'p_ate_versao 0 ou vazio → descartar:versao (22023)');
    conferir(descartar(ANA, 1).erro === 'descartar:versao', 'antes da troca: a versão pedida é a mais nova → descartar:versao');
    /* sem registro */
    linha('settings', 'cofre').apagado_em = agora();
    conferir(descartar(ANA, 1).erro === 'descartar:registro' && situacao().registro === false, 'registro apagado → descartar:registro (e situação.registro false)');
    voltar(); linha('settings', 'cofre').dados.kv = '1';
    conferir(descartar(ANA, 1).erro === 'descartar:registro', 'registro com kv que não é número → descartar:registro');

    /* a troca feita à mão: o caso feliz */
    voltar(); await trocaAMao();
    const s1 = situacao();
    conferir(s1.registro && s1.maior_versao === 2 && s1.vault_fora === 0 && s1.vault_apagadas_com_texto === 1 && s1.ponte_pendentes === 0 && s1.ponte_outra === 0 && s1.money_cf === 0 && s1.money_migrado && s1.falta_entregar === 0 && s1.giro === 'feito' && s1.giro_ok === true,
      'situação depois da troca: nada fora (a apagada com texto só conta à parte), ninguém faltando, giro feito e conferido (' + JSON.stringify(s1) + ')');
    conferir(descartar(ANA, 2).erro === 'descartar:versao', 'depois da troca, p_ate_versao = a mais nova → descartar:versao');
    const ok1 = descartar(ANA, 1);
    conferir(ok1.n === 2 && versoes(ANA) === '2' && versoes(BIA) === '2', 'caso feliz: apaga só as 2 versões 1 (Ana e Bia) e ficam as 2 em uso (' + JSON.stringify(ok1) + ')');
    conferir(descartar(ANA, 1).n === 0, 'rodar duas vezes: a segunda apaga 0');

    /* o giro: só vale terminado, restrito, gravado por último por um chefe, e troca de verdade (C9) */
    voltar(); await trocaAMao({ estado: 'conferindo' });
    conferir(descartar(ANA, 1).erro === 'descartar:giro', 'giro "conferindo" (não terminou) → descartar:giro');
    voltar(); await trocaAMao();
    const rb = await rest(BIA, 'PATCH', docUrl('settings', 'giro'), { dados: Object.assign({}, linha('settings', 'giro').dados, { batida: agora() }) }, 'return=representation');
    conferir(rb.status === 200 && linha('settings', 'giro').atualizado_por === BIA && descartar(ANA, 1).erro === 'descartar:giro', 'giro "feito" gravado por último por um responsável (o carimbo do banco) → descartar:giro');
    voltar(); await trocaAMao({ vis: 'publico' });
    conferir(descartar(ANA, 1).erro === 'descartar:giro', 'giro "publico" → descartar:giro');
    voltar(); await trocaAMao({ de: { kv: 2, fk: FKN } });
    conferir(descartar(ANA, 1).erro === 'descartar:giro', 'giro com de = para (não trocou nada) → descartar:giro');
    voltar(); await trocaAMao({ de: {} });
    conferir(descartar(ANA, 1).erro === 'descartar:giro', 'giro sem de.fk → descartar:giro');
    /* as Senhas da casa */
    voltar(); await trocaAMao({ pular: ['v3'] });
    conferir(descartar(ANA, 1).erro === 'descartar:vault' && situacao().vault_fora === 1, 'uma linha viva ainda com a fk velha → descartar:vault (vault_fora 1)');
    voltar(); await trocaAMao(); gravarDoc('vault', '_em', { dados_cifrado: await envelopeEm(CODIGO_EM, M.cfVelha, 1, FK0) });
    conferir(descartar(ANA, 1).erro === 'descartar:vault', '_em velho (não refeito) → descartar:vault');
    voltar(); await trocaAMao({ em: 'invalidado' });
    conferir(descartar(ANA, 1).n === 2, '_em invalidado (apagado e sem texto) não trava');
    voltar(); await trocaAMao(); gravarDoc('vault', 'vQuebrado', { dados_cifrado: 'isto não é JSON' });
    conferir(descartar(ANA, 1).erro === 'descartar:vault', 'uma linha viva que não é JSON conta como fora → descartar:vault');
    /* a ponte */
    voltar(); await trocaAMao();
    db.sol_ponte.push({ id: 'p1', de_app: 'omnilife-one', para_app: 'moneytrio', tipo: 'saude-resumo', grupo_id: GID, user_id: ANA, dados: { v: 1, cif: JSON.stringify({ c: 1, kv: 1, fk: FK0, iv: 'x', ct: 'y' }) }, criado_em: agora(), lido_em: null, lido_por: null });
    const sp = situacao();
    conferir(descartar(ANA, 1).erro === 'descartar:ponte' && sp.ponte_pendentes === 1 && sp.ponte_outra === 1, 'ponte: uma não lida fechada com a velha → descartar:ponte');
    db.sol_ponte[0].lido_em = agora();
    conferir(descartar(ANA, 1).n === 2, 'ponte: a mesma, já lida, não trava');
    voltar(); await trocaAMao();
    db.sol_ponte.push({ id: 'p2', de_app: 'omnilife-one', para_app: 'moneytrio', tipo: 'saude-resumo', grupo_id: GID, user_id: ANA, dados: { v: 1, cif: JSON.stringify({ c: 1, kv: 2, fk: FKN, iv: 'x', ct: 'y' }) }, criado_em: agora(), lido_em: null, lido_por: null });
    const sp2 = situacao();
    conferir(sp2.ponte_pendentes === 1 && sp2.ponte_outra === 0 && descartar(ANA, 1).n === 2, 'ponte: uma não lida fechada com a NOVA não trava (pendentes 1, outra 0)');
    /* o MoneyTRIO */
    voltar(); await trocaAMao();
    db.money_docs.push({ grupo_id: GID, colecao: 'tx', id: 'm1', vis: 'publico', dados: null, dados_cifrado: '{"c":1,"kv":1,"fk":"fk-teste","iv":"x","ct":"y"}', versao: 1, apagado_em: null });
    db.money_migracao.push({ grupo_id: GID, concluida_em: agora() });
    conferir(descartar(ANA, 1).erro === 'descartar:money' && situacao().money_cf === 1, 'money_docs vivo ainda com a CF → descartar:money');
    db.money_docs[0].dados_cifrado = '{"c":1,"m":"c","iv":"x","ct":"y"}';
    conferir(descartar(ANA, 1).n === 2, 'money_docs já no formato novo e a migração registrada: não trava');
    voltar(); await trocaAMao();
    db.money_docs.push({ grupo_id: GID, colecao: 'tx', id: 'm1', vis: 'publico', dados: null, dados_cifrado: '{"c":1,"m":"c","iv":"x","ct":"y"}', versao: 1, apagado_em: null });
    const sm = situacao();
    conferir(descartar(ANA, 1).erro === 'descartar:money' && sm.money_usa === true && sm.money_migrado === false, 'money_migracao ausente (o grupo usa o MoneyTRIO) → descartar:money');
    /* quem precisa da CF atual */
    voltar(); await trocaAMao();
    { const g = linha('settings', 'cofre'); g.dados.membros[BIA].fk = FK0; }
    conferir(descartar(ANA, 1).erro === 'descartar:membros' && situacao().falta_entregar === 1, 'responsável sem a entrega da nova (registro com a fk velha) → descartar:membros (falta 1)');
    voltar(); await trocaAMao();
    const sd = situacao();
    conferir(sd.falta_entregar === 0 && descartar(ANA, 1).n === 2, 'membro com chave pública e sem CF nenhuma (o Davi) NÃO trava (C7)');
    voltar(); await trocaAMao();
    db.sol_grupo_chaves.push({ grupo_id: GID, user_id: DAVI, versao: 1, chave_embrulhada: await embrulhar(db.sol_chave_publica.find((k) => k.user_id === DAVI).chave_publica, M.cfVelha, 1, FK0), embrulhada_por: ANA, criado_em: agora() });
    { const g = linha('settings', 'cofre'); g.dados.membros[DAVI] = { kid: db.sol_chave_publica.find((k) => k.user_id === DAVI).chave_publica.kid, seq: 1, fk: FK0 }; }
    const dd = descartar(ANA, 1);
    conferir(dd.n === 3 && versoes(DAVI) === '', 'membro com uma entrada velha no registro (vinda de uma cópia) NÃO trava, e a linha velha dele sai (' + JSON.stringify(dd) + ')');
    voltar(); await trocaAMao();
    db.sol_grupo_chaves.push({ grupo_id: GID, user_id: BIA, versao: 3, chave_embrulhada: 'aparelho-velho', embrulhada_por: BIA, criado_em: agora() });
    conferir(descartar(ANA, 2).erro === 'descartar:membros', 'ping-pong: um aparelho velho gravou para a Bia uma versão maior que a do registro → descartar:membros');
    voltar(); await trocaAMao();
    db.sol_grupo_chaves.push({ grupo_id: GID, user_id: DAVI, versao: 1, chave_embrulhada: await embrulhar(db.sol_chave_publica.find((k) => k.user_id === DAVI).chave_publica, new Uint8Array(32), 2, FKN), embrulhada_por: ANA, criado_em: agora() });
    { const g = linha('settings', 'cofre'); g.dados.membros[DAVI] = { kid: db.sol_chave_publica.find((k) => k.user_id === DAVI).chave_publica.kid, seq: 1, fk: FKN }; }
    const de1 = descartar(ANA, 1);
    conferir(de1.n === 2 && versoes(DAVI) === '1', 'quem entrou depois da troca com a versão 1 (já da nova) FICA');
    voltar(); await trocaAMao();
    db.sol_grupo_membros.find((m) => m.user_id === BIA).status = 'saiu';
    const ds = descartar(ANA, 1);
    conferir(ds.n === 2 && versoes(BIA) === '2' && versoes(ANA) === '2', 'quem saiu do grupo: as linhas até p_ate_versao saem, a mais nova (acima) fica');
    conferir(descartar(ANA, 2).erro === 'descartar:versao', '… e a maior do grupo continua a referência (p_ate_versao 2 = a mais nova)');
    voltar(); await trocaAMao();
    db.sol_grupo_chaves.push({ grupo_id: GID, user_id: BIA, versao: 5, chave_embrulhada: 'x', embrulhada_por: ANA, criado_em: agora() });
    db.sol_grupo_membros.find((m) => m.user_id === BIA).status = 'saiu';
    const ds2 = descartar(ANA, 4);
    conferir(ds2.n === 3 && versoes(BIA) === '5' && versoes(ANA) === '2', 'quem saiu: tudo dele até p_ate_versao sai; a versão em uso da Ana fica, mesmo abaixo de p_ate_versao (' + JSON.stringify(ds2) + ')');
    /* pelo REST: o mesmo erro com o mesmo código */
    voltar(); await trocaAMao({ estado: 'conferindo' });
    const rr = await rest(ANA, 'POST', '/rest/v1/rpc/sol_descartar_chaves_antigas', { p_grupo: GID, p_ate_versao: 1 });
    conferir(rr.status === 403 && rr.corpo.code === '42501' && /^descartar:giro /.test(rr.corpo.message), 'pelo REST: 403 42501 "descartar:giro …" (o app traduz pelo prefixo)');

    /* M.soChefeGiro: o gatilho do SQL do Omni */
    voltar(); await trocaAMao();
    const semGat = await rest(BIA, 'PATCH', docUrl('settings', 'cofre'), { dados: Object.assign({}, regBanco(), { fk: 'fk-bia', kv: 3 }) }, 'return=representation');
    conferir(semGat.status === 200 && regBanco().fk === 'fk-bia', 'sem o gatilho (hoje), um responsável muda a fk do registro pelo REST (só as guardas do app protegem)');
    voltar(); await trocaAMao(); M.soChefeGiro = true;
    const g1 = await rest(BIA, 'PATCH', docUrl('settings', 'cofre'), { dados: Object.assign({}, regBanco(), { fk: 'fk-bia', kv: 3 }) }, 'return=representation');
    const g2 = await rest(ANA, 'PATCH', docUrl('settings', 'cofre'), { dados: Object.assign({}, regBanco(), { fk: FK0, kv: 1 }) }, 'return=representation');
    const g3 = await rest(ANA, 'PATCH', docUrl('settings', 'cofre'), { dados: Object.assign({}, regBanco(), { fk: 'fk-outra' }) }, 'return=representation');
    conferir(g1.status === 403 && g1.corpo.code === '42501' && g2.status === 403 && /só pode subir/.test(g2.corpo.message) && g3.status === 403 && regBanco().fk === FKN && regBanco().kv === 2,
      'M.soChefeGiro: o responsável não muda a fk (403 42501); o chefe não baixa a kv nem troca a fk com a mesma kv ("só pode subir")');
    const membrosBia = Object.assign({}, regBanco().membros, { [CRIS]: { kid: 'k', seq: 1, fk: FKN } });
    const g4 = await rest(BIA, 'PATCH', docUrl('settings', 'cofre'), { dados: Object.assign({}, regBanco(), { membros: membrosBia }) }, 'return=representation');
    conferir(g4.status === 200 && !!regBanco().membros[CRIS], 'M.soChefeGiro: o responsável ainda muda só os membros (a liberação de sempre)');
    const g5 = await rest(BIA, 'PATCH', docUrl('settings', 'giro'), { dados: Object.assign({}, linha('settings', 'giro').dados, { batida: agora() }) }, 'return=representation');
    const g6 = await rest(BIA, 'POST', '/rest/v1/omni_docs', { grupo_id: GID, colecao: 'settings', id: 'giro', vis: 'restrito', dados: { v: 1 } }, 'resolution=merge-duplicates,return=representation');
    conferir(g5.status === 403 && g6.status === 403 && linha('settings', 'giro').atualizado_por === ANA, 'M.soChefeGiro: o responsável não grava o settings/giro (PATCH nem POST)');
    const g7 = await rest(ANA, 'PATCH', docUrl('settings', 'cofre'), { apagado_em: agora() }, 'return=representation');
    const g8 = await rest(ANA, 'PATCH', docUrl('settings', 'giro'), { apagado_em: agora() }, 'return=representation');
    conferir(g7.status === 403 && g8.status === 403 && !linha('settings', 'cofre').apagado_em && !linha('settings', 'giro').apagado_em, 'M.soChefeGiro: o registro e a troca não se apagam (nem pelo chefe)');
    const g9 = await rest(BIA, 'POST', '/rest/v1/rpc/omni_mudar_campos', { p_grupo: GID, p_colecao: 'settings', p_id: 'cofre', p_campos: { fk: 'fk-bia' } });
    const g10 = await rest(ANA, 'PATCH', docUrl('settings', 'cofre'), { dados: Object.assign({}, regBanco(), { fk: 'fk-3', kv: 3 }) }, 'return=representation');
    conferir(g9.status === 403 && g10.status === 200 && regBanco().fk === 'fk-3', 'M.soChefeGiro: pelo omni_mudar_campos também recusa; o chefe sobe a kv (a troca) e passa');

    /* settings/giro com CAS (versao=eq.): com a versão de antes não grava nada (0 linhas); com a certa, grava; o 2º POST → 409 */
    voltar(); await trocaAMao();
    const vg = linha('settings', 'giro').versao, dg = Object.assign({}, linha('settings', 'giro').dados, { batida: agora() });
    const cas1 = await rest(ANA, 'PATCH', docUrl('settings', 'giro') + '&versao=eq.' + (vg - 1), { dados: dg }, 'return=representation');
    const cas2 = await rest(ANA, 'PATCH', docUrl('settings', 'giro') + '&versao=eq.' + vg, { dados: dg }, 'return=representation');
    const dup = await rest(ANA, 'POST', '/rest/v1/omni_docs', { grupo_id: GID, colecao: 'settings', id: 'giro', vis: 'restrito', dados: { v: 1 } }, 'return=representation');
    conferir(cas1.status === 200 && cas1.corpo.length === 0 && cas2.corpo.length === 1 && cas2.corpo[0].versao === vg + 1 && linha('settings', 'giro').versao === vg + 1 && dup.status === 409,
      'settings/giro com CAS: a versão velha não grava (0 linhas), a certa grava (versão +1), e um segundo POST dá 409');
    /* M.depoisDe: depois do n-ésimo PATCH em vault, chama a ação (uma vez) */
    voltar(); let chamou = 0, quando = -1; const base = M.log.length;
    M.depoisDe = { 'PATCH vault': 2, acao: () => { chamou++; quando = M.log.length - base; } };
    await rest(ANA, 'PATCH', docUrl('vault', 'v0'), { vis: 'restrito' });
    await rest(ANA, 'PATCH', docUrl('settings', 'cofre'), { vis: 'restrito' });
    const antes2 = chamou;
    await rest(ANA, 'PATCH', docUrl('vault', 'v1'), { vis: 'restrito' }); await espere(30);
    await rest(ANA, 'PATCH', docUrl('vault', 'v2'), { vis: 'restrito' }); await espere(30);
    conferir(antes2 === 0 && chamou === 1 && quando === 3 && M.depoisDe === null, 'M.depoisDe: a ação vem depois do 2º PATCH em vault (o de settings não conta), uma vez só');

    /* a ponte de verdade */
    voltar();
    const id1 = rpcs.sol_ponte_enviar(ANA, { p_de: 'omnilife-one', p_para: 'moneytrio', p_tipo: 'saude-resumo', p_grupo: GID, p_dados: { v: 1, cif: 'a' } }); await espere(5);
    const id2 = rpcs.sol_ponte_enviar(BIA, { p_de: 'omnilife-one', p_para: 'moneytrio', p_tipo: 'saude-resumo', p_grupo: GID, p_dados: { v: 1, cif: 'b' } });
    const cx = rpcs.sol_ponte_minha_caixa(DAVI, { p_app: 'moneytrio' });
    conferir(cx.length === 2 && cx[0].id === id1 && cx[1].id === id2 && rpcs.sol_ponte_minha_caixa(DAVI, { p_app: 'moneytrio', p_limite: 1 }).length === 1, 'ponte: a caixa de um membro do grupo traz as mais velhas primeiro (e respeita o limite)');
    conferir(rpcs.sol_ponte_marcar_lido(DAVI, { p_id: id1, p_app: 'moneytrio' }) === true && rpcs.sol_ponte_marcar_lido(DAVI, { p_id: id1, p_app: 'moneytrio' }) === false && rpcs.sol_ponte_marcar_lido(ANA, { p_id: id2, p_app: 'omnilife-one' }) === false,
      'ponte: qualquer membro marca como lida (uma vez); p_app é filtro');
    const cx2 = rpcs.sol_ponte_minha_caixa(ANA, { p_app: 'moneytrio' }), cx3 = rpcs.sol_ponte_minha_caixa(ANA, { p_app: 'moneytrio', p_so_nao_lidas: false });
    conferir(cx2.length === 1 && cx2[0].id === id2 && cx3.length === 2 && db.sol_ponte.find((x) => x.id === id1).lido_por === DAVI, 'ponte: só as não lidas por padrão; todas com p_so_nao_lidas false; lido_por guardado');
    db.sol_ponte_config.push({ user_id: ANA, de_app: 'omnilife-one', para_app: 'moneytrio', ligado: false });
    conferir(rpcs.sol_ponte_minha_caixa(ANA, { p_app: 'moneytrio' }).length === 0 && rpcs.sol_ponte_enviar(ANA, { p_de: 'omnilife-one', p_para: 'moneytrio', p_tipo: 'saude-resumo', p_grupo: GID, p_dados: {} }) === null,
      'ponte: desligada em sol_ponte_config, a caixa esconde e o enviar não guarda (null)');
    const rp = await rest(ANA, 'GET', '/rest/v1/sol_ponte?grupo_id=eq.' + GID + '&para_app=eq.moneytrio&lido_em=is.null&select=id');
    const rf = await rest(ANA, 'GET', '/rest/v1/sol_ponte_config?select=*'), rm = await rest(ANA, 'GET', '/rest/v1/money_migracao?select=*');
    conferir(rp.status === 200 && rp.corpo.length === 1 && rp.corpo[0].id === id2 && rf.status === 404 && rm.status === 404, 'ponte por REST: o membro lê as mensagens do grupo (sem o filtro da config); sol_ponte_config e money_migracao só pelas funções');
  });

  /* ================= G5: depois da troca, a CF antiga não abre nada ================= */
  await parte('G5', 'Depois de uma troca feita à mão no banco, a CF antiga não abre nada (em Node, com M.cfVelha)', async () => {
    const nova = await trocaAMao();
    let fechadas = 0, abremNova = 0, internas = 0, velhaNaoAbre = 0, fkNovo = 0;
    for (const r of vivasVault().filter((x) => x.id !== '_em')) {
      const o = JSON.parse(r.dados_cifrado); if (o.c === 1 && o.fk === FKN && o.kv === 2) fkNovo++;
      if (!(await abre(() => abrirLinha(M.cfVelha, r.dados_cifrado)))) velhaNaoAbre++;
      let doc = null; try { doc = await abrirLinha(nova, r.dados_cifrado); abremNova++; } catch (e) {}
      if (doc && doc.enc && (await abre(() => decifrar(nova, doc.enc))) && !(await abre(() => decifrar(M.cfVelha, doc.enc)))) internas++;
      fechadas++;
    }
    conferir(fechadas === 6 && fkNovo === 6 && abremNova === 6 && internas === 6, 'as 6 linhas vivas: fk novo e kv 2, abrem com a nova, e a parte interna também (só com a nova)');
    conferir(velhaNaoAbre === 6, 'G5. a CF antiga não abre nenhuma das 6 linhas vivas');
    const em = JSON.parse(linha('vault', '_em').dados_cifrado).d.em, emRaw = await decifrar(await kdf(CODIGO_EM, em.sal), em);
    conferir(em.fk === FKN && em.kv === 2 && igual(emRaw, nova) && !igual(emRaw, M.cfVelha), 'G5. o código de emergência refeito (o mesmo código) abre a NOVA, não a velha');
    conferir(!vivasVault().some((r) => { try { return JSON.parse(r.dados_cifrado).fk === FK0; } catch (e) { return false; } }), 'G5. nenhuma linha viva com o fk velho');
    const apag = linha('vault', 'vApagado');
    conferir(JSON.parse(apag.dados_cifrado).fk === FK0 && (await abre(() => abrirLinha(M.cfVelha, apag.dados_cifrado))), 'D-E6: a linha apagada ficou como estava (ninguém mexe no que já está salvo)');
    conferir(situacao().vault_fora === 0 && situacao().giro_ok === true, 'G5. sol_giro_situacao: vault_fora 0 e a troca conferida');
  });

  /* ================= G3 + G3c + G11b + M1 + M2 + C12: o aparelho que ficou com a velha ================= */
  await parte('G3', 'Aparelho velho não devolve a CF antiga; as guardas da carga, do mudar e da cópia', async (novo) => {
    const A = await novo('G3-ana-velho', { vp: 'computador' }), a = A.p;
    await abertoComVelha(a, ANA, PIN_A);
    const n0 = db.sol_grupo_chaves.length;
    conferir(await a.evaluate(() => Cofre.aberto() && Cofre.fk) === FK0 && n0 === 2, 'preparo: a Ana abre as Senhas da casa com a CF de antes (fk-teste); 2 linhas em sol_grupo_chaves');
    /* positivo, antes da troca: com a chave atual, a carga "família" sai (para a Bia, responsável) */
    const c0 = await a.evaluate(async (bia) => { const L = await Cofre.local(), k = await Aparelhos.carga({ tipo: 'familia', grupo_id: S.family.id, quem: bia }, L, new Uint8Array(Cofre.dukRaw)); const ok = !!k.c; if (k.zerar) k.zerar(); return { ok, texto: k.texto || '' }; }, BIA);
    conferir(c0.ok, 'antes da troca: a carga "família" para a Bia (responsável) sai com a chave atual');
    /* G11b: um membro pede "para a família" → a carga recusa (a última porta, além da tela) */
    const c1 = await a.evaluate(async (davi) => { const L = await Cofre.local(), k = await Aparelhos.carga({ tipo: 'familia', grupo_id: S.family.id, quem: davi }, L, new Uint8Array(Cofre.dukRaw)); if (k.zerar) k.zerar(); return { c: !!k.c, texto: k.texto || '' }; }, DAVI);
    conferir(!c1.c && /não é chefe nem responsável/.test(c1.texto), 'G11b. pedido "para a família" do Davi (membro): a carga recusa (' + c1.texto + ')');
    /* a mesma fk com a kv do registro MAIOR que a deste aparelho (um envelope com a kv falsa): também não é a atual */
    const reg0 = regBanco();
    gravarDoc('settings', 'cofre', { dados: Object.assign({}, reg0, { kv: 5 }) }, ANA);
    await darPublica(CRIS);
    await a.evaluate(async () => { await CloudDriver.pull(); });
    let marca = M.log.length;
    await distribuirJa(a);
    const ek = await entregas(marca);
    const ck = await a.evaluate(async (bia) => { const L = await Cofre.local(), k = await Aparelhos.carga({ tipo: 'familia', grupo_id: S.family.id, quem: bia }, L, new Uint8Array(Cofre.dukRaw)); if (k.zerar) k.zerar(); return { c: !!k.c, texto: k.texto || '', pm: Cofre.podeMudar() }; }, BIA);
    conferir(ek.length === 0 && !ck.c && /versão antiga/.test(ck.texto) && /precisa da atualização/.test(ck.pm.texto || ''), 'a mesma fk com uma kv maior no registro: nada embrulhado, a carga recusa e não se muda nada (' + JSON.stringify(ek) + ')');
    gravarDoc('settings', 'cofre', { dados: reg0 }, ANA);
    db.sol_chave_publica.splice(db.sol_chave_publica.findIndex((k) => k.user_id === CRIS), 1); delete M.PKCS8[CRIS];
    await a.evaluate(async () => { await CloudDriver.pull(); });
    /* G3c: uma mudança do registro esperando na fila (adiada, como depois de um "Depois" num conflito) */
    await semRede(A.ctx, true);
    await a.evaluate(async () => { await DB.put('settings', JSON.parse(JSON.stringify(Cofre.registro())), true); CloudDriver.adiado.set('settings|cofre', Date.now() + 1e9); for (let i = 0; i < 30 && !CloudDriver.fila.has('settings|cofre'); i++) await new Promise((r) => setTimeout(r, 100)); });
    const nova = await trocaAMao();
    const kidCris = await darPublica(CRIS);   /* uma responsável que ganhou a chave pública depois (ainda sem CF) */
    await semRede(A.ctx, false); await espere(300);
    marca = M.log.length;
    await distribuirJa(a);
    const e1 = await entregas(marca), local1 = await a.evaluate(() => JSON.parse(JSON.stringify(Cofre.registro())));
    conferir(local1.fk === FK0 && e1.length === 0 && regOk(regBanco()), 'G3c. com o registro na fila (a cópia daqui ainda diz fk-teste), o _distribuir decide pelo banco: nada embrulhado (' + JSON.stringify(e1) + ')');
    /* a fila sobe: o registro de antes não volta */
    await a.evaluate(() => CloudDriver.adiado.clear()); await subir(a, true);
    const local2 = await a.evaluate(() => JSON.parse(JSON.stringify(Cofre.registro())));
    conferir(regOk(regBanco()) && local2.fk === FKN && local2.kv === 2 && !(await a.evaluate(() => CloudDriver.fila.has('settings|cofre'))), 'o registro que estava na fila sobe sem voltar o do banco; a cópia daqui passa a ser a do banco');
    /* G3: de volta à internet, com as Senhas abertas com a velha: nada sai para ninguém */
    marca = M.log.length;
    await distribuirJa(a); await a.evaluate(() => Cloud.poll && Cloud.poll()).catch(() => {}); await espere(1500); await distribuirJa(a);
    const e2 = await entregas(marca);
    const todas = await Promise.all(db.sol_grupo_chaves.filter((c) => c.versao > 1).map(async (c) => { try { return (await desembrulhar(c.user_id, c.chave_embrulhada)).fk; } catch (e) { return '?'; } }));
    conferir(e2.length === 0 && todas.every((f) => f === FKN) && db.sol_grupo_chaves.length === 4 && regOk(regBanco()) && regBanco().kv === 2,
      'G3. o aparelho velho não chama sol_guardar_chave_grupo; toda linha nova abre com a fk nova; o registro continua o novo e a kv não desce (' + JSON.stringify(e2) + ')');
    /* o registro pela fila não anda para trás (C4): um aparelho sem a cópia do registro que manda um novo, com a chave dele */
    await semRede(A.ctx, true);
    await a.evaluate(async (ana) => {
      CloudDriver.recs.delete('settings|cofre'); DB.col('settings').delete('cofre');
      await DB.put('settings', { id: 'cofre', vis: 'restrito', fk: Cofre.fk, kv: Cofre.kv, membros: { [ana]: { kid: 'kid-velho', seq: 1, fk: Cofre.fk } } }, true);
      for (let i = 0; i < 30 && !CloudDriver.fila.has('settings|cofre'); i++) await new Promise((r) => setTimeout(r, 100));
    }, ANA);
    await semRede(A.ctx, false); await espere(300);
    await subir(a, true, 'settings|cofre');
    const local3 = await a.evaluate(() => JSON.parse(JSON.stringify(Cofre.registro() || {})));
    conferir(regOk(regBanco()) && regBanco().kv === 2 && local3.fk === FKN, 'C4. um registro "de antes" que um aparelho sem a cópia manda pela fila não volta o do banco (fica o do banco, aqui também)');
    await a.evaluate(async (fk0) => { await DB.put('settings', Object.assign(JSON.parse(JSON.stringify(Cofre.registro())), { fk: fk0, kv: 1 }), true); }, FK0); await subir(a, true, 'settings|cofre');
    conferir(regOk(regBanco()) && regBanco().kv === 2, 'C4. nem com a versão certa da linha: a fk e a kv de antes não sobem pela fila');
    await a.evaluate(async () => { await DB.put('settings', Object.assign(JSON.parse(JSON.stringify(Cofre.registro())), { fk: 'fk-outra', kv: 2 }), true); }); await subir(a, true, 'settings|cofre');
    conferir(regBanco().fk === FKN, 'C4. outra fk com a mesma kv também não sobe');
    await a.evaluate(async () => { await DB.del('settings', 'cofre'); }); await subir(a, true, 'settings|cofre');
    conferir(!linha('settings', 'cofre').apagado_em && await a.evaluate(() => !!Cofre.registro()), 'C4. o registro não se apaga pela fila (volta o do banco)');
    /* o estado da troca nunca vai pela fila (só por REST, com a versão conferida): nem mudado, nem apagado */
    const giroAntes0 = JSON.stringify(linha('settings', 'giro'));
    await a.evaluate(async () => { await DB.put('settings', Object.assign(JSON.parse(JSON.stringify(DB.col('settings').get('giro'))), { estado: 'desistiu', envelopes: { x: '1.velho' } }), true); }); await subir(a, true, 'settings|giro');
    const gLocal = await a.evaluate(() => (DB.col('settings').get('giro') || {}).estado);
    await a.evaluate(async () => { await DB.del('settings', 'giro'); }); await subir(a, true, 'settings|giro');
    conferir(JSON.stringify(linha('settings', 'giro')) === giroAntes0 && gLocal === 'feito' && await a.evaluate(() => !!DB.col('settings').get('giro')), 'o estado da troca não sobe pela fila (mudado ou apagado): fica o do banco, aqui também');
    /* 2.b.3: a carga "família" do aparelho velho recusa */
    const c2 = await a.evaluate(async (bia) => { const L = await Cofre.local(), k = await Aparelhos.carga({ tipo: 'familia', grupo_id: S.family.id, quem: bia }, L, new Uint8Array(Cofre.dukRaw)); if (k.zerar) k.zerar(); return { c: !!k.c, texto: k.texto || '' }; }, BIA);
    conferir(!c2.c && /versão antiga das Senhas da casa/.test(c2.texto), 'G3. a carga "família" do aparelho velho recusa: "' + c2.texto + '"');
    /* M1: podeMudar e o selar */
    await vigiarAvisos(a);
    const pm = await a.evaluate(async () => {
      const r = Cofre.podeMudar(); let selou = 'selou';
      try { await Cofre.selar({ id: 'x1', kind: 'senha', vis: 'restrito' }); } catch (e) { selou = e.message; }
      let em = 'selou'; try { await Cofre.selar({ id: '_em', em: { kv: 1 }, vis: 'restrito' }); } catch (e) { em = e.message; }
      const antes = DB.all('vault').length; editVault(null, 'senha'); await new Promise((r) => setTimeout(r, 600));
      const form = !!document.querySelector('.modal input[name="title"]'); if (form) closeModals();
      const cod = await Cofre.envelope();
      let carro = 'gravou'; try { await Cars.guardarSegredo({ id: 'c9', name: 'Carro', seguro: {} }, { placa: 'ABC1D23' }); } catch (e) { carro = e.message; }
      return { r, selou, em, form, cod: cod || null, carro, novos: DB.all('vault').length - antes, fila: [...CloudDriver.fila.keys()].filter((k) => k.startsWith('vault|')).length };
    });
    await espere(400);
    const av = await avisos(a);
    conferir(/precisa da atualização/.test(pm.r.texto || '') && /precisa da atualização/.test(pm.selou) && /precisa da atualização/.test(pm.em), 'M1. com a chave velha: podeMudar → "' + (pm.r.texto || '') + '"; o selar (item e _em) recusa');
    conferir(!pm.form && !pm.cod && /precisa da atualização/.test(pm.carro) && pm.novos === 0 && pm.fila === 0 && /precisa da atualização/.test(av),
      'M1. editar, o código de emergência e a placa do carro param antes (aviso para leigo); nada novo nas Senhas nem na fila (' + av + ')');
    /* 2.b.4: uma carga "família" velha chega a um aparelho novo (da Bia) */
    const N = await novo('G3-bia-novo', { vp: 'celular' }), b = N.p;
    await entrarOmni(b, BIA); await quieto(b);
    const apId = crypto.randomUUID();
    db.sol_aparelhos.push({ id: apId, user_id: BIA, nome: 'Android · Chrome', app: 'omnilife', como: 'familia', aprovado_por: ANA, aprovado_por_ap: null, criado_em: agora(), visto_em: agora(), removido_em: null, removido_por: null });
    await b.evaluate(async (o) => { Aparelhos.receber({ tipo: 'familia', gid: S.family.id, kv: 1, fk: o.fk, cf: new Uint8Array(o.cf) }, o.ap, 'familia'); }, { fk: FK0, cf: [...VELHA], ap: apId });
    const viu = await esperar(b, () => [...document.querySelectorAll('.modal')].some((m) => /versão antiga/.test(m.innerText)), null, 10000);
    const t4 = await janelas(b);
    conferir(viu && /Pedir de novo/.test(t4) && !(await b.evaluate(async () => !!(await Cofre.local()))) && !(await b.evaluate(() => Cofre.aberto())) && await (async () => { await espere(400); return !!db.sol_aparelhos.find((x) => x.id === apId).removido_em; })(),
      'G3. a carga "família" velha que chega: "' + t4.slice(0, 120) + '", nada montado e o lugar novo sai da lista');
    await b.evaluate(() => closeModals());
    /* positivo: com a CF NOVA (como depois da etapa E4) o mesmo aparelho entrega a nova — para a Cris; o Davi (membro) não recebe */
    marca = M.log.length;
    await a.evaluate(async (raw) => { await Cofre.usarChave(new Uint8Array(raw), 2, 'fk-nova'); }, [...nova]);
    await espere(500); await distribuirJa(a);
    const e3 = await entregas(marca);
    await ate(() => regBanco().membros[CRIS], 5000);
    conferir(e3.length === 1 && e3[0].user === CRIS && e3[0].fk === FKN && e3[0].kv === 2 && regBanco().membros[CRIS] && regBanco().membros[CRIS].fk === FKN && regBanco().membros[CRIS].kid === kidCris,
      'com a chave do registro, o aparelho entrega a nova à Cris (responsável que faltava) e o registro a anota (' + JSON.stringify(e3) + ' · ' + JSON.stringify(regBanco().membros[CRIS] || null) + ' · ' + (await avisos(a)) + ')');
    conferir(!db.sol_grupo_chaves.some((c) => c.user_id === DAVI) && !regBanco().membros[DAVI], 'G11b. o Davi (membro, com chave pública) não recebe a CF (D-E1)');
    const pm2 = await a.evaluate(() => Cofre.podeMudar());
    conferir(pm2.ok === true, 'com a chave do registro: podeMudar ok');
    /* M2: durante a troca ninguém entrega nem muda; a troca "publico" não vale (C9) */
    gravarDoc('settings', 'giro', { vis: 'restrito', dados: Object.assign({}, linha('settings', 'giro').dados, { estado: 'recifrando', batida: agora(), fim: null }) }, ANA);
    await darPublica(CRIS);   /* a Cris trocou de chave: falta entregar de novo */
    await a.evaluate(async () => { await CloudDriver.pull(); });
    marca = M.log.length;
    await distribuirJa(a);
    const e4 = await entregas(marca);
    const g = await a.evaluate(async (bia) => { const L = await Cofre.local(), k = await Aparelhos.carga({ tipo: 'familia', grupo_id: S.family.id, quem: bia }, L, new Uint8Array(Cofre.dukRaw)); if (k.zerar) k.zerar(); return { em: Giro.emCurso(), vivo: Giro.vivo(), c: !!k.c, texto: k.texto || '', pm: Cofre.podeMudar() }; }, BIA);
    conferir(g.em && g.vivo && e4.length === 0, 'M2. com a troca em curso: o _distribuir não entrega a ninguém (só a troca entrega)');
    conferir(!g.c && /Espere a troca de segurança terminar para aprovar/.test(g.texto) && /Espere a troca de segurança terminar para mudar/.test(g.pm.texto || ''), 'M2. a carga "família" espera e o podeMudar também ("' + g.texto + '")');
    gravarDoc('settings', 'giro', { vis: 'restrito', dados: Object.assign({}, linha('settings', 'giro').dados, { estado: 'recifrando' }) }, ANA);
    linha('settings', 'giro').atualizado_em = new Date(Date.now() - 10 * 60e3).toISOString();
    await a.evaluate(async () => { CloudDriver.recs.delete('settings|giro'); CloudDriver.cur = ''; await CloudDriver.pull(); });
    const parada = await a.evaluate(() => ({ em: Giro.emCurso(), vivo: Giro.vivo(), pm: Cofre.podeMudar() }));
    conferir(parada.em && !parada.vivo && parada.pm.ok === true, 'M2. troca parada há 10 min: ainda "em curso" (ninguém entrega), mas mudar as senhas volta a poder');
    gravarDoc('settings', 'giro', { vis: 'publico', dados: Object.assign({}, linha('settings', 'giro').dados, { vis: 'publico', estado: 'recifrando' }) }, BIA);
    await a.evaluate(async () => { await CloudDriver.pull(); });
    marca = M.log.length;
    await distribuirJa(a);
    const e5 = await entregas(marca), pub = await a.evaluate(() => Giro.emCurso());
    conferir(!pub && e5.length === 1 && e5[0].user === CRIS && e5[0].fk === FKN, 'C9. uma "troca" gravada como "publico" não vale: não trava a família (a entrega para a Cris segue com a nova)');
    /* C12: a cópia não leva o registro nem a troca; restaurar não mexe neles */
    gravarDoc('settings', 'giro', { vis: 'restrito', dados: Object.assign({}, linha('settings', 'giro').dados, { vis: 'restrito', estado: 'feito', envelopes: {} }) }, ANA);
    await a.evaluate(async () => { await CloudDriver.pull(); }); await subir(a, true);
    const copia = await a.evaluate(async () => { const o = JSON.parse(await backupJSON(false)); return { ids: (o.data.settings || []).map((d) => d.id), temCofreAqui: !!DB.col('settings').get('cofre'), temGiroAqui: !!DB.col('settings').get('giro') }; });
    conferir(copia.temCofreAqui && copia.temGiroAqui && !copia.ids.includes('cofre') && !copia.ids.includes('giro'), 'C12. a cópia (backupJSON) não leva o registro nem a troca (' + copia.ids.join(',') + ')');
    const regAntes = JSON.stringify(linha('settings', 'cofre')), giroAntes = JSON.stringify(linha('settings', 'giro'));
    await a.evaluate(async (o) => {
      const p = Restore.aplicar({ app: 'OmniLifeONE', v: 1, data: { settings: [{ id: 'cofre', vis: 'restrito', fk: o.fk0, kv: 1, membros: { velho: { kid: 'k', seq: 1, fk: o.fk0 } } }, { id: 'giro', vis: 'restrito', v: 1, estado: 'feito', envelopes: { x: '1.velho' } }], people: [] } }, {});
      for (let i = 0; i < 40; i++) { await new Promise((r) => setTimeout(r, 100)); const b = document.querySelector('.modal [data-m="juntar"]'); if (b) { b.click(); break; } }
      await Promise.race([p, new Promise((r) => setTimeout(r, 15000))]);
    }, { fk0: FK0 });
    await subir(a, true);
    await espere(500);
    const fila = await a.evaluate(() => [...CloudDriver.fila.keys()]);
    conferir(JSON.stringify(linha('settings', 'cofre')) === regAntes && JSON.stringify(linha('settings', 'giro')) === giroAntes && !fila.includes('settings|cofre') && !fila.includes('settings|giro'),
      'C12. restaurar uma cópia que traz o registro de antes e a troca não mexe neles (nem pela fila)');
  });

  /* ================= N1: o montar com novaCF nunca cria uma segunda CF ================= */
  await parte('N1', 'Conta nova: sem resposta do banco (ou com o registro apagado), nenhuma segunda chave da família', async (novo) => {
    const N = await novo('N1-cris', { vp: 'celular' }), c = N.p;
    await entrarOmni(c, CRIS); await quieto(c);
    const regAntes = JSON.stringify(regBanco()), nAntes = db.sol_grupo_chaves.length;
    /* a leitura do omni_docs cai (rede) e a cópia daqui não tem o registro */
    const cortar = (u) => u.href.includes('/rest/v1/omni_docs');
    await c.route(cortar, (r) => (r.request().method() === 'GET' ? r.abort() : r.fallback()));
    let marca = M.log.length;
    const r1 = await c.evaluate(async (pin) => {
      CloudDriver.recs.delete('settings|cofre'); DB.col('settings').delete('cofre');
      const par = await Cofre.novoPar(); const r = await Cofre.montar(par.pkcs8, null, pin, 'primeiro', null, null, true);
      return { erro: r.erro || null, ok: !!r.ok, L: !!(await Cofre.local()), aberto: Cofre.aberto() };
    }, PIN_C);
    conferir(r1.erro === 'rede' && !r1.ok && !r1.L && !r1.aberto && JSON.stringify(regBanco()) === regAntes && db.sol_grupo_chaves.length === nAntes && !(await entregas(marca)).length,
      'N1. montar com novaCF e a leitura do registro falhando: {erro:"rede"}, nada montado, nenhuma chave nova (' + JSON.stringify(r1) + ')');
    /* o criarConta (a conta nova de verdade) com a mesma falha: devolve "rede" sem deixar linha na lista */
    const r2 = await c.evaluate(async (pin) => { CloudDriver.recs.delete('settings|cofre'); DB.col('settings').delete('cofre'); const r = await Cofre.criarConta(pin); return { erro: r.erro || null, L: !!(await Cofre.local()) }; }, PIN_C);
    await espere(600);
    conferir(r2.erro === 'rede' && !r2.L && !db.sol_aparelhos.some((x) => x.user_id === CRIS && !x.removido_em) && JSON.stringify(regBanco()) === regAntes && db.sol_grupo_chaves.length === nAntes,
      'N1. criarConta com a mesma falha: "rede", nenhum cadeado, nenhuma linha da Cris na lista, nenhuma chave nova (' + JSON.stringify(r2) + ')');
    await c.unroute(cortar);
    /* o registro apagado ainda diz que a família tem chave (C4): não nasce outra */
    linha('settings', 'cofre').apagado_em = agora();
    marca = M.log.length;
    const r3 = await c.evaluate(async (pin) => {
      CloudDriver.recs.delete('settings|cofre'); DB.col('settings').delete('cofre');
      const par = await Cofre.novoPar(); const r = await Cofre.montar(par.pkcs8, null, pin, 'primeiro', null, null, true); if (r.raw) r.raw.fill(0);
      const L = await Cofre.local(); return { erro: r.erro || null, fam: L ? Object.keys(L.fam || {}).length : -1, aberto: Cofre.aberto() };
    }, PIN_C);
    conferir(r3.erro === 'aguardando' && r3.fam === 0 && !r3.aberto && db.sol_grupo_chaves.length === nAntes && linha('settings', 'cofre').dados.fk === FK0 && !(await entregas(marca)).length,
      'N1. com o registro apagado no banco: "Falta liberar" (o cadeado sem a chave da família), nenhuma chave nova (' + JSON.stringify(r3) + ')');
  });

  const sujos = lixos.filter((l) => l.erros.length || l.nativos.length || l.fora.some((u) => /supabase/i.test(u)));
  conferir(!sujos.length, 'sem erro de script, sem diálogo nativo e nada fora do banco de mentira' + (sujos.length ? ': ' + sujos.map((l) => l.erros.concat(l.nativos).join(' | ')).join(' || ') : ''));
  conferir(!lixos.some((l) => l.console.some((t) => PINS.some((x) => t.includes(x)) || t.includes(CODIGO_EM))), 'nenhum PIN nem código de emergência no console');
  await terminar(falhas, browser, 'Parte E, etapas E1-E2 (SQL no mock, G5, G3, G3c, G11b, M1, M2, C12, N1)');
})().catch((e) => { console.error(e); process.exit(1); });
