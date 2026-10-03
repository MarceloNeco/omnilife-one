# OmniLifeONE na conta e no banco SolverONE (Supabase) — plano

Versão do plano: 2 · 03/Out/2026 · app na v2.12.2 (Etapa 1: só plano e SQL; o app publicado não muda).
A versão 2 foi revisada e testada contra o arquivo **real** da base comum do RootifyONE
(`entrega/solverone-app/supabase/2026-10-03-plataforma-dados-v1.sql`).

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
| **Cloud/FB** — documento da família (`families/{fid}`: nome, criador, membros, regras) | `sol_grupos` (nome, `governanca = 'omnilife-one'`) + `sol_grupo_membros` (quem é quem) + `omni_familia` (criador e regras do Omni) | Papel `admin` de hoje vira `chefe`. "Criador da família" = `omni_familia.dono` (e `sol_grupos.dono`, se a base criar a coluna). Com a `governanca`, as funções genéricas da base não mexem na família do Omni. |
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
- Chave aberta do cofre, chave privada aberta da pessoa (ver item 4) e chaves da cópia protegida.
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

**As chaves (usando as tabelas e funções comuns da base, iguais para todos os apps):**

1. Cada pessoa com conta gera no aparelho um **par de chaves** (RSA-OAEP-256, o padrão da base). A **pública**
   vai para a base com `sol_publicar_minha_chave` (a base recusa se vier a parte privada). A **privada** fica no
   aparelho; uma cópia dela, cifrada no aparelho com o **código de recuperação** da pessoa (PBKDF2), fica em
   `omni_chave_privada` para quando ela usar outro aparelho. Só a própria pessoa lê essa cópia.
2. A família tem duas chaves (AES-GCM 256): **chave da família** (todos os membros com conta) e **chave
   restrita** (só chefes e responsáveis). Registros `publico` usam a da família; `restrito`, a restrita.
3. **Embrulhar:** o aparelho de um chefe/responsável lê as chaves públicas com `sol_chaves_publicas_do_grupo`
   e guarda, para cada pessoa, um pacote cifrado com a pública dela (`sol_guardar_chave_grupo`, uma linha por
   pessoa e versão em `sol_grupo_chaves`). Para membros e crianças com conta, o pacote leva só a chave da
   família; para chefes e responsáveis, leva as duas. Cada um lê só o seu pacote (`sol_minha_chave_grupo`).
   Ninguém no servidor vê chave aberta.
4. **Quando entra alguém:** depois da aprovação, o próximo aparelho de chefe/responsável que abrir o app vê
   "Dani ainda está sem a chave" (`ultima_versao` vazia) e embrulha sozinho.
5. **Quando alguém sai, é removido ou deixa de ser responsável:** os aparelhos dos chefes criam uma **versão
   nova** das chaves (versao + 1) para quem ficou e passam a usar a nova; os registros antigos são recifrados
   aos poucos. (Quem saiu pode ter guardado o que já via antes — isso nenhum sistema evita.)
6. **Outro aparelho da mesma pessoa:** ela recupera a privada pela cópia em `omni_chave_privada` com o código
   de recuperação. A base nunca sobrescreve uma versão já guardada; por isso, se a pessoa perder o código,
   ela gera um par novo e a família passa para uma versão nova das chaves.
7. **Cofre:** continua com a senha do cofre de hoje (camada de dentro) e ganha a chave da família por fora.
   O contato de emergência liberado lê as linhas do cofre e abre com a senha que vem do envelope de emergência.
8. **Risco:** se a família perder **todos** os aparelhos **e** os códigos de recuperação, os dados cifrados
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
Chaves (funções da base): `sol_publicar_minha_chave`, `sol_chaves_publicas_do_grupo`, `sol_guardar_chave_grupo`,
`sol_minha_chave_grupo`; cópia cifrada da chave privada em `omni_chave_privada`.
LGPD (só a plataforma): `omni_anonimizar(uid)`, registrada em `sol_apps` como `omni_anonimizar`.

## 8. Como foi testado (sem tocar no seu Supabase)

- Num PostgreSQL 16 descartável aqui no ambiente de trabalho, com o **arquivo real da base comum**: o
  ambiente de teste do próprio RootifyONE (`teste/sql/stub-supabase.sql`) e os SQLs reais da entrega, na ordem
  do LEIA-ME deles (28a, 28b, 28c, 02b e `2026-10-03-plataforma-dados-v1.sql` duas vezes). Por cima, uma
  emenda **só de teste** que simula as 4 mudanças já pedidas ao RootifyONE (coluna `governanca`, convite com
  código de 16 caracteres e papel `chefe`, apelido de até 80, e a coluna `dono`).
- **Porteiro:** na base de hoje, o SQL do Omni para logo no começo pedindo a `governanca`; só com a
  `governanca`, para dizendo que a base ainda recusa o convite de 16 caracteres. Nos dois casos, nada é criado.
- **198 verificações** com seis pessoas de teste mais um dono da equipe: entrada com 1 e 2 aprovações, código
  de 4 números (certo, errado, 3 erros), convite vencido, revogado e lotado, criança sem/com consentimento,
  `restrito`, pedidos de compra, cofre e saúde cifrados, combinados, histórico, governança de 48 h, passar a
  criação (com o dono atualizado também na base), emergência do cofre, aparelhos, **chaves pelas funções da
  base**, recados, perfis sem conta, sair e voltar (linha nova, a antiga fica no histórico), encerrar família,
  pasta restrita no Storage junto com as regras reais da base e **LGPD pela função real**
  `admin_anonimizar_usuario` (chamada por um dono da equipe). **Todas passaram.**
- O arquivo roda **duas vezes seguidas** sem erro (idempotente), também numa base **sem** a coluna `dono`.
- Catálogo: todas as funções `omni_*` com `search_path` vazio; o visitante (`anon`) não executa nem lê nada
  do Omni; `omni_anonimizar` não roda pelo app; o Omni não mudou nenhuma permissão das tabelas `sol_*`.
- **O que o teste mostrou que ainda depende da base:** hoje, numa família do Omni, estas 5 funções genéricas
  passam por cima das regras do Omni — `sol_aceitar_convite` (entra sem aprovação nem código),
  `sol_mudar_papel` (rebaixa o criador sem as 48 h), `sol_sair_do_grupo` (tira outro chefe ou o criador),
  `sol_criar_convite` (convite sem os dados do Omni) e `sol_encerrar_grupo` (chefe que não é o criador encerra).
  É a trava da `governanca` que precisa barrar isso (item 9.1).
- No Supabase de verdade foi feita **uma consulta só de leitura** (03/Out/2026): a base `sol_*` ainda não existia.

## 9. O que do contrato não serve bem para o Omni (para combinar com o chat do RootifyONE)

1. **Importante — a trava da `governanca` na base.** A família do Omni nasce com `sol_grupos.governanca =
   'omnilife-one'`. A base precisa fazer as funções genéricas **recusarem** grupos com `governanca` de outro
   app: `sol_aceitar_convite`, `sol_criar_convite`, `sol_mudar_papel`, `sol_sair_do_grupo`,
   `sol_encerrar_grupo` (o teste mostrou que hoje as 5 passam) e também `sol_adicionar_crianca` e
   `sol_atualizar_membro` (que deixa trocar o `perfil_id`, isto é, com qual pessoa da família a conta está
   ligada). `sol_desativar_convite`, as funções de chave, de uso, de ponte e de arquivos podem continuar
   valendo. O SQL do Omni não roda sem a coluna `governanca`.
2. **Mudanças já pedidas ao RootifyONE** (o SQL do Omni confere antes de criar qualquer coisa): convite com
   código de 16 caracteres e papel `chefe`; apelido de até 80 caracteres; e, se quiserem, `sol_grupos.dono`
   (o Omni preenche quando a coluna existir; a fonte do Omni continua sendo `omni_familia.dono`).
3. **Convites sem "para quem".** A base já guarda quem criou; o perfil e o nome de quem vai entrar continuam em
   `omni_convite_info`.
4. **Chaves (C7) — o que falta na base:** a **cópia cifrada da chave privada** da pessoa (para usar outro
   aparelho). Mantive só essa tabela no Omni (`omni_chave_privada`, só a própria pessoa lê); se a base criar
   uma `sol_*` igual, o Omni passa a usar. Não é essencial, mas vale saber: a base guarda **um pacote por
   pessoa e versão**, sem separar "chave da família" e "chave restrita". O Omni põe as duas no pacote de quem
   é chefe/responsável; o banco não tem como conferir isso (só vê o pacote fechado), mas quem embrulha é
   sempre chefe/responsável, que já enxerga o conteúdo restrito.
5. **`vis`.** O contrato usa `publico`; o Omni chama de `familia`. Na Etapa 2 o app traduz (`familia` ⇄ `publico`).
6. **Conta encerrada.** O Omni usa `sol_exigir_conta` da base para criar família e pedir entrada (conta
   encerrada não entra), como as funções da base.
7. **Avisos com o app fechado.** O Supabase não manda notificação para o celular com o app fechado. Para isso
   seria preciso Web Push (servidor com chave VAPID numa Edge Function). Fica fora do contrato — me diga se quer.
8. **Execução automática das 48 h.** Hoje o pedido que venceu é executado quando um chefe abre o app. Com o
   `pg_cron` (já instalado) dá para executar sozinho de hora em hora. Opcional.
9. **LGPD.** Registrado como a base pede (`funcao_anonimizar = 'omni_anonimizar'`). A base chama
   `omni_anonimizar` antes de limpar os vínculos dos grupos, então o Omni ainda acha os perfis da pessoa.
   Para **criança sem conta** não há `uid`: proponho uma função futura para o responsável pedir a
   anonimização do perfil da criança (art. 14).
10. **Plano grátis.** 500 MB de banco e 1 GB de arquivos no total para todos os apps: por isso imagens reduzidas
    e arquivos grandes só com aviso.

Já resolvidos pela base real: `perfil_id` é texto; nomes das colunas (`codigo`, ids uuid automáticos,
`sol_apps.codigo` único); `sol_sou_responsavel` inclui o chefe; bucket `sol-arquivos` e regras por membro (o
Omni só acrescenta a regra da pasta `restrito`); chave pública e chave da família embrulhada por membro.

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
11. (Não pedido, só para decidir) Notificações com o app fechado (item 9.7), execução automática das 48 h
    (item 9.8) e "Meus contatos" sincronizado por pessoa (item 3).

## 11. Passo a passo para rodar (quando chegar a hora)

1. O chat do RootifyONE roda primeiro a **base comum** (`sol_*`), já com a coluna `governanca` e as mudanças
   do item 9.2.
2. Leve `supabase/omnilife-one-v1.sql` para a revisão no chat do Cowork.
3. Depois de revisado: Supabase → projeto **solverone-app** → **SQL Editor** → **New query** → cole o arquivo
   inteiro → **Run**.
4. No fim aparece uma tabela com **11 linhas** (`omni_aparelhos` … `omni_pedidos_verificacao`), todas com
   `rls_ligado = true` e `regras` maior que zero. Se a base não existir ou ainda não tiver as mudanças,
   aparece a mensagem "falta a base comum da plataforma" dizendo o que falta, e nada é criado.
5. Me avise neste chat que rodou — aí começo a Etapa 2.

## 12. Andamento da Etapa 2 (combinado em 03/Out/2026)

Quatro entregas, cada uma com versão, PR e merge; o app funciona entre uma e outra. Um login só para todos os apps
(chave comum `solverone.sessao.v1`).

| Entrega | O que entra | Situação |
|---|---|---|
| **2a** | Conta SolverONE: e-mail e senha, Google, criar conta, esqueci a senha, sair; uso e acessos (C4, C9); encerrar conta / pedir exclusão; Firebase sai da tela inicial | ✅ v2.13.0 |
| **2b** | Família e registros na nuvem: criar família, convites, pedido e aprovação, papéis, 48 h, emergência, aparelhos, histórico; uso sem internet; "Levar meus dados para a nuvem" | ✅ v2.14.0 |
| **2c** | Cofre de senhas ponta a ponta e entrada sem internet (escopo redefinido em 03/Out/2026, vira diretriz geral): chave do cofre da família embrulhada para cada chefe/responsável, PIN e digital (PRF) no aparelho, código de recuperação, trava, revalidação e apagar ao desconectar | ✅ v2.15.0 |
| **2d** | Ponte entre apps (`sol_ponte`); tirar o Firebase do código; LEIA-ME, ARQUITETURA e página de teste | a fazer |
| a combinar | Saúde, documentos e arquivos (Storage `sol-arquivos`, redução de imagem) cifrados com a mesma chave — antes listados na 2c | a fazer |

Saúde, documentos e arquivos (inclusive anexos do cofre) continuam só no aparelho (o banco recusa saúde e documentos sem cifra).

Como ficou a 2c (v2.15.0): o cofre sobe só como `dados_cifrado` (AES-GCM 256 com a chave do cofre da família, CF). A CF vai
para cada chefe e responsável embrulhada com a chave pública dele (`sol_chave_publica` / `sol_grupo_chaves`); a chave privada
da pessoa fica no banco só cifrada pelo código de recuperação do cofre (`omni_chave_privada`, PBKDF2 600 mil). No aparelho, uma
chave do aparelho embrulhada pelo PIN (PBKDF2 600 mil) e pela digital (WebAuthn PRF) guarda a CF: destranca sem internet.
Contato de emergência: envelope `_em` com a CF cifrada pelo código de emergência. Nenhum SQL novo: só o que já estava na base
0.10.1 e em `supabase/omnilife-one-v1.sql`. Testado contra o Supabase local (computador e celular emulados, modo avião).

Como ficou a 2b (v2.14.0), decidido com o dono do projeto: conflito = **junta campo a campo e só pergunta o que bate**
(o mesmo campo mudado nos dois aparelhos); listas somam. Sem internet: cópia no aparelho + fila de saída, com o selo
"N itens aguardando sincronia". Sem tempo real: o app consulta a cada 20 s (e ao voltar para o app ou a internet).
Antes de apagar qualquer dado do navegador, o app oferece a cópia protegida e levar para a nuvem. Nenhum SQL novo foi
preciso: a 2b usa só o que já está em `supabase/omnilife-one-v1.sql`. Testado contra um Supabase local com a base real
(cerca de 130 verificações: entrada com código, 2 aprovações, conflito, sem internet, governança, aparelhos, levar a família).
Extras anotados para depois da Etapa 2, a confirmar: avisos com o app fechado (Web Push), 48 h automáticas
(`pg_cron`, SQL novo) e "Meus contatos" na conta (tabela nova). Nenhum SQL novo sem autorização.
