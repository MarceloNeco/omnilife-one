# OmniLifeONE — arquitetura (leia antes de mexer)

Briefing para qualquer pessoa ou IA que for alterar este repositório.
Site estático no GitHub Pages: solverone.com.br/omnilife-one (antes marceloneco.github.io/omnilife-one; o GitHub redireciona). Sem servidor, sem build,
sem framework: HTML, CSS e JavaScript puros.

## Arquivos

| Arquivo | O que é | Pode mexer? |
|---|---|---|
| `index.html` | O app inteiro (HTML + CSS + JS num arquivo só) | Sim, com cuidado (ver abaixo) |
| `sw.js` | Service worker: modo sem internet e avisos | Só subir o número `v…` a cada versão |
| `versoes.json` | Histórico de versões (PT/EN) mostrado em Configurações → Versões | Acrescentar a versão nova no topo |
| `recados.json` | Avisos do administrador para todos (Inbox) | Sim — ver `recados-MODELO-OmniLifeONE.json` |
| `clima.json` | Reserva local da config do clima (a master vem do RootifyONE em `solverone-dados/clima.json`) | Sim — ver `clima-MODELO-OmniLifeONE.json` |
| `rotas.json` | Reserva local da config de deslocamento/rotas (a master vem do RootifyONE em `solverone-dados/rotas.json`) | Sim — ver `rotas-MODELO-OmniLifeONE.json` |
| `manifest.webmanifest`, ícones | Instalar como app | Raramente |
| `regras-firestore-OmniLifeONE.txt` | Regras do Firebase de antes (o Firebase **não** será usado — decisão de 03/Out/2026). Fica como referência das regras que o SQL reproduz | Não (arquivo de referência) |
| `PLATAFORMA-DADOS.md` | Cópia fiel do contrato de dados da plataforma SolverONE (C1–C10) | Não: o contrato muda só por versão nova, combinada com o RootifyONE |
| `PLANO-SUPABASE-OmniLifeONE.md` | Plano da ida para a conta e o banco SolverONE (Supabase): tabela por parte do app, o que fica no aparelho, cifrado (C7), modo sem internet, pontos do contrato | Sim |
| `supabase/omnilife-one-v1.sql` | Tabelas `omni_*`, regras de acesso (RLS), funções e LGPD no banco da plataforma. Roda depois da base comum (`sol_*`) | Só com revisão (C10); nunca rodar antes da revisão |
| `LEIA-ME-OmniLifeONE.html` | Passo a passo para o dono do app | Sim |
| `ARQUITETURA.md`, `CREDITOS.md` | Este briefing e as licenças de terceiros | Sim |
| `ajuda-botao.png`, `ajuda-icone.png`, `assistone-hd.png` | Arte do AssistONE. O botão flutuante usa `ajuda-botao.png` direto (arquivo canônico da plataforma, igual em todos os apps); os balões e o cartão em ⚙ usam a cópia pequena embutida `AONE_IMG` | Não trocar `ajuda-botao.png` por outra arte (é padrão da plataforma) |

## Nunca

- Nunca pôr chave de IA, token do Telegram, senha ou dado pessoal no repositório (é público).
  Chaves ficam só no navegador da pessoa (`S.prefs.keys` + cofre compartilhado `LS.mtKeys`).
- Nunca reescrever o `index.html` inteiro: as mudanças são cirúrgicas.
- Nunca apagar caches de outros apps no `sw.js` (todos dividem o mesmo endereço): o nome do
  cache é `dgo-omnilife-vN` e o `activate` só apaga os que começam com `dgo-omnilife-`.
- Nunca usar chave de `localStorage` sem o prefixo `omnilife.` (colide com os outros apps).

## Mapa do `index.html` (procure pelos nomes)

- `S` — estado global. `LS` — nomes das chaves do localStorage. `APP_VERSION` — versão.
- `tt(pt, en)` — todo texto nasce nas duas línguas. `fmtDate` — datas `24/Set/2026` / `Sep/24/2026`.
- `DB` — dados (drivers: memória/visitante, IndexedDB/este aparelho, Firestore/nuvem). `DB.patch` para campos.
- `Cloud` / `FB` — Firebase (login, família, convites seguros, aprovações, histórico de segurança). **Vai sair na Etapa 2:**
  a nuvem passa a ser a conta e o banco SolverONE (Supabase) — ver `PLANO-SUPABASE-OmniLifeONE.md`. Mapa: coleções → `omni_docs`;
  família → `sol_grupos` + `sol_grupo_membros` + `omni_familia` (papel `admin` = `chefe`); convites → `sol_grupo_convites` +
  `omni_convite_info`; `joinRequests` → `omni_pedidos_entrada` (+ código em `omni_pedidos_verificacao`); `gov` → `omni_governanca`;
  `devices` → `omni_aparelhos`; `comsg` → `omni_combinados`; `audit` → `omni_historico`; arquivos → Storage `sol-arquivos/omnilife-one/<grupo>/…`.
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
- `Versions` — tela de versões (lê `versoes.json`, com a lista embutida `VERSOES_EMB` como reserva; agrupa por dia).
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
- `Offline` — Usar sem internet (fala com o `sw.js` por mensagem) e atalho na tela inicial.
- `Compat` — quadro de compatibilidade do aparelho/navegador (só aparece com problema).
- `Sess` — sessão da aba (recarregar não pede PIN por 30 min) e volta ao mesmo lugar depois de entrar.
- `Batch` — vários arquivos de uma vez (Documentos), com fila, duplicados e conferência.
- `ChangeLog`, `Telem` — registro de alterações local e relatório de erros com consentimento.
- `Gov` — governança da família (nuvem): pedidos em `families/{fid}/gov` — `hd_<uid>` (rebaixar/remover chefe: outro chefe aprova ou vale em 48 h sem veto), `tr_<fid>` (passar a criação: só com aceite), `em_<uid>` (acesso de emergência ao cofre com espera). `Gov.tick()` executa o que ficou pronto. As regras do Firebase garantem (govOk, headsOk, emergencySelf).
- `Devices` — aparelhos conectados (`families/{fid}/devices`), desconectar à distância. `Grow` — criança que cresce (idade em `policy.gradAge` / `settings.gradAge`). `Areas` — quem cuida de cada área (`settings.areaOwners`). `Duas` — duas casas: `settings.duas`, coleções `coexp` (despesas) e `comsg` (registro que só recebe itens novos).
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
