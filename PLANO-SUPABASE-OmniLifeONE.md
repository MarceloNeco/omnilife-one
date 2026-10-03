# OmniLifeONE na conta e no banco SolverONE (Supabase) — plano

Versão do plano: 1 · 03/Out/2026 · app na v2.12.1 (Etapa 1: só plano e SQL; o app publicado não muda).

- Contrato da plataforma: `PLATAFORMA-DADOS.md` (C1 a C10).
- SQL das tabelas do Omni: `supabase/omnilife-one-v1.sql` (**não rodar antes da revisão**; roda **depois** da base comum do RootifyONE).
- Regras de hoje (Firebase, que nunca chegou a ser criado): `regras-firestore-OmniLifeONE.txt` — continua no repositório como referência.

## 1. Em uma frase

Hoje os dados de cada família ficam só no navegador de cada aparelho. Depois da Etapa 2, cada pessoa entra com
a **conta SolverONE**, a família vira um **grupo** da plataforma (`sol_grupos`) e os registros do Omni ficam no
banco (`omni_*`), com uma **cópia no aparelho** para funcionar sem internet. Quem não quiser conta continua como
**visitante**, só no aparelho, como hoje.

## 2. Como cada parte do app vira tabela

| Parte do app (hoje) | No banco SolverONE | Observação |
|---|---|---|
| **DB** — as coleções (`people`, `events`, `tasks`, `shop`, `items`, `contacts`, `places`, `spots`, `school`, `things`, `maint`, `guides`, `routine`, `purchases`, `prices`, `settings`, `reminders`, `expects`, `coexp`…) | `omni_docs`: uma linha por registro (`grupo_id`, `colecao`, `id`, `vis`, `dados`, `dados_cifrado`, `versao`, `apagado_em`) | Mesmo formato de hoje dentro de `dados`; o app troca só o "motorista" (driver) do `DB`. Apagar = marcar `apagado_em` (para os outros aparelhos ficarem sabendo). |
| **Cloud/FB** — documento da família (`families/{fid}`: nome, criador, membros, regras) | `sol_grupos` (nome) + `sol_grupo_membros` (quem é quem) + `omni_familia` (criador e regras do Omni) | Papel `admin` de hoje vira `chefe`. "Criador da família" = `omni_familia.dono`. |
| `users/{uid}` (última família, pedido pendente) | não precisa de tabela | Famílias da pessoa = `sol_grupo_membros`; pedido pendente = `omni_pedidos_entrada`; última família aberta fica no aparelho. |
| **Convites** | `sol_grupo_convites` (código, papel, prazo, vagas) + `omni_convite_info` (para quem é, perfil, quem convidou) | Criar/revogar só pelas funções `omni_criar_convite` / `omni_revogar_convite`. Quem tem o código vê o convite com `omni_ver_convite`. |
| **Aprovações** (pedidos de entrada) | `omni_pedidos_entrada` + `omni_pedidos_verificacao` (código de 4 números) | 1 ou 2 aprovações (regra da família); responsável aprova só membro ou criança; criança exige consentimento (LGPD art. 14). O banco confere o código e recusa após 3 erros. |
| **Gov** — governança (rebaixar/remover chefe em 48 h, passar a criação, emergência) | `omni_governanca` + funções | Mesmos ids de hoje: `hd_<uid>`, `tr_<grupo>`, `em_<uid>`. Executar o que venceu: `omni_executar_pedidos` (qualquer chefe ao abrir o app). |
| **Devices** — aparelhos conectados | `omni_aparelhos` | Cada um registra o seu; chefe desconecta e apaga; aparelho desconectado não se religa sozinho. |
| **Duas casas** | `settings.duas` e `coexp` em `omni_docs`; `comsg` (registro de combinados) em `omni_combinados` | `omni_combinados` só recebe linhas novas: ninguém edita nem apaga (nem pelo app). |
| **Cofre** | `omni_docs` coleção `vault`, sempre **cifrado** e `restrito` | Duas camadas: a senha do cofre de hoje + a chave da família (C7). Só chefe/responsável lê e grava; contato de emergência só lê depois de liberado. |
| **Acesso de emergência ao cofre** | pedido `em_<uid>` em `omni_governanca` + `omni_cofre_liberado` | Contato pede; chefes/responsáveis podem negar; sem veto, libera depois da espera (`omni_liberar_emergencia`). A senha do cofre continua chegando pelo envelope de emergência (código entregue fora do app). |
| **Saúde** | `omni_docs` coleção `health`, sempre **cifrado** | O banco recusa ficha de saúde em claro. |
| **Documentos** | `omni_docs` coleção `docs`, sempre **cifrado**; arquivos (fotos, PDFs) no Storage `sol-arquivos/omnilife-one/<grupo>/restrito/…`, cifrados antes de subir | A pasta `restrito` só abre para chefe/responsável (política própria do Omni no Storage). |
| **Arquivos** em geral (`files` + pedaços) | Storage `sol-arquivos/omnilife-one/<grupo>/<arquivo>` (C6); a ficha do arquivo continua em `omni_docs` coleção `files` | Imagens reduzidas no aparelho antes de subir (plano grátis: 1 GB no total). Some o esquema de "pedaços" do Firestore. |
| **Onde Está?** | `omni_docs` coleções `places`, `things`, `spots` | Sem mudança de formato. |
| **Aviso Cheguei** | `omni_docs` coleções `checkins` e `expects` | As preferências pessoais do Cheguei continuam no aparelho (`S.prefs.cheguei`). |
| **Recados** | `omni_docs` coleções `msgs` e `reminders` | "Lido por" muda com `omni_mudar_campos` (mexe só no campo, sem apagar o que outro aparelho mudou). |
| **Histórico de segurança** | `omni_historico` | Só inclusão; chefe/responsável lê; o nome de quem fez vem da família (não do aparelho). |
| **Ponte entre apps** (`ecossistema.ponte.v1`) | `sol_ponte` (C5, base comum) | Etapa 2, mantendo a leitura antiga por um tempo. |
| Uso e acessos | `sol_registrar_uso('omnilife-one')` (C4) e Edge Function `solverone-admin` → `registrar-acesso` com `app` (C9) | Etapa 2. |
| Pessoas sem conta (criança pequena) | `sol_grupo_membros` com `user_id` vazio (`omni_perfil_sem_conta`) | Os dados dela entram pelo responsável (LGPD art. 14). |

## 3. O que fica só no aparelho

Nada disso sobe para o banco:

- Preferências da pessoa (`omnilife.prefs.v1`: tema, idioma, barra de atalhos, Cheguei, avisos…).
- **Digital e PIN**: `omnilife.webauthn.v1`, `omnilife.bioProfiles.v1` e o `pinHash` das pessoas. O PIN e a
  digital passam a ser só o **desbloqueio local** do aparelho; o login é a conta SolverONE. Ao sincronizar
  `people`, o app tira o `pinHash` antes de subir.
- Chaves de IA, clima e rotas (cofre de chaves compartilhado com o MoneyTRIO: `investifyme.chaves.v1`).
- Chave aberta do cofre, chave privada da pessoa (ver item 4) e chaves da cópia protegida.
- Identificação do aparelho (`omnilife.deviceId`), última posição (`omnilife.lastpos.v1`), caches do clima,
  anúncios, avisos já vistos, sessão da aba, registro local de alterações e relatório de erros.
- "Meus contatos" da área Segurança (`omnilife.myContacts.v1`) — pode passar a sincronizar por pessoa depois,
  se você quiser (ver item 9).
- Visitante: tudo continua no aparelho, como hoje.

## 4. O que vai cifrado (C7) e como a chave da família é compartilhada

**O que vai cifrado no aparelho, antes de subir:** cofre (`vault`), saúde (`health`), documentos (`docs`) e os
arquivos de documentos/exames. O banco **recusa** essas três coleções em claro (`dados` precisa ficar vazio;
só `dados_cifrado`). O resto (agenda, listas, tarefas, nomes) fica legível no banco, protegido pelas regras de
acesso — como em qualquer app de família. Se quiser cifrar mais coisas depois, é só incluir a coleção na lista.

**As chaves:**

1. Cada pessoa com conta gera no aparelho um **par de chaves** (ECDH P-256). A **pública** vai para
   `omni_chaves_publicas` (os membros da mesma família podem ler). A **privada** fica no aparelho; uma cópia
   dela, cifrada com o **código de recuperação** da pessoa (PBKDF2), fica em `omni_chave_privada` para quando
   ela trocar de aparelho. Só a própria pessoa lê essa cópia.
2. A família tem duas chaves (AES-GCM 256): **chave da família** (todos os membros com conta) e **chave
   restrita** (só chefes e responsáveis). Registros `publico` usam a da família; `restrito`, a restrita.
3. **Embrulhar:** o aparelho de um chefe/responsável combina a privada dele com a pública do novo membro e
   embrulha a chave da família para ele; o resultado fica em `omni_chaves_grupo` (uma linha por pessoa, tipo
   e versão). O banco só deixa chefe/responsável embrulhar, e a chave restrita só vai para chefe/responsável.
   Ninguém no servidor vê a chave aberta.
4. **Quando entra alguém:** depois da aprovação, o próximo aparelho de chefe/responsável que abrir o app vê
   "Dani ainda está sem a chave" e embrulha sozinho.
5. **Quando alguém sai ou é removido:** os aparelhos dos chefes criam uma **versão nova** das chaves (versao + 1)
   e passam a usar a nova; os registros antigos são recifrados aos poucos. (Quem saiu pode ter guardado o que já
   via antes — isso nenhum sistema evita.)
6. **Cofre:** continua com a senha do cofre de hoje (camada de dentro) e ganha a chave da família por fora.
   O contato de emergência liberado lê as linhas do cofre e abre com a senha que vem do envelope de emergência.
7. **Risco:** se a família perder **todos** os aparelhos **e** os códigos de recuperação, os dados cifrados
   não voltam (o servidor não tem como abrir). Por isso: dois chefes, código de recuperação guardado e a cópia
   protegida de vez em quando.

## 5. Modo sem internet

- O **IndexedDB continua sendo a cópia local** (o mesmo armazenamento de hoje). A tela sempre lê da cópia local,
  com ou sem internet.
- Cada mudança feita no aparelho entra numa **fila de envio**. Com internet, a fila sobe em ordem.
- **Receber:** ao abrir e a cada reconexão, o app pede ao banco só o que mudou desde a última vez
  (`atualizado_em` maior que o último visto; há índice para isso). Com o app aberto, o **tempo real** do
  Supabase avisa na hora (as tabelas principais já entram na publicação `supabase_realtime`).
- **Conflito (a mesma coisa mudada em dois aparelhos sem internet):** o banco carimba `atualizado_em` e
  `versao` sozinho. Se o aparelho tentar mandar uma mudança feita em cima de uma versão antiga, vence a
  **alteração mais recente** (`atualizado_em`); a que perdeu vai para o "Histórico de alterações" do aparelho,
  para dar para desfazer.
- **Listas somam:** cada item de lista (compra, tarefa, recado, despesa) é um registro próprio, então itens
  incluídos em aparelhos diferentes simplesmente se somam. Dentro de um registro, campos que são lista ou
  mapa (ex.: "lido por") se juntam, como no Restaurar/Juntar da v2.11, e `omni_mudar_campos` muda só o campo.
- **Apagar** vira marca (`apagado_em`), para o aparelho que estava sem internet também apagar. A marca é
  limpa da cópia local depois de um tempo.

## 6. Quem pode o quê (o banco garante, não só a tela)

| | Chefe | Responsável | Membro (adulto) | Criança | De fora |
|---|---|---|---|---|---|
| Ver registros da família | ✅ tudo | ✅ tudo | ✅ menos `restrito` | ✅ menos `restrito` | ❌ |
| Criar/editar registros | ✅ | ✅ | ✅ (menos `restrito`) | só tarefas, compras, itens, recados, lembretes, arquivos, "cheguei" | ❌ |
| Apagar registros | ✅ | ✅ | ✅ | ❌ (só o próprio pedido de compra) | ❌ |
| Pedido de compra de outra pessoa | ✅ tudo | ✅ tudo | só status e data da compra | ❌ | ❌ |
| Cofre | ✅ | ✅ | só se for contato de emergência liberado (ler) | ❌ | ❌ |
| Histórico de segurança | ver e incluir | ver e incluir | só incluir | só incluir | ❌ |
| Convites | criar/revogar | criar/revogar | ❌ | ❌ | ver o convite pelo código |
| Aprovar entrada | qualquer papel | só membro e criança | ❌ | ❌ | ❌ |
| Mudar papel, remover | ✅ (outro chefe: pedido de 48 h) | ❌ | ❌ | ❌ | ❌ |
| Regras da família, nome | ✅ | ❌ | ❌ | ❌ | ❌ |
| Vetar pedido de chefe/emergência | ✅ (menos o que pediu) | ✅ (menos o que pediu) | o próprio alvo veta | ❌ | ❌ |
| Aparelhos | ver, desconectar, religar, apagar | ver todos | só os seus (registrar, desconectar) | só os seus | ❌ |
| Sair da família | ✅ (o criador passa a criação antes) | ✅ | ✅ | ✅ | — |

**Onde ficou mais seguro que as regras do Firebase:**

- O código de 4 números do pedido de entrada é **conferido pelo banco** e **escondido de quem aprova** (antes,
  a conferência era só na tela e o código estava no documento que quem aprova lia). 3 erros recusam o pedido.
- Membro não consegue gravar "às cegas" em cima de um registro `restrito` que ele não enxerga.
- Convite revogado ou lotado barra os pedidos que ainda esperavam aprovação.
- O nome no histórico de segurança vem da família, não do que o aparelho mandou.
- Ninguém apaga linha de verdade pelo app: apagar é marcar (vale também para o cofre).
- A anonimização (LGPD) só roda pela plataforma, nunca pelo app.

## 7. Funções que o app vai chamar (Etapa 2)

Família e entrada: `omni_criar_familia`, `omni_salvar_regras`, `omni_criar_convite`, `omni_revogar_convite`,
`omni_ver_convite`, `omni_pedir_entrada`, `omni_cancelar_pedido`, `omni_aprovar_entrada`, `omni_recusar_entrada`,
`omni_perfil_sem_conta`, `omni_sair`, `omni_encerrar_familia`.
Papéis e governança: `omni_mudar_papel`, `omni_remover_membro`, `omni_pedir_mudanca_chefe`, `omni_aprovar_pedido`,
`omni_vetar_pedido`, `omni_cancelar_pedido_gov`, `omni_propor_transferencia`, `omni_responder_transferencia`,
`omni_executar_pedidos`, `omni_pedir_emergencia`, `omni_liberar_emergencia`.
Registros: leitura e gravação direta em `omni_docs`/`omni_combinados`/`omni_historico`/`omni_aparelhos`
(o RLS confere) e `omni_mudar_campos` para mudar só alguns campos.
LGPD (só a plataforma): `omni_anonimizar(uid)`, registrada em `sol_apps`.

## 8. Como foi testado (sem tocar no seu Supabase)

- Num PostgreSQL 16 descartável aqui no ambiente de trabalho, com uma **imitação** da base comum (`sol_*` como
  está no contrato) e do Supabase (`auth.uid()`, `storage`, papéis `anon`/`authenticated`/`service_role`).
- **193 verificações** com seis pessoas de mentira (chefe criador, outro chefe, responsável, membro, criança e
  alguém de fora): entrada com 1 e 2 aprovações, código de 4 números (certo, errado, 3 erros), convite vencido,
  revogado e lotado, criança sem/com consentimento, `restrito`, pedidos de compra, cofre e saúde cifrados,
  combinados, histórico, governança de 48 h (veto, aprovação, execução, criador protegido), passar a criação,
  emergência do cofre (negar, esperar, liberar), aparelhos, chaves, recados, perfis sem conta, sair e voltar sem
  duplicar, encerrar família, arquivos restritos no Storage, LGPD (pela plataforma e pelo login de um admin) e
  visitante sem acesso. **Todas passaram.**
- O arquivo roda **duas vezes seguidas** sem erro (idempotente) e, sem a base comum, para logo no começo sem
  criar nada.
- No Supabase de verdade foi feita **uma consulta só de leitura** (03/Out/2026): a base `sol_*` ainda não existe;
  existem `admin_anonimizar_usuario(p_user_id, p_motivo)`, `minha_solicitacao_exclusao`, `pgcrypto`, `pg_cron`
  e a publicação `supabase_realtime` (vazia); nenhum bucket criado ainda.

## 9. O que do contrato não serve bem para o Omni (para combinar com o chat do RootifyONE)

1. **Importante — escrita direta nas tabelas da base.** O Omni muda papéis, membros e convites **só por funções**
   (é isso que garante as 48 h, o criador sempre chefe e a aprovação). A base precisa **não** liberar
   `insert/update` direto do app em `sol_grupo_membros`, `sol_grupo_convites` e `sol_grupos`; senão alguém poderia
   pular essas regras mexendo direto na tabela. Leitura por membro está ok.
2. **Dono atual do grupo.** `sol_grupos` só tem `criado_por`. O Omni deixa passar a criação para outro chefe,
   então guardei o dono atual em `omni_familia.dono`. Se outros apps precisarem, sugiro `sol_grupos.dono`.
3. **`perfil_id` é texto.** Os ids de pessoa do Omni são texto (ex.: `p…`), não uuid. A base precisa declarar
   `sol_grupo_membros.perfil_id` como `text`.
4. **Convites sem "para quem".** `sol_grupo_convites` não tem perfil, nome de quem vai entrar nem quem convidou.
   Guardei em `omni_convite_info`. Se a base quiser, pode ganhar essas colunas.
5. **Nome da coluna do código.** O contrato escreve "código"; o SQL usa `codigo` (sem acento), `id` uuid com
   valor automático em `sol_grupos` e `codigo` como chave única em `sol_apps`. Se a base usar outros nomes,
   ajusto o SQL antes de rodar.
6. **`sol_sou_responsavel`.** Para o Omni, "responsável" inclui o chefe. Para não depender dessa definição, o SQL
   usa `sol_meu_papel` e `sol_sou_membro` (que precisa considerar só membros ativos e grupo não encerrado).
7. **`vis`.** O contrato usa `publico`; o Omni chama de `familia`. Na Etapa 2 o app traduz (`familia` ⇄ `publico`).
8. **Chaves da família (C7).** Criei as tabelas como `omni_chaves_*`. Se outros apps também forem cifrar dados
   de família, vale a base ter `sol_chaves_*` iguais para todos; o Omni migra sem trabalho.
9. **Storage (C6).** O Omni precisa de uma pasta que só chefe/responsável abre (`omnilife-one/<grupo>/restrito/…`).
   O SQL cria uma política **restritiva** só para essa pasta; a base cria o bucket e a política por membro.
10. **Avisos com o app fechado.** O Supabase não manda notificação para o celular com o app fechado. Para isso
    seria preciso Web Push (servidor com chave VAPID numa Edge Function). Fica fora do contrato — me diga se quer.
11. **Execução automática das 48 h.** Hoje o pedido que venceu é executado quando um chefe abre o app. Com o
    `pg_cron` (já instalado) dá para executar sozinho de hora em hora. Opcional.
12. **LGPD.** `admin_anonimizar_usuario` precisa chamar `select public.omni_anonimizar(<uid>)` (devolve um resumo
    em jsonb). Para **criança sem conta**, não há `uid`: proponho uma função futura para o responsável pedir a
    anonimização do perfil da criança (art. 14).
13. **Plano grátis.** 500 MB de banco e 1 GB de arquivos no total para todos os apps: por isso imagens reduzidas
    e arquivos grandes só com aviso.

## 10. Regra zero — o que ainda não existe no app e precisa da sua confirmação antes da Etapa 2

1. Login com a conta SolverONE (e-mail/senha, Google, criar conta, esqueci a senha) no padrão do módulo
   Plataforma do Contador de Histórias; digital/PIN como desbloqueio local.
2. "Levar meus dados para a nuvem" (do aparelho ou da cópia protegida), sem duplicar pessoas, com prévia e
   confirmação; a cópia local fica até você confirmar.
3. Cifrar no aparelho com as chaves da família (item 4), incluindo o código de recuperação da chave pessoal.
4. Sincronização com fila de envio, tempo real e regra de conflito (item 5).
5. Arquivos no `sol-arquivos` com redução de imagem.
6. `sol_ponte` no lugar de `ecossistema.ponte.v1` (lendo a antiga por um tempo).
7. `sol_registrar_uso` e `registrar-acesso` ao entrar e sair.
8. "Encerrar minha conta" e "Pedir exclusão dos meus dados" (`minha_solicitacao_exclusao`).
9. Tirar o Firebase do app (o arquivo de regras fica arquivado).
10. Atualizar LEIA-ME, ARQUITETURA e a página de teste.
11. (Não pedido, só para decidir) Notificações com o app fechado (item 9.10), execução automática das 48 h
    (item 9.11) e "Meus contatos" sincronizado por pessoa (item 3).

## 11. Passo a passo para rodar (quando chegar a hora)

1. O chat do RootifyONE roda primeiro a **base comum** (`sol_*`).
2. Leve `supabase/omnilife-one-v1.sql` para a revisão no chat do Cowork.
3. Depois de revisado: Supabase → projeto **solverone-app** → **SQL Editor** → **New query** → cole o arquivo
   inteiro → **Run**.
4. No fim aparece uma tabela com **13 linhas** (`omni_aparelhos` … `omni_pedidos_verificacao`), todas com
   `rls_ligado = true` e `regras` maior que zero. Se a base não existir, aparece a mensagem
   "falta a base comum da plataforma" e nada é criado.
5. Me avise neste chat que rodou — aí começo a Etapa 2.
