# OmniLifeONE — arquitetura (leia antes de mexer)

Briefing para qualquer pessoa ou IA que for alterar este repositório.
Site estático no GitHub Pages: solverone.com.br/omnilife-one (antes marceloneco.github.io/omnilife-one; o GitHub redireciona). Sem servidor, sem build,
sem framework: HTML, CSS e JavaScript puros.

## Arquivos

| Arquivo | O que é | Pode mexer? |
|---|---|---|
| `index.html` | O app inteiro (HTML + CSS + JS num arquivo só) | Sim, com cuidado (ver abaixo) |
| `sw.js` | Service worker: modo sem internet e avisos (pré-carrega `janela.js`, `cofre.js`, `diretrizes.js` e o config) | Só subir o número `v…` a cada versão |
| `versoes.json` | Histórico de versões (PT/EN) mostrado em Configurações → Versões & Novidades | Acrescentar a versão nova no topo |
| `recados.json` | Avisos do administrador para todos (Inbox) | Sim — ver `recados-MODELO-OmniLifeONE.json` |
| `clima.json` | Reserva local da config do clima (a master vem do RootifyONE em `solverone-dados/clima.json`) | Sim — ver `clima-MODELO-OmniLifeONE.json` |
| `rotas.json` | Reserva local da config de deslocamento/rotas (a master vem do RootifyONE em `solverone-dados/rotas.json`) | Sim — ver `rotas-MODELO-OmniLifeONE.json` |
| `janela.js` | **Janela comum da plataforma** (`SolverJanela` 1.0.2, também `DGO.janela`), cópia do master do rootify-one (sha256 `7f38e4d9…`). Toda janela do app (formulários, confirmações, gaveta ☰, menus, SOS, tour, o PIN do cofre e as do módulo) passa por ele: `<dialog>` modal, página de trás parada, Esc/Voltar/toque fora/✕, "Descartar?", uma janela por vez. Carrega **primeiro** | Não: copiar do rootify-one quando mudar, sem alterar |
| `cofre.js` | **Cofre comum de chaves da plataforma** (`SolverCofre` 1.6.1, também `DGO.cofre`), cópia do master do rootify-one (sha256 `97ec41ae…`). Guarda as chaves de IA, do clima, do trânsito, o token do Telegram e a apikey do WhatsApp embaralhados (AES-GCM 256, PIN com PBKDF2 310 mil), iguais em todos os apps; regras do PIN (`proteger`) e digital. Carrega depois do `janela.js` e **antes** do `diretrizes.js` | Não: copiar do rootify-one quando mudar, sem alterar |
| `diretrizes.js` | **Módulo comum da plataforma** (1.13.1, global `DGO`), cópia do master do repositório rootify-one (sha256 `20ee5f6b…`). Aqui serve só para: 💬 feedback (`DGO.feedback`), trabalho demorado (`DGO.fundo`/`DGO.tarefa`), dados do aparelho (`DGO.compat`), interruptores + tela de manutenção (`DGO.recursos`) e a mudança automática das chaves antigas para o cofre (`cofre.fontes`). Carrega depois do `cofre.js` e antes do `recursos.js` e do `tarefas.js` | Não: copiar do rootify-one quando mudar, sem alterar |
| `diretrizes-config.js` | Configuração do módulo para o Omni: desliga tudo o que o app já tem (login, menu, idioma, anúncios, OCR, IA, avisos, PWA, varredura de textos e datas, faixa do topo, quadro do aparelho), declara onde o app guardava as chaves antes (`cofre.fontes`, ver "Chaves no cofre comum") e liga as regras do PIN (`cofre: { proteger: true }`) e liga o feedback com o Supabase da plataforma (endereço e chave **pública** `sb_publishable_…`, os mesmos do login; nunca a secret nem a service_role). `perguntaDiaria: false` | Sim, com cuidado |
| `recursos.js` | **Interruptores do RootifyONE** (cópia avulsa; o master fica no repositório rootify-one). Com o `diretrizes.js` na página, só repassa para o `DGO.recursos` (nada em dobro; a tela de manutenção é a do módulo). Lê `solverone-dados/recursos/global.json` e `recursos/omnilife-one.json`; elemento com `data-recurso="id"` some quando o recurso está desligado; no código, `SolverRecursos.ligado(id, padrão)` e `.valor(id, padrão)` | Não: copiar do rootify-one quando mudar |
| `recursos-do-app.json` | Lista do que este app **obedece** (recursos e comportamentos), no formato detalhado `{ id, nome{pt,en}, onde{pt,en} }` que o ⚡ Modo DEUS do RootifyONE mostra. Ao ligar um recurso novo no código, acrescente o id aqui e em `Rec` | Sim, a cada recurso novo |
| `manifest.webmanifest`, ícones | Instalar como app | Raramente |
| `regras-firestore-OmniLifeONE.txt` | Regras do Firebase de antes (o Firebase **não** será usado — decisão de 03/Out/2026). Fica como referência das regras que o SQL reproduz | Não (arquivo de referência) |
| `PLATAFORMA-DADOS.md` | Cópia fiel do contrato de dados da plataforma SolverONE (C1–C10) | Não: o contrato muda só por versão nova, combinada com o RootifyONE |
| `PLANO-SUPABASE-OmniLifeONE.md` | Plano da ida para a conta e o banco SolverONE (Supabase): tabela por parte do app, o que fica no aparelho, cifrado (C7), modo sem internet, pontos do contrato | Sim |
| `supabase/omnilife-one-v1.sql` | Tabelas `omni_*`, regras de acesso (RLS), funções e LGPD no banco da plataforma. Roda depois da base comum do RootifyONE (`sol_*`, com `sol_grupos.governanca`); confere a base antes de criar qualquer coisa | Só com revisão (C10); nunca rodar antes da revisão |
| `supabase/2026-10-23-grants-explicitos.sql` | Permissões explícitas por papel das `omni_*` (diretriz "Permissões explícitas no Supabase"): parte A só GRANT, igual ao banco lido em 22/Out/2026 (não muda nada no projeto); parte C opt-in do Supabase. Idempotente | Não: mudança de permissão vai num script novo datado |
| `supabase/2026-11-12-sol-giro-chaves.sql`, `supabase/2026-11-12-omni-giro-so-chefe.sql` | A troca da chave de segurança da família (2.27.0): o primeiro é da **plataforma** (`sol_giro_situacao`, `sol_descartar_chaves_antigas`) e vai pelo chat do MoneyTRIO; o segundo é do Omni (gatilho "só o chefe muda a chave, a versão só sobe, o registro e a troca não se apagam"). Os dois testados no PGlite (`teste/sql-giro.js`) | Não daqui: **o dono aplica** no Supabase (o da plataforma depois da revisão do MoneyTRIO) |
| `teste/sql-grants.js`, `teste/sql-grants-legado.json` | Verificador master do rootify-one (1.0.1, copiado igual): todo CREATE em `public` precisa de GRANT no mesmo arquivo; a lista de exceção guarda o `omnilife-one-v1.sql`, aplicado antes de 30/Out/2026. Roda no `teste/rodar.js` | O verificador, não (mudar no rootify-one e copiar); a lista, sim |
| `LEIA-ME-OmniLifeONE.html` | Passo a passo para o dono do app | Sim |
| `ARQUITETURA.md`, `CREDITOS.md` | Este briefing e as licenças de terceiros | Sim |
| `PENDENCIAS.md` | **Lista oficial e viva de pendências** (número, descrição, origem, situação) — combinado com o dono em 04/Out/2026. A cada entrega: atualizar a situação, acrescentar o que surgiu e dizer no resumo o que fechou | Sim, a cada entrega |
| `ajuda-botao.png`, `ajuda-icone.png`, `assistone-hd.png` | Arte do AssistONE. O botão flutuante usa `ajuda-botao.png` direto (arquivo canônico da plataforma, igual em todos os apps); os balões e o cartão em ⚙ usam a cópia pequena embutida `AONE_IMG` | Não trocar `ajuda-botao.png` por outra arte (é padrão da plataforma) |

## Nunca

- Nunca pôr chave de IA, token do Telegram, senha ou dado pessoal no repositório (é público).
  Chaves ficam só no navegador da pessoa, **no cofre comum** (`cofre.js`, `Keys`), nunca em texto aberto: nada de
  `S.prefs.keys`, `tgToken` nas preferências nem `investifyme.chaves.v1` (até a 2.17.0 era assim; a 2.18.0 muda sozinha).
- Nunca abrir janela do jeito antigo (`div` sobreposta), nem `alert()`, `confirm()` ou `prompt()` do navegador, nem `pushState` para
  janela: toda janela passa por `modal()` (ou por `SolverJanela.abrir`, no caso da gaveta, dos menus, do SOS e do tour). Proibido
  também `setTimeout`/`MutationObserver` para "consertar depois", `!important` por cima e cópia da função da janela no app.
- Nunca encaixar o painel da digital do cofre no app: ele já vem da tela de chaves do módulo (`DGO.ia.guia`, botão `cofre.tela`).
- Nunca reescrever o `index.html` inteiro: as mudanças são cirúrgicas.
- Nunca apagar caches de outros apps no `sw.js` (todos dividem o mesmo endereço): o nome do
  cache é `dgo-omnilife-vN` e o `activate` só apaga os que começam com `dgo-omnilife-`.
- Nunca usar chave de `localStorage` sem o prefixo `omnilife.` (colide com os outros apps). Exceção de propósito:
  `solverone.sessao.v1`, a sessão **comum** da conta SolverONE (um login para todos os apps), e a sessão do Contador
  (`ch_solverone_sessao`), que o `Conta` aproveita e mantém igual enquanto o Contador não usar a chave comum.
- Nunca apagar dado do navegador (stores `docs`/`files`, a cópia "só neste aparelho") sem antes **oferecer a cópia protegida e
  levar para a nuvem** (`Migrar.antesDeApagar()`, `Migrar.apagarAntiga()`) — regra do dono do projeto, 03/Out/2026. Sair da
  conta ou da família não apaga a cópia da nuvem do aparelho (saúde, documentos e arquivos só existem nela). Exceção da
  diretriz do cofre (2.15.0): a cópia **cifrada** do cofre da nuvem e a chave dele saem em "Desconectar este aparelho", conta
  encerrada/banida, aparelho desconectado e quando o `poll` vê que a pessoa foi tirada da família (`Cofre.apagarDoAparelho`; sair da família por conta própria, `Cloud.leave`, só sai da conta) — o cofre continua na nuvem; a fila do
  cofre tenta subir antes; o cofre antigo (senha mestra, só no aparelho) nunca é apagado por isso.

## Mapa do `index.html` (procure pelos nomes)

- `S` — estado global. `LS` — nomes das chaves do localStorage. `APP_VERSION` — versão.
- `tt(pt, en)` — todo texto nasce nas duas línguas. `fmtDate` — datas `24/Set/2026` / `Sep/24/2026`.
- `DB` — dados (drivers: `MemoryDriver` visitante, `LocalDriver` IndexedDB "docs" deste aparelho, `CloudDriver` nuvem). `DB.patch` para campos.
- `CloudDriver` (v2.14.0, Etapa 2b) — registros da família no Supabase (`omni_docs`, um registro = uma linha, `dados` = o registro
  sem o `id`; `vis` `familia` ↔ `publico`). A tela lê sempre a **cópia do aparelho** (IndexedDB v2, store `nuvem`, chave
  `<grupo>|<coleção>|<id>` → `{ doc, base, vis, versao }`); cada mudança entra na **fila** (store `fila`) e sobe quando dá
  (`flush`: PATCH com `versao=eq.` — trava otimista —, POST para novo, `omni_mudar_campos` para `DB.patch`, apagar = `apagado_em`).
  Receber: `pull` a cada consulta, só o que mudou desde o cursor (`kv cursor|<grupo>`, folga de 2 min). **Conflito**: `merge3(base,
  deste aparelho, do outro)` junta campo a campo, listas somam; só o MESMO campo mudado diferente nos dois vira pergunta
  (`Sync.perguntar`, uma janela por vez; "Depois" pergunta de novo em 2 min). Registro novo recusado pelo banco fica no aparelho
  marcado `recusado` (aparece em `Sync.view`, "Tentar de novo"). Dois `DB.patch` na fila viram um, e o campo novo apaga os de
  dentro dele que já estavam lá (`enfileirar`: "pet.foto" depois de "pet.foto.pendente"). `aceitar` de uma linha com `apagado_em`
  (o `omni_mudar_campos` muda até linha apagada) tira o registro daqui, como o `receber`, em vez de trazê-lo de volta como
  fantasma. **Só no aparelho** (`NUVEM_LOCAL`): `health`, `docs`, `files`
  (ficam na store `nuvem`, nunca na fila); `NUVEM_SO_AQUI.people = ["pinHash"]` não sobe. `comsg` vai para
  `omni_combinados` (só inclusão). Arquivos continuam na store `files`.
  **Cofre (v2.15.0)**: `putCofre` cifra com `Cofre.selar` e a linha vai com `dados = null` e `dados_cifrado` (o banco exige isso
  para `vault`); a cópia do aparelho guarda só `{ cif, baseCif, vis, versao }` — o registro aberto existe só em `DB.col("vault")`,
  preenchido por `abrirCofre()` ao destrancar e limpo por `fecharCofre()` ao trancar (fica só o envelope `_em`, que não precisa
  da chave). Conflito no cofre (`enviarCofre`): sem a chave não dá para juntar campo a campo → ficam **as duas versões** (a deste
  aparelho vira item novo). Registros do cofre antigo (senha mestra, até a 2.14.x: `rec.doc` sem `cif`, inclusive `_meta`)
  nunca sobem: `Cofre.antigo()` os mantém no aparelho até "Trazer o cofre antigo". `refazer()` não apaga esses registros.
- `Sync` — selo do topo (`offBadge()`: "📴 sem internet", "⏳ N itens aguardando sincronia", "⚠️ não aceitos" e, desde a 2.15.1,
  "✓ Tudo sincronizado" por 5 s quando a fila esvazia depois de ficar sem internet ou esperando mais de 3 s; toque abre
  `Sync.view()`), aviso de "salvo neste aparelho" ao salvar sem internet, e a janela de conflito.
- `Cloud` (v2.14.0) — família na nuvem pelas funções `omni_*` (quem garante as regras é o banco). `resolve()` depois de entrar
  na conta: convite pendente → `requestJoin` (`omni_ver_convite` + `omni_pedir_entrada`) → tela `waiting` (código de 4 números de
  `omni_pedidos_verificacao`, consulta a cada 5 s); senão a última família (`LS.lastFam`) ou a primeira de `sol_meus_grupos`
  (governança `omnilife-one`); pedido pendente → `waiting`; senão `semFamilia()` → tela `create` com as escolhas (v2.14.1):
  criar família nova, **levar a família deste aparelho** (`sf.levar`) ou **descartar os dados deste aparelho** (`sf.descartar`),
  as duas últimas só com o PIN/digital de um responsável do aparelho (`Migrar.autorizarLocal`), e "Usar só neste aparelho".
  Sem internet e sem família na nuvem: abre a família do aparelho (`S.semNuvem`, sem oferta de levar).
  **Prioridade (v2.14.1):** com a conta conectada, o `boot` vai para a nuvem antes dos perfis locais (modo `local` antigo
  incluído); só fica no aparelho quem escolheu "Usar só neste aparelho" / "PIN (só neste aparelho)" (`omnilife.soNesteAparelho`).
  Entrar na conta de dentro do app (`conta.entrar`) também leva para a nuvem; o link de nova senha não muda a escolha. `load()` monta `S.family` no formato de sempre (`members[uid] = { role, personId, name, email, since, emergencyVault }`,
  `policy`) e guarda cópia em `kv familia|<grupo>` para abrir **sem internet** (`enter()` usa a cópia se o banco não responde).
  `poll()` a cada 20 s (e ao voltar para o app ou a internet): família, `CloudDriver.sync()`, governança, aparelhos e, para
  chefe/responsável, convites, pedidos e histórico; depois `Gov.tick()`. Convite: link `#convite=` + `{ code, n, by }`, guardado
  em `omnilife.convitePendente` (2 dias) para sobreviver à ida ao Google. Aprovação: `omni_aprovar_entrada` com o código que a
  pessoa diz (o banco confere; 3 erros recusam). Papéis, remover, sair, regras e nome da família: `omni_mudar_papel`,
  `omni_remover_membro`, `omni_sair`, `omni_salvar_regras`. `Cloud.audit()` só para o que não passa pelas funções (ex.: aparelho
  desconectado, código de emergência). Papel do banco `chefe` = `admin` no app.
- `Migrar` (v2.14.0) — "Levar a família para a nuvem" (⚙ → Nuvem, oferta depois de entrar na conta, `create` com a caixa
  marcada): prévia (o que vai e o que fica) → cópia protegida oferecida (`bk.exportSafe`, ou "já tenho" com confirmação) →
  `omni_criar_familia` com o **mesmo id da pessoa do aparelho** (ou a família que a conta já tem) → `Restore.aplicar(…, { migrar:
  true })` (reconhece pelo nome, nunca "Substituir") → `omnilife.migrado`. A cópia antiga (store `docs`) fica até `apagarAntiga()`
  (só depois de levar, fila vazia e cópia oferecida). `antesDeApagar()` roda antes de "Apagar tudo": oferece levar e a cópia.
  v2.14.1: `resumo()` (o que há no aparelho, para a tela de escolhas), `autorizarLocal(why, destrutivo)` (só aparecem
  responsáveis com PIN ou digital e `conferir()` nunca aceita só "Confirmar" — v2.14.2; ninguém com PIN: descartar pede para
  digitar o nome da família; quem acabou de entrar no próprio perfil não repete o PIN só para LEVAR — `_autorizado`), `descartar()` (cópia protegida
  oferecida → confirmação → apaga a store `docs` e só os arquivos dessa família). Na família da nuvem, ⚙ → Nuvem mostra a
  cópia antiga mesmo se nunca levada (`_temLocal`): levar para esta família ou apagar (oferece levar e a cópia antes).
- `Cofre` (v2.15.0, Etapa 2c) — **cofre ponta a ponta** (diretriz "Cofre de senhas e entrada sem internet"). Peças:
  - **Chave do cofre da família (CF)**: 32 bytes aleatórios (`kv` = a versão, `fk` = id da chave; desde a 2.27.0 pode haver mais de
    uma: a atual fecha, as de antes só abrem — o chaveiro). Cifra cada registro do cofre
    (`selar`/`abrir`, AES-GCM 256). Vai para cada chefe/responsável embrulhada com a chave pública dele (`embrulhar`, RSA-OAEP 3072
    SHA-256, `sol_guardar_chave_grupo`); quem tem o cofre aberto libera para quem falta (`distribuir`, ao abrir e no `poll`, no
    máximo a cada 2 min; registro sem segredo em `settings/cofre` = `{ fk, kv, membros: { uid: { kid, seq, fk } } }`; antes de
    decidir, `distribuir` puxa o mais novo, e conflito nesse registro **nunca vira pergunta**; se faltar alguém, a próxima liberação
    embrulha de novo). **Desde a 2.27.0 a CF pode ser trocada** pelo chefe ("Trocar a chave de segurança da família", ver "Troca da
    chave de segurança da família (2.27.0)"): o registro ganhou `giradoEm`, `giradoPor` e `descarte`, só anda para a frente (o
    `CloudDriver.enviar` fica com o do BANCO quando o da fila tem `kv` menor ou a mesma `kv` com outra `fk`; nunca sobe apagado) e
    o `_distribuir` decide pelo registro do banco. Mínimo
    privilégio: só chefe e responsável recebem a CF (D-E1 da 2.27.0 confirma); o contato de emergência abre pelo envelope `_em`.
  - **Par da pessoa**: `novoPar()`; pública em `sol_publicar_minha_chave` (JWK com `kid`); privada (pkcs8) cifrada com o
    **código de recuperação do cofre** (`Restore.code()`, PBKDF2-SHA256 600 mil) em `omni_chave_privada`. O código aparece uma
    vez (`mostrarCodigo`, "Anotei"); `novoCodigo()` troca.
  - **Chave do aparelho (CA)**: 32 bytes aleatórios, embrulhada pelo PIN (PBKDF2-SHA256 600 mil, sal aleatório) e, se der, pela
    digital (`prfNovo`/`prfAvaliar`: WebAuthn com PRF + HKDF). Guarda cifradas a privada (`sk`) e a CF de cada família
    (`fam[gid]`). Tudo em IndexedDB `kv`, chave `cofre|<conta>`: `{ pin, prf, sk, fam, erros, ate, bloqueado }`. Abertas (CA, CF)
    só na memória (`Cofre.vf`, `S.vaultKey`) enquanto destrancado; `trancar()` zera os bytes.
  - **Destrancar** (`destrancarPin`/`destrancarDigital`): a conferência é local (o PIN certo é o que decifra a CA), funciona sem
    internet. Erros: `ESPERAS` (4º erro 30 s … 9º 1 h); no 10º `bloqueado` — só sai com a conta (entrar de novo:
    `Conta.aoAbrir("login")` chama `zerarErros`) ou com o código (`esqueci`, precisa de internet).
  - **Preparar o aparelho** (`comecar`): família sem cofre → cria a CF; conta que já tem chave → pede o código (ou cria par novo e
    espera outro responsável liberar); aparelho novo da mesma pessoa → código + PIN.
  - **Apagar do aparelho** (`apagarDoAparelho`): conta encerrada (`Conta.encerrada`), banida (renovação da sessão falha com
    `user_banned`), aparelho desconectado por um chefe (`Devices.setList`), saiu da família (`poll`) e "Desconectar este
    aparelho" (`desconectarAparelho`: marca o aparelho `desconectado`, apaga e sai). Perdeu o papel de responsável:
    `esquecerFamilia`. `Conta.revalidar()` (ao abrir e no evento `online`) força a renovação da sessão e consulta
    `minha_conta_encerrada`.
  - **Emergência**: `envelope()` cifra a CF com o código de emergência (PBKDF2 600 mil) em `vault/_em` (sobe como `{em:1,d}`, sem a
    camada da CF); `abrirComCodigo()` para o contato depois de liberado. `Gov.makeEnvelope`/`openWithCode` usam isso.
  - **Cofre antigo** (`legado`, `temLegado`, `trazerLegado`): pede a senha mestra antiga, recifra itens e anexos (inclusive anexos
    cifrados de documentos) com a CF e sobe; `_meta` nunca sobe.
  - `view()`/`atualizar()` desenham Casa → Cofre por estado (`novo`, `trancado` com espera/bloqueio, `aberto`); visitante não usa
    (`canVault()`); contato de emergência só lê (`vault.ver`).
  - **Aparelho novo (2.15.3, teste de 05/Out/2026):** no estado `novo`, com internet, `atualizar()` confere uma vez por conta
    (`_nb`, zerado em `publicarPar`) se a pessoa já tem chave guardada (`minhasNoBanco`) → `status.jaTem`. Com `jaTem`, a tela e o
    passo 4 do `GuiaCofre` avisam **antes** do botão que vai precisar do papel com o código (e o que fazer sem ele); sem `jaTem`,
    a tela lista os passos (anotar o código, PIN, outro responsável libera).
- **Conta, PIN e aparelhos (2.26.0)** — o protocolo da plataforma, **igual ao MoneyTRIO** (`nuvem.js` 1.14.0, MoneyTRIO 3.66):
  aparelho novo aprovado por outro sem papel, **um PIN por pessoa** (o mesmo em todos os aparelhos e apps), o estado real lido
  antes de qualquer tela e "Sair" de verdade. O banco (funções `sol_*`) é da plataforma e já está aplicado: o Omni não tem tabela
  própria para isso. Blocos, na ordem do arquivo (antes de `const COFRE_ITER`, depois das ações `cofre.*` e do `GuiaCofre`):
  - `SolProto` — contas puras, sem rede e sem tela: ECDH P-256, compromisso `C = b64u(SHA-256("sol-ap-v2|c|x.y|nB"))`, os 6
    números (`sas`), HKDF com `"sol-ap-v2|" + id + "|" + uid de quem pede + "|" + nA + "|" + nB`, AES-GCM com AAD = id do pedido
    (`fechar`/`abrirResp`), as cargas `{v:2, tipo:"pessoal", sk}` e `{v:2, tipo:"familia", gid, kv, fk, cf}` (`lerCarga` ignora o
    `mk` do MoneyTRIO) e o verificador do PIN da conta (`sol-pin-v1`, PBKDF2-SHA256 600 mil). **Byte a byte igual ao MoneyTRIO**:
    mudar aqui sem mudar lá quebra a aprovação entre os apps (`teste/sol-proto-omni.js` confere os vetores fixos de
    `teste/vetores-sol-v2.json`).
  - `Sol` — a rede das funções `sol_*` (`pedido*`, `ap*`, `pk*`, `pin*`, por `Conta.rpc`). Sabe se o SQL existe (`ligadoAp`,
    `ligadoPin`: 404/PGRST202 = desligado, e o app volta ao jeito da 2.25) e põe prazo no próprio pedido (`Sol.PRAZO`: 4 s, e 8 s no
    `sol_pin_conferir`) nas chamadas que seguram abrir as Senhas da casa — com a rede pendurada o navegador acha que está online.
  - `Pin` — o PIN da conta (estado, sem tela): `info`, `duk` (a tabela de decisão: o PIN da conta conferido no banco ou, sem ele,
    o PIN deste aparelho; **nunca** converte o PIN antigo em PIN da conta em silêncio), `migrar` ("Agora o PIN é um só"), `criar`,
    `trocar`, `naoLembro` (só para o aparelho aprovado por outro aparelho da pessoa, `como = "aparelho"`), os erros locais e da
    conta (`explicar`, `tentativas`).
  - `Jornada` — lê o estado real (conta, papel, cadeado deste aparelho, aparelhos da conta em todos os apps, pública, kit, digital
    em todos os aparelhos, PIN da conta) antes de desenhar: `ler()` → `caso` (`semConta`, `naoGuardiao`, `aberto`, `trancado`,
    `semRede`, `contaNova`, `outroApp`, `primeiraVez`) e os sinais `criarPin`, `migrar`, `pinTrocado`, `familiaPode`… Toda tela de
    conta e do cadeado decide por ela; `limpar()` depois de mudar algo.
  - `Aparelhos` — o protocolo. Quem pede: `pedir`, `esperar`, `receber`, `retomar` (o pedido em andamento sobrevive ao recarregar,
    no IndexedDB `pedido|<conta>`). Quem aprova: `olharPedidos` (faixa), `desafiar` (fixa a pública e o compromisso de quem pede
    ANTES do desafio), `aprovar` (os 6 números + o PIN deste aparelho ou a digital), `carga` (pessoal = a chave pessoal; família =
    a CF, e só para chefe ou responsável — `podeFamilia`), `responder`, `recusar`. A lista: `lista`, `tirarGrupo`, `tirado` (o
    aparelho tirado por outro sai sozinho). A digital em todos os aparelhos (passkey com PRF, HKDF `sol-passkey-v2`):
    `criarPasskey`/`entrarPasskey`/`tirarPasskeys`, só em solverone.com.br (`pkAqui`).
  - `Kit` — o código de emergência antigo (a cópia da chave pessoal em `omni_chave_privada`), em ⚙ → Segurança e aparelhos →
    Avançado: `ligar`/`desligar`. Desligar apaga a linha e precisa de `supabase/2026-11-11-omni-chave-privada-delete.sql` (o dono
    aplica); sem ele: "Ainda não dá para desligar: falta um ajuste no servidor."
  - `TelaConta` — as telas: "Primeira vez neste {aparelho}" / "Abrir sem o PIN" (`primeiraVez`), a espera com os 6 números
    (`esperando`), criar/digitar/trocar o PIN (`formPin`, `criarPin` — fora do "logo depois de abrir" pede o PIN de agora ou a
    digital —, `digitePin`, `trocarPin`), quem aprova (`faixa`, `aprovar`), a página **🔐 Segurança e aparelhos** (`pagina`; rota
    `#/settings/conta`, `SetViews.conta()`), "Começar do zero" (`comecarDoZero`: só em Avançado e só sem outro caminho, D4) e
    "Bloquear agora". Ações `ACT["conta.*"]` (o prefixo `conta.` não some com os interruptores do `Rec`).
  - `Saida` — a rotina única de sair (`signOut()` só chama `Saida.sair()`): pergunta se há mudança na fila ou trabalho no `Fundo`,
    tranca as Senhas da casa e as chaves de IA, sai da conta neste aparelho (no máximo 5 s com a rede pendurada) e recarrega com
    `location.replace` (o Voltar não mostra dados: `pageshow` com `persisted` recarrega). Com `apagar` (aparelho tirado da conta,
    conta encerrada ou banida) apaga também o cadeado deste aparelho (`cofre|`, `chaveAp|`, `pedido|`, `digitalPerguntada|`).
    **Nunca** toca `nuvem`, `fila`, `files` nem `docs`. "Sair da conta" na trava da digital desliga a trava do app (como na 2.25).
  - **O cadeado deste aparelho** (`L`, IndexedDB `kv`, chave `cofre|<conta>`) ganhou `ap` (o lugar na lista `sol_aparelhos`), `como`
    (`primeiro`, `aparelho`, `familia`, `kit`, `passkey`), `srv` (a chave do aparelho fechada também pelo segredo do PIN da conta),
    `pinVersao` e `avisosAte`. Só `Cofre.montar` troca o `L` inteiro, no fim, por `Cofre.mudarLocal` (trava `navigator.locks` +
    fila); `Cofre.criarConta(pin, zero)` faz a conta nova (o par novo só ali, nunca com a pública já na conta, fora o D4).
  - **Nunca (2.26.0):** transformar em silêncio o PIN antigo do aparelho em PIN da conta; gerar par novo quando a conta já tem a
    pública (só o "Começar do zero"); apagar `omni_chave_privada` sem a pessoa pedir ("Desligar" o kit); apagar o IndexedDB `nuvem`
    no Sair; mudar o `SolProto` sem mudar junto o MoneyTRIO; mandar a CF para quem não é chefe nem responsável.
  - Testes (todos no banco de mentira `teste/mock-sol.js`, um aparelho = um contexto do navegador): `sol-proto-omni.js`,
    `aparelhos-omni.js`, `pin-conta-omni.js`, `pin-conta-bordas-omni.js`, `sair-omni.js`, `seguranca-aparelhos-omni.js`,
    `kit-passkey-omni.js`, `revisao-final-omni.js` e o cruzado `aparelhos-cruzado-omni.js` (abre o MoneyTRIO de verdade quando
    `MONEYTRIO=<pasta do investify-me>`; sem ela, "PULADO").
- **Troca da chave de segurança da família (2.27.0)** — a Parte E do pedido do MoneyTRIO (v3): "🔄 Trocar a chave de segurança
  da família" troca a CF por uma nova, **só quando um chefe toca e confirma** (abrir o app 2.27.0 não muda nada guardado: o G0 do
  `teste/giro-omni.js` confere byte a byte). Recifra as linhas VIVAS das Senhas da casa (as duas camadas: o selo e a parte interna
  `enc`), os anexos deste aparelho e o código de emergência (`_em`). As linhas já apagadas ficam como estão (D-E6: "não mexa no que
  já está salvo"). Tudo no objeto **`Giro`** (entre o `Cofre` e o `Aparelhos`) e em mudanças no `Cofre`, `CloudDriver`, `Files`,
  `Aparelhos`, `SaudeMT`, `Trava`, `Saida`, `TelaConta`, `Gov`, `AUDIT_TXT`/`GOV_SENS` e `Cloud.poll`.
  - **O chaveiro** (`Cofre.outras = [{kv, fk, vf}]`, `Cofre.chaveDe(fk)`): a atual (`Cofre.vf/kv/fk`) é a **única que fecha**
    (`selar`, `Files.save`, `envelope`, `SaudeMT`); as de antes só ABREM. Cada linha diz em claro com que `fk` foi fechada
    (`{c:1, kv, fk, iv, ct}`): `abrir` escolhe a chave por ela e, se abriu com uma de antes, passa a parte interna para a atual só
    na memória. `usarChave(raw, kv, fk, outras)` troca tudo junto (sem `await` no meio); `trancar` zera também as `outras`. No
    aparelho, `L.fam[gid]` ganhou `velhas` (as de antes, fechadas pela chave do aparelho, **até 2** — `Cofre.depoisDe`) e `prox` (a
    nova, só no aparelho que troca, durante a troca). Anexos: `enc.fk` (com que chave) e `enc.antes` (no meio de recifrar); o
    `Files.blob` tenta a do `enc.fk`, a atual e as de antes.
  - **O registro** `settings/cofre` (`omni_docs`, em claro, restrito): `{vis, fk, kv, membros:{uid:{kid, seq, fk}}, giradoEm,
    giradoPor, descarte:{ate, em, fk}}`. É o **único interruptor**: um aparelho só adota a CF cujo `fk` é o do registro e com `kv`
    igual ou maior que a dele (`Cofre.ehAtual`; uma `kv` menor nunca, nem que o registro mande — C4 → cartão "Algo nas Senhas da
    casa não confere"). O `descarte` vale só se `descarte.fk === fk` (uma troca nova traz o botão de volta) e sem `descarte.velha`
    (revisão S3: um aparelho com o app de antes entregou a chave antiga depois do descarte — abaixo, em "Nunca devolver").
  - **A troca** `settings/giro` (restrito; `Giro.dados` ignora outra coisa — C9): `{v:1, estado, por, ap, nav, apNome, de:{kv,fk},
    para:{kv,fk}, inicio, batida, total, feitos, voltas, estranhas, em, envelopes:{uid chefe: a nova embrulhada}, entregues:{uid:{kid,
    seq}}, fim, erro}`. Gravada **só por REST com `versao=eq.`** (CAS, `Giro.gravarDoc`/`Giro.gravar`; sem linha = POST, e o banco
    recusa o segundo), nunca pela fila (o `CloudDriver.enviar` recusa e recarrega). Estados: `preparado` → `entregando` →
    `recifrando` → `emergencia` → `virando` → `conferindo` → `feito` (ou `desistiu`). `Giro.emCurso()` = fora de feito/desistiu
    (um `preparado` sem notícia há mais de 24 h vale como desistido — C16); `Giro.vivo()` = em curso e com notícia há menos de
    `PARADO_MS` (3 min). `nav` = o número deste navegador (aprovado de novo no meio, ele continua sendo o mesmo — C8).
  - **As fases** (`Giro._executar`, na ordem do C5): **F0** `Giro.pode()` — só chefe (D-E8: qualquer chefe), internet, Senhas
    abertas com a chave pessoal neste aparelho, nada do cofre nem `settings|cofre` na fila, o registro do banco = o deste aparelho,
    a `sol_giro_situacao` existe (sem ela, botão desligado: "Ainda não dá: falta uma atualização do SolverONE.", C6/D-E9, nenhum
    caminho manual), o MoneyTRIO migrado (`money_migrado`, `money_cf === 0`), nenhuma linha viva de outra chave (`vault_fora`); a
    lista dos itens que já não abrem (`naoAbrem`, C11) e os avisos da Saúde esperando (`ponte`) vão para a tela. **F1**
    `preparar` — `kvN` = a maior conhecida + 1, `fkN` nova, a nova embrulhada para cada CHEFE (`envelopes`); POST da troca; depois
    `guardarProx` (`L.fam[gid].prox`); `Cloud.audit("cofre.giro")`. **F4 antes das linhas** `entregar` — a nova embrulhada para
    cada chefe e responsável com chave pública (D-E1), `seq` = a maior + 1, anotada em `entregues`: daqui em diante a família já tem
    a nova e "Desistir" não vale mais. **F2** `recifrar` — as vivas (menos `_em`), cada uma por `trocarLinha` (CAS próprio:
    `versao=eq.` + `apagado_em=is.null`, só o texto, nunca pela fila; já na nova = pula; a parte interna que não abre = só o selo,
    `semInterna`; o que não abre = "estranha", fica), batida a cada 10 linhas; depois `Cofre.recifrarAnexos` (três gravações: nada
    se perde se o app fechar no meio). **F3** `emergencia` (o `_em`, abaixo). **F5** `virar` — o registro com a nova (CAS), depois
    `Cofre.adotar` e `usarChave(nova, …, [as de antes])`. **F6** `conferirAte`/`conferir` — relido do banco: toda viva na nova (as
    duas camadas) e nenhuma abrindo com a de antes (até 3 voltas de recifrar o que um aparelho atrasado gravou no meio), o `_em`,
    o registro, a minha embrulhada, `falta_entregar === 0` e os anexos daqui. **F7** `terminar` (a ponte, abaixo) → `feito`,
    `envelopes:{}`, `Cloud.audit("cofre.girado")`.
  - **No Fundo** (`Giro.iniciar` → `DGO.fundo`, tipo `chave-familia`, "Deixando a família mais segura"): pílula com o andamento,
    tela acesa (Wake Lock), aviso antes de fechar, `podeCancelar: false`, resultado onde a pessoa estiver (`mostrarFim`). Uma aba só
    (Web Lock `omnilife-giro|<gid>`: "Já está trocando em outra janela deste aparelho."). **Pausa** (D-E2): as Senhas fechadas (5 min
    sem toque NÃO trancam com a troca rodando — `Trava.ocioso`; app escondido 30 s, `pagehide`, "Bloquear agora" e Sair trancam) →
    `Giro.parar` para no fim da linha com "Parou porque as Senhas fecharam…"; ao abrir pelo PIN, o cartão "Continuar" (`Giro.cartao`,
    nas Senhas da casa e no Avançado; não depende da pílula). Sem internet: "Esperando a internet…" e segue sozinha. **Prazo**:
    cada chamada da troca tem `Giro.PRAZO_MS` (30 s) — rede pendurada vira "Parou sem internet…" com "Tentar de novo" (tudo é CAS e
    idempotente). **Assumir** (`Giro.assumir`): outro aparelho do MESMO chefe, com a chave pessoal, depois de `PARADO_MS` sem
    notícia e de duas leituras iguais com 20 s entre elas; continua com a MESMA nova (do `prox`, do envelope ou de
    `sol_minha_chave_grupo`, onde ela já está desde o F4 — C5). Quem perdeu a vez guarda a nova dele em `velhas` (C1). **Outro chefe**
    (revisão S2, D-E8): a troca de OUTRO chefe que já passou do "preparado" e está sem notícia há mais de `Giro.OUTRO_MS` (1 h,
    `Giro.deOutroParada`) também pode ser continuada por qualquer chefe, num aparelho que entrou pela conta (cartão "Outro chefe da
    família começou a troca… você (também chefe) pode continuar neste aparelho", no lugar do aviso), com a mesma nova (envelope ou
    `sol_minha_chave_grupo`); no "preparado" vale o C16 (se desfaz sozinha). **"Continuar" só anda para a frente** (revisão S1, C4):
    o `retomar` exige `de` = o registro do banco e `para.kv` maior que a dele (ou o registro já em `para`); senão "Algo nas Senhas
    da casa não confere" e nada muda. O `virar` também nunca baixa a `kv` do registro.
  - **O `_em`** (D-E4): com o código de agora (digitado na confirmação ou no cartão "Continuar", conferido antes por
    `Cofre.conferirCodigo` — errado não segue), `Cofre.envelopeCom` fecha a nova com o MESMO código ("refeito": o contato não
    precisa de nada); sem ele, o `_em` fica apagado e sem conteúdo ("invalidado", `Cloud.audit("emergencia.invalidada")`) e o fim (e
    o `Cofre.view`) mostram "🆘 Falta um passo" com "Fazer o código novo". O código só vive na memória e sai do `op` logo depois do
    F3 (`esquecerCodigo`, C16) — e também quando a troca para por um motivo que "Tentar de novo" não resolve (`Giro.NAO_VOLTA`:
    trocando em outro aparelho, falta a atualização do SolverONE, não é chefe…; revisão S4). `Gov.openWithCode` sem `_em`: "Ainda não
    há um código de emergência que valha…".
  - **A ponte Saúde → MoneyTRIO** (C10/D-E10): durante a troca (e com a chave daqui atrasada) o `SaudeMT.enviar` não manda (fica
    pendente). No F7, na ordem: anota o pendente → `Giro.marcarPonte(nova)` marca como lidas as `saude-resumo` DO OMNI que não estão
    na nova (achadas por REST em `sol_ponte`, `Giro.ponteNaoLidas`: a caixa do banco esconderia as de quem desligou a ponte) →
    `feito` → reenvia o resumo inteiro com a nova. Marcar antes do "feito" é o que impede o descarte de travar para sempre. A Saúde é
    de cada aparelho (não sobe) e o reenvio leva só a do aparelho que trocou: cada outro aparelho, ao adotar a nova, manda o resumo
    DELE de novo (`SaudeMT.depoisDaTroca`, só se tem algo da Saúde — revisão D3).
  - **"🧹 Terminar a troca"** (item d, D-E7: botão separado, no fim e no Avançado; `Giro.descartar`): `Giro.faltaDescartar` diz o que
    falta (para leigo) antes de confirmar; "Entendi", TROCAR e o PIN; `sol_descartar_chaves_antigas(p_grupo, p_ate_versao = maior
    − 1)`; `descartar:ponte` → marca de novo e tenta uma vez (C10); `descartar:giro` com a troca "feito" no banco → regrava a troca
    (CAS) e tenta uma vez (C9); depois `anotarDescarte` (`descarte {ate, em, fk}`, CAS) e `Cloud.audit("cofre.descartado")`. Itens
    que não abrem impedem: "Apagar os itens que não abrem" (só com o PIN; nunca uma linha de chave desconhecida).
    **Soltar as de antes** (`Giro.soltarVelhas`, na abertura pelo PIN/digital e logo depois do descarte): só com o descarte desta
    chave no registro DO BANCO e quando nada daqui precisa dela (nenhuma linha na fila ou no banco local, nenhum anexo — um anexo
    ainda nela vai para a nova pelo `Giro.arrumarAparelho` e solta na próxima abertura).
  - **Perceber a chave nova** (cada aparelho): `Cofre.chaveNova` (o registro do BANCO, pedido já no começo do abrir —
    `olharRegistro` —, com 300 ms de folga: numa rede lenta abre com a que tem e adota quando ele chega), `Cofre.adotar` (a de antes
    vai para `velhas`, o `prox` de outra troca fica), `Cofre.comChaveDoAparelho` (ao abrir) e `Cofre.conferirAoVivo` (no
    `Cloud.poll`, sem PIN, aviso "🔐 As Senhas da casa foram atualizadas neste …"). Sem a chave pessoal (aprovado pela família):
    `Cofre.desatualizado = "semChave"` → cartão "precisa ser aprovado de novo" com o botão; reaprovado, o `montar` leva as de antes e
    o `prox` (`levarVelha`, C8). Depois de adotar, `Giro.arrumarAparelho` passa os anexos deste aparelho para a nova (no Fundo).
    **Troca de outro aparelho pela metade** (revisão D2): depois do "preparado" a nova já está em `sol_minha_chave_grupo` para cada
    chefe e responsável (C5); `Giro.abrirNova` (no `Cloud.poll` e ao abrir) a põe no chaveiro só para ABRIR — o que a troca já passou
    para ela continua aparecendo, também com a troca parada (só se ela sai da chave daqui e sobe a versão; nada fechado com ela,
    nada gravado). Um aparelho aprovado pela família (sem a chave pessoal) continua sem ver o que já foi trocado.
  - **O vigia** (`Giro.vigiar`, no `Cloud.poll`): as linhas que um aparelho atrasado gravou com uma chave de antes sobem para a
    atual (por `trocarLinha`, CAS). **Nunca** com a troca em curso nem rodando, e só se a chave daqui é a do registro do banco (C3).
  - **Nunca devolver uma chave velha** (as guardas): `Cofre._distribuir` (decide pelo registro DO BANCO, confere de novo antes de
    cada `sol_guardar_chave_grupo` e do `DB.put`, nada durante a troca, só chefe e responsável); `CloudDriver.enviar` (o registro da
    fila só anda para a frente; `settings/giro` nunca pela fila; `settings/cofre|giro` não se apagam pela fila); `Aparelhos.carga`
    "família" (`podeFamilia`; troca em curso → "Espere a troca de segurança terminar…"; chave que não é a do registro do banco → "Este
    aparelho ainda está com a versão antiga…"; sem resposta → não entrega); `Aparelhos.receber` (carga com chave velha não monta:
    "O aparelho que aprovou estava com a versão antiga…"); `Cofre.podeMudar` + `selar` (troca viva ou chave daqui atrasada → nada se
    fecha; `editVault`, `Cofre.envelope`, `trazerLegado`, `Cars.edit` ao ABRIR — C14); o **reseal** no envio
    (`CloudDriver.bancoDoEnvio` + `cadeadoDoBanco`: o que está na fila fechado com a de antes é fechado de novo com a do registro do
    banco antes de subir, ou espera; o `_em` velho nunca sobe; o conflito "só de cadeado" não duplica — `Cofre.mesmoConteudo`); um
    item cuja linha nova não abre sai da tela (C14). A cópia protegida não leva nem traz o registro e a troca (`Restore.daChave`, C12).
    **Restaurar uma cópia de antes da troca** (revisões D1 e D4): o arquivo de um anexo só entra se a ficha daqui é a da cópia (o
    mesmo `iv`) — a troca fecha os anexos daqui de novo e o arquivo de antes, por cima, não abriria mais; e, na nuvem com as Senhas
    abertas, um item das Senhas da casa (ou o `_em`) trancado por um cadeado que não é o de agora não volta (não fica preso só no
    aparelho) e o aviso diz quantos não voltaram (a cópia de um cofre de antes da 2.15.0, com `_meta`, continua como antes). Os
    textos dizem que as cópias de antes deixam de trazer as senhas e os anexos protegidos logo que a troca acontece.
    **Um aparelho com o app de antes** (2.26, que não acompanha a troca: uma aba antiga aberta) depois de "Terminar a troca" entrega
    a chave antiga de novo a todos os chefes e responsáveis (inclusive a quem entrou depois) e marca o registro com ela — o app de
    antes não se corrige daqui. O `_distribuir` do primeiro aparelho atualizado que libera percebe esse rastro (revisão S3): entrega
    a de agora de novo, anota `descarte.velha` (o "Terminar a troca" volta, com o porquê, para apagar o que foi entregue) e avisa os
    chefes e responsáveis (`Cloud.audit("cofre.velha")`, no `GOV_SENS`). A caixa do roteiro e o texto do "Terminar a troca" pedem os
    aparelhos de TODOS os chefes e responsáveis atualizados.
  - **Os dois SQL** (nenhum é aplicado pelo app nem por quem constrói): `supabase/2026-11-12-sol-giro-chaves.sql` — **da plataforma,
    vai pelo chat do MoneyTRIO** e o dono aplica no Supabase: `sol_giro_situacao(p_grupo)` (só números e sim/não: linhas vivas fora
    da chave, ponte, MoneyTRIO migrado, quem falta receber, a troca conferida) e `sol_descartar_chaves_antigas(p_grupo,
    p_ate_versao)` (só chefe; só com a troca "feito" e conferida, gravada por um chefe, restrita; protege a versão em uso de CADA
    pessoa; erros `descartar:<motivo>`). `supabase/2026-11-12-omni-giro-so-chefe.sql` (D-E3, **o dono aplica**; o app funciona com
    e sem ele): gatilho em `omni_docs` — só o chefe muda `fk`/`kv` do `settings/cofre`, a `kv` só sobe, só o chefe grava a troca, e
    os dois não se apagam pelo app. Os dois com GRANT no mesmo arquivo (`teste/sql-grants.js`) e testados de verdade no PGlite.
  - **A ordem** (D-E11): Omni 2.27.0 aberto em todos os aparelhos → o MoneyTRIO conclui a preparação dos "dois cofres" → trocar →
    abrir os outros aparelhos (os de todos os chefes e responsáveis) e o MoneyTRIO (pelo PIN, com internet) → "Terminar a troca" →
    só então a pessoa nova. O app impõe a
    parte do MoneyTRIO (o botão não abre a confirmação sem a migração); o resto é a caixa do roteiro e o texto do "Terminar a troca".
  - **Nunca (2.27.0):** trocar a chave sem o chefe tocar e confirmar (TROCAR + PIN); mexer em linha já apagada; gravar a troca ou
    uma linha trocada pela fila (sempre CAS por REST); entregar, aprovar "pela família" ou fechar qualquer coisa com uma chave que não
    é a do registro do banco; aceitar uma chave de `kv` menor; trocar linhas no vigia com a troca em curso; marcar como lidas
    mensagens da ponte que não são `saude-resumo` do Omni; pôr a chave nova, a de antes ou o código de emergência em
    localStorage/sessionStorage/console/histórico/URL; "Desistir" depois de a nova ir para a família; soltar uma chave de antes sem o
    descarte no banco e enquanto algo daqui ainda depende dela; aplicar SQL pelo app ou por quem constrói.
  - Testes (no banco de mentira `teste/mock-sol.js`, que faz o mesmo que os dois SQL): `teste/giro-omni.js` (as partes de E1 a E11:
    o mock × o SQL, o chaveiro, perceber a nova, a troca e cada queda, o Fundo, o `_em`, a ponte, as telas, o descarte, G7e e D8;
    e RS1–RS4, da revisão de segurança, e RD1–RD4, da revisão de dados);
    `teste/sql-giro.js` (os dois SQL DE VERDADE num Postgres local, só com `PGLITE=<pasta>`; sem ela, "PULADO"); e
    `teste/giro-moneytrio-omni.js` (o G6: o MoneyTRIO 3.66 de verdade acompanha a troca — `buscarMinha`, `conferirCf`, a ponte com o
    resumo novo, o velho marcado pelo Omni, as finanças da família continuam abrindo; só com `MONEYTRIO=<pasta do investify-me>`;
    sem ela, "PULADO").
- `Trava` (v2.15.0) — tranca o cofre (os dois modos): 5 min sem toque/tecla (`ocioso`), 30 s fora do app (3 min logo depois de
  escolher foto/arquivo, `Trava.escolhendo`), confere ao voltar (o celular congela o relógio em segundo plano) e no `pagehide`.
  Apaga a chave antiga que a "biometria" das versões até a 2.14.x guardava no aparelho (`kv vaultKey:*`).
- `GuiaCofre` (v2.15.1) — primeiro uso do cofre: passo a passo de 4 telas ("Passo 1 de 4", Pular/Voltar/Próximo), textos dos
  dois modos (nuvem: PIN, quem vê, papel com o código; local: senha do cofre). Abre sozinho na primeira vez sem cofre
  (`vaultAfter`, marcador `omnilife.cofreGuia`); "Começar" já chama `Cofre.comecar()` ou `vault.setup`. Link "❔ Como funciona o
  cofre" (`cofre.guia`) em todas as telas do cofre.
- `VT_CAMPOS()` e `escolherTipoCofre()` (v2.15.1) — formulário do cofre por tipo: item novo começa por "O que você quer
  guardar?" (botões grandes com exemplo); depois só aparecem os campos do tipo, com nome e exemplo próprios (`aplicar` no
  `editVault`). Campo já preenchido num item antigo nunca some; campo fora do tipo e vazio não é salvo. **Linguagem para leigos**
  (prioridade do dono, 04/Out/2026): sem "cifrado", "criptografado", "ponta a ponta", "biometria", "chave da família" nas telas
  do cofre (não há teste automático só disso nas Senhas da casa; o `JARGAO_PT`/`JARGAO_EN` de `teste/seguranca-aparelhos-omni.js` confere a página Segurança e aparelhos). **Nomes (2.15.2):** na tela o cofre se chama **"Senhas da casa"** (no código continua `Cofre`/`Vault`/coleção `vault`; não renomear o código). Tipos (`VT_KINDS`): `wifi`, `portao`, `senha`, `conta`, `seguro`, `outro`; os antigos `apolice`, `contrato` e `escritura` aparecem como `seguro` (`VT_ANTIGO`, `vtKind()`) e passam a ser salvos assim ao editar. A senha do modo "só neste aparelho" aparece como "senha principal". O "cofre de chaves" de IA (`KeyVault`) é outra coisa e continua com esse nome. **Um PIN só (2.21.0):** o PIN das Senhas da casa também abre as chaves de IA: `PinUnico` (perto de `Keys`) chama `SolverCofre.usarPinDaPessoa` — quem pergunta é a janela "🔐 Digite o seu PIN" (PIN ou digital das Senhas da casa), o segredo da pessoa é o SHA-256 da chave privada dela (o mesmo depois de trocar o PIN ou usar o código do papel), e o PIN das chaves vira o da pessoa (`Cofre.trocarPin` → `PinUnico.trocou`). Abrir as Senhas da casa pela tela delas abre as chaves junto (`PinUnico.junto`). Quem não usa as Senhas da casa continua com a janela do cofre. **Reforços (2.21.2):** casa aberta não prova quem está com o aparelho, então trocar o PIN, ligar a digital e fazer código de recuperação novo passam por `Cofre.provarAgora(titulo, texto, digital)` (PIN de agora ou digital; `conferirPin`/`conferirDigital` contam erros e não abrem nada); `PinUnico.trocou` só mexe nas chaves se a pessoa está em `SolverCofre.pessoas()`; `PinUnico.junto` tranca antes as chaves abertas que não são da pessoa; o "Começar" tranca as chaves; sair da conta (`cloud.logout`, `signOut`) e `cofre.lock` trancam as duas; com `PinUnico.casaPronta()` a tela comum (`cofre.tela`) não abre (lá "Mostrar" e "Ligar a digital" passam sem PIN no cofre.js 1.6.0 — pendência #59 no rootify-one) e ⚙ → IA oferece `cofre.semdigitalchaves` para desligar a digital antiga; trocar o endereço do Personalizado com chave guardada tranca e pede o PIN (`Keys.need(..., true, true)`); `Cofre.esqueci` fecha as janelas de baixo só depois do sim. Teste: `teste/pin-reforcos-omni.js`. **Permissão das chaves de IA:** `podeChavesIA()` — o chefe sempre; outra pessoa só com `chavesIA: true` no registro dela (campo no ✏️, só o chefe vê). Teste: `teste/pin-unico-omni.js`.
- `apN()` (2.15.3) — a palavra do aparelho nas mensagens: "computador" (`Voice.desktop()`), "tablet" (toque sem "Mobile" no
  navegador) ou "celular". Use em todo texto que diz "neste/este/do/o …" sobre **este** aparelho (as três palavras são
  masculinas); para o aparelho de outra pessoa, escreva "aparelho". Antes, o computador dizia "Usar neste celular".
- `copiarSegredo(t)` — copia senha e limpa a área de transferência em 30 s (ou ao voltar ao app); nunca mostra a senha numa
  janela. Senha do cofre só aparece ao tocar no olho (`editVault`, painel de passagem, `vault.ver`).
- `Vault` — cofre do modo "só neste aparelho" (senha mestra, PBKDF2 310 mil). Desde a 2.15.0 a digital guarda a **senha mestra
  cifrada por PRF** (`kv vaultKey:<família>` = `{ cred, sal, iv, ct }`), nunca a chave. `Vault.lock()` tranca também o `Cofre`.
- `Offline.instalarCelular()` (v2.15.1) — instalar no celular de verdade: com a janela do navegador (`beforeinstallprompt`)
  instala; sem ela, passo a passo do navegador em uso (Chrome, iPhone/Safari). **Samsung Internet** (`Offline.samsung()`): o
  ícone instalado por ele dispara o alerta do Google Play Protect ("App de risco bloqueado — criado para uma versão mais antiga
  do Android"), que vem do pacote que o próprio navegador da Samsung monta (o manifesto não muda isso); por isso o app orienta
  instalar pelo Chrome, com botão `intent://…;package=com.android.chrome` e aviso de backup para quem usa "só neste aparelho".
  `Offline.samsungCard()` avisa no Início; "Já instalei" grava `S.prefs.instOk`. O passo do Início ("Deixe pronto") chama isto
  direto (antes só abria Configurações).
- `FB` — Firebase: **sem uso desde a v2.14.0** (nada chama `FB.init`); sai do código na Etapa 2d, junto com `onAuth`,
  `acct.delete` e a parte Google do `drive.backup`. Mapa usado na migração: coleções → `omni_docs`;
  família → `sol_grupos` + `sol_grupo_membros` + `omni_familia` (papel `admin` = `chefe`); convites → `sol_grupo_convites` +
  `omni_convite_info`; `joinRequests` → `omni_pedidos_entrada` (+ código em `omni_pedidos_verificacao`); `gov` → `omni_governanca`;
  `devices` → `omni_aparelhos`; `comsg` → `omni_combinados`; `audit` → `omni_historico`; arquivos → Storage `sol-arquivos/omnilife-one/<grupo>/…`;
  chaves (C7) → `sol_chave_publica` + `sol_grupo_chaves` da base (funções `sol_*`) e `omni_chave_privada` (cópia cifrada da chave privada).
  Família do Omni nasce com `sol_grupos.governanca = 'omnilife-one'`: papéis, entradas e saídas só pelas funções `omni_*`.
- `Conta` (v2.13.0, Etapa 2a) — conta SolverONE no banco da plataforma (Supabase `solverone-app`), por REST, sem biblioteca:
  `janela()` (e-mail e senha, Google, criar conta, esqueci a senha), `lerRetorno()` (no `boot`: volta do Google, da confirmação
  de e-mail e do link de nova senha → `novaSenha()`), `token()` (renova perto de vencer, uma vez só por vez), `rpc()`, `funcao()`
  (Edge Function `solverone-admin`), `marcarPedido()`/`confirmarPendente()` (volta com sessão no endereço só entra sem perguntar
  se este aparelho pediu — marcador `omnilife.contaPedido`, 2 dias; senão pergunta "Foi você?"), `aoAbrir()` (v2.14.1: no `boot` assim que há conta, em `Cloud.resolve()` e no `startApp`, uma vez por abertura e por conta — a aba guarda o id da conta em `omnilife.contaAcesso`; recarregar não conta de novo, entrar conta sempre: `minha_conta_encerrada`,
  `sol_registrar_uso('omnilife-one')`, `registrar-acesso` login/refresh), **registro de acesso (v2.14.2)**: `registrarAcesso()` põe o
  evento na fila `omnilife.acessosPendentes` ANTES de sair; `chamarFuncao()` usa `keepalive` (o navegador termina o envio mesmo se
  a página trocar — era o que perdia o POST no computador: só o OPTIONS chegava) e só repete sem keepalive se a recusa vier na
  hora; `retomarAcessos()` reenvia o que falhou (ao abrir, ao voltar a internet, em 1 min; até 6 vezes em 2 dias); "enviando" de
  uma abertura anterior com keepalive = entregue (não reenvia); na saída da página (`pagehide`, `Conta._saindo`) a recusa do
  navegador não conta como falha — senão duplicaria. `sair()` (`logout?scope=local` + `registrar-acesso`
  logout), `encerrar()` (`minha_solicitacao_exclusao`, motivo + 2 confirmações), `card()` (⚙ → Geral). Só a URL e a publishable
  key no código (públicas). `rest()` (tabelas e funções; erro sem `status` = sem internet/sem sessão, quem chama tenta depois) e
  `uid()`. Desde a 2.14.0 a tela inicial leva Google e e-mail para a conta e depois para `Cloud.resolve()`; "Usar só neste
  aparelho" continua (modo `local`). Sem conta, a família da nuvem fecha neste aparelho (`mudou()`). Digital/PIN seguem como
  desbloqueio local.
- Tema (v2.14.2): o claro declara `color-scheme: only light` (CSS e `<meta name="color-scheme">` em `applyTheme`) para o
  navegador não pintar o escuro dele por cima (Chrome "tema escuro para sites", Samsung Internet) — senão a tela fica escura com
  `S.theme = "light"` e a chave "Tema escuro" do menu 👤 parece errada. O escuro declara `dark light`.
- `ACT` — todas as ações de botão (`data-act="…"`); `data-chg` para campos que mudam.
- `Rec` (2.17.0) — **⚡ Modo DEUS** (logo depois de `const ACT`). Ids: abas em `Rec.TAB`, partes de aba em `Rec.SUB` (`"aba/parte"`;
  `"aba/"` = a parte que abre sem parte), ações em `Rec.ACT` (nome exato, senão o começo antes do ponto) e ajuda da busca em `Rec.AJUDA`.
  Um `MutationObserver` põe `data-recurso` sozinho em todo elemento com `data-tab`, `data-dtab`, `data-act` ou `data-dact` (o CSS do
  módulo esconde quando o id está desligado); `visibleTabs()` filtra ☰, barra de baixo e abas do computador; o despachante de `ACT`
  recusa a ação desligada (`Rec.livre`); `render()` mostra `Rec.tela()` ("Função desligada por enquanto") para aba desligada e, para
  parte desligada, as abas de cima (`.seg`) + o aviso; a busca pula o que está desligado. Pontos únicos com `Rec.on`: `AI.ask0` (`ia`),
  `Voice.listen`/`Voice.dictate` (`voz`), `OCR.read` (`ocr`), `Health.sos`, `Cheguei.arrive`, `Reminders.quick`, `Search.open`,
  `Weather.allowed/visible` (`clima`), `Transit.allowed` (`deslocamento`). **Nunca desligáveis:** Início, ⚙ Configurações, entrar e
  Sobre. `Rec.SEMPRE`: trancar o cofre, "Desconectar este aparelho", parar/silenciar o Vigilante e encerrar o Assume a Casa sempre
  funcionam; com o Vigilante ligado, a parte dele não some até a pessoa parar (`Rec.vigiando`). Arquivo novo do RootifyONE com o app
  aberto (`SolverRecursos.aoMudar`) redesenha. Para uma função nova: id em `Rec` e em `recursos-do-app.json`.
- `Fb` (2.17.0) — ponte com o `DGO.feedback` do módulo: `Fb.abrir(o)` (manda `tela`/`titulo` do mapa do app), `Fb.botao()`, `Fb.card()`
  (⚙ → Geral, "Ajuda e opinião"), item 💬 no ☰ (Ajuda e mais), "Avisar que deu erro" no cartão de erro do `render()` (`data-erro`),
  ação `fb.open` (id `feedback`). `Fb.idioma()` faz o módulo seguir o idioma do app (chamado no `boot` e no `setLang`).
  `window.OmniFeedbackTela` é lido pelo `feedback.tela` do `diretrizes-config.js`.
- `AI.ask` (2.17.0) — roda a pergunta (`AI.ask0`, o antigo `ask`) dentro do `DGO.fundo` (tipo `ia`): pílula, tela acesa, aviso
  antes de fechar, ✕ cancela; ao terminar em outra tela, "✅ toque para ver" volta para a tela de onde a pergunta saiu
  (`aindaNaTela` = mesmo endereço). Sem o módulo, chama `ask0` direto. `OCR.read` continua no `DGO.tarefa` (agora o do módulo).
- `SCREENS` — cada aba (`home`, `inbox`, `shop`, `agenda`, `security`, `family`, `settings`…).
- `Nav` — ponto do histórico das **telas** (botão Voltar do celular). As janelas têm o histórico delas no `janela.js` (cada uma
  ganha uma entrada; o Voltar fecha só a de cima e não chega ao `Nav`). `Nav.run(fn)` espera o histórico das janelas acompanhar
  (`SolverJanela.quandoQuieto`); `go()` usa isso, por isso trocar de tela logo depois de fechar uma janela funciona.
- **Janelas (2.19.0, janela comum)** — `modal({ title, body, foot, wide, cls, onClose, confirmacao, temTexto, espera, campo })` abre um
  `<dialog>` da janela comum (classe `mback` no `<dialog>`, `.modal` dentro; mesma aparência de antes) e devolve `{ el, close, drop }`:
  `el` é o `<dialog>`, `close()` fecha e chama `onClose`, `drop()` fecha SEM chamar `onClose` (o que antes era `m.el.remove()`: a
  resposta já saiu por outro caminho, ex.: `res(true); m.drop()`). O ✕ (`.xbtn`) pede para fechar (com texto digitado,
  pergunta "Descartar?"); os outros `[data-x]` ("Cancelar", "Fechar") fecham direto. `temTexto: false` na busca, no mapa e no
  seletor de contatos (o texto digitado ali é só filtro). Campo de senha que guarda valor (chave colada) leva `data-sj-texto`.
  `espera: n` é a contagem 3, 2, 1 do anúncio (única exceção escrita). `campo: true` põe o foco no primeiro campo também no celular
  (só o `askText`). `MODAIS` = as janelas do app abertas; `closeModals()` fecha todas.
  `confirmBox()` (e todo `modal({ confirmacao: true })`) com uma janela do app aberta abre POR CIMA (`porCima`, `alertdialog`, sem
  "Descartar?") e fecha junto com a de baixo; qualquer outra janela pedida com uma aberta espera a vez (nunca empilha: quem
  abre uma janela de dentro de outra fecha a primeira antes, ou expande dentro dela — `Help.open` de dentro de uma janela mostra
  a ajuda num `<details class="helpin">` no topo do `.mb`). A janela só entra na página quando a anterior termina de fechar
  (o histórico é assíncrono): dentro de uma janela use sempre `m.el.querySelector(...)`, nunca `$("#id")` solto logo após criar.
- `Drawer` (menu ☰) é uma janela (`dialog.drawerjan`, o `<nav id="drawer">` é criado a cada abertura e a gaveta desliza por
  animação CSS); `popMenu()` e `whoMenu()` (menu do perfil) abrem por `abrirMenu()` (`dialog.menujan`, fundo transparente, o menu é
  medido em cima do app e posicionado junto do botão); `Health.sos()` é `dialog.sos`; o tour (`AOne.tour`) é `dialog.aone-tourjan`
  (cada passo troca o conteúdo da mesma janela). O balão do AssistONE **não** é janela (não cobre a tela; diretriz). O AssistONE
  some enquanto houver janela (eventos `janela:aberta`/`janela:fechada`), menos durante o tour.
- `toast()` — os avisos ficam num `popover` (`#toasts`, camada de cima do navegador) e cada aviso novo sobe de novo para o topo,
  senão a janela aberta os esconderia. Telas de bloqueio (digital `bioGate`, tela escura e alarme do Vigilante) não são janelas:
  só travam a rolagem (`html:has(.lock,.vigiadark)`).
- `AI_PROV` / `AI` — registro de provedores de IA (Gemini, OpenRouter, Groq, Mistral, OpenAI,
  personalizado). `AI.ask` é o ÚNICO ponto que chama IA (troca nomes de crianças por `[NOME1]`).
- `Voice.dictate` / `Voice.listen` — ÚNICO ponto do microfone (ditado com plano B pela IA).
- `Net` — preferência Wi-Fi/dados. `A11y` — acessibilidade. `Search` — busca 🔎.
- `Inbox`, `Msgs`, `Notices` (recados.json), `Alerts` — caixa de entrada.
- `Cheguei`, `Vigia`, `AlertHub`, `NotifyPick`, `MyContacts` — área Segurança.
- `Versions` — aba "Versões & Novidades" (antes "Versões") (lê `versoes.json`, com a lista embutida `VERSOES_EMB` como reserva; agrupa por dia).
- `ICONS` / `ico(nome)` — ícones de traço do cabeçalho, barra de baixo, ☰ e Início (SVG desenhado para o app).
- CSS "DESIGN 2.0" no fim do `<style>` — camada visual atual (tokens de cor, cartões, Início). Mude cores ali.
- CSS "DESIGN 2.5" logo depois (v2.6.0) — cantos mais redondos, cartões sem borda, botões redondos no topo, “Saiba mais” recolhível. Para mudar o quanto é redondo, mexa em `--radius` ali. No celular, a frase de subtítulo das telas (`.pagehead .subtxt`) fica escondida por CSS; o `render()` é quem a envolve nesse `span`.
- `School` — calendário escolar (coleção `school`, uma grade por pessoa: `child` = id da pessoa ou `null` com `name` livre para quem ainda não está na família ou não tem usuário; `days[diaDaSemana] = [{ t, e, s, n }]`). Foto/PDF → `AI.ask` com visão → tela de conferência (`School.edit`) → salvar; sem IA, editor manual. Aparece em Agenda → Escola, no Início (“Hoje e amanhã”), na busca e na ajuda (`HELP.escola`).
- `ShopViews.scan` / `ACT["scan.*"]` — “O que tem em casa, por foto”: várias fotos (`Vision.detect(f, "home")`, com `Vision.area` como dica de onde é a foto) se juntam numa lista; “Atualizar despensa” grava categoria, situação e `seen` (data em que foi visto).
- `KeyVault.openSite` / `paste` / `resume` — ida e volta ao site da chave: marcador `omnilife.keyReturn` (30 min) antes de abrir; no celular o site vai para outra aba e, ao voltar, `resume()` (chamado em `startApp`, `visibilitychange` e `pageshow`) reabre o cofre no mesmo provedor com o botão 📋 Colar; no computador o site abre numa janela na metade direita e `body.keyside` leva o cofre para a esquerda.
- `AI.pool(cap)` — todos os provedores com chave e a capacidade (texto, visao, stt): `AI.ask` e `aiSTT` chaveiam por eles quando um fica sem cota (402/429) ou falha com erro HTTP.
- `Weather` / `WX_PROV` / `WX_DEFAULT` — clima ligado à agenda: config master `solverone-dados/clima.json` (RootifyONE; reserva `clima.json` local; modelo `clima-MODELO-OmniLifeONE.json`), elegibilidade por login e plano (`allowed`/`visible`/`locked`), lugar da casa (`settings.address` do CEP, GPS ou cidade em `settings.weather`), previsão do Open-Meteo (padrão, sem chave) ou WeatherAPI/OpenWeatherMap (chave da pessoa em `Keys` como `wx:<provedor>`), avisos oficiais do INMET pelo IBGE, avisos práticos (`tips`) em `Alerts.list`, cartão no Início (`card`), ícones no calendário (`cell`/`dayLine`/`evHint`), aviso diário (`notifyDaily` via `Notify.tick`) e tela `SetViews.clima`. Briefing para o admin: `para-o-chat-do-RootifyONE-clima.txt`.
- `MapPick` — mapa interativo para escolher um lugar (`MapPick.open({ title, lat, lon, gps })` → `{ lat, lon, cep, street, number, district, city, uf, addr, short }` ou `null`): Leaflet + OpenStreetMap carregados só quando abre (`LIBS.leaflet`/`LIBS.leafletCss`), busca (Nominatim `search`), 📍 localização do aparelho (só com toque), toque/arrastar o pino, endereço e CEP do ponto (Nominatim `reverse`). Usado no endereço da casa (`ACT["addr.map"]` → `S.addrPick` → `svc.save`), em `Places.edit` (CEP ou ponto), no Local do compromisso (`e.placeGeo`, usado por `Places.resolve(texto, geo)`, `Transit.nav` e `Weather.evLoc`) e em ⚙ → Clima / cartão do Início (`ACT["wx.map"]`). Padrão obrigatório da plataforma para qualquer escolha de lugar.
- `Places` / `PLACE_KINDS` — lugares da família (coleção `spots`: `{ name, kind (casa/trabalho/escola/saude/aeroporto/rodoviaria/outro), cep, city, uf, ibge, lat, lon }`), cadastrados **só com o CEP** (ViaCEP → cidade; Nominatim → coordenada aproximada; a rua não fica guardada). `Places.home()` vem de `settings.address`. `Places.options()` alimenta o campo Local do compromisso (Casa, lugares, contatos com endereço, locais já usados); `Places.resolve(texto)` vira coordenada. Cartão em Contatos → Serviços perto de casa (`Places.card`), ACT `place.new`/`place.edit`.
- `Transit` / `TRANSIT_DEFAULT` / `TR_MODES` — deslocamento do compromisso (`e.transp = { on, from ("casa" | id de lugar | "aqui"), modes[] (carro, moto, taxi, metro, onibus, trem, aviao, rodoviaria, bike, ape), travelMin, airportMin, flight, leaveAt }`). Config master `solverone-dados/rotas.json` (RootifyONE; reserva `rotas.json`; modelo `rotas-MODELO-OmniLifeONE.json`): `provedor` (osrm sem chave | tomtom com chave da pessoa `rt:tomtom` | nenhum), `antecedencia` (aeroporto nacional/internacional, rodoviária, margem), `fatorPico`, `fatorChuva`, `links`, `planos`, `logins`. `estimate()` = rota (OSRM/TomTom) ou linha reta × velocidade média, × pico em dia útil 7–10 h e 17–20 h, × chuva prevista (`Weather.at`); `leaveAt()` = hora − caminho − antecedência − folga; `links()` = Google Maps, Waze, Uber, Moovit e Flightradar24 (por link, sem chave); `alerts()` (até 2 h antes, em `Alerts.list`) e `tick()` (notificação 10 min antes, em `Notify.tick`); botão 🧭 (`ACT["ev.nav"]`) na linha do compromisso e no formulário. Formulário do compromisso (`evFields`/`editEvent`): Dia inteiro; Início e Até lado a lado (`.trow`) com −/+ 30 min (`.tstep`); faixas prontas (`data-r`), “mover” os dois (`data-sh`), horários comuns (`data-t`, entram no campo tocado por último, marcado com `.tsel`) e duração (`data-d`); fim nunca antes do início no mesmo dia (`followEnd` mantém a duração quando o início muda; `checkEnd` corrige fim digitado antes; `el._validTimes()` bloqueia o salvar); “Mais de um dia” (`multi` → `endDate`; `Agenda.occurrences` gera dias de continuação com `cont: true`, sem lembrete repetido; Google Agenda e .ics usam `endDate`); ordem: horário → Local → deslocamento → Tipo de compromisso → Quem; Local com sugestões + “🗺 No mapa” + “＋ Lugar (só CEP)”; deslocamento só quando “Sim”, com “Saindo de” (aqui = localização atual com endereço, precisão e pergunta “Você está em X?” via `Places.near`; ultima = `Geo.last()`; casa; lugar; mapa/geo → `transp.fromGeo`) e “Chegando em” (`transp.to`: local = Local do compromisso, casa, id de lugar ou geo → `transp.toGeo`; resolvido por `Transit.dest(e)`, usado na estimativa, no 🧭 e no clima); o bloco fica logo abaixo do Local, com Não/Sim segmentado (`.trseg`) ligado ao campo escondido `transp.on`; “Sair às” calculado ao vivo. `Geo.remember/last/ago` guardam a última posição do aparelho em `omnilife.lastpos.v1`. Briefing para o admin no fim de `para-o-chat-do-RootifyONE-clima.txt`.
- `Weather.autoLocate()` / `Weather.GK` — sem lugar conhecido, usa a localização do aparelho sozinho quando a permissão já foi dada (guardada 7 dias em `omnilife.wxgps.v1`, renovada a cada 6 h); senão o cartão do Início pede um toque (“📍 Usar minha localização”). `Weather.evLoc(e)` / `atPlace()` — compromisso num Lugar cadastrado a 25 km+ da pessoa mostra a previsão daquele lugar (cache `omnilife.wxplace.v1`, até 8 lugares, 3 h); sem local, vale a localização da pessoa. Passo “Ativar a previsão do tempo” em `Setup.steps` e no AssistONE (`clima`).
- `moreBox(título, html)` — explicação longa recolhida num `<details class="more">` (“› Saiba mais”). Use em vez de parágrafos longos de ajuda dentro dos cartões.
- `CAPS`, `AI_PROV`, `AI`, `aiSTT`, `aiTTS`, `KeyVault` — cofre de chaves com capacidades e guia por provedor.
  `AI.key(id)` só diz se **tem** chave (sem abrir o cofre); `AI.chave(id)` (Promise) pega a chave na hora de chamar o provedor.
- **Chaves no cofre comum (2.18.0; Fase 3 na 2.19.0)** — `Keys` (perto de `Bridge`) é o único lugar que lê e grava chave: `Keys.has(nome)` sabe sem
  abrir, `Keys.get(nome)` só com o cofre aberto (`''` trancado), `Keys.need(nome, motivo, ask)` pede o PIN se precisar
  (`ask === false`: só abre sem PIN, nunca mostra a janela — usado pelo clima em segundo plano), `Keys.set(nome, valor)` grava/apaga
  (pede o PIN, ou cria o cofre). Nomes no cofre: IA `ia:<provedor>` (o mesmo nome dos outros apps; `Keys.nome` põe o `ia:` nos
  ids do `AI_PROV`), clima `wx:weatherapi`/`wx:openweathermap`, trânsito `rt:tomtom`, Telegram `TG_KEY` = `telegram:omnilife-one`.
  `Keys.status(tem)` desenha "🔐 Guardado no cofre" + "🔒 Trancar o cofre agora" (`ACT["cofre.lock"]`) em ⚙ → IA (lista e janela
  de cada provedor), ⚙ → Clima (clima e TomTom) e Segurança → Alertas (token). Os campos de chave nunca mostram o valor (vazio,
  com "Guardado no cofre — cole outra para trocar"); "Salvar e testar" com o campo vazio testa a que já está guardada.
  **Mudança das chaves antigas**: `diretrizes-config.js` → `cofre.fontes` (`investifyme.chaves.v1` `chaves` e raiz,
  `omnilife.prefs.v1` `keys`, `alertas.tgToken`, `vigia.tgToken`); o `SolverCofre.migrar` roda sozinho ao criar/abrir o cofre e
  tira **só** esses campos. O evento `cofre:migrado` tira os mesmos campos de `S.prefs` na memória (senão `savePrefs()` os
  gravaria de volta). Trancado: IA, Telegram (`AlertHub.tgToken()`), TomTom e "🔄 Atualizar agora" do clima pedem o PIN e seguem;
  o Modo Vigilante abre o cofre ao **começar** (com a pessoa ali), para os alertas da vigília não esperarem PIN. Backup e cópia
  protegida já não levavam preferências; continuam sem nenhuma chave. Até a 2.18.0 ficava de fora (PENDENCIAS #34) a
  `apikey` do CallMeBot de cada contato (`alertas.recips[].waKey`); **entrou na 2.19.0**: nome `WA_KEY(id)` =
  `callmebot:omnilife-one:<id da pessoa>` no cofre; como o `cofre.fontes` não alcança itens de uma lista, `AlertHub.migrarWa()` leva
  as de antes quando o cofre abre (eventos `cofre:aberto`/`cofre:migrado` e ao entrar) e só tira do lugar antigo o que já foi
  gravado; `AlertHub.waOk(r)`/`waKey(r)` leem (cofre, ou a de antes até migrar); o campo da apikey vem vazio.
  **Fase 3 (2.19.0):** `cofre: { proteger: true }` no `diretrizes-config.js` (PIN ao abrir e ao recarregar quando há segredo
  guardado; tranca ao sair, escondido por 1 min e sem uso por 5 min). O Modo Vigilante ligado conta como trabalho em andamento
  (o app chama `SolverCofre.proteger` de novo, logo depois do `DGO.iniciar`, só para acrescentar `() => Vigia.on` ao `ocupado`).
  `Keys.status(tem, nome)` mostra "✓ Guardado no cofre" e, com `nome`, o botão `keys.show` "👁 Mostrar a chave guardada" (tranca o
  cofre, pede o PIN e mostra por 30 s; o valor mostrado vive em `Keys._show` para o desenho da tela não o perder). O painel da
  digital mora na tela de chaves do módulo (`DGO.ia.guia`): ⚙ → IA tem o cartão "Cofre das chaves e digital" com o botão
  `cofre.tela`; o app **não** chama `painelDigital`. A tela de chaves própria do Omni (`KeyVault`) continua (decisão pendente:
  trocá-la pela do módulo).
- `Offline` — aba "Instalar app para acessar sem internet" (antes "Sem internet"; fala com o `sw.js` por mensagem) e atalho na tela
  inicial. `oQueFunciona()`/`avisoSemNet()` (2.15.4): a lista do que funciona e do que precisa de internet, aberta uma vez ao
  entrar na aba (marcador `omnilife.semNetAviso`) e depois pelo link "❔ O que funciona sem internet". A lista foi conferida no
  código; ao mudar um recurso que depende da internet, revise-a.
- `Migrar.card()`/`apagarSoAqui()` (2.15.4, PENDENCIAS #21) — ⚙ → Dados, só com a família na nuvem e para chefe/responsável:
  "Apagar o que está só neste aparelho" apaga Saúde, Documentos e os arquivos (`NUVEM_LOCAL`) desta família, depois de oferecer a
  cópia protegida com os arquivos (`Migrar.copia(…, { apagar, arquivos })`; cópia sem os arquivos pede confirmação, via
  `S._copiaArquivos`; só quando há arquivos). Com a cópia antiga de uma família levada (`feito()` + store `docs`), manda apagá-la
  antes (⚙ → Nuvem). Arquivo que outra família do aparelho também usa (`<outroGid>|files|<id>` no store `nuvem`, ou `files|<id>` no
  store `docs`) perde só o registro desta família; os anexos das senhas antigas (`anexosAntigos()`, de `Cofre.legado()`) ficam e
  não entram na conta. Confere de novo modo/família/papel depois das janelas. Não mexe na conta, na fila, no que está na nuvem nem nos outros apps.
  `Conta.textoSoAqui()` dá o texto certo do "Encerrar minha conta" em cada modo e papel (e quando já não sobrou nada).
- `Compat` — quadro de compatibilidade do aparelho/navegador (só aparece com problema). Desde a 2.15.3 vem **fechado** (uma linha
  com quantas funções podem falhar) e só na aba Geral (`Compat.view(sub)`); navegador velho abre o quadro em todas as abas.
- `Sess` — sessão da aba (recarregar não pede PIN por 30 min) e volta ao mesmo lugar depois de entrar.
- `Batch` — vários arquivos de uma vez (Documentos), com fila, duplicados e conferência.
- Manutenção → MoneyTRIO (2.20.1) — `Maint.done` manda pela `Bridge` (`ecossistema.ponte.v1`). Carro: grupo `VEICULO` e a subcategoria
  escolhida na hora entre `MT_SUB_CARRO()` ("Revisao Periodica" ou "Mecânico / Eletrico / Funilaria", texto exato do MoneyTRIO),
  sugerida por `mtSubCarro(título)`; nunca "Manutenção" (não existe lá). Casa, eletros, jardim e pet seguem `HABITACAO` /
  "Manutenção" (o cuidado ligado a um pet da aba 🐾 Pets, `maint.pet`, não oferece o envio: gastos do pet esperam o formato do MoneyTRIO, #62). `Bridge.antigosCarro()` lista, só para conferir em ⚙ → Integrações, o que já tinha ido com "Manutenção".
- `Cars` (2.20.0) — a ficha do carro. **Desde a 2.22.0 é a aba própria 🚗 Veículos** (`SCREENS.cars`, rotas `cars`, `cars/lista`,
  `cars/ficha/<id>` e `cars/vida[/<id>]`; ids `veiculos` e `veiculos.vida` em `Rec` e no `recursos-do-app.json`; o id antigo
  `casa.veiculos` continua valendo em `Rec.rota`). O endereço antigo `#/house/cars[/id]` é trocado pelo novo em `parseRoute`. O carro é um **Lugar** do tipo `veiculo` (coleção `places`: não mudou o banco; continua servindo para
  "o que está guardado no carro" no Onde está?). No registro ficam só `carro.{marca, modelo, anoFab, anoMod, comb}` e
  `seguro.{seguradora, inicio, fim, bonus, franquia, franquias, coberturas, assist, app, corretor, custo}`. **Placa, chassi,
  renavam, nº/item da apólice e o custo do seguro** (`CAR_SEC`) vão num item das **Senhas da casa** (`vault`, `kind: "seguro"`,
  `carId`) ligado por `vaultId`: `Cars.segredo(c)` abre (só com o cofre aberto; `{ _falta: true }` quando o item não está no
  aparelho ou não abre — a ficha avisa e `car.secnovo` solta a ligação se ele foi apagado), `Cars.guardarSegredo(c, sec)` grava
  (não cria item novo se o ligado não está aqui; não regrava se nada mudou, para não virar conflito na nuvem). Nunca entram em
  lista, busca, aviso, `ChangeLog` (só o envelope cifrado), leitura em voz alta (`A11y.read` esconde de novo o `[data-sg]`) nem IA;
  na ficha aparecem como `••••••` até o 👁. Só responsável com o cofre aberto edita (`fields("aberto")`); se o cofre fechar com
  o formulário aberto, os campos `_sec.*` somem dele. `Cars.apagar(c)` (também pelo Onde está?) leva o item do cofre com os
  anexos e os lembretes do carro; documentos e manutenções ficam, sem o carro. `assist` = um telefone por linha `Nome: número` (`Cars.fones`): 📞 `telHref`, 💬 `waHref` se o nome tiver "WhatsApp".
  A franquia aparece em destaque ("acima disso, vale acionar o seguro"). `seguro.custo` é **só referência do MoneyTRIO** (nada
  vai pela `Bridge`). Documentos (`docs.veiculo`), manutenções (`maint.veiculo`) e lembretes (`reminders.veiculo`) ligam ao carro;
  "De qual veículo" só aparece nos formulários quando há carro. **Ficha pronta** (`Cars.importar` → `validar` → `resumo` →
  `gravar`, pelo `DGO.fundo`, tipo `importar`, sem "Tentar de novo"; tudo ou nada: o PDF vem primeiro e uma falha no meio desfaz o
  que já foi gravado): arquivo `.json` `{ formato: "omnilife.ficha-veiculo", versao: 1, id, veiculo,
  protegido, seguro, lembretes[], manutencao[], documento{ arquivo{ nome, tipo, base64 } } }`; exige responsável e cofre aberto
  (placa e PDF entram trancados, PDF até 12 MB, `Files.save` com `encrypt`); a mesma ficha (`places.ficha` = `id`) não entra duas
  vezes; manutenção com o mesmo título e documento com o mesmo título e tipo, soltos de um carro apagado, são aproveitados.
  Senhas da casa fechadas (2.21.1): `Cars.abrirCasa(motivo)` destranca ali mesmo, sem trocar de tela (nuvem: `PinUnico.pedir`, PIN
  ou digital; local: senha principal); `null` = não há Senhas da casa para abrir aqui → `Cars.irParaCasa()`. Usado no "📥 Trazer"
  (depois de escolher e conferir o arquivo) e no botão 🔓 da ficha (`car.abrircasa`); contato de emergência vai à tela com o código. Ajuda `HELP().veiculos`. Teste: `teste/veiculos-omni.js`.
- `Vida` (2.22.0) — **🔧 Vida do carro**: tudo o que foi feito no carro. Cada serviço é um registro de `maint` com `tipo: "servico"`
  (`veiculo`, `d`, `km`, `oficina`, `itens: [{ n, v }]`, `cost`, `files`, `orc`, `mtEnviado`); `Maint.list()` **não** mostra esses
  registros (Casa → Manutenção continua só com o que se repete). `Vida.linha(carId)` junta os serviços (sem orçamentos) e o
  histórico das manutenções ligadas ao carro (a entrada com `servico: <id>` não conta duas vezes). **Foto da nota**
  (`Vida.lerFoto`, no `DGO.fundo`, resultado em `aoAbrir`): OCR no aparelho (`OCR.read`, PDF por `ShopImport.pdf`) →
  `Vida.mascarar` (placa, chassi, CPF/renavam, e-mail, telefone, nomes da família, linhas de cliente e endereço; com as Senhas
  da casa abertas, também os valores exatos do carro) → IA só com texto (`AI.ask0`, JSON; a foto nunca vai) ou `Vida.local` sem IA
  → `Vida.editar` (a pessoa confere). **Serviço repetido**: `CAR_PECAS` dá uma chave por peça (o mais específico primeiro);
  `Vida.repetidos` acha a última vez (até 2 anos; linhas genéricas como "Mão de obra" não contam — `Vida.generico`) e
  `avisoHtml` mostra ⚠️ até 180 dias e a garantia de 90 dias (CDC). A revisão programada se reconhece por `Vida.ehRevisao`
  (PT e EN; "revisão dos freios" não). Valores: `Vida.valor` (milhar com ponto ou vírgula), `itensDe` (traço só separa com
  espaço; desconto negativo), `soma` (sem Subtotal/Total); km: `kmDe`. Salvar: `kmCarro` (sobe a km do carro; se a km veio
  deste serviço e ele foi corrigido, virou orçamento ou foi apagado, volta para a maior dos outros), "Esta foi a revisão
  programada" recalcula a revisão e guarda na linha do histórico o que ela mudou (`antes`); `soltarRevisao` tira a linha e
  devolve a revisão como estava. Total só fica fixo se foi escrito (`totalManual`). Foto da nota: `Files.save` trancada
  (`vis` restrito, cifrada) e mostrada (📎) na janela do serviço. Data de serviço feito no futuro não salva. Criança só vê.
  MoneyTRIO uma vez (`mtEnviado`) e só se o registro foi gravado. Cancelar a leitura (✕) para antes da IA. **Revisão por km** (#53): `cadaKm`/`ultKm` na manutenção do carro (`Maint.edit`/`done`); `Vida.revisao(c)`.
  `Vida.saude(c)`: revisão, seguro, km, o que foi feito em 90 dias e gastos de 12 meses (resumo, não diagnóstico). Teste:
  `teste/vida-carro-omni.js`.
- `Pets` (2.24.0) — **🐾 Pets, aba própria** (`SCREENS.pets`, rotas `pets` e `pets/ficha/<id>`; id `pets` em `Rec` e no
  `recursos-do-app.json`; ☰ › Cuidar da família; `canTab` como Casa e Veículos: criança vê e não muda). O pet continua sendo
  `people` com `role: "pet"` (Família, aniversários, Saúde e `SaudeMT` com `especie: "pet"` não mudaram) e ganha `p.pet`:
  `especie` (`PET_ESP`; pet antigo sem `especie` usa o ícone), `raca` (datalist `PET_RACAS()` por espécie, troca no `after` do
  formulário; texto livre vale), `cor` (pelagem; `p.color` é a cor do avatar), `sexo`, `castrado`, `chegada` (nascimento segue em
  `p.birth`), `microchip`, `pedigree`/`registro`, `descricao`, `foto`/`fotos` (ver `PetFoto`), `racao`, `pesos [{id, d, kg}]` (até
  100; kg com até 3 casas, `Pets.dec` lê "3,450" e "15 kg"), `historico [{id, d, tipo, titulo, nota}]` (`PET_HIST`, até 200) e `contatos {vet, hotel, banho}` (ids de `contacts`; o
  mesmo contato pode ser os três; "＋ Novo contato" abre o contato com `cat: "pet"` e volta à escolha). Cadastro próprio
  (`Pets.edit`, sem PIN/controle parental; `personFields` não oferece mais "Pet" com a aba ligada; `person.edit` de um pet abre a
  ficha). **Cuidados** = `maint` com `cat: "pet"`, `pet`, `petTipo` (`vacina` 365 d, `vermifugo` 90, `antipulgas` 30, `banho` 45,
  `outro` — `PET_CUIDADOS`, criados pelo `Maint.edit` já preenchido): passam pelo sino (que leva à ficha), avisos, agenda, busca e
  Casa → Manutenção; na ficha, ✓ Feito (`Maint.done`; vacina guarda `produto` e `vet` na linha do histórico; também em cada linha
  de "Próximos cuidados", onde o sino leva), 📅 Remarcar (`next` + `nextManual`) e 🚫 Não se aplica (apaga). Apagar um cuidado (🚫
  ou 🗑 no `Maint.edit`) passa os ✓ Feito para `pet.historico` antes (`Pets.guardarHistorico`). A vacina aparece sempre no ＋ (a
  segunda vem sem nome, "Outra vacina"). `ligarAntigos` liga cuidado antigo pelo nome do pet como palavra inteira (≥ 3 letras). **Ração**: `racao {marca, fase, sacoKg, gRefeicao, refeicoesDia,
  compradoEm, sacos, validade}`; `Pets.racaoCalc` (diário, dias por saco, `acabaEm`, `vence`, `maxSacos` ≥ 1); um aviso
  `maint` "Comprar ração — nome" (`petTipo: "racao"`, `next` = acaba − 7 dias, `Pets.racaoLembrete`, id fixo `racao-<pid>` para
  dois celulares não criarem dois; o guia novo também tem id fixo, `guia-<pid>`); o ✓ dele abre
  `Pets.racaoForm(pid, true)` (compra nova, entra no histórico do aviso); calculadora da promoção (`calcPromo`, mesma conta
  comprando hoje); 🛒 `Shop.add`. Peso: gráfico SVG próprio (`Pets.grafico`) com a faixa de `PET_PESO` (poucas raças, "confirme
  com a veterinária"). Histórico da ficha = `pet.historico` + os ✓ Feito dos cuidados (`Pets.linha`). Listas do pet (`historico`,
  `pesos`, `fotos`) mudam por `Pets.lista` (registro inteiro de agora, `DB.put`: na nuvem o envio com versão junta os itens pelo
  id; o `DB.patch` da lista trocava a lista toda). `Health.edit` de pet esconde
  tipo sanguíneo, RH e SUS e chama `doctor` de "Veterinário(a) de referência" e o plano de "Plano de saúde pet". **Guia para quem
  cuida** (`Pets.guia`): `guides` `kind: "pet"`, `pet`, `for`, `contacts`, seções de `guiaSecoes` (ração, remédios e alergias da
  Saúde, manias, veterinário e hotel com telefone); `petAuto` guarda o que veio da ficha: texto diferente escrito pela pessoa só é
  trocado depois de perguntar; depois abre o `Guides.edit` para conferir. Apagar o pet leva fotos, cuidados e carteira vital.
  Gastos do pet → MoneyTRIO: ainda não (#62). Ajuda `HELP().pets`, AssistONE `HERE().pets`. Teste: `teste/pets-omni.js`.
- `Pets` por tipo de bicho (2.25.0, #64) — **qualquer animal**. `PET_ESP` tem 10 tipos (`papagaio` 🦜 e `quelonio` 🐢 entraram
  antes de `outro`, que fica por último por ser a reserva de `Pets.esp()` e de `PET_HIST`); nenhuma chave antiga foi renomeada e o
  banco não mudou. `PET_PERFIL()` é a tabela única por tipo (o que falta usa o valor do cachorro): `cuidados` do ＋ (chaves de
  `PET_CUIDADOS`, que ganhou consulta, gaiola, potes, poleiros, unhas, escovar, agua, testeagua, filtro, pote, uvb, substrato,
  terrario, hidratacao e refeicao — nenhuma diária), `rotulos`, `esconde` (campos do formulário com `display:none`; o `readForm`
  continua lendo, nada salvo se perde), rótulos de raça/cor/chip/registro/descrição, `peso` (`"kg"`, `"g"` ou `null` no aquário),
  `comida` (`"saco"` ou `"simples"`: só marca e validade, sem conta e sem aviso "Comprar ração"), `refeicoes` (false = gramas por
  dia), `saco` ("pacote"), `faseAuto`, `histFora`, `secao`/`alerta` do guia, `papeis` (rótulos dos contatos; exóticos com 🧳 e 🛒)
  e `busca`. Use sempre `Pets.perfil(p)` e `Pets.cuidadosDe(p)`. `Pets.esp()` refina pela raça só pelo nome do bicho
  (reptil + jabuti/tartaruga/tigre-d'água/cágado → `quelonio`; ave cujo nome começa por papagaio/arara/maritaca → `papagaio`), e o
  formulário abre com esse tipo (o próximo Salvar grava). Pet novo começa sem espécie: o `onOk` pede "Que bicho é?" (o `req` do
  `formModal` não acha chave com ponto). `Pets.kg(v, un)` lê "35", "1,2 kg", "500 g" e "1.200" (milhar em gramas); peso em g grava
  com décimo de grama e recusa menos de 1 g; no pacote, número sem unidade de 50 para cima é grama (o teclado de número do celular
  não tem letras); `Pets.sacoTxt` mostra o pacote abaixo de 1 kg em gramas. `PET_PESO` tem o tipo na 4ª posição. O guia
  (`guiaSecoes`/`guia`) troca o texto do tipo quando o tipo muda, sem duplicar seção e sem apagar o que a pessoa escreveu.
  Textos de lei: sempre "confirme com o órgão ambiental do seu estado"; nunca dose nem nome de remédio (lista "não dizer" do plano
  do #64). `EMOJIS` da Família ganhou 🐹 🦎 🐢 (o ícone se perdia ao editar). Um celular ainda na 2.24.0 que salve no ✏️ um pet
  de tipo novo grava cachorro (código antigo); o `sw.js` faz `skipWaiting`, então basta abrir o app de novo.
- `PetFoto` (2.24.0) — fotos dos pets (decisão do dono: na nuvem da família, leves). `redesenhar` (canvas, maior lado 640 px no perfil e
  1080 px na galeria, WebP 0,78; JPEG 0,8 se o navegador não faz WebP; nunca corta; tira EXIF/GPS) — falhou = foto recusada, o
  original nunca é guardado. `Files.save(…, { raw: true })` no aparelho e, com `S.mode === "cloud"`, `POST
  /storage/v1/object/sol-arquivos/omnilife-one/<família>/pet-<fileId>.<webp|jpg>` (apikey + sessão de `Conta.token`, `x-upsert`).
  No pet só `{ id, path, w, h }` (galeria até 12, contadas na hora de guardar; um lote de cada vez por pet). Os `files` não sobem
  (`NUVEM_LOCAL`): outro celular baixa por `GET …/authenticated/…` (`PetFoto.baixar`, uma vez; erro espera 1 min; pendente não
  baixa), grava no IndexedDB com `nuvem: <path>` e mostra (`preencher`, atributos `data-pfoto`/`data-ppet`). **O registro do pet é
  editável por qualquer adulto**, então: só sobe, aparece e é apagado o arquivo local com `petFoto: <pid>` (`PetFoto.meu`; posto
  por `guardar`/`baixar`, sem cifra, `vis: "familia"`, WebP/JPEG), e só vale o caminho `omnilife-one/<S.family.id>/pet-<id>.<ext>`
  (`pathOk`/`caminhoOk`) em GET, POST, DELETE e na lista de apagar depois. Envio que falhou: `pendente: true`, e `reenviar()` (ao
  abrir 🐾 Pets, no máximo a cada 20 s) sobe de novo, sempre com o caminho montado aqui; a foto do pet que já subiu não conta em
  "Apagar o que está só neste aparelho" (`PetFoto.naNuvem`); apagar (só responsável, pelas regras do bucket) tira daqui e faz `DELETE`; sem internet, o
  caminho fica em `LS.petFotoApagar` e é apagado no próximo `reenviar`. Adicionar roda no `DGO.fundo` (tipo `foto`). "Só neste
  aparelho": sem envio. Sem cifra (foto de bicho).
- `SaudeMT` (2.23.0) — **Saúde → MoneyTRIO**, híbrida e opcional (`DB.setting().mt.saude`, ⚙ → Integrações; só responsável, nuvem e
  Senhas da casa prontas — `SaudeMT.pode()`). `resumo()` = `{v:1, enviado_em, pessoas:[{perfil_id, apelido, operadora, validade, medico, especie?}]}`
  de quem tem plano, validade ou médico (pet com `especie: "pet"`); cifrado com a CF (`Cofre.vf`, formato `{c:1, kv, fk, iv, ct}`)
  e enviado por `Conta.rpc("sol_ponte_enviar", {p_de:'omnilife-one', p_para:'moneytrio', p_tipo:'saude-resumo', p_dados:{v:1, cif}, p_grupo})`.
  Dispara ao ligar e em `Health.edit` quando muda operadora, validade ou médico (`SaudeMT.chave`); Senhas da casa fechadas →
  pendente em `LS.saudeMT` (por família) e envio em `Cofre.usarChave`. **2.27.0:** com registro do cofre, decide pelo BANCO
  (`Cofre.noBanco`): troca em curso, ou a chave daqui não é a do registro → não manda (fica pendente; vai com a nova). Teste:
  `teste/saude-moneytrio-omni.js` (e o G13 do `teste/giro-omni.js`).
- `ChangeLog`, `Telem` — registro de alterações local e relatório de erros com consentimento. Na tela (2.15.3), `LOG_COL` dá o
  nome da parte do app ("Lista de compras", "Pessoas") e `logLegivel()` mostra os valores em vez do JSON; o CSV continua completo.
- `Gov` — governança da família (nuvem): pedidos em `omni_governanca` (lidos no `poll`, `Gov.setList`) — `hd_<uid>` (rebaixar/remover chefe: outro chefe aprova ou vale em 48 h sem veto), `tr_<grupo>` (passar a criação: troca no aceite), `em_<uid>` (acesso de emergência ao cofre com espera). Tudo por funções: `omni_pedir_mudanca_chefe`, `omni_aprovar_pedido`, `omni_vetar_pedido`, `omni_cancelar_pedido_gov`, `omni_propor_transferencia`, `omni_responder_transferencia`, `omni_pedir_emergencia`; `Gov.tick()` chama `omni_executar_pedidos` (chefe) e `omni_liberar_emergencia` (contato) quando há algo vencido. Desde a 2.15.0 o código de emergência abre o cofre da nuvem (envelope `_em` com a chave do cofre; ver `Cofre`); quando o acesso é liberado, o `poll` refaz a cópia para o contato receber o cofre cifrado.
- `Devices` — aparelhos conectados (`omni_aparelhos`; id = `omnilife.deviceId` + começo do id da conta), registrados ao entrar (upsert), desconectar à distância (`desconectado`); o aparelho desconectado sai da família e da conta na próxima consulta. `Grow` — criança que cresce (idade em `policy.gradAge` / `settings.gradAge`). `Areas` — quem cuida de cada área (`settings.areaOwners`). `Duas` — duas casas: `settings.duas`, coleções `coexp` (despesas) e `comsg` (registro que só recebe itens novos).
- `Move` + `SITE_BASE`/`SITE_DOMAIN` — mudança para solverone.com.br: links usam o próprio endereço; no endereço antigo, aviso para guardar backup.
- `Restore` / `Merge` (v2.11.0) — **diretriz geral: restaurar uma cópia nunca duplica usuário.** `Restore.exportar(senha)` gera a **cópia protegida** (`OmniLifeONE-copia-protegida-….json`): conteúdo cifrado com AES-GCM 256 por uma chave de dados embrulhada pela senha da cópia (PBKDF2, 310 mil voltas) e por um **código de recuperação** mostrado uma vez; fora do cifrado só ficam app, versão, data, primeiro nome de quem fez e quais perfis tinham digital. Na primeira tela, `ACT["gate.restore"]` restaura **antes de entrar**, e só a cópia protegida (a aberta é recusada ali; dentro do app, `bk.import` aceita as duas, só por responsável). `Restore.aplicar` reconhece a mesma pessoa (`casar`: mesmo id, ou mesmo nome quando a identidade foi confirmada pela senha/código), pergunta **Juntar (padrão) / Substituir / Manter separado** quando já há gente no aparelho, e em Juntar troca o id da cópia pelo id local em todos os registros (`remap`); o PIN que vale é o do perfil local. Digital é presa ao endereço: perfis restaurados que tinham digital recebem `S.prefs.bioRelink` e o `selectProfile` avisa para ligar de novo, entrando pelo PIN. `Merge.card()` em ⚙ → Dados une dois perfis duplicados: mostra o que cada um tem (`Merge.resumo`), exige marcar "entendi" e digitar o nome que some, baixa `OmniLifeONE-antes-de-unir-….json` e só então `Merge.unir` (remap + apaga o perfil que some + esquece a digital dele). **v2.11.1:** antes de entrar, escrever num aparelho que já tem família pede PIN/digital de responsável (`Restore.autorizar`, `confirmarPessoa`, `escolherPessoa`); Substituir baixa antes uma cópia protegida (`Restore.copiaAntes`, com o mesmo segredo digitado); Juntar usa `Restore.completar` (o do aparelho vence, vazios vêm da cópia, listas somam) e `Restore.segura` (PIN, login, papel e administrador do aparelho sempre vencem — um `pinHash` é `sha256(PIN + id)`, então nunca pode passar de um id para outro), saúde e ajustes se completam, o resto só entra se for mais novo (`Restore.gravar` mantém o `updatedAt` da cópia), Manter separado não sobrescreve; `Merge.unir` junta registros com o id da pessoa (ficha de saúde) em vez de sobrescrever, move a digital do aparelho, recusa dois logins da nuvem e a cópia “antes de unir” sai protegida com senha (`mostrarCodigo`).
- `AOne` — AssistONE: personagem flutuante (ligado por padrão, `S.prefs.aone`), balões (começar/wizard, tour, busca com `Search.find` + "você quis dizer", ajuda da tela), dicas por tela uma vez só, cartão em ⚙ → Geral. Chamado no fim de `render()` por `AOne.after()`.

- `DRAWER_GROUPS` / `DRAWER_SUBS` — grupos do menu ☰ e as partes de cada função (acordeão de um nível). Para mudar a organização do menu, mexa só nessas duas listas.
- `BarEd` — barra de atalhos com arrastar e soltar (⚙ → Geral). Padrão em `BOTTOM_DEFAULT`; a escolha fica em `S.prefs.bottom`. A Inbox não entra na barra (é o ícone do topo).
- `Inbox.level()` / `Inbox.feed()` — cor da bolha (0 vermelho, 1 âmbar, 2 azul) e ordem por prioridade e data; alertas "vistos" em `omnilife.alertSeen.v1`.
- `cleanSpoken` / `splitSpoken` / `AddFb` — limpa a fala do "Pôr na lista" e mostra a confirmação embaixo do campo.
- Topo (v2.12.0, diretriz da plataforma): ☰ (`#hambbtn`) · nome do app (`#brandbtn` = Início) · … · 🔍 `#searchbtn` · 📥 `#inboxbtn` · 👤 `#whoami`. Sem 🏠, sem ⚙️ fixo, sem PT|EN. `whoMenu()` é o menu do 👤 (identidade conectada, Configurações, Tema, extras, Sair). PT|EN (`LANGSW()`) vive em Configurações → Geral e na tela de entrada; a faixa `#adbar` é só do anúncio.
- `.aone-btn` — botão do AssistONE no padrão da plataforma: 58 px, redondo, fundo escuro sempre, anel dourado, `aone-flutua` 3,2 s; `aria-expanded` acompanha o balão.

## Publicar uma versão nova

1. Subir `APP_VERSION` no `index.html`. Os três arquivos mestres (`janela.js`, `cofre.js`, `diretrizes.js`) só mudam por cópia do rootify-one (`node teste/rodar.js` confere o sha256).
2. Acrescentar a versão no topo do `versoes.json` (e na cópia embutida `VERSOES_EMB`).
3. Subir o número em `sw.js` (`CACHE = APPC + "vN"`; arquivo novo do app entra também na lista do `install`) e a `versaoApp` do `diretrizes-config.js`.
5. Nome do zip: `OMNI-LIFE-ONE vX.Y.Z dd-Mmm-aaaa HHhMMm.zip` (hora de Brasília).
4. Se mudou algo de nuvem: novo arquivo `supabase/omnilife-one-vN.sql` (idempotente, regras do C10 em `PLATAFORMA-DADOS.md`), levar para revisão e só depois rodar no Supabase. O Firebase não é mais usado.
7. Testes automáticos (Playwright, uma vez: `npm install -D playwright && npx playwright install chromium`): `node teste/rodar.js`
   (`teste/README.md`): mestres iguais, janelas em 390 px e no computador, cofre da Fase 3, veículos (2.20.0). Só valores de mentira.
   Mexeu em conta, PIN ou aparelhos: rode também com o MoneyTRIO baixado ao lado, `MONEYTRIO=<pasta do investify-me> node teste/rodar.js`
   (o teste cruzado `aparelhos-cruzado-omni.js` abre os dois apps no mesmo banco de mentira).
6. Teste da nuvem: só contra um Supabase **local** com a base real + `supabase/omnilife-one-v1.sql` (nunca contas de teste na produção);
   o teste desvia as chamadas do endereço de produção para `http://127.0.0.1:54321`.
