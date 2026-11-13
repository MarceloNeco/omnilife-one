-- =====================================================================================
-- 2026-11-12-omni-giro-so-chefe.sql  —  OmniLifeONE 2.27.0 no projeto solverone-app (Supabase)
-- SÓ O CHEFE TROCA A CHAVE DE SEGURANÇA DA FAMÍLIA, A VERSÃO DELA SÓ SOBE, E O REGISTRO DELA NÃO SE APAGA
-- -------------------------------------------------------------------------------------
-- !!! O DONO APLICA (não aplicar daqui: nenhum script, robô ou automação; quem constrói o app nunca roda nada no banco).
--
-- POR QUE: "Trocar a chave de segurança da família" (⚙ → Segurança e aparelhos → Avançado) só aparece para o chefe, e o app
-- nunca volta a chave para uma mais velha. Este arquivo faz o BANCO garantir o mesmo, para nenhum aparelho desatualizado,
-- cópia restaurada ou pessoa sem permissão desfazer a troca (decisão D-E3 / correção C4 da Parte E):
--   1. settings/'giro' (o andamento da troca, sem segredo em claro): só um chefe cria ou muda;
--   2. settings/'cofre' (o registro: qual é a chave de agora, {fk, kv, membros}): só um chefe muda a chave (fk) ou a versão
--      (kv), e a versão só SOBE (uma chave por versão; um aparelho velho nunca volta o registro). Entregar a chave para alguém
--      (mudar só "membros", o que um responsável também faz) continua livre;
--   3. os dois NÃO SE APAGAM pelo app (apagado_em): sem o registro, um aparelho novo criaria uma segunda chave da família.
-- O que roda por dentro do banco (sem login, ou como dono do banco: ex. a LGPD) passa direto, como no omni_tg_docs.
--
-- O QUE NÃO ENTRA (de propósito): o gatilho opcional do C2, "recusar no vault uma linha fechada com uma chave que não é a do
-- registro". Um aparelho ainda não atualizado que grava com a chave de antes perderia a mudança (o app de antes tira da fila o
-- que o banco recusa); sem o gatilho, a linha chega, o vigia de um aparelho atualizado a passa para a chave nova, e o
-- "Terminar a troca" não deixa apagar as versões antigas enquanto houver uma linha assim (sol_giro_situacao.vault_fora).
--
-- O app funciona com e sem este arquivo: sem ele, as guardas do app valem sozinhas; com ele, o banco também recusa (403).
-- Testado num Postgres local (PGlite), com as tabelas e funções da base em versão mínima: teste/sql-giro.js.
-- Cria uma função de gatilho e um gatilho; não muda tabela, regra (RLS) nem dado. Pode rodar mais de uma vez.
-- Nenhuma chave, senha ou dado de pessoa neste arquivo.
--
-- QUEM APLICA: o DONO, com as próprias mãos, quando quiser (pode ser antes ou depois do SQL da plataforma):
--   1. supabase.com → projeto solverone-app → SQL Editor → New query
--   2. cole este arquivo inteiro → Run
--   3. a última mensagem diz "omni_giro_so_chefe: ... Tudo certo."
-- =====================================================================================

begin;
set local client_min_messages = warning;

-- 0) Porteiro
do $$
declare v_falta text := '';
begin
  if to_regclass('public.omni_docs') is null then v_falta := v_falta || ' omni_docs'; end if;
  if to_regprocedure('public.omni_sou_chefe(uuid)') is null then v_falta := v_falta || ' omni_sou_chefe(uuid)'; end if;
  if to_regprocedure('auth.uid()') is null then v_falta := v_falta || ' auth.uid()'; end if;
  if v_falta <> '' then raise exception 'omni_giro_so_chefe: falta:%.', v_falta; end if;
end $$;

-- 1) A regra. SECURITY INVOKER de propósito: o current_user aqui é quem grava (authenticated, pelo app); como definer ele seria
--    o dono e a regra nunca valeria. O nome do gatilho vem antes de "omni_docs_regras" (os BEFORE rodam em ordem alfabética):
--    esta regra vê o que o app mandou
create or replace function public.omni_tg_giro_so_chefe() returns trigger
language plpgsql set search_path = '' as $$
begin
  if (select auth.uid()) is null or current_user not in ('authenticated', 'anon') then return new; end if;  -- funções internas
  if new.id = 'giro' and not public.omni_sou_chefe(new.grupo_id) then
    raise exception 'Só o chefe da família troca a chave de segurança.' using errcode = '42501';
  end if;
  if new.id = 'cofre' and tg_op = 'UPDATE'
     and ((new.dados->'fk') is distinct from (old.dados->'fk') or (new.dados->'kv') is distinct from (old.dados->'kv')) then
    if not public.omni_sou_chefe(new.grupo_id) then
      raise exception 'Só o chefe da família troca a chave de segurança.' using errcode = '42501';
    end if;
    -- uma chave por versão, e a versão só sobe (um aparelho velho nunca volta o registro)
    if jsonb_typeof(new.dados->'kv') is distinct from 'number'
       or (jsonb_typeof(old.dados->'kv') = 'number' and (new.dados->>'kv')::numeric <= (old.dados->>'kv')::numeric) then
      raise exception 'A versão da chave de segurança só pode subir.' using errcode = '42501';
    end if;
  end if;
  -- o registro da chave e o andamento da troca não se apagam pelo app (C4)
  if new.apagado_em is not null and (tg_op = 'INSERT' or old.apagado_em is null) then
    raise exception 'O registro da chave de segurança não se apaga.' using errcode = '42501';
  end if;
  return new;
end $$;
-- função de gatilho: ninguém do app a chama direto (o Postgres só deixa chamá-la como gatilho). O GRANT ao service_role é o
-- GRANT explícito que a diretriz pede para todo CREATE em public (teste/sql-grants.js); o app (anon, authenticated) fica sem
revoke all on function public.omni_tg_giro_so_chefe() from public, anon, authenticated;
grant execute on function public.omni_tg_giro_so_chefe() to service_role;

drop trigger if exists omni_docs_giro_so_chefe on public.omni_docs;
create trigger omni_docs_giro_so_chefe before insert or update on public.omni_docs
  for each row when (new.colecao = 'settings' and new.id in ('cofre', 'giro'))
  execute function public.omni_tg_giro_so_chefe();

-- 2) Conferência
do $$
declare v_erros text := '';
begin
  if not exists (select 1 from pg_catalog.pg_trigger t
                  where t.tgname = 'omni_docs_giro_so_chefe' and t.tgrelid = 'public.omni_docs'::regclass and t.tgenabled <> 'D') then
    v_erros := v_erros || ' o gatilho não foi criado (ou está desligado);';
  end if;
  if not exists (select 1 from pg_catalog.pg_proc p where p.oid = 'public.omni_tg_giro_so_chefe()'::regprocedure
                    and not p.prosecdef and p.proconfig @> array['search_path=""']) then
    v_erros := v_erros || ' a função não é SECURITY INVOKER com search_path vazio;';
  end if;
  if has_function_privilege('anon', 'public.omni_tg_giro_so_chefe()', 'execute')
     or has_function_privilege('authenticated', 'public.omni_tg_giro_so_chefe()', 'execute') then
    v_erros := v_erros || ' a função ficou aberta para o app;';
  end if;
  if v_erros <> '' then raise exception 'omni_giro_so_chefe: conferência falhou:%', v_erros; end if;
  raise notice 'omni_giro_so_chefe: só o chefe muda a chave de segurança, a versão dela só sobe e o registro não se apaga. Tudo certo.';
end $$;

commit;
