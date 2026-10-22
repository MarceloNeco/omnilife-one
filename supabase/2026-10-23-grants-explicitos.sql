-- =====================================================================================
-- 2026-10-23-grants-explicitos.sql  —  OmniLifeONE no projeto solverone-app (Supabase)
-- Permissões explícitas por papel (diretriz "Permissões explícitas no Supabase", pendência #122 do rootify-one)
-- -------------------------------------------------------------------------------------
-- POR QUÊ: desde 30/Out/2026 o Supabase não dá mais acesso automático pela Data API a objeto
-- novo do schema public. Este script escreve, por extenso, as permissões que as tabelas e funções
-- omni_* TÊM HOJE (lidas ao vivo pelo chat Arquitetura em 22/Out/2026; matriz revisão 2 em
-- rootify-one/docs/reforma/supabase/grants-matriz.md), para recriar o projeto dar o mesmo resultado.
--
-- DUAS PARTES (o Omni não tem parte B: no projeto, as funções omni_* já estão fechadas a anon e PUBLIC):
--   A) só GRANT, igual ao banco de hoje: no projeto atual NÃO MUDA NADA. Pode rodar quantas vezes quiser.
--   C) "opt-in" antecipado do Supabase (privilégios padrão revogados). O projeto atual JÁ está assim;
--      serve para projeto novo. Pode rodar quantas vezes quiser.
--
-- COMO APLICAR (só depois do "pode aplicar" do dono): supabase.com → projeto solverone-app →
-- SQL Editor → New query → cole este arquivo inteiro → Run. Nada muda no projeto de hoje.
-- Nenhuma chave, senha ou dado de pessoa neste arquivo.
-- =====================================================================================

-- -------------------------------------------------------------------------------------
-- A) GRANT por papel, igual ao banco de 22/Out/2026 (não muda nada no projeto de hoje)
--    Visitante (anon) não toca em nada do Omni. Gatilhos e funções internas ficam sem EXECUTE para
--    ninguém (quem chama é SECURITY DEFINER); omni_anonimizar só para o service_role (LGPD).
-- -------------------------------------------------------------------------------------
-- omnilife-one-v1.sql
grant execute on function public.omni_sou_membro(p_grupo uuid) to authenticated;
grant execute on function public.omni_sou_chefe(p_grupo uuid) to authenticated;
grant execute on function public.omni_sou_responsavel(p_grupo uuid) to authenticated;
grant execute on function public.omni_sou_adulto(p_grupo uuid) to authenticated;
grant execute on function public.omni_papel_de(p_grupo uuid, p_user uuid) to authenticated;
grant execute on function public.omni_jsonb_mesclar(a jsonb, b jsonb) to authenticated;
grant select on public.omni_familia to authenticated;
grant select, insert, update, delete on public.omni_familia to service_role;
grant select, insert, update on public.omni_docs to authenticated;
grant select, insert, update, delete on public.omni_docs to service_role;
grant select, insert on public.omni_combinados to authenticated;
grant select, insert, update, delete on public.omni_combinados to service_role;
grant select, insert on public.omni_historico to authenticated;
grant select, insert, update, delete on public.omni_historico to service_role;
grant select on public.omni_governanca to authenticated;
grant select, insert, update, delete on public.omni_governanca to service_role;
grant select on public.omni_cofre_liberado to authenticated;
grant select, insert, update, delete on public.omni_cofre_liberado to service_role;
grant execute on function public.omni_cofre_liberado_para_mim(p_grupo uuid) to authenticated;
grant select, insert, update, delete on public.omni_aparelhos to authenticated;
grant select, insert, update, delete on public.omni_aparelhos to service_role;
grant select on public.omni_pedidos_entrada to authenticated;
grant select, insert, update, delete on public.omni_pedidos_entrada to service_role;
grant select on public.omni_pedidos_verificacao to authenticated;
grant select, insert, update, delete on public.omni_pedidos_verificacao to service_role;
grant select on public.omni_convite_info to authenticated;
grant select, insert, update, delete on public.omni_convite_info to service_role;
grant select, insert, update on public.omni_chave_privada to authenticated;
grant select, insert, update, delete on public.omni_chave_privada to service_role;
-- public.omni_tg_carimbo(): sem EXECUTE para ninguém (interna ou gatilho; quem chama é SECURITY DEFINER)
grant execute on function public.omni__meu_apelido(p_grupo uuid) to authenticated;
-- public.omni_tg_historico(): sem EXECUTE para ninguém (interna ou gatilho; quem chama é SECURITY DEFINER)
-- public.omni_tg_combinados(): sem EXECUTE para ninguém (interna ou gatilho; quem chama é SECURITY DEFINER)
-- public.omni_tg_docs(): sem EXECUTE para ninguém (interna ou gatilho; quem chama é SECURITY DEFINER)
-- public.omni_tg_aparelhos(): sem EXECUTE para ninguém (interna ou gatilho; quem chama é SECURITY DEFINER)
-- public.omni__hist(p_grupo uuid, p_acao text, p_detalhe text): sem EXECUTE para ninguém (interna ou gatilho; quem chama é SECURITY DEFINER)
-- public.omni__membro_ativo(p_grupo uuid, p_user uuid): sem EXECUTE para ninguém (interna ou gatilho; quem chama é SECURITY DEFINER)
-- public.omni__dono_na_base(p_grupo uuid, p_dono uuid): sem EXECUTE para ninguém (interna ou gatilho; quem chama é SECURITY DEFINER)
grant execute on function public.omni_criar_familia(p_nome text, p_apelido text, p_perfil_id text) to authenticated;
grant execute on function public.omni_salvar_regras(p_grupo uuid, p_regras jsonb) to authenticated;
grant execute on function public.omni_criar_convite(p_grupo uuid, p_papel text, p_perfil_id text, p_para_nome text, p_max_usos integer, p_horas integer) to authenticated;
grant execute on function public.omni_revogar_convite(p_grupo uuid, p_codigo text) to authenticated;
grant execute on function public.omni_ver_convite(p_codigo text) to authenticated;
grant execute on function public.omni_pedir_entrada(p_codigo text, p_nome text) to authenticated;
grant execute on function public.omni_cancelar_pedido(p_grupo uuid) to authenticated;
grant execute on function public.omni_aprovar_entrada(p_grupo uuid, p_user uuid, p_papel text, p_perfil_id text, p_consentimento jsonb, p_verificacao text) to authenticated;
grant execute on function public.omni_recusar_entrada(p_grupo uuid, p_user uuid, p_motivo text) to authenticated;
-- public.omni__pedido_chefe_ok(p_grupo uuid, p_alvo uuid): sem EXECUTE para ninguém (interna ou gatilho; quem chama é SECURITY DEFINER)
grant execute on function public.omni_mudar_papel(p_grupo uuid, p_alvo uuid, p_papel text) to authenticated;
grant execute on function public.omni_remover_membro(p_grupo uuid, p_alvo uuid) to authenticated;
grant execute on function public.omni_sair(p_grupo uuid) to authenticated;
grant execute on function public.omni_perfil_sem_conta(p_grupo uuid, p_perfil_id text, p_apelido text, p_ativo boolean) to authenticated;
grant execute on function public.omni_pedir_mudanca_chefe(p_grupo uuid, p_alvo uuid, p_tipo text, p_papel text) to authenticated;
grant execute on function public.omni_aprovar_pedido(p_grupo uuid, p_id text) to authenticated;
grant execute on function public.omni_vetar_pedido(p_grupo uuid, p_id text) to authenticated;
grant execute on function public.omni_cancelar_pedido_gov(p_grupo uuid, p_id text) to authenticated;
grant execute on function public.omni_propor_transferencia(p_grupo uuid, p_alvo uuid) to authenticated;
grant execute on function public.omni_responder_transferencia(p_grupo uuid, p_aceitar boolean) to authenticated;
grant execute on function public.omni_executar_pedidos(p_grupo uuid) to authenticated;
grant execute on function public.omni_pedir_emergencia(p_grupo uuid) to authenticated;
grant execute on function public.omni_liberar_emergencia(p_grupo uuid) to authenticated;
grant execute on function public.omni_mudar_campos(p_grupo uuid, p_colecao text, p_id text, p_campos jsonb) to authenticated;
grant execute on function public.omni_encerrar_familia(p_grupo uuid) to authenticated;
grant execute on function public.omni_anonimizar(p_uid uuid) to service_role;

-- -------------------------------------------------------------------------------------
-- C) opt-in antecipado do Supabase: objeto novo em public não ganha permissão sozinho
--    (supabase.com/docs/guides/api/securing-your-api, "Default privileges for new tables and
--    functions"). O projeto atual já está assim; aqui é só para projeto novo.
-- -------------------------------------------------------------------------------------
alter default privileges for role postgres in schema public revoke all on tables from anon, authenticated, service_role;
alter default privileges for role postgres in schema public revoke all on sequences from anon, authenticated, service_role;
alter default privileges for role postgres in schema public revoke all on functions from anon, authenticated, service_role;
alter default privileges for role postgres in schema public revoke execute on functions from public;
