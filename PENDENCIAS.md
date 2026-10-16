# OmniLifeONE — pendências (lista oficial e viva)

Combinado com o dono do projeto em 04/Out/2026: esta é **a** lista de pendências do app. A cada entrega, a situação de
cada item é atualizada aqui e o resumo da entrega diz o que fechou. Item novo entra no fim, com o próximo número
(números não mudam nem são reaproveitados).

**Situações:** 🟡 aberta · 🔵 em andamento · ⏸ aguardando decisão do dono · ✅ feita (com a versão)

**Prioridade atual (04/Out/2026):** experiência para leigos (pense numa dona de casa ou empregada doméstica sem
experiência digital) vem **antes** de qualquer recurso novo.

| # | Pendência | Origem | Situação |
|---|---|---|---|
| 1 | Linguagem para leigos nas telas do Cofre: textos, ajuda e mensagens com palavras simples e exemplos | Teste real da 2.15.0 no celular (Samsung), 04/Out/2026 | ✅ 2.15.1 (textos e ajuda); nomes principais no #2 |
| 2 | Nomes novos para "Cofre" e para os tipos de item | idem | ✅ 2.15.2 — o dono pediu para escolher pelas melhores práticas (04/Out/2026): "Senhas da casa" e 6 tipos (Wi-Fi; Portão, alarme e cadeado; Site ou aplicativo; Banco; Seguro, contrato ou escritura; Outro segredo). O dono vai refinar depois |
| 3 | Linguagem para leigos nas demais telas (Início, Compras, Agenda, Família, Configurações, Ajuda…) | idem | 🔵 em andamento — feitos: Senhas da casa (2.15.1 e 2.15.2, inclusive os papéis e a ajuda que citam o antigo "cofre"), instalar no celular, aviso de sincronia, textos do Início e das Configurações (2.15.3); os nomes principais do Início e das Configurações aguardam o dono (#20); próximas: Compras, Agenda, Família e Ajuda |
| 4 | Formulário do Cofre: ao escolher o tipo, mostrar só os campos daquele tipo; tipos com exemplos | idem | ✅ 2.15.1 |
| 5 | Campo "Anotações" aparecendo duas vezes no formulário do Cofre | idem | ✅ 2.15.1 — formulário refeito, com teste garantindo um só campo; confirmado pelo dono no celular em 05/Out/2026 (formulário do Wi-Fi com "Anotações" uma vez só) |
| 6 | Primeiro uso guiado do Cofre: passo a passo na tela, explicando o que é e o que fazer | idem | ✅ 2.15.1 |
| 7 | Depois que a internet volta, mostrar "Tudo sincronizado ✓" por alguns segundos | idem | ✅ 2.15.1 — confirmado pelo dono no celular e no computador em 05/Out/2026 |
| 8 | Início → "Usar sem internet e ícone na tela inicial" não instalava nada no celular | idem | ✅ 2.15.1 — agora instala (quando o navegador deixa) ou mostra o passo a passo do navegador em uso; confirmado em 05/Out/2026: instalado pelo Chrome no Samsung, funciona sem internet |
| 9 | Samsung Internet: instalar pelo ícone da barra de endereço gera alerta do Google Play Protect ("App de risco bloqueado — criado para uma versão mais antiga do Android") | idem | ✅ 2.15.1 — o alerta vem do pacote que o navegador da Samsung monta (o manifesto do app não muda isso); o app detecta o navegador da Samsung e orienta a instalar pelo Chrome, com botão que abre o Chrome; em 05/Out/2026 o dono usou o app instalado pelo Chrome |
| 10 | Arquivo das diretrizes gerais atualizado não chegou ao dono | idem | ✅ reenviado em 04/Out/2026 |
| 11 | Trocar a chave do cofre da família quando um responsável sai ou perde o papel (hoje ele não recebe mais nada novo, mas o que já tinha baixado continua legível para ele) | 2.15.0 (limite registrado) | 🟡 aberta |
| 12 | Saúde, documentos e anexos (fotos e PDF, inclusive os do cofre) na nuvem, cifrados com a chave da família; arquivos no Storage `sol-arquivos` | Plano da Etapa 2 (antes listado na 2c) | 🟡 aberta |
| 13 | Avisos com o app fechado (Web Push) | Extras da 2b | 🟡 aberta (pode precisar de serviço novo) |
| 14 | 48 h automáticas nos pedidos sobre chefes (`pg_cron`) | Extras da 2b | 🟡 aberta (precisa de SQL novo — só com autorização) |
| 15 | "Meus contatos" na conta SolverONE | Extras da 2b | 🟡 aberta (tabela nova — só com autorização) |
| 16 | Etapa 2d: ponte entre apps (`sol_ponte`), tirar o Firebase do código, LEIA-ME e página de teste | Plano da Etapa 2 | 🟡 aberta |
| 17 | PIN curto do cofre: se alguém copiar os arquivos internos do aparelho, um PIN de 6 números pode ser descoberto por computador; sugerir PIN maior, letras ou digital | 2.15.0 (limite registrado) | 🟡 aberta |
| 18 | No computador, as Senhas da casa diziam "Usar neste celular" (e outros "celular" que aparecem no computador) | Teste real da 2.15.2 no celular (Samsung, app instalado pelo Chrome) e no computador, 05/Out/2026 | ✅ 2.15.3 — o app diz "computador", "tablet" ou "celular" conforme o aparelho; onde fala do aparelho de outra pessoa, diz "aparelho" |
| 19 | Na primeira vez num aparelho novo, deixar claro que vai precisar do papel com o código de recuperação | idem | ✅ 2.15.3 — antes do botão, o aviso "Pegue o papel com o código de recuperação", com os passos e o que fazer sem o papel; o passo a passo também avisa. Quem nunca usou vê os 3 passos (anotar o código, PIN, outro responsável libera) |
| 20 | Nomes principais do Início e das Configurações (abas, títulos dos quadros e passos do "Deixe o OmniLifeONE pronto") | Pedido do dono em 05/Out/2026 ("me mostre a proposta antes de trocar") | ✅ 2.15.4 — decisão do dono em 08/Out/2026: ♿ Acessibilidade fica; 🆕 "Versões" vira **"Versões & Novidades"**; 📲 "Sem internet" vira **"Instalar app para acessar sem internet"**, com o aviso do que funciona sem internet. **O dono recusou o resto da proposta**: os outros nomes ficam como estão |
| 21 | ⚙ → Dados, com a família na nuvem: o texto de "Encerrar minha conta" manda usar "Apagar dados deste aparelho", que só aparece no modo "só neste aparelho" | Revisão da 2.15.3 (achado meu) | ✅ 2.15.4 — sem mudar o banco: quadro novo "Apagar o que está só neste aparelho" (só na nuvem, só chefe ou responsável) apaga Saúde, Documentos, fotos e arquivos deste aparelho depois de oferecer a cópia protegida com os arquivos (se a cópia sair sem as fotos, o app pergunta de novo); conta, fila e o que está na internet não mudam. Se ainda houver a cópia antiga "só neste aparelho" (de antes de levar para a nuvem), manda apagá-la primeiro; foto que outra família deste aparelho também usa fica com ela; os anexos das senhas antigas ficam com elas; se algo mudar enquanto a pessoa confirma, não apaga nada. O "Encerrar minha conta" na nuvem aponta para ele, diz quando já não sobrou nada e, para membro, explica que o responsável precisa entrar neste mesmo aparelho. De quebra: o "Já tenho uma cópia" antes de apagar não diz mais que "os dados continuam aqui", e encerrar a conta no modo "só neste aparelho" não esvazia mais da tela as Senhas da casa locais |
| 22 | Sem internet, várias telas mostram erro técnico em vez de "Sem internet agora": "Failed to fetch" ou "load https://cdn…" (ler foto ou PDF, IA, consultar CEP, recusar pedido de entrada, encerrar a conta) | Levantamento do que funciona sem internet (2.15.4) | 🟡 aberta |
| 23 | Sem internet: "Salvar no aparelho" mostra "✓ Pronto" mesmo sem salvar nada; o QR do Wi-Fi não responde nem avisa; avisos pelo ntfy (pedido das crianças, recado urgente, Assume a Casa) falham sem avisar ninguém | idem | 🟡 aberta |
| 24 | Família na nuvem aberta já sem internet: convites, pedidos de entrada, histórico e aparelhos conectados aparecem vazios (só "quem é da família" fica guardado no aparelho) | idem | 🟡 aberta |
| 25 | Limpeza incompleta ou larga demais: desconectar este aparelho por outro aparelho apaga o sessionStorage inteiro da aba (inclusive o de outros apps da SolverONE); no modo "só neste aparelho", "Apagar tudo" apaga as fotos e arquivos de todas as famílias do aparelho (inclusive as da nuvem, que só existem aqui) e deixa o registro de alterações, os contatos pessoais, as chaves de IA e a digital; "Meus contatos" e o registro de alterações também ficam na nuvem (têm o próprio botão de apagar) | Levantamento e revisão do #21 (2.15.4) | 🟡 aberta |
| 26 | As diretrizes gerais ainda chamam a opção de "Usar sem internet" (vale para todos os apps); decidir se o nome novo "Instalar app para acessar sem internet" passa para as diretrizes e os outros apps | Decisão do #20 (08/Out/2026) | ⏸ aguardando o dono (regra zero: não mudei as diretrizes) |
| 27 | Padrão novo da plataforma: ⚡ Modo DEUS com todas as funções principais, tela de manutenção (id "app"), 💬 feedback dos usuários e trabalho demorado no `Fundo` | Tarefa autorizada pelo dono no RootifyONE (16/Out/2026) | ✅ 2.17.0 — 39 ids no `recursos-do-app.json`; módulo comum 1.9.1 só com feedback, fundo, compat e interruptores; IA e leitura de foto no `Fundo` |
| 28 | Pergunta do dia do feedback ("Está gostando hoje?") — o módulo tem, mas ficou desligada (`perguntaDiaria: false`) porque não estava na lista autorizada | Entrega 2.17.0 | ⏸ aguardando o dono |
| 29 | 💬 também no balão do AssistONE do app (o AssistONE do Omni é próprio, não o `assistone.js`) | Entrega 2.17.0 | ⏸ aguardando o dono |
| 30 | Feedback de quem está com a conta conectada vai sem identificar a conta (só o id anônimo do aparelho); dá para mandar junto o acesso da conta, se o dono quiser ver quem mandou | Entrega 2.17.0 | ⏸ aguardando o dono |
| 31 | Importar cópia protegida e "Vários de uma vez" (Documentos) ainda não usam a pílula do `Fundo` (só IA e leitura de foto usam) | Entrega 2.17.0 | ⏸ aguardando o dono |
| 32 | Partes que ainda não têm interruptor próprio: subpartes da Inbox, Compras › Histórico, Duas casas, Lugares (só CEP) e as abas de ⚙ (de propósito: Configurações nunca some) | Entrega 2.17.0 | ⏸ aguardando o dono |
| 33 | Leitura de segurança, Fase 1: chaves de IA, do clima e do trânsito e o token do Telegram fora do navegador em texto aberto, no cofre comum da plataforma (`cofre.js`) | Tarefa autorizada pelo dono no RootifyONE (16/Out/2026) | ✅ 2.18.0 — `cofre.js` 1.0.0 + módulo comum 1.10.0; as chaves antigas (`investifyme.chaves.v1`, `omnilife.prefs.v1`) vão sozinhas para o cofre ao criar o PIN; ⚙ mostra "🔐 Guardado no cofre" e "🔒 Trancar o cofre agora"; backup sem chaves |
| 34 | A `apikey` do CallMeBot (WhatsApp automático) de cada contato de alerta continua em texto aberto nas preferências (`alertas.recips[].waKey`): levar também para o cofre (um nome por contato) | Entrega 2.18.0 (ficou fora da Fase 1: não estava na lista autorizada) | ⏸ aguardando o dono |
| 35 | O MoneyTRIO lia as chaves que o Omni gravava em `investifyme.chaves.v1`; agora elas ficam só no cofre (`ia:<provedor>`). Conferir no chat do MoneyTRIO se ele já lê pelo cofre (pelo master, ele usa `dgo:global:ia`) | Entrega 2.18.0 | ⏸ aguardando o dono |
| 36 | Proteção extra recomendada pelo master do cofre: Content-Security-Policy no `index.html` (o app ainda carrega bibliotecas de CDN, ex.: Tesseract, TensorFlow, jsPDF, Leaflet — precisaria listar cada endereço) | Entrega 2.18.0 (limite honesto do `cofre.js`) | ⏸ aguardando o dono |

## Histórico das entregas

- **2.15.1 (04/Out/2026):** fecharam #1, #4, #5, #6, #7, #8, #9 e #10; #3 em andamento; #2 aguardando aprovação.
- **2.15.2 (04/Out/2026):** fechou #2 ("Senhas da casa" e 6 tipos); #3 continua em andamento.
- **Teste do dono em 05/Out/2026 (2.15.2, Samsung com o app instalado pelo Chrome, e computador):** sem internet e sincronia OK; item criado sem internet no celular apareceu no computador; formulário do Wi-Fi OK ("Anotações" uma vez só). Confirmou #5, #7, #8 e #9; abriu #18, #19 e #20.
- **2.15.3 (05/Out/2026):** fecharam #18 e #19; #3 avançou (textos do Início e das Configurações); #20 aguardando o dono (proposta de nomes com prints); novo #21.
- **2.15.4 (09/Out/2026):** fecharam #20 (decisão do dono de 08/Out: só "Versões & Novidades" e "Instalar app para acessar sem internet"; recusou o resto) e #21; novos #22 a #26 (achados do levantamento do que funciona sem internet e do #21).
- **2.16.0 (10/Out/2026):** o app passa a obedecer ao Controle dos apps do RootifyONE (`recursos.js`): AssistONE, anúncios e dicas por tela do AssistONE. Lista em `recursos-do-app.json`.
- **2.17.0 (16/Out/2026):** fechou #27 (Modo DEUS com 39 funções, manutenção, 💬 feedback, IA no `Fundo`; tela de entrar sem rolagem lateral em 320 px); novos #28 a #32 (sugestões, não feitas).
- **2.18.0 (16/Out/2026):** fechou #33 (chaves e token do Telegram no cofre comum, com mudança automática das antigas); novos #34 a #36 (sugestões, não feitas).

## Proposta de nomes do Início e das Configurações (#20, 05/Out/2026)

**Decisão do dono (08/Out/2026):** aplicar só ♿ Acessibilidade = fica como está; 🆕 Versões → **"Versões & Novidades"** (EN
"Versions & What's new"); 📲 Sem internet → **"Instalar app para acessar sem internet"** (EN "Install the app to use offline"),
com aviso do que funciona sem internet. **O dono recusou todo o resto desta tabela**: os outros nomes ficam como estão hoje.
Aplicado na 2.15.4.

Só os nomes; os textos em volta já foram simplificados na 2.15.3. Prints "nomes de hoje | proposta" na entrega 2.15.3.

| Onde | Hoje | Proposta | Por quê |
|---|---|---|---|
| Início, quadro | Deixe o OmniLifeONE pronto | Primeiros passos | expressão conhecida, mais curta |
| Início, passo | Preencher a carteira vital | Preencher a ficha de saúde | "carteira vital" não diz o que é |
| Início, passo | Mapear a casa (Onde está?) | Anotar onde ficam as coisas (Onde está?) | "mapear" soa técnico |
| Início, passo | Levar a família para a nuvem | Conectar a família (cada um no seu celular) | diz o resultado, sem "nuvem" |
| Início, atalho | Colar e organizar | Colar mensagem | o uso mais comum é colar uma mensagem |
| Configurações, aba | ☁️ Nuvem | 👨‍👩‍👧 Família conectada | idem "nuvem" |
| Configurações, aba | ♿ Acessibilidade | 👓 Letra e leitura | o que tem dentro: tamanho da letra, contraste, leitura em voz alta |
| Configurações, aba | 📶 Rede | 📶 Wi-Fi e dados | palavras que a pessoa vê no celular |
| Configurações, aba | 📲 Sem internet | 📲 Instalar o app | o que a pessoa vai fazer ali |
| Configurações, aba | 🔗 Integrações | 🔗 Outros apps | MoneyTrio, Alexa, Drive, mercados |
| Configurações, aba | 💾 Dados | 💾 Cópia e dados | o principal da aba é a cópia |
| Configurações, aba | 🆕 Versões | 🆕 Novidades | o que a pessoa procura ali |
| Configurações, quadro | Família na nuvem | Família conectada | acompanha a aba |
| Configurações, quadro | Backup | Cópia de segurança | sem inglês |
| Configurações, quadro | Registro de alterações | Quem mudou o quê | diz o que mostra |
| Configurações, quadro | Barra de atalhos | Seus atalhos | mais curto |
| Configurações, quadro | Rede e dados móveis | Wi-Fi e dados do celular | acompanha a aba |
| Configurações, quadro | Usar sem internet | Instalar e usar sem internet | acompanha a aba |

Ficam como estão: Geral, IA (a aba explica logo no topo que é opcional), Avisos, Clima, SOS, Cheguei, Estou saindo, Recado,
Lembrete rápido, Onde está?, Lista de compras.
