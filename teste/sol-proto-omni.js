/* Teste automático: contas puras do protocolo de aparelhos (sol-ap-v2) e do PIN da conta (sol-pin-v1) — SolProto, 2.26.0.
   As contas rodam no Chromium, dentro do index.html, contra os vetores fixos e fictícios de teste/vetores-sol-v2.json
   (calculados com as MESMAS contas do nuvem.js 1.11.0 do MoneyTRIO). Nenhuma rede: tudo que não é o site local é cortado
   (e nenhuma chamada ao Supabase).
     V0 o gerador (teste/gerar-vetores-sol.js) refaz o JSON igual, byte a byte, lendo as chaves fictícias do próprio JSON
     V1 compromisso C = o do vetor (e as constantes da plataforma)
     V2 os 6 números = 198016; na tela "198 016"; para o leitor de tela "1 9 8 0 1 6"
     V3 a privada de teste de B abre a resposta pessoal e a da família e dá a carga do vetor (id ou uid errado não abre)
     V4 fechar com a chave de A abre do lado de B (ida e volta), iv de 12 bytes; par novo: só kty/crv/x/y, privada não extraível
     V5 verificador do PIN 736251 com o sal da conta = v do vetor (sem normalizar o PIN); HKDF do PIN e da passkey = vetor
     V6 pubOk / nonceOk / lerCarga recusam o que o banco ou um atacante poderia mandar torto (K1/K3)
     V7 nomeAparelho = o do MoneyTRIO com 6 navegadores (com MONEYTRIO=<pasta> confere também com o nuvem.js de lá)
     V8 rpId e rotuloApp; SolProto não usa S, tela, conta nem rede
   Só valores de mentira. Uso: node teste/rodar.js */
const fs = require('fs'), path = require('path'), vm = require('vm');
const { execFileSync } = require('child_process');
const { BASE, VP, criarConferir, abrirApp, iniciar, terminar } = require('./_base');

const ARQ = path.join(__dirname, 'vetores-sol-v2.json');
const V = JSON.parse(fs.readFileSync(ARQ, 'utf8'));

/* V7: os 6 navegadores e o nome que o MoneyTRIO (nuvem.js 1.11.0, nomeAparelho) dá a cada um, em PT e EN */
const UAS = [
  ['Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36', 'Android · Chrome', 'Android · Chrome'],
  ['Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1', 'iPhone · Safari', 'iPhone · Safari'],
  ['Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36 Edg/124.0.0.0', 'Windows · Edge', 'Windows · Edge'],
  ['Mozilla/5.0 (Macintosh; Intel Mac OS X 14.5; rv:126.0) Gecko/20100101 Firefox/126.0', 'Mac · Firefox', 'Mac · Firefox'],
  ['Mozilla/5.0 (Linux; Android 14; SM-S921B) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/25.0 Chrome/121.0.0.0 Mobile Safari/537.36', 'Android · Samsung', 'Android · Samsung'],
  ['Lynx/2.9.0 libwww-FM/2.14', 'Aparelho', 'Device']
];
/* com MONEYTRIO=<pasta do investify-me>: a função nomeAparelho de lá, rodada aqui no node com o navegador de mentira */
function nomeDoMoneyTrio() {
  if (!process.env.MONEYTRIO) return null;
  const src = fs.readFileSync(path.join(process.env.MONEYTRIO, 'nuvem.js'), 'utf8');
  const m = src.match(/function nomeAparelho\(\) \{[\s\S]*?\n  \}/);
  if (!m) throw new Error('nomeAparelho não encontrada no nuvem.js do MoneyTRIO');
  return (ua, lang) => vm.runInNewContext(m[0] + '\nnomeAparelho();', { navigator: { userAgent: ua }, tt: (pt, en) => (lang === 'en' ? en : pt) });
}

(async () => {
  const { falhas, conferir } = criarConferir();

  /* ---------- V0 (K36): o gerador sai igual ao JSON guardado ---------- */
  console.log('\n— V0 gerador dos vetores —');
  const gerado = execFileSync(process.execPath, [path.join(__dirname, 'gerar-vetores-sol.js')], { encoding: 'utf8' });
  conferir(gerado === fs.readFileSync(ARQ, 'utf8'), 'gerar-vetores-sol.js (com as chaves fictícias do próprio JSON) refaz teste/vetores-sol-v2.json byte a byte');
  conferir(V.aparelhos.B_abriu_igual === true && /FICTÍCIAS/.test(V.nota), 'o JSON diz que as chaves privadas são fictícias e que B abriu igual');

  const browser = await iniciar();
  const ctx = await browser.newContext({ viewport: VP.computador, serviceWorkers: 'block', locale: 'pt-BR' });
  const fora = [];
  await ctx.route('**/*', (r) => { const u = r.request().url(); if (u.startsWith(BASE + '/')) return r.continue(); fora.push(u); return r.abort(); });
  const { p, lixo } = await abrirApp(browser, 'computador', { ctx, semEntrar: true });
  await p.waitForFunction(() => typeof SolProto !== 'undefined', null, { timeout: 15000 });

  const r = await p.evaluate(async (a) => {
    const V = a.V, A = V.aparelhos, P = V.pin, SP = SolProto, o = {};
    const igual = (x, y) => JSON.stringify(x) === JSON.stringify(y);
    const hex = (b) => Array.from(b, (x) => x.toString(16).padStart(2, '0')).join('');
    const deHex = (h) => new Uint8Array(h.match(/../g).map((x) => parseInt(x, 16)));
    const lanca = async (f) => { try { await f(); return false; } catch (e) { return true; } };
    const imp = (jwk) => crypto.subtle.importKey('jwk', jwk, { name: 'ECDH', namedCurve: 'P-256' }, false, ['deriveBits']);

    /* V1 */
    o.constantes = [SP.AP_V, SP.PK_INFO, SP.PIN_SRV, SP.ITER, SP.APP];
    o.C = await SP.compromisso(A.pubB, A.nB);
    /* V2 */
    o.sas = await SP.sas(A.id, A.pubA, A.pubB, A.nA, A.nB);
    o.sasTela = SP.sasTela(o.sas); o.sasFalado = SP.sasFalado(o.sas);
    o.sasOutro = await SP.sas(A.id, A.pubB, A.pubA, A.nA, A.nB);   /* trocar A e B muda os números */
    /* V3: B (privada de teste) abre o que A fechou no vetor */
    const privA = await imp(A.privA_jwk_SO_TESTE), privB = await imp(A.privB_jwk_SO_TESTE);
    const kB = await SP.chave(privB, A.pubA, A.id, A.uid_de_quem_pede, A.nA, A.nB);
    o.kB = { ext: kB.extractable, alg: kB.algorithm.name, len: kB.algorithm.length, usos: kB.usages.slice().sort().join(',') };
    const abriuP = await SP.abrirResp(kB, A.id, A.resposta_pessoal), abriuF = await SP.abrirResp(kB, A.id, A.resposta_familia);
    o.abriuP = igual(abriuP, A.carga_pessoal); o.abriuF = igual(abriuF, A.carga_familia);
    const ctFixo = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv: bufFromB64(A.iv_fixo_b64), additionalData: SP.utf8(A.id) }, kB, SP.utf8(JSON.stringify(A.carga_pessoal))));
    o.mesmaChave = b64FromBuf(ctFixo) === A.resposta_pessoal.ct;
    o.idErrado = await lanca(() => SP.abrirResp(kB, '0f0e0d0c-0b0a-4908-8706-050403020101', A.resposta_pessoal));
    o.uidErrado = await lanca(async () => SP.abrirResp(await SP.chave(privB, A.pubA, A.id, '22222222-2222-2222-2222-222222222222', A.nA, A.nB), A.id, A.resposta_pessoal));
    const cp = SP.lerCarga(abriuP, 'pessoal'), cf = SP.lerCarga(abriuF, 'familia', A.carga_familia.gid);
    o.cp = { tipo: cp.tipo, u8: cp.sk instanceof Uint8Array, sk: SP.deUtf8(cp.sk), chaves: Object.keys(cp).sort().join(',') };
    o.cf = { tipo: cf.tipo, gid: cf.gid, kv: cf.kv, fk: cf.fk, u8: cf.cf instanceof Uint8Array, n: cf.cf.length, sete: cf.cf.every((x) => x === 7), chaves: Object.keys(cf).sort().join(',') };
    /* V4: A fecha, B abre */
    const kA = await SP.chave(privA, A.pubB, A.id, A.uid_de_quem_pede, A.nA, A.nB);
    const f1 = await SP.fechar(kA, A.id, A.carga_familia), f2 = await SP.fechar(kA, A.id, A.carga_familia);
    o.f = { v: f1.v, chaves: Object.keys(f1).sort().join(','), iv: bufFromB64(f1.iv).length, ivNovo: f1.iv !== f2.iv, volta: igual(await SP.abrirResp(kB, A.id, f1), A.carga_familia) };
    const pa = await SP.novoPar(), pb = await SP.novoPar();
    const nA = SP.b64u(SP.rnd(32)), nB = SP.b64u(SP.rnd(32)), id = crypto.randomUUID(), uid = crypto.randomUUID();
    const ka = await SP.chave(pa.priv, pb.pub, id, uid, nA, nB), kb = await SP.chave(pb.priv, pa.pub, id, uid, nA, nB);
    const carga = SP.cargaPessoal(SP.rnd(1800));
    o.par = { chaves: Object.keys(pb.pub).join(','), pubOk: SP.pubOk(pa.pub) && SP.pubOk(pb.pub), ext: pb.priv.extractable, alg: pb.priv.algorithm.name,
      curva: pb.priv.algorithm.namedCurve, usos: pb.priv.usages.join(','), nonces: SP.nonceOk(nA) && SP.nonceOk(nB),
      volta: igual(await SP.abrirResp(kb, id, await SP.fechar(ka, id, carga)), carga),
      C: (await SP.compromisso(pb.pub, nB)).length, sasIguais: (await SP.sas(id, pa.pub, pb.pub, nA, nB)) === (await SP.sas(id, pa.pub, pb.pub, nA, nB)) };
    o.cargas = igual(SP.cargaPessoal(SP.utf8('pkcs8-de-mentira')), A.carga_pessoal) && igual(SP.cargaFamilia(A.carga_familia.gid, 1, 'fk-teste', new Uint8Array(32).fill(7)), A.carga_familia);
    /* V5: PIN da conta */
    o.v = await SP.verificador(P.pin, P.sal_conta_b64u);
    o.vNumero = await SP.verificador(Number(P.pin), P.sal_conta_b64u);
    o.vEspaco = await SP.verificador(P.pin + ' ', P.sal_conta_b64u);
    const sal = SP.novoSalConta(), sal2 = SP.novoSalConta();
    o.sal = { ok: /^[A-Za-z0-9_-]{22}$/.test(sal), bytes: SP.unb64u(sal).length, novo: sal !== sal2 };
    const mesmaHkdf = async (bytes, info, hexEsperado) => {
      const k1 = await SP.hkdf(bytes, info), k2 = await crypto.subtle.importKey('raw', deHex(hexEsperado), 'AES-GCM', false, ['encrypt']);
      const iv = new Uint8Array(12), t = SP.utf8('vetor de mentira');
      const c1 = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, k1, t), c2 = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, k2, t);
      return !k1.extractable && k1.algorithm.length === 256 && b64FromBuf(c1) === b64FromBuf(c2);
    };
    o.hkdfPin = await mesmaHkdf(SP.unb64u(P.segredo_b64u), SP.PIN_SRV, P.chave_srv_hkdf_sol_pin_v1_hex);
    o.hkdfPk = await mesmaHkdf(deHex(V.passkey.prf_first_hex), SP.PK_INFO, V.passkey.chave_hkdf_sol_passkey_v2_hex);
    o.b64u = true;
    for (let n = 0; n <= 40; n++) { const x = SP.rnd(n), t = SP.b64u(x); if (/[=+/]/.test(t) || hex(SP.unb64u(t)) !== hex(x)) o.b64u = false; }
    o.b64uSegredo = SP.unb64u(P.segredo_b64u).length === 32 && SP.b64u(SP.unb64u(P.segredo_b64u)) === P.segredo_b64u;
    /* V6 */
    const pub = A.pubA, com = (x) => Object.assign({}, pub, x);
    o.pubOk = { certo: SP.pubOk(pub), comD: SP.pubOk(com({ d: A.privA_jwk_SO_TESTE.d })), x42: SP.pubOk(com({ x: pub.x.slice(1) })), x44: SP.pubOk(com({ x: pub.x + 'A' })),
      y42: SP.pubOk(com({ y: pub.y.slice(1) })), crv: SP.pubOk(com({ crv: 'P-384' })), kty: SP.pubOk(com({ kty: 'RSA' })), sinal: SP.pubOk(com({ x: pub.x.slice(1) + '=' })),
      mais: SP.pubOk(com({ x: '+' + pub.x.slice(1) })), nulo: SP.pubOk(null), texto: SP.pubOk('EC') };
    o.nonceOk = { certo: SP.nonceOk(A.nA) && SP.nonceOk(A.nB) && SP.nonceOk(A.compromisso_C), n42: SP.nonceOk(A.nA.slice(1)), n44: SP.nonceOk(A.nA + 'A'),
      igual: SP.nonceOk(A.nA.slice(1) + '='), barra: SP.nonceOk('/' + A.nA.slice(1)), nulo: SP.nonceOk(null), numero: SP.nonceOk(123) };
    const ps = A.carga_pessoal, fa = A.carga_familia, mp = (x) => Object.assign({}, ps, x), mf = (x) => Object.assign({}, fa, x);
    o.lerCarga = {
      v1: await lanca(() => SP.lerCarga(mp({ v: 1 }))), semV: await lanca(() => SP.lerCarga({ tipo: 'pessoal', sk: ps.sk })),
      tipo: await lanca(() => SP.lerCarga(mp({ tipo: 'outro' }))), tipoBanco: await lanca(() => SP.lerCarga(fa, 'pessoal')), tipoBanco2: await lanca(() => SP.lerCarga(ps, 'familia')),
      cf31: await lanca(() => SP.lerCarga(mf({ cf: b64FromBuf(new Uint8Array(31)) }))), cf33: await lanca(() => SP.lerCarga(mf({ cf: b64FromBuf(new Uint8Array(33)) }))),
      cfRuim: await lanca(() => SP.lerCarga(mf({ cf: '@@@@' }))), skRuim: await lanca(() => SP.lerCarga(mp({ sk: '%%%%' }))), skVazio: await lanca(() => SP.lerCarga(mp({ sk: '' }))),
      skNumero: await lanca(() => SP.lerCarga(mp({ sk: 1234 }))), kv: await lanca(() => SP.lerCarga(mf({ kv: 1.5 }))), kvTexto: await lanca(() => SP.lerCarga(mf({ kv: '1' }))),
      semGid: await lanca(() => SP.lerCarga(mf({ gid: '' }))), gidOutro: await lanca(() => SP.lerCarga(fa, 'familia', '33333333-3333-3333-3333-333333333333')),
      nulo: await lanca(() => SP.lerCarga(null)), texto: await lanca(() => SP.lerCarga('{"v":2}')),
      aceitaSemBanco: !(await lanca(() => SP.lerCarga(ps))) && !(await lanca(() => SP.lerCarga(fa))), aceitaFamiliaSemGid: !(await lanca(() => SP.lerCarga(fa, 'familia')))
    };
    /* V7 */
    o.nomes = a.uas.map((u) => [SP.nomeAparelho(u[0], 'pt'), SP.nomeAparelho(u[0], 'en')]);
    o.nomeLongo = SP.nomeAparelho('Android', 'pt').length <= 60;
    /* V8 */
    o.rp = [SP.rpId('app.solverone.com.br'), SP.rpId('solverone.com.br'), SP.rpId('localhost'), SP.rpId('marceloneco.github.io'), SP.rpId('solverone.com.br.exemplo.com'), SP.rpId('xsolverone.com.br')];
    o.rotulos = ['omnilife', 'omnilife-one', 'moneytrio', 'outro-app'].map((c) => SP.rotuloApp(c));
    const fonte = Object.values(SP).filter((f) => typeof f === 'function').map((f) => f.toString()).join('\n');
    o.pura = !/\bS\.|document|window|\bConta\b|fetch|IDB|localStorage|sessionStorage|navigator/.test(fonte);
    return o;
  }, { V, uas: UAS });

  console.log('\n— V1 compromisso —');
  conferir(JSON.stringify(r.constantes) === JSON.stringify(['sol-ap-v2', 'sol-passkey-v2', 'sol-pin-v1', 600000, 'omnilife']), 'constantes da plataforma: sol-ap-v2, sol-passkey-v2, sol-pin-v1, 600000, p_app "omnilife"');
  conferir(r.C === V.aparelhos.compromisso_C && r.C === '8yyZfSzRIOaz4SNXKJtso4IJAJO9GSyDyrceY1jI1tU', 'compromisso(pubB, nB) = C do vetor (' + r.C + ')');

  console.log('\n— V2 os 6 números —');
  conferir(r.sas === '198016' && r.sas === V.aparelhos.sas, 'sas(id, pubA, pubB, nA, nB) = 198016 (deu ' + r.sas + ')');
  conferir(r.sasTela === '198 016', 'sasTela = "198 016"');
  conferir(r.sasFalado === '1 9 8 0 1 6', 'sasFalado = "1 9 8 0 1 6" (leitor de tela lê dígito por dígito)');
  conferir(/^\d{6}$/.test(r.sasOutro) && r.sasOutro !== r.sas, 'trocar A com B dá outros números');

  console.log('\n— V3 B abre a resposta do vetor —');
  conferir(r.kB.ext === false && r.kB.alg === 'AES-GCM' && r.kB.len === 256 && r.kB.usos === 'decrypt,encrypt', 'chave(): AES-GCM 256 não extraível (ECDH + HKDF; pub importada com usos [])');
  conferir(r.abriuP && r.abriuF, 'a privada de teste de B abre resposta_pessoal e resposta_familia e dá a carga do vetor');
  conferir(r.mesmaChave, 'a chave de B fecha com o iv fixo exatamente o ct do vetor (mesma chave do MoneyTRIO)');
  conferir(r.idErrado, 'com outro id (AAD) a resposta não abre');
  conferir(r.uidErrado, 'com outro uid de quem pede (HKDF) a resposta não abre');
  conferir(r.cp.tipo === 'pessoal' && r.cp.u8 && r.cp.sk === 'pkcs8-de-mentira' && r.cp.chaves === 'sk,tipo', 'lerCarga pessoal → {tipo, sk: bytes} (o sk não é conferido como pkcs8 aqui, K3)');
  conferir(r.cf.tipo === 'familia' && r.cf.gid === V.aparelhos.carga_familia.gid && r.cf.kv === 1 && r.cf.fk === 'fk-teste' && r.cf.u8 && r.cf.n === 32 && r.cf.sete && r.cf.chaves === 'cf,fk,gid,kv,tipo',
    'lerCarga família → {tipo, gid, kv, fk, cf: 32 bytes}');

  console.log('\n— V4 ida e volta —');
  conferir(r.f.v === 2 && r.f.chaves === 'ct,iv,v' && r.f.iv === 12, 'fechar → {v:2, iv, ct}, iv de 12 bytes');
  conferir(r.f.ivNovo, 'cada fechar sorteia um iv novo');
  conferir(r.f.volta, 'o que A fecha, B abre (vetor)');
  conferir(r.par.chaves === 'kty,crv,x,y' && r.par.pubOk, 'novoPar: a pública só com kty, crv, x, y (sem d, ext, key_ops)');
  conferir(r.par.ext === false && r.par.alg === 'ECDH' && r.par.curva === 'P-256' && r.par.usos === 'deriveBits', 'novoPar: privada ECDH P-256 não extraível, só deriveBits');
  conferir(r.par.volta && r.par.nonces && r.par.C === 43 && r.par.sasIguais, 'par novo dos dois lados: carga de 1800 bytes vai e volta; nonces e C de 43');
  conferir(r.cargas, 'cargaPessoal e cargaFamilia montam exatamente a carga do vetor');

  console.log('\n— V5 PIN da conta —');
  conferir(r.v === V.pin.v_b64u && r.v === 'nJi1bgoV3-5H8c68sovrbc3G7rslbuSSKR64nqiCL8k', 'verificador("736251", sal) = v do vetor');
  conferir(r.vNumero === r.v, 'o PIN vira texto com String(pin)');
  conferir(r.vEspaco !== r.v && r.vEspaco.length === 43, 'o PIN não é normalizado (com espaço dá outro v)');
  conferir(r.sal.ok && r.sal.bytes === 16 && r.sal.novo, 'novoSalConta: 22 caracteres base64url, 16 bytes, um novo a cada vez');
  conferir(r.hkdfPin, 'hkdf(segredo, "sol-pin-v1") = chave do vetor (não extraível)');
  conferir(r.hkdfPk, 'hkdf(PRF, "sol-passkey-v2") = chave do vetor (não extraível)');
  conferir(r.b64u && r.b64uSegredo, 'b64u sem "=", "+" ou "/" e unb64u de volta (0 a 40 bytes); segredo do vetor = 32 bytes');

  console.log('\n— V6 recusas —');
  const pk = r.pubOk;
  conferir(pk.certo && !pk.comD && !pk.x42 && !pk.x44 && !pk.y42 && !pk.crv && !pk.kty && !pk.sinal && !pk.mais && !pk.nulo && !pk.texto,
    'pubOk: aceita a pública do vetor; recusa com d, x/y de 42 ou 44, crv ou kty errados, "=" ou "+", nulo e texto');
  const nk = r.nonceOk;
  conferir(nk.certo && !nk.n42 && !nk.n44 && !nk.igual && !nk.barra && !nk.nulo && !nk.numero, 'nonceOk: 43 caracteres base64url; recusa 42, 44, "=", "/", nulo e número');
  const lc = r.lerCarga;
  conferir(lc.v1 && lc.semV, 'lerCarga recusa v:1 e sem v');
  conferir(lc.tipo && lc.tipoBanco && lc.tipoBanco2, 'lerCarga recusa tipo estranho e tipo diferente do que o banco disse');
  conferir(lc.cf31 && lc.cf33 && lc.cfRuim, 'lerCarga recusa cf de 31 ou 33 bytes e cf que não decodifica');
  conferir(lc.skRuim && lc.skVazio && lc.skNumero, 'lerCarga recusa sk que não decodifica, vazio ou que não é texto');
  conferir(lc.kv && lc.kvTexto, 'lerCarga recusa kv que não é inteiro');
  conferir(lc.semGid && lc.gidOutro, 'lerCarga recusa família sem gid e gid diferente do esperado (K3)');
  conferir(lc.nulo && lc.texto, 'lerCarga recusa nulo e texto');
  conferir(lc.aceitaSemBanco && lc.aceitaFamiliaSemGid, 'lerCarga aceita sem o tipo do banco e sem o gid esperado (quando não vierem)');

  console.log('\n— V7 nome do aparelho —');
  const doMoney = nomeDoMoneyTrio();
  UAS.forEach((u, i) => {
    const [pt, en] = r.nomes[i];
    conferir(pt === u[1] && en === u[2], 'nomeAparelho: ' + u[1] + (u[2] !== u[1] ? ' / ' + u[2] : '') + ' (deu ' + pt + (en !== pt ? ' / ' + en : '') + ')');
    if (doMoney) conferir(pt === doMoney(u[0], 'pt') && en === doMoney(u[0], 'en'), '   igual ao nomeAparelho do nuvem.js do MoneyTRIO (' + doMoney(u[0], 'pt') + ')');
  });
  if (!doMoney) console.log('  (sem MONEYTRIO=<pasta>: conferido com a tabela tirada do nuvem.js 1.11.0)');
  conferir(r.nomeLongo, 'nomeAparelho: no máximo 60 caracteres');

  console.log('\n— V8 rpId, rótulos e pureza —');
  conferir(r.rp[0] === 'solverone.com.br' && r.rp[1] === 'solverone.com.br', 'rpId("app.solverone.com.br") e rpId("solverone.com.br") = "solverone.com.br"');
  conferir(r.rp[2] === 'localhost' && r.rp[3] === 'marceloneco.github.io' && r.rp[4] === 'solverone.com.br.exemplo.com' && r.rp[5] === 'xsolverone.com.br', 'rpId("localhost") = "localhost"; fora de *.solverone.com.br fica o próprio endereço');
  conferir(JSON.stringify(r.rotulos) === JSON.stringify(['OmniLifeONE', 'OmniLifeONE', 'MoneyTRIO', 'outro-app']), 'rotuloApp: omnilife e omnilife-one → OmniLifeONE; moneytrio → MoneyTRIO; outro fica igual');
  conferir(r.pura, 'SolProto não usa S, tela, conta, rede nem armazenamento');

  const banco = fora.filter((u) => /supabase/i.test(u));
  conferir(banco.length === 0, 'nenhuma chamada ao Supabase (e o resto de fora do site local foi cortado)' + (banco.length ? ': ' + banco.slice(0, 3).join(', ') : ''));
  conferir(lixo.erros.length === 0, 'nenhum erro de script' + (lixo.erros.length ? ': ' + lixo.erros.slice(0, 3).join(' | ') : ''));
  conferir(lixo.nativos.length === 0, 'nenhum alert/confirm/prompt nativo');

  await terminar(falhas, browser, 'contas puras do protocolo (SolProto) iguais aos vetores e ao MoneyTRIO');
})().catch((e) => { console.error(e); process.exit(1); });
