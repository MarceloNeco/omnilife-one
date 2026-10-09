# OmniLifeONE — arquitetura (leia antes de mexer)

Briefing para qualquer pessoa ou IA que for alterar este repositório.
Site estático no GitHub Pages: solverone.com.br/omnilife-one (antes marceloneco.github.io/omnilife-one; o GitHub redireciona). Sem servidor, sem build,
sem framework: HTML, CSS e JavaScript puros.

## Arquivos

| Arquivo | O que é | Pode mexer? |
|---|---|---|
| `index.html` | O app inteiro (HTML + CSS + JS num arquivo só) | Sim, com cuidado (ver abaixo) |
| `sw.js` | Service worker: modo sem internet e avisos | Só subir o número `v…` a cada versão |
| `versoes.json` | Histórico de versões (PT/EN) mostrado em Configurações → Versões & Novidades | Acrescentar a versão nova no topo |
| `recados.json` | Avisos do administrador para todos (Inbox) | Sim — ver `recados-MODELO-OmniLifeONE.json` |
| `clima.json` | Reserva local da config do clima (a master vem do RootifyONE em `solverone-dados/clima.json`) | Sim — ver `clima-MODELO-OmniLifeONE.json` |
| `rotas.json` | Reserva local da config de deslocamento/rotas (a master vem do RootifyONE em `solverone-dados/rotas.json`) | Sim — ver `rotas-MODELO-OmniLifeONE.json` |
| `manifest.webmanifest`, ícones | Instalar como app | Raramente |
| `regras-firestore-OmniLifeONE.txt` | Regras do Firebase de antes (o Firebase **não** será usado — decisão de 03/Out/2026). Fica como referência das regras que o SQL reproduz | Não (arquivo de referência) |
| `PLATAFORMA-DADOS.md` | Cópia fiel do contrato de dados da plataforma SolverONE (C1–C10) | Não: o contrato muda só por versão nova, combinada com o RootifyONE |
| `PLANO-SUPABASE-OmniLifeONE.md` | Plano da ida para a conta e o banco SolverONE (Supabase): tabela por parte do app, o que fica no aparelho, cifrado (C7), modo sem internet, pontos do contrato | Sim |
| `supabase/omnilife-one-v1.sql` | Tabelas `omni_*`, regras de acesso (RLS), funções e LGPD no banco da plataforma. Roda depois da base comum do RootifyONE (`sol_*`, com `sol_grupos.governanca`); confere a base antes de criar qualquer coisa | Só com revisão (C10); nunca rodar antes da revisão |
| `LEIA-ME-OmniLifeONE.html` | Passo a passo para o dono do app | Sim |
| `ARQUITETURA.md`, `CREDITOS.md` | Este briefing e as licenças de terceiros | Sim |
| `PENDENCIAS.md` | **Lista oficial e viva de pendências** (número, descrição, origem, situação) — combinado com o dono em 04/Out/2026. A cada entrega: atualizar a situação, acrescentar o que surgiu e dizer no resumo o que fechou | Sim, a cada entrega |
| `ajuda-botao.png`, `ajuda-icone.png`, `assistone-hd.png` | Arte do AssistONE. O botão flutuante usa `ajuda-botao.png` direto (arquivo canônico da plataforma, igual em todos os apps); os balões e o cartão em ⚙ usam a cópia pequena embutida `AONE_IMG` | Não trocar `ajuda-botao.png` por outra arte (é padrão da plataforma) |

## Nunca

- Nunca pôr chave de IA, token do Telegram, senha ou dado pessoal no repositório (é público).
  Chaves ficam só no navegador da pessoa (`S.prefs.keys` + cofre compartilhado `LS.mtKeys`).
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
  encerrada/banida, aparelho desconectado e saída da família (`Cofre.apagarDoAparelho`) — o cofre continua na nuvem; a fila do
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
  marcado `recusado` (aparece em `Sync.view`, "Tentar de novo"). **Só no aparelho** (`NUVEM_LOCAL`): `health`, `docs`, `files`
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
  - **Chave do cofre da família (CF)**: 32 bytes aleatórios (`kv`, `fk` = id da chave). Cifra cada registro do cofre
    (`selar`/`abrir`, AES-GCM 256). Vai para cada chefe/responsável embrulhada com a chave pública dele (`embrulhar`, RSA-OAEP 3072
    SHA-256, `sol_guardar_chave_grupo`); quem tem o cofre aberto libera para quem falta (`distribuir`, ao abrir e no `poll`, no
    máximo a cada 2 min; registro sem segredo em `settings/cofre` = `{ fk, kv, membros: { uid: { kid, seq, fk } } }`; antes de
    decidir, `distribuir` puxa o mais novo, e conflito nesse registro **nunca vira pergunta** — `CloudDriver.enviar` fica com o deste
    aparelho; se faltar alguém, a próxima liberação embrulha de novo). Mínimo
    privilégio: só chefe e responsável recebem a CF; o contato de emergência abre pelo envelope `_em`.
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
  do cofre — o teste `JARGAO` confere. **Nomes (2.15.2):** na tela o cofre se chama **"Senhas da casa"** (no código continua `Cofre`/`Vault`/coleção `vault`; não renomear o código). Tipos (`VT_KINDS`): `wifi`, `portao`, `senha`, `conta`, `seguro`, `outro`; os antigos `apolice`, `contrato` e `escritura` aparecem como `seguro` (`VT_ANTIGO`, `vtKind()`) e passam a ser salvos assim ao editar. A senha do modo "só neste aparelho" aparece como "senha principal". O "cofre de chaves" de IA (`KeyVault`) é outra coisa e continua com esse nome.
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
- `SCREENS` — cada aba (`home`, `inbox`, `shop`, `agenda`, `security`, `family`, `settings`…).
- `Nav` — ÚNICO ponto do histórico (botão Voltar do celular). Não use `pushState` fora dele.
- `modal()` — janelas (já registram no `Nav`). `Drawer` — menu ☰.
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

1. Subir `APP_VERSION` no `index.html`.
2. Acrescentar a versão no topo do `versoes.json` (e na cópia embutida `VERSOES_EMB`).
3. Subir o número em `sw.js` (`CACHE = APPC + "vN"`).
5. Nome do zip: `OMNI-LIFE-ONE vX.Y.Z dd-Mmm-aaaa HHhMMm.zip` (hora de Brasília).
4. Se mudou algo de nuvem: novo arquivo `supabase/omnilife-one-vN.sql` (idempotente, regras do C10 em `PLATAFORMA-DADOS.md`), levar para revisão e só depois rodar no Supabase. O Firebase não é mais usado.
6. Teste da nuvem: só contra um Supabase **local** com a base real + `supabase/omnilife-one-v1.sql` (nunca contas de teste na produção);
   o teste desvia as chamadas do endereço de produção para `http://127.0.0.1:54321`.
