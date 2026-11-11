/* =====================================================================
   teste/mock-sol.js — o "Supabase de mentira" dos testes de nuvem do OmniLifeONE (2.26.0), em memória.
   ---------------------------------------------------------------------
   Mora no processo do Node: cada aparelho do teste (um contexto do navegador) fala com o MESMO banco, pelo
   ctx.route (ver teste/_nuvem.js). Nunca fala com o Supabase de verdade e nunca cria conta na produção.
   Porta do teste/mock-sol.js do MoneyTRIO 3.64 (mesma API: SB, M, db, rpcs, supabase, prepararChaves, PESSOAS, ANA, BIA,
   GID, compromisso, agora, b64u) com o que o OmniLifeONE usa hoje:
     · entrar e sair (auth/v1: token por senha e renovação, user, logout) e o registro de acesso (functions/v1);
     · a família (sol_grupos, sol_grupo_membros, sol_grupo_convites, omni_familia, omni_cofre_liberado, sol_meus_grupos);
     · os registros (omni_docs com versão e apagado_em, omni_combinados, omni_aparelhos, omni_governanca, omni_historico,
       omni_convite_info, omni_pedidos_entrada, omni_mudar_campos);
     · as Senhas da casa (sol_chave_publica, sol_chaves_publicas_do_grupo, sol_guardar_chave_grupo, sol_minha_chave_grupo,
       sol_publicar_minha_chave, omni_chave_privada com DELETE) e a ponte (sol_ponte_enviar).
   As regras seguem os SQL de verdade: omnilife-one-v1.sql e 2026-10-23-grants-explicitos.sql (GRANT e RLS, de forma
   simples), a base da plataforma (rootify-one) e, para aparelhos, pedidos, passkeys e PIN da conta, os do MoneyTRIO
   (supabase/2026-11-07-sol-aparelhos.sql e 2026-11-11-sol-pin-conta.sql). As tabelas novas da plataforma (sol_aparelhos,
   sol_acesso_pedidos, sol_passkeys, sol_pin_conta, sol_aparelho_pin) dão 404 por REST: só pelas funções, como no banco.
   Controles para o teste (objeto M): relogio (hora do banco; somar minutos faz o pedido vencer), ataque ("troca",
   "troca-sem-compromisso", "troca-depois", "troca-tarde" com TARDE = {pub, c, n}, "tipo-pessoal"), falhar ({nome da função: quantas vezes}
   ela responde 503, como uma queda da rede no meio), semPin / semAp (as funções do PIN / dos aparelhos "não existem" no banco),
   semDelete (o GRANT de hoje: apagar omni_chave_privada dá 403 42501), banidas ({uid: true}: a renovação da sessão
   responde "user_banned", como o Supabase para conta bloqueada), atrasoLogout (ms: o logout demora a responder; a hora da
   resposta fica em logoutRespondido — para conferir que o "Sair" espera o servidor antes de recarregar), log (toda chamada
   recebida) e acessos.
   PESSOAS, SENHAS, CÓDIGOS E CHAVES: TUDO FICTÍCIO, feito só para teste (nada de dado de gente de verdade).
   ===================================================================== */
'use strict';
const crypto = require('crypto');
const subtle = crypto.webcrypto.subtle;
const SB = 'https://qvdvkqydhnadhewcidia.supabase.co';
const b64 = (b) => Buffer.from(b).toString('base64');
const b64u = (b) => Buffer.from(b).toString('base64url');
const unb64 = (s) => new Uint8Array(Buffer.from(s, 'base64'));
const utf8 = (s) => new TextEncoder().encode(s);
const normCode = (s) => String(s || '').toUpperCase().replace(/[^A-Z0-9]/g, '').replace(/(.{5})(?=.)/g, '$1-');

/* ---------------- a família de mentira (pessoas fictícias) ---------------- */
const GID = '22222222-2222-2222-2222-222222222222';
const ANA = '11111111-1111-1111-1111-111111111111', BIA = '44444444-4444-4444-4444-444444444444';
const CRIS = '55555555-5555-5555-5555-555555555555', DAVI = '66666666-6666-6666-6666-666666666666';
/* Ana chefe; Bia responsável; Cris responsável que ainda não tem chaves (conta nova nas Senhas da casa: o prepararChaves
   pula a Cris, a não ser que o teste peça); Davi membro adulto. O "codigo" é o código de recuperação de mentira (papel)
   de quem tem a cópia em omni_chave_privada. */
const PESSOAS = {
  [ANA]: { email: 'ana@teste.com', senha: 'senha-de-teste-1', nome: 'Ana Teste', papel: 'chefe', perfil: 'p-ana', codigo: 'KQ7PZ-3MXWD-H8RTA-2BCNE' },
  [BIA]: { email: 'bia@teste.com', senha: 'senha-de-teste-2', nome: 'Bia Teste', papel: 'responsavel', perfil: 'p-bia', codigo: 'ZX9QW-4RTYU-PLMNB-7VCXE' },
  [CRIS]: { email: 'cris@teste.com', senha: 'senha-de-teste-3', nome: 'Cris Teste', papel: 'responsavel', perfil: 'p-cris', codigo: 'MN4BV-8CXZL-K7JHG-5FDSA' },
  [DAVI]: { email: 'davi@teste.com', senha: 'senha-de-teste-4', nome: 'Davi Teste', papel: 'membro', perfil: 'p-davi', codigo: null } };

/* M.relogio = a hora do banco. Anda junto com o relógio de verdade (o app compara com o relógio do navegador); o teste
   pode adiantar (M.relogio += 11 * 60e3) para um pedido vencer. */
const M = {
  _desvio: 0, get relogio() { return Date.now() + this._desvio; }, set relogio(v) { this._desvio = v - Date.now(); },
  ataque: null, ATACANTE: null, TARDE: null, falhar: {}, semPin: false, semAp: false, semDelete: false, banidas: {}, atrasoLogout: 0, logoutRespondido: 0, log: [], acessos: [] };
let _ultimo = 0;
/* hora do banco em texto; sempre crescente (o cursor do omni_docs depende da ordem de atualizado_em) */
const agora = () => { _ultimo = Math.max(M.relogio, _ultimo + 1); return new Date(_ultimo).toISOString(); };
const uuid = () => crypto.randomUUID();
let CF_RAW = null;   /* a CF (chave das Senhas da casa) da família de mentira, feita no prepararChaves */

const db = {
  /* plataforma (base) */
  sol_grupos: [{ id: GID, tipo: 'familia', nome: 'Família Teste', criado_por: ANA, criado_em: '2026-10-01T12:00:00.000Z', encerrado_em: null, governanca: 'omnilife-one', dono: ANA }],
  sol_grupo_membros: Object.keys(PESSOAS).map((u, i) => ({ id: uuid(), grupo_id: GID, user_id: u, perfil_id: PESSOAS[u].perfil, apelido: PESSOAS[u].nome, papel: PESSOAS[u].papel,
    status: 'ativo', convidado_por: u === ANA ? null : ANA, entrou_em: '2026-10-0' + (i + 1) + 'T12:00:00.000Z', saiu_em: null })),
  sol_grupo_convites: [], sol_chave_publica: [], sol_grupo_chaves: [], sol_ponte: [],
  /* plataforma (aparelhos, pedidos, passkeys e PIN da conta: só pelas funções) */
  sol_aparelhos: [], sol_acesso_pedidos: [], sol_passkeys: [], sol_pin_conta: [], sol_aparelho_pin: [],
  /* OmniLifeONE */
  omni_familia: [{ grupo_id: GID, dono: ANA, aprovacoes: 1, convite_horas: 72, em_espera_dias: 2, em_contatos: [], idade_adulto: 18, criado_por: ANA, criado_em: '2026-10-01T12:00:00.000Z', atualizado_em: '2026-10-01T12:00:00.000Z' }],
  omni_docs: [], omni_combinados: [], omni_historico: [], omni_governanca: [], omni_cofre_liberado: [], omni_aparelhos: [],
  omni_pedidos_entrada: [], omni_pedidos_verificacao: [], omni_convite_info: [], omni_chave_privada: [],
  /* MoneyTRIO (o mesmo banco serve o teste cruzado) */
  money_docs: [], user_settings: [] };
/* não existem por REST (o app só chega nelas pelas funções), mesmo estando aqui para o teste conferir */
const SO_FUNCOES = ['sol_aparelhos', 'sol_acesso_pedidos', 'sol_passkeys', 'sol_pin_conta', 'sol_aparelho_pin', 'sol_grupo_chaves', 'sol_ponte'];
/* o que o papel "authenticated" pode fazer em cada tabela (2026-10-23-grants-explicitos.sql): G ler, P criar, U mudar, D apagar */
const GRANT = { sol_grupos: 'G', sol_grupo_membros: 'G', sol_grupo_convites: 'G', sol_chave_publica: 'G',
  omni_familia: 'G', omni_docs: 'GPU', omni_combinados: 'GP', omni_historico: 'GP', omni_governanca: 'G', omni_cofre_liberado: 'G',
  omni_aparelhos: 'GPUD', omni_pedidos_entrada: 'G', omni_pedidos_verificacao: 'G', omni_convite_info: 'G', omni_chave_privada: 'GPUD',
  money_docs: 'GPU', user_settings: 'GPU' };
/* chave primária de cada tabela (POST repetido: 409, ou junta com resolution=merge-duplicates) */
const CHAVE = { omni_docs: ['grupo_id', 'colecao', 'id'], money_docs: ['grupo_id', 'colecao', 'id'], omni_combinados: ['grupo_id', 'id'], omni_aparelhos: ['grupo_id', 'id'],
  omni_chave_privada: ['user_id'], user_settings: ['user_id'], omni_familia: ['grupo_id'], omni_cofre_liberado: ['grupo_id', 'user_id'] };

/* ---------------- papel de cada um (as funções omni_sou_* / sol_sou_* do banco) ---------------- */
const papel = (me, g) => { const m = db.sol_grupo_membros.find((x) => x.grupo_id === g && x.user_id === me && x.status === 'ativo'); return m ? m.papel : null; };
const membro = (me, g) => !!papel(me, g);
const resp = (me, g) => ['chefe', 'responsavel'].includes(papel(me, g));
const chefe = (me, g) => papel(me, g) === 'chefe';
const adulto = (me, g) => !!papel(me, g) && papel(me, g) !== 'crianca';
const liberado = (me, g) => db.omni_cofre_liberado.some((x) => x.grupo_id === g && x.user_id === me);
const daCrianca = ['tasks', 'shop', 'items', 'msgs', 'reminders', 'files', 'checkins'];
const docOk = (me, r) => membro(me, r.grupo_id) && (r.vis === 'publico' || resp(me, r.grupo_id)) &&
  (r.colecao === 'vault' ? resp(me, r.grupo_id) : r.colecao === 'requests' ? true : adulto(me, r.grupo_id) || daCrianca.includes(r.colecao));
/* RLS de forma simples (omnilife-one-v1.sql, seção 4, e a base): ver = SELECT; criar = INSERT; mudar = UPDATE; apagar = DELETE */
const RLS = {
  sol_grupos: { ver: (me, r) => membro(me, r.id) },
  sol_grupo_membros: { ver: (me, r) => membro(me, r.grupo_id) },
  sol_grupo_convites: { ver: (me, r) => resp(me, r.grupo_id) },
  sol_chave_publica: { ver: (me, r) => r.user_id === me || db.sol_grupo_membros.some((b) => b.user_id === r.user_id && b.status === 'ativo' && membro(me, b.grupo_id)) },
  omni_familia: { ver: (me, r) => membro(me, r.grupo_id) },
  omni_docs: { ver: (me, r) => membro(me, r.grupo_id) && (r.colecao === 'vault' ? resp(me, r.grupo_id) || liberado(me, r.grupo_id) : r.vis === 'publico' || resp(me, r.grupo_id)),
    criar: docOk, mudar: docOk },
  omni_combinados: { ver: (me, r) => membro(me, r.grupo_id) && (r.vis !== 'restrito' || resp(me, r.grupo_id)), criar: (me, r) => adulto(me, r.grupo_id) && (r.vis !== 'restrito' || resp(me, r.grupo_id)) },
  omni_historico: { ver: (me, r) => resp(me, r.grupo_id), criar: (me, r) => membro(me, r.grupo_id) },
  omni_governanca: { ver: (me, r) => membro(me, r.grupo_id) },
  omni_cofre_liberado: { ver: (me, r) => r.user_id === me || resp(me, r.grupo_id) },
  omni_aparelhos: { ver: (me, r) => resp(me, r.grupo_id) || (membro(me, r.grupo_id) && r.user_id === me), criar: (me, r) => membro(me, r.grupo_id) && r.user_id === me,
    mudar: (me, r) => chefe(me, r.grupo_id) || (membro(me, r.grupo_id) && r.user_id === me), apagar: (me, r) => chefe(me, r.grupo_id) },
  omni_pedidos_entrada: { ver: (me, r) => r.user_id === me || resp(me, r.grupo_id) },
  omni_pedidos_verificacao: { ver: (me, r) => r.user_id === me },
  omni_convite_info: { ver: (me, r) => resp(me, r.grupo_id) },
  omni_chave_privada: { ver: (me, r) => r.user_id === me, criar: (me, r) => r.user_id === me, mudar: (me, r) => r.user_id === me, apagar: (me, r) => r.user_id === me }
};
const pode = (t, acao, me, r) => { const f = (RLS[t] || {})[acao]; return f ? !!f(me, r) : true; };

/* ---------------- entrar: sessões (o logout derruba a renovação daquela sessão) ---------------- */
const SESSOES = {};   /* refresh_token → { uid, id, saiu } */
let nSessao = 0;
const usuario = (uid) => ({ id: uid, email: PESSOAS[uid].email, user_metadata: { full_name: PESSOAS[uid].nome } });
function jwt(uid, sid) { return 'h.' + b64u(JSON.stringify({ sub: uid, email: PESSOAS[uid].email, exp: 9999999999, session_id: sid, user_metadata: { full_name: PESSOAS[uid].nome } })) + '.s'; }
function sessao(uid, refresh) {
  if (!refresh) { refresh = 'r-' + uid + '-' + (++nSessao); SESSOES[refresh] = { uid, id: 'sessao-' + nSessao, saiu: false }; }
  return { access_token: jwt(uid, SESSOES[refresh].id), token_type: 'bearer', expires_in: 3600, refresh_token: refresh, user: usuario(uid) };
}
function lerToken(req) { const a = req.headers()['authorization'] || ''; try { return JSON.parse(Buffer.from(a.replace(/^Bearer /, '').split('.')[1], 'base64url').toString()); } catch (e) { return null; } }
function quem(req) { const t = lerToken(req); return t && PESSOAS[t.sub] ? t.sub : null; }

/* ---------------- PostgREST: filtros, ordem, colunas ---------------- */
const RESERVADOS = ['select', 'order', 'limit', 'offset', 'on_conflict', 'columns'];
const comparar = (a, b) => (/^-?\d+(\.\d+)?$/.test(a) && /^-?\d+(\.\d+)?$/.test(b) ? +a - +b : a < b ? -1 : a > b ? 1 : 0);
function filtrar(linhas, params) {
  return linhas.filter((r) => { for (const [k, v] of params) { if (RESERVADOS.includes(k)) continue;
    const i = v.indexOf('.'), op = v.slice(0, i), val = v.slice(i + 1), x = r[k];
    const s = x == null ? null : typeof x === 'object' ? JSON.stringify(x) : String(x);
    if (op === 'eq' && s !== val) return false; if (op === 'neq' && s === val) return false;
    if (op === 'gt' && !(s != null && comparar(s, val) > 0)) return false; if (op === 'gte' && !(s != null && comparar(s, val) >= 0)) return false;
    if (op === 'lt' && !(s != null && comparar(s, val) < 0)) return false; if (op === 'lte' && !(s != null && comparar(s, val) <= 0)) return false;
    if (op === 'is' && (val === 'null' ? x != null : String(x) !== val)) return false;
    if (op === 'in' && !val.replace(/^\(|\)$/g, '').split(',').includes(s)) return false; } return true; });
}
function escolher(linhas, params) {
  let out = linhas.slice();
  const ord = params.get('order');
  if (ord) {
    const cs = ord.split(',').map((c) => { const [col, dir] = c.split('.'); return [col, dir === 'desc' ? -1 : 1]; });
    out.sort((a, b) => { for (const [c, d] of cs) { const x = a[c], y = b[c]; if (x === y) continue; if (x == null) return 1; if (y == null) return -1; return (x < y ? -1 : 1) * d; } return 0; });
  }
  const off = +(params.get('offset') || 0); out = out.slice(off, off + (params.get('limit') ? +params.get('limit') : 1000));
  const sel = params.get('select');
  return JSON.parse(JSON.stringify(sel && sel !== '*' ? out.map((r) => Object.fromEntries(sel.split(',').map((c) => [c, r[c] === undefined ? null : r[c]]))) : out));
}
/* os gatilhos do banco: carimbos, versão do omni_docs, histórico e aparelho desconectado */
let seqHist = 0;
function gatilho(t, r, me, antes) {
  const h = agora();
  if (t === 'omni_docs' || t === 'money_docs') {
    if (!antes) Object.assign(r, { versao: 1, criado_por: me, criado_em: h, atualizado_por: me, atualizado_em: h, apagado_em: r.apagado_em ? h : null });
    else Object.assign(r, { versao: antes.versao + 1, criado_por: antes.criado_por, criado_em: antes.criado_em, atualizado_por: me, atualizado_em: h,
      apagado_em: r.apagado_em && !antes.apagado_em ? h : r.apagado_em || null });
    return;
  }
  if (t === 'omni_historico') { const m = db.sol_grupo_membros.find((x) => x.grupo_id === r.grupo_id && x.user_id === me && x.status === 'ativo'); Object.assign(r, { id: ++seqHist, criado_por: me, nome: (m && m.apelido) || r.nome || null, criado_em: h, atualizado_em: h }); return; }
  if (!antes) { r.criado_por = me; r.criado_em = h; } else { r.criado_por = antes.criado_por; r.criado_em = antes.criado_em; }
  r.atualizado_em = h;
  if (t === 'omni_aparelhos') {
    if (!antes) Object.assign(r, { desconectado: false, desconectado_por: null, desconectado_em: null });
    else if (r.desconectado && !antes.desconectado) Object.assign(r, { desconectado_por: me, desconectado_em: h });
  }
}

/* ---------------- protocolo de aparelhos (as mesmas contas do SolProto e do nuvem.js) ---------------- */
/* o atacante usa para forjar o compromisso */
const compromisso = (pub, n) => b64u(crypto.createHash('sha256').update(['sol-ap-v2', 'c', pub.x + '.' + pub.y, n].join('|')).digest());
const posso = (p, me) => p.user_id === me ? 'pessoal' : p.grupo_id && resp(me, p.grupo_id) ? 'familia' : null;
function limpar() {
  const t = new Date(M.relogio).toISOString();
  db.sol_acesso_pedidos.forEach((p) => { if (p.expira_em <= t) { p.resposta = null; if (p.estado === 'aberto') p.estado = 'vencido'; } });
}
const aberto = (p) => p.estado === 'aberto' && p.expira_em > new Date(M.relogio).toISOString();
const erro = (message, st, code) => ({ st: st || 400, o: { code: code || 'P0001', message } });
/* "troca-depois" (K1): o banco mal-intencionado devolve, na linha "aprovado", OUTRA pub_a/n_a e uma resposta fechada por ele
   para a pública de B (ele conhece nB, já revelado). Um B que confiasse nessa linha abriria e montaria a chave do atacante. */
async function respostaDoAtacante(p) {
  const a = M.ATACANTE;
  const pubB = await subtle.importKey('jwk', { kty: 'EC', crv: 'P-256', x: p.pub.x, y: p.pub.y, ext: true }, { name: 'ECDH', namedCurve: 'P-256' }, false, []);
  const bits = await subtle.deriveBits({ name: 'ECDH', public: pubB }, a.priv, 256);
  const base = await subtle.importKey('raw', bits, 'HKDF', false, ['deriveKey']);
  const k = await subtle.deriveKey({ name: 'HKDF', hash: 'SHA-256', salt: new Uint8Array(32), info: utf8(['sol-ap-v2', p.id, p.user_id, a.n, p.n_b].join('|')) }, base, { name: 'AES-GCM', length: 256 }, false, ['encrypt']);
  const reg = (db.omni_docs.find((d) => d.grupo_id === p.grupo_id && d.colecao === 'settings' && d.id === 'cofre') || {}).dados || {};
  const carga = p.tipo_resposta === 'familia' ? { v: 2, tipo: 'familia', gid: p.grupo_id, kv: reg.kv || 1, fk: reg.fk || 'fk-teste', cf: b64(a.cf) } : { v: 2, tipo: 'pessoal', sk: b64(a.pkcs8) };
  const iv = crypto.webcrypto.getRandomValues(new Uint8Array(12));
  return { v: 2, iv: b64(iv), ct: b64(await subtle.encrypt({ name: 'AES-GCM', iv, additionalData: utf8(p.id) }, k, utf8(JSON.stringify(carga)))) };
}

/* ---------------- funções do banco (RPC). (me, corpo) → resultado; lança erro(...) como o RAISE do SQL ---------------- */
const rpcs = {
  minha_conta_encerrada: () => false, sol_registrar_uso: () => true,
  sol_meus_grupos: (me) => db.sol_grupo_membros.filter((m) => m.user_id === me && m.status === 'ativo').map((m) => [m, db.sol_grupos.find((g) => g.id === m.grupo_id && !g.encerrado_em)])
    .filter(([, g]) => g).map(([m, g]) => ({ grupo_id: g.id, tipo: g.tipo, nome: g.nome, meu_papel: m.papel, membros: db.sol_grupo_membros.filter((x) => x.grupo_id === g.id && x.status === 'ativo').length,
      criado_em: g.criado_em, governanca: g.governanca, sou_dono: g.dono === me })),
  /* Senhas da casa: a chave pública de cada um e a CF embrulhada para cada chefe/responsável (base da plataforma, C7) */
  sol_publicar_minha_chave: (me, c) => {
    if (!c.p_chave_publica || typeof c.p_chave_publica !== 'object' || 'd' in c.p_chave_publica) throw erro('Envie só a chave PÚBLICA (JWK sem o campo "d")', 400, '23514');
    const ja = db.sol_chave_publica.find((k) => k.user_id === me), h = agora();
    if (ja) Object.assign(ja, { algoritmo: c.p_algoritmo || 'RSA-OAEP-256', chave_publica: c.p_chave_publica, atualizado_em: h });
    else db.sol_chave_publica.push({ user_id: me, algoritmo: c.p_algoritmo || 'RSA-OAEP-256', chave_publica: c.p_chave_publica, criado_em: h, atualizado_em: h });
    return true;
  },
  sol_chaves_publicas_do_grupo: (me, c) => {
    if (!membro(me, c.p_grupo)) throw erro('Só membros do grupo', 403, '42501');
    return db.sol_grupo_membros.filter((m) => m.grupo_id === c.p_grupo && m.status === 'ativo' && m.user_id).map((m) => {
      const k = db.sol_chave_publica.find((x) => x.user_id === m.user_id), vs = db.sol_grupo_chaves.filter((x) => x.grupo_id === c.p_grupo && x.user_id === m.user_id).map((x) => x.versao);
      return { membro_id: m.id, user_id: m.user_id, apelido: m.apelido, papel: m.papel, algoritmo: k ? k.algoritmo : null, chave_publica: k ? k.chave_publica : null, ultima_versao: vs.length ? Math.max(...vs) : null };
    });
  },
  sol_guardar_chave_grupo: (me, c) => {
    if (!(resp(me, c.p_grupo) || (c.p_user === me && membro(me, c.p_grupo)))) throw erro('Só um responsável guarda a chave para outro membro', 403, '42501');
    if (!membro(c.p_user, c.p_grupo)) throw erro('Essa pessoa não é membro ativo do grupo', 400, '23514');
    const v = c.p_versao || 1;
    if (db.sol_grupo_chaves.some((x) => x.grupo_id === c.p_grupo && x.user_id === c.p_user && x.versao === v)) return false;
    db.sol_grupo_chaves.push({ grupo_id: c.p_grupo, user_id: c.p_user, versao: v, chave_embrulhada: c.p_chave_embrulhada, embrulhada_por: me, criado_em: agora() });
    return true;
  },
  sol_minha_chave_grupo: (me, c) => membro(me, c.p_grupo) ? db.sol_grupo_chaves.filter((x) => x.grupo_id === c.p_grupo && x.user_id === me).sort((a, b) => b.versao - a.versao)
    .map((x) => ({ versao: x.versao, chave_embrulhada: x.chave_embrulhada, embrulhada_por: x.embrulhada_por, criado_em: x.criado_em })) : [],
  /* ponte entre apps: guarda (a caixa do MoneyTRIO continua vazia, como no mock dele) */
  sol_ponte_enviar: (me, c) => {
    if (c.p_grupo && !membro(me, c.p_grupo)) throw erro('Só membros do grupo enviam para o grupo', 403, '42501');
    const id = uuid(); db.sol_ponte.push({ id, de_app: c.p_de, para_app: c.p_para, tipo: c.p_tipo, grupo_id: c.p_grupo || null, user_id: me, dados: c.p_dados || {}, criado_em: agora(), lido_em: null }); return id;
  },
  sol_ponte_minha_caixa: () => [], sol_ponte_marcar_lido: () => true,
  /* registro do app: junta só os campos mandados (omni_jsonb_mesclar: null tira o campo; objeto dentro de objeto junta) */
  omni_mudar_campos: (me, c) => {
    const r = db.omni_docs.find((d) => d.grupo_id === c.p_grupo && d.colecao === c.p_colecao && d.id === c.p_id && d.dados);
    if (!r || !pode('omni_docs', 'ver', me, r) || !pode('omni_docs', 'mudar', me, r)) throw erro('Registro não encontrado ou sem permissão.');
    const mesclar = (a, b) => { const o = Object.assign({}, a || {}); for (const [k, v] of Object.entries(b || {})) { if (v === null) delete o[k]; else if (v && typeof v === 'object' && !Array.isArray(v) && o[k] && typeof o[k] === 'object' && !Array.isArray(o[k])) o[k] = mesclar(o[k], v); else o[k] = v; } return o; };
    const antes = Object.assign({}, r); r.dados = mesclar(r.dados, c.p_campos); gatilho('omni_docs', r, me, antes); return r.versao;
  },
  /* ---- aparelhos e pedidos: as regras de supabase/2026-11-07-sol-aparelhos.sql ---- */
  sol_pedido_criar: (me, c) => {
    limpar();
    if (db.sol_acesso_pedidos.filter((p) => p.user_id === me && p.estado === 'aberto').length >= 3) throw erro('muitos pedidos em aberto: espere 10 minutos');
    /* como no SQL: qualquer membro (de qualquer papel) pode pedir "para a família"; quem confere o papel é quem aprova (K2) */
    if (c.p_grupo && !db.sol_grupo_membros.some((m) => m.grupo_id === c.p_grupo && m.user_id === me)) throw erro('família errada');
    const p = { id: uuid(), user_id: me, nome: c.p_nome, app: c.p_app, pub: c.p_pub, compromisso: c.p_compromisso, grupo_id: c.p_grupo || null, pub_a: null, n_a: null, n_b: null, desafio_por: null,
      criado_em: agora(), expira_em: new Date(M.relogio + 10 * 60e3).toISOString(), estado: 'aberto', resposta: null, tipo_resposta: null, respondido_por: null, respondido_por_ap: null, respondido_em: null };
    db.sol_acesso_pedidos.push(p); return p.id;
  },
  sol_pedidos_para_mim: (me) => {
    limpar();
    return db.sol_acesso_pedidos.filter((p) => aberto(p) && posso(p, me) && (!p.desafio_por || p.desafio_por === me)).map((p) => {
      const o = { id: p.id, quem: p.user_id, quem_email: PESSOAS[p.user_id].email, quem_nome: PESSOAS[p.user_id].nome, nome: p.nome, app: p.app, pub: p.pub, compromisso: p.compromisso,
        pub_a: p.pub_a, n_a: p.n_a, n_b: p.n_b, desafio_meu: p.desafio_por === me, grupo_id: p.grupo_id, criado_em: p.criado_em, tipo: posso(p, me) };
      /* banco mal-intencionado: troca a pub do aparelho novo pela do atacante; "troca" também forja o compromisso (os 6 números
         ficam diferentes nos dois aparelhos); "troca-sem-compromisso" não (quem aprova vê que o pedido foi alterado) */
      if (M.ataque === 'troca' || M.ataque === 'troca-sem-compromisso') {
        o.pub = M.ATACANTE.pub;
        if (M.ataque === 'troca') { o.compromisso = compromisso(M.ATACANTE.pub, M.ATACANTE.n); if (o.n_b) o.n_b = M.ATACANTE.n; }
      }
      /* "troca-tarde": só DEPOIS que o aparelho novo revela o nB, o banco mostra a quem aprova outra pública, outro nB e um
         compromisso novo que confere com eles (escolhidos depois de ver o desafio: dá para acertar os 6 números) */
      if (M.ataque === 'troca-tarde' && o.n_b && M.TARDE) { o.pub = M.TARDE.pub; o.compromisso = M.TARDE.c; o.n_b = M.TARDE.n; }
      /* "tipo-pessoal": o pedido de OUTRA pessoa chega a quem aprova como se fosse dele mesmo (a chave pessoal iria para ela) */
      if (M.ataque === 'tipo-pessoal' && p.user_id !== me) o.tipo = 'pessoal';
      return o;
    });
  },
  sol_pedido_desafio: (me, c) => {
    const p = db.sol_acesso_pedidos.find((x) => x.id === c.p_id); if (!p || !aberto(p) || p.pub_a) return false;
    if (!posso(p, me)) throw erro('sem permissão para este pedido');
    Object.assign(p, { pub_a: c.p_pub_a, n_a: c.p_n_a, desafio_por: me }); return true;
  },
  sol_pedido_revelar: (me, c) => { const p = db.sol_acesso_pedidos.find((x) => x.id === c.p_id && x.user_id === me); if (!p || !aberto(p) || !p.pub_a || p.n_b) return false; p.n_b = c.p_n_b; return true; },
  sol_pedido_aprovar: (me, c) => {
    const p = db.sol_acesso_pedidos.find((x) => x.id === c.p_id); if (!p || !aberto(p) || !p.n_b || p.desafio_por !== me) return false;
    const tipo = posso(p, me); if (!tipo) throw erro('sem permissão para este pedido');
    if (c.p_meu_ap && !db.sol_aparelhos.some((a) => a.id === c.p_meu_ap && a.user_id === me && !a.removido_em)) throw erro('aparelho que aprova não é seu');
    Object.assign(p, { estado: 'aprovado', resposta: c.p_resposta, tipo_resposta: tipo, respondido_por: me, respondido_por_ap: c.p_meu_ap || null, respondido_em: agora() }); return true;
  },
  /* recusa quem pode aprovar e também o DONO do pedido (o "Cancelar" do aparelho novo, K18) */
  sol_pedido_recusar: (me, c) => {
    const p = db.sol_acesso_pedidos.find((x) => x.id === c.p_id); if (!p || p.estado !== 'aberto' || !posso(p, me)) return false;
    Object.assign(p, { estado: 'recusado', respondido_por: me, respondido_em: agora() }); return true;
  },
  sol_pedido_buscar: async (me, c) => {
    limpar();
    const p = db.sol_acesso_pedidos.find((x) => x.id === c.p_id && x.user_id === me); if (!p) return [];
    if (p.estado !== 'aprovado') return [{ estado: p.estado, pub_a: p.pub_a, n_a: p.n_a, resposta: null, tipo: null, aparelho: null }];
    const ap = { id: uuid(), user_id: me, nome: p.nome, app: p.app, como: p.tipo_resposta === 'pessoal' ? 'aparelho' : 'familia', aprovado_por: p.respondido_por, aprovado_por_ap: p.respondido_por_ap,
      criado_em: agora(), visto_em: agora(), removido_em: null, removido_por: null };
    db.sol_aparelhos.push(ap);
    let resp = p.resposta, pubA = p.pub_a, nA = p.n_a;
    if (M.ataque === 'troca-depois' && resp) { resp = await respostaDoAtacante(p); pubA = M.ATACANTE.pub; nA = M.ATACANTE.n; }
    p.estado = 'usado'; p.resposta = null;
    return [{ estado: 'aprovado', pub_a: pubA, n_a: nA, resposta: resp, tipo: p.tipo_resposta, aparelho: ap.id }];
  },
  /* (2026-11-11-sol-pin-conta.sql, 3b) "primeiro" só na conta que ainda não tem nenhum aparelho */
  sol_aparelho_registrar: (me, c) => {
    if (!['primeiro', 'passkey', 'kit'].includes(c.p_como)) throw erro('como');
    if (c.p_como === 'primeiro' && db.sol_aparelhos.some((a) => a.user_id === me && !a.removido_em)) throw erro('a conta já tem aparelho: este precisa ser aprovado pelo outro');
    const ap = { id: uuid(), user_id: me, nome: c.p_nome, app: c.p_app, como: c.p_como, aprovado_por: me, aprovado_por_ap: null, criado_em: agora(), visto_em: agora(), removido_em: null, removido_por: null };
    db.sol_aparelhos.push(ap); return ap.id;
  },
  sol_aparelho_visto: (me, c) => { const a = db.sol_aparelhos.find((x) => x.id === c.p_id && x.user_id === me && !x.removido_em); if (a) a.visto_em = agora(); return !!a; },
  sol_aparelho_tirar: (me, c) => { const a = db.sol_aparelhos.find((x) => x.id === c.p_id && x.user_id === me && !x.removido_em); if (a) Object.assign(a, { removido_em: agora(), removido_por: me }); return !!a; },
  /* só as colunas que a função de verdade devolve (sem aprovado_por_ap: o teste confere esse campo direto no db) */
  sol_aparelhos_meus: (me) => db.sol_aparelhos.filter((a) => a.user_id === me && !a.removido_em).sort((a, b) => (a.criado_em < b.criado_em ? -1 : 1)).map((a) => ({
    id: a.id, nome: a.nome, app: a.app, como: a.como, criado_em: a.criado_em, visto_em: a.visto_em, aprovado_por: a.aprovado_por,
    aprovado_por_email: (PESSOAS[a.aprovado_por] || {}).email || null, aprovado_por_nome: (PESSOAS[a.aprovado_por] || {}).nome || '' })),
  /* passkey sincronizada: guarda de verdade (o mock do MoneyTRIO só dizia "true") e tira */
  sol_passkey_guardar: (me, c) => {
    if (!/^[A-Za-z0-9_-]{16,700}$/.test(c.p_cred || '') || !/^[A-Za-z0-9_-]{43}$/.test(c.p_sal || '') || !c.p_fechada || typeof c.p_fechada !== 'object') throw erro('formato', 400, '23514');
    const ja = db.sol_passkeys.find((k) => k.user_id === me && k.cred_id === c.p_cred);
    if (ja) Object.assign(ja, { sal: c.p_sal, fechada: c.p_fechada, removido_em: null });
    else db.sol_passkeys.push({ user_id: me, cred_id: c.p_cred, sal: c.p_sal, fechada: c.p_fechada, criado_em: agora(), removido_em: null });
    return true;
  },
  sol_passkeys_minhas: (me) => db.sol_passkeys.filter((k) => k.user_id === me && !k.removido_em).map((k) => ({ cred_id: k.cred_id, sal: k.sal, fechada: k.fechada, criado_em: k.criado_em })),
  sol_passkey_tirar: (me, c) => { const k = db.sol_passkeys.find((x) => x.user_id === me && x.cred_id === c.p_cred && !x.removido_em); if (k) k.removido_em = agora(); return !!k; }
};

/* ---- PIN da conta: as mesmas regras de supabase/2026-11-11-sol-pin-conta.sql ---- */
const hpin = (v) => crypto.createHash('sha256').update(String(v), 'utf8').digest('hex');
const esperaPin = (n) => n >= 10 ? 24 * 3600e3 : n === 9 ? 30 * 60e3 : n === 8 ? 15 * 60e3 : n === 7 ? 5 * 60e3 : n === 6 ? 60e3 : n === 5 ? 30e3 : 0;
const meuAp = (me, ap) => db.sol_aparelhos.some((a) => a.id === ap && a.user_id === me && !a.removido_em);
function segredoAp(me, ap) { let s = db.sol_aparelho_pin.find((x) => x.ap_id === ap); if (!s) { s = { ap_id: ap, user_id: me, segredo: b64u(crypto.randomBytes(32)), tentativas: 0 }; db.sol_aparelho_pin.push(s); } return s.segredo; }
function conferirPin(me, v, ap) {
  if (!meuAp(me, ap)) return { ok: false, erro: 'aparelho' };
  const p = db.sol_pin_conta.find((x) => x.user_id === me); if (!p) return { ok: false, erro: 'sempin' };
  if (p.espera_ate && p.espera_ate > M.relogio) return { ok: false, erro: 'espera', espera_ate: new Date(p.espera_ate).toISOString(), tentativas: p.tentativas };
  if (hpin(v) === p.hv) { p.tentativas = 0; p.espera_ate = null; return { ok: true, versao: p.versao, segredo: segredoAp(me, ap) }; }
  p.tentativas++; const w = esperaPin(p.tentativas); p.espera_ate = w ? M.relogio + w : null;
  segredoAp(me, ap); db.sol_aparelho_pin.find((x) => x.ap_id === ap).tentativas++;
  return { ok: false, erro: 'pin', tentativas: p.tentativas, restam: Math.max(10 - p.tentativas, 0), espera_ate: w ? new Date(p.espera_ate).toISOString() : null };
}
Object.assign(rpcs, {
  sol_pin_info: (me) => { const p = db.sol_pin_conta.find((x) => x.user_id === me);
    return [p ? { tem: true, sal: p.sal, versao: p.versao, bloqueado: false, espera_ate: p.espera_ate ? new Date(p.espera_ate).toISOString() : null, tentativas: p.tentativas } : { tem: false, sal: null, versao: 0, bloqueado: false, espera_ate: null, tentativas: 0 }]; },
  sol_pin_conferir: (me, c) => conferirPin(me, c.p_v, c.p_ap),
  sol_pin_definir: (me, c) => {
    if (!meuAp(me, c.p_ap)) throw erro('aparelho que não é seu');
    if (!/^[A-Za-z0-9_-]{22}$/.test(c.p_sal_novo || '') || !/^[A-Za-z0-9_-]{43}$/.test(c.p_v_novo || '')) throw erro('formato');
    let p = db.sol_pin_conta.find((x) => x.user_id === me), pode = !p;
    if (!pode) { const a = db.sol_aparelhos.find((x) => x.id === c.p_ap); pode = a.como === 'aparelho' && Date.parse(a.criado_em) > M.relogio - 10 * 60e3; }
    if (!pode && c.p_v_atual) { const r = conferirPin(me, c.p_v_atual, c.p_ap); if (!r.ok) return r; pode = true; }
    if (!pode) return { ok: false, erro: 'sem_permissao' };
    if (!p) { p = { user_id: me, versao: 0 }; db.sol_pin_conta.push(p); }
    Object.assign(p, { sal: c.p_sal_novo, hv: hpin(c.p_v_novo), versao: p.versao + 1, tentativas: 0, espera_ate: null, atualizado_por_ap: c.p_ap });
    db.sol_aparelho_pin.filter((x) => x.user_id === me).forEach((x) => { x.tentativas = 0; });
    return { ok: true, versao: p.versao, segredo: segredoAp(me, c.p_ap) };
  }
});

/* ---------------- a rota: tudo que o navegador manda para o Supabase cai aqui ---------------- */
async function supabase(route) {
  const req = route.request(), url = new URL(req.url()), metodo = req.method(), cab = { 'access-control-allow-origin': '*' };
  const json = (st, o) => route.fulfill({ status: st, contentType: 'application/json', headers: cab, body: o === undefined ? '' : JSON.stringify(o) });
  if (metodo === 'OPTIONS') return route.fulfill({ status: 204, headers: { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': '*' } });
  let corpo = null; try { corpo = req.postData() ? JSON.parse(req.postData()) : null; } catch (e) {}
  const p = url.pathname, me = quem(req), prm = url.searchParams, prefer = req.headers()['prefer'] || '';
  M.log.push({ metodo, caminho: p + url.search, corpo, quem: me, t: Date.now() });
  /* entrar, renovar, sair */
  if (p === '/auth/v1/token') {
    if (prm.get('grant_type') === 'password') {
      const uid = Object.keys(PESSOAS).find((k) => PESSOAS[k].email === String((corpo && corpo.email) || '').toLowerCase() && PESSOAS[k].senha === (corpo && corpo.password));
      return uid ? json(200, sessao(uid)) : json(400, { code: 400, error_code: 'invalid_credentials', msg: 'Invalid login credentials' });
    }
    const s = SESSOES[(corpo && corpo.refresh_token) || ''];
    if (s && !s.saiu && M.banidas[s.uid]) return json(400, { code: 400, error_code: 'user_banned', msg: 'User is banned' });
    return s && !s.saiu ? json(200, sessao(s.uid, corpo.refresh_token)) : json(400, { code: 400, error_code: 'refresh_token_not_found', msg: 'Invalid Refresh Token: Refresh Token Not Found' });
  }
  if (p === '/auth/v1/logout') {
    const t = lerToken(req); if (!t || !PESSOAS[t.sub]) return json(401, { code: 401, msg: 'invalid JWT' });
    Object.values(SESSOES).forEach((s) => { if (s.id === t.session_id) s.saiu = true; });
    if (M.atrasoLogout) await new Promise((r) => setTimeout(r, M.atrasoLogout));
    /* a página pode ter ido embora no meio (o navegador cortou o pedido): então não há a quem responder */
    return route.fulfill({ status: 204, headers: cab, body: '' }).then(() => { M.logoutRespondido = Date.now(); }, () => {});
  }
  if (p === '/auth/v1/user') return me ? json(200, usuario(me)) : json(401, { code: 401, msg: 'invalid JWT' });
  if (p.startsWith('/auth/v1/')) return json(200, {});
  /* registro de acesso (Edge Function da plataforma) */
  if (p.startsWith('/functions/v1/')) {
    if (corpo && corpo.acao === 'registrar-acesso' && me) M.acessos.push({ uid: me, evento: corpo.evento, app: corpo.app, t: Date.now() });
    return json(200, { ok: true });
  }
  if (p.startsWith('/storage/')) return json(404, {});
  if (!me) return json(401, { code: 'PGRST301', message: 'JWT required' });
  /* funções */
  const rpc = p.match(/^\/rest\/v1\/rpc\/(\w+)$/);
  if (rpc) {
    const nome = rpc[1], desligada = (M.semPin && /^sol_pin_/.test(nome)) || (M.semAp && /^sol_(pedido|aparelho|passkey)/.test(nome));
    const f = desligada ? null : rpcs[nome];
    if (!f) return json(404, { code: 'PGRST202', message: 'Could not find the function public.' + nome + ' in the schema cache' });
    if (M.falhar[nome] > 0) { M.falhar[nome]--; return json(503, { message: 'falha de mentira (a rede caiu no meio)' }); }
    try { const r = await f(me, corpo || {}); return json(200, r === undefined ? null : r); }
    catch (e) { return e && e.st ? json(e.st, e.o) : json(500, { message: String(e) }); }
  }
  /* tabelas */
  const tab = p.match(/^\/rest\/v1\/(\w+)$/), t = tab && tab[1];
  if (!t || !db[t] || SO_FUNCOES.includes(t)) return json(404, { code: 'PGRST205', message: "Could not find the table 'public." + t + "' in the schema cache" });
  const letra = { GET: 'G', POST: 'P', PATCH: 'U', DELETE: 'D' }[metodo];
  if (!(GRANT[t] || '').includes(letra) || (t === 'omni_chave_privada' && metodo === 'DELETE' && M.semDelete)) return json(403, { code: '42501', message: 'permission denied for table ' + t });
  const vejo = () => db[t].filter((r) => pode(t, 'ver', me, r));
  if (metodo === 'GET') return json(200, escolher(filtrar(vejo(), prm), prm));
  if (metodo === 'POST') {
    const lista = Array.isArray(corpo) ? corpo : [corpo], feitas = [];
    const conflito = prm.get('on_conflict') ? prm.get('on_conflict').split(',') : CHAVE[t];
    for (const r0 of lista) {
      const r = Object.assign({}, r0);
      const ja = conflito && db[t].find((x) => conflito.every((c) => String(x[c]) === String(r[c])));
      if (ja) {
        if (/ignore-duplicates/.test(prefer)) continue;
        if (!/merge-duplicates/.test(prefer)) return json(409, { code: '23505', message: 'duplicate key value violates unique constraint "' + t + '_pkey"' });
        if (!pode(t, 'mudar', me, ja)) return json(403, { code: '42501', message: 'new row violates row-level security policy for table "' + t + '"' });
        const antes = Object.assign({}, ja); Object.assign(ja, r); gatilho(t, ja, me, antes); feitas.push(ja); continue;
      }
      if (!pode(t, 'criar', me, r)) return json(403, { code: '42501', message: 'new row violates row-level security policy for table "' + t + '"' });
      gatilho(t, r, me, null); db[t].push(r); feitas.push(r);
    }
    return /return=representation/.test(prefer) ? json(201, JSON.parse(JSON.stringify(feitas))) : route.fulfill({ status: 201, headers: cab, body: '' });
  }
  if (metodo === 'PATCH') {
    const alvo = filtrar(vejo().filter((r) => pode(t, 'mudar', me, r)), prm);
    alvo.forEach((r) => { const antes = Object.assign({}, r); Object.assign(r, corpo); gatilho(t, r, me, antes); });
    return /return=representation/.test(prefer) ? json(200, JSON.parse(JSON.stringify(alvo))) : route.fulfill({ status: 204, headers: cab, body: '' });
  }
  if (metodo === 'DELETE') {
    const alvo = filtrar(vejo().filter((r) => pode(t, 'apagar', me, r)), prm);
    for (const r of alvo) db[t].splice(db[t].indexOf(r), 1);
    return /return=representation/.test(prefer) ? json(200, JSON.parse(JSON.stringify(alvo))) : route.fulfill({ status: 204, headers: cab, body: '' });
  }
  return json(405, {});
}

/* ---------------- as chaves de cada pessoa, como o OmniLifeONE 2.25 grava hoje ----------------
   Para cada chefe/responsável (menos os de op.semChaves; padrão: [CRIS]): par RSA-OAEP 3072 (pública com kid em sol_chave_publica; privada
   fechada pelo código de recuperação em omni_chave_privada, PBKDF2 600 mil) e a CF da família embrulhada para a pública
   (sol_grupo_chaves). O registro do cofre ("settings/cofre" em omni_docs: fk, kv e quem já recebeu) vai junto, como o app sobe.
   Também prepara o atacante dos testes de ataque (par ECDH, nonce, CF e chave pessoal falsas). Chamar uma vez por teste. */
async function prepararChaves(op) {
  op = op || {};
  const sem = op.semChaves || [CRIS], fk = 'fk-teste', kv = 1;
  CF_RAW = crypto.webcrypto.getRandomValues(new Uint8Array(32));
  const membros = {};
  for (const uid of Object.keys(PESSOAS)) {
    if (!['chefe', 'responsavel'].includes(PESSOAS[uid].papel) || sem.includes(uid)) continue;
    const par = await subtle.generateKey({ name: 'RSA-OAEP', modulusLength: 3072, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' }, true, ['encrypt', 'decrypt']);
    const j = await subtle.exportKey('jwk', par.publicKey), kid = b64(crypto.randomBytes(9)).replace(/[+/=]/g, '');
    const pub = { kty: j.kty, n: j.n, e: j.e, alg: 'RSA-OAEP-256', kid };
    const pkcs8 = new Uint8Array(await subtle.exportKey('pkcs8', par.privateKey)), sal = b64(crypto.randomBytes(16));
    const base = await subtle.importKey('raw', utf8(normCode(PESSOAS[uid].codigo)), 'PBKDF2', false, ['deriveKey']);
    const k = await subtle.deriveKey({ name: 'PBKDF2', salt: unb64(sal), iterations: 600000, hash: 'SHA-256' }, base, { name: 'AES-GCM', length: 256 }, false, ['encrypt']);
    const iv = crypto.randomBytes(12), h = agora();
    db.omni_chave_privada.push({ user_id: uid, privada_cifrado: JSON.stringify({ v: 1, kid, iv: b64(iv), ct: b64(await subtle.encrypt({ name: 'AES-GCM', iv }, k, pkcs8)) }), sal, iteracoes: 600000, criado_por: uid, criado_em: h, atualizado_em: h });
    db.sol_chave_publica.push({ user_id: uid, algoritmo: 'RSA-OAEP-256', chave_publica: pub, criado_em: h, atualizado_em: h });
    const emb = '1.' + b64(await subtle.encrypt({ name: 'RSA-OAEP' }, par.publicKey, utf8(JSON.stringify({ v: 1, kv, fk, k: b64(CF_RAW) }))));
    db.sol_grupo_chaves.push({ grupo_id: GID, user_id: uid, versao: 1, chave_embrulhada: emb, embrulhada_por: ANA, criado_em: h });
    membros[uid] = { kid, seq: 1, fk };
  }
  if (Object.keys(membros).length) {
    const h = agora(), dados = { vis: 'restrito', fk, kv, membros };
    db.omni_docs.push({ grupo_id: GID, colecao: 'settings', id: 'cofre', vis: 'restrito', dados, dados_cifrado: null, versao: 1, criado_por: ANA, criado_em: h, atualizado_por: ANA, atualizado_em: h, apagado_em: null });
  }
  const m = await subtle.generateKey({ name: 'ECDH', namedCurve: 'P-256' }, true, ['deriveBits']), j = await subtle.exportKey('jwk', m.publicKey);
  const rsa = await subtle.generateKey({ name: 'RSA-OAEP', modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' }, true, ['encrypt', 'decrypt']);
  M.ATACANTE = { pub: { kty: 'EC', crv: 'P-256', x: j.x, y: j.y }, priv: m.privateKey, n: b64u(crypto.randomBytes(32)), cf: crypto.webcrypto.getRandomValues(new Uint8Array(32)),
    pkcs8: new Uint8Array(await subtle.exportKey('pkcs8', rsa.privateKey)) };
}
/* a CF da família de mentira (para o teste conferir que o aparelho aprovado recebeu a MESMA chave) */
const cf = () => CF_RAW;

module.exports = { SB, M, db, rpcs, supabase, prepararChaves, PESSOAS, ANA, BIA, CRIS, DAVI, GID, compromisso, agora, b64u, cf, normCode };
