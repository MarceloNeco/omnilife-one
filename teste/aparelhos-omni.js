/* Aparelhos da conta (2.26.0, Parte A): aprovar um aparelho novo pelo outro aparelho, OmniLifeONE ↔ OmniLifeONE, no
   "Supabase de mentira" (teste/mock-sol.js): cada aparelho é um contexto do navegador e todos falam com o mesmo banco,
   que mora neste processo. Nada vai para a internet nem para o Supabase de verdade.
   A fumaça, duas rodadas seguidas (cada uma um aparelho novo):
     - Ana entra pela janela da conta (e-mail e senha) no banco de mentira; o registro de acesso "login" chega
     - a família abre (Família Teste, Ana chefe, 4 pessoas); o app cria a pessoa dela e registra o aparelho na família
     - Casa → Senhas da casa: a Jornada lê o estado de verdade ("primeira vez" neste aparelho): passo a passo e, sem papel nem
       código, "aprove pelo outro aparelho seu" + "Usar neste …"
     - nenhuma requisição sai do site local e do banco de mentira; nenhum erro de script nem diálogo nativo
   Etapa 5 (o aparelho novo pede e entra; a conta nova sem código), com o outro aparelho feito no Node (as funções do banco de
   mentira e as mesmas contas do SolProto):
     A1  "Primeira vez": aprovar pelo outro aparelho, pela família (há a Bia), sem a digital (sem leitor); o código só no link
     A1b ninguém para aprovar (K21): só a explicação e onde fica o "Começar do zero"; nunca par novo
     A2  o pedido (app "omnilife", compromisso, o par com a privada não extraível) · A6b Cancelar/✕ recusa no banco (K18), 4×
         sem "muitos pedidos" · A7b venceu sem resposta · A5b aprovado e vencido · A8b o banco troca pub_a/n_a depois (K1)
     K3  a chave de outra família não abre · K19 nenhuma linha órfã na lista (venceu, não abriu, desistiu do PIN, kit cancelado)
     B aprovado "à mão" (pela família e pelo outro aparelho): "Digite o PIN da sua conta"; "Esqueci o PIN" (o cadeado de antes
         só sai no fim); "Não lembro" (PIN novo sem o atual); o código antigo entra como "kit"; K15 "Falta liberar" já no PIN da conta
     A12 conta nova (Cris): "Crie o PIN da sua conta", sem código; a pública uma vez, kit desligado, "primeiro", PIN v1,
         "Falta liberar" até a Ana abrir; a pública intacta (com e sem o kit) em todos os caminhos
   Etapa 6 (quem aprova), Omni ↔ Omni (um contexto por aparelho):
     A3  a faixa (só com pedido; pelo Cloud.poll; a mesma nas voltas — K22; espera com janela do cadeado aberta — K31), os 6
         números iguais, PIN errado não aprova nem gasta tentativa da conta (K11), PIN certo aprova
     A4  o aparelho aprovado: "Digite o PIN da sua conta", aprovado_por(_ap), "usado", a mesma CF (item do outro e envelope _em)
     A5  resposta repetida · A6 recusar (pela lista "🔔 Pedidos de acesso (N)" do 👤, depois do ✕ na faixa) · A7 vencer
     A8  a pública trocada (números diferentes) e alterada (sem como aprovar)
     A9  pela família (Bia): o aviso de quem pede, K16 (o aparelho da 2.25 entra na lista antes), só a chave da família,
         G2 (as chaves de IA sem a janela do cofre), o aviso "Um aparelho novo entrou na sua conta" nos aparelhos da Ana
     A9b um membro pede para a família → só "Recusar" (K2) · K3 o próprio pedido "para a família" leva a chave pessoal
     A10 o tirado sai ao abrir · A11 tirado, o PIN certo não abre · K9 tirado, a digital não aprova
     B5  24 h de espera → "Esqueci o PIN" → aprovado → "Não lembro" · A3b PIN trocado em outro aparelho (G1 nas chaves de IA)
     D1  o cartão "🔐 Falta um passo para as Senhas da casa neste …" no Início
   E o banco de mentira faz o que o SQL faz (as próximas etapas dependem dele): pedidos de membro de qualquer papel, os
   ataques "troca", "troca-sem-compromisso" e "troca-depois", o dono recusa o próprio pedido, PIN da conta, passkey,
   404 das tabelas novas por REST e o DELETE da omni_chave_privada (403 42501 com M.semDelete).
   Pessoas, senhas e chaves de mentira. Uso: node teste/rodar.js   ·   sozinho: BASE=http://localhost:8099 node teste/aparelhos-omni.js */
const crypto = require('crypto');
const { BASE, criarConferir, iniciar, terminar } = require('./_base');
const { M, db, rpcs, prepararChaves, compromisso, cf, agora, normCode, b64u, PESSOAS, ANA, BIA, CRIS, DAVI, GID } = require('./mock-sol');
const { aparelho, entrarOmni, senhasDaCasa, cadeado225 } = require('./_nuvem');

/* espera uma condição do lado do banco (Node) */
async function ate(fn, ms) { const fim = Date.now() + (ms || 8000); while (Date.now() < fim) { if (fn()) return true; await new Promise((r) => setTimeout(r, 100)); } return !!fn(); }

/* ---- etapa 5: PINs de mentira e o "outro aparelho" (A) feito aqui no Node ---- */
const PIN_CONTA = '590317', PIN_NOVO = '482915', PIN_X = '615048', PIN_CRIS = '903726', PIN_BIA = '271846', PINS = [PIN_CONTA, PIN_NOVO, PIN_X, PIN_CRIS, PIN_BIA];
const CHAVE6 = 'mentira-groq-etapa6-0123456789';   /* chave de IA de mentira */
const OUTRA = '33333333-3333-3333-3333-333333333333';   /* uma família que não é a do pedido */
const subtle = crypto.webcrypto.subtle, utf8 = (t) => new TextEncoder().encode(t), b64n = (b) => Buffer.from(b).toString('base64');
const vNode = (pin, sal) => b64u(crypto.pbkdf2Sync(Buffer.from(String(pin), 'utf8'), Buffer.from(sal, 'base64url'), 600000, 32, 'sha256'));
/* a chave pessoal da pessoa, aberta pelo código do papel (como o app faz): a carga "pessoal" que o computador manda */
async function privadaDe(uid) {
  const r = db.omni_chave_privada.find((x) => x.user_id === uid), o = JSON.parse(r.privada_cifrado);
  const base = await subtle.importKey('raw', utf8(normCode(PESSOAS[uid].codigo)), 'PBKDF2', false, ['deriveKey']);
  const k = await subtle.deriveKey({ name: 'PBKDF2', salt: Buffer.from(r.sal, 'base64'), iterations: r.iteracoes, hash: 'SHA-256' }, base, { name: 'AES-GCM', length: 256 }, false, ['decrypt']);
  return new Uint8Array(await subtle.decrypt({ name: 'AES-GCM', iv: Buffer.from(o.iv, 'base64') }, k, Buffer.from(o.ct, 'base64')));
}
/* as mesmas contas do SolProto (teste/gerar-vetores-sol.js), do lado de quem aprova */
const ladoA = {
  async par() { const k = await subtle.generateKey({ name: 'ECDH', namedCurve: 'P-256' }, true, ['deriveBits']), j = await subtle.exportKey('jwk', k.publicKey); return { priv: k.privateKey, pub: { kty: 'EC', crv: 'P-256', x: j.x, y: j.y } }; },
  async sas(id, pubA, pubB, nA, nB) {
    const h = new Uint8Array(await subtle.digest('SHA-256', utf8(['sol-ap-v2', id, pubA.x + '.' + pubA.y, pubB.x + '.' + pubB.y, nA, nB].join('|'))));
    return String((((h[0] << 24) >>> 0) + (h[1] << 16) + (h[2] << 8) + h[3]) % 1000000).padStart(6, '0');
  },
  async chave(priv, pubOutro, id, uid, nA, nB) {
    const pk = await subtle.importKey('jwk', { kty: 'EC', crv: 'P-256', x: pubOutro.x, y: pubOutro.y, ext: true }, { name: 'ECDH', namedCurve: 'P-256' }, false, []);
    const base = await subtle.importKey('raw', await subtle.deriveBits({ name: 'ECDH', public: pk }, priv, 256), 'HKDF', false, ['deriveKey']);
    return subtle.deriveKey({ name: 'HKDF', hash: 'SHA-256', salt: new Uint8Array(32), info: utf8(['sol-ap-v2', id, uid, nA, nB].join('|')) }, base, { name: 'AES-GCM', length: 256 }, false, ['encrypt']);
  },
  async fechar(key, id, carga) { const iv = crypto.randomBytes(12); return { v: 2, iv: b64n(iv), ct: b64n(await subtle.encrypt({ name: 'AES-GCM', iv, additionalData: utf8(id) }, key, utf8(JSON.stringify(carga)))) }; }
};
/* A desafia o pedido, espera o B revelar o nB e confere o compromisso. Devolve os 6 números, resposta(carga) (fechada para
   o B) e aprovar(resposta) — síncrono, para o teste poder mexer no relógio no mesmo passo */
async function aprovarNoNode(quem, id, meuAp) {
  const A = await ladoA.par(), nA = b64u(crypto.randomBytes(32));
  if (!rpcs.sol_pedido_desafio(quem, { p_id: id, p_pub_a: A.pub, p_n_a: nA })) throw new Error('desafio recusado');
  const p = db.sol_acesso_pedidos.find((x) => x.id === id);
  if (!(await ate(() => !!p.n_b, 20000))) throw new Error('o aparelho novo não revelou o nB');
  return { okC: compromisso(p.pub, p.n_b) === p.compromisso, sas: await ladoA.sas(id, A.pub, p.pub, nA, p.n_b),
    resposta: async (carga) => ladoA.fechar(await ladoA.chave(A.priv, p.pub, id, p.user_id, nA, p.n_b), id, carga),
    aprovar: (resp) => rpcs.sol_pedido_aprovar(quem, { p_id: id, p_resposta: resp, p_meu_ap: meuAp || null }) };
}
const pedidoAberto = () => db.sol_acesso_pedidos.filter((x) => x.user_id === ANA && x.estado === 'aberto').slice(-1)[0];
const linhasAna = () => db.sol_aparelhos.filter((a) => a.user_id === ANA && !a.removido_em);
const pinDaConta = (uid) => db.sol_pin_conta.find((x) => x.user_id === uid);
const cadeado = (p) => p.evaluate(async () => { const L = await Cofre.local(); return L ? { ap: L.ap || null, como: L.como || null, srv: !!L.srv, pinVersao: L.pinVersao || 0, sk: !!L.sk, fam: Object.keys(L.fam || {}), ct: L.pin && L.pin.ct } : null; });
const janela = (p, re, ms) => p.waitForFunction((re) => [...document.querySelectorAll('.modal h3')].some((h) => new RegExp(re).test(h.textContent)), re.source, { timeout: ms || 10000 }).then(() => true, () => false);
const temJanela = (p, re) => p.evaluate((re) => [...document.querySelectorAll('.modal h3')].some((h) => new RegExp(re).test(h.textContent)), re.source);
const textoJanelas = (p) => p.evaluate(() => [...document.querySelectorAll('.modal')].map((m) => m.innerText).join(' | '));
const semFila = (p) => p.evaluate(() => SolverJanela.esperando() === 0);   /* nenhuma janela esperando atrás de outra (K31) */
const naTela = (p, sel) => p.evaluate((s) => !!document.querySelector(s), sel);
const erroEm = (p, re) => p.waitForFunction((re) => new RegExp(re).test((document.querySelector('.modal #pcErr') || {}).textContent || ''), re, { timeout: 15000 }).then(() => true, () => false);
const sasNaTela = (p) => p.waitForSelector('.modal #apSas', { timeout: 20000 }).then(() => p.evaluate(() => document.querySelector('.modal #apSas').textContent.replace(/\s/g, '')), () => '');
const temPedido = (p) => p.evaluate(async () => !!(await IDB.get('kv', 'pedido|' + Conta.uid())));
const tranca = (p) => p.evaluate(async () => { await SolverCofre.trancar(); Cofre.trancar(); });
async function abrirPrimeiraVez(p) { await p.evaluate(() => closeModals()); await p.click('#screen [data-act="cofre.comecar"]'); await janela(p, /Primeira vez neste/); }
/* o "Olá" e as dicas do AssistONE abrem sozinhos e cobririam os botões */
const quieto = (p) => p.evaluate(() => { AOne.save({ hello: 1, tour: 1, tips: Object.assign({}, AOne.cfg().tips, { home: 1, settings: 1, house: 1 }) }); if (AOne.view) AOne.close(); });
/* conta quantas vezes um par RSA novo é feito nesta página (com a pública na conta: nunca) */
const vigiarPares = (p) => p.evaluate(() => { window.__pares = 0; const f = Cofre.novoPar; Cofre.novoPar = function () { window.__pares++; return f.apply(this, arguments); }; });
const guardouSegredo = (lixos) => lixos.some((l) => l.console.some((t) => PINS.some((x) => t.includes(x))));
/* ---- etapa 6 (quem aprova) ---- */
const espere = (ms) => new Promise((r) => setTimeout(r, ms));
const toasts = (p) => p.evaluate(() => document.querySelector('#toasts').textContent);
/* quem abriu a família neste aparelho (para provar que NADA abriu) */
const vigiarAbertura = (p) => p.evaluate(() => { window.__abriu = 0; const o = Cofre.usarChave; Cofre.usarChave = function () { window.__abriu++; return o.apply(this, arguments); }; });
/* pergunta pelos pedidos agora (sem esperar os 20 s do Cloud.poll); limpar = esquece os dispensados nesta aba. Devolve o texto da faixa */
const olhar = (p, limpar) => p.evaluate(async (limpar) => {
  for (let i = 0; i < 80 && Aparelhos._olhando; i++) await new Promise((r) => setTimeout(r, 100));
  if (limpar) Aparelhos._vistos = {};
  await Aparelhos.olharPedidos();
  const f = document.getElementById('apFaixa'); return f ? f.textContent : '';
}, limpar !== false);
const verPedido = async (p) => { await p.click('#apFaixa #apVer'); return janela(p, /Pedido de acesso/); };
const linhasDe = (uid) => db.sol_aparelhos.filter((a) => a.user_id === uid && !a.removido_em);
const pedidoDe = (uid) => db.sol_acesso_pedidos.filter((x) => x.user_id === uid && x.estado === 'aberto').slice(-1)[0];
const abriu = (p) => p.waitForFunction(() => Cofre.aberto() && !document.querySelector('.modal'), null, { timeout: 60000 }).then(() => true, () => false);
const saiuDaConta = (p) => p.waitForFunction(() => S.gate === 'welcome', null, { timeout: 25000 }).then(() => true, () => false);
/* o passo a passo das Senhas da casa já visto (sob carga ele abre depois da espera do senhasDaCasa e cobriria os botões) */
const quieto6 = async (p) => { await quieto(p); await p.evaluate(() => lsSet(GuiaCofre.K, Date.now())); };
const fechouSas = (p) => p.waitForSelector('.modal #apSas', { state: 'detached', timeout: 30000 }).then(() => true, () => false);

(async () => {
  const browser = await iniciar();
  const { falhas, conferir } = criarConferir();
  await prepararChaves();

  for (const rodada of [1, 2]) {
    console.log('Fumaça, rodada ' + rodada + ': a Ana entra no OmniLifeONE (aparelho novo) pelo banco de mentira');
    const n0 = M.log.length, a0 = M.acessos.length;
    const { ctx, p, lixo } = await aparelho(browser, { nome: 'Ana ' + rodada, vp: 'computador', base: BASE });
    await entrarOmni(p, ANA);
    const log = () => M.log.slice(n0);
    const sessao = await p.evaluate(() => { const s = JSON.parse(localStorage.getItem('solverone.sessao.v1') || 'null'); return { email: s && s.email, uid: Conta.uid() }; });
    conferir(log().some((x) => x.metodo === 'POST' && x.caminho === '/auth/v1/token?grant_type=password') && sessao.email === 'ana@teste.com' && sessao.uid === ANA,
      rodada + ': entrou pela janela da conta (e-mail e senha), no banco de mentira');
    conferir(await ate(() => M.acessos.slice(a0).some((x) => x.uid === ANA && x.evento === 'login' && x.app === 'omnilife-one')), rodada + ': o registro de acesso "login" chegou');
    const fam = await p.evaluate((bia) => ({ id: S.family.id, nome: S.family.name, papel: S.role, n: Object.keys(S.family.members).length, bia: (S.family.members[bia] || {}).role, gate: S.gate }), BIA);
    conferir(fam.id === GID && fam.nome === 'Família Teste' && fam.papel === 'admin' && fam.n === 4 && fam.bia === 'responsavel' && !fam.gate,
      rodada + ': a família abre (Família Teste, Ana chefe, 4 pessoas, Bia responsável)');
    conferir(await ate(() => db.omni_docs.some((d) => d.colecao === 'people' && d.id === 'p-ana' && d.criado_por === ANA) && db.omni_aparelhos.filter((a) => a.user_id === ANA && a.grupo_id === GID).length === rodada),
      rodada + ': o app criou a pessoa da Ana (uma vez só) e registrou este aparelho na família (omni_aparelhos)');

    const sc = await senhasDaCasa(p);
    conferir(sc.guia === true, rodada + ': Casa → Senhas da casa: o passo a passo abre sozinho na primeira vez neste aparelho');
    conferir(sc.status.fase === 'novo' && sc.status.caso === 'primeiraVez' && sc.status.rede && sc.status.temPub && sc.status.temKit && !sc.status.tem && sc.status.familiaPode && !('jaTem' in sc.status),
      rodada + ': a Jornada lê o estado de verdade: sem cadeado neste aparelho, "primeira vez" (a conta já tem as chaves e a cópia pelo código; sem PIN da conta; a Bia pode aprovar)');
    conferir(/Você já usa as Senhas da casa em outro aparelho/.test(sc.texto) && /Aprove pelo outro aparelho seu/.test(sc.texto) && !/código de recuperação|papel com/i.test(sc.texto) &&
      await p.evaluate(() => /Usar neste/.test((document.querySelector('[data-act="cofre.comecar"]') || {}).textContent || '')),
      rodada + ': a tela diz como usar aqui (aprovar pelo outro aparelho ou pela família), sem papel nem código, e oferece "🔑 Usar neste …"');
    conferir(!(await p.$('.modal')), rodada + ': nenhuma janela ficou aberta');
    if (rodada === 1) {
      /* as chaves de mentira estão no formato de hoje: o código do papel abre a chave pessoal e ela abre a CF da família */
      const k = await p.evaluate(async (codigo) => {
        const pv = await Cofre.privadaPeloCodigo(codigo), r = pv && await Cofre.buscarMinha(await Cofre.importarSk(pv.pkcs8));
        return { kid: pv && pv.kid === (await Cofre.minhasNoBanco()).pub.kid, errado: await Cofre.privadaPeloCodigo('AAAAA-BBBBB-CCCCC-DDDDD'), kv: r && r.kv, fk: r && r.fk, cf: r && b64FromBuf(r.raw) };
      }, PESSOAS[ANA].codigo);
      conferir(k.kid && k.errado === null && k.kv === 1 && k.fk === 'fk-teste' && k.cf === Buffer.from(cf()).toString('base64'),
        '1: as chaves de mentira abrem como hoje: o código do papel abre a chave da Ana, que abre a CF da família (código errado não abre)');
    }

    const sb = lixo.fora.filter((u) => /supabase/i.test(u)), hosts = [...new Set(lixo.fora.map((u) => { try { return new URL(u).host; } catch (e) { return u.slice(0, 40); } }))];
    conferir(log().length > 10 && !sb.length, rodada + ': nada saiu: o Supabase só pelo banco de mentira (' + log().length + ' chamadas); o resto foi cortado' + (hosts.length ? ' (' + hosts.join(', ') + ')' : ''));
    conferir(!lixo.erros.length, rodada + ': nenhum erro de script' + (lixo.erros.length ? ': ' + lixo.erros.join(' | ') : ''));
    conferir(!lixo.nativos.length, rodada + ': nenhum alert/confirm/prompt do navegador' + (lixo.nativos.length ? ': ' + lixo.nativos.join(' | ') : ''));
    await ctx.close();
  }
  conferir(db.omni_docs.filter((d) => d.colecao === 'people' && d.id === 'p-ana').length === 1 && !db.sol_aparelhos.length && !db.sol_acesso_pedidos.length && !db.sol_pin_conta.length,
    'depois das duas rodadas: uma pessoa só para a Ana; nada nas tabelas novas (abrir a tela das Senhas da casa só lê)');
  conferir([ANA, BIA].every((u) => db.sol_chave_publica.some((k) => k.user_id === u) && db.omni_chave_privada.some((k) => k.user_id === u)) &&
    ![CRIS, DAVI].some((u) => db.sol_chave_publica.some((k) => k.user_id === u) || db.omni_chave_privada.some((k) => k.user_id === u) || db.sol_grupo_chaves.some((k) => k.user_id === u)),
    'as chaves de mentira: Ana e Bia têm (pública, cópia pelo código e a CF embrulhada); a Cris (responsável) ainda não; o Davi (membro) nunca');

  /* o banco de mentira faz o que o SQL faz (as próximas etapas dependem disso). O Davi (membro) faz as chamadas pelo
     próprio app (Conta.rpc/Conta.rest e as contas do SolProto); no fim o banco volta a como estava. */
  console.log('O banco de mentira: pedidos, ataques, passkey, PIN e as tabelas por REST');
  const antes = JSON.parse(JSON.stringify(db));
  const dv = await aparelho(browser, { nome: 'Davi', vp: 'celular', base: BASE }), d = dv.p;
  await entrarOmni(d, DAVI);
  const pedir = (grupo) => d.evaluate(async (grupo) => {
    const par = await SolProto.novoPar(), nB = SolProto.b64u(SolProto.rnd(32));
    const id = await Conta.rpc('sol_pedido_criar', { p_nome: 'Linux · Chrome', p_app: 'omnilife', p_pub: par.pub, p_compromisso: await SolProto.compromisso(par.pub, nB), p_grupo: grupo ? S.family.id : null });
    (window.__B = window.__B || {})[id] = { par, nB }; return id;
  }, grupo);
  const pf = await pedir(true), pp = db.sol_acesso_pedidos.find((x) => x.id === pf);
  const errado = await d.evaluate(() => Conta.rpc('sol_pedido_criar', { p_nome: 'x', p_app: 'omnilife', p_pub: {}, p_compromisso: 'x', p_grupo: '33333333-3333-3333-3333-333333333333' }).then(() => '', (e) => e.message));
  conferir(pp && pp.user_id === DAVI && pp.grupo_id === GID && errado === 'família errada', 'banco: um membro (de qualquer papel) pede "para a família"; outra família = "família errada"');
  const vista = (uid) => rpcs.sol_pedidos_para_mim(uid).find((x) => x.id === pf);
  conferir(vista(ANA).tipo === 'familia' && vista(DAVI).tipo === 'pessoal' && vista(CRIS).tipo === 'familia' && vista(ANA).quem_nome === 'Davi Teste', 'banco: o pedido aparece para quem pode aprovar (chefe/responsável: "familia"; o dono: "pessoal")');
  M.ataque = 'troca'; const t1 = vista(ANA); M.ataque = 'troca-sem-compromisso'; const t2 = vista(ANA); M.ataque = null;
  conferir(t1.pub.x === M.ATACANTE.pub.x && t1.compromisso === compromisso(M.ATACANTE.pub, M.ATACANTE.n) && t2.pub.x === M.ATACANTE.pub.x && t2.compromisso === pp.compromisso,
    'banco: M.ataque "troca" troca a pública e forja o compromisso; "troca-sem-compromisso" só troca a pública');
  conferir(await d.evaluate((id) => Conta.rpc('sol_pedido_recusar', { p_id: id }), pf) === true && pp.estado === 'recusado' && pp.respondido_por === DAVI, 'banco: o dono do pedido recusa o próprio pedido (o "Cancelar")');
  /* um pedido pessoal inteiro, com o banco trocando a pub_a/n_a e a resposta depois de aprovado ("troca-depois", K1) */
  const pq = await pedir(false);
  const k1 = await d.evaluate(async (id) => {
    const B = window.__B[id], A = await SolProto.novoPar(), nA = SolProto.b64u(SolProto.rnd(32)), uid = Conta.uid();
    const ok1 = await Conta.rpc('sol_pedido_desafio', { p_id: id, p_pub_a: A.pub, p_n_a: nA }), ok2 = await Conta.rpc('sol_pedido_revelar', { p_id: id, p_n_b: B.nB });
    const resp = await SolProto.fechar(await SolProto.chave(A.priv, B.par.pub, id, uid, nA, B.nB), id, SolProto.cargaPessoal(SolProto.utf8('pkcs8-de-mentira')));
    const ok3 = await Conta.rpc('sol_pedido_aprovar', { p_id: id, p_resposta: resp, p_meu_ap: null });
    window.__fixo = { pubA: A.pub, nA }; return ok1 && ok2 && ok3;
  }, pq);
  M.ataque = 'troca-depois';
  const k1b = await d.evaluate(async (id) => {
    const B = window.__B[id], f = window.__fixo, uid = Conta.uid(), r = (await Conta.rpc('sol_pedido_buscar', { p_id: id }))[0];
    const abre = async (pubA, nA) => { try { return SolProto.lerCarga(await SolProto.abrirResp(await SolProto.chave(B.par.priv, pubA, id, uid, nA, B.nB), id, r.resposta), r.tipo); } catch (e) { return null; } };
    const fixo = await abre(f.pubA, f.nA), doBanco = await abre(r.pub_a, r.n_a);
    return { estado: r.estado, trocou: r.pub_a.x !== f.pubA.x && r.n_a !== f.nA, fixo: !!fixo, doBanco: doBanco && doBanco.tipo, outra: doBanco && SolProto.deUtf8(doBanco.sk) !== 'pkcs8-de-mentira', ap: r.aparelho };
  }, pq);
  M.ataque = null;
  const pqb = db.sol_acesso_pedidos.find((x) => x.id === pq), apq = db.sol_aparelhos.find((a) => a.id === k1b.ap);
  conferir(k1 && k1b.estado === 'aprovado' && k1b.trocou && !k1b.fixo && k1b.doBanco === 'pessoal' && k1b.outra,
    'banco: "troca-depois" devolve outra pub_a/n_a e uma resposta do atacante (abre com a do banco, não com a fixada nos 6 números)');
  conferir(pqb.estado === 'usado' && pqb.resposta === null && apq && apq.como === 'aparelho' && apq.user_id === DAVI && apq.aprovado_por === DAVI, 'banco: lida a resposta, o pedido vira "usado" sem resposta e o aparelho entra na lista ("aparelho")');
  const reg = await d.evaluate(async () => [await Conta.rpc('sol_aparelho_registrar', { p_nome: 'Linux · Chrome', p_app: 'omnilife', p_como: 'primeiro' }).then(() => 'registrou', (e) => e.message),
    await Conta.rpc('sol_aparelho_registrar', { p_nome: 'Linux · Chrome', p_app: 'omnilife', p_como: 'kit' })]);
  conferir(/já tem aparelho|precisa ser aprovado/.test(reg[0]) && db.sol_aparelhos.some((a) => a.id === reg[1] && a.como === 'kit'), 'banco: "primeiro" só na conta sem aparelho; "kit" entra');
  const pin = await d.evaluate(async (ap) => {
    const sal = SolProto.novoSalConta(), v = await SolProto.verificador('736251', sal), info0 = (await Conta.rpc('sol_pin_info'))[0];
    const def = await Conta.rpc('sol_pin_definir', { p_v_novo: v, p_sal_novo: sal, p_v_atual: null, p_ap: ap });
    const errado = await Conta.rpc('sol_pin_conferir', { p_v: await SolProto.verificador('000000', sal), p_ap: ap }), certo = await Conta.rpc('sol_pin_conferir', { p_v: v, p_ap: ap });
    return { tem0: info0.tem, def: def.ok && def.versao === 1 && /^[A-Za-z0-9_-]{43}$/.test(def.segredo), errado: errado.erro === 'pin' && errado.restam === 9, certo: certo.ok && certo.segredo === def.segredo };
  }, reg[1]);
  conferir(!pin.tem0 && pin.def && pin.errado && pin.certo && db.sol_pin_conta.some((x) => x.user_id === DAVI && !JSON.stringify(x).includes('736251')), 'banco: PIN da conta — definir (versão 1 e o segredo do aparelho), errado conta, certo devolve o mesmo segredo; o PIN não chega ao banco');
  const pk = await d.evaluate(async () => {
    const cred = SolProto.b64u(SolProto.rnd(24)), sal = SolProto.b64u(SolProto.rnd(32));
    const g = await Conta.rpc('sol_passkey_guardar', { p_cred: cred, p_sal: sal, p_fechada: { iv: 'aXYtZGUtbWVudGlyYQ==', ct: 'Y3QtZGUtbWVudGlyYQ==' } });
    const n1 = (await Conta.rpc('sol_passkeys_minhas')).length, t = await Conta.rpc('sol_passkey_tirar', { p_cred: cred }), n2 = (await Conta.rpc('sol_passkeys_minhas')).length;
    return g === true && n1 === 1 && t === true && n2 === 0;
  });
  conferir(pk && db.sol_passkeys.some((k) => k.user_id === DAVI && k.removido_em), 'banco: a passkey é guardada de verdade (sol_passkeys_minhas) e sai com sol_passkey_tirar');
  const rest = await d.evaluate(async () => {
    const st = (pr) => pr.then(() => 'ok', (e) => (e.status || '') + ' ' + (e.code || ''));
    const tabs = await Promise.all(['sol_aparelhos', 'sol_acesso_pedidos', 'sol_passkeys', 'sol_pin_conta', 'sol_aparelho_pin'].map((t) => st(Conta.rest('GET', t + '?select=*'))));
    const uid = Conta.uid(), q = 'omni_chave_privada?user_id=eq.' + uid;
    const criou = await st(Conta.rest('POST', 'omni_chave_privada?on_conflict=user_id', { user_id: uid, privada_cifrado: '{"v":1,"kid":"de-mentira"}', sal: 'c2FsLWRlLW1lbnRpcmE=', iteracoes: 600000 }, 'resolution=merge-duplicates,return=minimal'));
    return { tabs, criou, q };
  });
  M.semDelete = true; const apagar1 = await d.evaluate((q) => Conta.rest('DELETE', q).then(() => 'ok', (e) => e.status + ' ' + e.code), rest.q); const ficou = db.omni_chave_privada.some((r) => r.user_id === DAVI);
  M.semDelete = false; const apagar2 = await d.evaluate((q) => Conta.rest('DELETE', q).then(() => 'ok', (e) => e.status + ' ' + e.code), rest.q);
  conferir(rest.tabs.every((x) => x === '404 PGRST205'), 'banco: sol_aparelhos, sol_acesso_pedidos, sol_passkeys, sol_pin_conta e sol_aparelho_pin dão 404 por REST (só pelas funções)');
  conferir(rest.criou === 'ok' && apagar1 === '403 42501' && ficou && apagar2 === 'ok' && !db.omni_chave_privada.some((r) => r.user_id === DAVI) && db.omni_chave_privada.some((r) => r.user_id === ANA) && db.omni_chave_privada.some((r) => r.user_id === BIA),
    'banco: omni_chave_privada — com M.semDelete (o GRANT de hoje) apagar dá 403 42501 e nada muda; sem ele, apaga só a linha da própria pessoa');
  conferir(!dv.lixo.erros.length && !dv.lixo.nativos.length && !dv.lixo.fora.some((u) => /supabase/i.test(u)), 'banco: sem erro de script, sem diálogo nativo e nada fora do banco de mentira');
  await dv.ctx.close();
  for (const t of Object.keys(db)) db[t].splice(0, db[t].length, ...antes[t]);

  /* ===================== Etapa 5: o aparelho novo (B) pede e entra; a conta nova sem código =====================
     O outro aparelho (A, quem aprova) é feito aqui no Node, pelas funções do banco de mentira e com as mesmas contas do
     SolProto (as do teste/gerar-vetores-sol.js): desafia, espera o B revelar o nB, confere o compromisso, mostra os 6 números
     e fecha a chave para o B. A tela de quem aprova é da etapa 6. */
  console.log('Etapa 5. O aparelho novo da Ana: Primeira vez, pedir, a espera, aprovado "à mão" e o PIN da conta');
  const pubAna = JSON.stringify(db.sol_chave_publica.find((k) => k.user_id === ANA)), kitAna = JSON.stringify(db.omni_chave_privada.find((k) => k.user_id === ANA));
  const apA = rpcs.sol_aparelho_registrar(ANA, { p_nome: 'Windows · Chrome', p_app: 'omnilife', p_como: 'primeiro' });   /* o "computador" da Ana */
  const salA = b64u(crypto.randomBytes(16));
  conferir(rpcs.sol_pin_definir(ANA, { p_v_novo: vNode(PIN_CONTA, salA), p_sal_novo: salA, p_v_atual: null, p_ap: apA }).versao === 1, 'preparo: o computador da Ana na lista da conta e o PIN da conta (versão 1)');
  const pkAna = await privadaDe(ANA), cargaAna = { v: 2, tipo: 'pessoal', sk: b64n(pkAna) };
  const lixosB = [];
  const B = await aparelho(browser, { nome: 'Ana celular', vp: 'celular', base: BASE }), b = B.p; lixosB.push(B.lixo);
  await entrarOmni(b, ANA);
  await quieto(b);
  await vigiarPares(b);
  const sc5 = await senhasDaCasa(b);
  conferir(sc5.status.caso === 'primeiraVez' && !/código de recuperação/.test(sc5.texto), 'A1. sem cadeado neste celular: "primeira vez" e nenhum "código de recuperação" na tela');
  await b.click('[data-act="cofre.comecar"]');
  conferir(await janela(b, /Primeira vez neste/) && await semFila(b), 'A1. "Usar neste …" abre "Primeira vez neste …" (nada esperando atrás de outra janela)');
  const a1 = await b.evaluate(() => {
    const m = document.querySelector('.modal:has(#apOutro)'), t = m.cloneNode(true), c = t.querySelector('#apCodigo'), link = c ? c.textContent : '';
    if (c) c.remove();
    return { outro: !!m.querySelector('#apOutro'), fam: !!m.querySelector('#apFamilia'), pk: !!m.querySelector('#apPasskey'), link, texto: t.textContent };
  });
  conferir(a1.outro && a1.fam && !a1.pk && /Tenho o código de recuperação antigo/.test(a1.link) && !/código de recuperação|papel com/i.test(a1.texto),
    'A1. "📱 Aprovar pelo outro aparelho", "👪 Pedir para alguém da família" (há a Bia), sem a digital (sem leitor); o código só no link discreto (a conta tem a cópia)');

  /* A2: o pedido */
  await b.click('.modal #apOutro');
  conferir(await b.waitForSelector('.modal #apEsperando', { timeout: 10000 }).then(() => true, () => false) && await semFila(b), 'A2. a espera: "Esperando o outro aparelho abrir o pedido…"');
  const pd2 = pedidoAberto();
  const kv2 = await b.evaluate(async () => { const x = await IDB.get('kv', 'pedido|' + Conta.uid()); return x && { id: x.id, cripto: x.priv instanceof CryptoKey, extraivel: x.priv && x.priv.extractable, nB: (x.nB || '').length, modo: x.modo }; });
  conferir(pd2 && pd2.app === 'omnilife' && pd2.compromisso.length === 43 && !pd2.n_b && !pd2.pub_a && !pd2.grupo_id && pd2.nome === 'Linux · Chrome' &&
    kv2 && kv2.id === pd2.id && kv2.cripto && kv2.extraivel === false && kv2.nB === 43 && kv2.modo === 'pessoal',
    'A2. pedido aberto no banco (app "omnilife", compromisso de 43, sem n_b) e o par guardado aqui com a privada NÃO extraível');

  /* A6b (K18): Cancelar recusa no banco; 4× pedir e cancelar não dá "muitos pedidos"; fechar no ✕ também recusa */
  await b.click('.modal #apCancelar');
  conferir(await ate(() => pd2.estado === 'recusado' && pd2.respondido_por === ANA) && await janela(b, /Primeira vez neste/) && !(await temPedido(b)),
    'A6b. Cancelar: o pedido é recusado no banco (quem aprova deixa de ver), o par sai daqui e volta a Primeira vez');
  for (let i = 0; i < 4; i++) {
    await b.click('.modal #apOutro'); await b.waitForSelector('.modal #apEsperando', { timeout: 10000 });
    await b.click('.modal #apCancelar'); await janela(b, /Primeira vez neste/);
  }
  await b.click('.modal #apOutro'); await b.waitForSelector('.modal #apEsperando', { timeout: 10000 });
  await b.click('.modal:has(#apEsperando) .xbtn');
  await b.waitForSelector('.modal #apEsperando', { state: 'detached', timeout: 5000 });
  const meus6 = () => db.sol_acesso_pedidos.filter((x) => x.user_id === ANA);
  conferir(await ate(() => meus6().length === 6 && meus6().every((x) => x.estado === 'recusado')) && !(await temJanela(b, /Não deu para pedir/)) && !(await temPedido(b)),
    'A6b. 4× pedir e cancelar seguidos: nenhum "muitos pedidos em aberto"; fechar a espera no ✕ também recusa (6 pedidos, todos recusados)');

  /* A7b: ninguém aprovou em 10 min */
  await abrirPrimeiraVez(b);
  await b.click('.modal #apOutro'); await b.waitForSelector('.modal #apEsperando', { timeout: 10000 });
  const n7 = db.sol_aparelhos.filter((a) => a.user_id === ANA).length;
  M.relogio += 11 * 60e3;
  conferir(await janela(b, /O pedido venceu/, 15000) && await naTela(b, '.modal #apDeNovo') && db.sol_aparelhos.filter((a) => a.user_id === ANA).length === n7 && !(await temPedido(b)),
    'A7b. venceu sem ninguém aprovar: "O pedido venceu" (com "Pedir de novo") e nenhuma linha nova na lista');

  /* A8b (K1): o banco mostra a B o pub_a de verdade (os 6 números batem) e, depois de aprovado, troca pub_a/n_a e a resposta */
  await b.click('.modal #apDeNovo'); await b.waitForSelector('.modal #apEsperando', { timeout: 10000 });
  const a8 = await aprovarNoNode(ANA, pedidoAberto().id, apA);
  const sas8 = await sasNaTela(b);
  conferir(a8.okC && sas8 === a8.sas, 'A8b. os dois mostram os mesmos 6 números (' + a8.sas + ') e o compromisso confere');
  const n8 = linhasAna().length;
  M.ataque = 'troca-depois';
  a8.aprovar(await a8.resposta(cargaAna));
  const viu8 = await janela(b, /Não abriu/, 15000), txt8 = await textoJanelas(b), pin8 = await temJanela(b, /Digite o PIN da sua conta/);
  M.ataque = null;
  conferir(viu8 && /não confere com os 6 números/.test(txt8) && !pin8, 'A8b. o banco troca o pub_a/n_a e a resposta depois de aprovado: não abre ("A resposta não confere com os 6 números. Nada foi usado.")');
  conferir(await cadeado(b) === null && await ate(() => linhasAna().length === n8) && db.sol_aparelhos.some((a) => a.user_id === ANA && a.removido_em && a.como === 'aparelho'),
    'A8b. nada foi montado (nenhum cadeado aqui) e a linha que o banco criou saiu da lista');

  /* A5b (K19): aprovado, mas a resposta venceu antes de chegar */
  await b.click('.modal #apDeNovo'); await b.waitForSelector('.modal #apEsperando', { timeout: 10000 });
  const a5 = await aprovarNoNode(ANA, pedidoAberto().id, apA); await sasNaTela(b);
  const r5 = await a5.resposta(cargaAna), n5 = linhasAna().length;
  a5.aprovar(r5); M.relogio += 11 * 60e3;   /* no mesmo passo: o aparelho novo só busca depois que venceu */
  conferir(await janela(b, /O pedido venceu/, 15000) && await ate(() => linhasAna().length === n5) && await cadeado(b) === null,
    'A5b. aprovado mas vencido antes de chegar (a resposta sumiu): "O pedido venceu" e a linha que o banco criou saiu da lista');

  /* K3: a chave da família vem para OUTRA família (gid diferente do pedido): não abre */
  await b.click('.modal #apVoltar'); await janela(b, /Primeira vez neste/);
  await b.click('.modal #apFamilia'); await b.waitForSelector('.modal #apEsperando', { timeout: 10000 });
  const pd3 = pedidoAberto();
  conferir(pd3.grupo_id === GID && await b.evaluate(() => /Família Teste/.test(document.querySelector('.modal:has(#apEsperando)').textContent)), 'K3. preparo: "Pedir para alguém da família" (a família no texto e no pedido)');
  const a3 = await aprovarNoNode(BIA, pd3.id, null); await sasNaTela(b);
  const n3 = linhasAna().length;
  a3.aprovar(await a3.resposta({ v: 2, tipo: 'familia', gid: OUTRA, kv: 1, fk: 'fk-teste', cf: b64n(cf()) }));
  conferir(await janela(b, /Não abriu/, 15000) && !(await temJanela(b, /Digite o PIN da sua conta/)) && await ate(() => linhasAna().length === n3) && await cadeado(b) === null,
    'K3. a chave de OUTRA família: "Não abriu", nada montado e a linha nova sai da lista');

  /* K19: aprovado de verdade, mas a pessoa desiste do "Digite o PIN da sua conta" */
  await b.click('.modal #apDeNovo'); await b.waitForSelector('.modal #apEsperando', { timeout: 10000 });
  const a9 = await aprovarNoNode(BIA, pedidoAberto().id, null); await sasNaTela(b);
  const n9 = linhasAna().length;
  a9.aprovar(await a9.resposta({ v: 2, tipo: 'familia', gid: GID, kv: 1, fk: 'fk-teste', cf: b64n(cf()) }));
  conferir(await janela(b, /Digite o PIN da sua conta/, 15000) && await semFila(b) && await naTela(b, '.modal #pcNaoLembro'), 'aprovado pela família: "Digite o PIN da sua conta" (com "Não lembro…")');
  await b.click('.modal:has(#pcPin) .mf [data-x]');
  conferir(await ate(() => linhasAna().length === n9) && await cadeado(b) === null && !(await temPedido(b)), 'K19. desistiu do PIN: a linha nova sai da lista e nada é montado');

  /* aprovado pela família (Bia) e o PIN da conta */
  await abrirPrimeiraVez(b);
  await b.click('.modal #apFamilia'); await b.waitForSelector('.modal #apEsperando', { timeout: 10000 });
  const pdF = pedidoAberto(), aF = await aprovarNoNode(BIA, pdF.id, null); await sasNaTela(b);
  aF.aprovar(await aF.resposta({ v: 2, tipo: 'familia', gid: GID, kv: 1, fk: 'fk-teste', cf: b64n(cf()) }));
  await janela(b, /Digite o PIN da sua conta/, 15000);
  await b.fill('.modal #pcPin', '000000'); await b.click('.modal #pcOk');
  conferir(await erroEm(b, 'PIN errado') && await cadeado(b) === null, 'B aprovado à mão: o PIN da conta errado avisa ("PIN errado") e nada é montado');
  await b.fill('.modal #pcPin', PIN_CONTA); await b.click('.modal #pcOk');
  conferir(await b.waitForFunction(() => Cofre.aberto() && Cofre.status && Cofre.status.fase === 'aberto' && !document.querySelector('.modal'), null, { timeout: 30000 }).then(() => true, () => false), 'B aprovado à mão (pela família): "Digite o PIN da sua conta" → abre as Senhas da casa');
  let LB = await cadeado(b);
  const lF = db.sol_aparelhos.find((a) => a.id === LB.ap);
  conferir(!LB.sk && LB.fam.join() === GID && LB.como === 'familia' && LB.srv && LB.pinVersao === 1 && lF && lF.como === 'familia' && lF.aprovado_por === BIA && pdF.estado === 'usado' && pdF.resposta === null &&
    await b.evaluate((cf) => b64FromBuf(Cofre.vfRaw) === cf, b64n(cf())) && !(await temPedido(b)),
    'pela família: só a chave da família (sem a chave pessoal), "familia", o PIN da conta neste aparelho (L.srv, versão 1); a mesma chave da família; o pedido "usado" e o par apagado');

  /* "Esqueci o PIN": nada muda até o cadeado novo estar pronto */
  await tranca(b); await senhasDaCasa(b);
  await b.click('#screen [data-act="cofre.esqueci"]');
  conferir(await janela(b, /Abrir sem o PIN/) && await naTela(b, '.modal #apVolta') && await naTela(b, '.modal #apCodigo') && await semFila(b), '"Esqueci o PIN": "Abrir sem o PIN" (com "Voltar" e o link do código antigo)');
  await b.click('.modal #apVolta');
  conferir(JSON.stringify(await cadeado(b)) === JSON.stringify(LB), '"Voltar": o cadeado deste aparelho continua o mesmo');
  await b.click('#screen [data-act="cofre.esqueci"]'); await janela(b, /Abrir sem o PIN/);
  await b.click('.modal #apOutro'); await b.waitForSelector('.modal #apEsperando', { timeout: 10000 });
  const aE = await aprovarNoNode(ANA, pedidoAberto().id, apA); await sasNaTela(b);
  const nE = linhasAna().length;
  aE.aprovar(await aE.resposta(cargaAna));
  await janela(b, /Digite o PIN da sua conta/, 15000);
  await b.click('.modal:has(#pcPin) .mf [data-x]');
  conferir(await ate(() => linhasAna().length === nE) && JSON.stringify(await cadeado(b)) === JSON.stringify(LB) && linhasAna().some((a) => a.id === LB.ap),
    'o L antigo só é trocado no fim: aprovado, mas desistiu do PIN → o cadeado de antes continua inteiro (e o lugar dele na lista), a linha nova sai');

  /* aprovado pelo outro aparelho (pessoal): A4 do lado do aparelho novo */
  await b.click('#screen [data-act="cofre.esqueci"]'); await janela(b, /Abrir sem o PIN/);
  await b.click('.modal #apOutro'); await b.waitForSelector('.modal #apEsperando', { timeout: 10000 });
  const pdP = pedidoAberto(), aP = await aprovarNoNode(ANA, pdP.id, apA); await sasNaTela(b);
  aP.aprovar(await aP.resposta(cargaAna));
  await janela(b, /Digite o PIN da sua conta/, 15000);
  const t0 = pinDaConta(ANA).tentativas;
  await b.fill('.modal #pcPin', PIN_CONTA); await b.click('.modal #pcOk');
  conferir(await b.waitForFunction(() => Cofre.aberto() && Cofre.status && Cofre.status.fase === 'aberto' && !document.querySelector('.modal'), null, { timeout: 30000 }).then(() => true, () => false), 'B aprovado à mão (pelo outro aparelho): "Digite o PIN da sua conta" → abre as Senhas da casa');
  const LP = await cadeado(b), lP = db.sol_aparelhos.find((a) => a.id === LP.ap);
  conferir(LP.sk && LP.fam.join() === GID && LP.como === 'aparelho' && LP.srv && LP.pinVersao === 1 && lP && lP.como === 'aparelho' && lP.aprovado_por === ANA && lP.aprovado_por_ap === apA &&
    pdP.estado === 'usado' && pdP.resposta === null && !(await temPedido(b)) && pinDaConta(ANA).tentativas === t0 && await b.evaluate((cf) => b64FromBuf(Cofre.vfRaw) === cf, b64n(cf())),
    'A4 (lado B): a chave pessoal e a da família, "aparelho", L.srv e versão 1; na lista aprovado pela Ana, pelo computador dela; o pedido "usado"; o par apagado; a mesma chave da família');
  conferir(await ate(() => !linhasAna().some((a) => a.id === LB.ap)) && linhasAna().some((a) => a.id === LP.ap), '"Esqueci o PIN": o lugar antigo deste celular na lista sai, fica só o novo');
  conferir(await b.evaluate(async () => { const pk = await Cofre.decifrar(await Cofre.aes(Cofre.dukRaw), (await Cofre.local()).sk); return b64FromBuf(pk); }) === b64n(pkAna),
    'a chave pessoal que chegou é a mesma da conta (o vínculo do PIN único não muda)');

  /* "Não lembro o PIN da conta": um PIN novo sem o atual (aprovado pelo outro aparelho há menos de 10 min) */
  await tranca(b); await senhasDaCasa(b);
  await b.click('#screen [data-act="cofre.esqueci"]'); await janela(b, /Abrir sem o PIN/);
  await b.click('.modal #apOutro'); await b.waitForSelector('.modal #apEsperando', { timeout: 10000 });
  const aN = await aprovarNoNode(ANA, pedidoAberto().id, apA); await sasNaTela(b);
  aN.aprovar(await aN.resposta(cargaAna));
  await janela(b, /Digite o PIN da sua conta/, 15000);
  await b.click('.modal #pcNaoLembro');
  await b.waitForSelector('.modal #pcP1', { timeout: 8000 });
  conferir(await semFila(b) && !(await naTela(b, '.modal #pcPin')), '"Não lembro…": o formulário do PIN novo no lugar da janela (nada esperando, uma janela por vez)');
  await b.click('.modal:has(#pcP1) .mf [data-x]');
  conferir(await janela(b, /Digite o PIN da sua conta/) && await naTela(b, '.modal #pcPin'), '"Não lembro…": desistir do PIN novo volta para "Digite o PIN da sua conta"');
  await b.click('.modal #pcNaoLembro'); await b.waitForSelector('.modal #pcP1', { timeout: 8000 });
  await b.fill('.modal #pcP1', PIN_NOVO); await b.fill('.modal #pcP2', PIN_NOVO); await b.click('.modal #pcOk');
  conferir(await b.waitForFunction(() => Cofre.aberto() && !document.querySelector('.modal #pcPin'), null, { timeout: 30000 }).then(() => true, () => false) && pinDaConta(ANA).versao === 2 && (await cadeado(b)).pinVersao === 2,
    '"Não lembro o PIN da conta": o PIN novo vale (versão 2) e o cadeado abre com ele');
  const rN = await b.evaluate(async (a) => { Cofre.trancar(); const x = await Cofre.destrancarPin(a.velho); Cofre.trancar(); const y = await Cofre.destrancarPin(a.novo); return [x.erro || 'abriu', y.ok === true]; }, { velho: PIN_CONTA, novo: PIN_NOVO });
  conferir(rN[0] !== 'abriu' && rN[1], '"Não lembro": o PIN velho não abre mais; o novo abre');

  /* o código antigo (kit): errado avisa; desistir do PIN tira a linha "kit"; certo entra como "kit" */
  await tranca(b); await senhasDaCasa(b);
  const LK0 = await cadeado(b);
  await b.click('#screen [data-act="cofre.esqueci"]'); await janela(b, /Abrir sem o PIN/);
  await b.click('.modal #apCodigo'); await b.waitForSelector('.modal #apCod', { timeout: 8000 });
  await b.fill('.modal #apCod', 'AAAAA-BBBBB-CCCCC-DDDDD'); await b.click('.modal #apCodOk');
  conferir(await erroEm(b, 'Esse código não confere') && !db.sol_aparelhos.some((a) => a.user_id === ANA && a.como === 'kit'), 'código antigo errado: "Esse código não confere" e nada entra na lista');
  await b.fill('.modal #apCod', PESSOAS[ANA].codigo); await b.click('.modal #apCodOk');
  await janela(b, /Digite o PIN da sua conta/, 20000);
  const kit1 = db.sol_aparelhos.find((a) => a.user_id === ANA && a.como === 'kit' && !a.removido_em);
  await b.click('.modal:has(#pcPin) .mf [data-x]');
  conferir(kit1 && await ate(() => !!kit1.removido_em) && JSON.stringify(await cadeado(b)) === JSON.stringify(LK0), 'código antigo certo, mas desistiu do PIN: a linha "kit" sai da lista e o cadeado de antes fica');
  await b.click('#screen [data-act="cofre.esqueci"]'); await janela(b, /Abrir sem o PIN/);
  await b.click('.modal #apCodigo'); await b.waitForSelector('.modal #apCod', { timeout: 8000 });
  await b.fill('.modal #apCod', PESSOAS[ANA].codigo); await b.click('.modal #apCodOk');
  await janela(b, /Digite o PIN da sua conta/, 20000);
  await b.fill('.modal #pcPin', PIN_NOVO); await b.click('.modal #pcOk');
  conferir(await b.waitForFunction(() => Cofre.aberto() && Cofre.status && Cofre.status.fase === 'aberto' && !document.querySelector('.modal'), null, { timeout: 30000 }).then(() => true, () => false), 'código antigo: "Digite o PIN da sua conta" → abre');
  const LK = await cadeado(b), lK = db.sol_aparelhos.find((a) => a.id === LK.ap);
  conferir(LK.como === 'kit' && LK.sk && LK.srv && LK.pinVersao === 2 && lK && lK.como === 'kit' && await ate(() => !linhasAna().some((a) => a.id === LK0.ap)), 'código antigo: entrou como "kit" (o lugar de antes saiu da lista)');

  /* K15: aprovado, mas a família ainda não liberou a chave dela para esta pessoa: "Falta liberar" — e mesmo assim o cadeado
     novo já fica no PIN da conta (L.srv, versão, o lugar na lista) e o lugar antigo sai (senão, na próxima vez, "Falta só um passo") */
  const embAna = db.sol_grupo_chaves.filter((k) => k.user_id === ANA);
  db.sol_grupo_chaves.splice(0, db.sol_grupo_chaves.length, ...db.sol_grupo_chaves.filter((k) => k.user_id !== ANA));
  await tranca(b); await senhasDaCasa(b);
  await b.click('#screen [data-act="cofre.esqueci"]'); await janela(b, /Abrir sem o PIN/);
  await b.click('.modal #apOutro'); await b.waitForSelector('.modal #apEsperando', { timeout: 10000 });
  const a15 = await aprovarNoNode(ANA, pedidoAberto().id, apA); await sasNaTela(b);
  a15.aprovar(await a15.resposta(cargaAna));
  await janela(b, /Digite o PIN da sua conta/, 15000);
  await b.fill('.modal #pcPin', PIN_NOVO); await b.click('.modal #pcOk');
  conferir(await janela(b, /Falta liberar/, 30000), 'K15. aprovado, mas a família ainda não liberou para esta chave: "Falta liberar"');
  const L15 = await cadeado(b);
  conferir(L15.sk && !L15.fam.length && L15.como === 'aparelho' && L15.srv && L15.pinVersao === 2 && linhasAna().some((a) => a.id === L15.ap) && await ate(() => !linhasAna().some((a) => a.id === LK.ap)),
    'K15. mesmo em "Falta liberar": o cadeado novo já está no PIN da conta (L.srv, versão 2, o lugar novo na lista) e o lugar antigo saiu');
  await b.click('.modal #apEntendi');
  db.sol_grupo_chaves.push(...embAna);
  const r15 = await b.evaluate(async (pin) => { Cofre.trancar(); const r = await Cofre.destrancarPin(pin); return r.ok === true && Cofre.aberto(); }, PIN_NOVO);
  conferir(r15, 'K15. liberado: abre com o PIN da conta, sem "Falta só um passo"');

  /* com a pública na conta, NUNCA um par novo (com e sem o kit): nenhum caminho tocou a sol_chave_publica */
  const cc = await b.evaluate((pin) => Cofre.criarConta(pin), PIN_X);
  conferir(cc.erro === 'temPub' && JSON.stringify(db.sol_chave_publica.find((k) => k.user_id === ANA)) === pubAna && JSON.stringify(db.omni_chave_privada.find((k) => k.user_id === ANA)) === kitAna &&
    await b.evaluate(() => window.__pares) === 0, 'pública intacta (com o kit): nenhum caminho fez par novo; criar a conta com a pública na conta é recusado');
  conferir(!B.lixo.erros.length && !B.lixo.nativos.length && !B.lixo.fora.some((u) => /supabase/i.test(u)), 'celular da Ana: sem erro de script, sem diálogo nativo e nada fora do banco de mentira' + (B.lixo.erros.length ? ': ' + B.lixo.erros.join(' | ') : ''));

  /* A12: a conta nova (Cris): o PIN da conta, sem código; "Falta liberar" até alguém da família abrir; depois abre com o PIN */
  console.log('A12. A conta nova (Cris): "Crie o PIN da sua conta SolverONE", sem código para anotar');
  const C = await aparelho(browser, { nome: 'Cris', vp: 'celular', base: BASE }), c = C.p;
  await entrarOmni(c, CRIS); await quieto(c); await vigiarPares(c);
  const s12 = await senhasDaCasa(c);
  conferir(s12.status.caso === 'contaNova' && !/código de recuperação|papel com/i.test(s12.texto) && /Não tem código para anotar/.test(s12.texto), 'A12. conta nova: a tela diz que não tem código para anotar');
  await c.click('[data-act="cofre.comecar"]');
  conferir(await janela(c, /Crie o PIN da sua conta SolverONE/) && await semFila(c) && !/código de recuperação|anote|papel/i.test(await textoJanelas(c)), 'A12. "Crie o PIN da sua conta SolverONE" (sem código, sem papel)');
  await c.fill('.modal #pcP1', '111111'); await c.fill('.modal #pcP2', '111111'); await c.click('.modal #pcOk');
  conferir(await erroEm(c, 'fácil de adivinhar') && !db.sol_chave_publica.some((k) => k.user_id === CRIS), 'A12. PIN fácil recusado (nada criado)');
  await c.fill('.modal #pcP1', PIN_CRIS); await c.fill('.modal #pcP2', PIN_CRIS); await c.click('.modal #pcOk');
  conferir(await janela(c, /Falta liberar/, 40000), 'A12. a família já tem a chave e ninguém liberou ainda: "Falta liberar"');
  const pubC = db.sol_chave_publica.filter((k) => k.user_id === CRIS), lC = db.sol_aparelhos.filter((a) => a.user_id === CRIS && !a.removido_em), LC = await cadeado(c);
  conferir(pubC.length === 1 && !db.omni_chave_privada.some((k) => k.user_id === CRIS) && lC.length === 1 && lC[0].como === 'primeiro' && pinDaConta(CRIS) && pinDaConta(CRIS).versao === 1 &&
    LC.sk && !LC.fam.length && LC.ap === lC[0].id && LC.como === 'primeiro' && LC.srv && LC.pinVersao === 1 && await c.evaluate(() => window.__pares) === 1,
    'A12. a pública criada UMA vez; nada em omni_chave_privada (kit desligado); a lista com "primeiro"; o PIN da conta versão 1; o cadeado com a chave pessoal (e sem a da família ainda)');
  await c.click('.modal #apEntendi');
  /* a Ana com as Senhas da casa abertas (no celular dela): o app libera para a Cris sozinho */
  await b.evaluate(async (pin) => { if (!Cofre.aberto()) await Cofre.destrancarPin(pin); await Cofre.distribuir(true); }, PIN_NOVO);
  conferir(await ate(() => db.sol_grupo_chaves.some((k) => k.user_id === CRIS)), 'A12. a Ana com as Senhas da casa abertas libera para a Cris');
  const r12 = await c.evaluate(async (pin) => { Cofre.trancar(); const r = await Cofre.destrancarPin(pin); return r.ok === true && Cofre.aberto(); }, PIN_CRIS);
  conferir(r12 && await c.evaluate((cf) => b64FromBuf(Cofre.vfRaw) === cf, b64n(cf())), 'A12. a Cris abre com o PIN da conta e tem a mesma chave da família');
  const cc2 = await c.evaluate((pin) => Cofre.criarConta(pin), PIN_X);
  conferir(cc2.erro === 'temPub' && db.sol_chave_publica.filter((k) => k.user_id === CRIS).length === 1 && db.sol_chave_publica.find((k) => k.user_id === CRIS).chave_publica.kid === pubC[0].chave_publica.kid && await c.evaluate(() => window.__pares) === 1,
    'A12. de novo: com a pública na conta, criar é recusado (a mesma pública, nenhum par novo)');
  conferir(!C.lixo.erros.length && !C.lixo.nativos.length && !C.lixo.fora.some((u) => /supabase/i.test(u)), 'Cris: sem erro de script, sem diálogo nativo e nada fora do banco de mentira' + (C.lixo.erros.length ? ': ' + C.lixo.erros.join(' | ') : ''));
  await C.ctx.close();

  /* A1b (K21): sem outro aparelho, sem kit, sem passkey e sem outro chefe/responsável: só a explicação (nunca par novo) */
  console.log('A1b. Primeira vez sem ninguém para aprovar');
  const kitLinha = db.omni_chave_privada.find((k) => k.user_id === ANA), papeis = {};
  db.omni_chave_privada.splice(db.omni_chave_privada.indexOf(kitLinha), 1);
  linhasAna().forEach((a) => { a.removido_em = agora(); a.removido_por = ANA; });
  for (const u of [BIA, CRIS]) { const m = db.sol_grupo_membros.find((x) => x.grupo_id === GID && x.user_id === u); papeis[u] = m.papel; m.papel = 'membro'; }
  const D = await aparelho(browser, { nome: 'Ana tablet', vp: 'celular', base: BASE }), d1 = D.p;
  await entrarOmni(d1, ANA); await quieto(d1); await vigiarPares(d1);
  await senhasDaCasa(d1);
  await d1.click('[data-act="cofre.comecar"]');
  await janela(d1, /Primeira vez neste/);
  const t1b = await textoJanelas(d1);
  conferir(/Não há outro aparelho seu para aprovar/.test(t1b) && /Segurança e aparelhos → Avançado/.test(t1b) && !(await naTela(d1, '.modal #apOutro')) && !(await naTela(d1, '.modal #apFamilia')) && !(await naTela(d1, '.modal #apCodigo')),
    'A1b. ninguém para aprovar: só a explicação e onde fica o "Começar do zero" (Segurança e aparelhos → Avançado); sem botões de pedir nem código');
  const cc3 = await d1.evaluate((pin) => Cofre.criarConta(pin), PIN_X);
  conferir(cc3.erro === 'temPub' && JSON.stringify(db.sol_chave_publica.find((k) => k.user_id === ANA)) === pubAna && await d1.evaluate(() => window.__pares) === 0 && !db.omni_chave_privada.some((k) => k.user_id === ANA),
    'pública intacta (sem o kit): nenhum par novo, nem chamando a criação da conta');
  conferir(!D.lixo.erros.length && !D.lixo.nativos.length, 'A1b: sem erro de script e sem diálogo nativo' + (D.lixo.erros.length ? ': ' + D.lixo.erros.join(' | ') : ''));
  await D.ctx.close();
  db.omni_chave_privada.push(kitLinha);
  for (const u of [BIA, CRIS]) db.sol_grupo_membros.find((x) => x.grupo_id === GID && x.user_id === u).papel = papeis[u];
  conferir(JSON.stringify(db.omni_chave_privada.find((k) => k.user_id === ANA)) === kitAna, 'no fim: a cópia pelo código da Ana é a mesma do começo (nada apagou nem regravou o kit)');
  conferir(!guardouSegredo(lixosB.concat([C.lixo, D.lixo])), 'nenhum PIN no console');
  await B.ctx.close();

  /* ===================== Etapa 6: quem aprova (A), o aviso da família e o cartão do Início =====================
     Omni ↔ Omni, cada aparelho um contexto: A = o computador da Ana (entra pelo código antigo e cria o PIN da conta),
     B = um celular da Ana (aprovado pelo computador), D = o celular da Bia (o cadeado da 2.25, com a digital, ainda fora da
     lista da conta), E = outro celular da Ana (pela família). O Davi (membro) só pede, direto no banco. */
  console.log('Etapa 6. Quem aprova: a faixa, os 6 números e o PIN deste aparelho');
  for (const t of ['sol_aparelhos', 'sol_pin_conta', 'sol_aparelho_pin', 'sol_acesso_pedidos']) db[t].splice(0, db[t].length, ...db[t].filter((x) => ![ANA, BIA, DAVI].includes(x.user_id)));
  const lixos6 = [];
  const A = await aparelho(browser, { nome: 'Ana computador', vp: 'computador', base: BASE }), a = A.p; lixos6.push(A.lixo);
  await entrarOmni(a, ANA); await quieto6(a);
  await senhasDaCasa(a); await a.click('[data-act="cofre.comecar"]'); await janela(a, /Primeira vez neste/);
  await a.click('.modal #apCodigo'); await a.waitForSelector('.modal #apCod', { timeout: 8000 });
  await a.fill('.modal #apCod', PESSOAS[ANA].codigo); await a.click('.modal #apCodOk');
  await janela(a, /Crie o PIN da sua conta SolverONE/, 20000);
  await a.fill('.modal #pcP1', PIN_CONTA); await a.fill('.modal #pcP2', PIN_CONTA); await a.click('.modal #pcOk');
  await abriu(a);
  const LA = await cadeado(a);
  conferir(LA.ap && LA.como === 'kit' && LA.sk && LA.srv && LA.pinVersao === 1 && pinDaConta(ANA).versao === 1, 'preparo: o computador da Ana (código antigo, "kit") com a chave pessoal e o PIN da conta (versão 1)');
  const salvA = a.evaluate((c) => Keys.set('groq', c, { pt: 'teste', en: 'test' }).then(() => 'ok', (x) => x.message), CHAVE6);
  await a.waitForSelector('.modal #upin', { timeout: 8000 }); await a.fill('.modal #upin', PIN_CONTA); await a.click('.modal:has(#upin) [data-ok]');
  conferir(await salvA === 'ok' && (await a.evaluate(() => SolverCofre.pessoas())).includes(ANA), 'preparo: o computador guarda uma chave de IA (o PIN das chaves é o da conta)');
  const B6 = await aparelho(browser, { nome: 'Ana celular 2', vp: 'celular', base: BASE }), b6 = B6.p; lixos6.push(B6.lixo);
  await entrarOmni(b6, ANA); await quieto6(b6);

  /* A3 */
  conferir(await olhar(a) === '' && !(await naTela(a, '#apFaixa')), 'A3. sem pedido: nenhuma faixa no computador');
  await a.evaluate(() => { window.__pedir = PinUnico.pedir({}); });   /* a janela "Digite o seu PIN" (as chaves de IA) aberta */
  await a.waitForSelector('.modal #upin', { timeout: 8000 });
  await senhasDaCasa(b6); await b6.click('[data-act="cofre.comecar"]'); await janela(b6, /Primeira vez neste/);
  await b6.click('.modal #apOutro'); await b6.waitForSelector('.modal #apEsperando', { timeout: 10000 });
  const p3 = pedidoDe(ANA);
  conferir(p3 && await olhar(a) === '' && await a.evaluate(() => TelaConta.ocupada()), 'K31. com a janela "Digite o seu PIN" aberta, a faixa espera (nada do cadeado por cima de outra tela dele)');
  await a.click('.modal:has(#upin) .mf [data-x]');
  await a.evaluate(async () => { for (let i = 0; i < 80 && Cloud._polling; i++) await new Promise((r) => setTimeout(r, 100)); Aparelhos._vistos = {}; await Cloud.poll(); });
  const f3 = await a.waitForSelector('#apFaixa', { timeout: 10000 }).then(() => a.evaluate(() => document.getElementById('apFaixa').textContent), () => '');
  conferir(/Pedido de acesso: Linux · Chrome \(OmniLifeONE\) · /.test(f3) && await a.evaluate(() => document.getElementById('apFaixa').getAttribute('role') === 'alert' && !!document.querySelector('header.app #apFaixa')),
    'A3. depois do pedido, o Cloud.poll traz a faixa "🔔 Pedido de acesso: Linux · Chrome (OmniLifeONE) · …" (embaixo do cabeçalho, role alert)');
  await a.evaluate(() => { document.querySelector('#apFaixa span').__marca = 1; });
  await olhar(a); await olhar(a);
  conferir(await a.evaluate(() => (document.querySelector('#apFaixa span') || {}).__marca === 1), 'K22. nas voltas seguintes a faixa é a mesma (não é desenhada de novo: o leitor de tela não repete o aviso)');
  await verPedido(a);
  conferir(/Só aprove se este pedido é do aparelho que você está segurando agora/.test(await textoJanelas(a)) && !(await naTela(a, '#apFaixa')), 'A3. "Ver": a janela do pedido com o aviso "Só aprove se este pedido é do aparelho que você está segurando agora"');
  const sasA = await sasNaTela(a), sasB = await sasNaTela(b6);
  conferir(sasA.length === 6 && sasA === sasB && await semFila(a), 'A3. os dois aparelhos mostram os mesmos 6 números (' + sasA + ')');
  const t3x = pinDaConta(ANA).tentativas, n3x = M.log.length;
  await a.fill('.modal #apPin', '000000'); await a.click('.modal #apOk');
  conferir(await erroEm(a, 'PIN errado') && p3.estado === 'aberto' && pinDaConta(ANA).tentativas === t3x && !M.log.slice(n3x).some((x) => /sol_pin_conferir/.test(x.caminho)) && (await a.evaluate(async () => (await Cofre.local()).erros)) === 1,
    'A3. PIN errado: não aprova e não gasta tentativa da conta (confere o PIN deste aparelho, sem ir ao banco — K11)');
  await a.fill('.modal #apPin', PIN_CONTA); await a.click('.modal #apOk');
  conferir(await fechouSas(a) && /Aprovado. O outro aparelho já pode entrar com o PIN da sua conta/.test(await toasts(a)) && ['aprovado', 'usado'].includes(p3.estado),
    'A3. PIN certo: "✓ Aprovado. O outro aparelho já pode entrar com o PIN da sua conta."');

  /* A4 */
  conferir(await janela(b6, /Digite o PIN da sua conta/, 15000) && !(await temJanela(b6, /Crie o PIN/)), 'A4. o celular: "Digite o PIN da sua conta" (não pede para criar outro)');
  await b6.fill('.modal #pcPin', PIN_CONTA); await b6.click('.modal #pcOk');
  conferir(await abriu(b6), 'A4. o PIN da conta abre as Senhas da casa no celular');
  const LB6 = await cadeado(b6), lB6 = db.sol_aparelhos.find((x) => x.id === LB6.ap);
  conferir(LB6.sk && LB6.fam.join() === GID && LB6.como === 'aparelho' && LB6.srv && LB6.pinVersao === 1 && lB6 && lB6.aprovado_por === ANA && lB6.aprovado_por_ap === LA.ap &&
    p3.estado === 'usado' && p3.resposta === null && !(await temPedido(b6)),
    'A4. no celular: a chave pessoal e a da família, "aparelho", L.srv e versão 1; na lista aprovado pela Ana pelo computador (aprovado_por_ap); o pedido "usado" sem resposta; o par apagado');
  const codigo6 = await a.evaluate(async () => {
    if (!Cofre.aberto()) throw new Error('computador fechado');
    await DB.put('vault', { id: 'v-etapa6', kind: 'wifi', enc: await Vault.encObj({ title: 'Wi-Fi de mentira', password: 'senha-de-mentira-6' }), files: [], vis: 'restrito' });
    return Cofre.envelope();
  });
  await ate(() => db.omni_docs.some((x) => x.colecao === 'vault' && x.id === 'v-etapa6') && db.omni_docs.some((x) => x.colecao === 'vault' && x.id === '_em'), 15000);
  const cf6 = await b6.evaluate(async (codigo) => {
    await CloudDriver.sync();
    const v = DB.raw('vault').find((x) => x.id === 'v-etapa6'); let o = null; try { o = v && await Vault.decObj(v.enc); } catch (e) {}
    const agora = b64FromBuf(Cofre.vfRaw); Cofre.trancar();
    const em = await Cofre.abrirComCodigo(codigo);
    return { titulo: o && o.title, cf: agora, em: em && b64FromBuf(Cofre.vfRaw) };
  }, codigo6);
  conferir(cf6.titulo === 'Wi-Fi de mentira' && cf6.cf === b64n(cf()) && cf6.em === cf6.cf, 'A4. a chave da família no celular é a da família: abre o item que o computador guardou, e o envelope de emergência (_em) abre com o mesmo código');

  /* A5 */
  const rep5 = rpcs.sol_pedido_aprovar(ANA, { p_id: p3.id, p_resposta: { v: 2, iv: 'aXYtZGUtbWVudGlyYQ==', ct: 'Y3QtZGUtbWVudGlyYQ==' }, p_meu_ap: LA.ap });
  const bus5 = await rpcs.sol_pedido_buscar(ANA, { p_id: p3.id });
  conferir(rep5 === false && bus5[0].estado === 'usado' && bus5[0].resposta === null && JSON.stringify(await cadeado(b6)) === JSON.stringify(LB6), 'A5. a resposta repetida: aprovar de novo dá false; buscar de novo dá "usado" sem resposta; nada muda no celular');

  /* A6–A8 (o celular pede pelo "Esqueci o PIN": o cadeado dele fica) */
  console.log('A6–A8. Recusar (pela lista do 👤), vencer, a pública trocada');
  await tranca(b6); await senhasDaCasa(b6);
  await b6.click('#screen [data-act="cofre.esqueci"]'); await janela(b6, /Abrir sem o PIN/);
  await b6.click('.modal #apOutro'); await b6.waitForSelector('.modal #apEsperando', { timeout: 10000 });
  const p6 = pedidoDe(ANA);
  conferir(/Pedido de acesso/.test(await olhar(a)), 'A6. o computador vê o pedido do celular');
  await a.click('#apFaixa #apFaixaX');
  conferir(!(await naTela(a, '#apFaixa')) && await olhar(a, false) === '', 'K22. "✕" na faixa: ela some e não insiste nesta aba');
  await a.click('#whoami');
  const item6 = await a.waitForSelector('.whomenu button:has-text("Pedidos de acesso (1)")', { timeout: 5000 }).then(() => true, () => false);
  conferir(item6, 'K22. o pedido dispensado continua no menu do 👤: "🔔 Pedidos de acesso (1)"');
  await a.click('.whomenu button:has-text("Pedidos de acesso (1)")');
  await a.waitForSelector('.modal #apLista', { timeout: 5000 }); await a.click('.modal #apLista [data-i="0"]');
  await janela(a, /Pedido de acesso/); await a.click('.modal #apRecusar');
  conferir(await janela(b6, /Pedido recusado/, 15000) && p6.estado === 'recusado' && p6.respondido_por === ANA, 'A6. pela lista do 👤 → "Ver" → "Recusar": o celular mostra "Pedido recusado"');
  const n6 = db.sol_acesso_pedidos.filter((x) => x.user_id === ANA).length;
  await b6.click('.modal #apDeNovo'); await b6.waitForSelector('.modal #apEsperando', { timeout: 10000 });
  const p7 = pedidoDe(ANA);
  conferir(db.sol_acesso_pedidos.filter((x) => x.user_id === ANA).length === n6 + 1 && p7 && p7.id !== p6.id, 'A6. "Pedir de novo" cria outro pedido');
  conferir(/Pedido de acesso/.test(await olhar(a)), 'A7. a faixa mostra o pedido novo');
  M.relogio += 11 * 60e3;
  conferir(await janela(b6, /O pedido venceu/, 15000) && await olhar(a) === '' && !(await naTela(a, '#apFaixa')), 'A7. ninguém aprovou em 10 minutos: "O pedido venceu" no celular e a faixa some do computador');
  await b6.click('.modal #apDeNovo'); await b6.waitForSelector('.modal #apEsperando', { timeout: 10000 });
  M.ataque = 'troca';
  await olhar(a); await verPedido(a);
  const s8a = await sasNaTela(a), s8b = await sasNaTela(b6);
  M.ataque = null;
  conferir(s8a.length === 6 && s8b.length === 6 && s8a !== s8b, 'A8. o banco troca a pública do celular (e forja o compromisso): os 6 números ficam DIFERENTES nos dois aparelhos');
  await a.click('.modal #apRecusar'); await janela(b6, /Pedido recusado/, 15000);
  await b6.click('.modal #apDeNovo'); await b6.waitForSelector('.modal #apEsperando', { timeout: 10000 });
  M.ataque = 'troca-sem-compromisso';
  await olhar(a); await verPedido(a);
  const alt8 = await a.waitForSelector('.modal #apAlterado', { timeout: 20000 }).then(() => true, () => false);
  M.ataque = null;
  conferir(alt8 && !(await naTela(a, '.modal #apOk')) && !(await naTela(a, '.modal #apDig')) && /alterado no caminho/.test(await textoJanelas(a)), 'A8. o banco troca só a pública: "⚠️ Este pedido foi alterado no caminho…" e não há como aprovar');
  await a.click('.modal #apRecusar'); await janela(b6, /Pedido recusado/, 15000);
  await b6.click('.modal #apVoltar'); await janela(b6, /Abrir sem o PIN/); await b6.click('.modal #apVolta');
  conferir(JSON.stringify(await cadeado(b6)) === JSON.stringify(LB6), 'A6–A8. o cadeado do celular continua o mesmo (pedir pelo "Esqueci o PIN" não apaga nada)');

  /* A9: pela família */
  console.log('A9. Pela família: a Bia aprova o celular novo da Ana; o aviso nos aparelhos da Ana; as chaves de IA sem a janela do cofre');
  const D6 = await aparelho(browser, { nome: 'Bia', vp: 'celular', base: BASE, digital: true }), d6 = D6.p; lixos6.push(D6.lixo);
  await entrarOmni(d6, BIA);
  if (await d6.waitForSelector('.modal [data-no]', { timeout: 5000 }).then(() => true, () => false)) await d6.click('.modal [data-no]');
  await quieto6(d6);
  /* um aparelho da 2.25 (fora da lista da conta): o aoAbrir automático não o registra no meio do preparo */
  await d6.evaluate(() => { Aparelhos.__aoAbrir = Aparelhos.aoAbrir; Aparelhos.aoAbrir = () => Promise.resolve(); });
  await cadeado225(d6, BIA, PIN_BIA, true); await tranca(d6);
  await d6.evaluate(() => { Aparelhos.aoAbrir = Aparelhos.__aoAbrir; });
  const LD0 = await cadeado(d6);
  conferir(!LD0.ap && LD0.sk && LD0.fam.join() === GID && await d6.evaluate(async () => !!(await Cofre.local()).prf) && !linhasDe(BIA).length, 'preparo: o celular da Bia com o cadeado da 2.25 (e a digital), fora da lista da conta');
  const E6 = await aparelho(browser, { nome: 'Ana celular 3', vp: 'celular', base: BASE }), e6 = E6.p; lixos6.push(E6.lixo);
  await entrarOmni(e6, ANA); await quieto6(e6);
  await senhasDaCasa(e6); await e6.click('[data-act="cofre.comecar"]'); await janela(e6, /Primeira vez neste/);
  await e6.click('.modal #apFamilia'); await e6.waitForSelector('.modal #apEsperando', { timeout: 10000 });
  const p9 = pedidoDe(ANA);
  conferir(p9 && p9.grupo_id === GID && /Pedido de acesso de Ana Teste: Linux · Chrome \(OmniLifeONE\) · /.test(await olhar(d6)), 'A9. o celular novo pede "para alguém da família"; a faixa da Bia: "🔔 Pedido de acesso de Ana Teste: Linux · Chrome (OmniLifeONE) · …"');
  await verPedido(d6);
  const t9 = await textoJanelas(d6);
  conferir(/Ana Teste \(ana@teste\.com\) quer entrar na família Família Teste pelo aparelho Linux · Chrome \(OmniLifeONE\)/.test(t9) && /Só aprove se a pessoa está com você \(ou ao telefone\) e lê o mesmo número/.test(t9),
    'A9. a Bia vê quem pede (nome e e-mail), a família, o aparelho e o aviso "Só aprove se a pessoa está com você…"');
  const s9d = await sasNaTela(d6), s9e = await sasNaTela(e6);
  conferir(s9d.length === 6 && s9d === s9e, 'A9. os mesmos 6 números nos dois (' + s9d + ')');
  await d6.fill('.modal #apPin', PIN_BIA); await d6.click('.modal #apOk');
  await fechouSas(d6);
  const LD = await cadeado(d6);
  conferir(LD.ap && linhasDe(BIA).some((x) => x.id === LD.ap) && ['aprovado', 'usado'].includes(p9.estado) && p9.respondido_por === BIA && p9.respondido_por_ap === LD.ap,
    'K16. o celular da Bia, fora da lista, entrou nela ANTES de aprovar: o pedido ficou aprovado por ele (respondido_por_ap)');
  await janela(e6, /Digite o PIN da sua conta/, 15000);
  await e6.fill('.modal #pcPin', PIN_CONTA); await e6.click('.modal #pcOk');
  conferir(await abriu(e6), 'A9. o celular novo abre com o PIN da conta da Ana');
  const LE = await cadeado(e6), lE = db.sol_aparelhos.find((x) => x.id === LE.ap);
  conferir(!LE.sk && LE.fam.join() === GID && LE.como === 'familia' && lE && lE.como === 'familia' && lE.aprovado_por === BIA && lE.aprovado_por_ap === LD.ap,
    'A9. só a chave da família (sem a chave pessoal), "familia"; na lista aprovado pela Bia, pelo celular dela');
  /* G2: as chaves de IA num aparelho sem a chave pessoal */
  const salv9 = e6.evaluate((c) => Keys.set('groq', c, { pt: 'teste', en: 'test' }).then(() => 'ok', (x) => x.message), CHAVE6);
  /* a 1ª chave cria o cofre das chaves com o PIN: pede pela janela do APP ("Digite o seu PIN", a das Senhas da casa) */
  const q9 = await Promise.race([salv9, e6.waitForSelector('.modal #upin, dialog#solver-cofre[open]', { timeout: 6000 }).then(() => 'janela', () => 'nada')]);
  const app9 = q9 === 'janela' && await naTela(e6, '.modal #upin');
  if (app9) { await e6.fill('.modal #upin', PIN_CONTA); await e6.click('.modal:has(#upin) [data-ok]'); }
  const jan9 = await e6.waitForSelector('dialog#solver-cofre[open]', { timeout: 3000 }).then(() => true, () => false);
  if (jan9) await e6.keyboard.press('Escape');
  const r9 = await Promise.race([salv9, espere(5000).then(() => 'pendente')]);
  const ia9 = await e6.evaluate(async (pin) => { const sg = await PinUnico.segredo(); await SolverCofre.trancar(); const x = await SolverCofre.abrir(pin).then(() => 'abriu', (e) => e.message); return { seg: !!sg && sg.length === 32, x }; }, PIN_CONTA);
  conferir(app9 && !jan9 && r9 === 'ok' && ia9.seg && ia9.x === 'abriu', 'G2. sem a chave pessoal, o segredo vem deste aparelho: a 1ª chave de IA pede o PIN só na janela do app ("Digite o seu PIN") e fica guardada sem a janela do cofre; o PIN das chaves é o da conta');
  /* o aviso nos aparelhos da Ana */
  await a.evaluate(async () => { for (let i = 0; i < 80 && Cloud._polling; i++) await new Promise((r) => setTimeout(r, 100)); Aparelhos._voltas = 0; await Cloud.poll(); });
  const av9 = await a.waitForSelector('#apAviso', { timeout: 15000 }).then(() => a.evaluate(() => document.getElementById('apAviso').textContent), () => '');
  conferir(/Um aparelho novo entrou na sua conta: Linux · Chrome \(OmniLifeONE\), aprovado por Bia Teste · .*Não foi você\?/.test(av9) && await naTela(a, '#apAviso #apAvisoTirar') && await a.evaluate(() => document.getElementById('apAviso').getAttribute('role') === 'alert'),
    'A9. no computador da Ana (Cloud.poll → aoAbrir): "⚠️ Um aparelho novo entrou na sua conta: … aprovado por Bia Teste · …. Não foi você?" com "Tirar"');
  const avB = await b6.evaluate(async () => { await Aparelhos.aoAbrir(); const el = document.getElementById('apAviso'); return el ? el.textContent : ''; });
  const avE = await e6.evaluate(async () => { await Aparelhos.aoAbrir(); return !!document.getElementById('apAviso'); });
  conferir(/aprovado por Bia Teste/.test(avB) && !avE, 'A9. o aviso aparece também no outro celular da Ana; no próprio aparelho novo, não');
  await a.click('#apAviso #apAvisoX');
  const LA9 = await a.evaluate(async () => { await Aparelhos.aoAbrir(); return { aviso: !!document.getElementById('apAviso'), ate: (await Cofre.local()).avisosAte }; });
  conferir(!LA9.aviso && Date.parse(LA9.ate) === Date.parse(lE.criado_em), 'A9. "✕" (está certo): o aviso some e não volta (o avisosAte do cadeado avançou)');
  await b6.click('#apAviso #apAvisoTirar');
  conferir(await b6.waitForSelector('#apAviso', { state: 'detached', timeout: 10000 }).then(() => true, () => false) && !!lE.removido_em && /Aparelho tirado da sua conta/.test(await toasts(b6)), 'A10. "Tirar" no aviso (no outro celular): o aparelho novo sai da conta');

  /* A10: o aparelho tirado, ao abrir, sai */
  console.log('A10. O aparelho tirado, ao abrir com internet, sai da conta');
  const nuv = (p) => p.evaluate(async (g) => (await IDB.entries('nuvem')).filter(([k]) => k.startsWith(g + '|') && !k.includes('|vault|')).length, GID);
  const nuvE = await nuv(e6);
  await e6.reload();
  const saiuE = await saiuDaConta(e6), txtE = await toasts(e6);
  const fimE = await e6.evaluate(async (u) => ({ conta: Conta.on(), L: await IDB.get('kv', 'cofre|' + u), chaveAp: await IDB.get('kv', 'chaveAp|' + u), ia: SolverCofre.existe() }), ANA);
  conferir(saiuE && !fimE.conta && !fimE.L && !fimE.chaveAp && !fimE.ia && /foi tirado da sua conta em outro aparelho/.test(txtE) && nuvE > 0 && await nuv(e6) === nuvE,
    'A10. ao abrir, o aparelho tirado sai da conta (aviso "Este aparelho foi tirado…"): o cadeado, a chave do navegador e as chaves de IA saem; o resto da família neste aparelho fica');
  await entrarOmni(e6, ANA); await quieto6(e6);
  await e6.evaluate(() => go('home'));
  const card = await e6.waitForSelector('#inicioPasso', { timeout: 12000 }).then(() => e6.evaluate(() => document.getElementById('inicioPasso').textContent), () => '');
  conferir(/Falta um passo para as Senhas da casa neste/.test(card), 'D1. de volta, sem o cadeado aqui: o Início mostra "🔐 Falta um passo para as Senhas da casa neste …"');
  await e6.click('#inicioPasso [data-act="conta.passo"]');
  conferir(await janela(e6, /Primeira vez neste/), 'A10/D1. "Continuar" abre a tela certa: "Primeira vez neste …" (entrar de novo pede a aprovação)');
  const semCartao = await a.evaluate(async () => { await Cofre.atualizar(); go('home'); await new Promise((r) => setTimeout(r, 400)); return !document.getElementById('inicioPasso'); });
  conferir(semCartao, 'D1. no computador (já no PIN da conta) não falta passo: nenhum cartão');

  /* A9b (K2): um membro pede "para a família" */
  console.log('A9b. Um membro (Davi) pede "para a família": a Bia vê o aviso e não aprova');
  const dvp = await ladoA.par(), nBd = b64u(crypto.randomBytes(32));
  const idD = rpcs.sol_pedido_criar(DAVI, { p_nome: 'Linux · Chrome', p_app: 'omnilife', p_pub: dvp.pub, p_compromisso: compromisso(dvp.pub, nBd), p_grupo: GID });
  const pD = db.sol_acesso_pedidos.find((x) => x.id === idD);
  conferir(/Pedido de acesso de Davi Teste/.test(await olhar(d6)), 'A9b. a faixa da Bia mostra o pedido do Davi');
  await verPedido(d6);
  /* se alguém desafiar, o "aparelho do Davi" (aqui no Node) revela o nB, como faria */
  const revelou = ate(() => !!pD.pub_a, 4000).then((sim) => sim && rpcs.sol_pedido_revelar(DAVI, { p_id: idD, p_n_b: nBd }));
  const naoPode = await d6.waitForSelector('.modal #apNaoPode', { timeout: 6000 }).then(() => d6.evaluate(() => document.querySelector('.modal #apNaoPode').textContent), () => '');
  await revelou; await espere(3500);
  conferir(/Davi Teste não é chefe nem responsável desta família/.test(naoPode) && !(await naTela(d6, '.modal #apOk')) && !(await naTela(d6, '.modal #apDig')) && !(await naTela(d6, '.modal #apSas')) &&
    await naTela(d6, '.modal #apRecusar') && await naTela(d6, '.modal #apDepois') && !pD.pub_a,
    'K2. "⚠️ Davi Teste não é chefe nem responsável desta família…": sem os 6 números e sem como aprovar (nem desafiou), só "Recusar" e "Agora não"');
  await d6.click('.modal #apRecusar');
  conferir(await ate(() => pD.estado === 'recusado' && pD.respondido_por === BIA), 'A9b. "Recusar": o pedido do Davi é recusado');

  /* K3 e K22: o próprio pedido "para a família" */
  console.log('K3. A Ana aprova o próprio pedido "para a família": vai a chave pessoal (o tipo que o banco deu)');
  await e6.click('.modal #apFamilia'); await e6.waitForSelector('.modal #apEsperando', { timeout: 10000 });
  const pK = pedidoDe(ANA);
  const fa = await olhar(a), fb = await olhar(b6);
  conferir(pK.grupo_id === GID && /Pedido de acesso: Linux · Chrome/.test(fa) && /Pedido de acesso: Linux · Chrome/.test(fb), 'K3. o pedido "para a família" da própria Ana aparece nos aparelhos dela como pessoal ("Pedido de acesso: …")');
  await verPedido(a);
  await ate(() => !!pK.pub_a, 8000);
  const k22 = await b6.evaluate(async () => { Aparelhos._vistos = {}; await Aparelhos.olharPedidos(); return { faixa: !!document.getElementById('apFaixa'), todos: Aparelhos.todos.length }; });
  conferir(!k22.faixa && k22.todos === 1, 'K22. o computador já está cuidando do pedido: a faixa sai do celular (que ainda o lista no 👤)');
  const sK = await sasNaTela(a), sKe = await sasNaTela(e6);
  await a.fill('.modal #apPin', PIN_CONTA); await a.click('.modal #apOk');
  await fechouSas(a);
  conferir(sK === sKe && await janela(e6, /Digite o PIN da sua conta/, 15000), 'K3. os 6 números iguais; aprovado, a resposta abriu no celular ("Digite o PIN da sua conta")');
  await e6.fill('.modal #pcPin', PIN_CONTA); await e6.click('.modal #pcOk');
  await abriu(e6);
  const LK3 = await cadeado(e6), lK3 = db.sol_aparelhos.find((x) => x.id === LK3.ap);
  conferir(pK.tipo_resposta === 'pessoal' && LK3.sk && LK3.como === 'aparelho' && lK3 && lK3.como === 'aparelho' && lK3.aprovado_por_ap === LA.ap, 'K3. a carga foi a pessoal: o celular tem a chave pessoal e entrou como "aparelho"');
  const semCartaoE = await e6.evaluate(async () => { go('home'); await new Promise((r) => setTimeout(r, 400)); return !document.getElementById('inicioPasso'); });
  conferir(semCartaoE, 'D1. com o cadeado aqui, o cartão do Início some');

  /* B5: desbloqueio da espera de 24 h pela aprovação e "Não lembro" */
  console.log('B5. 24 h de espera na conta: "Esqueci o PIN", o computador aprova com o PIN dele, "Não lembro"');
  const pc = pinDaConta(ANA); pc.tentativas = 10; pc.espera_ate = M.relogio + 24 * 3600e3;
  await tranca(b6); await b6.evaluate(() => { Pin.limpar(); Jornada.limpar(); });
  const s5 = await senhasDaCasa(b6);
  conferir(/tente de novo em 24 h/.test(s5.texto), 'B5. a conta em espera de 24 h (10 erros): o card do celular diz "… tente de novo em 24 h …"');
  await b6.click('#screen [data-act="cofre.esqueci"]'); await janela(b6, /Abrir sem o PIN/);
  await b6.click('.modal #apOutro'); await b6.waitForSelector('.modal #apEsperando', { timeout: 10000 });
  await olhar(a); await verPedido(a);
  const s5a = await sasNaTela(a), s5b = await sasNaTela(b6);
  await a.fill('.modal #apPin', PIN_CONTA); await a.click('.modal #apOk');
  conferir(s5a === s5b && await fechouSas(a) && /Aprovado/.test(await toasts(a)) && pc.tentativas === 10, 'B5. com a conta em espera, o computador aprova pelo PIN deste aparelho (sem ir ao banco)');
  await janela(b6, /Digite o PIN da sua conta/, 15000);
  await b6.fill('.modal #pcPin', PIN_CONTA); await b6.click('.modal #pcOk');
  conferir(await erroEm(b6, '24 h'), 'B5. o PIN da conta ainda espera 24 h ("Digite o PIN da sua conta" avisa)');
  await b6.click('.modal #pcNaoLembro'); await b6.waitForSelector('.modal #pcP1', { timeout: 8000 });
  await b6.fill('.modal #pcP1', PIN_X); await b6.fill('.modal #pcP2', PIN_X); await b6.click('.modal #pcOk');
  conferir(await abriu(b6), 'B5. "Não lembro": o PIN novo abre as Senhas da casa');
  const LB5 = await cadeado(b6);
  conferir(pc.versao === 2 && pc.tentativas === 0 && !pc.espera_ate && LB5.pinVersao === 2 && LB5.ap !== LB6.ap && linhasDe(ANA).some((x) => x.id === LB5.ap) && await ate(() => !linhasDe(ANA).some((x) => x.id === LB6.ap)),
    'B5. o PIN novo (versão 2), sem espera e com as tentativas zeradas; o lugar antigo do celular saiu da lista e ficou o novo');

  /* A3b (K11): o PIN mudou em outro aparelho */
  console.log('A3b. O PIN da conta mudou em outro aparelho: o computador aprova com o PIN novo e passa para ele');
  const t3b = pc.tentativas;
  await tranca(e6); await senhasDaCasa(e6);
  await e6.click('#screen [data-act="cofre.esqueci"]'); await janela(e6, /Abrir sem o PIN/);
  await e6.click('.modal #apOutro'); await e6.waitForSelector('.modal #apEsperando', { timeout: 10000 });
  await olhar(a); await verPedido(a);
  await sasNaTela(a); await sasNaTela(e6);
  await a.fill('.modal #apPin', PIN_X); await a.click('.modal #apOk');
  const ok3b = await fechouSas(a) && /Aprovado/.test(await toasts(a));
  const LA3b = await cadeado(a);
  const g3b = await a.evaluate(async (x) => {
    const novo = await Cofre.conferirPin(x.novo), velho = await Cofre.conferirPin(x.velho);
    await SolverCofre.trancar(); const ia = await SolverCofre.abrir(x.novo).then(() => 'abriu', (e) => e.message);
    await SolverCofre.trancar(); const iaV = await SolverCofre.abrir(x.velho).then(() => 'abriu', (e) => e.message);
    return { novo: novo.ok === true, velho: velho.erro, ia, iaV };
  }, { novo: PIN_X, velho: PIN_CONTA });
  conferir(ok3b && LA3b.pinVersao === 2 && LA3b.ct !== LA.ct && g3b.novo && g3b.velho === 'pin' && pc.tentativas === t3b, 'A3b. aprovado com o PIN novo: o PIN deste computador foi refeito (versão 2; o velho não abre mais), sem gastar tentativa');
  conferir(g3b.ia === 'abriu' && g3b.iaV === 'pin-errado', 'A3b (G1). as chaves de IA do computador passaram para o PIN novo');
  await janela(e6, /Digite o PIN da sua conta/, 15000);
  await e6.fill('.modal #pcPin', PIN_X); await e6.click('.modal #pcOk');
  conferir(await abriu(e6), 'A3b. o celular aprovado abre com o PIN novo da conta');

  /* A11: tirado, o PIN certo não abre */
  console.log('A11. O computador tira o celular da conta; o PIN certo não abre nada lá');
  await b6.evaluate(() => { Aparelhos.aoAbrir = () => Promise.resolve(); });   /* só o caminho do PIN (sem a volta do aoAbrir no meio) */
  await a.evaluate((ap) => Sol.apTirar(ap), LB5.ap);
  await tranca(b6); await vigiarAbertura(b6);
  const n11 = M.log.length;
  await senhasDaCasa(b6); await b6.waitForSelector('#cfpin', { timeout: 10000 });
  await b6.fill('#cfpin', PIN_X); await b6.click('[data-act="cofre.pin"]');
  const saiu11 = await saiuDaConta(b6);
  const fim11 = await b6.evaluate(async (u) => ({ abriu: window.__abriu, conta: Conta.on(), L: await IDB.get('kv', 'cofre|' + u) }), ANA);
  conferir(saiu11 && fim11.abriu === 0 && !fim11.conta && !fim11.L && M.log.slice(n11).some((x) => /sol_pin_conferir/.test(x.caminho)) && !linhasDe(ANA).some((x) => x.id === LB5.ap),
    'A11. tirado pelo computador: o PIN certo não abre nada no celular (o banco diz "aparelho"; não cai para o PIN deste aparelho), o cadeado sai e a conta sai dali');

  /* K9: aprovar com a digital num aparelho já tirado */
  console.log('K9. A Bia, tirada da conta em outro aparelho, toca "Aprovar com a digital"');
  await tranca(e6); await senhasDaCasa(e6);
  await e6.click('#screen [data-act="cofre.esqueci"]'); await janela(e6, /Abrir sem o PIN/);
  await e6.click('.modal #apFamilia'); await e6.waitForSelector('.modal #apEsperando', { timeout: 10000 });
  const p9k = pedidoDe(ANA);
  await olhar(d6); await verPedido(d6); await sasNaTela(d6);
  conferir(await naTela(d6, '.modal #apDig'), 'K9. preparo: o celular da Bia (com a digital) mostra "👆 Aprovar com a digital"');
  await d6.evaluate(() => { Aparelhos.aoAbrir = () => Promise.resolve(); });   /* só o caminho da aprovação (sem a volta do aoAbrir no meio) */
  rpcs.sol_aparelho_tirar(BIA, { p_id: LD.ap });
  await d6.click('.modal #apDig');
  const saiuD = await saiuDaConta(d6);
  const fimD = await d6.evaluate(async (u) => ({ conta: Conta.on(), L: await IDB.get('kv', 'cofre|' + u) }), BIA);
  conferir(saiuD && !fimD.conta && !fimD.L && p9k.estado === 'aberto' && !p9k.respondido_por, 'K9. a digital confirmou, mas o aparelho foi tirado: nada foi aprovado, o cadeado sai e a conta sai deste celular');
  await e6.click('.modal #apCancelar');

  const sujos = lixos6.filter((l) => l.erros.length || l.nativos.length || l.fora.some((u) => /supabase/i.test(u)));
  conferir(!sujos.length, 'etapa 6: sem erro de script, sem diálogo nativo e nada fora do banco de mentira' + (sujos.length ? ': ' + sujos.map((l) => l.erros.concat(l.nativos).join(' | ')).join(' || ') : ''));
  conferir(!guardouSegredo(lixos6), 'etapa 6: nenhum PIN no console');
  for (const x of [A, B6, D6, E6]) await x.ctx.close();

  await terminar(falhas, browser, 'aparelhos da conta — a fumaça do banco de mentira; o aparelho novo pede e entra sem código (os 6 números fixados, Cancelar recusa, nenhuma linha órfã, "Esqueci o PIN" sem perder o cadeado, o código antigo como "kit") e a conta nova sem código, sem par novo quando a conta já tem a pública; quem aprova (a faixa, os 6 números, o PIN deste aparelho, a família só de chefe/responsável, a carga pelo tipo, o aviso da família, o tirado sai) e o cartão do Início.');
})().catch((e) => { console.error('Erro no teste:', e.message); process.exit(1); });
