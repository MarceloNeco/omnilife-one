# Testes automáticos do OmniLifeONE

Rodam no computador, num Chromium de verdade, contra um servidor de arquivos simples (`rodar.js` sobe e derruba sozinho).
Só valores de mentira: nenhuma chave, token ou senha de verdade em código, teste, commit ou conversa.

**Uma vez só** (na pasta do OmniLifeONE):
```
npm install -D playwright
npx playwright install chromium
```

**Para rodar**:
```
node teste/rodar.js
```
Outra porta (se a 8098 estiver ocupada): `PORTA=8096 node teste/rodar.js`. Um arquivo só, com um servidor já no ar:
`BASE=http://localhost:8096 node teste/janelas-omni.js`. Onde o Playwright está instalado em outro lugar: `NODE_PATH=<pasta dos node_modules>`.

| Arquivo | O que confere |
|---|---|
| `mestres.js` | `janela.js`, `cofre.js` e `diretrizes.js` iguais aos mestres do rootify-one (sha256); ordem na página (`janela.js` → `cofre.js` → `diretrizes.js` → `diretrizes-config.js`); os quatro no pré-carregamento do `sw.js`; a versão bate no `index.html`, no config, no `versoes.json` e na cópia embutida; `cofre: { proteger: true }`; nenhum `alert()`, `confirm()` ou `prompt()` do navegador. |
| `janelas-omni.js` | A passada das janelas, em 390 px e no computador, em modo visitante: janela de formulário trava a rolagem e os toques de trás, o cabeçalho fixo não pula, fecha pelo ✕, pelo botão, por Esc, pelo Voltar e por toque na parte escura (arrastar de dentro para fora não fecha), a página volta ao mesmo lugar; texto digitado pergunta "Descartar?" (Continuar/Descartar; Esc, toque fora e Voltar), a busca não pergunta; uma janela por vez; a confirmação curta de dentro de uma janela abre por cima (alertdialog) e fecha junto; a ajuda de dentro de uma janela expande dentro dela; gaveta ☰, menu do perfil, SOS e tour como janelas (Esc, Voltar, toque fora, ✕, foco de volta); o aviso (toast) aparece por cima da janela; tela de bloqueio só trava a rolagem; anúncio com contagem 3, 2, 1; nenhum alert/confirm/prompt nativo e nenhum erro de script. |
| `cofre-omni.js` | Fase 3 do cofre, em 390 px e no computador: sem segredo guardado nunca pede PIN; os segredos antigos (IA, clima, trânsito, token do Telegram, apikey do WhatsApp) vão sozinhos para o cofre e somem do `localStorage`, do `sessionStorage` e das preferências em memória (o resto das preferências fica); PIN ao abrir e ao recarregar ("Agora não" deixa trancado), tranca ao sair, sem uso e escondido, e o Modo Vigilante ligado só adia; chave guardada nunca vem para o campo ("✓ Guardado no cofre", "Mostrar a chave guardada" pede o PIN por cima da janela e some em 30 s), chave colada pergunta "Descartar?"; o painel da digital aparece na tela de chaves do módulo (e o `index.html` não encaixa painel próprio); a apikey do WhatsApp só no cofre. |
