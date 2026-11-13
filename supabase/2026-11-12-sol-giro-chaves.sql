-- =====================================================================================
-- 2026-11-12-sol-giro-chaves.sql  —  SQL DA PLATAFORMA (projeto solverone-app), pedido pelo OmniLifeONE 2.27.0
-- !!! NÃO APLICAR DAQUI: vai para o chat do MoneyTRIO; o dono aplica no Supabase.
--     (nenhum script, robô ou automação aplica este arquivo; quem constrói o OmniLifeONE nunca roda nada no banco)
-- O OmniLifeONE 2.27.0 funciona sem ele: sem a sol_giro_situacao, o botão "Trocar a chave de segurança da família" e o
-- "Terminar a troca" ficam desligados com "Ainda não dá: falta uma atualização do SolverONE." (nada muda).
-- Testado num Postgres local (PGlite), com as tabelas e funções da base em versão mínima: teste/sql-giro.js (os casos abaixo).
-- O texto daqui para baixo é o revisado (pin-e/sol_descartar_chaves_antigas.sql), sem mudança.
-- =====================================================================================
-- =====================================================================================
-- PLATAFORMA — TROCA DA CHAVE DA FAMÍLIA (CF): a SITUAÇÃO para o app e o DESCARTE das chaves antigas (sol_grupo_chaves)
-- Funções:
--   sol_giro_situacao(p_grupo uuid) → jsonb            só números e sim/não; nenhum conteúdo, nenhum nome, nenhum id
--   sol_descartar_chaves_antigas(p_grupo uuid, p_ate_versao integer) → integer   quantas linhas apagou
-- Pedido: Parte E, item (d), pedido v3 (11/Nov/2026). Escrito pelo OmniLifeONE, para o chat principal do MoneyTRIO.
-- Projeto Supabase: solverone-app
--
-- !!! NÃO RODAR ANTES DA REVISÃO (regra C10) E DO "PODE APLICAR" DO DONO. Depois, rodar UMA vez no SQL Editor.
--     Idempotente (create or replace). Só cria DUAS funções: não muda tabela, regra (RLS) nem permissão de tabela.
--
-- O QUE MUDOU (revisão do crítico, 11/Nov/2026). Este arquivo substitui o rascunho de uma função só e a seção 7.2 do
-- desenho-e.md:
--   vs. o rascunho: + sol_giro_situacao (a trava "o MoneyTRIO já migrou?" e a conferência no servidor, como no desenho 7.2);
--     + a exigência da troca "feito" e conferida (giro_ok); erros com o prefixo "giro:" / "descartar:<motivo>" (o app traduz).
--   vs. o desenho 7.2:
--     1. giro_ok só vale se o settings/'giro' é 'restrito', se quem gravou por último (atualizado_por, que o gatilho
--        omni_tg_docs carimba no banco) é um CHEFE ativo e se a troca foi de verdade (de.fk existe e é diferente da atual).
--        Antes, qualquer responsável (ou um adulto, criando o 'giro' como 'publico', que a RLS deixa) escrevia "feito".
--     2. "Quem precisa ter a CF atual" NÃO depende mais da decisão D-E1: chefe e responsável SEMPRE; os outros só se o app
--        já entregou a CF ATUAL a eles (estão em giro.entregues, ou no registro com a fk atual). Assim: o SQL não precisa
--        andar junto com o filtro do app; um membro que não recebe a CF não trava o descarte para sempre; uma entrada
--        velha (fk antiga) que uma cópia restaurada pôs no registro não conta.
--     3. O descarte trava (for share) também o settings/'giro', não só o 'cofre': ninguém começa outra troca no meio.
--
-- "versão" NÃO é a kv da CF: a coluna versao de sol_grupo_chaves é uma sequência POR PESSOA (o OmniLifeONE grava
-- seq = maior da pessoa + 1 a cada embrulho: CF nova OU chave pessoal nova). A kv e a fk ficam dentro do envelope (o banco
-- não lê). Por isso o descarte protege a versão EM USO de cada pessoa, lida no registro do cofre do OmniLifeONE
-- (omni_docs, settings/'cofre': {fk, kv, membros: {uid: {kid, seq, fk}}}, sem segredo).
--
-- O banco confere, sem abrir nada (a kv e a fk de cada linha ficam do lado de fora do texto cifrado):
--   1. quem chama é chefe;  2. p_ate_versao < a maior versão do grupo;  3. o registro do cofre existe;
--   4. a troca terminou e foi conferida (settings/'giro': restrito, estado 'feito', para = registro, gravado por um chefe);
--   5. toda linha viva das Senhas da casa (vault) está com a CF do registro ({"c":1,kv,fk,…}); o _em também, ou foi apagado;
--   6. nenhuma mensagem não lida da ponte do grupo está fechada com outra CF;
--   7. o MoneyTRIO migrou: nenhuma money_docs viva fora de {"c":1,"m":…} e money_migracao registrada (se o grupo usa);
--   8. cada pessoa que precisa da CF tem a atual: no registro com a fk atual, a kid da chave pública dela e a seq = a maior
--      versão dela (nenhum aparelho velho gravou outra por cima). "Precisa" = membro ativo com chave pública que é chefe ou
--      responsável, ou que já recebeu a CF atual (giro.entregues ou registro com a fk atual).
-- Depois apaga, de cada pessoa, só as linhas <= p_ate_versao e MENORES que a versão em uso dela. De quem saiu do grupo, e
-- de quem está no grupo mas não tem a CF atual no registro (a política do app não dá a CF a ela), as linhas <= p_ate_versao.
-- Sugestão para o app: p_ate_versao = (a maior versão do grupo) - 1.
-- Não confere (fica com o app): se o envelope em uso abre mesmo a CF atual; as cópias que só existem nos aparelhos; os
-- comprovantes do MoneyTRIO no Storage (confira com a migração dele).
-- Lê (sem mudar) omni_docs (OmniLifeONE) e money_docs/money_migracao (MoneyTRIO): é o único jeito de saber que a
-- conferência aconteceu. Não escreve nelas (regra C3).
-- Regras: SECURITY DEFINER + search_path = '' + nomes qualificados; GRANT explícito; conferência no fim.
--
-- Antes do "pode aplicar", rodar num branch/banco de teste com os casos: não-chefe; versão mais nova; sem giro 'feito';
-- giro 'feito' gravado por um responsável (recusa); giro 'publico' (recusa); cofre com fk velha; _em velho; ponte pendente
-- com outra fk; money_docs velho; money_migracao ausente; responsável sem entrega (recusa); membro sem CF nenhuma (NÃO
-- trava); membro com entrada velha no registro vinda de cópia (NÃO trava; as linhas dele saem); ping-pong (seq maior que a
-- do registro: recusa); membro que entrou depois da troca com seq 1 (fica); quem saiu do grupo (sai); rodar duas vezes (a
-- segunda apaga 0).
-- =====================================================================================

begin;
set local client_min_messages = warning;

-- 0) Porteiro
do $$
declare v_falta text := '';
begin
  if to_regclass('public.sol_grupo_chaves') is null then v_falta := v_falta || ' sol_grupo_chaves'; end if;
  if to_regclass('public.sol_grupo_membros') is null then v_falta := v_falta || ' sol_grupo_membros'; end if;
  if to_regclass('public.sol_chave_publica') is null then v_falta := v_falta || ' sol_chave_publica'; end if;
  if to_regclass('public.sol_ponte') is null then v_falta := v_falta || ' sol_ponte'; end if;
  if to_regclass('public.omni_docs') is null then v_falta := v_falta || ' omni_docs (OmniLifeONE)'; end if;
  if to_regclass('public.money_docs') is null then v_falta := v_falta || ' money_docs (MoneyTRIO v1)'; end if;
  if to_regclass('public.money_migracao') is null then v_falta := v_falta || ' money_migracao (MoneyTRIO v4)'; end if;
  if to_regprocedure('public.sol_meu_papel(uuid)') is null then v_falta := v_falta || ' sol_meu_papel(uuid)'; end if;
  if to_regprocedure('public.sol_exigir_conta()') is null then v_falta := v_falta || ' sol_exigir_conta()'; end if;
  if v_falta <> '' then raise exception 'sol_giro_chaves: falta:%.', v_falta; end if;
end $$;

-- 1) A situação (o app chama antes de trocar, na conferência e antes de descartar). Só o chefe.
create or replace function public.sol_giro_situacao(p_grupo uuid) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  v_reg jsonb; v_giro jsonb; v_giro_vis text; v_giro_por uuid; v_giro_ok boolean;
  v_fk text; v_kv jsonb;
  v_maior integer; v_vault bigint; v_apag bigint; v_pp bigint; v_po bigint;
  v_money_usa boolean; v_money_cf bigint; v_money_ok boolean; v_falta bigint;
begin
  perform public.sol_exigir_conta();
  if p_grupo is null or public.sol_meu_papel(p_grupo) is distinct from 'chefe' then
    raise exception 'giro:chefe Só o chefe da família vê isto.' using errcode = '42501';
  end if;
  select d.dados into v_reg from public.omni_docs d
   where d.grupo_id = p_grupo and d.colecao = 'settings' and d.id = 'cofre' and d.apagado_em is null;
  select d.dados, d.vis, d.atualizado_por into v_giro, v_giro_vis, v_giro_por from public.omni_docs d
   where d.grupo_id = p_grupo and d.colecao = 'settings' and d.id = 'giro' and d.apagado_em is null;
  v_fk := v_reg->>'fk';
  v_kv := v_reg->'kv';
  select max(c.versao) into v_maior from public.sol_grupo_chaves c where c.grupo_id = p_grupo;

  -- a troca terminou e foi conferida: 'restrito' (um adulto comum não cria 'restrito'), gravada por último por um chefe
  -- ativo (atualizado_por vem do gatilho omni_tg_docs, não do app), e foi troca de verdade (de.fk existe e é outra)
  v_giro_ok := coalesce(v_giro->>'estado' = 'feito'
                        and v_giro->'para'->>'fk' = v_fk and v_giro->'para'->'kv' = v_kv
                        and coalesce(v_giro->'de'->>'fk', '') not in ('', v_fk)
                        and v_giro_vis = 'restrito'
                        and exists (select 1 from public.sol_grupo_membros m
                                     where m.grupo_id = p_grupo and m.user_id = v_giro_por
                                       and m.status = 'ativo' and m.papel = 'chefe'), false);

  -- Senhas da casa: vivas fora da CF do registro (o _em velho e qualquer forma desconhecida contam) e apagadas que ainda
  -- guardam texto fechado com outra CF (só informativo)
  select count(*) filter (where d.apagado_em is null
                            and not coalesce(case when x.j ? 'c'  then x.j->>'fk' = v_fk and x.j->'kv' = v_kv
                                                  when x.j ? 'em' then x.j->'d'->'em'->>'fk' = v_fk and x.j->'d'->'em'->'kv' = v_kv
                                             end, false)),
         count(*) filter (where d.apagado_em is not null and d.dados_cifrado is not null
                            and not coalesce(x.j ? 'c' and x.j->>'fk' = v_fk, false))
    into v_vault, v_apag
    from public.omni_docs d
   cross join lateral (select case when pg_input_is_valid(d.dados_cifrado, 'jsonb') then d.dados_cifrado::jsonb end as j) x
   where d.grupo_id = p_grupo and d.colecao = 'vault';

  -- ponte: não lidas do grupo com conteúdo fechado (todas) e as fechadas com outra CF (lê a tabela: não sofre o filtro de
  -- sol_ponte_config da sol_ponte_minha_caixa)
  select count(*),
         count(*) filter (where not coalesce(case when pg_input_is_valid(p.dados->>'cif', 'jsonb')
                                                  then ((p.dados->>'cif')::jsonb)->>'fk' = v_fk end, false))
    into v_pp, v_po
    from public.sol_ponte p
   where p.grupo_id = p_grupo and p.lido_em is null and p.dados ? 'cif';

  -- MoneyTRIO: ainda há linha viva com a CF? a migração foi registrada?
  v_money_usa := exists (select 1 from public.money_docs d where d.grupo_id = p_grupo);
  select count(*) into v_money_cf from public.money_docs d
   where d.grupo_id = p_grupo and d.apagado_em is null and d.dados_cifrado not like '{"c":1,"m":%';
  v_money_ok := not v_money_usa or exists (select 1 from public.money_migracao g where g.grupo_id = p_grupo);

  -- quem precisa da CF atual e não está com ela (contagem, sem nome). "Precisa" não depende da decisão D-E1: chefe e
  -- responsável sempre; os outros só se o app já entregou a atual a eles (giro.entregues, ou registro com a fk atual)
  select count(*) into v_falta
    from public.sol_grupo_membros m
    join public.sol_chave_publica k on k.user_id = m.user_id
   cross join lateral (select v_reg->'membros'->(m.user_id::text) as e) s
   where m.grupo_id = p_grupo and m.status = 'ativo' and m.user_id is not null
     and (m.papel in ('chefe', 'responsavel')
          or coalesce(v_giro->'entregues' ? (m.user_id::text), false)
          or coalesce(s.e->>'fk' = v_fk, false))
     and not coalesce((s.e->>'fk' = v_fk
                       and s.e->>'kid' is not distinct from k.chave_publica->>'kid'
                       and jsonb_typeof(s.e->'seq') = 'number'
                       and s.e->'seq' = to_jsonb((select max(c.versao) from public.sol_grupo_chaves c
                                                   where c.grupo_id = p_grupo and c.user_id = m.user_id))), false);

  return jsonb_build_object(
    'registro',                 coalesce(coalesce(v_fk, '') <> '' and jsonb_typeof(v_kv) = 'number', false),
    'maior_versao',             coalesce(v_maior, 0),
    'vault_fora',               v_vault,
    'vault_apagadas_com_texto', v_apag,
    'ponte_pendentes',          v_pp,
    'ponte_outra',              v_po,
    'money_usa',                v_money_usa,
    'money_cf',                 v_money_cf,
    'money_migrado',            v_money_ok,
    'falta_entregar',           v_falta,
    'giro',                     v_giro->>'estado',
    'giro_ok',                  v_giro_ok);
end $$;
revoke all on function public.sol_giro_situacao(uuid) from public, anon;
grant execute on function public.sol_giro_situacao(uuid) to authenticated, service_role;

-- 2) O descarte
create or replace function public.sol_descartar_chaves_antigas(p_grupo uuid, p_ate_versao integer) returns integer
language plpgsql security definer set search_path = '' as $$
declare
  v_reg jsonb; v_fk text; v_s jsonb; v_n integer;
begin
  perform public.sol_exigir_conta();
  if p_grupo is null or public.sol_meu_papel(p_grupo) is distinct from 'chefe' then
    raise exception 'descartar:chefe Só o chefe da família descarta as chaves antigas.' using errcode = '42501';
  end if;
  if p_ate_versao is null or p_ate_versao < 1 then
    raise exception 'descartar:versao Diga até qual versão descartar (1 ou mais).' using errcode = '22023';
  end if;
  -- trava o registro do cofre E o estado da troca até o fim desta conta: ninguém troca a CF nem começa outra troca no meio
  perform 1 from public.omni_docs d
   where d.grupo_id = p_grupo and d.colecao = 'settings' and d.id in ('cofre', 'giro') and d.apagado_em is null
     for share;
  select d.dados into v_reg from public.omni_docs d
   where d.grupo_id = p_grupo and d.colecao = 'settings' and d.id = 'cofre' and d.apagado_em is null;
  v_fk := v_reg->>'fk';
  if coalesce(v_fk, '') = '' or jsonb_typeof(v_reg->'kv') is distinct from 'number' then
    raise exception 'descartar:registro A família ainda não tem o registro da chave.' using errcode = '42501';
  end if;
  v_s := public.sol_giro_situacao(p_grupo);
  if p_ate_versao >= (v_s->>'maior_versao')::integer then
    raise exception 'descartar:versao Não há chave antiga para descartar: a versão pedida é a mais nova (ou mais nova que ela).' using errcode = '22023';
  end if;
  if not (v_s->>'giro_ok')::boolean then
    raise exception 'descartar:giro A troca da chave de segurança ainda não terminou ou não foi conferida.' using errcode = '42501';
  end if;
  if (v_s->>'vault_fora')::bigint > 0 then
    raise exception 'descartar:vault Ainda há senhas fechadas com a chave antiga (ou o código de emergência não foi refeito).' using errcode = '42501';
  end if;
  if (v_s->>'ponte_outra')::bigint > 0 then
    raise exception 'descartar:ponte Há mensagens da Saúde para o MoneyTRIO, ainda não lidas, fechadas com a chave antiga.' using errcode = '42501';
  end if;
  if (v_s->>'money_cf')::bigint > 0 or not (v_s->>'money_migrado')::boolean then
    raise exception 'descartar:money O MoneyTRIO ainda não terminou a preparação da família.' using errcode = '42501';
  end if;
  if (v_s->>'falta_entregar')::bigint > 0 then
    raise exception 'descartar:membros Falta entregar a chave nova para % pessoa(s) da família.', v_s->>'falta_entregar' using errcode = '42501';
  end if;

  -- de cada pessoa, só o que é mais velho que a versão em uso dela (quem saiu do grupo, ou não tem a CF atual no
  -- registro: tudo até p_ate_versao)
  delete from public.sol_grupo_chaves c
   where c.grupo_id = p_grupo
     and c.versao <= p_ate_versao
     and not exists (
           select 1
             from public.sol_grupo_membros m
            where m.grupo_id = p_grupo and m.user_id = c.user_id and m.status = 'ativo'
              and v_reg->'membros'->(m.user_id::text)->>'fk' = v_fk
              and jsonb_typeof(v_reg->'membros'->(m.user_id::text)->'seq') = 'number'
              and c.versao >= (v_reg->'membros'->(m.user_id::text)->>'seq')::numeric);
  get diagnostics v_n = row_count;
  return v_n;
end $$;
revoke all on function public.sol_descartar_chaves_antigas(uuid, integer) from public, anon;
grant execute on function public.sol_descartar_chaves_antigas(uuid, integer) to authenticated, service_role;

-- 3) Conferência
do $$
declare v_erros text := ''; f text;
begin
  foreach f in array array['public.sol_giro_situacao(uuid)', 'public.sol_descartar_chaves_antigas(uuid,integer)'] loop
    if to_regprocedure(f) is null then v_erros := v_erros || ' ' || f || ' não foi criada';
    else
      if has_function_privilege('anon', f, 'execute') or has_function_privilege('public', f, 'execute') then
        v_erros := v_erros || ' ' || f || ' aberta para visitante'; end if;
      if not has_function_privilege('authenticated', f, 'execute') then
        v_erros := v_erros || ' ' || f || ' fechada para o app'; end if;
      if not exists (select 1 from pg_catalog.pg_proc p where p.oid = f::regprocedure
                        and p.prosecdef and p.proconfig @> array['search_path=""']) then
        v_erros := v_erros || ' ' || f || ' sem SECURITY DEFINER ou sem search_path vazio'; end if;
    end if;
  end loop;
  if has_table_privilege('authenticated', 'public.sol_grupo_chaves', 'delete') or has_table_privilege('anon', 'public.sol_grupo_chaves', 'delete') then
    v_erros := v_erros || ' o app apaga chave direto na tabela (era para ser só pela função)';
  end if;
  if v_erros <> '' then raise exception 'sol_giro_chaves: conferência falhou:%', v_erros; end if;
  raise notice 'sol_giro_chaves: só o chefe; a situação sem conteúdo; o descarte só depois da troca conferida por um chefe, nunca a versão em uso nem as mais novas. Tudo certo.';
end $$;

commit;
