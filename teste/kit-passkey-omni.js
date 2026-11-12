/* Kit de emergência e "digital em todos os aparelhos" (2.26.0, etapa 9), no "Supabase de mentira" (teste/mock-sol.js): nada
   vai para a internet nem para o Supabase de verdade. Confere, em ⚙ → Segurança e aparelhos → Avançado:
     K1  o padrão (D2): a conta que já tem a linha em omni_chave_privada = kit LIGADO ("Desligar" e "Fazer um código novo");
         a conta nova (Cris) = DESLIGADO (a criação não grava a linha; só "Ligar")
     K2  desligar com o banco de hoje (M.semDelete: o GRANT não deixa apagar): confirma ("…aqui e no MoneyTRIO"); sem outro
         aparelho com a chave pessoal nem a digital em todos os aparelhos, confirma DE NOVO (K25: "único jeito de voltar") e
         "Cancelar" não apaga; confirmando: "Ainda não dá para desligar: falta um ajuste no servidor." e NADA muda
     K2b o banco responde que apagou, mas a linha continua: o mesmo aviso, nada muda (o app confere antes de dizer "desligado")
     K3  ligar / "Fazer um código novo": pede o PIN de agora (errado não faz nada); com papel antigo, confirma que ele deixa de
         valer aqui e no MoneyTRIO (K25; "Cancelar" não muda nada); mostra o código (Cofre.mostrarCodigo) e grava pelo
         Cofre.guardarKit NO FORMATO DE HOJE ({v:1, kid, iv, ct}, sal de 16 B, 600 mil): o código novo abre a MESMA chave pessoal
         pela conta do MoneyTRIO (PBKDF2 do Restore.normCode, a mesma do nuvem.js), o antigo não; "kit.ligado" no histórico
     K4  o código novo abre no "Tenho o código de recuperação antigo" de um aparelho novo ("kit", a mesma chave pessoal); o papel
         antigo não ("Esse código não confere")
     A13 a digital em todos os aparelhos (autenticador virtual com PRF pela CDP; localhost): "Ligar" pede o PIN de agora (errado:
         nenhuma passkey é criada); ligada: sol_passkeys com cred_id, sal de 43 e a chave pessoal fechada; "já ligada" não cria
         outra; um aparelho NOVO (outro endereço = outro IndexedDB, com a MESMA digital: é o que a conta do Google/Apple faz)
         vê "👆 Usar a digital" na "Primeira vez" e entra por ela: "passkey" na lista, L.sk = o MESMO pkcs8 e o MESMO segredo do
         PIN único; desistir do PIN tira a linha nova (K19); a digital que não abre não registra nada; sem leitor, sem o botão
     K23 num endereço que não é solverone.com.br nem localhost (outro.localhost): nem "👆 Usar a digital" nem o item em Avançado,
         e chamar direto é recusado
     P   desligar a digital em todos os aparelhos: confirma ("vale também no MoneyTRIO"), sai de sol_passkeys e o botão some
     K5  desligar o kit com o banco depois do GRANT (sem M.semDelete): com outro aparelho com a chave pessoal, uma confirmação só;
         a linha sai, a página diz "Desligado", "kit.desligado" no histórico e o link "Tenho o código de recuperação antigo" some
     K6  ligar de novo (sem papel antigo): o PIN de agora, o código e a linha de volta no formato de hoje; o link volta
     o arquivo supabase/2026-11-11-omni-chave-privada-delete.sql: só o GRANT (o dono aplica) e um comentário em português
     sem erro de script, sem diálogo nativo, nada fora do banco de mentira, nenhum PIN nem código no console, no armazenamento
     ou no histórico.
   Pessoas, senhas, PINs, códigos e chaves de mentira. Uso: node teste/rodar.js   ·   sozinho: BASE=http://localhost:8099 node teste/kit-passkey-omni.js */
const crypto = require('crypto'), fs = require('fs'), path = require('path');
const subtle = crypto.webcrypto.subtle;
const { BASE, criarConferir, iniciar, terminar } = require('./_base');
const { SB, M, db, prepararChaves, PESSOAS, ANA, CRIS, normCode } = require('./mock-sol');
const { servir, aparelho, entrarOmni, senhasDaCasa, cadeado225 } = require('./_nuvem');

const PIN_225 = '736251', PIN_A = '590317', PIN_C = '615048', PINS = [PIN_225, PIN_A, PIN_C];
const espere = (ms) => new Promise((r) => setTimeout(r, ms));
async function ate(fn, ms) { const fim = Date.now() + (ms || 8000); while (Date.now() < fim) { if (fn()) return true; await espere(100); } return !!fn(); }
const naTela = (p, sel) => p.evaluate((s) => !!document.querySelector(s), sel);
const toasts = (p) => p.evaluate(() => document.querySelector('#toasts').textContent);
const limparToasts = (p) => p.evaluate(() => { document.querySelector('#toasts').innerHTML = ''; });
const toast = (p, re, ms) => p.waitForFunction((re) => new RegExp(re).test(document.querySelector('#toasts').textContent), re.source, { timeout: ms || 15000 }).then(() => true, () => false);
const janela = (p, re, ms) => p.waitForFunction((re) => [...document.querySelectorAll('.modal')].some((m) => new RegExp(re).test(m.innerText)), re.source, { timeout: ms || 10000 }).then(() => true, () => false);
const textoJanelas = (p) => p.evaluate(() => [...document.querySelectorAll('.modal')].map((m) => m.innerText).join(' | '));
const semJanela = (p, ms) => p.waitForSelector('.modal', { state: 'detached', timeout: ms || 8000 }).then(() => true, () => false);
const erroEm = (p, sel, re, ms) => p.waitForFunction((a) => new RegExp(a.re).test((document.querySelector(a.sel) || {}).textContent || ''), { sel, re: re.source }, { timeout: ms || 15000 }).then(() => true, () => false);
const quieto = (p) => p.evaluate(() => { AOne.save({ hello: 1, tour: 1, tips: Object.assign({}, AOne.cfg().tips, { home: 1, settings: 1, house: 1, family: 1 }) }); if (AOne.view) AOne.close(); lsSet(GuiaCofre.K, Date.now()); });
/* num aparelho com leitor, o app oferece abrir com a digital logo depois de entrar: "Agora não" */
async function semOferta(p) { if (await p.waitForSelector('.modal [data-no]', { timeout: 5000 }).then(() => true, () => false)) await p.click('.modal [data-no]'); }
const linhasDe = (uid) => db.sol_aparelhos.filter((a) => a.user_id === uid && !a.removido_em);
const kitDe = (uid) => { const r = db.omni_chave_privada.find((x) => x.user_id === uid); return r ? JSON.parse(JSON.stringify(r)) : null; };
const pksDe = (uid) => db.sol_passkeys.filter((k) => k.user_id === uid && !k.removido_em);
const deletes = () => M.log.filter((x) => x.metodo === 'DELETE' && /omni_chave_privada/.test(x.caminho)).length;
const hex = (b) => Buffer.from(b).toString('hex');
/* o kit como o MoneyTRIO lê (nuvem.js: Cifra.kdf(Cifra.normCode(codigo), bk.sal, bk.iteracoes) → AES-GCM do JSON): o resumo da chave pessoal, ou null */
async function abreKit(row, codigo) {
  try {
    const o = JSON.parse(row.privada_cifrado), base = await subtle.importKey('raw', Buffer.from(normCode(codigo), 'utf8'), 'PBKDF2', false, ['deriveKey']);
    const k = await subtle.deriveKey({ name: 'PBKDF2', salt: Buffer.from(row.sal, 'base64'), iterations: row.iteracoes, hash: 'SHA-256' }, base, { name: 'AES-GCM', length: 256 }, false, ['decrypt']);
    return hex(crypto.createHash('sha256').update(Buffer.from(await subtle.decrypt({ name: 'AES-GCM', iv: Buffer.from(o.iv, 'base64') }, k, Buffer.from(o.ct, 'base64')))).digest());
  } catch (e) { return null; }
}
/* o que este aparelho guarda: como entrou, o lugar na lista, o resumo da chave pessoal e o segredo do PIN único (com a casa aberta) */
const cadeado = (p) => p.evaluate(async () => {
  const L = await Cofre.local(); if (!L) return null;
  const h = async (b) => Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', b))).map((x) => x.toString(16).padStart(2, '0')).join('');
  let sk = null, seg = null;
  if (Cofre.dukRaw && L.sk) { const pk = await Cofre.decifrar(await Cofre.aes(Cofre.dukRaw), L.sk); sk = await h(pk); pk.fill(0); }
  const s = await PinUnico.segredo(); if (s) seg = Array.from(s).map((x) => x.toString(16).padStart(2, '0')).join('');
  return { como: L.como || null, ap: L.ap || null, sk, seg, temSk: !!L.sk, srv: !!L.srv, aberto: Cofre.aberto() };
});
/* ⚙ → Segurança e aparelhos, com o Avançado aberto e o que vem da internet já no lugar */
async function avancado(p) {
  await p.evaluate(() => { closeModals(); Jornada.limpar(); TelaConta._pag = null; TelaConta._avAberto = true; go('settings', 'conta'); });
  await p.waitForFunction(() => S.route && S.route.sub === 'conta' && document.querySelector('#segAvancado[open] #segAvC .segav') && !/Carregando|Loading/.test(document.querySelector('.segap').innerText), null, { timeout: 20000 });
  return p.evaluate(() => ({ kit: (document.querySelector('#segKit') || {}).innerText || '', pk: (document.querySelector('#segPasskey') || {}).innerText || '', temPk: !!document.querySelector('#segPasskey'),
    acts: [...document.querySelectorAll('#segAvC [data-act]')].map((b) => b.dataset.act) }));
}
/* "Primeira vez" (sem cadeado aqui) ou "Abrir sem o PIN" (com cadeado): os botões e o link */
async function primeira(p, esqueci) {
  await p.evaluate((e) => { closeModals(); TelaConta.primeiraVez(e ? { esqueci: true } : {}); }, !!esqueci);
  await janela(p, esqueci ? /Abrir sem o PIN/ : /Primeira vez neste/);
  return p.evaluate(() => { const m = [...document.querySelectorAll('.modal')].pop(); return { outro: !!m.querySelector('#apOutro'), pk: !!m.querySelector('#apPasskey'), cod: !!m.querySelector('#apCodigo'), texto: m.innerText }; });
}
async function provar(p, pin) { await p.waitForSelector('.modal #ppin', { timeout: 8000 }); await p.fill('.modal #ppin', pin); await p.click('.modal:has(#ppin) [data-ok]'); }

(async () => {
  const browser = await iniciar();
  const { falhas, conferir } = criarConferir();
  await prepararChaves();
  const lixos = [];
  /* um segundo endereço com o mesmo app (outro IndexedDB e outra sessão: um aparelho novo) e um endereço "de fora" (K23) */
  const S2 = await servir(path.join(__dirname, '..')), BASE2 = S2.base, OUTRO = BASE2.replace('//localhost', '//outro.localhost');

  /* ---------------- o arquivo SQL do D2 ---------------- */
  const sql = fs.readFileSync(path.join(__dirname, '..', 'supabase', '2026-11-11-omni-chave-privada-delete.sql'), 'utf8');
  const comandos = sql.split('\n').filter((l) => l.trim() && !/^\s*--/.test(l)).map((l) => l.trim());
  conferir(comandos.length === 1 && comandos[0] === 'grant delete on public.omni_chave_privada to authenticated;' && /omni_chave_privada_dono/.test(sql) && /DONO/.test(sql) && /O QUE FAZ/.test(sql),
    'D2. supabase/2026-11-11-omni-chave-privada-delete.sql: só "grant delete on public.omni_chave_privada to authenticated;" + o comentário (o que faz, a política omni_chave_privada_dono, o dono aplica)');

  /* ================= A: o computador da Ana (com leitor), as Senhas da casa e o PIN da conta ================= */
  console.log('A. O computador da Ana: o kit de emergência');
  const A = await aparelho(browser, { nome: 'Ana-computador', vp: 'computador', base: BASE, digital: true }), a = A.p; lixos.push(A.lixo);
  await A.ctx.route((u) => u.origin === BASE2 || u.origin === OUTRO, (r) => r.continue());   /* os outros dois endereços do app (o resto continua cortado) */
  await entrarOmni(a, ANA); await semOferta(a); await quieto(a);
  await a.evaluate(() => { Sol.ligadoAp = false; Sol.ligadoPin = false; });
  await senhasDaCasa(a); await cadeado225(a, ANA, PIN_225);
  await a.evaluate(() => { Sol.ligadoAp = null; Sol.ligadoPin = null; });
  await a.evaluate(() => Aparelhos.registrar());
  const criou = await a.evaluate((pin) => Pin.criar(pin), PIN_A);
  const kit0 = kitDe(ANA), H0 = await abreKit(kit0, PESSOAS[ANA].codigo);
  conferir(criou.ok && linhasDe(ANA).length === 1 && linhasDe(ANA)[0].como === 'primeiro' && !!H0, 'preparo: Senhas da casa abertas, este computador na lista ("primeiro"), o PIN da conta criado e o kit da Ana (o papel de antes) abre a chave pessoal');
  const LA = await cadeado(a);
  conferir(LA.sk === H0 && !!LA.seg, 'preparo: a chave pessoal deste computador é a mesma do papel');

  /* K1: o padrão — quem já tem a linha: ligado */
  let av = await avancado(a);
  conferir(/Ligado: há uma cópia da sua chave/.test(av.kit) && av.acts.includes('conta.kit.desligar') && av.acts.includes('conta.kit.ligar') && /Fazer um código novo/.test(av.kit) && /deixa de valer aqui e no MoneyTRIO/.test(av.kit),
    'K1. a conta que já tem a linha (o código do papel): kit LIGADO, com "Fazer um código novo" e "Desligar" ("o código deixa de valer aqui e no MoneyTRIO")');

  /* K2: desligar com o GRANT de hoje (sem DELETE) */
  M.semDelete = true;
  const h0 = db.omni_historico.length, d0 = deletes();
  await a.click('#segKit [data-act="conta.kit.desligar"]');
  conferir(await janela(a, /Desligar o kit de emergência\?/) && /deixa de valer, aqui e no MoneyTRIO/.test(await textoJanelas(a)), 'K2. "Desligar" confirma: "Apaga a cópia… o código de recuperação deixa de valer, aqui e no MoneyTRIO"');
  await a.click('.modal [data-yes]');
  conferir(await janela(a, /único jeito de voltar/), 'K25. sem outro aparelho com a chave pessoal e sem a digital em todos os aparelhos: confirma DE NOVO ("Este é o único jeito de voltar…")');
  await a.click('.modal [data-no]'); await semJanela(a);
  conferir(deletes() === d0 && JSON.stringify(kitDe(ANA)) === JSON.stringify(kit0), 'K25. "Cancelar" na segunda confirmação: nada é pedido ao banco, a linha continua');
  await a.click('#segKit [data-act="conta.kit.desligar"]'); await janela(a, /Desligar o kit/); await a.click('.modal [data-yes]');
  await janela(a, /único jeito de voltar/); await a.click('.modal [data-yes]');
  conferir(await janela(a, /Ainda não dá para desligar: falta um ajuste no servidor\./), 'D2. o banco recusa (403 42501): "Ainda não dá para desligar: falta um ajuste no servidor."');
  conferir(deletes() === d0 + 1 && JSON.stringify(kitDe(ANA)) === JSON.stringify(kit0) && !db.omni_historico.slice(h0).some((x) => x.acao === 'kit.desligado'), 'D2. NADA muda: a linha igual, sem "kit.desligado" no histórico');
  await a.click('.modal #kitEntendi'); await semJanela(a);
  av = await avancado(a);
  conferir(/Ligado: há uma cópia/.test(av.kit) && av.acts.includes('conta.kit.desligar'), 'D2. a página continua dizendo "Ligado"');
  /* K2b: o banco diz que apagou, mas a linha continua (fora do alcance da pessoa): o app confere */
  M.semDelete = false;
  await A.ctx.route(SB + '/rest/v1/omni_chave_privada*', (r) => (r.request().method() === 'DELETE' ? r.fulfill({ status: 204, body: '' }) : r.fallback()));
  await a.click('#segKit [data-act="conta.kit.desligar"]'); await janela(a, /Desligar o kit/); await a.click('.modal [data-yes]');
  await janela(a, /único jeito de voltar/); await a.click('.modal [data-yes]');
  conferir(await janela(a, /falta um ajuste no servidor/) && JSON.stringify(kitDe(ANA)) === JSON.stringify(kit0) && !db.omni_historico.slice(h0).some((x) => x.acao === 'kit.desligado'),
    'K2b. o banco diz que apagou mas a linha continua: o mesmo aviso, nada muda (sem "desligado" de mentira)');
  await a.click('.modal #kitEntendi'); await semJanela(a);
  await A.ctx.unroute(SB + '/rest/v1/omni_chave_privada*');

  /* K3: "Fazer um código novo" (o "Ligar" de quem já tem): o PIN de agora, a confirmação do papel antigo, o código, o formato */
  await avancado(a);
  await a.click('#segKit [data-act="conta.kit.ligar"]');
  conferir(await janela(a, /Para fazer um código novo, primeiro digite o PIN de agora/), 'K3. "Fazer um código novo" pede o PIN de agora (reforço 2.21.2)');
  await provar(a, '000000');
  conferir(await erroEm(a, '#perr', /PIN errado/) && !(await janela(a, /papel antigo deixa de valer|Anote este código/, 800)), 'K3. PIN errado: não segue');
  await a.click('.modal:has(#ppin) .mf [data-x]'); await semJanela(a);
  await a.click('#segKit [data-act="conta.kit.ligar"]'); await provar(a, PIN_A);
  conferir(await janela(a, /O papel antigo deixa de valer, aqui e no MoneyTRIO/), 'K25. com papel antigo: "Fazer um código novo? O papel antigo deixa de valer, aqui e no MoneyTRIO…"');
  await a.click('.modal [data-no]'); await semJanela(a);
  conferir(JSON.stringify(kitDe(ANA)) === JSON.stringify(kit0) && !(await naTela(a, '.modal .vcode')), 'K25. "Cancelar": nenhum código novo, a linha igual');
  await a.click('#segKit [data-act="conta.kit.ligar"]'); await provar(a, PIN_A);
  await janela(a, /O papel antigo deixa de valer/); await a.click('.modal [data-yes]');
  conferir(await janela(a, /Anote este código num papel/), 'K3. mostra o código (Cofre.mostrarCodigo: "Anote este código num papel")');
  const CODIGO = await a.evaluate(() => document.querySelector('.modal .vcode').textContent.trim());
  await a.check('.modal #cfok'); await a.click('.modal:has(#cfok) [data-ok]');
  await toast(a, /Código novo salvo/);
  const kit1 = kitDe(ANA), o1 = kit1 && JSON.parse(kit1.privada_cifrado), pubA = db.sol_chave_publica.find((k) => k.user_id === ANA).chave_publica;
  conferir(/^[A-Z2-9]{5}(-[A-Z2-9]{5}){3}$/.test(CODIGO) && !!kit1 && JSON.stringify(Object.keys(o1).sort()) === '["ct","iv","kid","v"]' && o1.v === 1 && o1.kid === pubA.kid && Buffer.from(o1.iv, 'base64').length === 12 &&
    Buffer.from(kit1.sal, 'base64').length === 16 && kit1.iteracoes === 600000 && kit1.sal !== kit0.sal,
    'K3. a linha no formato de hoje: privada_cifrado = {v:1, kid (o da pública), iv, ct}, sal novo de 16 B, 600 mil voltas');
  conferir(await abreKit(kit1, CODIGO) === H0 && await abreKit(kit1, CODIGO.toLowerCase().replace(/-/g, '')) === H0 && await abreKit(kit1, PESSOAS[ANA].codigo) === null,
    'K3. o código novo abre a MESMA chave pessoal pela conta do MoneyTRIO (com ou sem tracinhos); o papel antigo não abre mais');
  await ate(() => db.omni_historico.slice(h0).some((x) => x.acao === 'kit.ligado'));
  const h3 = db.omni_historico.slice(h0);
  conferir(h3.some((x) => x.acao === 'kit.ligado') && !h3.some((x) => JSON.stringify(x).includes(CODIGO.slice(0, 11))), 'K3. "kit.ligado" no histórico da família (sem o código)');
  av = await avancado(a);
  conferir(/Ligado/.test(av.kit) && av.acts.includes('conta.kit.desligar'), 'K3. a página: kit ligado');

  /* K4: o código novo no "Tenho o código de recuperação antigo" de um aparelho novo */
  console.log('K4. O celular novo da Ana entra com o código novo');
  const C = await aparelho(browser, { nome: 'Ana-celular', vp: 'celular', base: BASE }), c = C.p; lixos.push(C.lixo);
  await entrarOmni(c, ANA); await quieto(c);
  let pv = await primeira(c);
  conferir(pv.outro && pv.cod && !pv.pk, 'K4. "Primeira vez" no celular (sem leitor): o link "Tenho o código de recuperação antigo" (há o kit) e SEM "👆 Usar a digital"');
  await c.click('.modal #apCodigo'); await c.waitForSelector('.modal #apCod', { timeout: 8000 });
  await c.fill('.modal #apCod', PESSOAS[ANA].codigo); await c.click('.modal #apCodOk');
  conferir(await erroEm(c, '.modal #pcErr', /Esse código não confere/), 'K4. o papel antigo: "Esse código não confere"');
  const nC0 = linhasDe(ANA).length;
  await c.fill('.modal #apCod', CODIGO); await c.click('.modal #apCodOk');
  conferir(await janela(c, /Digite o PIN da sua conta/, 30000), 'K4. o código novo abre: "Digite o PIN da sua conta"');
  await c.fill('.modal #pcPin', PIN_A); await c.click('.modal #pcOk');
  await c.waitForFunction(() => Cofre.aberto(), null, { timeout: 60000 }).catch(() => {});
  const LC = await cadeado(c);
  conferir(LC && LC.aberto && LC.como === 'kit' && LC.sk === H0 && LC.seg === LA.seg && linhasDe(ANA).length === nC0 + 1 && linhasDe(ANA).some((x) => x.id === LC.ap && x.como === 'kit'),
    'K4. o celular entrou como "kit", com a MESMA chave pessoal (e o mesmo segredo do PIN único)');

  /* ================= A13: a digital em todos os aparelhos ================= */
  console.log('A13. A digital em todos os aparelhos');
  await a.evaluate(() => { window.__cria = 0; const o = navigator.credentials.create.bind(navigator.credentials); navigator.credentials.create = (...x) => { window.__cria++; return o(...x); }; });
  av = await avancado(a);
  conferir(av.temPk && /Desligada\./.test(av.pk) && av.acts.includes('conta.pk.ligar') && !av.acts.includes('conta.pk.desligar'), 'A13. em Avançado (leitor, a chave pessoal aqui, localhost): "👆 Digital em todos os aparelhos (passkey)" — Desligada, com "Ligar"');
  await a.click('#segPasskey [data-act="conta.pk.ligar"]');
  conferir(await janela(a, /Para ligar a digital em todos os aparelhos, digite o seu PIN de agora/), 'A13. "Ligar" pede o PIN de agora');
  await provar(a, '000000'); await erroEm(a, '#perr', /PIN errado/);
  await a.click('.modal:has(#ppin) .mf [data-x]'); await semJanela(a);
  conferir(await a.evaluate(() => window.__cria) === 0 && !pksDe(ANA).length, 'A13. PIN errado e Cancelar: nenhuma passkey criada (nem no aparelho, nem no banco)');
  await limparToasts(a);
  await a.click('#segPasskey [data-act="conta.pk.ligar"]'); await provar(a, PIN_A);
  conferir(await toast(a, /a digital abre as Senhas da casa sem precisar de outro aparelho/, 30000), 'A13. com o PIN de agora: "Pronto: num aparelho novo, a digital abre…"');
  const pk1 = pksDe(ANA), f1 = pk1[0] && pk1[0].fechada;
  conferir(pk1.length === 1 && /^[A-Za-z0-9_-]{16,700}$/.test(pk1[0].cred_id) && /^[A-Za-z0-9_-]{43}$/.test(pk1[0].sal) && Buffer.from(pk1[0].sal, 'base64url').length === 32 &&
    f1 && JSON.stringify(Object.keys(f1).sort()) === '["ct","iv"]' && /^[A-Za-z0-9+/]+=*$/.test(f1.iv) && Buffer.from(f1.iv, 'base64').length === 12 && /^[A-Za-z0-9+/]+=*$/.test(f1.ct) && Buffer.from(f1.ct, 'base64').length > 1000,
    'A13. sol_passkeys: cred_id (base64url), sal de 43 (32 B) e a chave pessoal fechada {iv, ct} (base64 padrão)');
  /* sem o "já ligada", pediria o PIN de novo: a janela não fica esperando o teste */
  const ja = await a.evaluate(() => Promise.race([Aparelhos.criarPasskey(), new Promise((r) => setTimeout(() => r({ erro: 'perguntou' }), 4000))]));
  await a.evaluate(() => closeModals());
  av = await avancado(a);
  conferir(ja.erro === 'ja' && pksDe(ANA).length === 1 && /Ligada\./.test(av.pk) && av.acts.includes('conta.pk.desligar') && !av.acts.includes('conta.pk.ligar') && /vale também no MoneyTRIO/.test(av.pk),
    'A13. "já ligada": não cria outra; a página diz "Ligada" com "Desligar" ("vale também no MoneyTRIO")');
  pv = await primeira(c, true);
  conferir(!pv.pk && pv.outro, 'A13. no celular sem leitor ("Abrir sem o PIN"): sem "👆 Usar a digital", mesmo com a passkey na conta');
  await c.evaluate(() => closeModals());

  /* B: um aparelho novo com a MESMA digital (o mesmo autenticador; outro endereço = outro IndexedDB e outra sessão) */
  console.log('A13. O aparelho novo entra pela digital');
  a.base = BASE2;
  await entrarOmni(a, ANA); await semOferta(a); await quieto(a);
  conferir(!(await a.evaluate(() => Cofre.local())), 'A13. o aparelho novo não tem cadeado');
  await senhasDaCasa(a);
  pv = await primeira(a);
  conferir(pv.pk && pv.outro && /Funciona se você ligou a digital em todos os aparelhos/.test(pv.texto) && !/passkey/i.test(pv.texto), 'A13. "Primeira vez" com leitor e passkey na conta: "👆 Usar a digital" ("Funciona se você ligou a digital em todos os aparelhos", sem a palavra passkey)');
  /* a digital que não abre (o fechado estragado no banco): nada é registrado */
  const fOk = JSON.stringify(f1), nB0 = linhasDe(ANA).length;
  pksDe(ANA)[0].fechada = Object.assign({}, f1, { ct: Buffer.from(Buffer.from(f1.ct, 'base64').map((x, i) => (i === 5 ? x ^ 1 : x))).toString('base64') });
  await a.click('.modal #apPasskey');
  conferir(await erroEm(a, '.modal #pcErr', /A digital não abriu neste aparelho/) && linhasDe(ANA).length === nB0 && !(await a.evaluate(() => Cofre.local())), 'A13. a digital que não abre a chave: "A digital não abriu neste aparelho…", nada registrado, nenhum cadeado');
  pksDe(ANA)[0].fechada = JSON.parse(fOk);
  /* K19: desistir do PIN tira a linha "passkey" */
  await a.click('.modal #apPasskey');
  conferir(await janela(a, /Digite o PIN da sua conta/, 30000) && linhasDe(ANA).some((x) => x.como === 'passkey'), 'A13. a digital abriu: "Digite o PIN da sua conta" e o aparelho na lista como "passkey"');
  await a.click('.modal:has(#pcPin) [data-x]'); await semJanela(a);
  conferir(await ate(() => linhasDe(ANA).length === nB0 && !linhasDe(ANA).some((x) => x.como === 'passkey')) && !(await a.evaluate(() => Cofre.local())),
    'K19. desistiu do PIN: a linha "passkey" sai da lista e nenhum cadeado fica');
  await primeira(a);
  await a.click('.modal #apPasskey'); await janela(a, /Digite o PIN da sua conta/, 30000);
  await a.fill('.modal #pcPin', '000000'); await a.click('.modal #pcOk');
  conferir(await erroEm(a, '.modal #pcErr', /PIN errado/), 'A13. o PIN da conta errado avisa');
  await a.fill('.modal #pcPin', PIN_A); await a.click('.modal #pcOk');
  await a.waitForFunction(() => Cofre.aberto(), null, { timeout: 60000 }).catch(() => {});
  if (await a.waitForSelector('.modal #apDigNao', { timeout: 4000 }).then(() => true, () => false)) await a.click('.modal #apDigNao');
  const LB = await cadeado(a);
  conferir(LB && LB.aberto && LB.como === 'passkey' && LB.srv && linhasDe(ANA).some((x) => x.id === LB.ap && x.como === 'passkey'), 'A13. entrou: as Senhas da casa abertas, "passkey" no cadeado e na lista, com o PIN da conta');
  conferir(LB.sk === H0 && LB.seg === LA.seg, 'A13. L.sk = o MESMO pkcs8 do computador e o MESMO segredo do PIN único');
  conferir(await a.evaluate(() => TelaConta.rotuloComo('passkey')) === 'entrou pela digital', 'A13. "Este aparelho: entrou pela digital" (Seus dados)');

  /* K23: num endereço que não é solverone.com.br nem localhost (como o endereço antigo do app) */
  console.log('K23. Fora de solverone.com.br');
  a.base = OUTRO;
  await entrarOmni(a, ANA); await semOferta(a); await quieto(a);
  await senhasDaCasa(a);
  const st23 = await a.evaluate(async () => { const s = await Jornada.ler(true); return { temPasskey: s.temPasskey, aqui: Aparelhos.pkAqui(), leitor: await Bio.available() }; });
  pv = await primeira(a);
  const r23 = await a.evaluate(async () => ({ cria: (await Aparelhos.criarPasskey()).erro, entra: (await Aparelhos.entrarPasskey()).erro, av: TelaConta.avHtml({ rede: true, temKit: true, temPasskey: true, ligadoPin: true }, { sk: {} }, true) }));
  conferir(st23.temPasskey && st23.leitor && !st23.aqui && pv.outro && !pv.pk, 'K23. com leitor e passkey na conta, mas em outro endereço: SEM "👆 Usar a digital" na "Primeira vez"');
  conferir(r23.cria === 'aqui' && r23.entra === 'aqui' && !/segPasskey/.test(r23.av) && /segKit/.test(r23.av), 'K23. chamar direto é recusado ("aqui") e o Avançado não tem o item da digital em todos os aparelhos');
  await a.evaluate(() => closeModals());

  /* P: desligar a digital em todos os aparelhos (no computador) */
  console.log('P. Desligar a digital em todos os aparelhos');
  a.base = BASE;
  await entrarOmni(a, ANA); await semOferta(a); await quieto(a);
  await a.evaluate((pin) => Cofre.destrancarPin(pin), PIN_A);
  pv = await primeira(a, true);
  conferir(pv.pk, 'P. com a passkey na conta e leitor, "Abrir sem o PIN" também tem "👆 Usar a digital"');
  av = await avancado(a);
  await a.click('#segPasskey [data-act="conta.pk.desligar"]');
  conferir(await janela(a, /Desligar a digital em todos os aparelhos\? Vale também no MoneyTRIO/), 'P. "Desligar" confirma: "…Vale também no MoneyTRIO…"');
  await a.click('.modal [data-no]'); await semJanela(a);
  conferir(pksDe(ANA).length === 1, 'P. "Cancelar": a passkey continua');
  await a.click('#segPasskey [data-act="conta.pk.desligar"]'); await janela(a, /Desligar a digital/); await a.click('.modal [data-yes]');
  await toast(a, /Digital em todos os aparelhos desligada/);
  av = await avancado(a);
  conferir(!pksDe(ANA).length && /Desligada\./.test(av.pk) && av.acts.includes('conta.pk.ligar'), 'P. desligada: sai de sol_passkeys e a página volta a "Desligada" com "Ligar"');
  pv = await primeira(a, true);
  conferir(!pv.pk, 'P. e "👆 Usar a digital" some');
  await a.evaluate(() => closeModals());

  /* K5: desligar o kit com o banco depois do GRANT */
  console.log('K5. Desligar o kit (o banco já deixa)');
  const h5 = db.omni_historico.length;
  await avancado(a);
  await a.click('#segKit [data-act="conta.kit.desligar"]'); await janela(a, /Desligar o kit de emergência\?/); await a.click('.modal [data-yes]');
  await toast(a, /Kit de emergência desligado/);
  const extra = await textoJanelas(a);
  conferir(!kitDe(ANA) && !/único jeito de voltar/.test(extra), 'K5. com outros aparelhos com a chave pessoal (o celular "kit" e o aparelho "passkey"): uma confirmação só, e a linha sai de omni_chave_privada');
  av = await avancado(a);
  conferir(/Desligado\./.test(av.kit) && av.acts.includes('conta.kit.ligar') && !av.acts.includes('conta.kit.desligar') && /Ligar/.test(av.kit), 'K5. a página: "Desligado", só com "Ligar"');
  conferir(await ate(() => db.omni_historico.slice(h5).some((x) => x.acao === 'kit.desligado')), 'K5. "kit.desligado" no histórico da família');
  pv = await primeira(c, true);
  conferir(!pv.cod && pv.outro, 'K5. o link "Tenho o código de recuperação antigo" some (no OmniLifeONE; o MoneyTRIO procura a mesma linha)');
  await c.evaluate(() => closeModals());
  /* K6: ligar de novo (sem papel antigo: não há o que avisar) grava a linha no formato de hoje */
  await limparToasts(a); await avancado(a);
  await a.click('#segKit [data-act="conta.kit.ligar"]'); await provar(a, PIN_A);
  conferir(await janela(a, /Anote este código num papel/) && !/papel antigo/.test(await textoJanelas(a)), 'K6. "Ligar" (kit desligado): o PIN de agora e direto o código, sem falar de papel antigo');
  const CODIGO2 = await a.evaluate(() => document.querySelector('.modal .vcode').textContent.trim());
  await a.check('.modal #cfok'); await a.click('.modal:has(#cfok) [data-ok]');
  await toast(a, /Kit de emergência ligado/);
  const kit2 = kitDe(ANA);
  conferir(!!kit2 && JSON.parse(kit2.privada_cifrado).v === 1 && kit2.iteracoes === 600000 && await abreKit(kit2, CODIGO2) === H0 && await abreKit(kit2, CODIGO) === null && /Ligado/.test((await avancado(a)).kit),
    'K6. a linha volta no formato de hoje: o código novo abre a mesma chave pessoal, o anterior não; a página diz "Ligado"');
  pv = await primeira(c, true);
  conferir(pv.cod, 'K6. e o link "Tenho o código de recuperação antigo" volta');
  await c.evaluate(() => closeModals());

  /* K1 (conta nova): a Cris cria as Senhas da casa sem código — o kit nasce desligado */
  console.log('K1. A conta nova (Cris): o kit desligado');
  const D = await aparelho(browser, { nome: 'Cris', vp: 'computador', base: BASE }), d = D.p; lixos.push(D.lixo);
  await entrarOmni(d, CRIS); await quieto(d);
  const rc = await d.evaluate((pin) => Cofre.criarConta(pin), PIN_C);
  av = await avancado(d);
  conferir((rc.ok || rc.erro === 'aguardando') && !kitDe(CRIS) && /Desligado\./.test(av.kit) && av.acts.includes('conta.kit.ligar') && !av.acts.includes('conta.kit.desligar'),
    'K1. conta nova: nenhuma linha em omni_chave_privada e o kit DESLIGADO (só "Ligar")');

  /* limpeza */
  const guardados = await Promise.all([a, c, d].map((p) => p.evaluate(() => JSON.stringify(Object.assign({}, localStorage)) + JSON.stringify(Object.assign({}, sessionStorage)))));
  /* o PIN como número inteiro (sem dígito colado), como no aparelhos-cruzado-omni.js: o app guarda horários de 13 dígitos
     (Date.now(): sessão, anúncio, AssistONE…) que às vezes contêm os mesmos 6 dígitos por acaso — isso não é o PIN guardado.
     Os códigos (letras e números em pedaços) continuam conferidos como texto */
  const codigos = [CODIGO, CODIGO.replace(/-/g, ''), CODIGO2, CODIGO2.replace(/-/g, '')];
  const vaza = (t) => PINS.some((n) => new RegExp('(^|[^0-9])' + n + '([^0-9]|$)').test(String(t))) || codigos.some((k) => String(t).includes(k));
  conferir(!guardados.some(vaza), 'nenhum PIN nem código em localStorage/sessionStorage');
  conferir(!lixos.some((l) => l.console.some(vaza)) && !db.omni_historico.some((x) => vaza(JSON.stringify(x))), 'nenhum PIN nem código no console nem no histórico');
  conferir(!lixos.some((l) => l.erros.length), 'sem erro de script' + lixos.map((l) => l.erros.join(' / ')).filter(Boolean).map((x) => ': ' + x).join(''));
  conferir(!lixos.some((l) => l.nativos.length), 'sem diálogo nativo (alert/confirm/prompt)');
  conferir(!lixos.some((l) => l.fora.some((u) => /supabase\.co/.test(u))), 'nada do Supabase fora do banco de mentira');

  /* o fechar do servidor espera as conexões abertas acabarem, e o navegador (ainda aberto) pode segurar uma para sempre: a suíte
     ficava parada aqui (visto na revisão 3). Como no aparelhos-cruzado-omni.js, no máximo 3 s; o terminar fecha o navegador */
  await Promise.race([S2.fechar(), new Promise((r) => setTimeout(r, 3000))]);
  await terminar(falhas, browser, 'kit de emergência e digital em todos os aparelhos (etapa 9)');
})().catch((e) => { console.error(e); process.exit(1); });
