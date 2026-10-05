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
| 20 | Nomes principais do Início e das Configurações (abas, títulos dos quadros e passos do "Deixe o OmniLifeONE pronto") | Pedido do dono em 05/Out/2026 ("me mostre a proposta antes de trocar") | ⏸ proposta com prints na entrega 2.15.3 — aguardando o dono |
| 21 | ⚙ → Dados, com a família na nuvem: o texto de "Encerrar minha conta" manda usar "Apagar dados deste aparelho", que só aparece no modo "só neste aparelho" | Revisão da 2.15.3 (achado meu) | 🟡 aberta — decidir como apagar, na nuvem, o que ficou só no aparelho (Saúde, Documentos, arquivos) |

## Histórico das entregas

- **2.15.1 (04/Out/2026):** fecharam #1, #4, #5, #6, #7, #8, #9 e #10; #3 em andamento; #2 aguardando aprovação.
- **2.15.2 (04/Out/2026):** fechou #2 ("Senhas da casa" e 6 tipos); #3 continua em andamento.
- **Teste do dono em 05/Out/2026 (2.15.2, Samsung com o app instalado pelo Chrome, e computador):** sem internet e sincronia OK; item criado sem internet no celular apareceu no computador; formulário do Wi-Fi OK ("Anotações" uma vez só). Confirmou #5, #7, #8 e #9; abriu #18, #19 e #20.
- **2.15.3 (05/Out/2026):** fecharam #18 e #19; #3 avançou (textos do Início e das Configurações); #20 aguardando o dono (proposta de nomes com prints); novo #21.

## Proposta de nomes do Início e das Configurações (#20, 05/Out/2026 — ainda não aplicada)

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
