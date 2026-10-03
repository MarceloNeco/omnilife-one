-- =====================================================================================
-- OmniLifeONE — tabelas omni_* sobre a base comum da plataforma SolverONE
-- Contrato de dados v1 (03/Out/2026) — ver PLATAFORMA-DADOS.md e PLANO-SUPABASE-OmniLifeONE.md
-- Projeto Supabase: solverone-app (São Paulo)
--
-- !!! NÃO RODAR ANTES DA REVISÃO (regra C10). Depois de revisado, rodar UMA vez no SQL Editor.
--     É idempotente: rodar de novo não estraga nada nem duplica.
--
-- Depende da BASE COMUM (feita no chat do RootifyONE), que precisa existir ANTES:
--   public.sol_grupos, public.sol_grupo_membros, public.sol_grupo_convites, public.sol_apps,
--   public.sol_sou_membro(uuid), public.sol_meu_papel(uuid), public.sol_sou_responsavel(uuid).
--   Se faltar algo, o arquivo para logo no começo com uma mensagem e NADA é criado.
--
-- O que este arquivo reproduz (regras de hoje do regras-firestore-OmniLifeONE.txt):
--   papéis chefe/responsável/membro/criança · visibilidade restrita · governança de 48 h para
--   rebaixar/remover chefe · passar a criação só com aceite · convites com prazo e vagas ·
--   pedido de entrada com aprovação de 1 ou 2 responsáveis · acesso de emergência ao cofre ·
--   aparelhos conectados · registro de combinados que não se edita · histórico só de inclusão.
--
-- Regras de escrita deste arquivo: SECURITY DEFINER + SET search_path = '' + nomes qualificados;
-- GRANTs explícitos; nada de DELETE de contas; conferência no fim.
-- =====================================================================================

begin;
set local client_min_messages = warning;

-- -------------------------------------------------------------------------------------
-- 0) A base comum existe? (senão para tudo, sem criar nada)
-- -------------------------------------------------------------------------------------
do $$
declare v_falta text := '';
begin
  if to_regclass('public.sol_grupos') is null then v_falta := v_falta || ' sol_grupos'; end if;
  if to_regclass('public.sol_grupo_membros') is null then v_falta := v_falta || ' sol_grupo_membros'; end if;
  if to_regclass('public.sol_grupo_convites') is null then v_falta := v_falta || ' sol_grupo_convites'; end if;
  if to_regclass('public.sol_apps') is null then v_falta := v_falta || ' sol_apps'; end if;
  if to_regprocedure('public.sol_sou_membro(uuid)') is null then v_falta := v_falta || ' sol_sou_membro(uuid)'; end if;
  if to_regprocedure('public.sol_meu_papel(uuid)') is null then v_falta := v_falta || ' sol_meu_papel(uuid)'; end if;
  if to_regprocedure('public.sol_sou_responsavel(uuid)') is null then v_falta := v_falta || ' sol_sou_responsavel(uuid)'; end if;
  if to_regprocedure('auth.uid()') is null then v_falta := v_falta || ' auth.uid()'; end if;
  if v_falta <> '' then
    raise exception 'OmniLifeONE: falta a base comum da plataforma:%. Rode antes o SQL da base (chat do RootifyONE).', v_falta;
  end if;
end $$;

-- -------------------------------------------------------------------------------------
-- 1) Funções de apoio para as regras (quem sou eu nesta família)
--    Papéis do contrato: 'chefe' | 'responsavel' | 'membro' | 'crianca'
-- -------------------------------------------------------------------------------------
create or replace function public.omni_sou_membro(p_grupo uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select coalesce(public.sol_sou_membro(p_grupo), false);
$$;

create or replace function public.omni_sou_chefe(p_grupo uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select coalesce(public.sol_meu_papel(p_grupo) = 'chefe', false);
$$;

create or replace function public.omni_sou_responsavel(p_grupo uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select coalesce(public.sol_meu_papel(p_grupo) in ('chefe', 'responsavel'), false);
$$;

create or replace function public.omni_sou_adulto(p_grupo uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select coalesce(public.sol_meu_papel(p_grupo) in ('chefe', 'responsavel', 'membro'), false);
$$;

-- papel de OUTRA pessoa (ativa) na família; null se não for membro ativo
create or replace function public.omni_papel_de(p_grupo uuid, p_user uuid) returns text
language sql stable security definer set search_path = '' as $$
  select m.papel from public.sol_grupo_membros m
   where m.grupo_id = p_grupo and m.user_id = p_user and m.status = 'ativo'
   limit 1;
$$;

-- mesclar json: o segundo vence; null apaga a chave; objetos se mesclam por dentro
create or replace function public.omni_jsonb_mesclar(a jsonb, b jsonb) returns jsonb
language plpgsql immutable set search_path = '' as $$
declare k text; v jsonb; r jsonb := coalesce(a, '{}'::jsonb);
begin
  if b is null or jsonb_typeof(b) <> 'object' then return r; end if;
  for k, v in select * from jsonb_each(b) loop
    if v = 'null'::jsonb then r := r - k;
    elsif jsonb_typeof(v) = 'object' and jsonb_typeof(r -> k) = 'object' then r := jsonb_set(r, array[k], public.omni_jsonb_mesclar(r -> k, v));
    else r := jsonb_set(r, array[k], v, true);
    end if;
  end loop;
  return r;
end $$;

-- -------------------------------------------------------------------------------------
-- 2) Tabelas
-- -------------------------------------------------------------------------------------

-- 2.1 Regras da família no Omni (o grupo em si é sol_grupos)
create table if not exists public.omni_familia (
  grupo_id        uuid primary key references public.sol_grupos(id),
  dono            uuid not null references auth.users(id),          -- "criador da família": sempre chefe; só muda com aceite
  aprovacoes      smallint not null default 1 check (aprovacoes in (1, 2)),
  convite_horas   integer not null default 72 check (convite_horas between 1 and 720),
  em_espera_dias  integer not null default 2 check (em_espera_dias between 1 and 30),
  em_contatos     uuid[] not null default '{}',                      -- contatos de emergência do cofre
  idade_adulto    smallint not null default 18 check (idade_adulto in (16, 18, 21)),
  criado_por      uuid references auth.users(id),
  criado_em       timestamptz not null default now(),
  atualizado_em   timestamptz not null default now()
);

-- 2.2 Registros do app (as coleções de hoje). Um registro = um documento do Firestore.
--     Saúde, documentos e cofre vão CIFRADOS no aparelho (dados_cifrado), nunca em claro (C7).
--     Apagar = marcar apagado_em (para os outros aparelhos saberem, mesmo sem internet na hora).
create table if not exists public.omni_docs (
  grupo_id        uuid not null references public.sol_grupos(id),
  colecao         text not null check (colecao in ('people','health','items','shop','requests','purchases','prices','events','routine',
                                                   'tasks','contacts','places','spots','school','things','maint','vault','guides','docs',
                                                   'files','settings','msgs','reminders','checkins','expects','coexp')),
  id              text not null check (id ~ '^[A-Za-z0-9_.:@-]{1,80}$'),
  vis             text not null default 'publico' check (vis in ('publico', 'restrito')),
  dados           jsonb check (dados is null or jsonb_typeof(dados) = 'object'),
  dados_cifrado   text check (dados_cifrado is null or length(dados_cifrado) <= 2000000),
  versao          bigint not null default 1,
  criado_por      uuid references auth.users(id),
  criado_em       timestamptz not null default now(),
  atualizado_por  uuid references auth.users(id),
  atualizado_em   timestamptz not null default now(),
  apagado_em      timestamptz,
  primary key (grupo_id, colecao, id),
  constraint omni_docs_sensivel_cifrado check (colecao not in ('vault', 'health', 'docs') or dados is null),
  constraint omni_docs_tem_conteudo check (apagado_em is not null or dados is not null or dados_cifrado is not null)
);
create index if not exists omni_docs_sync on public.omni_docs (grupo_id, atualizado_em);

-- 2.3 Duas casas: registro de combinados (só se acrescenta; ninguém edita nem apaga)
create table if not exists public.omni_combinados (
  grupo_id        uuid not null references public.sol_grupos(id),
  id              text not null check (id ~ '^[A-Za-z0-9_.:@-]{1,80}$'),
  vis             text not null default 'publico' check (vis in ('publico', 'restrito')),
  dados           jsonb not null check (jsonb_typeof(dados) = 'object' and coalesce(jsonb_typeof(dados -> 'at') = 'string', false)),
  criado_por      uuid references auth.users(id),
  criado_em       timestamptz not null default now(),
  atualizado_em   timestamptz not null default now(),
  primary key (grupo_id, id)
);

-- 2.4 Histórico de segurança (só inclusão)
create table if not exists public.omni_historico (
  id              bigint generated always as identity primary key,
  grupo_id        uuid not null references public.sol_grupos(id),
  criado_por      uuid references auth.users(id),
  nome            text check (length(nome) <= 120),
  acao            text not null check (acao ~ '^[a-z0-9._-]{2,60}$'),
  detalhe         text check (length(detalhe) <= 2000),
  criado_em       timestamptz not null default now(),
  atualizado_em   timestamptz not null default now()
);
create index if not exists omni_historico_grupo on public.omni_historico (grupo_id, criado_em desc);

-- 2.5 Pedidos de governança: hd_<uid> (rebaixar/remover chefe), tr_<grupo> (passar a criação), em_<uid> (emergência)
create table if not exists public.omni_governanca (
  grupo_id        uuid not null references public.sol_grupos(id),
  id              text not null check (id ~ '^(hd|em|tr)_[0-9a-f-]{36}$'),
  tipo            text not null check (tipo in ('rebaixar', 'remover', 'transferir', 'emergencia')),
  alvo            uuid references auth.users(id),
  por             uuid not null references auth.users(id),
  por_nome        text check (length(por_nome) <= 120),
  status          text not null default 'pendente' check (status in ('pendente','aprovado','vetado','aceito','recusado','executado','cancelado','liberado')),
  executar_apos   timestamptz,
  aprovacoes      jsonb not null default '{}'::jsonb,
  dados           jsonb not null default '{}'::jsonb,
  criado_por      uuid references auth.users(id),
  criado_em       timestamptz not null default now(),
  atualizado_em   timestamptz not null default now(),
  respondido_em   timestamptz,
  feito_em        timestamptz,
  primary key (grupo_id, id)
);

-- 2.6 Acesso de emergência ao cofre já liberado (a pessoa abre com o código que recebeu fora do app)
create table if not exists public.omni_cofre_liberado (
  grupo_id        uuid not null references public.sol_grupos(id),
  user_id         uuid not null references auth.users(id),
  liberado_em     timestamptz not null default now(),
  criado_por      uuid references auth.users(id),
  criado_em       timestamptz not null default now(),
  atualizado_em   timestamptz not null default now(),
  primary key (grupo_id, user_id)
);

-- a pessoa está (ativa) numa família em que eu também estou? (para ver a chave pública dela)
create or replace function public.omni_mesma_familia(p_user uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.sol_grupo_membros a join public.sol_grupo_membros b on b.grupo_id = a.grupo_id
     where a.user_id = (select auth.uid()) and a.status = 'ativo' and b.user_id = p_user and b.status = 'ativo');
$$;

create or replace function public.omni_cofre_liberado_para_mim(p_grupo uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.omni_cofre_liberado c where c.grupo_id = p_grupo and c.user_id = (select auth.uid()))
     and public.omni_sou_membro(p_grupo);
$$;

-- 2.7 Aparelhos conectados
create table if not exists public.omni_aparelhos (
  grupo_id         uuid not null references public.sol_grupos(id),
  id               text not null check (id ~ '^[A-Za-z0-9_-]{4,40}$'),
  user_id          uuid not null references auth.users(id),
  nome             text check (length(nome) <= 80),
  tipo             text check (tipo in ('celular', 'computador')),
  primeiro_em      timestamptz not null default now(),
  ultimo_em        timestamptz not null default now(),
  desconectado     boolean not null default false,
  desconectado_por uuid references auth.users(id),
  desconectado_em  timestamptz,
  criado_por       uuid references auth.users(id),
  criado_em        timestamptz not null default now(),
  atualizado_em    timestamptz not null default now(),
  primary key (grupo_id, id)
);
create index if not exists omni_aparelhos_user on public.omni_aparelhos (user_id);

-- 2.8 Pedidos para entrar na família (o pedido fica guardado: aprovado, recusado ou cancelado)
create table if not exists public.omni_pedidos_entrada (
  grupo_id        uuid not null references public.sol_grupos(id),
  user_id         uuid not null references auth.users(id),
  nome            text check (length(nome) <= 120),
  email           text check (length(email) <= 200),
  codigo          text not null check (length(codigo) between 6 and 40),
  papel           text not null check (papel in ('chefe', 'responsavel', 'membro', 'crianca')),
  perfil_id       text check (perfil_id is null or perfil_id ~ '^[A-Za-z0-9_.:@-]{1,80}$'),
  para_nome       text check (length(para_nome) <= 120),
  convidado_por_nome text check (length(convidado_por_nome) <= 120),
  aprovacoes      jsonb not null default '{}'::jsonb,
  proposta        jsonb,
  status          text not null default 'pendente' check (status in ('pendente', 'aprovado', 'recusado', 'cancelado')),
  motivo          text check (length(motivo) <= 300),
  criado_por      uuid references auth.users(id),
  criado_em       timestamptz not null default now(),
  atualizado_em   timestamptz not null default now(),
  primary key (grupo_id, user_id)
);
create index if not exists omni_pedidos_user on public.omni_pedidos_entrada (user_id);

-- 2.8b Código de 4 números do pedido: aparece só na tela de quem pediu; quem aprova digita o que a pessoa diz
--      e o banco confere (3 erros = pedido recusado). Fica fora da tabela acima para chefes/responsáveis não verem.
create table if not exists public.omni_pedidos_verificacao (
  grupo_id        uuid not null,
  user_id         uuid not null,
  verificacao     text not null check (verificacao ~ '^[0-9]{4}$'),
  tentativas      smallint not null default 0 check (tentativas between 0 and 3),
  criado_por      uuid references auth.users(id),
  criado_em       timestamptz not null default now(),
  atualizado_em   timestamptz not null default now(),
  primary key (grupo_id, user_id),
  foreign key (grupo_id, user_id) references public.omni_pedidos_entrada (grupo_id, user_id)
);

-- 2.9 O que o Omni guarda a mais sobre cada convite (o convite em si é sol_grupo_convites)
create table if not exists public.omni_convite_info (
  codigo          text primary key check (length(codigo) between 6 and 40),
  grupo_id        uuid not null references public.sol_grupos(id),
  perfil_id       text check (perfil_id is null or perfil_id ~ '^[A-Za-z0-9_.:@-]{1,80}$'),
  para_nome       text check (length(para_nome) <= 120),
  criado_por_nome text check (length(criado_por_nome) <= 120),
  criado_por      uuid references auth.users(id),
  criado_em       timestamptz not null default now(),
  atualizado_em   timestamptz not null default now()
);

-- 2.10 Chaves para cifrar no aparelho (C7). O servidor só guarda chaves EMBRULHADAS; nunca a chave aberta.
--      chave pública de cada pessoa (para os outros embrulharem a chave da família para ela)
create table if not exists public.omni_chaves_publicas (
  user_id         uuid primary key references auth.users(id),
  chave_publica   jsonb not null check (jsonb_typeof(chave_publica) = 'object'),
  alg             text not null default 'ECDH-P256' check (alg in ('ECDH-P256', 'RSA-OAEP-256')),
  criado_por      uuid references auth.users(id),
  criado_em       timestamptz not null default now(),
  atualizado_em   timestamptz not null default now()
);
--      chave privada da pessoa, cifrada com a senha da conta/código de recuperação dela (para trocar de aparelho)
create table if not exists public.omni_chave_privada (
  user_id         uuid primary key references auth.users(id),
  privada_cifrado text not null check (length(privada_cifrado) <= 20000),
  sal             text not null,
  iteracoes       integer not null check (iteracoes between 100000 and 2000000),
  criado_por      uuid references auth.users(id),
  criado_em       timestamptz not null default now(),
  atualizado_em   timestamptz not null default now()
);
--      chave da família embrulhada para cada membro: 'familia' (todos) e 'restrito' (só chefes e responsáveis)
create table if not exists public.omni_chaves_grupo (
  grupo_id        uuid not null references public.sol_grupos(id),
  user_id         uuid not null references auth.users(id),
  tipo            text not null check (tipo in ('familia', 'restrito')),
  versao          integer not null default 1 check (versao >= 1),
  embrulhada_cifrado text not null check (length(embrulhada_cifrado) <= 20000),
  criado_por      uuid references auth.users(id),
  criado_em       timestamptz not null default now(),
  atualizado_em   timestamptz not null default now(),
  primary key (grupo_id, user_id, tipo, versao)
);

-- -------------------------------------------------------------------------------------
-- 3) Gatilhos: carimbos de quem/quando e campos que não podem mudar
--    As regras valem para o app (papel authenticated). Funções internas da plataforma (ex.: LGPD chamada por
--    admin_anonimizar_usuario, mesmo com o login de um admin) rodam como dono do banco e passam direto.
-- -------------------------------------------------------------------------------------
create or replace function public.omni_tg_carimbo() returns trigger
language plpgsql set search_path = '' as $$
begin
  if tg_op = 'INSERT' then
    if (select auth.uid()) is not null then new.criado_por := (select auth.uid()); end if;
    new.criado_em := now();
  else
    new.criado_por := old.criado_por;
    new.criado_em := old.criado_em;
  end if;
  new.atualizado_em := now();
  return new;
end $$;

do $$
declare t text;
begin
  foreach t in array array['omni_familia','omni_combinados','omni_governanca','omni_cofre_liberado','omni_aparelhos',
                           'omni_pedidos_entrada','omni_pedidos_verificacao','omni_convite_info','omni_chaves_publicas','omni_chave_privada','omni_chaves_grupo'] loop
    execute format('drop trigger if exists omni_carimbo on public.%I', t);
    execute format('create trigger omni_carimbo before insert or update on public.%I for each row execute function public.omni_tg_carimbo()', t);
  end loop;
end $$;

-- histórico: só inclusão; quem escreve é sempre quem está logado
create or replace function public.omni__meu_apelido(p_grupo uuid) returns text
language sql stable security definer set search_path = '' as $$
  select m.apelido from public.sol_grupo_membros m where m.grupo_id = p_grupo and m.user_id = (select auth.uid()) limit 1;
$$;

create or replace function public.omni_tg_historico() returns trigger
language plpgsql set search_path = '' as $$
begin
  if tg_op = 'INSERT' then
    if (select auth.uid()) is not null then
      new.criado_por := (select auth.uid());
      new.nome := coalesce(left(public.omni__meu_apelido(new.grupo_id), 120), new.nome);
    end if;
    new.criado_em := now(); new.atualizado_em := now();
    return new;
  end if;
  -- única exceção: a anonimização da LGPD (função interna, fora do app) troca nome e detalhe; nada mais muda
  if tg_op = 'UPDATE' and current_user not in ('authenticated', 'anon') and new.id = old.id and new.grupo_id = old.grupo_id
     and new.criado_por is not distinct from old.criado_por and new.acao = old.acao and new.criado_em = old.criado_em then
    new.atualizado_em := now();
    return new;
  end if;
  raise exception 'O histórico de segurança não se edita nem se apaga.';
end $$;
drop trigger if exists omni_historico_so_inclusao on public.omni_historico;
create trigger omni_historico_so_inclusao before insert or update or delete on public.omni_historico
  for each row execute function public.omni_tg_historico();

-- combinados: só inclusão
create or replace function public.omni_tg_combinados() returns trigger
language plpgsql set search_path = '' as $$
begin
  if tg_op <> 'INSERT' and current_user in ('authenticated', 'anon') then raise exception 'O registro de combinados não se edita nem se apaga.'; end if;
  return coalesce(new, old);
end $$;
drop trigger if exists omni_combinados_so_inclusao on public.omni_combinados;
create trigger omni_combinados_so_inclusao before update or delete on public.omni_combinados
  for each row execute function public.omni_tg_combinados();

-- registros do app: carimbo, versão (para conflito entre aparelhos), quem pode apagar e o que um adulto
-- pode mudar no pedido de compra de outra pessoa (só status e data da compra)
create or replace function public.omni_tg_docs() returns trigger
language plpgsql set search_path = '' as $$
declare v_uid uuid := (select auth.uid());
begin
  if tg_op = 'INSERT' then
    new.criado_por := coalesce(v_uid, new.criado_por);
    new.criado_em := now(); new.atualizado_por := v_uid; new.atualizado_em := now(); new.versao := 1;
    if new.apagado_em is not null then new.apagado_em := now(); end if;
    return new;
  end if;
  if new.grupo_id <> old.grupo_id or new.colecao <> old.colecao or new.id <> old.id then
    raise exception 'Não dá para mudar a família, a coleção ou o id de um registro.';
  end if;
  new.criado_por := old.criado_por; new.criado_em := old.criado_em;
  new.versao := old.versao + 1; new.atualizado_por := v_uid; new.atualizado_em := now();
  if v_uid is null or current_user not in ('authenticated', 'anon') then return new; end if;  -- funções internas (ex.: LGPD)
  if new.apagado_em is not null and old.apagado_em is null then new.apagado_em := now(); end if;
  if new.colecao = 'requests' then
    -- pedido de compra: chefe/responsável e quem pediu mudam e apagam; outro adulto só muda status e data da compra
    if not public.omni_sou_responsavel(new.grupo_id) and old.criado_por is distinct from v_uid then
      if new.vis <> old.vis or new.dados_cifrado is distinct from old.dados_cifrado or new.apagado_em is distinct from old.apagado_em
         or (coalesce(new.dados, '{}'::jsonb) - array['status', 'boughtAt', 'updatedAt', 'updatedBy'])
            <> (coalesce(old.dados, '{}'::jsonb) - array['status', 'boughtAt', 'updatedAt', 'updatedBy']) then
        raise exception 'No pedido de outra pessoa, você só pode mudar o status e a data da compra.';
      end if;
    end if;
  elsif (new.apagado_em is distinct from old.apagado_em) and not public.omni_sou_adulto(new.grupo_id) then
    -- nas outras coleções, apagar (ou desfazer o apagar) é coisa de adulto
    raise exception 'Peça para um adulto apagar.';
  end if;
  return new;
end $$;
drop trigger if exists omni_docs_regras on public.omni_docs;
create trigger omni_docs_regras before insert or update on public.omni_docs
  for each row execute function public.omni_tg_docs();

-- aparelhos: o próprio aparelho não se "religa" sozinho; só chefe desconecta outro
create or replace function public.omni_tg_aparelhos() returns trigger
language plpgsql set search_path = '' as $$
declare v_uid uuid := (select auth.uid());
begin
  if tg_op = 'INSERT' then
    if current_user in ('authenticated', 'anon') then
      if new.user_id is distinct from v_uid then raise exception 'Cada aparelho registra só a si mesmo.'; end if;
      new.desconectado := false; new.desconectado_por := null; new.desconectado_em := null;
    end if;
    return new;
  end if;
  if current_user not in ('authenticated', 'anon') or public.omni_sou_chefe(new.grupo_id) then
    if new.desconectado and not old.desconectado then new.desconectado_por := v_uid; new.desconectado_em := now(); end if;
    return new;
  end if;
  if new.user_id <> old.user_id then raise exception 'Não dá para mudar o dono do aparelho.'; end if;
  if old.desconectado and not new.desconectado then raise exception 'Aparelho desconectado não se reconecta sozinho.'; end if;
  if new.desconectado and not old.desconectado then new.desconectado_por := v_uid; new.desconectado_em := now();
  else new.desconectado_por := old.desconectado_por; new.desconectado_em := old.desconectado_em; end if;
  return new;
end $$;
drop trigger if exists omni_aparelhos_regras on public.omni_aparelhos;
create trigger omni_aparelhos_regras before insert or update on public.omni_aparelhos
  for each row execute function public.omni_tg_aparelhos();

-- -------------------------------------------------------------------------------------
-- 4) Regras de acesso (RLS) — o banco garante, não só a tela
-- -------------------------------------------------------------------------------------
alter table public.omni_familia          enable row level security;
alter table public.omni_docs             enable row level security;
alter table public.omni_combinados       enable row level security;
alter table public.omni_historico        enable row level security;
alter table public.omni_governanca       enable row level security;
alter table public.omni_cofre_liberado   enable row level security;
alter table public.omni_aparelhos        enable row level security;
alter table public.omni_pedidos_entrada  enable row level security;
alter table public.omni_pedidos_verificacao enable row level security;
alter table public.omni_convite_info     enable row level security;
alter table public.omni_chaves_publicas  enable row level security;
alter table public.omni_chave_privada    enable row level security;
alter table public.omni_chaves_grupo     enable row level security;

-- 4.1 família: todo membro lê as regras; mudar só pelas funções (chefe)
drop policy if exists omni_familia_ler on public.omni_familia;
create policy omni_familia_ler on public.omni_familia for select to authenticated
  using (public.omni_sou_membro(grupo_id));

-- 4.2 registros
--   ler: membro; 'restrito' só chefe/responsável; cofre só chefe/responsável ou contato de emergência liberado
drop policy if exists omni_docs_ler on public.omni_docs;
create policy omni_docs_ler on public.omni_docs for select to authenticated
  using (public.omni_sou_membro(grupo_id) and (
    case when colecao = 'vault' then public.omni_sou_responsavel(grupo_id) or public.omni_cofre_liberado_para_mim(grupo_id)
         else vis = 'publico' or public.omni_sou_responsavel(grupo_id) end));
--   criar: adulto em qualquer coleção (cofre só chefe/responsável); criança só nas coleções dela;
--   pedido de compra qualquer membro; 'restrito' só chefe/responsável cria (senão a pessoa nem veria o que criou)
drop policy if exists omni_docs_criar on public.omni_docs;
create policy omni_docs_criar on public.omni_docs for insert to authenticated
  with check (public.omni_sou_membro(grupo_id)
    and (vis = 'publico' or public.omni_sou_responsavel(grupo_id))
    and (case when colecao = 'vault' then public.omni_sou_responsavel(grupo_id)
              when colecao = 'requests' then true
              else public.omni_sou_adulto(grupo_id) or colecao in ('tasks','shop','items','msgs','reminders','files','checkins') end));
--   mudar (inclui marcar como apagado): mesmas regras; pedido de compra: responsável, quem criou ou adulto (só status)
drop policy if exists omni_docs_mudar on public.omni_docs;
create policy omni_docs_mudar on public.omni_docs for update to authenticated
  using (public.omni_sou_membro(grupo_id)
    and (vis = 'publico' or public.omni_sou_responsavel(grupo_id))
    and (case when colecao = 'vault' then public.omni_sou_responsavel(grupo_id)
              when colecao = 'requests' then public.omni_sou_adulto(grupo_id) or criado_por = (select auth.uid())
              else public.omni_sou_adulto(grupo_id) or colecao in ('tasks','shop','items','msgs','reminders','files','checkins') end))
  with check (public.omni_sou_membro(grupo_id)
    and (vis = 'publico' or public.omni_sou_responsavel(grupo_id))
    and (case when colecao = 'vault' then public.omni_sou_responsavel(grupo_id)
              when colecao = 'requests' then public.omni_sou_adulto(grupo_id) or criado_por = (select auth.uid())
              else public.omni_sou_adulto(grupo_id) or colecao in ('tasks','shop','items','msgs','reminders','files','checkins') end));
--   apagar de verdade: ninguém pelo app (apaga marcando apagado_em)

-- 4.3 combinados: membro lê; adulto acrescenta
drop policy if exists omni_combinados_ler on public.omni_combinados;
create policy omni_combinados_ler on public.omni_combinados for select to authenticated
  using (public.omni_sou_membro(grupo_id) and (vis = 'publico' or public.omni_sou_responsavel(grupo_id)));
drop policy if exists omni_combinados_criar on public.omni_combinados;
create policy omni_combinados_criar on public.omni_combinados for insert to authenticated
  with check (public.omni_sou_adulto(grupo_id) and (vis = 'publico' or public.omni_sou_responsavel(grupo_id)));

-- 4.4 histórico: chefe/responsável lê; qualquer membro acrescenta em seu próprio nome
drop policy if exists omni_historico_ler on public.omni_historico;
create policy omni_historico_ler on public.omni_historico for select to authenticated
  using (public.omni_sou_responsavel(grupo_id));
drop policy if exists omni_historico_criar on public.omni_historico;
create policy omni_historico_criar on public.omni_historico for insert to authenticated
  with check (public.omni_sou_membro(grupo_id));

-- 4.5 governança: todo membro vê os pedidos; criar e responder só pelas funções
drop policy if exists omni_governanca_ler on public.omni_governanca;
create policy omni_governanca_ler on public.omni_governanca for select to authenticated
  using (public.omni_sou_membro(grupo_id));

-- 4.6 emergência liberada: a própria pessoa e chefes/responsáveis veem
drop policy if exists omni_cofre_liberado_ler on public.omni_cofre_liberado;
create policy omni_cofre_liberado_ler on public.omni_cofre_liberado for select to authenticated
  using (user_id = (select auth.uid()) or public.omni_sou_responsavel(grupo_id));

-- 4.7 aparelhos: chefe/responsável vê todos; cada um vê os seus; cada um registra o seu; chefe desconecta e apaga
drop policy if exists omni_aparelhos_ler on public.omni_aparelhos;
create policy omni_aparelhos_ler on public.omni_aparelhos for select to authenticated
  using (public.omni_sou_responsavel(grupo_id) or (public.omni_sou_membro(grupo_id) and user_id = (select auth.uid())));
drop policy if exists omni_aparelhos_criar on public.omni_aparelhos;
create policy omni_aparelhos_criar on public.omni_aparelhos for insert to authenticated
  with check (public.omni_sou_membro(grupo_id) and user_id = (select auth.uid()) and desconectado = false);
drop policy if exists omni_aparelhos_mudar on public.omni_aparelhos;
create policy omni_aparelhos_mudar on public.omni_aparelhos for update to authenticated
  using (public.omni_sou_chefe(grupo_id) or (public.omni_sou_membro(grupo_id) and user_id = (select auth.uid())))
  with check (public.omni_sou_chefe(grupo_id) or (public.omni_sou_membro(grupo_id) and user_id = (select auth.uid())));
drop policy if exists omni_aparelhos_apagar on public.omni_aparelhos;
create policy omni_aparelhos_apagar on public.omni_aparelhos for delete to authenticated
  using (public.omni_sou_chefe(grupo_id));

-- 4.8 pedidos de entrada: quem pediu vê o seu; chefe/responsável vê os da família; escrever só pelas funções
drop policy if exists omni_pedidos_ler on public.omni_pedidos_entrada;
create policy omni_pedidos_ler on public.omni_pedidos_entrada for select to authenticated
  using (user_id = (select auth.uid()) or public.omni_sou_responsavel(grupo_id));

drop policy if exists omni_pedidos_verificacao_ler on public.omni_pedidos_verificacao;
create policy omni_pedidos_verificacao_ler on public.omni_pedidos_verificacao for select to authenticated
  using (user_id = (select auth.uid()));

-- 4.9 dados extras do convite: só chefe/responsável vê (quem tem o código usa omni_ver_convite)
drop policy if exists omni_convite_info_ler on public.omni_convite_info;
create policy omni_convite_info_ler on public.omni_convite_info for select to authenticated
  using (public.omni_sou_responsavel(grupo_id));

-- 4.10 chaves
drop policy if exists omni_chaves_publicas_ler on public.omni_chaves_publicas;
create policy omni_chaves_publicas_ler on public.omni_chaves_publicas for select to authenticated
  using (user_id = (select auth.uid()) or public.omni_mesma_familia(user_id));
drop policy if exists omni_chaves_publicas_criar on public.omni_chaves_publicas;
create policy omni_chaves_publicas_criar on public.omni_chaves_publicas for insert to authenticated
  with check (user_id = (select auth.uid()));
drop policy if exists omni_chaves_publicas_mudar on public.omni_chaves_publicas;
create policy omni_chaves_publicas_mudar on public.omni_chaves_publicas for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

drop policy if exists omni_chave_privada_dono on public.omni_chave_privada;
create policy omni_chave_privada_dono on public.omni_chave_privada for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

drop policy if exists omni_chaves_grupo_ler on public.omni_chaves_grupo;
create policy omni_chaves_grupo_ler on public.omni_chaves_grupo for select to authenticated
  using ((user_id = (select auth.uid()) and public.omni_sou_membro(grupo_id)) or public.omni_sou_responsavel(grupo_id));
--   quem já tem a chave (chefe/responsável) embrulha para outro membro; a 'restrito' só vai para chefe/responsável
drop policy if exists omni_chaves_grupo_criar on public.omni_chaves_grupo;
create policy omni_chaves_grupo_criar on public.omni_chaves_grupo for insert to authenticated
  with check (public.omni_sou_responsavel(grupo_id)
    and public.omni_papel_de(grupo_id, user_id) is not null
    and (tipo = 'familia' or public.omni_papel_de(grupo_id, user_id) in ('chefe', 'responsavel')));

-- 4.11 arquivos restritos no Storage (C6): omnilife-one/<grupo_id>/restrito/... só chefe/responsável.
--      Política RESTRITIVA: soma-se às da base (que liberam por membro) e só aperta esta pasta.
do $$
begin
  if to_regclass('storage.objects') is not null and to_regprocedure('storage.foldername(text)') is not null then
    execute 'drop policy if exists omni_arquivos_restritos on storage.objects';
    execute $p$create policy omni_arquivos_restritos on storage.objects as restrictive for all to authenticated
      using (bucket_id <> 'sol-arquivos' or name not like 'omnilife-one/%/restrito/%'
             or ((storage.foldername(name))[2] ~ '^[0-9a-f-]{36}$' and public.omni_sou_responsavel(((storage.foldername(name))[2])::uuid)))
      with check (bucket_id <> 'sol-arquivos' or name not like 'omnilife-one/%/restrito/%'
             or ((storage.foldername(name))[2] ~ '^[0-9a-f-]{36}$' and public.omni_sou_responsavel(((storage.foldername(name))[2])::uuid)))$p$;
  end if;
end $$;

-- -------------------------------------------------------------------------------------
-- 5) Funções do app (tudo que mexe em membro, convite, governança e emergência passa por aqui)
-- -------------------------------------------------------------------------------------

-- 5.0 registrar no histórico (uso interno das funções)
create or replace function public.omni__hist(p_grupo uuid, p_acao text, p_detalhe text) returns void
language plpgsql security definer set search_path = '' as $$
declare v_nome text;
begin
  select m.apelido into v_nome from public.sol_grupo_membros m
   where m.grupo_id = p_grupo and m.user_id = (select auth.uid()) limit 1;
  insert into public.omni_historico (grupo_id, criado_por, nome, acao, detalhe)
  values (p_grupo, (select auth.uid()), left(v_nome, 120), p_acao, left(p_detalhe, 2000));
end $$;

-- membro ativo? (linha atual de quem é membro)
create or replace function public.omni__membro_ativo(p_grupo uuid, p_user uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.sol_grupo_membros m where m.grupo_id = p_grupo and m.user_id = p_user and m.status = 'ativo');
$$;

-- 5.1 criar a família (quem cria é chefe e "criador")
create or replace function public.omni_criar_familia(p_nome text, p_apelido text, p_perfil_id text) returns uuid
language plpgsql security definer set search_path = '' as $$
declare v_uid uuid := (select auth.uid()); v_grupo uuid;
begin
  if v_uid is null then raise exception 'Entre na sua conta primeiro.'; end if;
  if coalesce(trim(p_nome), '') = '' or length(p_nome) > 80 then raise exception 'Nome da família inválido.'; end if;
  if p_perfil_id is null or p_perfil_id !~ '^[A-Za-z0-9_.:@-]{1,80}$' then raise exception 'Perfil inválido.'; end if;
  insert into public.sol_grupos (tipo, nome, criado_por) values ('familia', trim(p_nome), v_uid) returning id into v_grupo;
  insert into public.sol_grupo_membros (grupo_id, user_id, perfil_id, apelido, papel, status, convidado_por, entrou_em)
  values (v_grupo, v_uid, p_perfil_id, left(coalesce(nullif(trim(p_apelido), ''), 'Eu'), 80), 'chefe', 'ativo', null, now());
  insert into public.omni_familia (grupo_id, dono) values (v_grupo, v_uid);
  perform public.omni__hist(v_grupo, 'familia.criada', trim(p_nome));
  return v_grupo;
end $$;

-- 5.2 regras da família (só chefe): nome, aprovações, prazo do convite, emergência, idade para virar adulto
create or replace function public.omni_salvar_regras(p_grupo uuid, p_regras jsonb) returns void
language plpgsql security definer set search_path = '' as $$
declare v_cont uuid[];
begin
  if not public.omni_sou_chefe(p_grupo) then raise exception 'Só um chefe muda as regras da família.'; end if;
  if p_regras ? 'em_contatos' then
    select coalesce(array_agg(distinct x::uuid), '{}') into v_cont from jsonb_array_elements_text(p_regras -> 'em_contatos') as x;
    if exists (select 1 from unnest(v_cont) u where coalesce(public.omni_papel_de(p_grupo, u), 'crianca') = 'crianca') then
      raise exception 'Contato de emergência precisa ser adulto e membro da família.';
    end if;
  end if;
  update public.omni_familia f set
    aprovacoes     = coalesce((p_regras ->> 'aprovacoes')::smallint, f.aprovacoes),
    convite_horas  = coalesce((p_regras ->> 'convite_horas')::integer, f.convite_horas),
    em_espera_dias = coalesce((p_regras ->> 'em_espera_dias')::integer, f.em_espera_dias),
    em_contatos    = coalesce(v_cont, f.em_contatos),
    idade_adulto   = coalesce((p_regras ->> 'idade_adulto')::smallint, f.idade_adulto)
  where f.grupo_id = p_grupo;
  if coalesce(trim(p_regras ->> 'nome'), '') <> '' then
    if length(trim(p_regras ->> 'nome')) > 80 then raise exception 'Nome da família muito longo.'; end if;
    update public.sol_grupos g set nome = trim(p_regras ->> 'nome') where g.id = p_grupo;
  end if;
  perform public.omni__hist(p_grupo, 'regras.alteradas', left(p_regras::text, 500));
end $$;

-- 5.3 convites: chefe/responsável cria e revoga (a entrada como chefe/responsável só um chefe aprova)
create or replace function public.omni_criar_convite(p_grupo uuid, p_papel text, p_perfil_id text, p_para_nome text, p_max_usos integer, p_horas integer)
returns text language plpgsql security definer set search_path = '' as $$
declare v_codigo text; v_horas integer; v_nome text;
begin
  if not public.omni_sou_responsavel(p_grupo) then raise exception 'Só chefe ou responsável cria convite.'; end if;
  if p_papel not in ('chefe', 'responsavel', 'membro', 'crianca') then raise exception 'Papel inválido.'; end if;
  if p_perfil_id is not null and p_perfil_id !~ '^[A-Za-z0-9_.:@-]{1,80}$' then raise exception 'Perfil inválido.'; end if;
  select coalesce(p_horas, f.convite_horas) into v_horas from public.omni_familia f where f.grupo_id = p_grupo;
  v_horas := least(greatest(coalesce(v_horas, 72), 1), 720);
  v_codigo := upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 16));
  insert into public.sol_grupo_convites (codigo, grupo_id, papel, expira_em, usos, max_usos, ativo)
  values (v_codigo, p_grupo, p_papel, now() + make_interval(hours => v_horas), 0, least(greatest(coalesce(p_max_usos, 1), 1), 20), true);
  select m.apelido into v_nome from public.sol_grupo_membros m where m.grupo_id = p_grupo and m.user_id = (select auth.uid()) limit 1;
  insert into public.omni_convite_info (codigo, grupo_id, perfil_id, para_nome, criado_por_nome)
  values (v_codigo, p_grupo, p_perfil_id, left(p_para_nome, 120), left(v_nome, 120));
  perform public.omni__hist(p_grupo, 'convite.criado', p_papel || coalesce(' · ' || left(p_para_nome, 60), '') || ' · ' || least(greatest(coalesce(p_max_usos, 1), 1), 20) || 'x · ' || v_horas || 'h');
  return v_codigo;
end $$;

create or replace function public.omni_revogar_convite(p_grupo uuid, p_codigo text) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if not public.omni_sou_responsavel(p_grupo) then raise exception 'Só chefe ou responsável revoga convite.'; end if;
  update public.sol_grupo_convites c set ativo = false where c.grupo_id = p_grupo and c.codigo = p_codigo;
  perform public.omni__hist(p_grupo, 'convite.revogado', left(p_codigo, 4) || '…');
end $$;

-- quem tem o código consegue ver o convite (o código é o segredo)
create or replace function public.omni_ver_convite(p_codigo text) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare c record; v_nome text; v_info record; v_motivo text;
begin
  if (select auth.uid()) is null then raise exception 'Entre na sua conta primeiro.'; end if;
  select * into c from public.sol_grupo_convites x where x.codigo = upper(trim(p_codigo)) limit 1;
  if not found then return jsonb_build_object('valido', false, 'motivo', 'invalido'); end if;
  select g.nome into v_nome from public.sol_grupos g where g.id = c.grupo_id;
  select * into v_info from public.omni_convite_info i where i.codigo = c.codigo;
  v_motivo := case when not c.ativo then 'revogado' when c.expira_em <= now() then 'vencido' when c.usos >= c.max_usos then 'usado' else null end;
  return jsonb_build_object('valido', v_motivo is null, 'motivo', v_motivo, 'grupo_id', c.grupo_id, 'familia', v_nome,
    'papel', c.papel, 'para_nome', v_info.para_nome, 'por', v_info.criado_por_nome, 'expira_em', c.expira_em);
end $$;

-- 5.4 pedido de entrada: só com convite ativo, no prazo e com vaga; devolve o código de 4 números
--     que a pessoa diz para quem aprova (assim um link vazado não basta). Ela revê o código em omni_pedidos_verificacao.
create or replace function public.omni_pedir_entrada(p_codigo text, p_nome text) returns text
language plpgsql security definer set search_path = '' as $$
declare v_uid uuid := (select auth.uid()); c record; v_info record; v_ver text; v_email text;
begin
  if v_uid is null then raise exception 'Entre na sua conta primeiro.'; end if;
  select * into c from public.sol_grupo_convites x where x.codigo = upper(trim(p_codigo)) limit 1;
  if not found or not c.ativo or c.expira_em <= now() or c.usos >= c.max_usos then raise exception 'Convite inválido, vencido ou já usado.'; end if;
  if public.omni__membro_ativo(c.grupo_id, v_uid) then raise exception 'Você já faz parte desta família.'; end if;
  select * into v_info from public.omni_convite_info i where i.codigo = c.codigo;
  select u.email into v_email from auth.users u where u.id = v_uid;
  v_ver := (1000 + ((('x' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 7))::bit(28)::integer) % 9000))::text;
  insert into public.omni_pedidos_entrada (grupo_id, user_id, nome, email, codigo, papel, perfil_id, para_nome, convidado_por_nome, aprovacoes, proposta, status, motivo)
  values (c.grupo_id, v_uid, left(p_nome, 120), left(v_email, 200), c.codigo, c.papel, v_info.perfil_id, v_info.para_nome, v_info.criado_por_nome, '{}'::jsonb, null, 'pendente', null)
  on conflict (grupo_id, user_id) do update set nome = excluded.nome, email = excluded.email, codigo = excluded.codigo,
    papel = excluded.papel, perfil_id = excluded.perfil_id, para_nome = excluded.para_nome, convidado_por_nome = excluded.convidado_por_nome,
    aprovacoes = '{}'::jsonb, proposta = null, status = 'pendente', motivo = null;
  insert into public.omni_pedidos_verificacao (grupo_id, user_id, verificacao, tentativas) values (c.grupo_id, v_uid, v_ver, 0)
  on conflict (grupo_id, user_id) do update set verificacao = excluded.verificacao, tentativas = 0;
  return v_ver;
end $$;

create or replace function public.omni_cancelar_pedido(p_grupo uuid) returns void
language plpgsql security definer set search_path = '' as $$
begin
  update public.omni_pedidos_entrada p set status = 'cancelado'
   where p.grupo_id = p_grupo and p.user_id = (select auth.uid()) and p.status = 'pendente';
end $$;

-- 5.5 aprovar (1 ou 2 aprovações, conforme a regra da família). Responsável aprova só membro ou criança;
--     criança exige consentimento do responsável (LGPD art. 14). A 1a aprovação exige o código de 4 números que a
--     pessoa diz (p_verificacao); errou 3 vezes, o pedido é recusado. Devolve: 'aprovado' | 'aguardando' |
--     'codigo_errado:<n>' | 'recusado'.
create or replace function public.omni_aprovar_entrada(p_grupo uuid, p_user uuid, p_papel text, p_perfil_id text, p_consentimento jsonb, p_verificacao text)
returns text language plpgsql security definer set search_path = '' as $$
declare v_uid uuid := (select auth.uid()); p record; v_cod record; v_tent integer; v_need integer; v_guard integer; v_apr jsonb; v_nome text; v_existe boolean;
begin
  if not public.omni_sou_responsavel(p_grupo) then raise exception 'Só chefe ou responsável aprova entrada.'; end if;
  select * into p from public.omni_pedidos_entrada x where x.grupo_id = p_grupo and x.user_id = p_user for update;
  if not found or p.status <> 'pendente' then raise exception 'Pedido não encontrado ou já respondido.'; end if;
  if p_papel not in ('chefe', 'responsavel', 'membro', 'crianca') then raise exception 'Papel inválido.'; end if;
  if p_papel in ('chefe', 'responsavel') and not public.omni_sou_chefe(p_grupo) then raise exception 'Responsável aprova só membro adulto ou criança.'; end if;
  if p_papel = 'crianca' and (p_consentimento is null or jsonb_typeof(p_consentimento) <> 'object') then raise exception 'Criança precisa do consentimento do responsável.'; end if;
  if p_perfil_id is not null and p_perfil_id !~ '^[A-Za-z0-9_.:@-]{1,80}$' then raise exception 'Perfil inválido.'; end if;
  -- o convite ainda vale? (revogado ou lotado enquanto esperava = não entra; vencer o prazo depois de pedir não atrapalha)
  if not exists (select 1 from public.sol_grupo_convites c where c.codigo = p.codigo and c.ativo and c.usos < c.max_usos) then
    raise exception 'O convite deste pedido não vale mais (revogado ou lotado).';
  end if;
  if p.aprovacoes = '{}'::jsonb then
    select * into v_cod from public.omni_pedidos_verificacao x where x.grupo_id = p_grupo and x.user_id = p_user for update;
    if coalesce(trim(p_verificacao), '') = '' then raise exception 'Peça à pessoa o código de 4 números que aparece na tela dela.'; end if;
    if not found or trim(p_verificacao) <> v_cod.verificacao then
      update public.omni_pedidos_verificacao x set tentativas = least(x.tentativas + 1, 3) where x.grupo_id = p_grupo and x.user_id = p_user
       returning x.tentativas into v_tent;
      perform public.omni__hist(p_grupo, 'codigo.errado', coalesce(p.nome, p.email, '') || ' · ' || coalesce(v_tent, 3) || '/3');
      if coalesce(v_tent, 3) >= 3 then
        update public.omni_pedidos_entrada x set status = 'recusado', motivo = '3 códigos errados' where x.grupo_id = p_grupo and x.user_id = p_user;
        perform public.omni__hist(p_grupo, 'entrada.recusada', coalesce(p.nome, p.email, '') || ' · 3 códigos errados');
        return 'recusado';
      end if;
      return 'codigo_errado:' || v_tent;
    end if;
  end if;
  select m.apelido into v_nome from public.sol_grupo_membros m where m.grupo_id = p_grupo and m.user_id = v_uid limit 1;
  v_apr := p.aprovacoes || jsonb_build_object(v_uid::text, jsonb_build_object('nome', v_nome, 'em', now()));
  select count(*) into v_guard from public.sol_grupo_membros m where m.grupo_id = p_grupo and m.status = 'ativo' and m.user_id is not null and m.papel in ('chefe', 'responsavel');
  select least(greatest(f.aprovacoes, 1), greatest(v_guard, 1)) into v_need from public.omni_familia f where f.grupo_id = p_grupo;
  if (select count(*) from jsonb_object_keys(v_apr)) < coalesce(v_need, 1) then
    update public.omni_pedidos_entrada x set aprovacoes = v_apr, proposta = jsonb_build_object('papel', p_papel, 'perfil_id', p_perfil_id, 'consentimento', p_consentimento)
     where x.grupo_id = p_grupo and x.user_id = p_user;
    perform public.omni__hist(p_grupo, 'entrada.aprovacao', coalesce(p.nome, p.email, '') || ' · ' || (select count(*) from jsonb_object_keys(v_apr)) || '/' || v_need);
    return 'aguardando';
  end if;
  select exists (select 1 from public.sol_grupo_membros m where m.grupo_id = p_grupo and m.user_id = p_user) into v_existe;
  if v_existe then
    update public.sol_grupo_membros m set papel = p_papel, status = 'ativo', perfil_id = coalesce(p_perfil_id, m.perfil_id),
      apelido = left(coalesce(p.nome, m.apelido), 80), convidado_por = v_uid, entrou_em = now(), saiu_em = null
     where m.grupo_id = p_grupo and m.user_id = p_user;
  else
    insert into public.sol_grupo_membros (grupo_id, user_id, perfil_id, apelido, papel, status, convidado_por, entrou_em)
    values (p_grupo, p_user, p_perfil_id, left(coalesce(p.nome, p.email, 'Membro'), 80), p_papel, 'ativo', v_uid, now());
  end if;
  update public.sol_grupo_convites c set usos = c.usos + 1, ativo = (c.usos + 1 < c.max_usos) where c.codigo = p.codigo;
  update public.omni_pedidos_entrada x set status = 'aprovado', aprovacoes = v_apr,
    proposta = jsonb_build_object('papel', p_papel, 'perfil_id', p_perfil_id, 'consentimento', p_consentimento)
   where x.grupo_id = p_grupo and x.user_id = p_user;
  perform public.omni__hist(p_grupo, 'entrada.aprovada', coalesce(p.nome, p.email, '') || ' · ' || p_papel || case when p_consentimento is not null then ' · consentimento registrado' else '' end);
  return 'aprovado';
end $$;

create or replace function public.omni_recusar_entrada(p_grupo uuid, p_user uuid, p_motivo text) returns void
language plpgsql security definer set search_path = '' as $$
declare v_nome text;
begin
  if not public.omni_sou_responsavel(p_grupo) then raise exception 'Só chefe ou responsável recusa entrada.'; end if;
  update public.omni_pedidos_entrada x set status = 'recusado', motivo = left(p_motivo, 300)
   where x.grupo_id = p_grupo and x.user_id = p_user and x.status = 'pendente' returning coalesce(x.nome, x.email) into v_nome;
  if found then perform public.omni__hist(p_grupo, 'entrada.recusada', coalesce(v_nome, '') || coalesce(' · ' || left(p_motivo, 100), '')); end if;
end $$;

-- 5.6 papéis e saída. Regras: só chefe muda; o criador é sempre chefe; sempre sobra um chefe;
--     rebaixar/remover OUTRO chefe precisa de pedido aprovado por outro chefe ou vencido (48 h) sem veto.
create or replace function public.omni__pedido_chefe_ok(p_grupo uuid, p_alvo uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.omni_governanca g
    where g.grupo_id = p_grupo and g.id = 'hd_' || p_alvo::text and g.tipo in ('rebaixar', 'remover')
      and (g.status = 'aprovado' or (g.status = 'pendente' and g.executar_apos <= now())));
$$;

create or replace function public.omni_mudar_papel(p_grupo uuid, p_alvo uuid, p_papel text) returns void
language plpgsql security definer set search_path = '' as $$
declare v_uid uuid := (select auth.uid()); v_atual text; v_dono uuid;
begin
  if not public.omni_sou_chefe(p_grupo) then raise exception 'Só um chefe muda papéis.'; end if;
  if p_papel not in ('chefe', 'responsavel', 'membro', 'crianca') then raise exception 'Papel inválido.'; end if;
  v_atual := public.omni_papel_de(p_grupo, p_alvo);
  if v_atual is null then raise exception 'Essa pessoa não está na família.'; end if;
  select f.dono into v_dono from public.omni_familia f where f.grupo_id = p_grupo;
  if p_alvo = v_dono and p_papel <> 'chefe' then raise exception 'O criador da família é sempre chefe. Passe a criação antes.'; end if;
  if v_atual = 'chefe' and p_papel <> 'chefe' then
    if p_alvo <> v_uid and not public.omni__pedido_chefe_ok(p_grupo, p_alvo) then raise exception 'Para rebaixar outro chefe, faça o pedido: outro chefe aprova ou vale em 48 h sem veto.'; end if;
    if (select count(*) from public.sol_grupo_membros m where m.grupo_id = p_grupo and m.status = 'ativo' and m.papel = 'chefe') <= 1 then raise exception 'A família precisa de pelo menos um chefe.'; end if;
  end if;
  update public.sol_grupo_membros m set papel = p_papel where m.grupo_id = p_grupo and m.user_id = p_alvo and m.status = 'ativo';
  update public.omni_governanca g set status = 'executado', feito_em = now()
   where g.grupo_id = p_grupo and g.id = 'hd_' || p_alvo::text and g.status in ('pendente', 'aprovado') and v_atual = 'chefe' and p_papel <> 'chefe';
  perform public.omni__hist(p_grupo, 'papel.alterado', coalesce((select m.apelido from public.sol_grupo_membros m where m.grupo_id = p_grupo and m.user_id = p_alvo limit 1), '') || ': ' || v_atual || ' → ' || p_papel);
end $$;

create or replace function public.omni_remover_membro(p_grupo uuid, p_alvo uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare v_uid uuid := (select auth.uid()); v_atual text; v_dono uuid; v_nome text;
begin
  if not public.omni_sou_chefe(p_grupo) then raise exception 'Só um chefe remove pessoas.'; end if;
  v_atual := public.omni_papel_de(p_grupo, p_alvo);
  if v_atual is null then raise exception 'Essa pessoa não está na família.'; end if;
  select f.dono into v_dono from public.omni_familia f where f.grupo_id = p_grupo;
  if p_alvo = v_dono then raise exception 'O criador da família não pode ser removido. Passe a criação antes.'; end if;
  if v_atual = 'chefe' and p_alvo <> v_uid and not public.omni__pedido_chefe_ok(p_grupo, p_alvo) then
    raise exception 'Para remover outro chefe, faça o pedido: outro chefe aprova ou vale em 48 h sem veto.';
  end if;
  update public.sol_grupo_membros m set status = 'saiu', saiu_em = now() where m.grupo_id = p_grupo and m.user_id = p_alvo and m.status = 'ativo'
   returning m.apelido into v_nome;
  update public.omni_governanca g set status = 'executado', feito_em = now()
   where g.grupo_id = p_grupo and g.id = 'hd_' || p_alvo::text and g.status in ('pendente', 'aprovado');
  perform public.omni__hist(p_grupo, 'membro.removido', coalesce(v_nome, ''));
end $$;

create or replace function public.omni_sair(p_grupo uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare v_uid uuid := (select auth.uid()); v_dono uuid;
begin
  if not public.omni_sou_membro(p_grupo) then raise exception 'Você não está nesta família.'; end if;
  select f.dono into v_dono from public.omni_familia f where f.grupo_id = p_grupo;
  if v_uid = v_dono then raise exception 'Quem criou a família não sai sozinho: passe a criação antes (ou encerre a família, se estiver só).'; end if;
  perform public.omni__hist(p_grupo, 'membro.saiu', '');
  update public.sol_grupo_membros m set status = 'saiu', saiu_em = now() where m.grupo_id = p_grupo and m.user_id = v_uid and m.status = 'ativo';
end $$;

-- perfis sem conta (criança pequena, pet não entra): o responsável mantém a lista no sol_grupo_membros
create or replace function public.omni_perfil_sem_conta(p_grupo uuid, p_perfil_id text, p_apelido text, p_ativo boolean) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if not public.omni_sou_responsavel(p_grupo) then raise exception 'Só chefe ou responsável cuida dos perfis sem conta.'; end if;
  if p_perfil_id is null or p_perfil_id !~ '^[A-Za-z0-9_.:@-]{1,80}$' then raise exception 'Perfil inválido.'; end if;
  if exists (select 1 from public.sol_grupo_membros m where m.grupo_id = p_grupo and m.user_id is null and m.perfil_id = p_perfil_id) then
    update public.sol_grupo_membros m set apelido = left(coalesce(nullif(trim(p_apelido), ''), m.apelido), 80),
      status = case when p_ativo then 'ativo' else 'saiu' end, saiu_em = case when p_ativo then null else now() end
     where m.grupo_id = p_grupo and m.user_id is null and m.perfil_id = p_perfil_id;
  elsif p_ativo then
    insert into public.sol_grupo_membros (grupo_id, user_id, perfil_id, apelido, papel, status, convidado_por, entrou_em)
    values (p_grupo, null, p_perfil_id, left(coalesce(nullif(trim(p_apelido), ''), 'Criança'), 80), 'crianca', 'ativo', (select auth.uid()), now());
  end if;
end $$;

-- 5.7 governança
create or replace function public.omni_pedir_mudanca_chefe(p_grupo uuid, p_alvo uuid, p_tipo text, p_papel text) returns void
language plpgsql security definer set search_path = '' as $$
declare v_uid uuid := (select auth.uid()); v_id text := 'hd_' || p_alvo::text; v_nome text;
begin
  if not public.omni_sou_chefe(p_grupo) then raise exception 'Só um chefe faz esse pedido.'; end if;
  if p_tipo not in ('rebaixar', 'remover') then raise exception 'Tipo inválido.'; end if;
  if p_alvo = v_uid or public.omni_papel_de(p_grupo, p_alvo) is distinct from 'chefe' then raise exception 'O pedido é para outro chefe.'; end if;
  if p_tipo = 'rebaixar' and p_papel not in ('responsavel', 'membro', 'crianca') then raise exception 'Papel inválido.'; end if;
  if exists (select 1 from public.omni_governanca g where g.grupo_id = p_grupo and g.id = v_id and g.status in ('pendente', 'aprovado')) then
    raise exception 'Já existe um pedido aberto para essa pessoa.';
  end if;
  select m.apelido into v_nome from public.sol_grupo_membros m where m.grupo_id = p_grupo and m.user_id = v_uid limit 1;
  insert into public.omni_governanca (grupo_id, id, tipo, alvo, por, por_nome, status, executar_apos, aprovacoes, dados, respondido_em, feito_em)
  values (p_grupo, v_id, p_tipo, p_alvo, v_uid, v_nome, 'pendente', now() + interval '48 hours', '{}'::jsonb, jsonb_build_object('papel', p_papel), null, null)
  on conflict (grupo_id, id) do update set tipo = excluded.tipo, alvo = excluded.alvo, por = excluded.por, por_nome = excluded.por_nome,
    status = 'pendente', executar_apos = excluded.executar_apos, aprovacoes = '{}'::jsonb, dados = excluded.dados, respondido_em = null, feito_em = null;
  perform public.omni__hist(p_grupo, 'chefe.pedido', p_tipo || ' · ' || coalesce((select m.apelido from public.sol_grupo_membros m where m.grupo_id = p_grupo and m.user_id = p_alvo limit 1), ''));
end $$;

-- aprovar: outro chefe (nem quem pediu, nem o alvo)
create or replace function public.omni_aprovar_pedido(p_grupo uuid, p_id text) returns void
language plpgsql security definer set search_path = '' as $$
declare v_uid uuid := (select auth.uid()); g record;
begin
  if not public.omni_sou_chefe(p_grupo) then raise exception 'Só um chefe aprova.'; end if;
  select * into g from public.omni_governanca x where x.grupo_id = p_grupo and x.id = p_id for update;
  if not found or g.status <> 'pendente' or g.tipo not in ('rebaixar', 'remover') then raise exception 'Pedido não está aberto.'; end if;
  if g.por = v_uid or g.alvo = v_uid then raise exception 'Quem pediu e quem é o alvo não aprovam.'; end if;
  update public.omni_governanca x set status = 'aprovado', aprovacoes = x.aprovacoes || jsonb_build_object(v_uid::text, now()), respondido_em = now()
   where x.grupo_id = p_grupo and x.id = p_id;
  perform public.omni__hist(p_grupo, 'chefe.aprovado', p_id);
end $$;

-- vetar: o alvo, ou chefe/responsável que não fez o pedido (inclui negar emergência)
create or replace function public.omni_vetar_pedido(p_grupo uuid, p_id text) returns void
language plpgsql security definer set search_path = '' as $$
declare v_uid uuid := (select auth.uid()); g record;
begin
  select * into g from public.omni_governanca x where x.grupo_id = p_grupo and x.id = p_id for update;
  if not found or g.status not in ('pendente', 'aprovado') or g.tipo = 'transferir' then raise exception 'Pedido não está aberto.'; end if;
  if not ((g.alvo = v_uid and g.tipo in ('rebaixar', 'remover')) or (public.omni_sou_responsavel(p_grupo) and g.por <> v_uid)) then
    raise exception 'Você não pode vetar este pedido.';
  end if;
  update public.omni_governanca x set status = 'vetado', respondido_em = now() where x.grupo_id = p_grupo and x.id = p_id;
  perform public.omni__hist(p_grupo, 'pedido.vetado', p_id);
end $$;

create or replace function public.omni_cancelar_pedido_gov(p_grupo uuid, p_id text) returns void
language plpgsql security definer set search_path = '' as $$
begin
  update public.omni_governanca x set status = 'cancelado', respondido_em = now()
   where x.grupo_id = p_grupo and x.id = p_id and x.por = (select auth.uid()) and x.status in ('pendente', 'aprovado', 'aceito');
  if found then perform public.omni__hist(p_grupo, 'pedido.cancelado', p_id); end if;
end $$;

-- passar a criação: só o criador propõe, para outro chefe; vale quando a pessoa aceita
create or replace function public.omni_propor_transferencia(p_grupo uuid, p_alvo uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare v_uid uuid := (select auth.uid()); v_nome text;
begin
  if not exists (select 1 from public.omni_familia f where f.grupo_id = p_grupo and f.dono = v_uid) then raise exception 'Só quem criou a família passa a criação.'; end if;
  if p_alvo = v_uid or public.omni_papel_de(p_grupo, p_alvo) is distinct from 'chefe' then raise exception 'Primeiro torne a pessoa chefe.'; end if;
  select m.apelido into v_nome from public.sol_grupo_membros m where m.grupo_id = p_grupo and m.user_id = v_uid limit 1;
  insert into public.omni_governanca (grupo_id, id, tipo, alvo, por, por_nome, status, executar_apos, aprovacoes, dados, respondido_em, feito_em)
  values (p_grupo, 'tr_' || p_grupo::text, 'transferir', p_alvo, v_uid, v_nome, 'pendente', null, '{}'::jsonb, '{}'::jsonb, null, null)
  on conflict (grupo_id, id) do update set alvo = excluded.alvo, por = excluded.por, por_nome = excluded.por_nome, status = 'pendente',
    respondido_em = null, feito_em = null;
  perform public.omni__hist(p_grupo, 'criacao.proposta', coalesce((select m.apelido from public.sol_grupo_membros m where m.grupo_id = p_grupo and m.user_id = p_alvo limit 1), ''));
end $$;

create or replace function public.omni_responder_transferencia(p_grupo uuid, p_aceitar boolean) returns void
language plpgsql security definer set search_path = '' as $$
declare v_uid uuid := (select auth.uid()); g record;
begin
  select * into g from public.omni_governanca x where x.grupo_id = p_grupo and x.id = 'tr_' || p_grupo::text for update;
  if not found or g.status <> 'pendente' or g.alvo <> v_uid then raise exception 'Não há proposta de criação para você.'; end if;
  if not p_aceitar then
    update public.omni_governanca x set status = 'recusado', respondido_em = now() where x.grupo_id = p_grupo and x.id = g.id;
    perform public.omni__hist(p_grupo, 'criacao.recusada', ''); return;
  end if;
  if public.omni_papel_de(p_grupo, v_uid) is distinct from 'chefe' then raise exception 'Você precisa ser chefe para aceitar.'; end if;
  update public.omni_familia f set dono = v_uid where f.grupo_id = p_grupo and f.dono = g.por;
  if not found then raise exception 'Quem propôs não é mais o criador da família.'; end if;
  update public.omni_governanca x set status = 'executado', respondido_em = now(), feito_em = now() where x.grupo_id = p_grupo and x.id = g.id;
  perform public.omni__hist(p_grupo, 'criacao.transferida', coalesce(g.por_nome, '') || ' → ' || coalesce((select m.apelido from public.sol_grupo_membros m where m.grupo_id = p_grupo and m.user_id = v_uid limit 1), ''));
end $$;

-- executar o que venceu (48 h sem veto): chamado por qualquer chefe ao abrir o app; devolve quantos executou
create or replace function public.omni_executar_pedidos(p_grupo uuid) returns integer
language plpgsql security definer set search_path = '' as $$
declare v_uid uuid := (select auth.uid()); g record; n integer := 0;
begin
  if not public.omni_sou_chefe(p_grupo) then return 0; end if;
  for g in select * from public.omni_governanca x where x.grupo_id = p_grupo and x.tipo in ('rebaixar', 'remover')
           and x.alvo <> v_uid and (x.status = 'aprovado' or (x.status = 'pendente' and x.executar_apos <= now())) loop
    if public.omni_papel_de(p_grupo, g.alvo) is null then
      update public.omni_governanca x set status = 'executado', feito_em = now() where x.grupo_id = p_grupo and x.id = g.id;
    elsif g.tipo = 'remover' then perform public.omni_remover_membro(p_grupo, g.alvo);
    else perform public.omni_mudar_papel(p_grupo, g.alvo, coalesce(g.dados ->> 'papel', 'membro'));
    end if;
    n := n + 1;
  end loop;
  return n;
end $$;

-- 5.8 acesso de emergência ao cofre: o contato pede; chefes são avisados e podem negar; sem veto, libera após a espera
create or replace function public.omni_pedir_emergencia(p_grupo uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare v_uid uuid := (select auth.uid()); f record; v_nome text;
begin
  select * into f from public.omni_familia x where x.grupo_id = p_grupo;
  if not found or not public.omni_sou_membro(p_grupo) or not (v_uid = any (f.em_contatos)) then raise exception 'Você não está na lista de contatos de emergência desta família.'; end if;
  if exists (select 1 from public.omni_governanca g where g.grupo_id = p_grupo and g.id = 'em_' || v_uid::text and g.status = 'pendente') then raise exception 'Seu pedido já está aberto.'; end if;
  select m.apelido into v_nome from public.sol_grupo_membros m where m.grupo_id = p_grupo and m.user_id = v_uid limit 1;
  insert into public.omni_governanca (grupo_id, id, tipo, alvo, por, por_nome, status, executar_apos, aprovacoes, dados, respondido_em, feito_em)
  values (p_grupo, 'em_' || v_uid::text, 'emergencia', null, v_uid, v_nome, 'pendente', now() + make_interval(days => f.em_espera_dias), '{}'::jsonb, '{}'::jsonb, null, null)
  on conflict (grupo_id, id) do update set status = 'pendente', executar_apos = excluded.executar_apos, por_nome = excluded.por_nome, respondido_em = null, feito_em = null;
  perform public.omni__hist(p_grupo, 'emergencia.pedida', coalesce(v_nome, ''));
end $$;

create or replace function public.omni_liberar_emergencia(p_grupo uuid) returns boolean
language plpgsql security definer set search_path = '' as $$
declare v_uid uuid := (select auth.uid()); g record;
begin
  select * into g from public.omni_governanca x where x.grupo_id = p_grupo and x.id = 'em_' || v_uid::text for update;
  if not found or g.status <> 'pendente' or g.executar_apos > now() then return false; end if;
  if not exists (select 1 from public.omni_familia f where f.grupo_id = p_grupo and v_uid = any (f.em_contatos)) or not public.omni_sou_membro(p_grupo) then return false; end if;
  insert into public.omni_cofre_liberado (grupo_id, user_id) values (p_grupo, v_uid) on conflict (grupo_id, user_id) do nothing;
  update public.omni_governanca x set status = 'liberado', feito_em = now() where x.grupo_id = p_grupo and x.id = g.id;
  perform public.omni__hist(p_grupo, 'emergencia.liberada', coalesce(g.por_nome, ''));
  return true;
end $$;

-- 5.9 mudar só alguns campos de um registro (ex.: "lido por" de um recado), sem apagar o que outro aparelho mudou.
--     Roda com as regras de quem chama (SECURITY INVOKER): o RLS e os gatilhos valem igual.
create or replace function public.omni_mudar_campos(p_grupo uuid, p_colecao text, p_id text, p_campos jsonb) returns bigint
language plpgsql security invoker set search_path = '' as $$
declare v_versao bigint;
begin
  update public.omni_docs d set dados = public.omni_jsonb_mesclar(d.dados, p_campos)
   where d.grupo_id = p_grupo and d.colecao = p_colecao and d.id = p_id and d.dados is not null
   returning d.versao into v_versao;
  if v_versao is null then raise exception 'Registro não encontrado ou sem permissão.'; end if;
  return v_versao;
end $$;

-- 5.10 encerrar a família (criador, quando é a única pessoa com conta). Os dados ficam até a LGPD pedir.
create or replace function public.omni_encerrar_familia(p_grupo uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare v_uid uuid := (select auth.uid());
begin
  if not exists (select 1 from public.omni_familia f where f.grupo_id = p_grupo and f.dono = v_uid) then raise exception 'Só quem criou a família encerra.'; end if;
  if exists (select 1 from public.sol_grupo_membros m where m.grupo_id = p_grupo and m.status = 'ativo' and m.user_id is not null and m.user_id <> v_uid) then
    raise exception 'Ainda há outras pessoas na família. Passe a criação antes.';
  end if;
  perform public.omni__hist(p_grupo, 'familia.encerrada', '');
  update public.sol_grupo_membros m set status = 'saiu', saiu_em = now() where m.grupo_id = p_grupo and m.status = 'ativo';
  update public.sol_grupo_convites c set ativo = false where c.grupo_id = p_grupo and c.ativo;
  update public.sol_grupos g set encerrado_em = now() where g.id = p_grupo and g.encerrado_em is null;
end $$;

-- 5.11 LGPD (C8): anonimizar uma pessoa no Omni. Chamada por admin_anonimizar_usuario (nunca pelo app).
--      Não apaga conta. Tira nome, e-mail e nome do aparelho (também do histórico); esvazia a ficha de saúde e o perfil dela;
--      se ela era a única pessoa com conta numa família, esvazia os registros dessa família.
create or replace function public.omni_anonimizar(p_uid uuid) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare r record; v_perfis integer := 0; v_familias integer := 0; v_ap integer; v_ped integer; v_hist integer; v_nomes text[]; v_n text;
begin
  if p_uid is null then raise exception 'uid obrigatório'; end if;
  -- nomes pelos quais a pessoa aparece (antes de apagar), para tirar também dos textos do histórico
  select coalesce(array_agg(distinct x), '{}') into v_nomes from (
    select m.apelido as x from public.sol_grupo_membros m where m.user_id = p_uid
    union select p.nome from public.omni_pedidos_entrada p where p.user_id = p_uid
    union select p.email from public.omni_pedidos_entrada p where p.user_id = p_uid
    union select g.por_nome from public.omni_governanca g where g.por = p_uid) t
   where x is not null and length(trim(x)) >= 3;
  update public.omni_historico h set nome = 'Titular anonimizado' where h.criado_por = p_uid;
  get diagnostics v_hist = row_count;
  foreach v_n in array v_nomes loop
    update public.omni_historico h set detalhe = replace(h.detalhe, v_n, 'Titular anonimizado')
     where h.grupo_id in (select m.grupo_id from public.sol_grupo_membros m where m.user_id = p_uid) and strpos(h.detalhe, v_n) > 0;
  end loop;
  update public.omni_aparelhos a set nome = 'aparelho' where a.user_id = p_uid;
  get diagnostics v_ap = row_count;
  update public.omni_pedidos_entrada p set nome = null, email = null where p.user_id = p_uid;
  get diagnostics v_ped = row_count;
  update public.omni_governanca g set por_nome = 'Titular anonimizado' where g.por = p_uid;
  delete from public.omni_chave_privada c where c.user_id = p_uid;
  delete from public.omni_chaves_publicas c where c.user_id = p_uid;
  delete from public.omni_chaves_grupo c where c.user_id = p_uid;
  delete from public.omni_cofre_liberado c where c.user_id = p_uid;
  -- perfil da pessoa e a ficha de saúde dela, em cada família
  for r in select m.grupo_id, m.perfil_id from public.sol_grupo_membros m where m.user_id = p_uid and m.perfil_id is not null loop
    update public.omni_docs d set dados = jsonb_build_object('name', 'Pessoa removida', 'role', coalesce(d.dados -> 'role', '"adulto"'::jsonb), 'anonimizado', true), dados_cifrado = null
     where d.grupo_id = r.grupo_id and d.colecao = 'people' and d.id = r.perfil_id;
    update public.omni_docs d set dados = null, dados_cifrado = null, apagado_em = coalesce(d.apagado_em, now())
     where d.grupo_id = r.grupo_id and d.colecao = 'health' and d.id = r.perfil_id;
    v_perfis := v_perfis + 1;
  end loop;
  -- família em que era a única pessoa com conta: esvazia tudo dela no Omni
  for r in select distinct m.grupo_id from public.sol_grupo_membros m where m.user_id = p_uid
             and not exists (select 1 from public.sol_grupo_membros o where o.grupo_id = m.grupo_id and o.user_id is not null and o.user_id <> p_uid and o.status = 'ativo') loop
    update public.omni_docs d set dados = null, dados_cifrado = null, apagado_em = coalesce(d.apagado_em, now()) where d.grupo_id = r.grupo_id;
    update public.omni_combinados c set dados = jsonb_build_object('at', c.dados ->> 'at', 'anonimizado', true) where c.grupo_id = r.grupo_id;
    v_familias := v_familias + 1;
  end loop;
  return jsonb_build_object('app', 'omnilife-one', 'perfis', v_perfis, 'familias_esvaziadas', v_familias, 'aparelhos', v_ap,
                            'pedidos', v_ped, 'historico', v_hist);
end $$;

-- -------------------------------------------------------------------------------------
-- 6) Registro do app na LGPD da plataforma (C8)
-- -------------------------------------------------------------------------------------
insert into public.sol_apps (codigo, nome, funcao_anonimizar)
values ('omnilife-one', 'OmniLifeONE', 'public.omni_anonimizar')
on conflict (codigo) do update set nome = excluded.nome, funcao_anonimizar = excluded.funcao_anonimizar;

-- -------------------------------------------------------------------------------------
-- 7) Tempo real (para a tela atualizar sozinha quando outra pessoa muda algo)
-- -------------------------------------------------------------------------------------
do $$
declare t text;
begin
  if exists (select 1 from pg_catalog.pg_publication where pubname = 'supabase_realtime') then
    foreach t in array array['omni_docs', 'omni_governanca', 'omni_pedidos_entrada', 'omni_aparelhos', 'omni_familia', 'omni_combinados'] loop
      if not exists (select 1 from pg_catalog.pg_publication_tables p where p.pubname = 'supabase_realtime' and p.schemaname = 'public' and p.tablename = t) then
        execute format('alter publication supabase_realtime add table public.%I', t);
      end if;
    end loop;
  end if;
end $$;

-- -------------------------------------------------------------------------------------
-- 8) Permissões (GRANTs explícitos). Visitante (anon) não toca em nada do Omni.
-- -------------------------------------------------------------------------------------
revoke all on public.omni_familia, public.omni_docs, public.omni_combinados, public.omni_historico, public.omni_governanca,
              public.omni_cofre_liberado, public.omni_aparelhos, public.omni_pedidos_entrada, public.omni_pedidos_verificacao,
              public.omni_convite_info, public.omni_chaves_publicas, public.omni_chave_privada, public.omni_chaves_grupo from anon, authenticated;
grant select                 on public.omni_familia         to authenticated;
grant select, insert, update on public.omni_docs            to authenticated;
grant select, insert         on public.omni_combinados      to authenticated;
grant select, insert         on public.omni_historico       to authenticated;
grant select                 on public.omni_governanca      to authenticated;
grant select                 on public.omni_cofre_liberado  to authenticated;
grant select, insert, update, delete on public.omni_aparelhos to authenticated;
grant select                 on public.omni_pedidos_entrada to authenticated;
grant select                 on public.omni_pedidos_verificacao to authenticated;
grant select                 on public.omni_convite_info    to authenticated;
grant select, insert, update on public.omni_chaves_publicas to authenticated;
grant select, insert, update on public.omni_chave_privada   to authenticated;
grant select, insert         on public.omni_chaves_grupo    to authenticated;
-- service_role (Edge Function / painel) passa por cima do RLS; fica explícito aqui (C10)
grant select, insert, update, delete on public.omni_familia, public.omni_docs, public.omni_combinados, public.omni_historico,
  public.omni_governanca, public.omni_cofre_liberado, public.omni_aparelhos, public.omni_pedidos_entrada, public.omni_pedidos_verificacao,
  public.omni_convite_info, public.omni_chaves_publicas, public.omni_chave_privada, public.omni_chaves_grupo to service_role;

do $$
declare f text;
begin
  -- nenhuma função do Omni fica aberta para "public"/visitante
  for f in select format('%I.%I(%s)', n.nspname, p.proname, pg_catalog.pg_get_function_identity_arguments(p.oid))
             from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid = p.pronamespace
            where n.nspname = 'public' and p.proname like 'omni\_%' loop
    execute format('revoke all on function %s from public, anon', f);
  end loop;
end $$;
grant execute on function public.omni_sou_membro(uuid), public.omni_sou_chefe(uuid), public.omni_sou_responsavel(uuid),
  public.omni_sou_adulto(uuid), public.omni_papel_de(uuid, uuid), public.omni_jsonb_mesclar(jsonb, jsonb),
  public.omni_cofre_liberado_para_mim(uuid), public.omni_mesma_familia(uuid), public.omni__meu_apelido(uuid),
  public.omni_criar_familia(text, text, text), public.omni_salvar_regras(uuid, jsonb),
  public.omni_criar_convite(uuid, text, text, text, integer, integer), public.omni_revogar_convite(uuid, text), public.omni_ver_convite(text),
  public.omni_pedir_entrada(text, text), public.omni_cancelar_pedido(uuid),
  public.omni_aprovar_entrada(uuid, uuid, text, text, jsonb, text), public.omni_recusar_entrada(uuid, uuid, text),
  public.omni_mudar_papel(uuid, uuid, text), public.omni_remover_membro(uuid, uuid), public.omni_sair(uuid),
  public.omni_perfil_sem_conta(uuid, text, text, boolean),
  public.omni_pedir_mudanca_chefe(uuid, uuid, text, text), public.omni_aprovar_pedido(uuid, text), public.omni_vetar_pedido(uuid, text),
  public.omni_cancelar_pedido_gov(uuid, text), public.omni_propor_transferencia(uuid, uuid), public.omni_responder_transferencia(uuid, boolean),
  public.omni_executar_pedidos(uuid), public.omni_pedir_emergencia(uuid), public.omni_liberar_emergencia(uuid),
  public.omni_mudar_campos(uuid, text, text, jsonb), public.omni_encerrar_familia(uuid)
  to authenticated;
-- funções internas: só o banco usa
revoke all on function public.omni__hist(uuid, text, text), public.omni__membro_ativo(uuid, uuid), public.omni__pedido_chefe_ok(uuid, uuid),
  public.omni_tg_carimbo(), public.omni_tg_historico(), public.omni_tg_combinados(), public.omni_tg_docs(), public.omni_tg_aparelhos()
  from authenticated;
-- LGPD: só a plataforma (admin_anonimizar_usuario / service_role), nunca o app
revoke all on function public.omni_anonimizar(uuid) from authenticated;
grant execute on function public.omni_anonimizar(uuid) to service_role;

-- -------------------------------------------------------------------------------------
-- 9) Conferência: toda tabela omni_* com RLS ligado e com regra; nada aberto para anon
-- -------------------------------------------------------------------------------------
do $$
declare r record; v_erros text := '';
begin
  for r in select c.relname, c.relrowsecurity,
                  (select count(*) from pg_catalog.pg_policies p where p.schemaname = 'public' and p.tablename = c.relname) as pol
             from pg_catalog.pg_class c join pg_catalog.pg_namespace n on n.oid = c.relnamespace
            where n.nspname = 'public' and c.relkind = 'r' and c.relname like 'omni\_%' loop
    if not r.relrowsecurity then v_erros := v_erros || ' ' || r.relname || '(sem RLS)'; end if;
    if r.pol = 0 then v_erros := v_erros || ' ' || r.relname || '(sem regra)'; end if;
  end loop;
  if exists (select 1 from information_schema.role_table_grants g where g.table_schema = 'public' and g.table_name like 'omni\_%' and g.grantee = 'anon') then
    v_erros := v_erros || ' anon tem acesso a tabela omni_*';
  end if;
  if (select count(*) from pg_catalog.pg_class c join pg_catalog.pg_namespace n on n.oid = c.relnamespace
       where n.nspname = 'public' and c.relkind = 'r' and c.relname like 'omni\_%') <> 13 then
    v_erros := v_erros || ' esperava 13 tabelas omni_*';
  end if;
  if not exists (select 1 from public.sol_apps a where a.codigo = 'omnilife-one') then v_erros := v_erros || ' sol_apps sem omnilife-one'; end if;
  if v_erros <> '' then raise exception 'Conferência do OmniLifeONE falhou:%', v_erros; end if;
  raise notice 'OmniLifeONE v1: 13 tabelas omni_* com RLS e regras, funções com permissões conferidas, registro em sol_apps ok.';
end $$;

commit;

-- Resultado da conferência (só leitura): uma linha por tabela, com RLS ligado e quantas regras tem
select c.relname as tabela, c.relrowsecurity as rls_ligado,
       (select count(*) from pg_catalog.pg_policies p where p.schemaname = 'public' and p.tablename = c.relname) as regras
  from pg_catalog.pg_class c join pg_catalog.pg_namespace n on n.oid = c.relnamespace
 where n.nspname = 'public' and c.relkind = 'r' and c.relname like 'omni\_%'
 order by 1;
