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
| 2 | Nomes novos para "Cofre" e para os tipos de item (proposta enviada; só muda depois de aprovar) | idem | ⏸ aguardando aprovação |
| 3 | Linguagem para leigos nas demais telas (Início, Compras, Agenda, Família, Configurações, Ajuda…) | idem | 🔵 em andamento — feitos na 2.15.1: Cofre, instalar no celular, aviso de sincronia; próximas: Início e Configurações |
| 4 | Formulário do Cofre: ao escolher o tipo, mostrar só os campos daquele tipo; tipos com exemplos | idem | ✅ 2.15.1 |
| 5 | Campo "Anotações" aparecendo duas vezes no formulário do Cofre | idem | ✅ 2.15.1 — formulário refeito, com teste garantindo um só campo; não consegui reproduzir no emulador: confirmar no celular |
| 6 | Primeiro uso guiado do Cofre: passo a passo na tela, explicando o que é e o que fazer | idem | ✅ 2.15.1 |
| 7 | Depois que a internet volta, mostrar "Tudo sincronizado ✓" por alguns segundos | idem | ✅ 2.15.1 |
| 8 | Início → "Usar sem internet e ícone na tela inicial" não instalava nada no celular | idem | ✅ 2.15.1 — agora instala (quando o navegador deixa) ou mostra o passo a passo do navegador em uso |
| 9 | Samsung Internet: instalar pelo ícone da barra de endereço gera alerta do Google Play Protect ("App de risco bloqueado — criado para uma versão mais antiga do Android") | idem | ✅ 2.15.1 — o alerta vem do pacote que o navegador da Samsung monta (o manifesto do app não muda isso); o app detecta o navegador da Samsung e orienta a instalar pelo Chrome, com botão que abre o Chrome |
| 10 | Arquivo das diretrizes gerais atualizado não chegou ao dono | idem | ✅ reenviado em 04/Out/2026 |
| 11 | Trocar a chave do cofre da família quando um responsável sai ou perde o papel (hoje ele não recebe mais nada novo, mas o que já tinha baixado continua legível para ele) | 2.15.0 (limite registrado) | 🟡 aberta |
| 12 | Saúde, documentos e anexos (fotos e PDF, inclusive os do cofre) na nuvem, cifrados com a chave da família; arquivos no Storage `sol-arquivos` | Plano da Etapa 2 (antes listado na 2c) | 🟡 aberta |
| 13 | Avisos com o app fechado (Web Push) | Extras da 2b | 🟡 aberta (pode precisar de serviço novo) |
| 14 | 48 h automáticas nos pedidos sobre chefes (`pg_cron`) | Extras da 2b | 🟡 aberta (precisa de SQL novo — só com autorização) |
| 15 | "Meus contatos" na conta SolverONE | Extras da 2b | 🟡 aberta (tabela nova — só com autorização) |
| 16 | Etapa 2d: ponte entre apps (`sol_ponte`), tirar o Firebase do código, LEIA-ME e página de teste | Plano da Etapa 2 | 🟡 aberta |
| 17 | PIN curto do cofre: se alguém copiar os arquivos internos do aparelho, um PIN de 6 números pode ser descoberto por computador; sugerir PIN maior, letras ou digital | 2.15.0 (limite registrado) | 🟡 aberta |

## Histórico das entregas

- **2.15.1 (04/Out/2026):** fecharam #1, #4, #5, #6, #7, #8, #9 e #10; #3 em andamento; #2 aguardando aprovação.
