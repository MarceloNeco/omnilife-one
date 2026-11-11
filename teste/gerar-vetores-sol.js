/* Gera os vetores de teste do formato v2 (aparelhos, sol-ap-v2) e do PIN da conta (sol-pin-v1), com as MESMAS contas do
   nuvem.js 1.11.0 do MoneyTRIO (funções copiadas letra por letra: Aparelhos.canon/compromisso/sas/chave/fechar/abrirResp,
   Pin.v, Cifra.hkdf, b64u). Roda só com o node (sem navegador).
   Tudo FICTÍCIO e fixo: as duas chaves privadas ECDH (privA_jwk_SO_TESTE e privB_jwk_SO_TESTE) foram criadas uma vez, só para
   este teste, e não protegem nada de verdade. Elas são lidas do próprio teste/vetores-sol-v2.json (ou do arquivo pedido).
   Uso:  node teste/gerar-vetores-sol.js [vetores.json] > teste/vetores-sol-v2.json   (sai igual, byte a byte) */
'use strict';
const fs = require('fs'), path = require('path');
const subtle = globalThis.crypto.subtle;
const utf8 = (s) => new TextEncoder().encode(s);
const deUtf8 = (b) => new TextDecoder().decode(b);
function b64(buf) { return Buffer.from(buf).toString('base64'); }
function unb64(t) { return new Uint8Array(Buffer.from(String(t), 'base64')); }
function b64u(buf) { return b64(buf).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); }
function unb64u(t) { t = String(t).replace(/-/g, '+').replace(/_/g, '/'); while (t.length % 4) t += '='; return unb64(t); }
const AP_V = 'sol-ap-v2', ITER = 600000, PIN_SRV = 'sol-pin-v1', PK_INFO = 'sol-passkey-v2';
const A = {
  canon: function (pub) { return pub.x + '.' + pub.y; },
  sha: async function (txt) { return new Uint8Array(await subtle.digest('SHA-256', utf8(txt))); },
  compromisso: async function (pub, nB) { return b64u(await this.sha([AP_V, 'c', this.canon(pub), nB].join('|'))); },
  sas: async function (id, pubA, pubB, nA, nB) {
    var h = await this.sha([AP_V, id, this.canon(pubA), this.canon(pubB), nA, nB].join('|'));
    return String((((h[0] << 24) >>> 0) + (h[1] << 16) + (h[2] << 8) + h[3]) % 1000000).padStart(6, '0');
  },
  chave: async function (priv, pubOutro, id, uid, nA, nB) {
    var pk = await subtle.importKey('jwk', { kty: 'EC', crv: 'P-256', x: pubOutro.x, y: pubOutro.y, ext: true }, { name: 'ECDH', namedCurve: 'P-256' }, false, []);
    var bits = new Uint8Array(await subtle.deriveBits({ name: 'ECDH', public: pk }, priv, 256));
    var base = await subtle.importKey('raw', bits, 'HKDF', false, ['deriveKey']); bits.fill(0);
    return subtle.deriveKey({ name: 'HKDF', hash: 'SHA-256', salt: new Uint8Array(32), info: utf8([AP_V, id, uid, nA, nB].join('|')) }, base, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
  },
  fecharComIv: async function (key, id, obj, iv) {
    var ct = await subtle.encrypt({ name: 'AES-GCM', iv: iv, additionalData: utf8(id) }, key, utf8(JSON.stringify(obj)));
    return { v: 2, iv: b64(iv), ct: b64(ct) };
  },
  abrirResp: async function (key, id, o) {
    return JSON.parse(deUtf8(new Uint8Array(await subtle.decrypt({ name: 'AES-GCM', iv: unb64(o.iv), additionalData: utf8(id) }, key, unb64(o.ct)))));
  }
};
async function pinV(pin, sal) {
  var base = await subtle.importKey('raw', utf8(String(pin)), 'PBKDF2', false, ['deriveBits']);
  return b64u(new Uint8Array(await subtle.deriveBits({ name: 'PBKDF2', salt: unb64u(sal), iterations: ITER, hash: 'SHA-256' }, base, 256)));
}
/* o mesmo Cifra.hkdf, mas devolvendo os 32 bytes (só para o vetor; o app usa a chave não extraível) */
async function hkdfBits(bytes, info) {
  var k = await subtle.importKey('raw', bytes, 'HKDF', false, ['deriveBits']);
  return new Uint8Array(await subtle.deriveBits({ name: 'HKDF', hash: 'SHA-256', salt: new Uint8Array(32), info: utf8(info) }, k, 256));
}
async function ecdhPar(jwk) {
  const priv = await subtle.importKey('jwk', jwk, { name: 'ECDH', namedCurve: 'P-256' }, false, ['deriveBits']);
  return { priv, pub: { kty: 'EC', crv: 'P-256', x: jwk.x, y: jwk.y } };
}
(async () => {
  /* as chaves fictícias vêm do JSON dos vetores (ou de um arquivo {a, b} de chaves de teste) */
  const j = JSON.parse(fs.readFileSync(process.argv[2] || path.join(__dirname, 'vetores-sol-v2.json'), 'utf8'));
  const chaves = j.aparelhos ? { a: j.aparelhos.privA_jwk_SO_TESTE, b: j.aparelhos.privB_jwk_SO_TESTE } : j;
  const ID = '0f0e0d0c-0b0a-4908-8706-050403020100', UID = '11111111-1111-1111-1111-111111111111';
  const nA = b64u(new Uint8Array(32).map((_, i) => i + 1)), nB = b64u(new Uint8Array(32).map((_, i) => 0xff - i));
  const a = await ecdhPar(chaves.a), b = await ecdhPar(chaves.b);
  const C = await A.compromisso(b.pub, nB);
  const sas = await A.sas(ID, a.pub, b.pub, nA, nB);
  const kA = await A.chave(a.priv, b.pub, ID, UID, nA, nB), kB = await A.chave(b.priv, a.pub, ID, UID, nA, nB);
  const iv = new Uint8Array(12).map((_, i) => 0xa0 + i);
  const pessoal = { v: 2, tipo: 'pessoal', sk: b64(utf8('pkcs8-de-mentira')) };
  const familia = { v: 2, tipo: 'familia', gid: '22222222-2222-2222-2222-222222222222', kv: 1, fk: 'fk-teste', cf: b64(new Uint8Array(32).fill(7)) };
  const respP = await A.fecharComIv(kA, ID, pessoal, iv), respF = await A.fecharComIv(kA, ID, familia, iv);
  const volta = await A.abrirResp(kB, ID, respP);
  /* bits da chave (HKDF sobre o ECDH) para quem quiser conferir sem WebCrypto */
  const pkB = await subtle.importKey('jwk', { kty: 'EC', crv: 'P-256', x: b.pub.x, y: b.pub.y, ext: true }, { name: 'ECDH', namedCurve: 'P-256' }, false, []);
  const ecdh = new Uint8Array(await subtle.deriveBits({ name: 'ECDH', public: pkB }, a.priv, 256));
  const kRaw = await hkdfBits(ecdh, [AP_V, ID, UID, nA, nB].join('|'));
  const salConta = b64u(new Uint8Array(16).map((_, i) => 0x10 + i));
  const v = await pinV('736251', salConta);
  const segredo = b64u(new Uint8Array(32).map((_, i) => 0x40 + i));
  const kSrv = await hkdfBits(unb64u(segredo), PIN_SRV);
  const prf = new Uint8Array(32).map((_, i) => 0x80 + i);
  const kPk = await hkdfBits(prf, PK_INFO);
  const hv = Buffer.from(await subtle.digest('SHA-256', utf8(v))).toString('hex');
  const out = {
    nota: 'Vetores fixos e fictícios do formato v2 (sol-ap-v2) e do PIN da conta (sol-pin-v1), calculados com as mesmas contas do nuvem.js 1.11.0 do MoneyTRIO. As chaves privadas privA_jwk_SO_TESTE e privB_jwk_SO_TESTE são FICTÍCIAS, criadas só para este teste: não protegem nada de verdade.',
    aparelhos: { id: ID, uid_de_quem_pede: UID, pubA: a.pub, privA_jwk_SO_TESTE: chaves.a, pubB: b.pub, privB_jwk_SO_TESTE: chaves.b, nA, nB,
      texto_compromisso: [AP_V, 'c', A.canon(b.pub), nB].join('|'), compromisso_C: C,
      texto_sas: [AP_V, ID, A.canon(a.pub), A.canon(b.pub), nA, nB].join('|'), sas,
      ecdh_hex: Buffer.from(ecdh).toString('hex'), hkdf_info: [AP_V, ID, UID, nA, nB].join('|'), chave_aes_hex: Buffer.from(kRaw).toString('hex'),
      iv_fixo_b64: b64(iv), aad: ID, carga_pessoal: pessoal, resposta_pessoal: respP, carga_familia: familia, resposta_familia: respF,
      B_abriu_igual: JSON.stringify(volta) === JSON.stringify(pessoal) },
    pin: { pin: '736251', sal_conta_b64u: salConta, iteracoes: ITER, v_b64u: v, hv_sha256_hex_do_banco: hv,
      segredo_b64u: segredo, chave_srv_hkdf_sol_pin_v1_hex: Buffer.from(kSrv).toString('hex') },
    passkey: { prf_first_hex: Buffer.from(prf).toString('hex'), chave_hkdf_sol_passkey_v2_hex: Buffer.from(kPk).toString('hex') }
  };
  console.log(JSON.stringify(out, null, 1));
})();
