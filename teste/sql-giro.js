/* Parte E (2.27.0) — os DOIS arquivos SQL da troca da chave da família rodando DE VERDADE num Postgres local (PGlite, em
   memória), com as tabelas e funções da base em versão mínima (só as colunas que os arquivos leem). Nada vai para a rede nem para
   o Supabase; nenhum SQL é aplicado em banco nenhum (correção C15: o G12 do giro-omni.js testa o app contra a cópia em JS do SQL,
   que mora no mock-sol.js; aqui é o SQL de verdade, e o mock tem de responder igual).
     PLAT  supabase/2026-11-12-sol-giro-chaves.sql (sol_giro_situacao e sol_descartar_chaves_antigas): aplica sem erro (e a
           conferência dele passa); os casos do topo do arquivo — não-chefe, versão, sem registro, sem troca "feito", troca gravada
           por responsável, "publico", de = para, linha viva ou _em com a chave velha, ponte, MoneyTRIO, responsável sem a entrega,
           membro sem chave (não trava), entrada velha de cópia (não trava; sai), ping-pong, quem entrou depois (fica), quem saiu
           (sai), rodar duas vezes — cada um com o resultado esperado E igual ao do banco de mentira (teste/mock-sol.js); o app
           (authenticated) executa, o visitante (anon) não; a situação só tem números e sim/não
     OMNI  supabase/2026-11-12-omni-giro-so-chefe.sql (o gatilho do D-E3/C4): sem ele, a responsável muda a chave; com ele (aplicado
           duas vezes), só o chefe muda fk/kv do registro, a kv só sobe, só o chefe grava a troca, os dois não se apagam; mudar só
           os membros, os outros registros e as funções internas passam; roda antes do omni_docs_regras; a função não fica aberta
           para o app; e o banco de mentira (M.soChefeGiro) responde igual (o mesmo sim/não e a mesma mensagem)
   O PGlite NUNCA entra no repositório. Uso: PGLITE=<pasta com node_modules/@electric-sql/pglite> node teste/sql-giro.js
   (instalar numa pasta à parte: npm i @electric-sql/pglite@0.2.17). Sem PGLITE: "PULADO" e sai com 0 (não falha a suíte). */
'use strict';
const fs = require('fs'), path = require('path');
const PASTA = process.env.PGLITE ? path.resolve(process.env.PGLITE) : '';
if (!PASTA) { console.log('PULADO: o teste do SQL de verdade precisa de PGLITE=<pasta com node_modules/@electric-sql/pglite> (um Postgres local, fora do repositório).'); process.exit(0); }
let PGlite;
try { ({ PGlite } = require(require.resolve('@electric-sql/pglite', { paths: [PASTA] }))); }
catch (e) { console.log('  ✗ PGLITE=' + PASTA + ' não tem node_modules/@electric-sql/pglite'); process.exit(1); }
const RAIZ = path.join(__dirname, '..');
const SQL_SOL = fs.readFileSync(path.join(RAIZ, 'supabase', '2026-11-12-sol-giro-chaves.sql'), 'utf8');
const SQL_OMNI = fs.readFileSync(path.join(RAIZ, 'supabase', '2026-11-12-omni-giro-so-chefe.sql'), 'utf8');
const { db, rpcs, M, SB, supabase, b64u, ANA, BIA, CRIS, DAVI, GID } = require('./mock-sol');

let falhas = 0;
const conferir = (ok, txt) => { console.log('  ' + (ok ? '✓' : '✗') + ' ' + txt); if (!ok) falhas++; };
const J = (o) => JSON.stringify(o);
/* sem a ordem das chaves (o jsonb reordena) */
const K = (o) => JSON.stringify(o, (k, v) => (v && typeof v === 'object' && !Array.isArray(v) ? Object.fromEntries(Object.keys(v).sort().map((x) => [x, v[x]])) : v));
const T0 = '2026-11-01T12:00:00.000Z';
const NOME = { [ANA]: 'ANA', [BIA]: 'BIA', [CRIS]: 'CRIS', [DAVI]: 'DAVI' };

/* ---------- a base, em versão mínima (o que os dois arquivos leem; os nomes e as colunas são os do banco, banco.md) ---------- */
const BASE = `
create role anon; create role authenticated; create role service_role;
create schema auth;
create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('app.uid', true), '')::uuid $$;
grant usage on schema auth to anon, authenticated, service_role;
create table public.sol_grupos(id uuid primary key);
create table public.sol_grupo_membros(grupo_id uuid, user_id uuid, papel text, status text);
create table public.sol_chave_publica(user_id uuid primary key, chave_publica jsonb);
create table public.sol_grupo_chaves(grupo_id uuid, user_id uuid, versao integer, chave_embrulhada text, primary key (grupo_id, user_id, versao));
create table public.sol_ponte(id text primary key, grupo_id uuid, para_app text, de_app text, tipo text, dados jsonb, lido_em timestamptz);
create table public.omni_docs(grupo_id uuid not null, colecao text not null, id text not null, vis text not null default 'publico', dados jsonb,
  dados_cifrado text, versao bigint not null default 1, atualizado_por uuid, atualizado_em timestamptz not null default now(), apagado_em timestamptz,
  primary key (grupo_id, colecao, id));
create table public.money_docs(grupo_id uuid, colecao text, id text, dados_cifrado text, apagado_em timestamptz);
create table public.money_migracao(grupo_id uuid);
create function public.sol_exigir_conta() returns uuid language plpgsql stable set search_path = '' as $$
begin if auth.uid() is null then raise exception 'Entre na sua conta.' using errcode = '42501'; end if; return auth.uid(); end $$;
create function public.sol_meu_papel(p uuid) returns text language sql stable security definer set search_path = '' as $$
  select m.papel from public.sol_grupo_membros m where m.grupo_id = p and m.user_id = auth.uid() and m.status = 'ativo' limit 1 $$;
create function public.omni_sou_chefe(p uuid) returns boolean language sql stable security definer set search_path = '' as $$
  select coalesce(public.sol_meu_papel(p) = 'chefe', false) $$;
grant select, insert, update on public.omni_docs to authenticated;
grant select on public.sol_grupo_chaves to authenticated;
`;
/* o carimbo do banco (omni_tg_docs, só o que importa aqui): quem gravou e a versão. Nome "omni_docs_regras", como no banco */
const REGRAS = `
create function public.omni_tg_docs() returns trigger language plpgsql set search_path = '' as $$
declare v_uid uuid := (select auth.uid());
begin
  if tg_op = 'INSERT' then new.atualizado_por := v_uid; new.versao := 1; return new; end if;
  new.versao := old.versao + 1; new.atualizado_por := v_uid; new.atualizado_em := now();
  if v_uid is null or current_user not in ('authenticated', 'anon') then return new; end if;
  if new.apagado_em is not null and old.apagado_em is null then new.apagado_em := now(); end if;
  return new;
end $$;
create trigger omni_docs_regras before insert or update on public.omni_docs for each row execute function public.omni_tg_docs();
`;

/* ---------- os estados (no banco de mentira; depois copiados para o Postgres). Só a forma: o banco não abre nada ---------- */
const doc = (col, id) => db.omni_docs.find((d) => d.colecao === col && d.id === id);
function base() {
  const kid = { [ANA]: 'kid-ana', [BIA]: 'kid-bia', [DAVI]: 'kid-davi' };
  db.sol_grupo_membros.splice(0, db.sol_grupo_membros.length, ...[[ANA, 'chefe'], [BIA, 'responsavel'], [CRIS, 'responsavel'], [DAVI, 'membro']].map(([u, p]) => ({ grupo_id: GID, user_id: u, papel: p, status: 'ativo' })));
  db.sol_chave_publica.splice(0, db.sol_chave_publica.length, ...Object.keys(kid).map((u) => ({ user_id: u, chave_publica: { kty: 'RSA', kid: kid[u] } })));
  db.sol_grupo_chaves.splice(0, db.sol_grupo_chaves.length, { grupo_id: GID, user_id: ANA, versao: 1, chave_embrulhada: 'a1' }, { grupo_id: GID, user_id: BIA, versao: 1, chave_embrulhada: 'b1' });
  db.sol_ponte.splice(0); db.money_docs.splice(0); db.money_migracao.splice(0);
  const docs = [{ colecao: 'settings', id: 'cofre', vis: 'restrito', dados: { vis: 'restrito', fk: 'fk-teste', kv: 1, membros: { [ANA]: { kid: 'kid-ana', seq: 1, fk: 'fk-teste' }, [BIA]: { kid: 'kid-bia', seq: 1, fk: 'fk-teste' } } }, atualizado_por: ANA }];
  for (let i = 0; i < 6; i++) docs.push({ colecao: 'vault', id: 'v' + i, vis: 'restrito', dados_cifrado: J({ c: 1, kv: 1, fk: 'fk-teste', iv: 'i', ct: 'c' }), atualizado_por: ANA });
  docs.push({ colecao: 'vault', id: '_em', vis: 'restrito', dados_cifrado: J({ em: 1, d: { em: { sal: 's', iter: 1, kv: 1, fk: 'fk-teste', iv: 'i', ct: 'c' }, at: T0, vis: 'restrito' } }), atualizado_por: ANA });
  docs.push({ colecao: 'vault', id: 'vApagado', vis: 'restrito', dados_cifrado: J({ c: 1, kv: 1, fk: 'fk-teste', iv: 'i', ct: 'c' }), atualizado_por: ANA, apagado_em: T0 });
  docs.push({ colecao: 'settings', id: 'familia', vis: 'publico', dados: { nome: 'Família de mentira' }, atualizado_por: ANA });
  db.omni_docs.splice(0, db.omni_docs.length, ...docs.map((d) => Object.assign({ grupo_id: GID, dados: null, dados_cifrado: null, apagado_em: null, versao: 1 }, d)));
}
/* a troca terminada (só a forma): as linhas vivas na nova, o _em refeito (ou invalidado), a nova (versão 2) para a Ana e a Bia,
   o registro novo e a troca "feito" (restrito, gravada por um chefe). op: {pular, em, estado, vis, por, de} */
function troca(op) {
  op = op || {};
  for (const d of db.omni_docs.filter((x) => x.colecao === 'vault' && !x.apagado_em && x.id !== '_em' && !(op.pular || []).includes(x.id))) d.dados_cifrado = J({ c: 1, kv: 2, fk: 'fk-nova', iv: 'i', ct: 'c' });
  const em = doc('vault', '_em');
  if ((op.em || 'refeito') === 'refeito') em.dados_cifrado = J({ em: 1, d: { em: { sal: 's', iter: 1, kv: 2, fk: 'fk-nova', iv: 'i', ct: 'c' }, at: T0, vis: 'restrito' } });
  else Object.assign(em, { dados_cifrado: null, apagado_em: T0 });
  const reg = doc('settings', 'cofre').dados, entregues = {};
  for (const u of [ANA, BIA]) { db.sol_grupo_chaves.push({ grupo_id: GID, user_id: u, versao: 2, chave_embrulhada: 'x2' }); reg.membros[u] = { kid: u === ANA ? 'kid-ana' : 'kid-bia', seq: 2, fk: 'fk-nova' }; entregues[u] = { kid: reg.membros[u].kid, seq: 2 }; }
  Object.assign(reg, { fk: 'fk-nova', kv: 2 });
  db.omni_docs.push({ grupo_id: GID, colecao: 'settings', id: 'giro', vis: op.vis || 'restrito', dados_cifrado: null, apagado_em: null, versao: 1, atualizado_por: op.por || ANA,
    dados: { v: 1, vis: op.vis || 'restrito', estado: op.estado || 'feito', de: op.de || { kv: 1, fk: 'fk-teste' }, para: { kv: 2, fk: 'fk-nova' }, entregues, envelopes: {} } });
}
const msg = (extra) => Object.assign({ id: 'p1', grupo_id: GID, para_app: 'moneytrio', de_app: 'omnilife-one', tipo: 'saude-resumo', dados: { v: 1, cif: J({ c: 1, kv: 1, fk: 'fk-teste' }) }, lido_em: null }, extra);

/* ---------- copiar o estado para o Postgres (sem os gatilhos: como o banco já estava) ---------- */
async function carregar(pg) {
  await pg.exec("set session_replication_role = replica; truncate public.sol_grupo_membros, public.sol_chave_publica, public.sol_grupo_chaves, public.sol_ponte, public.omni_docs, public.money_docs, public.money_migracao;");
  for (const m of db.sol_grupo_membros) await pg.query('insert into public.sol_grupo_membros values ($1,$2,$3,$4)', [m.grupo_id, m.user_id, m.papel, m.status]);
  for (const k of db.sol_chave_publica) await pg.query('insert into public.sol_chave_publica values ($1,$2)', [k.user_id, J(k.chave_publica)]);
  for (const c of db.sol_grupo_chaves) await pg.query('insert into public.sol_grupo_chaves values ($1,$2,$3,$4)', [c.grupo_id, c.user_id, c.versao, c.chave_embrulhada]);
  for (const p of db.sol_ponte) await pg.query('insert into public.sol_ponte values ($1,$2,$3,$4,$5,$6,$7)', [p.id, p.grupo_id, p.para_app, p.de_app, p.tipo, J(p.dados), p.lido_em]);
  for (const d of db.omni_docs) await pg.query('insert into public.omni_docs (grupo_id, colecao, id, vis, dados, dados_cifrado, versao, atualizado_por, apagado_em) values ($1,$2,$3,$4,$5,$6,$7,$8,$9)',
    [d.grupo_id, d.colecao, d.id, d.vis, d.dados == null ? null : J(d.dados), d.dados_cifrado, d.versao || 1, d.atualizado_por, d.apagado_em]);
  for (const d of db.money_docs) await pg.query('insert into public.money_docs values ($1,$2,$3,$4,$5)', [d.grupo_id, d.colecao, d.id, d.dados_cifrado, d.apagado_em]);
  for (const g of db.money_migracao) await pg.query('insert into public.money_migracao values ($1)', [g.grupo_id]);
  await pg.exec('set session_replication_role = origin;');
}
/* roda fn como o app (papel authenticated, ou outro) com a pessoa uid logada */
async function como(pg, uid, fn, papel) {
  await pg.query("select set_config('app.uid', $1, false)", [uid || '']);
  await pg.exec('set role ' + (papel || 'authenticated'));
  try { return await fn(); } catch (e) { return { erro: String(e.message), code: e.code }; } finally { await pg.exec('reset role'); }
}
const motivo = (r) => (r && r.erro ? r.erro.split(' ')[0] : r);
const restaPg = async (pg) => (await pg.query('select user_id::text u, versao from public.sol_grupo_chaves order by 1, 2')).rows.map((c) => (NOME[c.u] || c.u.slice(0, 4)) + ':' + c.versao).sort().join(',');
const restaMock = () => db.sol_grupo_chaves.map((c) => (NOME[c.user_id] || c.user_id.slice(0, 4)) + ':' + c.versao).sort().join(',');
/* o banco de mentira, a mesma conta: {sit, desc, resta} */
function noMock(quem, ate) {
  const foto = J(db.sol_grupo_chaves);
  let sit; try { sit = rpcs.sol_giro_situacao(quem, { p_grupo: GID }); } catch (e) { sit = e.o.message.split(' ')[0]; }
  let desc; try { desc = rpcs.sol_descartar_chaves_antigas(quem, { p_grupo: GID, p_ate_versao: ate }); } catch (e) { desc = e.o.message.split(' ')[0]; }
  const resta = restaMock();
  db.sol_grupo_chaves.splice(0, db.sol_grupo_chaves.length, ...JSON.parse(foto));
  return { sit, desc, resta };
}
async function noPg(pg, quem, ate) {
  await carregar(pg);
  const s = await como(pg, quem, async () => (await pg.query('select public.sol_giro_situacao($1) as s', [GID])).rows[0].s);
  const d = await como(pg, quem, async () => (await pg.query('select public.sol_descartar_chaves_antigas($1, $2) as n', [GID, ate])).rows[0].n);
  return { sit: motivo(s), desc: motivo(d), resta: await restaPg(pg) };
}

/* ---------- REST no banco de mentira, sem navegador (uma "rota" falsa), para comparar o gatilho do Omni ---------- */
async function restMock(uid, metodo, caminho, corpo) {
  let out = null;
  const route = {
    request: () => ({ url: () => SB + caminho, method: () => metodo, postData: () => (corpo === undefined ? null : JSON.stringify(corpo)),
      headers: () => ({ authorization: 'Bearer h.' + b64u(JSON.stringify({ sub: uid })) + '.s', prefer: 'return=representation' }) }),
    fulfill: async (o) => { out = { status: o.status, corpo: o.body ? JSON.parse(o.body) : null }; }
  };
  await supabase(route);
  return out.status < 300 ? 'ok' : (out.corpo && out.corpo.message) || 'HTTP ' + out.status;
}

(async () => {
  const pg = new PGlite();
  await pg.exec(BASE);

  /* ================= PLAT: o SQL da plataforma ================= */
  console.log('\nPLAT. supabase/2026-11-12-sol-giro-chaves.sql (sol_giro_situacao e sol_descartar_chaves_antigas) num Postgres local');
  /* um arquivo que falha deixa a transação dele aberta e abortada: rollback (como o SQL Editor faz) */
  const aplicar = async (sql) => { try { await pg.exec(sql); return true; } catch (e) { console.log('    ' + e.message); await pg.exec('rollback').catch(() => {}); return false; } };
  const aplicou = await aplicar(SQL_SOL);
  const fns = (await pg.query("select p.proname, p.prosecdef, p.proconfig from pg_catalog.pg_proc p where p.proname in ('sol_giro_situacao', 'sol_descartar_chaves_antigas') order by 1")).rows;
  conferir(aplicou && fns.length === 2 && fns.every((f) => f.prosecdef && (f.proconfig || []).includes('search_path=""')), 'PLAT. aplica sem erro (a conferência do próprio arquivo passa): as duas funções, SECURITY DEFINER e search_path vazio');
  const again = await aplicar(SQL_SOL);
  conferir(again, 'PLAT. rodar de novo não dá erro (create or replace)');
  /* cada caso: [nome, estado, {quem, ate, sit (motivo do erro | campos esperados), desc (n | "descartar:<motivo>"), resta}] */
  const CASOS = [
    ['não-chefe (a responsável): nem a situação, nem o descarte', () => { base(); troca(); }, { quem: BIA, ate: 1, sit: 'giro:chefe', desc: 'descartar:chefe', resta: 'ANA:1,ANA:2,BIA:1,BIA:2' }],
    ['não-chefe (o membro)', () => { base(); troca(); }, { quem: DAVI, ate: 1, sit: 'giro:chefe', desc: 'descartar:chefe' }],
    ['p_ate_versao 0', () => { base(); troca(); }, { ate: 0, desc: 'descartar:versao' }],
    ['p_ate_versao vazio', () => { base(); troca(); }, { ate: null, desc: 'descartar:versao' }],
    ['a versão pedida é a mais nova', () => { base(); troca(); }, { ate: 2, desc: 'descartar:versao', sit: { maior_versao: 2 } }],
    ['sem o registro (apagado)', () => { base(); doc('settings', 'cofre').apagado_em = T0; }, { ate: 1, desc: 'descartar:registro', sit: { registro: false } }],
    ['sem troca "feito" (há versão antiga: a Ana trocou de chave pessoal)', () => { base(); db.sol_grupo_chaves.push({ grupo_id: GID, user_id: ANA, versao: 2, chave_embrulhada: 'a2' }); doc('settings', 'cofre').dados.membros[ANA].seq = 2; },
      { ate: 1, desc: 'descartar:giro', sit: { giro: null, giro_ok: false } }],
    ['troca ainda "conferindo"', () => { base(); troca({ estado: 'conferindo' }); }, { ate: 1, desc: 'descartar:giro', sit: { giro: 'conferindo', giro_ok: false } }],
    ['troca "feito" gravada por último por uma responsável (recusa)', () => { base(); troca({ por: BIA }); }, { ate: 1, desc: 'descartar:giro', sit: { giro: 'feito', giro_ok: false } }],
    ['troca "publico" (recusa)', () => { base(); troca({ vis: 'publico' }); }, { ate: 1, desc: 'descartar:giro', sit: { giro_ok: false } }],
    ['troca com de = para (não trocou nada)', () => { base(); troca({ de: { kv: 2, fk: 'fk-nova' } }); }, { ate: 1, desc: 'descartar:giro', sit: { giro_ok: false } }],
    ['caso feliz: apaga só as versões 1 (as em uso ficam)', () => { base(); troca(); }, { ate: 1, desc: 2, resta: 'ANA:2,BIA:2',
      sit: { registro: true, maior_versao: 2, vault_fora: 0, vault_apagadas_com_texto: 1, ponte_pendentes: 0, ponte_outra: 0, money_usa: false, money_cf: 0, money_migrado: true, falta_entregar: 0, giro: 'feito', giro_ok: true } }],
    ['linha viva com a chave velha', () => { base(); troca({ pular: ['v3'] }); }, { ate: 1, desc: 'descartar:vault', sit: { vault_fora: 1 } }],
    ['_em velho (não refeito)', () => { base(); troca(); doc('vault', '_em').dados_cifrado = J({ em: 1, d: { em: { kv: 1, fk: 'fk-teste' } } }); }, { ate: 1, desc: 'descartar:vault', sit: { vault_fora: 1 } }],
    ['_em invalidado (apagado e sem texto) não trava', () => { base(); troca({ em: 'invalidado' }); }, { ate: 1, desc: 2 }],
    ['ponte: não lida, fechada com a velha', () => { base(); troca(); db.sol_ponte.push(msg()); }, { ate: 1, desc: 'descartar:ponte', sit: { ponte_pendentes: 1, ponte_outra: 1 } }],
    ['ponte: a mesma, já lida, não trava', () => { base(); troca(); db.sol_ponte.push(msg({ lido_em: T0 })); }, { ate: 1, desc: 2, sit: { ponte_pendentes: 0 } }],
    ['ponte: não lida, já com a nova, não trava', () => { base(); troca(); db.sol_ponte.push(msg({ dados: { v: 1, cif: J({ c: 1, kv: 2, fk: 'fk-nova' }) } })); }, { ate: 1, desc: 2, sit: { ponte_pendentes: 1, ponte_outra: 0 } }],
    ['MoneyTRIO: linha viva ainda com a chave da família', () => { base(); troca(); db.money_docs.push({ grupo_id: GID, colecao: 'tx', id: 'm1', dados_cifrado: J({ c: 1, kv: 1, fk: 'fk-teste' }), apagado_em: null }); db.money_migracao.push({ grupo_id: GID }); },
      { ate: 1, desc: 'descartar:money', sit: { money_cf: 1 } }],
    ['MoneyTRIO: sem a migração registrada', () => { base(); troca(); db.money_docs.push({ grupo_id: GID, colecao: 'tx', id: 'm1', dados_cifrado: '{"c":1,"m":"c","iv":"x"}', apagado_em: null }); },
      { ate: 1, desc: 'descartar:money', sit: { money_usa: true, money_migrado: false } }],
    ['MoneyTRIO migrado não trava', () => { base(); troca(); db.money_docs.push({ grupo_id: GID, colecao: 'tx', id: 'm1', dados_cifrado: '{"c":1,"m":"c","iv":"x"}', apagado_em: null }); db.money_migracao.push({ grupo_id: GID }); }, { ate: 1, desc: 2 }],
    ['responsável sem a entrega da nova (recusa)', () => { base(); troca(); doc('settings', 'cofre').dados.membros[BIA].fk = 'fk-teste'; }, { ate: 1, desc: 'descartar:membros', sit: { falta_entregar: 1 } }],
    ['membro com chave pública e sem chave da família (o Davi) NÃO trava', () => { base(); troca(); }, { ate: 1, desc: 2, sit: { falta_entregar: 0 } }],
    ['membro com uma entrada velha no registro (vinda de cópia): NÃO trava, e a linha velha dele sai', () => { base(); troca(); db.sol_grupo_chaves.push({ grupo_id: GID, user_id: DAVI, versao: 1, chave_embrulhada: 'd1' }); doc('settings', 'cofre').dados.membros[DAVI] = { kid: 'kid-davi', seq: 1, fk: 'fk-teste' }; },
      { ate: 1, desc: 3, resta: 'ANA:2,BIA:2' }],
    ['ping-pong: um aparelho velho gravou para a Bia uma versão maior que a do registro (recusa)', () => { base(); troca(); db.sol_grupo_chaves.push({ grupo_id: GID, user_id: BIA, versao: 3, chave_embrulhada: 'b3' }); }, { ate: 2, desc: 'descartar:membros', sit: { falta_entregar: 1 } }],
    ['quem entrou depois da troca, com a versão 1 já da nova, FICA', () => { base(); troca(); db.sol_grupo_chaves.push({ grupo_id: GID, user_id: DAVI, versao: 1, chave_embrulhada: 'd1' }); doc('settings', 'cofre').dados.membros[DAVI] = { kid: 'kid-davi', seq: 1, fk: 'fk-nova' }; },
      { ate: 1, desc: 2, resta: 'ANA:2,BIA:2,DAVI:1' }],
    ['quem saiu do grupo: sai até a versão pedida (mesmo a que era dela)', () => {
      base(); troca(); db.sol_grupo_chaves.push({ grupo_id: GID, user_id: ANA, versao: 3, chave_embrulhada: 'a3' }); doc('settings', 'cofre').dados.membros[ANA].seq = 3; db.sol_grupo_membros.find((m) => m.user_id === BIA).status = 'saiu'; },
      { ate: 2, desc: 4, resta: 'ANA:3' }]
  ];
  for (const [nome, fazer, e] of CASOS) {
    fazer();
    const quem = e.quem || ANA, m = noMock(quem, e.ate), p = await noPg(pg, quem, e.ate);
    const sitOk = e.sit === undefined || (typeof e.sit === 'string' ? p.sit === e.sit : typeof p.sit === 'object' && Object.keys(e.sit).every((k) => K(p.sit[k]) === K(e.sit[k])));
    const ok = sitOk && K(p.desc) === K(e.desc) && (!e.resta || p.resta === e.resta) && K(m) === K(p);
    conferir(ok, 'PLAT. ' + nome + ' → ' + (typeof e.desc === 'number' ? 'apaga ' + e.desc : e.desc) + (e.resta ? ' (ficam ' + e.resta + ')' : '') + '; o banco de mentira igual' +
      (ok ? '' : ' — sql ' + J(p) + ' · mock ' + J(m)));
  }
  /* rodar duas vezes: a segunda apaga 0 */
  base(); troca(); await carregar(pg);
  const d1 = await como(pg, ANA, async () => (await pg.query('select public.sol_descartar_chaves_antigas($1, 1) as n', [GID])).rows[0].n);
  const d2 = await como(pg, ANA, async () => (await pg.query('select public.sol_descartar_chaves_antigas($1, 1) as n', [GID])).rows[0].n);
  conferir(d1 === 2 && d2 === 0 && (await restaPg(pg)) === 'ANA:2,BIA:2', 'PLAT. rodar duas vezes: a segunda apaga 0 (' + J([d1, d2]) + ')');
  /* permissões: o app executa; o visitante não; ninguém do app apaga chave direto na tabela */
  base(); troca(); await carregar(pg);
  const anon = await como(pg, ANA, async () => (await pg.query('select public.sol_giro_situacao($1) as s', [GID])).rows[0].s, 'anon');
  const anonD = await como(pg, ANA, async () => (await pg.query('select public.sol_descartar_chaves_antigas($1, 1) as n', [GID])).rows[0].n, 'anon');
  const del = await como(pg, ANA, async () => (await pg.query('delete from public.sol_grupo_chaves where grupo_id = $1', [GID])).affectedRows);
  conferir(anon.code === '42501' && /permission denied/.test(anon.erro) && anonD.code === '42501' && del.code === '42501' && (await restaPg(pg)) === 'ANA:1,ANA:2,BIA:1,BIA:2',
    'PLAT. o visitante (anon) não executa as duas funções; o app não apaga chave direto na tabela (só pela função)');
  /* a situação: só números e sim/não (nenhum nome, id ou conteúdo) */
  const s = await como(pg, ANA, async () => (await pg.query('select public.sol_giro_situacao($1) as s', [GID])).rows[0].s);
  const chaves = Object.keys(s).sort().join();
  conferir(chaves === 'falta_entregar,giro,giro_ok,maior_versao,money_cf,money_migrado,money_usa,ponte_outra,ponte_pendentes,registro,vault_apagadas_com_texto,vault_fora' &&
    Object.entries(s).every(([k, v]) => typeof v === 'number' || typeof v === 'boolean' || (k === 'giro' && (v === null || /^[a-z]+$/.test(v)))), 'PLAT. a situação só tem números e sim/não (e o estado da troca), nada que diga quem ou o quê (' + chaves + ')');

  /* ================= OMNI: o gatilho do Omni ================= */
  console.log('\nOMNI. supabase/2026-11-12-omni-giro-so-chefe.sql (só o chefe troca a chave, a versão só sobe, o registro não se apaga)');
  await pg.exec(REGRAS);
  const upd = (campos, id) => 'update public.omni_docs set ' + campos + " where grupo_id = '" + GID + "' and colecao = 'settings' and id = '" + (id || 'cofre') + "'";
  const reg = async () => (await pg.query("select dados, versao, atualizado_por::text p, apagado_em from public.omni_docs where colecao = 'settings' and id = 'cofre'")).rows[0];
  /* sem o arquivo: a responsável muda a chave do registro (a regra é ele) */
  base(); troca(); await carregar(pg);
  const sem = await como(pg, BIA, async () => { await pg.query(upd("dados = jsonb_set(dados, '{fk}', '\"fk-falsa\"')")); return 'ok'; });
  conferir(sem === 'ok' && (await reg()).dados.fk === 'fk-falsa', 'OMNI. sem o arquivo, a responsável consegue mudar a chave do registro (é o que ele impede)');
  const ap1 = await aplicar(SQL_OMNI), ap2 = await aplicar(SQL_OMNI);
  if (!ap1 || !ap2) { conferir(false, 'OMNI. o arquivo do Omni não aplicou (a conferência dele falhou): nada mais a conferir nele'); console.log('\nFALHOU: ' + falhas + ' conferência(s)'); process.exit(1); }
  const tg = (await pg.query("select t.tgname from pg_catalog.pg_trigger t where t.tgrelid = 'public.omni_docs'::regclass and not t.tgisinternal order by t.tgname")).rows.map((r) => r.tgname);
  const fn = (await pg.query("select p.prosecdef, p.proconfig from pg_catalog.pg_proc p where p.oid = 'public.omni_tg_giro_so_chefe()'::regprocedure")).rows[0];
  const exe = (await pg.query("select has_function_privilege('anon', 'public.omni_tg_giro_so_chefe()', 'execute') a, has_function_privilege('authenticated', 'public.omni_tg_giro_so_chefe()', 'execute') b")).rows[0];
  conferir(ap1 && ap2 && J(tg) === '["omni_docs_giro_so_chefe","omni_docs_regras"]' && !fn.prosecdef && (fn.proconfig || []).includes('search_path=""') && !exe.a && !exe.b,
    'OMNI. aplica duas vezes sem erro (a conferência dele passa); um gatilho só, que roda ANTES do omni_docs_regras (ordem alfabética); a função é SECURITY INVOKER, com search_path vazio, e não fica aberta para o app (' + J(tg) + ')');
  /* cada caso: [nome, estado, quem, {pg: SQL, mock: [metodo, caminho, corpo]}, esperado ('ok' | a mensagem), conferir depois (opcional)] */
  const docUrl = (id) => '/rest/v1/omni_docs?grupo_id=eq.' + GID + '&colecao=eq.settings&id=eq.' + id;
  const regCom = (mudar) => { const d = JSON.parse(J(doc('settings', 'cofre').dados)); mudar(d); return d; };
  const SO_CHEFE = 'Só o chefe da família troca a chave de segurança.', SOBE = 'A versão da chave de segurança só pode subir.', NAO_APAGA = 'O registro da chave de segurança não se apaga.';
  const CT = [
    ['a responsável muda a chave (fk) do registro', () => { base(); troca(); }, BIA, (d) => { d.fk = 'fk-falsa'; d.kv = 3; }, SO_CHEFE],
    ['a responsável volta a versão (kv) do registro', () => { base(); troca(); }, BIA, (d) => { d.kv = 1; }, SO_CHEFE],
    ['a responsável muda só os membros (entregar a chave para alguém): passa', () => { base(); troca(); }, BIA, (d) => { d.membros[DAVI] = { kid: 'kid-davi', seq: 1, fk: 'fk-nova' }; }, 'ok'],
    ['o chefe troca a chave com a versão seguinte: passa', () => { base(); troca(); }, ANA, (d) => { d.fk = 'fk-outra'; d.kv = 3; }, 'ok'],
    ['o chefe troca a chave com a MESMA versão', () => { base(); troca(); }, ANA, (d) => { d.fk = 'fk-outra'; }, SOBE],
    ['o chefe volta para a chave de antes (versão menor)', () => { base(); troca(); }, ANA, (d) => { d.fk = 'fk-teste'; d.kv = 1; }, SOBE],
    ['o chefe grava a versão como texto', () => { base(); troca(); }, ANA, (d) => { d.kv = '3'; }, SOBE],
    ['o chefe tira a versão do registro', () => { base(); troca(); }, ANA, (d) => { delete d.kv; }, SOBE],
    ['o chefe muda só os membros: passa', () => { base(); troca(); }, ANA, (d) => { d.membros[DAVI] = { kid: 'kid-davi', seq: 1, fk: 'fk-nova' }; }, 'ok']
  ];
  for (const [nome, fazer, quem, mudar, esperado] of CT) {
    fazer(); M.soChefeGiro = true;
    const novo = regCom(mudar), antes = await (async () => { await carregar(pg); return reg(); })();
    const p = await como(pg, quem, async () => { await pg.query(upd('dados = $1'), [J(novo)]); return 'ok'; });
    const depois = await reg();
    const m = await restMock(quem, 'PATCH', docUrl('cofre'), { dados: novo });
    const pm = p === 'ok' ? 'ok' : p.erro, mudou = J(depois.dados) !== J(antes.dados);
    const ok = pm === esperado && m === esperado && (p === 'ok' ? mudou && +depois.versao === +antes.versao + 1 && depois.p === quem : !mudou && (p.code === '42501'));
    conferir(ok, 'OMNI. ' + nome + ' → ' + (esperado === 'ok' ? 'passa' : '"' + esperado + '"') + '; o banco de mentira igual' + (ok ? '' : ' — sql ' + J(p) + ' · mock ' + J(m)));
  }
  /* a troca (settings/giro): só o chefe grava */
  const giroCasos = [
    ['a responsável muda a troca', () => { base(); troca(); }, BIA, 'PATCH', SO_CHEFE],
    ['a responsável cria a troca', () => { base(); }, BIA, 'POST', SO_CHEFE],
    ['o chefe muda a troca: passa', () => { base(); troca(); }, ANA, 'PATCH', 'ok'],
    ['o chefe cria a troca: passa', () => { base(); }, ANA, 'POST', 'ok']
  ];
  for (const [nome, fazer, quem, metodo, esperado] of giroCasos) {
    fazer(); M.soChefeGiro = true;
    const dados = { v: 1, vis: 'restrito', estado: 'preparado', por: quem, de: { kv: 2, fk: 'fk-nova' }, para: { kv: 3, fk: 'fk-3' } };
    await carregar(pg);
    const p = await como(pg, quem, async () => {
      if (metodo === 'PATCH') await pg.query(upd('dados = $1', 'giro'), [J(dados)]);
      else await pg.query("insert into public.omni_docs (grupo_id, colecao, id, vis, dados) values ($1, 'settings', 'giro', 'restrito', $2)", [GID, J(dados)]);
      return 'ok';
    });
    const g = (await pg.query("select dados from public.omni_docs where colecao = 'settings' and id = 'giro'")).rows[0];
    const m = await restMock(quem, metodo, metodo === 'PATCH' ? docUrl('giro') : '/rest/v1/omni_docs', metodo === 'PATCH' ? { dados } : { grupo_id: GID, colecao: 'settings', id: 'giro', vis: 'restrito', dados });
    const pm = p === 'ok' ? 'ok' : p.erro, gravou = !!g && g.dados.estado === 'preparado';
    const ok = pm === esperado && m === esperado && (esperado === 'ok') === gravou;
    conferir(ok, 'OMNI. ' + nome + ' → ' + (esperado === 'ok' ? 'passa' : '"' + esperado + '"') + '; o banco de mentira igual' + (ok ? '' : ' — sql ' + J(p) + ' · mock ' + J(m)));
  }
  /* não se apagam (C4): nem o registro nem a troca, nem pelo chefe; um registro que já nasce apagado também não */
  const apCasos = [
    ['o chefe apaga o registro', 'cofre', ANA], ['a responsável apaga o registro', 'cofre', BIA], ['o chefe apaga a troca', 'giro', ANA]
  ];
  for (const [nome, id, quem] of apCasos) {
    base(); troca(); M.soChefeGiro = true; await carregar(pg);
    const p = await como(pg, quem, async () => { await pg.query(upd('apagado_em = now()', id)); return 'ok'; });
    const viva = (await pg.query("select apagado_em from public.omni_docs where colecao = 'settings' and id = $1", [id])).rows[0].apagado_em === null;
    const m = await restMock(quem, 'PATCH', docUrl(id), { apagado_em: T0 });
    const ok = p.erro === NAO_APAGA && m === NAO_APAGA && viva;
    conferir(ok, 'OMNI. ' + nome + ' → "' + NAO_APAGA + '"; o banco de mentira igual' + (ok ? '' : ' — sql ' + J(p) + ' · mock ' + J(m)));
  }
  base(); M.soChefeGiro = true; db.omni_docs.splice(db.omni_docs.indexOf(doc('settings', 'cofre')), 1); await carregar(pg);
  const ins = await como(pg, ANA, async () => { await pg.query("insert into public.omni_docs (grupo_id, colecao, id, vis, dados, apagado_em) values ($1, 'settings', 'cofre', 'restrito', $2, now())", [GID, J({ fk: 'fk-x', kv: 1 })]); return 'ok'; });
  const insM = await restMock(ANA, 'POST', '/rest/v1/omni_docs', { grupo_id: GID, colecao: 'settings', id: 'cofre', vis: 'restrito', dados: { fk: 'fk-x', kv: 1 }, apagado_em: T0 });
  conferir(ins.erro === NAO_APAGA && insM === NAO_APAGA, 'OMNI. criar o registro já apagado → "' + NAO_APAGA + '"; o banco de mentira igual (' + J([ins, insM]) + ')');
  /* o que o gatilho não olha: os outros registros (settings/familia, o vault) */
  base(); troca(); M.soChefeGiro = true; await carregar(pg);
  const outros = await como(pg, BIA, async () => {
    await pg.query(upd("dados = jsonb_set(dados, '{nome}', '\"Outro nome\"')", 'familia'));
    await pg.query("update public.omni_docs set apagado_em = now() where colecao = 'vault' and id = 'v1'");
    return 'ok';
  });
  conferir(outros === 'ok', 'OMNI. os outros registros não mudam de regra: a responsável muda settings/familia e apaga uma linha do vault (passa)');
  /* o que roda por dentro do banco (sem login / como dono, ex. a LGPD) passa direto, como no omni_tg_docs */
  await pg.query("select set_config('app.uid', '', false)");
  let interno = 'ok'; try { await pg.query(upd("dados = jsonb_set(dados, '{kv}', '1')")); await pg.query(upd('apagado_em = now()', 'giro')); } catch (e) { interno = e.message; }
  conferir(interno === 'ok' && (await reg()).dados.kv === 1, 'OMNI. o que roda por dentro do banco (sem login, como dono) passa direto');
  M.soChefeGiro = false;

  console.log('\n' + (falhas ? 'FALHOU: ' + falhas + ' conferência(s)' : 'OK: os dois arquivos SQL da Parte E no Postgres local (PGlite), e o banco de mentira igual'));
  await pg.close();
  process.exit(falhas ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
