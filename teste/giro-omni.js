/* Parte E (2.27.0) — "Trocar a chave de segurança da família" (girar a chave da família, a CF), no "Supabase de mentira"
   (teste/mock-sol.js): cada aparelho é um contexto do navegador e todos falam com o mesmo banco, que mora neste processo. Nada
   vai para a internet nem para o Supabase de verdade. Pessoas (Ana chefe, Bia responsável, Cris responsável sem chaves, Davi
   membro), senhas, PINs, códigos e chaves: tudo de mentira.
   Etapa E1 (o banco de mentira e a moldura):
     SQL  o banco de mentira faz O MESMO que o SQL da plataforma (sol_giro_situacao e sol_descartar_chaves_antigas): os casos do
          topo de scratchpad/pin-e/sol_descartar_chaves_antigas.sql (recusa nos mesmos casos, com o mesmo "descartar:<motivo>",
          apaga só o que o SQL apaga); sem o SQL (M.semGiroSql) → 404 PGRST202; o gatilho do Omni (M.soChefeGiro: só o chefe muda
          fk/kv, a kv só sobe, o registro e a troca não se apagam); M.depoisDe; a ponte de verdade; M.PKCS8, M.cfVelha, soPub
     G5   depois de uma troca "feita à mão" no banco (em Node), a CF antiga não abre nenhuma linha viva das Senhas da casa nem o
          código de emergência refeito, e a apagada fica como estava (D-E6). Com AES-GCM uma chave diferente sempre falha: o G5
          fica, mas não conta como prova (C15) — a prova é o fk/kv novo e as DUAS camadas abrindo com a nova
   Etapa E2 ("nunca devolver uma chave velha" e as guardas), com a troca feita à mão no banco e um aparelho que ficou com a velha:
     G3   o aparelho velho (Senhas abertas com a CF de antes) não embrulha a velha para ninguém (_distribuir), nem pelo registro
          que estava na fila; o registro do banco não volta (CloudDriver.enviar: fk/kv só para a frente — C4); a carga "família"
          dele recusa (T.aprovarVelho); uma carga "família" velha que chega a um aparelho novo não monta nada (T.recebeuVelha)
     G3c com uma mudança do registro na fila, o _distribuir decide pelo registro DO BANCO (C13)
     G11b a CF só para chefe e responsável (D-E1/C7): um membro com chave pública não recebe; o pedido "para a família" de um
          membro é recusado na carga (a última porta)
     M1   podeMudar e o selar: com a chave velha e no meio da troca, nada se fecha (editar, código de emergência, ficha do carro)
     M2   durante a troca (settings/giro em curso), ninguém entrega a CF; uma "troca" que não é restrito não vale (C9)
     C12  a cópia (backupJSON) não leva o registro nem a troca, e restaurar uma cópia não mexe neles
     N1   o montar com novaCF não cria uma SEGUNDA CF quando a leitura do registro falha por rede, nem com o registro apagado
          (6.1, C4); o criarConta devolve "rede" sem deixar linha na lista
   Etapa E3 (o chaveiro: a atual é a única que FECHA; as de antes só ABREM):
     CH   com metade das linhas ainda fechada com a de antes: todas abrem (a linha diz o fk) e a parte interna passa para a atual
          só na memória (o item aparece e o antigo() diz false); selar e editar fecham sempre com a atual (as duas camadas);
          anexos com enc.fk de uma de antes, sem enc.fk (de antes da 2.27.0) e novos (enc.fk = a atual) abrem; trancar zera
          tudo; um aparelho que já adotou a nova (L.fam[gid].velhas) abre pelo PIN e continua lendo o que é de antes, sem gravar
          nada; nada muda no formato das linhas
   Etapa E4 (perceber a chave nova e o envio que não volta com a velha), com a troca feita à mão no banco:
     G2   o outro aparelho com as Senhas abertas adota a nova no Cloud.poll, sem PIN (aviso), e mostra tudo; fechado, adota ao abrir
          pelo PIN, antes do usarChave (chamado uma vez); L.fam[gid] = a nova e velhas = [a de antes]; o prox de outra troca fica
          (C1.4); sem troca: uma GET só, sem RSA, e nada gravado; de volta à internet, nunca entrega a velha (G3)
     G2b  abrir pelo PIN com o registro do banco demorando: abre já com a que tem (a rede não segura o abrir, revisão final F1) e
          adota quando ele chega, sem esperar o Cloud.poll
     G3D  o aparelho que entrou aprovado pela família (sem a chave pessoal): o cartão "precisa ser aprovado de novo" com o botão (o
          pedido "para a família" sai), a carga recusa, os itens que não abrem saem da tela (C14), a placa do carro nem aparece
          para mudar (C14); reaprovado com o mesmo PIN, as chaves de antes e o prox vêm junto (levarVelha, C8); com outro PIN, não
     G3b  o registro volta para uma chave mais velha (C4): ninguém volta, o cartão "não confere"; entre duas de mesma kv, a do
          registro (buscarMinha); sem a nova embrulhada para ela, a Bia vê "Falta um chefe abrir…" e adota quando ela chega
     G9   B edita sem internet com a velha; a troca acontece; ao voltar, a edição sobe com a nova e sem item duplicado (só mudou o
          cadeado: mesmoConteudo); um conflito de verdade guarda as duas, as duas com a nova; nada chega ao banco com a velha (C2).
          G9c: C, fechado, não manda nada (espera); ao abrir pelo PIN, sobe uma vez com a nova
   Etapa E5 (a troca em si, sem a tela: Giro.executar chamado por page.evaluate; o Fundo é da E6, a tela da E9):
     G0   só abrir o app (recarregar, abrir pelo PIN, as voltas do Cloud.poll, a liberação), sem tocar no botão: o cadeado dos dois
          aparelhos, os anexos, omni_docs, sol_grupo_chaves e as chaves pessoais ficam iguais, byte a byte
     G1   a troca: nasce "preparado" com a nova embrulhada para cada chefe; a nova chega a cada chefe e responsável ANTES da primeira
          linha (C5) e já está no prox; as linhas vivas na nova nas duas camadas, cada uma com CAS próprio (nunca pela fila);
          o código de emergência deixa de valer (o refeito com o código é da E7); a apagada fica (D-E6); o registro, as entregas,
          "feito" sem envelopes, o histórico; o aparelho e os anexos dele na nova; o outro aparelho adota; G5 com ela
     G1c  uma linha gravada com a de antes no meio (um aparelho atrasado): a conferência troca de novo
     C11  itens que já não abriam não travam: a lista antes (Giro.pode) e no fim (estranhas, semInterna)
     F0   Giro.pode: só chefe, só da chave do registro, nada na fila, o SQL da plataforma (C6), o MoneyTRIO, sem segunda chave;
          troca em curso: "Já está trocando no …" (sem HTML) ou "Continuar"
     G7a  recarregar no meio: "Continuar" termina com a mesma nova, só o que faltava, sem entregar de novo nem duplicar
     G7t  as Senhas fecham no meio: para ("Parou porque as Senhas fecharam") e continua depois
     D1   "Desistir" só no "preparado" (antes da entrega); a próxima nasce por cima com a versão seguinte
     G8b  C1: dois aparelhos confirmam juntos — uma troca só, o outro "Já está trocando", ninguém grava outra chave por cima
     G8c  C1: outra troca ficou com a vez — para antes de tocar nas linhas; a nova dele vai para as de antes (não se perde)
     G8d  C1: a vez passou para outro aparelho no meio — a próxima anotação relê e para, sem gravar por cima
     AN   o app fecha no meio de um anexo (antes ou depois do arquivo novo): o anexo continua abrindo; "Continuar" termina
   Etapa E6 (a troca no Fundo, a trava e a pausa):
     FU   Giro.iniciar = trabalho do Fundo (tipo chave-familia): a pílula com o andamento e sem ✕, a tela acesa pedida e solta, o
          aviso antes de fechar, trocar de tela 3 vezes não para, o fim aparece onde a pessoa está
     G7r  recarregar no meio: a pílula "foi interrompido" com "Continuar de onde parou" (aoRetomar); fechadas, as Senhas pedem o PIN
          e mostram tudo (também o já trocado); o cartão "Continuar" termina com a mesma nova
     G7b  o aparelho que trocava fecha no meio: o outro aparelho do mesmo chefe só assume depois do prazo sem notícia e se a troca
          não andou entre duas leituras; "Continuar neste aparelho" termina com a MESMA nova
     G7c  sem internet no meio: "Esperando a internet…" e continua sozinha quando ela volta
     G7d  Sair no meio: a pergunta diz que a troca pausa; ao entrar de novo, PIN e "Continuar"
     G7o  a troca pela metade de outra pessoa: sem cartão e sem assumir
     G8   duas abas do mesmo aparelho: a segunda recebe "Já está trocando em outra janela deste aparelho." (Web Lock)
     G10  5 min sem toque não tranca; "Bloquear agora" pergunta antes; o app escondido > 30 s tranca e a troca pausa (D-E2); PIN,
          tudo aparece, "Continuar". G10b: fechar enquanto espera a internet para na hora. G10v: fechar bem na hora de virar não
          abre as Senhas de novo
     C8   com a troca deste chefe pela metade, "Começar do zero" não aparece (a explicação no lugar) e não roda
     G7f  C8: aprovado de novo pela conta (outro PIN) no meio da troca (depois de virar o registro; G7f2: logo depois de a troca nascer):
          a troca pausa sem gravar no cadeado novo com a chave de antes do aparelho, e "Continuar" termina com a mesma nova
     C16  uma troca esquecida no "preparado" há mais de 24 h vale como desistida; a próxima nasce por cima
     AR   o aparelho que adota a nova arruma os anexos dele (3.9) no Fundo
   Etapa E7 (o código de emergência, seção 4, D-E4):
     G4a  com o código de agora (digitado ao confirmar), ele continua valendo: o MESMO código abre a nova; o contato com o acesso
          liberado abre e vê tudo; o código sai da memória logo depois do passo dele (C16) e nunca fica guardado
     G4b  sem o código, deixa de valer; o chefe vê "Falta um passo" e "Fazer o código novo"; o código velho → "Ainda não há um código
          de emergência que valha"; o novo abre. G4c: código errado = sem código
     G4r  recarregou antes do código: o cartão "Continuar" pede o código de novo (errado não continua). G4j: já refeito, não mexe
     G4f  um código feito sem internet com a de antes nunca sobe; "Fazer o código novo" sobe por cima, sem item a mais
   Etapa E8 (a ponte Saúde → MoneyTRIO, seção 5, C10, D-E10):
     G13  antes, quantos avisos esperam o MoneyTRIO (pela tabela); durante a troca nada vai (pendente); no fim, os velhos do Omni
          marcados ANTES do "feito" e o resumo de novo com a nova; o outro aparelho manda o pendente com a nova. G13d: desligada,
          só marca. G13r: rede lenta ao abrir, o pendente nunca vai com a de antes. G13b: o app cai logo depois do "feito"
     PZ   a rede pendura no meio da troca: cada chamada tem prazo, "Parou sem internet…", e "Tentar de novo" termina
   Etapa E9 (as telas da troca: ⚙ → Segurança e aparelhos → Avançado; o vigia):
     G1t  pela tela: o botão (só chefe) → a confirmação (o que muda, o código de emergência, a cópia, o roteiro, "Entendi", TROCAR) →
          o PIN → a pílula com a tela acesa (gravada por addInitScript) → a janela do fim; no banco, tudo na nova
     G4t  o código de emergência na confirmação: errado não segue; certo continua valendo; nunca guardado
     C52  C5.2: sem outro caminho para a chave pessoal, o aviso forte e o "Entendi o risco" obrigatório
     C53  C5.3: a cópia protegida antes, com o aviso honesto (uma janela por vez)
     C11t C11: "N itens não abrem" e "Apagar os itens que não abrem" (só com o PIN; só o que ainda não abre)
     G13t o roteiro mostra os avisos da Saúde que esperam o MoneyTRIO, com "Conferir de novo"
     G1b  C3: o vigia nunca anda para trás com a troca rodando; G1p: nem com ela parada no meio (a mutação "sem !emCurso" pega aqui)
     G9v  o vigia sobe para a nova, em até 2 voltas do Cloud.poll, as linhas gravadas com a de antes por um aparelho atrasado
     G11  só chefe: a responsável não vê o botão, o ACT direto recusa, e com M.soChefeGiro o banco recusa (403)
     G12b C6: sem a sol_giro_situacao, o botão desligado ("Ainda não dá…") e a confirmação não abre
     AV   os avisos para os outros (8.5, e C16 aos chefes), o cartão "Continuar" no Avançado, AUDIT_TXT e GOV_SENS
     G14  leigo e telas: os textos em PT e EN, 390 px sem rolar para o lado, prints (PRINTS=<pasta>) em 390 e 1280 px
   Etapa E10 ("Terminar a troca", item d: apagar as versões antigas; o SQL de verdade é o teste/sql-giro.js, no PGlite):
     G12  antes da troca → "Termine primeiro…" (a tela e o banco); o MoneyTRIO não migrado → "O MoneyTRIO ainda não terminou…";
          ping-pong → "Falta entregar…"; a confirmação (Entendi, TROCAR, PIN); o banco apaga só as versões antigas de cada pessoa (o
          Davi, que recebeu a versão 1 depois da troca, fica); o registro anota o descarte (CAS) e o botão sai; este aparelho solta
          as chaves de antes; o outro solta na próxima abertura — nunca sem o descarte, e não enquanto algo dele ainda está nelas
     G12s sem o SQL da plataforma: o botão desligado e "Ainda não dá para terminar: falta uma atualização do SolverONE." (C16), nada
          muda; a responsável não vê o botão e ouve "Só um chefe…" sem perguntar ao banco
     G12p C10: pelo botão do fim; o resumo velho do Omni marcado e tenta de novo; um aviso velho que não é do Omni trava ("ponte")
     G12g C9: a troca "feito" gravada por último por uma responsável — o app regrava (CAS) e termina
     G12v C11: o item que já não abria (ficou na de antes) impede; "Apagar os itens que não abrem" (com o PIN); uma linha de chave
          desconhecida nunca é oferecida para apagar
   Etapa E11 (o fechamento: o que a cobertura C1–C16 / D-E1–D-E12 mostrou faltar):
     G7e  C5: o aparelho que trocava se perde no meio (o contexto e o IndexedDB somem com o prox) e a reserva da troca (os
          envelopes) não serve: outro aparelho da Ana, fechado durante a troca, abre pelo PIN e "Continuar neste aparelho" termina
          com a MESMA nova, achada em sol_grupo_chaves (onde ela chegou antes da primeira linha)
     D8   D-E8: qualquer chefe — a Bia, feita chefe (não criou a família), vê o botão e troca (a reserva vai para os dois chefes);
          a Ana, o outro chefe, termina a troca
   Revisão de segurança da 2.27.0 (os achados S1–S4):
     RS1  uma troca pela metade escrita por fora (com a "vez" e o envelope da Ana) que não anda para a frente — a nova com versão
          que não sobe, ou saindo de outra chave que não a do registro — não fecha as Senhas com a chave de fora (C4)
     RS2  o chefe que começou some depois de a nova chegar à família: a outra chefe (D-E8) continua, depois de um prazo maior,
          com a MESMA nova; no "preparado" vale o C16 (se desfaz sozinha)
     RS3  depois de "Terminar a troca", um aparelho com o app de antes entrega a chave antiga (também a quem entrou depois): um
          aparelho atualizado percebe, entrega a de agora, avisa (histórico) e o "Terminar a troca" volta
     RS4  o código de emergência sai da memória quando a troca para por um motivo que "Tentar de novo" não resolve
   Revisão de dados da 2.27.0 (os achados D1–D4):
     RD1  restaurar depois da troca uma cópia com arquivos feita antes não troca os anexos daqui (já na nova) pelos de antes
     RD2  a troca parada no meio, sem o chefe que começou: a responsável continua vendo o que já foi trocado (a nova só abre)
     RD3  o resumo da Saúde de outro aparelho não se perde na troca: ele manda o dele de novo ao adotar a nova
     RD4  a cópia de antes, restaurada depois da troca: o que não volta não fica preso no aparelho e o aviso diz quantos
   O G6 (o MoneyTRIO 3.66 de verdade acompanha a troca) é o teste/giro-moneytrio-omni.js (MONEYTRIO=<pasta>).
   Cada parte começa do mesmo banco (a foto depois do prepararChaves e das Senhas da casa de mentira). Só uma parte: SO=SQL,G3
   Uso: node teste/rodar.js   ·   sozinho: BASE=http://localhost:8099 node teste/giro-omni.js */
const crypto = require('crypto');
const { BASE, criarConferir, iniciar, terminar } = require('./_base');
const { SB, M, db, rpcs, supabase, prepararChaves, agora, b64u, PESSOAS, ANA, BIA, CRIS, DAVI, GID } = require('./mock-sol');
const { aparelho, entrarOmni, senhasDaCasa, semRede, cadeado225 } = require('./_nuvem');

const subtle = crypto.webcrypto.subtle, utf8 = (t) => new TextEncoder().encode(t), b64 = (b) => Buffer.from(b).toString('base64');
const unb64 = (s) => new Uint8Array(Buffer.from(s, 'base64'));
const PIN_A = '736251', PIN_B = '482915', PIN_C = '528061', PINS = [PIN_A, PIN_B, PIN_C];
const CODIGO_EM = 'MNTR-AQWE-ZXCV-1234';   /* código de emergência de mentira */
const FK0 = 'fk-teste', FKN = 'fk-nova';
const espere = (ms) => new Promise((r) => setTimeout(r, ms));
/* espera uma condição do lado do banco (Node) */
async function ate(fn, ms) { const fim = Date.now() + (ms || 8000); while (Date.now() < fim) { if (fn()) return true; await espere(100); } return !!fn(); }
const SO = (process.env.SO || '').split(',').map((s) => s.trim()).filter(Boolean);
const quieto = (p) => p.evaluate(() => { AOne.save({ hello: 1, tour: 1, tips: Object.assign({}, AOne.cfg().tips, { home: 1, settings: 1, house: 1, family: 1 }) }); if (AOne.view) AOne.close(); lsSet(GuiaCofre.K, Date.now()); });
const esperar = (p, fn, arg, ms) => p.waitForFunction(fn, arg, { timeout: ms || 10000 }).then(() => true, () => false);
const janelas = (p) => p.evaluate(() => [...document.querySelectorAll('.modal')].map((m) => m.innerText.replace(/\s+/g, ' ').trim()).join(' || '));
const vigiarAvisos = (p) => p.evaluate(() => { window.__av = []; new MutationObserver(() => { document.querySelectorAll('#toasts .toast').forEach((t) => { if (!window.__av.includes(t.textContent)) window.__av.push(t.textContent); }); }).observe(document.querySelector('#toasts'), { childList: true, subtree: true, characterData: true }); });
const avisos = (p) => p.evaluate(() => (window.__av || []).join(' | '));

/* ---------------- as contas das Senhas da casa, em Node (o mesmo formato do Cofre e do Vault do app) ---------------- */
const aes = (raw, usos) => subtle.importKey('raw', raw, { name: 'AES-GCM' }, false, usos || ['encrypt', 'decrypt']);
async function cifrar(raw, bytes) { const iv = crypto.randomBytes(12); return { iv: b64(iv), ct: b64(await subtle.encrypt({ name: 'AES-GCM', iv }, await aes(raw), bytes)) }; }
async function decifrar(raw, o) { return new Uint8Array(await subtle.decrypt({ name: 'AES-GCM', iv: unb64(o.iv) }, await aes(raw), unb64(o.ct))); }
/* linha do cofre: {c:1, kv, fk, iv, ct}, e dentro o item com a parte interna enc (a MESMA CF) */
async function selar(raw, kv, fk, doc) { return JSON.stringify(Object.assign({ c: 1, kv, fk }, await cifrar(raw, utf8(JSON.stringify(doc))))); }
async function abrirLinha(raw, cif) { return JSON.parse(new TextDecoder().decode(await decifrar(raw, JSON.parse(cif)))); }
const abre = (f) => f().then(() => true, () => false);
async function kdf(code, sal) {
  const base = await subtle.importKey('raw', utf8(String(code).replace(/[\s-]/g, '').toUpperCase()), 'PBKDF2', false, ['deriveBits']);
  return new Uint8Array(await subtle.deriveBits({ name: 'PBKDF2', salt: unb64(sal), iterations: 600000, hash: 'SHA-256' }, base, 256));
}
async function envelopeEm(code, raw, kv, fk) { const sal = b64(crypto.randomBytes(16)); return JSON.stringify({ em: 1, d: { em: Object.assign({ sal, iter: 600000, kv, fk }, await cifrar(await kdf(code, sal), raw)), at: agora(), vis: 'restrito' } }); }
/* a CF embrulhada para a pública de uma pessoa ("1." + RSA-OAEP de {v:1, kv, fk, k}) e o caminho de volta com M.PKCS8 */
async function embrulhar(pub, raw, kv, fk) {
  const pk = await subtle.importKey('jwk', { kty: 'RSA', n: pub.n, e: pub.e, alg: 'RSA-OAEP-256', ext: true }, { name: 'RSA-OAEP', hash: 'SHA-256' }, false, ['encrypt']);
  return '1.' + b64(await subtle.encrypt({ name: 'RSA-OAEP' }, pk, utf8(JSON.stringify({ v: 1, kv, fk, k: b64(raw) }))));
}
async function desembrulhar(uid, txt) {
  const sk = await subtle.importKey('pkcs8', M.PKCS8[uid], { name: 'RSA-OAEP', hash: 'SHA-256' }, false, ['decrypt']);
  const o = JSON.parse(new TextDecoder().decode(await subtle.decrypt({ name: 'RSA-OAEP' }, sk, Buffer.from(String(txt).replace(/^1\./, ''), 'base64'))));
  return { kv: o.kv, fk: o.fk, raw: unb64(o.k) };
}
const igual = (a, b) => Buffer.from(a).equals(Buffer.from(b));
/* uma chave pública (só a pública, sem a CF) para alguém, como quem entra depois ou quem trocou de chave */
async function darPublica(uid) {
  const par = await subtle.generateKey({ name: 'RSA-OAEP', modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' }, true, ['encrypt', 'decrypt']);
  const j = await subtle.exportKey('jwk', par.publicKey), kid = b64u(crypto.randomBytes(9)), h = agora();
  M.PKCS8[uid] = new Uint8Array(await subtle.exportKey('pkcs8', par.privateKey));
  const ja = db.sol_chave_publica.find((k) => k.user_id === uid), pub = { kty: j.kty, n: j.n, e: j.e, alg: 'RSA-OAEP-256', kid };
  if (ja) Object.assign(ja, { chave_publica: pub, atualizado_em: h }); else db.sol_chave_publica.push({ user_id: uid, algoritmo: 'RSA-OAEP-256', chave_publica: pub, criado_em: h, atualizado_em: h });
  return kid;
}

/* ---------------- o banco de mentira: Senhas da casa, a troca "feita à mão" e chamadas REST sem navegador ---------------- */
const linha = (col, id) => db.omni_docs.find((d) => d.grupo_id === GID && d.colecao === col && d.id === id);
const vivasVault = () => db.omni_docs.filter((d) => d.grupo_id === GID && d.colecao === 'vault' && !d.apagado_em);
/* grava uma linha de omni_docs como o banco grava (versão +1, quem e quando) */
function gravarDoc(col, id, campos, por) {
  const h = agora(); let r = linha(col, id);
  if (!r) { r = { grupo_id: GID, colecao: col, id, vis: 'restrito', dados: null, dados_cifrado: null, versao: 0, criado_por: por || ANA, criado_em: h, apagado_em: null }; db.omni_docs.push(r); }
  Object.assign(r, campos, { versao: r.versao + 1, atualizado_por: por || ANA, atualizado_em: h });
  return r;
}
/* 6 itens (um com a placa do carro), o código de emergência e uma linha APAGADA que ainda guarda o texto (D-E6: fica como está) */
const ITENS = [['senha', 'Wi-Fi de casa'], ['senha', 'Banco de mentira'], ['documento', 'RG de mentira'], ['senha', 'E-mail de mentira'], ['cartao', 'Cartão de mentira'], ['seguro', 'Carro de mentira — placa']];
async function semear() {
  const cf = M.cfVelha, t = '2026-11-01T12:00:00.000Z';
  for (let i = 0; i < ITENS.length; i++) {
    const [kind, title] = ITENS[i], seg = { title, login: 'usuario' + i, pass: 'senha-de-mentira-' + i };
    const doc = Object.assign({ kind, enc: await cifrar(cf, utf8(JSON.stringify(seg))), files: [], vis: 'restrito', updatedAt: t }, kind === 'seguro' ? { carId: 'car-mentira' } : {});
    gravarDoc('vault', 'v' + i, { dados_cifrado: await selar(cf, 1, FK0, doc) });
  }
  gravarDoc('vault', '_em', { dados_cifrado: await envelopeEm(CODIGO_EM, cf, 1, FK0) });
  const velho = { kind: 'senha', enc: await cifrar(cf, utf8(JSON.stringify({ title: 'Apagado de mentira' }))), files: [], vis: 'restrito', updatedAt: t };
  gravarDoc('vault', 'vApagado', { dados_cifrado: await selar(cf, 1, FK0, velho), apagado_em: t });
}
/* a troca como a etapa E5 vai fazer, aqui à mão no banco: cada linha viva aberta com a velha e fechada com a nova (as DUAS
   camadas), o _em refeito com o mesmo código (ou invalidado), a nova embrulhada para cada chefe e responsável com pública
   (seq + 1), o registro novo e o giro "feito" (restrito, por um chefe). op: {em: "refeito"|"invalidado", estado, por, vis,
   de, pular: [ids que ficam com a velha]}. Devolve a CF nova (bytes de mentira) */
async function trocaAMao(op) {
  op = op || {};
  const velha = M.cfVelha, nova = new Uint8Array(crypto.randomBytes(32)), kv = 2, fk = FKN;
  for (const r of vivasVault()) {
    if (r.id === '_em' || (op.pular || []).includes(r.id)) continue;
    const doc = await abrirLinha(velha, r.dados_cifrado);
    if (doc.enc) doc.enc = await cifrar(nova, await decifrar(velha, doc.enc));
    gravarDoc('vault', r.id, { dados_cifrado: await selar(nova, kv, fk, doc) }, op.por || ANA);
  }
  if ((op.em || 'refeito') === 'refeito') gravarDoc('vault', '_em', { dados_cifrado: await envelopeEm(CODIGO_EM, nova, kv, fk) });
  else gravarDoc('vault', '_em', { dados_cifrado: null, apagado_em: agora() });
  const reg = JSON.parse(JSON.stringify(linha('settings', 'cofre').dados)), entregues = {};
  for (const m of db.sol_grupo_membros.filter((x) => x.grupo_id === GID && x.status === 'ativo' && ['chefe', 'responsavel'].includes(x.papel))) {
    const k = db.sol_chave_publica.find((x) => x.user_id === m.user_id); if (!k) continue;
    const vs = db.sol_grupo_chaves.filter((c) => c.grupo_id === GID && c.user_id === m.user_id).map((c) => c.versao), seq = (vs.length ? Math.max(...vs) : 0) + 1;
    db.sol_grupo_chaves.push({ grupo_id: GID, user_id: m.user_id, versao: seq, chave_embrulhada: await embrulhar(k.chave_publica, nova, kv, fk), embrulhada_por: ANA, criado_em: agora() });
    reg.membros[m.user_id] = { kid: k.chave_publica.kid, seq, fk }; entregues[m.user_id] = { kid: k.chave_publica.kid, seq };
  }
  Object.assign(reg, { fk, kv, giradoEm: agora(), giradoPor: ANA });
  gravarDoc('settings', 'cofre', { dados: reg }, ANA);
  const g = { v: 1, vis: op.vis || 'restrito', estado: op.estado || 'feito', por: ANA, ap: null, apNome: 'Android · Chrome', de: op.de || { kv: 1, fk: FK0 }, para: { kv, fk },
    inicio: agora(), batida: agora(), total: ITENS.length, feitos: ITENS.length, voltas: 0, estranhas: 0, em: op.em || 'refeito', envelopes: {}, entregues, fim: agora(), erro: null };
  gravarDoc('settings', 'giro', { vis: op.vis || 'restrito', dados: g }, op.porGiro || ANA);
  return nova;
}
/* REST do banco de mentira sem navegador (uma "rota" falsa): {status, corpo} */
async function rest(uid, metodo, caminho, corpo, prefer) {
  let out = null;
  const route = {
    request: () => ({ url: () => SB + caminho, method: () => metodo, postData: () => (corpo === undefined ? null : JSON.stringify(corpo)),
      headers: () => Object.assign({ authorization: 'Bearer h.' + b64u(JSON.stringify({ sub: uid })) + '.s' }, prefer ? { prefer } : {}) }),
    fulfill: async (o) => { out = { status: o.status, corpo: o.body ? JSON.parse(o.body) : null }; }
  };
  await supabase(route);
  return out;
}
const docUrl = (col, id) => '/rest/v1/omni_docs?grupo_id=eq.' + GID + '&colecao=eq.' + col + '&id=eq.' + id;
/* o resultado de uma função do banco: {n} ou {erro: "descartar:<motivo>", st, code} */
const tentar = (fn) => { try { return { n: fn() }; } catch (e) { return { erro: String((e && e.o && e.o.message) || e).split(' ')[0], st: e && e.st, code: e && e.o && e.o.code }; } };
const descartar = (me, ate) => tentar(() => rpcs.sol_descartar_chaves_antigas(me, { p_grupo: GID, p_ate_versao: ate }));
const situacao = (me) => rpcs.sol_giro_situacao(me || ANA, { p_grupo: GID });
const versoes = (uid) => db.sol_grupo_chaves.filter((c) => c.grupo_id === GID && c.user_id === uid).map((c) => c.versao).sort((a, b) => a - b).join(',');
/* as chamadas sol_guardar_chave_grupo desde a posição desde de M.log, abertas em Node: [{user, seq, fk, kv}] */
async function entregas(desde) {
  const out = [];
  for (const l of M.log.slice(desde)) {
    if (l.caminho !== '/rest/v1/rpc/sol_guardar_chave_grupo' || !l.corpo) continue;
    let k = null; try { k = await desembrulhar(l.corpo.p_user, l.corpo.p_chave_embrulhada); } catch (e) {}
    out.push({ user: l.corpo.p_user, seq: l.corpo.p_versao, fk: k && k.fk, kv: k && k.kv });
  }
  return out;
}
const regBanco = () => JSON.parse(JSON.stringify(linha('settings', 'cofre').dados));
const regOk = (r) => r.fk === FKN && r.kv === 2 && Object.values(r.membros).every((m) => m.fk === FKN);

/* um aparelho da pessoa com as Senhas da casa abertas com a CF de antes (o cadeado como a 2.25 gravava, com a chave pessoal) */
async function abertoComVelha(p, uid, pin) {
  await entrarOmni(p, uid); await quieto(p);
  await p.evaluate(() => { Sol.ligadoAp = false; Sol.ligadoPin = false; });
  await senhasDaCasa(p);
  await cadeado225(p, uid, pin);
  await p.waitForFunction(() => Cofre.status && Cofre.status.fase === 'aberto' && !document.querySelector('.modal'), null, { timeout: 20000 });
  await p.evaluate(() => { Sol.ligadoAp = null; Sol.ligadoPin = null; });
  /* a primeira liberação (o usarChave dispara) termina antes de o teste começar a contar */
  await p.evaluate(async () => { for (let i = 0; i < 100 && Cofre._distP; i++) await new Promise((r) => setTimeout(r, 100)); });
}
/* um aparelho da pessoa que entrou aprovado pela FAMÍLIA (sem a chave pessoal: L.sk null), aberto com a CF de antes */
async function abertoPelaFamilia(p, uid, pin) {
  await entrarOmni(p, uid); await quieto(p);
  await p.evaluate(() => { Sol.ligadoAp = false; Sol.ligadoPin = false; });
  await senhasDaCasa(p);
  await p.evaluate(async (a) => {
    const dukRaw = Cofre.rnd(32), duk = await Cofre.aes(dukRaw), sal = b64FromBuf(Cofre.rnd(16));
    const L = { v: 1, uid: Conta.uid(), pin: Object.assign({ sal, iter: COFRE_ITER }, await Cofre.cifrar(await Cofre.kdf(a.pin, sal, COFRE_ITER), dukRaw)), prf: null, sk: null,
      fam: { [S.family.id]: Object.assign({ kv: 1, fk: a.fk }, await Cofre.cifrar(duk, new Uint8Array(a.cf))) }, erros: 0, ate: 0, bloqueado: false, como: 'familia', ap: null };
    await Cofre.mudarLocal(null, () => L);
    Cofre.dukRaw = dukRaw; await Cofre.usarChave(new Uint8Array(a.cf), 1, a.fk);
    await Cofre.atualizar(); render();
  }, { pin, cf: [...M.cfVelha], fk: FK0 });
  await p.waitForFunction(() => Cofre.status && Cofre.status.fase === 'aberto' && !document.querySelector('.modal'), null, { timeout: 20000 });
  await p.evaluate(() => { Sol.ligadoAp = null; Sol.ligadoPin = null; });
  await p.evaluate(async () => { for (let i = 0; i < 100 && Cofre._distP; i++) await new Promise((r) => setTimeout(r, 100)); });
}
/* abre as Senhas da casa pelo PIN (Pin.abrir → comChaveDoAparelho), sem o SQL do PIN da conta (o PIN deste aparelho) */
const abrirPeloPin = (p, pin) => p.evaluate(async (pin) => {
  Sol.ligadoAp = false; Sol.ligadoPin = false;
  try { const r = await Cofre.destrancarPin(pin); await Cofre.atualizar(); render(); return r; } finally { Sol.ligadoAp = null; Sol.ligadoPin = null; }
}, pin);
/* o cadeado deste aparelho para a família de agora: {fk, kv, velhas: [fk…], prox: fk | null} */
const famDe = (p) => p.evaluate(async () => { const L = await Cofre.local(), f = L && L.fam && L.fam[S.family.id]; return f ? { fk: f.fk, kv: f.kv, velhas: (f.velhas || []).map((v) => v.fk), prox: f.prox ? f.prox.fk : null } : null; });
/* o que a tela das Senhas da casa tem: {id: título} (o código de emergência: true) */
const titulos = (p) => p.evaluate(async () => {
  const out = {};
  for (const v of DB.all('vault')) { if (v.id === '_em') { out._em = !!v.em; continue; } try { out[v.id] = (await Vault.decObj(v.enc)).title; } catch (e) { out[v.id] = null; } }
  return out;
});
/* conta as vezes que o usarChave é chamado (window.__usar) */
const contarUsar = (p) => p.evaluate(() => { window.__usar = 0; const o = Cofre.usarChave; Cofre.usarChave = function () { window.__usar++; return o.apply(this, arguments); }; });
/* espera uma condição assíncrona do lado do Node */
async function ateA(fn, ms) { const fim = Date.now() + (ms || 10000); while (Date.now() < fim) { if (await fn()) return true; await espere(150); } return !!(await fn()); }
/* o título (a parte interna) de uma linha do banco, aberta em Node com a chave raw (as duas camadas) | null */
async function tituloDe(raw, cif) { try { const d = await abrirLinha(raw, cif); return JSON.parse(new TextDecoder().decode(await decifrar(raw, d.enc))).title; } catch (e) { return null; } }
/* as gravações no vault (PATCH/POST) desde marca com o texto fechado com o fk dado */
const subiuCom = (marca, fk) => M.log.slice(marca).filter((l) => ['PATCH', 'POST'].includes(l.metodo) && /omni_docs/.test(l.caminho) && l.corpo && l.corpo.dados_cifrado && (() => { try { return JSON.parse(l.corpo.dados_cifrado).fk === fk; } catch (e) { return false; } })());
/* a fila deste aparelho sobe até o fim (agora: também o que está adiado), sem cair no "já está enviando" do flush. O DB.put e o
   DB.del da nuvem não esperam a fila (o aparelho segue na hora): chave = espera ela entrar na fila antes */
const subir = (p, agora, chave) => p.evaluate(async ([agora, chave]) => {
  for (let i = 0; i < 30 && (chave ? !CloudDriver.fila.has(chave) : i < 3); i++) await new Promise((r) => setTimeout(r, 100));
  for (let i = 0; i < 80; i++) {
    if (!CloudDriver._flushing) await CloudDriver.flush(agora);
    const resta = [...CloudDriver.fila.keys()].filter((k) => agora || !((CloudDriver.adiado.get(k) || 0) > Date.now()));
    if (!CloudDriver._flushing && !resta.length) return;
    await new Promise((r) => setTimeout(r, 100));
  }
}, [!!agora, chave || null]);
/* Cofre.distribuir(true) e espera terminar (e a fila subir, respeitando o que está adiado) */
const distribuirJa = async (p) => { await p.evaluate(async () => { for (let i = 0; i < 100 && Cofre._distP; i++) await new Promise((r) => setTimeout(r, 100)); await Cofre.distribuir(true); }); await subir(p); };

/* ---------------- etapa E5: a troca de verdade, sem a tela (a tela é a E9) ---------------- */
/* Giro.executar(andamento, {}, op) no aparelho (op padrão: começar uma). {ok, r, passos: [textos do andamento]} | {erro, motivo, passos} */
const girar = (p, op) => p.evaluate(async (op) => {
  const passos = [];
  try { const r = await Giro.executar((v, t) => { if (t && passos[passos.length - 1] !== t) passos.push(t); }, {}, op); return { ok: true, r: JSON.parse(JSON.stringify(r)), passos }; }
  catch (e) { return { erro: e.message, motivo: e.giro || null, passos }; }
}, op === undefined ? { novo: true } : op);
/* ---------------- etapa E6: a troca no Fundo, a trava e a pausa ---------------- */
/* começa (ou continua) a troca SEM esperar o fim: o andamento fica em window.__passos e o resultado em window.__res */
const comecar = (p, op) => p.evaluate((op) => {
  window.__passos = []; window.__res = null;
  Giro.executar((v, t) => { if (t && window.__passos[window.__passos.length - 1] !== t) window.__passos.push(t); }, {}, op)
    .then((r) => { window.__res = { ok: true, r: JSON.parse(JSON.stringify(r)) }; }, (e) => { window.__res = { erro: e.message, motivo: e.giro || null }; });
}, op === undefined ? { novo: true } : op);
const resultado = async (p, ms) => { await esperar(p, () => !!window.__res, null, ms || 30000); return p.evaluate(() => window.__res); };
/* pela tela: Giro.iniciar (o trabalho do Fundo), sem esperar. O fim em window.__fu */
const pelaPilula = (p, op) => p.evaluate((op) => { window.__fu = null; Giro.iniciar(op).then(() => { window.__fu = { ok: true }; }, (e) => { window.__fu = { erro: e.message, motivo: e.giro || null }; }); }, op === undefined ? { novo: true } : op);
/* o texto do cartão da troca pela metade nas Senhas da casa ('' = não há) */
const cartaoGiro = (p) => p.evaluate(() => { const c = document.querySelector('#giroCartao'); return c ? c.innerText.replace(/\s+/g, ' ').trim() : ''; });
/* a tela acesa de mentira (o navegador do teste não tem): window.__wl anota "pedido" e "solto" */
const wakeLockDeMentira = (p) => p.evaluate(() => {
  window.__wl = [];
  Object.defineProperty(navigator, 'wakeLock', { configurable: true, value: { request: async () => {
    window.__wl.push('pedido'); const ls = [];
    return { released: false, addEventListener: (ev, fn) => ls.push(fn), release: async function () { this.released = true; window.__wl.push('solto'); ls.forEach((f) => f()); } };
  } } });
});
/* o aviso antes de fechar está ligado? (um "beforeunload" de mentira: o Fundo cancela) */
const avisaAntesDeFechar = (p) => p.evaluate(() => { const e = new Event('beforeunload', { cancelable: true }); window.dispatchEvent(e); return e.defaultPrevented; });
/* sem internet de verdade neste aparelho: navigator.onLine falso E nada chega ao banco (o setOffline sozinho não corta o que o
   teste atende pelo ctx.route) */
const cortar = (r) => r.abort('internetdisconnected');
async function cortarRede(A, sim) { if (sim) { await A.ctx.route(SB + '/**', cortar); await semRede(A.ctx, true); } else { await A.ctx.unroute(SB + '/**', cortar); await semRede(A.ctx, false); } }
/* uma troca de mentira no banco, como outro aparelho a deixou */
const trocaNoBanco = (campos) => Object.assign({ v: 1, vis: 'restrito', estado: 'recifrando', por: ANA, ap: 'aparelho-de-mentira', apNome: 'Outro aparelho', de: { kv: 1, fk: FK0 }, para: { kv: 2, fk: 'fk-de-mentira' },
  inicio: agora(), batida: agora(), total: 0, feitos: 0, voltas: 0, estranhas: 0, em: null, envelopes: {}, entregues: {}, fim: null, erro: null }, campos);

/* ---------------- etapa E7: o código de emergência ---------------- */
/* o aparelho do contato de emergência (o Davi, com o acesso já liberado em omni_cofre_liberado): entra e vai às Senhas da casa */
async function emergenciaPronta(p) {
  await entrarOmni(p, DAVI); await quieto(p);
  await p.evaluate(() => go('house', 'vault'));
  await p.waitForFunction(() => S.route && S.route.sub === 'vault' && document.querySelector('[data-act="gov.emcode"]') && DB.col('vault').get('_em'), null, { timeout: 20000 });
  await vigiarAvisos(p);
}
/* "Abrir com o código" pela tela (o askText do Gov.openWithCode): {aberto, fk, janela (abriu o campo?), avisos} */
async function codigoPelaTela(p, codigo) {
  await p.evaluate(() => { window.__av = []; });
  await p.click('[data-act="gov.emcode"]');
  const janela = await p.waitForSelector('.modal #askv', { timeout: 2500 }).then(() => true, () => false);
  if (janela) { await p.fill('.modal #askv', codigo); await p.click('.modal:has(#askv) [data-ok]'); }
  await esperar(p, () => Cofre.aberto() || (window.__av || []).some((t) => /incorreto|Ainda não há/.test(t)), null, 15000);
  await espere(300);
  return Object.assign({ janela }, await p.evaluate(() => ({ aberto: Cofre.aberto(), fk: Cofre.fk, avisos: (window.__av || []).join(' | ') })));
}
/* ---------------- etapa E8: a ponte Saúde → MoneyTRIO ---------------- */
/* uma mensagem da ponte no banco de mentira: por padrão, um resumo da Saúde do Omni para o MoneyTRIO, não lido, fechado com a de antes */
const msgPonte = (id, user, extra) => Object.assign({ id, de_app: 'omnilife-one', para_app: 'moneytrio', tipo: 'saude-resumo', grupo_id: GID, user_id: user,
  dados: { v: 1, cif: JSON.stringify({ c: 1, kv: 1, fk: FK0, iv: 'eA==', ct: 'eQ==' }) }, criado_em: '2026-11-0' + (2 + db.sol_ponte.length) + 'T12:00:00.000Z', lido_em: null, lido_por: null }, extra);
const ponteDe = (id) => db.sol_ponte.find((x) => x.id === id);
/* os sol_ponte_enviar desde marca: [{user, fk, kv}] (o fk em claro do que foi mandado) */
const enviosDesde = (marca) => M.log.slice(marca).filter((x) => /rpc\/sol_ponte_enviar$/.test(x.caminho) && x.corpo).map((x) => { let o = {}; try { o = JSON.parse(x.corpo.p_dados.cif); } catch (e) {} return { user: x.quem, fk: o.fk, kv: o.kv }; });
/* liga "Saúde → MoneyTRIO" (⚙ → Integrações) para a família, sem mandar nada agora */
const ligarSaude = async (p) => { await p.evaluate(async () => { await DB.saveSetting({ mt: Object.assign({}, Bridge.cfg(), { saude: true }) }); }); await subir(p); };
/* "a rede pendura": o banco de mentira faz o pedido, mas a resposta nunca volta ao aparelho */
const engolir = (route) => supabase({ request: () => route.request(), fulfill: async () => {} });
/* os títulos que a lista das Senhas da casa mostra (o contato de emergência não vê pelo DB.all: a lista é a da tela) */
const naTela = async (p) => { await esperar(p, () => document.querySelectorAll('#vlist .li .t').length > 0, null, 8000); return p.evaluate(() => [...document.querySelectorAll('#vlist .li .t')].map((x) => x.textContent)); };
/* a CF que está com a pessoa (a versão mais alta dela em sol_grupo_chaves), aberta em Node com M.PKCS8: {raw, kv, fk} | null */
async function chaveDaPessoa(uid) {
  const c = db.sol_grupo_chaves.filter((x) => x.grupo_id === GID && x.user_id === uid).sort((a, b) => b.versao - a.versao)[0];
  return c ? desembrulhar(uid, c.chave_embrulhada) : null;
}
/* anexos de mentira guardados neste aparelho, fechados como o app fecha: "familia" (a chave da família, com enc.fk), "semfk" (a
   mesma chave, como antes da 2.27.0) e "outro" (uma chave que não é da família, como a da senha principal) */
const anexar = (p, lista) => p.evaluate(async (lista) => {
  for (const [id, como] of lista) {
    const k = como === 'outro' ? await Cofre.aes(Cofre.rnd(32)) : Cofre.vf;
    const r = await Vault.encryptBlob(new Blob([new TextEncoder().encode('anexo ' + id)], { type: 'text/plain' }), k);
    const meta = { id, name: id + '.txt', type: 'application/octet-stream', size: r.blob.size, vis: 'restrito', enc: Object.assign({ iv: r.iv, type: 'text/plain' }, como === 'familia' ? { fk: Cofre.fk } : {}), chunks: 1 };
    await DB.driver.putFile(id, r.blob, meta); await DB.put('files', meta, true);
  }
}, lista);
/* os anexos deste aparelho: {id: {enc, txt (aberto como a tela abre), bytes (o arquivo guardado, para abrir em Node)}} */
const anexosDe = (p, ids) => p.evaluate(async (ids) => {
  const out = {};
  for (const id of ids) {
    const m = Files.meta(id), b = await DB.driver.getFile(id, m); let txt = null; try { txt = await (await Files.blob(id)).text(); } catch (e) {}
    out[id] = { enc: m && m.enc, txt, bytes: b ? [...new Uint8Array(await b.arrayBuffer())] : null };
  }
  return out;
}, ids);
const abreBlob = async (raw, iv, bytes) => { try { await subtle.decrypt({ name: 'AES-GCM', iv: unb64(iv) }, await aes(raw), new Uint8Array(bytes)); return true; } catch (e) { return false; } };
/* o app aberto de novo (recarregar = fechar e abrir), até a família e as Senhas da casa */
async function reabrir(p) {
  await p.reload();
  await p.waitForFunction(() => typeof S !== 'undefined' && S.booted && S.mode === 'cloud' && S.family && typeof Cofre !== 'undefined', null, { timeout: 30000 });
  await quieto(p); await senhasDaCasa(p);
}
/* as linhas vivas (menos o código de emergência) fechadas com o fk dado */
const comFk = (fk) => vivasVault().filter((x) => { if (x.id === '_em') return false; try { return JSON.parse(x.dados_cifrado).fk === fk; } catch (e) { return false; } });
const idsVault = () => db.omni_docs.filter((d) => d.grupo_id === GID && d.colecao === 'vault').map((d) => d.id).sort().join();
/* a linha de um item de mentira fechada com uma chave qualquer (a parte interna com outra, se dada) */
async function linhaCom(raw, kv, fk, titulo, rawInterna) {
  return selar(raw, kv, fk, { kind: 'senha', enc: await cifrar(rawInterna || raw, utf8(JSON.stringify({ title: titulo }))), files: [], vis: 'restrito', updatedAt: agora() });
}
/* ---------------- etapa E9: as telas da troca ---------------- */
/* prints em 390 e 1280 px (PRINTS=<pasta>; sem a variável, não grava): a tela como está, sem os avisos curtos por cima (sel: o que
   precisa aparecer, levado para o meio da tela) */
const PRINTS = process.env.PRINTS || '';
async function foto(p, nome, sel) {
  if (!PRINTS) return;
  const fs = require('fs'), path = require('path'), vp = p.viewportSize();
  fs.mkdirSync(PRINTS, { recursive: true });
  await p.evaluate(() => { document.querySelector('#toasts').innerHTML = ''; });
  for (const [w, h] of [[390, 844], [1280, 800]]) {
    await p.setViewportSize({ width: w, height: h }); await espere(350);
    if (sel) { await p.evaluate((sel) => { const e = document.querySelector(sel); if (e) e.scrollIntoView({ block: 'center' }); }, sel); await espere(250); }
    await p.screenshot({ path: path.join(PRINTS, nome + '-' + w + '.png') });
  }
  await p.setViewportSize(vp); await espere(200);
}
/* a tela acesa de mentira desde o carregamento da página (addInitScript): window.__wl anota "pedido" e "solto" */
const wakeLockDesdeOInicio = (ctx) => ctx.addInitScript(() => {
  window.__wl = [];
  Object.defineProperty(navigator, 'wakeLock', { configurable: true, value: { request: async () => {
    window.__wl.push('pedido'); const ls = [];
    return { released: false, addEventListener: (ev, fn) => ls.push(fn), release: async function () { this.released = true; window.__wl.push('solto'); ls.forEach((f) => f()); } };
  } } });
});
/* ⚙ → Segurança e aparelhos, com o Avançado aberto, até o que vem da internet chegar */
async function avancado(p) {
  await p.evaluate(() => { Giro._sql = null; TelaConta._avAberto = true; go('settings', 'conta'); });
  await p.waitForFunction(() => S.route && S.route.sub === 'conta' && document.querySelector('#segAvC #segComoGuarda'), null, { timeout: 20000 });
  await espere(300);
}
/* o botão da troca no Avançado: {disabled, txt, sub, semSql} | null */
const botaoTrocar = (p) => p.evaluate(() => {
  const b = document.querySelector('[data-act="conta.giro.trocar"]'), t = (s) => ((document.querySelector(s) || {}).textContent || '').trim();
  return b ? { disabled: b.disabled, txt: b.textContent.trim(), sub: t('#giroSub'), semSql: t('#giroSemSql'), w: b.getBoundingClientRect().height } : null;
});
/* toca no botão e espera a confirmação (false = não abriu em ms) */
async function abrirConfirmacao(p, ms) {
  await p.click('[data-act="conta.giro.trocar"]');
  return p.waitForSelector('.modal.giro #giroPalavra', { timeout: ms || 20000 }).then(() => true, () => false);
}
const textoConfirmacao = (p) => p.evaluate(() => { const m = [...document.querySelectorAll('.modal.giro')].find((x) => x.querySelector('#giroPalavra')); return m ? m.innerText.replace(/\s+/g, ' ').trim() : ''; });
const textoFim = (p) => p.evaluate(() => { const m = [...document.querySelectorAll('.modal.giro')].find((x) => !x.querySelector('#giroPalavra')); return m ? m.innerText.replace(/\s+/g, ' ').trim() : ''; });
/* marca o que a confirmação pede (menos op.sem), digita a palavra (e o código) e toca em "Trocar agora" */
async function confirmarTroca(p, op) {
  op = op || {};
  for (const id of ['giroCkAps', 'giroCkRede', 'giroCkRisco', 'giroCkOk']) if (!(op.sem || []).includes(id) && (await p.$('.modal.giro #' + id))) await p.check('.modal.giro #' + id);
  await p.fill('.modal.giro #giroPalavra', op.palavra === undefined ? 'trocar' : op.palavra);
  if (op.codigo !== undefined) await p.fill('.modal.giro #giroCodigoC', op.codigo);
  await p.click('.modal.giro [data-ok]');
}
/* o PIN da confirmação (Cofre.provarAgora) */
async function digitarPin(p, pin) {
  await p.waitForSelector('.modal #ppin', { timeout: 15000 });
  await p.fill('.modal #ppin', pin); await p.click('.modal:has(#ppin) [data-ok]');
}
/* uma volta do Cloud.poll até o fim (esperando a que já estava rodando) */
const umaVolta = (p) => p.evaluate(async () => { for (let i = 0; i < 100 && Cloud._polling; i++) await new Promise((r) => setTimeout(r, 100)); await Cloud.poll(); for (let i = 0; i < 100 && (Cloud._polling || Giro._vigia); i++) await new Promise((r) => setTimeout(r, 100)); });
/* as gravações no banco desde marca (PATCH/POST/DELETE em omni_docs e as entregas) */
const gravacoesDesde = (marca) => M.log.slice(marca).filter((l) => (['PATCH', 'POST', 'DELETE'].includes(l.metodo) && /omni_docs/.test(l.caminho)) || /sol_guardar_chave_grupo/.test(l.caminho));

/* ---------------- etapa E10: "Terminar a troca" (apagar as versões antigas) ---------------- */
/* a janela do "Terminar a troca": {tipo: "falta" (o que ainda falta) | "confirma" | null, txt} */
const janelaTerm = (p) => p.evaluate(() => {
  const m = [...document.querySelectorAll('.modal.giro')].find((x) => x.querySelector('#giroFalta, #giroTermPalavra'));
  return m ? { tipo: m.querySelector('#giroFalta') ? 'falta' : 'confirma', txt: m.innerText.replace(/\s+/g, ' ').trim(), apagar: !!m.querySelector('#giroTermApagar') } : { tipo: null, txt: '' };
});
/* toca em "🧹 Terminar a troca" (o botão do Avançado, ou o ACT direto) e espera a janela */
async function tocarTerminar(p, act) {
  if (act) await p.evaluate(() => ACT['conta.giro.descartar']()); else await p.click('[data-act="conta.giro.descartar"]');
  await esperar(p, () => !!document.querySelector('.modal.giro #giroFalta, .modal.giro #giroTermPalavra'), null, 20000);
  await espere(150);
  return janelaTerm(p);
}
const fecharTerm = async (p) => { await p.click('.modal.giro .mf [data-x]').catch(() => {}); await p.waitForSelector('.modal.giro', { state: 'detached', timeout: 5000 }).catch(() => {}); };
/* marca "Entendi", digita a palavra e toca em "Terminar agora" */
async function confirmarTerminar(p, op) {
  op = op || {};
  if (!op.semCheck) await p.check('.modal.giro #giroTermCk');
  await p.fill('.modal.giro #giroTermPalavra', op.palavra === undefined ? 'trocar' : op.palavra);
  await p.click('.modal.giro [data-ok]');
}
/* Giro.descartar() direto (sem a conferência da tela): {n} | {motivo, txt} */
const descartarDireto = (p) => p.evaluate(async () => { try { return { n: await Giro.descartar() }; } catch (e) { return { motivo: e.giro || null, txt: e.message }; } });
/* o banco do "Terminar a troca": as versões guardadas, o registro e o histórico do descarte (para conferir que nada mudou) */
const bancoTerm = () => JSON.stringify([db.sol_grupo_chaves.map((c) => [c.user_id, c.versao]), regBanco(), db.omni_historico.filter((h) => h.acao === 'cofre.descartado').length]);
/* conta as voltas do soltarVelhas (window.__solt) */
const contarSoltar = (p) => p.evaluate(() => { window.__solt = 0; const o = Giro.soltarVelhas; Giro.soltarVelhas = async function () { try { return await o.apply(this, arguments); } finally { window.__solt++; } }; });
/* tranca e abre de novo pelo PIN; espera o soltarVelhas da abertura terminar */
async function reabrirPeloPin(p, pin) {
  const n0 = await p.evaluate(() => window.__solt || 0);
  await p.evaluate(() => { Cofre.trancar(); render(); });
  const r = await abrirPeloPin(p, pin);
  await esperar(p, (n0) => (window.__solt || 0) > n0 && !Giro._soltando, n0, 15000);
  return r;
}
const outrasDe = (p) => p.evaluate(() => Cofre.outras.map((o) => o.fk));
/* revisão de dados: restaurar a cópia (o texto do arquivo) pela tela, no modo "Juntar" (o único que a nuvem oferece além de "Manter
   separado"); o que o Restore.aplicar devolve */
async function restaurarCopia(p, txt) {
  await p.evaluate((txt) => { window.__rs = null; Restore.aplicar(JSON.parse(txt), {}).then((x) => { window.__rs = x || false; }, (e) => { window.__rs = { erro: String(e) }; }); }, txt);
  if (await p.waitForSelector('[data-m="juntar"]', { timeout: 8000 }).then(() => true, () => false)) await p.click('[data-m="juntar"]');
  await esperar(p, () => window.__rs !== null, null, 15000);
  return p.evaluate(() => window.__rs);
}

(async () => {
  const browser = await iniciar();
  const { falhas, conferir } = criarConferir();
  await prepararChaves({ soPub: [DAVI] });
  await semear();
  const FOTO = JSON.parse(JSON.stringify(db)), PKCS8 = Object.assign({}, M.PKCS8), VELHA = new Uint8Array(M.cfVelha);
  const lixos = [];
  const voltar = () => {
    for (const t of Object.keys(db)) db[t].splice(0, db[t].length, ...JSON.parse(JSON.stringify(FOTO[t] || [])));
    Object.assign(M, { falhar: {}, semPin: false, semAp: false, semDelete: false, banidas: {}, atrasoLogout: 0, ataque: null, semGiroSql: false, soChefeGiro: false, depoisDe: null, PKCS8: Object.assign({}, PKCS8), cfVelha: new Uint8Array(VELHA) });
    M.relogio = Date.now();
  };
  async function parte(id, titulo, fn) {
    if (SO.length && !SO.includes(id)) return;
    console.log('\n' + id + '. ' + titulo);
    voltar();
    const ctxs = [];
    const novo = async (nome, op) => { const A = await aparelho(browser, Object.assign({ nome, base: BASE }, op)); ctxs.push(A.ctx); lixos.push(A.lixo); return A; };
    try { await fn(novo); } catch (e) { conferir(false, id + ': o teste parou no meio — ' + String((e && e.message) || e).split('\n')[0]); }
    for (const c of ctxs) await c.close().catch(() => {});
  }

  /* ================= SQL: o banco de mentira faz o que o SQL da plataforma faz ================= */
  await parte('SQL', 'O banco de mentira: sol_giro_situacao e sol_descartar_chaves_antigas como o SQL (os casos do topo do arquivo), o gatilho do Omni, a ponte', async () => {
    /* o que o prepararChaves deixou para o teste */
    const ka = await desembrulhar(ANA, db.sol_grupo_chaves.find((c) => c.user_id === ANA).chave_embrulhada);
    conferir(ka.fk === FK0 && ka.kv === 1 && igual(ka.raw, M.cfVelha), 'M.PKCS8 abre em Node a CF embrulhada para a Ana, e ela é a M.cfVelha (fk-teste, kv 1)');
    conferir(!!db.sol_chave_publica.find((k) => k.user_id === DAVI) && !db.sol_grupo_chaves.some((c) => c.user_id === DAVI) && !regBanco().membros[DAVI] && !!M.PKCS8[DAVI],
      'soPub: o Davi (membro) tem só a chave pública: nenhuma CF, fora do registro');
    conferir(vivasVault().length === 7 && !!linha('vault', 'vApagado').dados_cifrado, 'as Senhas da casa de mentira: 6 itens + o código de emergência, e uma apagada que ainda guarda o texto');
    /* sem o SQL: as duas funções "não existem" */
    M.semGiroSql = true;
    const s404 = await rest(ANA, 'POST', '/rest/v1/rpc/sol_giro_situacao', { p_grupo: GID }), d404 = await rest(ANA, 'POST', '/rest/v1/rpc/sol_descartar_chaves_antigas', { p_grupo: GID, p_ate_versao: 1 });
    conferir(s404.status === 404 && s404.corpo.code === 'PGRST202' && d404.status === 404 && d404.corpo.code === 'PGRST202', 'M.semGiroSql: sol_giro_situacao e sol_descartar_chaves_antigas → 404 PGRST202 (como sem o SQL)');
    M.semGiroSql = false;
    /* antes da troca */
    const s0 = situacao();
    conferir(s0.registro === true && s0.maior_versao === 1 && s0.vault_fora === 0 && s0.vault_apagadas_com_texto === 0 && s0.giro === null && s0.giro_ok === false && s0.falta_entregar === 0 && s0.money_migrado === true && s0.money_usa === false,
      'situação antes da troca: registro, maior versão 1, nada fora, nenhuma troca (' + JSON.stringify(s0) + ')');
    const r1 = await rest(BIA, 'POST', '/rest/v1/rpc/sol_giro_situacao', { p_grupo: GID });
    conferir(r1.status === 403 && r1.corpo.code === '42501' && /^giro:chefe /.test(r1.corpo.message), 'situação pela Bia (responsável) → 403 42501 "giro:chefe"');
    conferir(descartar(BIA, 1).erro === 'descartar:chefe' && descartar(DAVI, 1).erro === 'descartar:chefe', 'descartar pela Bia ou pelo Davi → descartar:chefe');
    const dv = descartar(ANA, 0), dv2 = descartar(ANA, null);
    conferir(dv.erro === 'descartar:versao' && dv.code === '22023' && dv2.erro === 'descartar:versao', 'p_ate_versao 0 ou vazio → descartar:versao (22023)');
    conferir(descartar(ANA, 1).erro === 'descartar:versao', 'antes da troca: a versão pedida é a mais nova → descartar:versao');
    /* sem registro */
    linha('settings', 'cofre').apagado_em = agora();
    conferir(descartar(ANA, 1).erro === 'descartar:registro' && situacao().registro === false, 'registro apagado → descartar:registro (e situação.registro false)');
    voltar(); linha('settings', 'cofre').dados.kv = '1';
    conferir(descartar(ANA, 1).erro === 'descartar:registro', 'registro com kv que não é número → descartar:registro');

    /* a troca feita à mão: o caso feliz */
    voltar(); await trocaAMao();
    const s1 = situacao();
    conferir(s1.registro && s1.maior_versao === 2 && s1.vault_fora === 0 && s1.vault_apagadas_com_texto === 1 && s1.ponte_pendentes === 0 && s1.ponte_outra === 0 && s1.money_cf === 0 && s1.money_migrado && s1.falta_entregar === 0 && s1.giro === 'feito' && s1.giro_ok === true,
      'situação depois da troca: nada fora (a apagada com texto só conta à parte), ninguém faltando, giro feito e conferido (' + JSON.stringify(s1) + ')');
    conferir(descartar(ANA, 2).erro === 'descartar:versao', 'depois da troca, p_ate_versao = a mais nova → descartar:versao');
    const ok1 = descartar(ANA, 1);
    conferir(ok1.n === 2 && versoes(ANA) === '2' && versoes(BIA) === '2', 'caso feliz: apaga só as 2 versões 1 (Ana e Bia) e ficam as 2 em uso (' + JSON.stringify(ok1) + ')');
    conferir(descartar(ANA, 1).n === 0, 'rodar duas vezes: a segunda apaga 0');

    /* o giro: só vale terminado, restrito, gravado por último por um chefe, e troca de verdade (C9) */
    voltar(); await trocaAMao({ estado: 'conferindo' });
    conferir(descartar(ANA, 1).erro === 'descartar:giro', 'giro "conferindo" (não terminou) → descartar:giro');
    voltar(); await trocaAMao();
    const rb = await rest(BIA, 'PATCH', docUrl('settings', 'giro'), { dados: Object.assign({}, linha('settings', 'giro').dados, { batida: agora() }) }, 'return=representation');
    conferir(rb.status === 200 && linha('settings', 'giro').atualizado_por === BIA && descartar(ANA, 1).erro === 'descartar:giro', 'giro "feito" gravado por último por um responsável (o carimbo do banco) → descartar:giro');
    voltar(); await trocaAMao({ vis: 'publico' });
    conferir(descartar(ANA, 1).erro === 'descartar:giro', 'giro "publico" → descartar:giro');
    voltar(); await trocaAMao({ de: { kv: 2, fk: FKN } });
    conferir(descartar(ANA, 1).erro === 'descartar:giro', 'giro com de = para (não trocou nada) → descartar:giro');
    voltar(); await trocaAMao({ de: {} });
    conferir(descartar(ANA, 1).erro === 'descartar:giro', 'giro sem de.fk → descartar:giro');
    /* as Senhas da casa */
    voltar(); await trocaAMao({ pular: ['v3'] });
    conferir(descartar(ANA, 1).erro === 'descartar:vault' && situacao().vault_fora === 1, 'uma linha viva ainda com a fk velha → descartar:vault (vault_fora 1)');
    voltar(); await trocaAMao(); gravarDoc('vault', '_em', { dados_cifrado: await envelopeEm(CODIGO_EM, M.cfVelha, 1, FK0) });
    conferir(descartar(ANA, 1).erro === 'descartar:vault', '_em velho (não refeito) → descartar:vault');
    voltar(); await trocaAMao({ em: 'invalidado' });
    conferir(descartar(ANA, 1).n === 2, '_em invalidado (apagado e sem texto) não trava');
    voltar(); await trocaAMao(); gravarDoc('vault', 'vQuebrado', { dados_cifrado: 'isto não é JSON' });
    conferir(descartar(ANA, 1).erro === 'descartar:vault', 'uma linha viva que não é JSON conta como fora → descartar:vault');
    /* a ponte */
    voltar(); await trocaAMao();
    db.sol_ponte.push({ id: 'p1', de_app: 'omnilife-one', para_app: 'moneytrio', tipo: 'saude-resumo', grupo_id: GID, user_id: ANA, dados: { v: 1, cif: JSON.stringify({ c: 1, kv: 1, fk: FK0, iv: 'x', ct: 'y' }) }, criado_em: agora(), lido_em: null, lido_por: null });
    const sp = situacao();
    conferir(descartar(ANA, 1).erro === 'descartar:ponte' && sp.ponte_pendentes === 1 && sp.ponte_outra === 1, 'ponte: uma não lida fechada com a velha → descartar:ponte');
    db.sol_ponte[0].lido_em = agora();
    conferir(descartar(ANA, 1).n === 2, 'ponte: a mesma, já lida, não trava');
    voltar(); await trocaAMao();
    db.sol_ponte.push({ id: 'p2', de_app: 'omnilife-one', para_app: 'moneytrio', tipo: 'saude-resumo', grupo_id: GID, user_id: ANA, dados: { v: 1, cif: JSON.stringify({ c: 1, kv: 2, fk: FKN, iv: 'x', ct: 'y' }) }, criado_em: agora(), lido_em: null, lido_por: null });
    const sp2 = situacao();
    conferir(sp2.ponte_pendentes === 1 && sp2.ponte_outra === 0 && descartar(ANA, 1).n === 2, 'ponte: uma não lida fechada com a NOVA não trava (pendentes 1, outra 0)');
    /* o MoneyTRIO */
    voltar(); await trocaAMao();
    db.money_docs.push({ grupo_id: GID, colecao: 'tx', id: 'm1', vis: 'publico', dados: null, dados_cifrado: '{"c":1,"kv":1,"fk":"fk-teste","iv":"x","ct":"y"}', versao: 1, apagado_em: null });
    db.money_migracao.push({ grupo_id: GID, concluida_em: agora() });
    conferir(descartar(ANA, 1).erro === 'descartar:money' && situacao().money_cf === 1, 'money_docs vivo ainda com a CF → descartar:money');
    db.money_docs[0].dados_cifrado = '{"c":1,"m":"c","iv":"x","ct":"y"}';
    conferir(descartar(ANA, 1).n === 2, 'money_docs já no formato novo e a migração registrada: não trava');
    voltar(); await trocaAMao();
    db.money_docs.push({ grupo_id: GID, colecao: 'tx', id: 'm1', vis: 'publico', dados: null, dados_cifrado: '{"c":1,"m":"c","iv":"x","ct":"y"}', versao: 1, apagado_em: null });
    const sm = situacao();
    conferir(descartar(ANA, 1).erro === 'descartar:money' && sm.money_usa === true && sm.money_migrado === false, 'money_migracao ausente (o grupo usa o MoneyTRIO) → descartar:money');
    /* quem precisa da CF atual */
    voltar(); await trocaAMao();
    { const g = linha('settings', 'cofre'); g.dados.membros[BIA].fk = FK0; }
    conferir(descartar(ANA, 1).erro === 'descartar:membros' && situacao().falta_entregar === 1, 'responsável sem a entrega da nova (registro com a fk velha) → descartar:membros (falta 1)');
    voltar(); await trocaAMao();
    const sd = situacao();
    conferir(sd.falta_entregar === 0 && descartar(ANA, 1).n === 2, 'membro com chave pública e sem CF nenhuma (o Davi) NÃO trava (C7)');
    voltar(); await trocaAMao();
    db.sol_grupo_chaves.push({ grupo_id: GID, user_id: DAVI, versao: 1, chave_embrulhada: await embrulhar(db.sol_chave_publica.find((k) => k.user_id === DAVI).chave_publica, M.cfVelha, 1, FK0), embrulhada_por: ANA, criado_em: agora() });
    { const g = linha('settings', 'cofre'); g.dados.membros[DAVI] = { kid: db.sol_chave_publica.find((k) => k.user_id === DAVI).chave_publica.kid, seq: 1, fk: FK0 }; }
    const dd = descartar(ANA, 1);
    conferir(dd.n === 3 && versoes(DAVI) === '', 'membro com uma entrada velha no registro (vinda de uma cópia) NÃO trava, e a linha velha dele sai (' + JSON.stringify(dd) + ')');
    voltar(); await trocaAMao();
    db.sol_grupo_chaves.push({ grupo_id: GID, user_id: BIA, versao: 3, chave_embrulhada: 'aparelho-velho', embrulhada_por: BIA, criado_em: agora() });
    conferir(descartar(ANA, 2).erro === 'descartar:membros', 'ping-pong: um aparelho velho gravou para a Bia uma versão maior que a do registro → descartar:membros');
    voltar(); await trocaAMao();
    db.sol_grupo_chaves.push({ grupo_id: GID, user_id: DAVI, versao: 1, chave_embrulhada: await embrulhar(db.sol_chave_publica.find((k) => k.user_id === DAVI).chave_publica, new Uint8Array(32), 2, FKN), embrulhada_por: ANA, criado_em: agora() });
    { const g = linha('settings', 'cofre'); g.dados.membros[DAVI] = { kid: db.sol_chave_publica.find((k) => k.user_id === DAVI).chave_publica.kid, seq: 1, fk: FKN }; }
    const de1 = descartar(ANA, 1);
    conferir(de1.n === 2 && versoes(DAVI) === '1', 'quem entrou depois da troca com a versão 1 (já da nova) FICA');
    voltar(); await trocaAMao();
    db.sol_grupo_membros.find((m) => m.user_id === BIA).status = 'saiu';
    const ds = descartar(ANA, 1);
    conferir(ds.n === 2 && versoes(BIA) === '2' && versoes(ANA) === '2', 'quem saiu do grupo: as linhas até p_ate_versao saem, a mais nova (acima) fica');
    conferir(descartar(ANA, 2).erro === 'descartar:versao', '… e a maior do grupo continua a referência (p_ate_versao 2 = a mais nova)');
    voltar(); await trocaAMao();
    db.sol_grupo_chaves.push({ grupo_id: GID, user_id: BIA, versao: 5, chave_embrulhada: 'x', embrulhada_por: ANA, criado_em: agora() });
    db.sol_grupo_membros.find((m) => m.user_id === BIA).status = 'saiu';
    const ds2 = descartar(ANA, 4);
    conferir(ds2.n === 3 && versoes(BIA) === '5' && versoes(ANA) === '2', 'quem saiu: tudo dele até p_ate_versao sai; a versão em uso da Ana fica, mesmo abaixo de p_ate_versao (' + JSON.stringify(ds2) + ')');
    /* pelo REST: o mesmo erro com o mesmo código */
    voltar(); await trocaAMao({ estado: 'conferindo' });
    const rr = await rest(ANA, 'POST', '/rest/v1/rpc/sol_descartar_chaves_antigas', { p_grupo: GID, p_ate_versao: 1 });
    conferir(rr.status === 403 && rr.corpo.code === '42501' && /^descartar:giro /.test(rr.corpo.message), 'pelo REST: 403 42501 "descartar:giro …" (o app traduz pelo prefixo)');

    /* M.soChefeGiro: o gatilho do SQL do Omni */
    voltar(); await trocaAMao();
    const semGat = await rest(BIA, 'PATCH', docUrl('settings', 'cofre'), { dados: Object.assign({}, regBanco(), { fk: 'fk-bia', kv: 3 }) }, 'return=representation');
    conferir(semGat.status === 200 && regBanco().fk === 'fk-bia', 'sem o gatilho (hoje), um responsável muda a fk do registro pelo REST (só as guardas do app protegem)');
    voltar(); await trocaAMao(); M.soChefeGiro = true;
    const g1 = await rest(BIA, 'PATCH', docUrl('settings', 'cofre'), { dados: Object.assign({}, regBanco(), { fk: 'fk-bia', kv: 3 }) }, 'return=representation');
    const g2 = await rest(ANA, 'PATCH', docUrl('settings', 'cofre'), { dados: Object.assign({}, regBanco(), { fk: FK0, kv: 1 }) }, 'return=representation');
    const g3 = await rest(ANA, 'PATCH', docUrl('settings', 'cofre'), { dados: Object.assign({}, regBanco(), { fk: 'fk-outra' }) }, 'return=representation');
    conferir(g1.status === 403 && g1.corpo.code === '42501' && g2.status === 403 && /só pode subir/.test(g2.corpo.message) && g3.status === 403 && regBanco().fk === FKN && regBanco().kv === 2,
      'M.soChefeGiro: o responsável não muda a fk (403 42501); o chefe não baixa a kv nem troca a fk com a mesma kv ("só pode subir")');
    const membrosBia = Object.assign({}, regBanco().membros, { [CRIS]: { kid: 'k', seq: 1, fk: FKN } });
    const g4 = await rest(BIA, 'PATCH', docUrl('settings', 'cofre'), { dados: Object.assign({}, regBanco(), { membros: membrosBia }) }, 'return=representation');
    conferir(g4.status === 200 && !!regBanco().membros[CRIS], 'M.soChefeGiro: o responsável ainda muda só os membros (a liberação de sempre)');
    const g5 = await rest(BIA, 'PATCH', docUrl('settings', 'giro'), { dados: Object.assign({}, linha('settings', 'giro').dados, { batida: agora() }) }, 'return=representation');
    const g6 = await rest(BIA, 'POST', '/rest/v1/omni_docs', { grupo_id: GID, colecao: 'settings', id: 'giro', vis: 'restrito', dados: { v: 1 } }, 'resolution=merge-duplicates,return=representation');
    conferir(g5.status === 403 && g6.status === 403 && linha('settings', 'giro').atualizado_por === ANA, 'M.soChefeGiro: o responsável não grava o settings/giro (PATCH nem POST)');
    const g7 = await rest(ANA, 'PATCH', docUrl('settings', 'cofre'), { apagado_em: agora() }, 'return=representation');
    const g8 = await rest(ANA, 'PATCH', docUrl('settings', 'giro'), { apagado_em: agora() }, 'return=representation');
    conferir(g7.status === 403 && g8.status === 403 && !linha('settings', 'cofre').apagado_em && !linha('settings', 'giro').apagado_em, 'M.soChefeGiro: o registro e a troca não se apagam (nem pelo chefe)');
    const g9 = await rest(BIA, 'POST', '/rest/v1/rpc/omni_mudar_campos', { p_grupo: GID, p_colecao: 'settings', p_id: 'cofre', p_campos: { fk: 'fk-bia' } });
    const g10 = await rest(ANA, 'PATCH', docUrl('settings', 'cofre'), { dados: Object.assign({}, regBanco(), { fk: 'fk-3', kv: 3 }) }, 'return=representation');
    conferir(g9.status === 403 && g10.status === 200 && regBanco().fk === 'fk-3', 'M.soChefeGiro: pelo omni_mudar_campos também recusa; o chefe sobe a kv (a troca) e passa');

    /* settings/giro com CAS (versao=eq.): com a versão de antes não grava nada (0 linhas); com a certa, grava; o 2º POST → 409 */
    voltar(); await trocaAMao();
    const vg = linha('settings', 'giro').versao, dg = Object.assign({}, linha('settings', 'giro').dados, { batida: agora() });
    const cas1 = await rest(ANA, 'PATCH', docUrl('settings', 'giro') + '&versao=eq.' + (vg - 1), { dados: dg }, 'return=representation');
    const cas2 = await rest(ANA, 'PATCH', docUrl('settings', 'giro') + '&versao=eq.' + vg, { dados: dg }, 'return=representation');
    const dup = await rest(ANA, 'POST', '/rest/v1/omni_docs', { grupo_id: GID, colecao: 'settings', id: 'giro', vis: 'restrito', dados: { v: 1 } }, 'return=representation');
    conferir(cas1.status === 200 && cas1.corpo.length === 0 && cas2.corpo.length === 1 && cas2.corpo[0].versao === vg + 1 && linha('settings', 'giro').versao === vg + 1 && dup.status === 409,
      'settings/giro com CAS: a versão velha não grava (0 linhas), a certa grava (versão +1), e um segundo POST dá 409');
    /* M.depoisDe: depois do n-ésimo PATCH em vault, chama a ação (uma vez) */
    voltar(); let chamou = 0, quando = -1; const base = M.log.length;
    M.depoisDe = { 'PATCH vault': 2, acao: () => { chamou++; quando = M.log.length - base; } };
    await rest(ANA, 'PATCH', docUrl('vault', 'v0'), { vis: 'restrito' });
    await rest(ANA, 'PATCH', docUrl('settings', 'cofre'), { vis: 'restrito' });
    const antes2 = chamou;
    await rest(ANA, 'PATCH', docUrl('vault', 'v1'), { vis: 'restrito' }); await espere(30);
    await rest(ANA, 'PATCH', docUrl('vault', 'v2'), { vis: 'restrito' }); await espere(30);
    conferir(antes2 === 0 && chamou === 1 && quando === 3 && M.depoisDe === null, 'M.depoisDe: a ação vem depois do 2º PATCH em vault (o de settings não conta), uma vez só');

    /* a ponte de verdade */
    voltar();
    const id1 = rpcs.sol_ponte_enviar(ANA, { p_de: 'omnilife-one', p_para: 'moneytrio', p_tipo: 'saude-resumo', p_grupo: GID, p_dados: { v: 1, cif: 'a' } }); await espere(5);
    const id2 = rpcs.sol_ponte_enviar(BIA, { p_de: 'omnilife-one', p_para: 'moneytrio', p_tipo: 'saude-resumo', p_grupo: GID, p_dados: { v: 1, cif: 'b' } });
    const cx = rpcs.sol_ponte_minha_caixa(DAVI, { p_app: 'moneytrio' });
    conferir(cx.length === 2 && cx[0].id === id1 && cx[1].id === id2 && rpcs.sol_ponte_minha_caixa(DAVI, { p_app: 'moneytrio', p_limite: 1 }).length === 1, 'ponte: a caixa de um membro do grupo traz as mais velhas primeiro (e respeita o limite)');
    conferir(rpcs.sol_ponte_marcar_lido(DAVI, { p_id: id1, p_app: 'moneytrio' }) === true && rpcs.sol_ponte_marcar_lido(DAVI, { p_id: id1, p_app: 'moneytrio' }) === false && rpcs.sol_ponte_marcar_lido(ANA, { p_id: id2, p_app: 'omnilife-one' }) === false,
      'ponte: qualquer membro marca como lida (uma vez); p_app é filtro');
    const cx2 = rpcs.sol_ponte_minha_caixa(ANA, { p_app: 'moneytrio' }), cx3 = rpcs.sol_ponte_minha_caixa(ANA, { p_app: 'moneytrio', p_so_nao_lidas: false });
    conferir(cx2.length === 1 && cx2[0].id === id2 && cx3.length === 2 && db.sol_ponte.find((x) => x.id === id1).lido_por === DAVI, 'ponte: só as não lidas por padrão; todas com p_so_nao_lidas false; lido_por guardado');
    db.sol_ponte_config.push({ user_id: ANA, de_app: 'omnilife-one', para_app: 'moneytrio', ligado: false });
    conferir(rpcs.sol_ponte_minha_caixa(ANA, { p_app: 'moneytrio' }).length === 0 && rpcs.sol_ponte_enviar(ANA, { p_de: 'omnilife-one', p_para: 'moneytrio', p_tipo: 'saude-resumo', p_grupo: GID, p_dados: {} }) === null,
      'ponte: desligada em sol_ponte_config, a caixa esconde e o enviar não guarda (null)');
    const rp = await rest(ANA, 'GET', '/rest/v1/sol_ponte?grupo_id=eq.' + GID + '&para_app=eq.moneytrio&lido_em=is.null&select=id');
    const rf = await rest(ANA, 'GET', '/rest/v1/sol_ponte_config?select=*'), rm = await rest(ANA, 'GET', '/rest/v1/money_migracao?select=*');
    conferir(rp.status === 200 && rp.corpo.length === 1 && rp.corpo[0].id === id2 && rf.status === 404 && rm.status === 404, 'ponte por REST: o membro lê as mensagens do grupo (sem o filtro da config); sol_ponte_config e money_migracao só pelas funções');
  });

  /* ================= G5: depois da troca, a CF antiga não abre nada ================= */
  await parte('G5', 'Depois de uma troca feita à mão no banco, a CF antiga não abre nada (em Node, com M.cfVelha)', async () => {
    const nova = await trocaAMao();
    let fechadas = 0, abremNova = 0, internas = 0, velhaNaoAbre = 0, fkNovo = 0;
    for (const r of vivasVault().filter((x) => x.id !== '_em')) {
      const o = JSON.parse(r.dados_cifrado); if (o.c === 1 && o.fk === FKN && o.kv === 2) fkNovo++;
      if (!(await abre(() => abrirLinha(M.cfVelha, r.dados_cifrado)))) velhaNaoAbre++;
      let doc = null; try { doc = await abrirLinha(nova, r.dados_cifrado); abremNova++; } catch (e) {}
      if (doc && doc.enc && (await abre(() => decifrar(nova, doc.enc))) && !(await abre(() => decifrar(M.cfVelha, doc.enc)))) internas++;
      fechadas++;
    }
    conferir(fechadas === 6 && fkNovo === 6 && abremNova === 6 && internas === 6, 'as 6 linhas vivas: fk novo e kv 2, abrem com a nova, e a parte interna também (só com a nova)');
    conferir(velhaNaoAbre === 6, 'G5. a CF antiga não abre nenhuma das 6 linhas vivas');
    const em = JSON.parse(linha('vault', '_em').dados_cifrado).d.em, emRaw = await decifrar(await kdf(CODIGO_EM, em.sal), em);
    conferir(em.fk === FKN && em.kv === 2 && igual(emRaw, nova) && !igual(emRaw, M.cfVelha), 'G5. o código de emergência refeito (o mesmo código) abre a NOVA, não a velha');
    conferir(!vivasVault().some((r) => { try { return JSON.parse(r.dados_cifrado).fk === FK0; } catch (e) { return false; } }), 'G5. nenhuma linha viva com o fk velho');
    const apag = linha('vault', 'vApagado');
    conferir(JSON.parse(apag.dados_cifrado).fk === FK0 && (await abre(() => abrirLinha(M.cfVelha, apag.dados_cifrado))), 'D-E6: a linha apagada ficou como estava (ninguém mexe no que já está salvo)');
    conferir(situacao().vault_fora === 0 && situacao().giro_ok === true, 'G5. sol_giro_situacao: vault_fora 0 e a troca conferida');
  });

  /* ================= G3 + G3c + G11b + M1 + M2 + C12: o aparelho que ficou com a velha ================= */
  await parte('G3', 'Aparelho velho não devolve a CF antiga; as guardas da carga, do mudar e da cópia', async (novo) => {
    const A = await novo('G3-ana-velho', { vp: 'computador' }), a = A.p;
    await abertoComVelha(a, ANA, PIN_A);
    /* desde a E4 o aparelho acompanha a troca sozinho (Cofre.conferirAoVivo, no Cloud.poll e no envio): aqui ele fica com a velha
       de propósito — como uma 2.26 aberta, ou antes da volta do poll que adota — para provar que as guardas valem sozinhas.
       O caminho de verdade (volta, adota e nunca entrega a velha) é o G2/G3 da E4 */
    await a.evaluate(() => { Cofre.conferirAoVivo = async () => false; });
    const n0 = db.sol_grupo_chaves.length;
    conferir(await a.evaluate(() => Cofre.aberto() && Cofre.fk) === FK0 && n0 === 2, 'preparo: a Ana abre as Senhas da casa com a CF de antes (fk-teste); 2 linhas em sol_grupo_chaves');
    /* positivo, antes da troca: com a chave atual, a carga "família" sai (para a Bia, responsável) */
    const c0 = await a.evaluate(async (bia) => { const L = await Cofre.local(), k = await Aparelhos.carga({ tipo: 'familia', grupo_id: S.family.id, quem: bia }, L, new Uint8Array(Cofre.dukRaw)); const ok = !!k.c; if (k.zerar) k.zerar(); return { ok, texto: k.texto || '' }; }, BIA);
    conferir(c0.ok, 'antes da troca: a carga "família" para a Bia (responsável) sai com a chave atual');
    /* G11b: um membro pede "para a família" → a carga recusa (a última porta, além da tela) */
    const c1 = await a.evaluate(async (davi) => { const L = await Cofre.local(), k = await Aparelhos.carga({ tipo: 'familia', grupo_id: S.family.id, quem: davi }, L, new Uint8Array(Cofre.dukRaw)); if (k.zerar) k.zerar(); return { c: !!k.c, texto: k.texto || '' }; }, DAVI);
    conferir(!c1.c && /não é chefe nem responsável/.test(c1.texto), 'G11b. pedido "para a família" do Davi (membro): a carga recusa (' + c1.texto + ')');
    /* a mesma fk com a kv do registro MAIOR que a deste aparelho (um envelope com a kv falsa): também não é a atual */
    const reg0 = regBanco();
    gravarDoc('settings', 'cofre', { dados: Object.assign({}, reg0, { kv: 5 }) }, ANA);
    await darPublica(CRIS);
    await a.evaluate(async () => { await CloudDriver.pull(); });
    let marca = M.log.length;
    await distribuirJa(a);
    const ek = await entregas(marca);
    const ck = await a.evaluate(async (bia) => { const L = await Cofre.local(), k = await Aparelhos.carga({ tipo: 'familia', grupo_id: S.family.id, quem: bia }, L, new Uint8Array(Cofre.dukRaw)); if (k.zerar) k.zerar(); return { c: !!k.c, texto: k.texto || '', pm: Cofre.podeMudar() }; }, BIA);
    conferir(ek.length === 0 && !ck.c && /versão antiga/.test(ck.texto) && /precisa da atualização/.test(ck.pm.texto || ''), 'a mesma fk com uma kv maior no registro: nada embrulhado, a carga recusa e não se muda nada (' + JSON.stringify(ek) + ')');
    gravarDoc('settings', 'cofre', { dados: reg0 }, ANA);
    db.sol_chave_publica.splice(db.sol_chave_publica.findIndex((k) => k.user_id === CRIS), 1); delete M.PKCS8[CRIS];
    await a.evaluate(async () => { await CloudDriver.pull(); });
    /* G3c: uma mudança do registro esperando na fila (adiada, como depois de um "Depois" num conflito) */
    await semRede(A.ctx, true);
    await a.evaluate(async () => { await DB.put('settings', JSON.parse(JSON.stringify(Cofre.registro())), true); CloudDriver.adiado.set('settings|cofre', Date.now() + 1e9); for (let i = 0; i < 30 && !CloudDriver.fila.has('settings|cofre'); i++) await new Promise((r) => setTimeout(r, 100)); });
    const nova = await trocaAMao();
    const kidCris = await darPublica(CRIS);   /* uma responsável que ganhou a chave pública depois (ainda sem CF) */
    await semRede(A.ctx, false); await espere(300);
    marca = M.log.length;
    await distribuirJa(a);
    const e1 = await entregas(marca), local1 = await a.evaluate(() => JSON.parse(JSON.stringify(Cofre.registro())));
    conferir(local1.fk === FK0 && e1.length === 0 && regOk(regBanco()), 'G3c. com o registro na fila (a cópia daqui ainda diz fk-teste), o _distribuir decide pelo banco: nada embrulhado (' + JSON.stringify(e1) + ')');
    /* a fila sobe: o registro de antes não volta */
    await a.evaluate(() => CloudDriver.adiado.clear()); await subir(a, true);
    const local2 = await a.evaluate(() => JSON.parse(JSON.stringify(Cofre.registro())));
    conferir(regOk(regBanco()) && local2.fk === FKN && local2.kv === 2 && !(await a.evaluate(() => CloudDriver.fila.has('settings|cofre'))), 'o registro que estava na fila sobe sem voltar o do banco; a cópia daqui passa a ser a do banco');
    /* G3: de volta à internet, com as Senhas abertas com a velha: nada sai para ninguém */
    marca = M.log.length;
    await distribuirJa(a); await a.evaluate(() => Cloud.poll && Cloud.poll()).catch(() => {}); await espere(1500); await distribuirJa(a);
    const e2 = await entregas(marca);
    const todas = await Promise.all(db.sol_grupo_chaves.filter((c) => c.versao > 1).map(async (c) => { try { return (await desembrulhar(c.user_id, c.chave_embrulhada)).fk; } catch (e) { return '?'; } }));
    conferir(e2.length === 0 && todas.every((f) => f === FKN) && db.sol_grupo_chaves.length === 4 && regOk(regBanco()) && regBanco().kv === 2,
      'G3. o aparelho velho não chama sol_guardar_chave_grupo; toda linha nova abre com a fk nova; o registro continua o novo e a kv não desce (' + JSON.stringify(e2) + ')');
    /* o registro pela fila não anda para trás (C4): um aparelho sem a cópia do registro que manda um novo, com a chave dele */
    await semRede(A.ctx, true);
    await a.evaluate(async (ana) => {
      CloudDriver.recs.delete('settings|cofre'); DB.col('settings').delete('cofre');
      await DB.put('settings', { id: 'cofre', vis: 'restrito', fk: Cofre.fk, kv: Cofre.kv, membros: { [ana]: { kid: 'kid-velho', seq: 1, fk: Cofre.fk } } }, true);
      for (let i = 0; i < 30 && !CloudDriver.fila.has('settings|cofre'); i++) await new Promise((r) => setTimeout(r, 100));
    }, ANA);
    await semRede(A.ctx, false); await espere(300);
    await subir(a, true, 'settings|cofre');
    const local3 = await a.evaluate(() => JSON.parse(JSON.stringify(Cofre.registro() || {})));
    conferir(regOk(regBanco()) && regBanco().kv === 2 && local3.fk === FKN, 'C4. um registro "de antes" que um aparelho sem a cópia manda pela fila não volta o do banco (fica o do banco, aqui também)');
    await a.evaluate(async (fk0) => { await DB.put('settings', Object.assign(JSON.parse(JSON.stringify(Cofre.registro())), { fk: fk0, kv: 1 }), true); }, FK0); await subir(a, true, 'settings|cofre');
    conferir(regOk(regBanco()) && regBanco().kv === 2, 'C4. nem com a versão certa da linha: a fk e a kv de antes não sobem pela fila');
    await a.evaluate(async () => { await DB.put('settings', Object.assign(JSON.parse(JSON.stringify(Cofre.registro())), { fk: 'fk-outra', kv: 2 }), true); }); await subir(a, true, 'settings|cofre');
    conferir(regBanco().fk === FKN, 'C4. outra fk com a mesma kv também não sobe');
    await a.evaluate(async () => { await DB.del('settings', 'cofre'); }); await subir(a, true, 'settings|cofre');
    conferir(!linha('settings', 'cofre').apagado_em && await a.evaluate(() => !!Cofre.registro()), 'C4. o registro não se apaga pela fila (volta o do banco)');
    /* o estado da troca nunca vai pela fila (só por REST, com a versão conferida): nem mudado, nem apagado */
    const giroAntes0 = JSON.stringify(linha('settings', 'giro'));
    await a.evaluate(async () => { await DB.put('settings', Object.assign(JSON.parse(JSON.stringify(DB.col('settings').get('giro'))), { estado: 'desistiu', envelopes: { x: '1.velho' } }), true); }); await subir(a, true, 'settings|giro');
    const gLocal = await a.evaluate(() => (DB.col('settings').get('giro') || {}).estado);
    await a.evaluate(async () => { await DB.del('settings', 'giro'); }); await subir(a, true, 'settings|giro');
    conferir(JSON.stringify(linha('settings', 'giro')) === giroAntes0 && gLocal === 'feito' && await a.evaluate(() => !!DB.col('settings').get('giro')), 'o estado da troca não sobe pela fila (mudado ou apagado): fica o do banco, aqui também');
    /* 2.b.3: a carga "família" do aparelho velho recusa */
    const c2 = await a.evaluate(async (bia) => { const L = await Cofre.local(), k = await Aparelhos.carga({ tipo: 'familia', grupo_id: S.family.id, quem: bia }, L, new Uint8Array(Cofre.dukRaw)); if (k.zerar) k.zerar(); return { c: !!k.c, texto: k.texto || '' }; }, BIA);
    conferir(!c2.c && /versão antiga das Senhas da casa/.test(c2.texto), 'G3. a carga "família" do aparelho velho recusa: "' + c2.texto + '"');
    /* M1: podeMudar e o selar */
    await vigiarAvisos(a);
    const pm = await a.evaluate(async () => {
      const r = Cofre.podeMudar(); let selou = 'selou';
      try { await Cofre.selar({ id: 'x1', kind: 'senha', vis: 'restrito' }); } catch (e) { selou = e.message; }
      let em = 'selou'; try { await Cofre.selar({ id: '_em', em: { kv: 1 }, vis: 'restrito' }); } catch (e) { em = e.message; }
      const antes = DB.all('vault').length; editVault(null, 'senha'); await new Promise((r) => setTimeout(r, 600));
      const form = !!document.querySelector('.modal input[name="title"]'); if (form) closeModals();
      const cod = await Cofre.envelope();
      let carro = 'gravou'; try { await Cars.guardarSegredo({ id: 'c9', name: 'Carro', seguro: {} }, { placa: 'ABC1D23' }); } catch (e) { carro = e.message; }
      return { r, selou, em, form, cod: cod || null, carro, novos: DB.all('vault').length - antes, fila: [...CloudDriver.fila.keys()].filter((k) => k.startsWith('vault|')).length };
    });
    await espere(400);
    const av = await avisos(a);
    conferir(/precisa da atualização/.test(pm.r.texto || '') && /precisa da atualização/.test(pm.selou) && /precisa da atualização/.test(pm.em), 'M1. com a chave velha: podeMudar → "' + (pm.r.texto || '') + '"; o selar (item e _em) recusa');
    conferir(!pm.form && !pm.cod && /precisa da atualização/.test(pm.carro) && pm.novos === 0 && pm.fila === 0 && /precisa da atualização/.test(av),
      'M1. editar, o código de emergência e a placa do carro param antes (aviso para leigo); nada novo nas Senhas nem na fila (' + av + ')');
    /* 2.b.4: uma carga "família" velha chega a um aparelho novo (da Bia) */
    const N = await novo('G3-bia-novo', { vp: 'celular' }), b = N.p;
    await entrarOmni(b, BIA); await quieto(b);
    const apId = crypto.randomUUID();
    db.sol_aparelhos.push({ id: apId, user_id: BIA, nome: 'Android · Chrome', app: 'omnilife', como: 'familia', aprovado_por: ANA, aprovado_por_ap: null, criado_em: agora(), visto_em: agora(), removido_em: null, removido_por: null });
    await b.evaluate(async (o) => { Aparelhos.receber({ tipo: 'familia', gid: S.family.id, kv: 1, fk: o.fk, cf: new Uint8Array(o.cf) }, o.ap, 'familia'); }, { fk: FK0, cf: [...VELHA], ap: apId });
    const viu = await esperar(b, () => [...document.querySelectorAll('.modal')].some((m) => /versão antiga/.test(m.innerText)), null, 10000);
    const t4 = await janelas(b);
    conferir(viu && /Pedir de novo/.test(t4) && !(await b.evaluate(async () => !!(await Cofre.local()))) && !(await b.evaluate(() => Cofre.aberto())) && await (async () => { await espere(400); return !!db.sol_aparelhos.find((x) => x.id === apId).removido_em; })(),
      'G3. a carga "família" velha que chega: "' + t4.slice(0, 120) + '", nada montado e o lugar novo sai da lista');
    await b.evaluate(() => closeModals());
    /* positivo: com a CF NOVA (como depois da etapa E4) o mesmo aparelho entrega a nova — para a Cris; o Davi (membro) não recebe */
    marca = M.log.length;
    await a.evaluate(async (raw) => { await Cofre.usarChave(new Uint8Array(raw), 2, 'fk-nova'); }, [...nova]);
    await espere(500); await distribuirJa(a);
    const e3 = await entregas(marca);
    await ate(() => regBanco().membros[CRIS], 5000);
    conferir(e3.length === 1 && e3[0].user === CRIS && e3[0].fk === FKN && e3[0].kv === 2 && regBanco().membros[CRIS] && regBanco().membros[CRIS].fk === FKN && regBanco().membros[CRIS].kid === kidCris,
      'com a chave do registro, o aparelho entrega a nova à Cris (responsável que faltava) e o registro a anota (' + JSON.stringify(e3) + ' · ' + JSON.stringify(regBanco().membros[CRIS] || null) + ' · ' + (await avisos(a)) + ')');
    conferir(!db.sol_grupo_chaves.some((c) => c.user_id === DAVI) && !regBanco().membros[DAVI], 'G11b. o Davi (membro, com chave pública) não recebe a CF (D-E1)');
    const pm2 = await a.evaluate(() => Cofre.podeMudar());
    conferir(pm2.ok === true, 'com a chave do registro: podeMudar ok');
    /* M2: durante a troca ninguém entrega nem muda; a troca "publico" não vale (C9) */
    gravarDoc('settings', 'giro', { vis: 'restrito', dados: Object.assign({}, linha('settings', 'giro').dados, { estado: 'recifrando', batida: agora(), fim: null }) }, ANA);
    await darPublica(CRIS);   /* a Cris trocou de chave: falta entregar de novo */
    await a.evaluate(async () => { await CloudDriver.pull(); });
    marca = M.log.length;
    await distribuirJa(a);
    const e4 = await entregas(marca);
    const g = await a.evaluate(async (bia) => { const L = await Cofre.local(), k = await Aparelhos.carga({ tipo: 'familia', grupo_id: S.family.id, quem: bia }, L, new Uint8Array(Cofre.dukRaw)); if (k.zerar) k.zerar(); return { em: Giro.emCurso(), vivo: Giro.vivo(), c: !!k.c, texto: k.texto || '', pm: Cofre.podeMudar() }; }, BIA);
    conferir(g.em && g.vivo && e4.length === 0, 'M2. com a troca em curso: o _distribuir não entrega a ninguém (só a troca entrega)');
    conferir(!g.c && /Espere a troca de segurança terminar para aprovar/.test(g.texto) && /Espere a troca de segurança terminar para mudar/.test(g.pm.texto || ''), 'M2. a carga "família" espera e o podeMudar também ("' + g.texto + '")');
    gravarDoc('settings', 'giro', { vis: 'restrito', dados: Object.assign({}, linha('settings', 'giro').dados, { estado: 'recifrando' }) }, ANA);
    linha('settings', 'giro').atualizado_em = new Date(Date.now() - 10 * 60e3).toISOString();
    await a.evaluate(async () => { CloudDriver.recs.delete('settings|giro'); CloudDriver.cur = ''; await CloudDriver.pull(); });
    const parada = await a.evaluate(() => ({ em: Giro.emCurso(), vivo: Giro.vivo(), pm: Cofre.podeMudar() }));
    conferir(parada.em && !parada.vivo && parada.pm.ok === true, 'M2. troca parada há 10 min: ainda "em curso" (ninguém entrega), mas mudar as senhas volta a poder');
    gravarDoc('settings', 'giro', { vis: 'publico', dados: Object.assign({}, linha('settings', 'giro').dados, { vis: 'publico', estado: 'recifrando' }) }, BIA);
    await a.evaluate(async () => { await CloudDriver.pull(); });
    marca = M.log.length;
    await distribuirJa(a);
    const e5 = await entregas(marca), pub = await a.evaluate(() => Giro.emCurso());
    conferir(!pub && e5.length === 1 && e5[0].user === CRIS && e5[0].fk === FKN, 'C9. uma "troca" gravada como "publico" não vale: não trava a família (a entrega para a Cris segue com a nova)');
    /* C12: a cópia não leva o registro nem a troca; restaurar não mexe neles */
    gravarDoc('settings', 'giro', { vis: 'restrito', dados: Object.assign({}, linha('settings', 'giro').dados, { vis: 'restrito', estado: 'feito', envelopes: {} }) }, ANA);
    await a.evaluate(async () => { await CloudDriver.pull(); }); await subir(a, true);
    const copia = await a.evaluate(async () => { const o = JSON.parse(await backupJSON(false)); return { ids: (o.data.settings || []).map((d) => d.id), temCofreAqui: !!DB.col('settings').get('cofre'), temGiroAqui: !!DB.col('settings').get('giro') }; });
    conferir(copia.temCofreAqui && copia.temGiroAqui && !copia.ids.includes('cofre') && !copia.ids.includes('giro'), 'C12. a cópia (backupJSON) não leva o registro nem a troca (' + copia.ids.join(',') + ')');
    const regAntes = JSON.stringify(linha('settings', 'cofre')), giroAntes = JSON.stringify(linha('settings', 'giro'));
    await a.evaluate(async (o) => {
      const p = Restore.aplicar({ app: 'OmniLifeONE', v: 1, data: { settings: [{ id: 'cofre', vis: 'restrito', fk: o.fk0, kv: 1, membros: { velho: { kid: 'k', seq: 1, fk: o.fk0 } } }, { id: 'giro', vis: 'restrito', v: 1, estado: 'feito', envelopes: { x: '1.velho' } }], people: [] } }, {});
      for (let i = 0; i < 40; i++) { await new Promise((r) => setTimeout(r, 100)); const b = document.querySelector('.modal [data-m="juntar"]'); if (b) { b.click(); break; } }
      await Promise.race([p, new Promise((r) => setTimeout(r, 15000))]);
    }, { fk0: FK0 });
    await subir(a, true);
    await espere(500);
    const fila = await a.evaluate(() => [...CloudDriver.fila.keys()]);
    conferir(JSON.stringify(linha('settings', 'cofre')) === regAntes && JSON.stringify(linha('settings', 'giro')) === giroAntes && !fila.includes('settings|cofre') && !fila.includes('settings|giro'),
      'C12. restaurar uma cópia que traz o registro de antes e a troca não mexe neles (nem pela fila)');
  });

  /* ================= N1: o montar com novaCF nunca cria uma segunda CF ================= */
  await parte('N1', 'Conta nova: sem resposta do banco (ou com o registro apagado), nenhuma segunda chave da família', async (novo) => {
    const N = await novo('N1-cris', { vp: 'celular' }), c = N.p;
    await entrarOmni(c, CRIS); await quieto(c);
    const regAntes = JSON.stringify(regBanco()), nAntes = db.sol_grupo_chaves.length;
    /* a leitura do omni_docs cai (rede) e a cópia daqui não tem o registro */
    const cortar = (u) => u.href.includes('/rest/v1/omni_docs');
    await c.route(cortar, (r) => (r.request().method() === 'GET' ? r.abort() : r.fallback()));
    let marca = M.log.length;
    const r1 = await c.evaluate(async (pin) => {
      CloudDriver.recs.delete('settings|cofre'); DB.col('settings').delete('cofre');
      const par = await Cofre.novoPar(); const r = await Cofre.montar(par.pkcs8, null, pin, 'primeiro', null, null, true);
      return { erro: r.erro || null, ok: !!r.ok, L: !!(await Cofre.local()), aberto: Cofre.aberto() };
    }, PIN_C);
    conferir(r1.erro === 'rede' && !r1.ok && !r1.L && !r1.aberto && JSON.stringify(regBanco()) === regAntes && db.sol_grupo_chaves.length === nAntes && !(await entregas(marca)).length,
      'N1. montar com novaCF e a leitura do registro falhando: {erro:"rede"}, nada montado, nenhuma chave nova (' + JSON.stringify(r1) + ')');
    /* o criarConta (a conta nova de verdade) com a mesma falha: devolve "rede" sem deixar linha na lista */
    const r2 = await c.evaluate(async (pin) => { CloudDriver.recs.delete('settings|cofre'); DB.col('settings').delete('cofre'); const r = await Cofre.criarConta(pin); return { erro: r.erro || null, L: !!(await Cofre.local()) }; }, PIN_C);
    await espere(600);
    conferir(r2.erro === 'rede' && !r2.L && !db.sol_aparelhos.some((x) => x.user_id === CRIS && !x.removido_em) && JSON.stringify(regBanco()) === regAntes && db.sol_grupo_chaves.length === nAntes,
      'N1. criarConta com a mesma falha: "rede", nenhum cadeado, nenhuma linha da Cris na lista, nenhuma chave nova (' + JSON.stringify(r2) + ')');
    await c.unroute(cortar);
    /* o registro apagado ainda diz que a família tem chave (C4): não nasce outra */
    linha('settings', 'cofre').apagado_em = agora();
    marca = M.log.length;
    const r3 = await c.evaluate(async (pin) => {
      CloudDriver.recs.delete('settings|cofre'); DB.col('settings').delete('cofre');
      const par = await Cofre.novoPar(); const r = await Cofre.montar(par.pkcs8, null, pin, 'primeiro', null, null, true); if (r.raw) r.raw.fill(0);
      const L = await Cofre.local(); return { erro: r.erro || null, fam: L ? Object.keys(L.fam || {}).length : -1, aberto: Cofre.aberto() };
    }, PIN_C);
    conferir(r3.erro === 'aguardando' && r3.fam === 0 && !r3.aberto && db.sol_grupo_chaves.length === nAntes && linha('settings', 'cofre').dados.fk === FK0 && !(await entregas(marca)).length,
      'N1. com o registro apagado no banco: "Falta liberar" (o cadeado sem a chave da família), nenhuma chave nova (' + JSON.stringify(r3) + ')');
  });

  /* ================= CH (etapa E3): o chaveiro ================= */
  await parte('CH', 'O chaveiro: a atual fecha, as de antes só abrem (linhas, parte interna, anexos); trancar zera tudo', async (novo) => {
    const A = await novo('CH-ana', { vp: 'computador' }), a = A.p;
    await abertoComVelha(a, ANA, PIN_A);
    /* a troca pela metade: v0, v1 e v5 ainda com a de antes; o registro já diz a nova */
    const nova = await trocaAMao({ pular: ['v0', 'v1', 'v5'] });
    await a.evaluate(async () => { await CloudDriver.pull(); });
    const IDS = ITENS.map((x, i) => 'v' + i), TITULOS = ITENS.map((x) => x[1]);
    /* o que o aparelho mostra de cada item: o fk da linha, o título (pela chave de agora, como a tela), o antigo() e a parte interna */
    const ver = (ids) => a.evaluate(async (ids) => {
      const out = {};
      for (const id of ids) {
        const v = DB.col('vault').get(id), rec = CloudDriver.recs.get('vault|' + id); let titulo = null, interna = false;
        try { titulo = (await Vault.decObj(v.enc)).title; } catch (e) {}
        try { await Vault.decStr(v.enc, Cofre.vf); interna = true; } catch (e) {}
        out[id] = { fk: rec && JSON.parse(rec.cif).fk, titulo, antigo: v ? await Cofre.antigo(v) : null, interna };
      }
      return out;
    }, ids);
    /* a nova como atual e a de antes no chaveiro (como fica depois de adotar) */
    const r1 = await a.evaluate(async (o) => {
      Cofre.trancar();
      const velha = new Uint8Array(o.velha);
      await Cofre.usarChave(new Uint8Array(o.nova), 2, o.fkn, [{ raw: velha, kv: 1, fk: o.fk0 }]);
      return { zerou: velha.every((b) => b === 0), fk: Cofre.fk, kv: Cofre.kv, outras: Cofre.outras.map((x) => ({ kv: x.kv, fk: x.fk, ext: x.vf.extractable, tipo: x.vf.type })),
        velha: !!Cofre.chaveDe(o.fk0) && Cofre.chaveDe(o.fk0) !== Cofre.vf, atual: Cofre.chaveDe(o.fkn) === Cofre.vf, nenhuma: Cofre.chaveDe('fk-que-nao-existe') };
    }, { nova: [...nova], velha: [...VELHA], fkn: FKN, fk0: FK0 });
    conferir(r1.zerou && r1.fk === FKN && r1.kv === 2 && JSON.stringify(r1.outras) === JSON.stringify([{ kv: 1, fk: FK0, ext: false, tipo: 'secret' }]) && r1.velha && r1.atual && r1.nenhuma === null,
      'CH. usarChave(nova, …, [de antes]): a de antes entra no chaveiro como chave do navegador (não extraível) e os bytes dela zeram; chaveDe acha cada uma (' + JSON.stringify(r1) + ')');
    const v1 = await ver(IDS);
    const mix = ['v0', 'v1', 'v5'].every((id) => v1[id].fk === FK0) && ['v2', 'v3', 'v4'].every((id) => v1[id].fk === FKN);
    conferir(mix && IDS.every((id, i) => v1[id].titulo === TITULOS[i]), 'CH. as 6 aparecem: 3 fechadas com a nova e 3 ainda com a de antes (a linha diz o fk) (' + JSON.stringify(v1) + ')');
    conferir(IDS.every((id) => v1[id].interna && v1[id].antigo === false), 'CH. a parte interna das que vieram com a de antes passou para a atual (na memória): o antigo() diz false em todas');
    /* o que não é do chaveiro continua fora */
    const r2 = await a.evaluate(async (o) => {
      const estranha = await Cofre.aes(Cofre.rnd(32)), sel = async (k, fk) => JSON.stringify(Object.assign({ c: 1, kv: 1, fk }, await Cofre.cifrar(k, new TextEncoder().encode(JSON.stringify({ kind: 'senha', vis: 'restrito' })))));
      return { fkEstranho: await Cofre.abrir('x1', await sel(estranha, 'fk-estranha')), fkMentiroso: await Cofre.abrir('x2', await sel(estranha, o.fk0)),
        antigo: await Cofre.antigo({ id: 'x3', kind: 'senha', enc: await Vault.encStr('{}', estranha) }) };
    }, { fk0: FK0 });
    conferir(r2.fkEstranho === null && r2.fkMentiroso === null && r2.antigo === true, 'CH. uma linha de fk que o chaveiro não tem (ou que mente o fk) não abre; uma parte interna de outra chave continua "antiga"');
    /* selar e editar: sempre a atual, as duas camadas */
    const s1 = await a.evaluate(async () => Cofre.selar({ id: 'x4', kind: 'senha', enc: await Vault.encObj({ title: 'novo' }), vis: 'restrito' }));
    const o1 = JSON.parse(s1);
    conferir(o1.c === 1 && o1.fk === FKN && o1.kv === 2 && Object.keys(o1).sort().join() === 'c,ct,fk,iv,kv' && (await abre(() => abrirLinha(nova, s1))) && !(await abre(() => abrirLinha(VELHA, s1))),
      'CH. o selar fecha com a atual (fk-nova, kv 2), no formato de sempre {c, kv, fk, iv, ct}; a de antes não abre');
    let marca = M.log.length;
    await a.evaluate(async () => { const v = DB.col('vault').get('v0'); await DB.put('vault', Object.assign({}, v, { updatedAt: '2026-11-12T10:00:00.000Z' }), true); });
    await subir(a, true, 'vault|v0');
    const l0 = linha('vault', 'v0'), o0 = JSON.parse(l0.dados_cifrado);
    let d0 = null; try { d0 = await abrirLinha(nova, l0.dados_cifrado); } catch (e) {}
    let t0 = null; try { t0 = JSON.parse(new TextDecoder().decode(await decifrar(nova, d0.enc))).title; } catch (e) {}
    conferir(o0.fk === FKN && o0.kv === 2 && Object.keys(o0).sort().join() === 'c,ct,fk,iv,kv' && t0 === TITULOS[0] && !(await abre(() => decifrar(VELHA, d0.enc))) && !l0.apagado_em && vivasVault().length === 7,
      'CH. editar um item que veio com a de antes: sobe com a atual nas DUAS camadas (o mesmo item, nenhum novo)');
    conferir(!M.log.slice(marca).some((l) => /sol_guardar_chave_grupo/.test(l.caminho)), 'CH. nada entregue a ninguém ao editar');
    /* anexos: com enc.fk de uma de antes, sem enc.fk (de antes da 2.27.0), novos (enc.fk = a atual) */
    const r3 = await a.evaluate(async (o) => {
      const blob = () => new Blob([new TextEncoder().encode('anexo de mentira')], { type: 'text/plain' });
      const guardar = async (id, k, fk) => {
        const r = await Vault.encryptBlob(blob(), k), meta = { id, name: id + '.txt', type: 'application/octet-stream', size: r.blob.size, vis: 'restrito', enc: Object.assign({ iv: r.iv, type: 'text/plain' }, fk ? { fk } : {}), chunks: 1 };
        await DB.driver.putFile(id, r.blob, meta); await DB.put('files', meta, true);
      };
      await guardar('fCHvelho', Cofre.chaveDe(o.fk0), o.fk0);
      await guardar('fCHsemfk', Cofre.chaveDe(o.fk0), null);
      await guardar('fCHestranho', await Cofre.aes(Cofre.rnd(32)), 'fk-estranha');
      const id = await Files.save(new File([blob()], 'novo.txt', { type: 'text/plain' }), { encrypt: true, vis: 'restrito', raw: true });
      const m = Files.meta(id), b = await DB.driver.getFile(id, m);
      const abre = async (k) => { try { await Vault.decryptBlob(b, m.enc.iv, m.enc.type, k); return true; } catch (e) { return false; } };
      const txt = async (id) => { try { return await (await Files.blob(id)).text(); } catch (e) { return 'erro'; } };
      return { velho: await txt('fCHvelho'), semfk: await txt('fCHsemfk'), estranho: await txt('fCHestranho'), novo: await txt(id), id, enc: Object.keys(m.enc).sort().join(), fk: m.enc.fk,
        novoAtual: await abre(Cofre.vf), novoVelha: await abre(Cofre.chaveDe(o.fk0)) };
    }, { fk0: FK0 });
    conferir(r3.velho === 'anexo de mentira' && r3.semfk === 'anexo de mentira' && r3.estranho === 'erro', 'CH. anexos: o de enc.fk de antes abre, o sem enc.fk (de antes da 2.27.0) abre, o de outra chave não (' + JSON.stringify(r3) + ')');
    conferir(r3.novo === 'anexo de mentira' && r3.fk === FKN && r3.enc === 'fk,iv,type' && r3.novoAtual && !r3.novoVelha, 'CH. o anexo novo (Files.save) fecha com a atual e diz o fk dela (enc = {iv, type, fk})');
    /* trancar zera tudo */
    const r4 = await a.evaluate(async (o) => {
      const raw = Cofre.vfRaw; Cofre.trancar();
      let blob = 'abriu'; try { await Files.blob('fCHvelho'); } catch (e) { blob = e.message; }
      return { raw: raw.every((b) => b === 0), outras: Cofre.outras.length, vf: Cofre.vf, vfRaw: Cofre.vfRaw, fk: Cofre.fk, chave: S.vaultKey, velha: Cofre.chaveDe(o.fk0), nova: Cofre.chaveDe(o.fkn),
        abre: await Cofre.abrir('v1', CloudDriver.recs.get('vault|v1').cif), blob, itens: DB.all('vault').map((v) => v.id).join() };
    }, { fk0: FK0, fkn: FKN });
    conferir(r4.raw && r4.outras === 0 && r4.vf === null && r4.vfRaw === null && r4.fk === '' && r4.chave === null && r4.velha === null && r4.nova === null && r4.abre === null && r4.blob === 'vault-locked' && r4.itens === '_em',
      'CH. trancar zera tudo: a atual (os bytes também), as de antes, nenhuma linha nem anexo abre, só o código de emergência fica na tela (' + JSON.stringify(r4) + ')');
    /* sem a chave da família (a chave da senha principal, como no "só neste aparelho"): o anexo não ganha enc.fk e abre como antes */
    const r4b = await a.evaluate(async () => {
      S.vaultKey = await Vault.derive('senha-de-mentira', b64FromBuf(Cofre.rnd(16)), 1000);
      try {
        const id = await Files.save(new File([new TextEncoder().encode('anexo local')], 'local.txt', { type: 'text/plain' }), { encrypt: true, vis: 'restrito', raw: true });
        const m = Files.meta(id); let t = 'erro'; try { t = await (await Files.blob(id)).text(); } catch (e) {}
        return { enc: Object.keys(m.enc).sort().join(), t };
      } finally { S.vaultKey = null; }
    });
    conferir(r4b.enc === 'iv,type' && r4b.t === 'anexo local', 'CH. com a chave da senha principal (sem a da família), o anexo fica como antes ({iv, type}) e abre (' + JSON.stringify(r4b) + ')');
    /* um aparelho que já adotou a nova: L.fam[gid] = a nova, e a de antes em velhas (fechada pela chave do aparelho). Uma velha que
       não abre fica de fora */
    const fam0 = await a.evaluate(async (o) => {
      const d = await Cofre._pinRaw(o.pin), duk = await Cofre.aes(d.raw); d.raw.fill(0);
      await Cofre.mudarLocal(null, async (L) => {
        const f = L.fam[S.family.id];
        L.fam[S.family.id] = Object.assign({ kv: 2, fk: o.fkn }, await Cofre.cifrar(duk, new Uint8Array(o.nova)), { velhas: [{ kv: f.kv, fk: f.fk, iv: f.iv, ct: f.ct }, { kv: 0, fk: 'fk-quebrada', iv: f.iv, ct: 'AAAA' }] });
        return L;
      });
      return JSON.stringify(await Cofre.local());
    }, { pin: PIN_A, nova: [...nova], fkn: FKN });
    marca = M.log.length;
    const r5 = await a.evaluate(async (pin) => {
      const d = await Cofre._pinRaw(pin), r = await Cofre.comChaveDoAparelho(await Cofre.local(), d.raw);
      for (let i = 0; i < 100 && Cofre._distP; i++) await new Promise((x) => setTimeout(x, 100));
      return { r, fk: Cofre.fk, kv: Cofre.kv, outras: Cofre.outras.map((x) => x.fk) };
    }, PIN_A);
    const v5 = await ver(IDS);
    const r6 = await a.evaluate(async () => { const txt = async (id) => { try { return await (await Files.blob(id)).text(); } catch (e) { return 'erro'; } }; return { velho: await txt('fCHvelho'), semfk: await txt('fCHsemfk') }; });
    await espere(300);
    const fam1 = await a.evaluate(async () => JSON.stringify(await Cofre.local()));
    conferir(r5.r.ok && r5.fk === FKN && r5.kv === 2 && JSON.stringify(r5.outras) === JSON.stringify([FK0]), 'CH. velhas: o aparelho abre pelo PIN com a nova e a de antes (a quebrada fica de fora) (' + JSON.stringify(r5) + ')');
    conferir(IDS.every((id, i) => v5[id].titulo === TITULOS[i] && v5[id].antigo === false) && ['v1', 'v5'].every((id) => v5[id].fk === FK0) && r6.velho === 'anexo de mentira' && r6.semfk === 'anexo de mentira',
      'CH. velhas: continua lendo as linhas e os anexos de antes (' + JSON.stringify(v5) + ')');
    conferir(fam1 === fam0 && !M.log.slice(marca).some((l) => ['PATCH', 'POST'].includes(l.metodo) && /omni_docs|sol_guardar_chave_grupo/.test(l.caminho)),
      'CH. abrir com o chaveiro não grava nada: nem no cadeado deste aparelho, nem nas Senhas da casa, nem no registro');
  });

  /* ================= G2 (etapa E4): o outro aparelho percebe a chave nova e abre ================= */
  await parte('G2', 'O outro aparelho percebe a chave nova: aberto, adota no Cloud.poll sem PIN; fechado, ao abrir pelo PIN; nunca entrega a velha', async (novo) => {
    const B = await novo('G2-ana-computador', { vp: 'computador' }), b = B.p;
    const C = await novo('G2-ana-celular', { vp: 'celular' }), c = C.p;
    await abertoComVelha(b, ANA, PIN_A);
    await abertoComVelha(c, ANA, PIN_A);
    /* sem troca: só abrir (pelo PIN) e conferir não grava nada e não faz RSA */
    await c.evaluate(() => Cofre.trancar());
    const L0 = await c.evaluate(async () => JSON.stringify(await Cofre.local()));
    let marca = M.log.length;
    const r0 = await abrirPeloPin(c, PIN_A);
    const v0 = await c.evaluate(() => Cofre.conferirAoVivo());
    await espere(400);
    const log0 = M.log.slice(marca), L1 = await c.evaluate(async () => JSON.stringify(await Cofre.local()));
    conferir(r0.ok && v0 === false && L1 === L0 && !log0.some((l) => /sol_minha_chave_grupo|sol_guardar_chave_grupo/.test(l.caminho) || (['PATCH', 'POST'].includes(l.metodo) && /omni_docs/.test(l.caminho))) &&
      await c.evaluate(() => Cofre.desatualizado === false && Cofre.fk) === FK0,
      'G2. sem troca: abrir pelo PIN e conferir não grava nada (o cadeado igual byte a byte, nada nas Senhas nem no registro) e não abre nenhuma chave embrulhada (uma GET só)');
    await c.evaluate(() => Cofre.trancar());
    /* C1.4: um prox (a nova de uma troca que este aparelho começou e perdeu: outro fk) fica depois de adotar */
    await b.evaluate(async (pin) => {
      const d = await Cofre._pinRaw(pin), duk = await Cofre.aes(d.raw); d.raw.fill(0);
      const prox = Object.assign({ kv: 3, fk: 'fk-prox' }, await Cofre.cifrar(duk, Cofre.rnd(32)));
      await Cofre.mudarLocal(null, (L) => { L.fam[S.family.id].prox = prox; return L; });
    }, PIN_A);
    await vigiarAvisos(b);
    /* B sem internet durante a troca (as Senhas abertas, com a de antes) */
    await semRede(B.ctx, true);
    await trocaAMao();
    await darPublica(CRIS);   /* uma responsável que ganhou a chave pública depois da troca: a próxima liberação é para ela */
    marca = M.log.length;
    await b.evaluate(() => { window.__usar = 0; const o = Cofre.usarChave; Cofre.usarChave = function () { window.__usar++; return o.apply(this, arguments); }; });
    await semRede(B.ctx, false);   /* o "online" chama o Cloud.poll */
    const adotou = await esperar(b, (fk) => Cofre.fk === fk && !Cofre._conf, FKN, 20000);
    await espere(300);
    const famB = await famDe(b), titB = await titulos(b), chB = await b.evaluate(() => ({ outras: Cofre.outras.map((o) => o.fk), kv: Cofre.kv, usar: window.__usar, d: Cofre.desatualizado }));
    conferir(adotou && famB.fk === FKN && famB.kv === 2 && JSON.stringify(famB.velhas) === JSON.stringify([FK0]) && chB.kv === 2 && JSON.stringify(chB.outras) === JSON.stringify([FK0]) && chB.usar === 1 && chB.d === false,
      'G2. aberto: no Cloud.poll adota a nova sem pedir o PIN; L.fam[GID] = a nova e velhas = [a de antes]; a de antes só abre (' + JSON.stringify([famB, chB]) + ')');
    conferir(famB.prox === 'fk-prox', 'C1.4. o prox de outra troca (outro fk) continua guardado depois de adotar');
    conferir(ITENS.every((x, i) => titB['v' + i] === x[1]) && titB._em === true && Object.keys(titB).length === 7, 'G2. aberto: mostra os 7 (os 6 itens e o código de emergência) (' + JSON.stringify(titB) + ')');
    conferir(/atualizadas neste/.test(await avisos(b)), 'G2. aviso para leigo: "' + (await avisos(b)) + '"');
    /* nada mudou de novo: conferir outra vez é uma GET só, sem RSA */
    let m2 = M.log.length;
    const v2 = await b.evaluate(() => Cofre.conferirAoVivo());
    conferir(v2 === false && !M.log.slice(m2).some((l) => /sol_minha_chave_grupo/.test(l.caminho)), 'G2. depois de adotar, conferir de novo não abre nenhuma chave embrulhada');
    /* G3: de volta à internet com a velha, nunca entregou a velha; a próxima liberação leva a nova (para a Cris) */
    await distribuirJa(b);
    await ate(() => regBanco().membros[CRIS], 8000);
    const e = await entregas(marca);
    conferir(e.length >= 1 && e.every((x) => x.fk === FKN && x.kv === 2) && e.some((x) => x.user === CRIS) && regOk(regBanco()) && regBanco().kv === 2,
      'G3. de volta à internet: nenhuma chave embrulhada com a velha; a Cris recebe a nova; o registro continua o novo (' + JSON.stringify(e) + ')');
    /* C, fechado durante a troca: ao abrir pelo PIN, adota ANTES do usarChave (chamado uma vez) */
    await contarUsar(c); await vigiarAvisos(c);
    const rc = await abrirPeloPin(c, PIN_A);
    await espere(300);
    const famC = await famDe(c), titC = await titulos(c), chC = await c.evaluate(() => ({ fk: Cofre.fk, kv: Cofre.kv, outras: Cofre.outras.map((o) => o.fk), usar: window.__usar }));
    conferir(rc.ok && famC.fk === FKN && famC.kv === 2 && JSON.stringify(famC.velhas) === JSON.stringify([FK0]) && chC.fk === FKN && chC.kv === 2 && JSON.stringify(chC.outras) === JSON.stringify([FK0]) && chC.usar === 1,
      'G2. fechado: abre pelo PIN e já adota (usarChave uma vez, com a nova; a de antes só abre) (' + JSON.stringify([famC, chC]) + ')');
    conferir(ITENS.every((x, i) => titC['v' + i] === x[1]) && titC._em === true && /atualizadas neste/.test(await avisos(c)), 'G2. fechado: mostra tudo e avisa');
  });

  /* ================= G2b (etapa E4): o registro que demora não segura o abrir ================= */
  await parte('G2b', 'Abrir pelo PIN com o registro do banco demorando: abre já com a que tem e adota quando ele chega (revisão final F1)', async (novo) => {
    const B = await novo('G2b-ana', { vp: 'computador' }), b = B.p;
    const C = await novo('G2b-ana-celular', { vp: 'celular' }), c = C.p;
    await abertoComVelha(b, ANA, PIN_A);
    await abertoComVelha(c, ANA, PIN_A);
    for (const x of [b, c]) await x.evaluate(() => { Cofre.trancar(); Cloud.stopPoll(); });   /* sem o Cloud.poll: quem adota é o próprio abrir */
    await trocaAMao();
    /* a leitura do registro (settings: cofre e giro) leva 2,5 s para responder */
    const lento = (u) => u.href.includes('/rest/v1/omni_docs') && u.href.includes('id=in.(cofre,giro)');
    await b.route(lento, async (r) => { await espere(2500); return r.fallback(); });
    await contarUsar(b); await vigiarAvisos(b);
    const t0 = Date.now(), rc = await abrirPeloPin(b, PIN_A), dt = Date.now() - t0, fk1 = await b.evaluate(() => Cofre.fk);
    const adotou = await esperar(b, (fk) => Cofre.fk === fk, FKN, 12000);
    await espere(300);
    const fam = await famDe(b), usar = await b.evaluate(() => window.__usar);
    await b.unroute(lento);
    conferir(rc.ok && fk1 === FK0 && dt < 2500, 'G2b. o abrir não espera o registro que demora: abre em ' + (dt / 1000).toFixed(1) + ' s com a que tem');
    conferir(adotou && fam.fk === FKN && JSON.stringify(fam.velhas) === JSON.stringify([FK0]) && usar === 2 && /atualizadas neste/.test(await avisos(b)),
      'G2b. quando o registro chega dizendo a nova, adota sozinho (sem esperar o Cloud.poll) e avisa (' + JSON.stringify(fam) + ', usarChave ' + usar + ')');
    /* o pedido do registro começa junto com o PIN: com o registro lento (1,5 s) e o PIN que demora mais (1,8 s), adota ANTES de abrir */
    await c.route(lento, async (r) => { await espere(1500); return r.fallback(); });
    await contarUsar(c);
    await c.evaluate(() => { const o = Pin.abrir; Pin.abrir = async (pin) => { await new Promise((r) => setTimeout(r, 1800)); return o.call(Pin, pin); }; });
    const rc2 = await abrirPeloPin(c, PIN_A), c2 = await c.evaluate(() => ({ fk: Cofre.fk, usar: window.__usar }));
    await c.unroute(lento);
    conferir(rc2.ok && c2.fk === FKN && c2.usar === 1, 'G2b. o registro pedido junto com o PIN: já chegou quando o PIN abre, e a nova é adotada antes de abrir (usarChave uma vez) (' + JSON.stringify(c2) + ')');
  });

  /* ================= G3D (etapa E4): o aparelho que entrou aprovado pela família ================= */
  await parte('G3D', 'O aparelho aprovado pela família (sem a chave pessoal): "precisa ser aprovado de novo", a carga recusa, o que não abre sai da tela; reaprovado, as chaves de antes vêm junto', async (novo) => {
    const D = await novo('G3D-ana-familia', { vp: 'celular' }), d = D.p;
    await abertoPelaFamilia(d, ANA, PIN_A);
    const t0 = await titulos(d);
    conferir(await d.evaluate(() => Cofre.aberto() && Cofre.fk) === FK0 && ITENS.every((x, i) => t0['v' + i] === x[1]) && await d.evaluate(() => !document.querySelector('#cfVelho') && Cofre.desatualizado === false),
      'preparo: o aparelho da família abre com a de antes, sem cartão');
    const nova = await trocaAMao();
    /* A muda o item v4 depois da troca (com a nova) */
    const d4 = await abrirLinha(nova, linha('vault', 'v4').dados_cifrado), s4 = JSON.parse(new TextDecoder().decode(await decifrar(nova, d4.enc)));
    s4.title = 'Cartão mudado pela Ana'; d4.enc = await cifrar(nova, utf8(JSON.stringify(s4)));
    gravarDoc('vault', 'v4', { dados_cifrado: await selar(nova, 2, FKN, d4) }, ANA);
    const L0 = await d.evaluate(async () => JSON.stringify(await Cofre.local()));
    const velho4 = await d.evaluate(() => JSON.parse(JSON.stringify(DB.col('vault').get('v4'))));
    await d.evaluate(() => Cloud.poll());
    const viu = await esperar(d, () => Cofre.desatualizado === 'semChave' && !!document.querySelector('#cfVelho [data-act="cofre.reaprovar"]'), null, 20000);
    const card = await d.evaluate(() => (document.querySelector('#cfVelho') || {}).innerText || '');
    const t1 = await titulos(d), L1 = await d.evaluate(async () => JSON.stringify(await Cofre.local()));
    conferir(viu && /precisa ser aprovado de novo/.test(card) && /Pedir aprovação de novo/.test(card) && /mesmo PIN/.test(card) && L1 === L0 && await d.evaluate(() => Cofre.fk) === FK0,
      'G3. sem a chave pessoal: o cartão "' + card.replace(/\s+/g, ' ').slice(0, 140) + '…", e o cadeado daqui não muda');
    conferir(Object.keys(t1).join() === '_em', 'C14. as linhas novas não abrem aqui: os itens de antes saem da tela (não dá para editar uma cópia velha) (' + JSON.stringify(t1) + ')');
    /* uma edição da cópia velha (de uma janela aberta antes) não volta a linha da Ana */
    await vigiarAvisos(d);
    await d.evaluate(async (v) => { await DB.put('vault', Object.assign({}, v, { updatedAt: '2026-11-12T11:00:00.000Z' }), true); }, velho4);
    await espere(600); await subir(d, true);
    const ed = await avisos(d);
    conferir(/precisa da atualização/.test(ed) && await tituloDe(nova, linha('vault', 'v4').dados_cifrado) === 'Cartão mudado pela Ana' && await d.evaluate(() => !CloudDriver.fila.has('vault|v4')),
      'C14. uma edição da cópia velha não sobe: a linha continua a da Ana (' + ed + ')');
    /* a carga "família" deste aparelho recusa */
    const cg = await d.evaluate(async (bia) => { const L = await Cofre.local(), k = await Aparelhos.carga({ tipo: 'familia', grupo_id: S.family.id, quem: bia }, L, new Uint8Array(Cofre.dukRaw)); if (k.zerar) k.zerar(); return { c: !!k.c, texto: k.texto || '' }; }, BIA);
    conferir(!cg.c && /versão antiga/.test(cg.texto), 'G3. a carga "família" deste aparelho recusa: "' + cg.texto + '"');
    /* C14: a ficha do carro nem mostra a placa para mudar */
    await d.evaluate(() => { Cars.edit({ id: 'car-g3d', kind: 'veiculo', name: 'Carro de mentira', carro: {}, seguro: {} }); });
    await esperar(d, () => !!document.querySelector('.modal input[name="name"]'), null, 5000);
    const fc = await d.evaluate(() => { const m = document.querySelector('.modal'); return { placa: !!m.querySelector('[name="_sec.placa"]'), texto: m.innerText }; });
    await d.evaluate(() => closeModals());
    conferir(!fc.placa && /precisa da atualização/.test(fc.texto), 'C14. a ficha do carro: com a chave velha, a placa nem aparece para mudar (o aviso no lugar)');
    /* o fechar e abrir de novo pelo PIN: abre com a de antes, o cartão continua */
    await d.evaluate(() => Cofre.trancar());
    const rp = await abrirPeloPin(d, PIN_A);
    conferir(rp.ok && await d.evaluate(() => Cofre.fk === 'fk-teste' && Cofre.desatualizado === 'semChave') && await esperar(d, () => !!document.querySelector('#cfVelho'), null, 5000), 'G3. abrir pelo PIN: abre com a de antes e o cartão continua');
    /* o botão pede a aprovação "para a família" */
    const n0 = db.sol_acesso_pedidos.length;
    await d.click('#cfVelho [data-act="cofre.reaprovar"]');
    const pediu = await esperar(d, () => [...document.querySelectorAll('.modal')].some((m) => /Pedir para alguém da família/.test(m.innerText)), null, 8000);
    const ped = db.sol_acesso_pedidos.slice(n0).find((x) => x.user_id === ANA);
    conferir(pediu && ped && ped.grupo_id === GID && ped.estado === 'aberto', 'G3. "Pedir aprovação de novo" abre o pedido para a família (o pedido está no banco, desta família)');
    await d.click('#apCancelar').catch(() => {});
    await espere(500); await d.evaluate(() => closeModals());
    /* reaprovado (a carga da família chega com a nova): com o mesmo PIN, as chaves de antes (e o prox de uma troca, C8) vêm junto */
    const PROX = [...crypto.randomBytes(32)];
    await d.evaluate(async (o) => {
      const r = await Cofre._pinRaw(o.pin), duk = await Cofre.aes(r.raw); r.raw.fill(0);
      const prox = Object.assign({ kv: 3, fk: 'fk-prox' }, await Cofre.cifrar(duk, new Uint8Array(o.prox)));
      await Cofre.mudarLocal(null, (L) => { L.fam[S.family.id].prox = prox; return L; });
    }, { pin: PIN_A, prox: PROX });
    const rm = await d.evaluate(async (o) => {
      const r = await Cofre.montar(null, { raw: new Uint8Array(o.nova), kv: 2, fk: o.fkn }, o.pin, 'familia', null, null);
      if (r.raw) r.raw.fill(0);
      const p = await Cofre._pinRaw(o.pin), duk = await Cofre.aes(p.raw); p.raw.fill(0);
      const f = (await Cofre.local()).fam[S.family.id], igual = (a, b) => a.length === b.length && a.every((x, i) => x === b[i]);
      const velha = f.velhas && f.velhas[0] ? [...(await Cofre.decifrar(duk, f.velhas[0]))] : null, prox = f.prox ? [...(await Cofre.decifrar(duk, f.prox))] : null;
      return { ok: !!r.ok, fk: f.fk, velhas: (f.velhas || []).map((v) => v.fk), velhaIgual: !!velha && igual(velha, o.velha), prox: f.prox && f.prox.fk, proxIgual: !!prox && igual(prox, o.prox),
        outras: Cofre.outras.map((x) => x.fk), atual: Cofre.fk, d: Cofre.desatualizado };
    }, { nova: [...nova], fkn: FKN, pin: PIN_A, velha: [...M.cfVelha], prox: PROX });
    await espere(500);
    const t2 = await titulos(d);
    conferir(rm.ok && rm.fk === FKN && rm.atual === FKN && JSON.stringify(rm.velhas) === JSON.stringify([FK0]) && rm.velhaIgual && JSON.stringify(rm.outras) === JSON.stringify([FK0]) && rm.d === false,
      'G3. reaprovado com o mesmo PIN: o cadeado novo leva a de antes (a mesma chave, fechada pela chave nova do aparelho) e ela só abre (' + JSON.stringify(rm) + ')');
    conferir(rm.prox === 'fk-prox' && rm.proxIgual, 'C8. o prox de uma troca também vem junto');
    conferir(t2.v4 === 'Cartão mudado pela Ana' && ['v0', 'v1', 'v2', 'v3', 'v5'].every((id) => t2[id] === ITENS[+id.slice(1)][1]), 'G3. reaprovado: os itens voltam à tela (o v4 com a mudança da Ana)');
    /* com outro PIN, o cadeado de antes não abre: segue sem (nada quebra) */
    const rm2 = await d.evaluate(async (o) => {
      const r = await Cofre.montar(null, { raw: new Uint8Array(o.nova), kv: 2, fk: o.fkn }, '909192', 'familia', null, null); if (r.raw) r.raw.fill(0);
      const f = (await Cofre.local()).fam[S.family.id]; return { ok: !!r.ok, fk: f.fk, velhas: f.velhas || null, prox: f.prox || null };
    }, { nova: [...nova], fkn: FKN });
    conferir(rm2.ok && rm2.fk === FKN && rm2.velhas === null && rm2.prox === null, 'G3. reaprovado com outro PIN: o cadeado de antes não abre, segue só com a nova (' + JSON.stringify(rm2) + ')');
  });

  /* ================= G3b (etapa E4, C4): o registro que volta para trás ================= */
  await parte('G3b', 'O registro volta para uma chave mais velha (C4): ninguém volta e o cartão "não confere"; entre duas de mesma kv, a do registro', async (novo) => {
    const B = await novo('G3b-ana', { vp: 'computador' }), b = B.p;
    const C = await novo('G3b-ana-celular', { vp: 'celular' }), c = C.p;
    const E = await novo('G3b-bia', { vp: 'celular' }), e = E.p;
    await abertoComVelha(b, ANA, PIN_A);
    await abertoComVelha(c, ANA, PIN_A);
    await abertoComVelha(e, BIA, PIN_C);
    await c.evaluate(() => Cofre.trancar());
    await trocaAMao();
    /* a nova ainda não embrulhada para a Bia (responsável, com a chave pessoal no aparelho) */
    const daBia = db.sol_grupo_chaves.filter((x) => x.grupo_id === GID && x.user_id === BIA && x.versao > 1);
    db.sol_grupo_chaves.splice(0, db.sol_grupo_chaves.length, ...db.sol_grupo_chaves.filter((x) => !daBia.includes(x)));
    await b.evaluate(() => Cloud.poll());
    conferir(await esperar(b, (fk) => Cofre.fk === fk, FKN, 20000), 'preparo: B adotou a nova');
    const regN = regBanco(), LB = await b.evaluate(async () => JSON.stringify(await Cofre.local()));
    /* alguém grava à mão o registro de antes */
    gravarDoc('settings', 'cofre', { dados: Object.assign({}, regN, { fk: FK0, kv: 1 }) }, BIA);
    await b.evaluate(() => Cloud.poll());
    const viu = await esperar(b, () => Cofre.desatualizado === 'estranho' && !!document.querySelector('#cfVelho'), null, 20000);
    const card = await b.evaluate(() => (document.querySelector('#cfVelho') || {}).innerText || '');
    conferir(viu && /não confere/.test(card) && await b.evaluate(() => Cofre.fk) === FKN && await b.evaluate(async () => JSON.stringify(await Cofre.local())) === LB,
      'G3b. aberto: o registro voltou para a de antes → nada muda aqui (continua com a nova) e o cartão "' + card.trim() + '"');
    const rc = await abrirPeloPin(c, PIN_A);
    const fc = await famDe(c);
    conferir(rc.ok && fc.fk === FK0 && !fc.velhas.length && await c.evaluate(() => Cofre.fk) === FK0, 'G3b. um aparelho que ainda tinha a de antes abre com ela (o registro diz ela; nada a adotar)');
    await c.evaluate(() => Cofre.trancar());
    /* o registro de volta à nova, e uma chave intrusa de mesma kv (outro fk) embrulhada para a Ana, a mais nova na lista */
    gravarDoc('settings', 'cofre', { dados: regN }, ANA);
    const pubAna = db.sol_chave_publica.find((k) => k.user_id === ANA).chave_publica, vs = Math.max(...db.sol_grupo_chaves.filter((x) => x.grupo_id === GID && x.user_id === ANA).map((x) => x.versao));
    db.sol_grupo_chaves.push({ grupo_id: GID, user_id: ANA, versao: vs + 1, chave_embrulhada: await embrulhar(pubAna, crypto.randomBytes(32), 2, 'fk-intrusa'), embrulhada_por: BIA, criado_em: agora() });
    const bm = await b.evaluate(async (o) => {
      const d = await Cofre._pinRaw(o.pin), duk = await Cofre.aes(d.raw); d.raw.fill(0);
      const L = await Cofre.local(), sk = await Cofre.importarSk(await Cofre.decifrar(duk, L.sk));
      const q = async (reg) => { const r = await Cofre.buscarMinha(sk, reg); return r ? r.fk + ':' + r.kv : null; };
      return { reg: await q(o.reg), sem: await q(null), acima: await q(Object.assign({}, o.reg, { kv: 3 })) };
    }, { pin: PIN_A, reg: regN });
    conferir(bm.reg === FKN + ':2' && bm.sem === 'fk-intrusa:2' && bm.acima === null, 'G3b. buscarMinha: com o registro, a do fk dele (não a intrusa, mais nova na lista); sem registro, a de kv maior; nunca abaixo da kv do registro (' + JSON.stringify(bm) + ')');
    const rc2 = await abrirPeloPin(c, PIN_A);
    const fc2 = await famDe(c);
    conferir(rc2.ok && fc2.fk === FKN && JSON.stringify(fc2.velhas) === JSON.stringify([FK0]) && await c.evaluate(() => Cofre.fk) === FKN, 'G3b. o aparelho velho adota a do registro, não a intrusa (' + JSON.stringify(fc2) + ')');
    /* a Bia sem a nova embrulhada para ela: "Falta liberar"; quando chega, adota */
    await e.evaluate(() => Cloud.poll());
    const falta = await esperar(e, () => Cofre.desatualizado === 'faltaLiberar' && /Falta um chefe abrir/.test((document.querySelector('#cfVelho') || {}).innerText || ''), null, 20000);
    conferir(falta && await e.evaluate(() => Cofre.fk) === FK0 && (await famDe(e)).fk === FK0, 'G3b. sem a nova embrulhada para a Bia: o cartão "Falta um chefe abrir…" e nada muda no cadeado dela');
    db.sol_grupo_chaves.push(...daBia);
    await e.evaluate(() => Cloud.poll());
    conferir(await esperar(e, (fk) => Cofre.fk === fk && Cofre.desatualizado === false && !document.querySelector('#cfVelho'), FKN, 20000) && (await famDe(e)).fk === FKN, 'G3b. quando a nova chega para ela, a Bia adota no próximo Cloud.poll e o cartão some');
  });

  /* ================= G9 (etapa E4, C2): o envio que não volta com a chave velha ================= */
  await parte('G9', 'Editado sem internet com a velha: sobe com a nova e sem duplicar (só mudou o cadeado); conflito de verdade guarda as duas, com a nova; fechado, espera (C2)', async (novo) => {
    const B = await novo('G9-ana-computador', { vp: 'computador' }), b = B.p;
    const C = await novo('G9c-ana-celular', { vp: 'celular' }), c = C.p;
    await abertoComVelha(b, ANA, PIN_A);
    await abertoComVelha(c, ANA, PIN_A);
    const editar = (p, id, titulo) => p.evaluate(async ([id, titulo]) => {
      const v = DB.col('vault').get(id), o = await Vault.decObj(v.enc); o.title = titulo;
      await DB.put('vault', Object.assign({}, v, { enc: await Vault.encObj(o) }), true);
      for (let i = 0; i < 30 && !CloudDriver.fila.has('vault|' + id); i++) await new Promise((r) => setTimeout(r, 100));
      return CloudDriver.fila.has('vault|' + id) && JSON.parse(CloudDriver.recs.get('vault|' + id).cif).fk;
    }, [id, titulo]);
    await semRede(B.ctx, true); await semRede(C.ctx, true);
    const f2 = await editar(b, 'v2', 'RG editado sem internet'), f1 = await editar(b, 'v1', 'Banco editado sem internet'), f3 = await editar(c, 'v3', 'E-mail editado sem internet');
    /* B também faz um código de emergência novo sem internet (fechado pelo código, com a kv/fk de antes) */
    const fe = await b.evaluate(async () => { const cod = await Cofre.envelope(); for (let i = 0; i < 30 && !CloudDriver.fila.has('vault|_em'); i++) await new Promise((r) => setTimeout(r, 100)); return !!cod && CloudDriver.fila.has('vault|_em') && JSON.parse(CloudDriver.recs.get('vault|_em').cif).d.em.fk; });
    await c.evaluate(() => Cofre.trancar());   /* C fecha as Senhas antes de a internet voltar */
    conferir(f2 === FK0 && f1 === FK0 && f3 === FK0 && fe === FK0, 'preparo: três edições e um código de emergência novo sem internet, com a de antes, na fila (B: v1, v2 e o código; C: v3)');
    const nova = await trocaAMao();
    /* depois da troca, a Ana muda o v1 em outro aparelho (um conflito de verdade com a edição de B) */
    const d1 = await abrirLinha(nova, linha('vault', 'v1').dados_cifrado), s1 = JSON.parse(new TextDecoder().decode(await decifrar(nova, d1.enc)));
    s1.title = 'Banco mudado pela Ana'; d1.enc = await cifrar(nova, utf8(JSON.stringify(s1)));
    gravarDoc('vault', 'v1', { dados_cifrado: await selar(nova, 2, FKN, d1) }, ANA);
    const ids0 = vivasVault().map((r) => r.id).sort();
    const marca = M.log.length;
    /* B volta com as Senhas abertas */
    await semRede(B.ctx, false);
    const subiu = await ateA(async () => (await tituloDe(nova, linha('vault', 'v2').dados_cifrado)) === 'RG editado sem internet', 25000);
    await subir(b);
    await ate(() => vivasVault().length > ids0.length, 8000);
    const l2 = linha('vault', 'v2'), o2 = JSON.parse(l2.dados_cifrado), d2 = await abrirLinha(nova, l2.dados_cifrado);
    conferir(subiu && o2.fk === FKN && o2.kv === 2 && !(await abre(() => decifrar(VELHA, d2.enc))) && await b.evaluate(() => Cofre.fk) === FKN,
      'G9. a edição de B feita sem internet com a de antes sobe com a nova, nas DUAS camadas (adotou antes de mandar)');
    const novos = vivasVault().filter((r) => !ids0.includes(r.id));
    const tN = novos.length === 1 ? await tituloDe(nova, novos[0].dados_cifrado) : null;
    conferir(novos.length === 1 && JSON.parse(novos[0].dados_cifrado).fk === FKN && tN === 'Banco editado sem internet' && await tituloDe(nova, linha('vault', 'v1').dados_cifrado) === 'Banco mudado pela Ana',
      'G9. só mudou o cadeado (v2): nenhum item duplicado; conflito de verdade (v1): ficam as duas, e a cópia de B também com a nova (' + novos.map((r) => r.id).join() + ')');
    const comVelha = subiuCom(marca, FK0);
    conferir(!comVelha.length && !vivasVault().some((r) => { try { const o = JSON.parse(r.dados_cifrado); return o.c && o.fk === FK0; } catch (e) { return false; } }),
      'C2. nada chegou ao banco fechado com a de antes (' + comVelha.map((l) => l.caminho).join(' | ') + ')');
    const em = JSON.parse(linha('vault', '_em').dados_cifrado);
    conferir(em.d.em.fk === FKN && em.d.em.kv === 2 && await b.evaluate(() => CloudDriver.fila.has('vault|_em')),
      'C2. o código de emergência feito sem internet com a de antes não sobe (ficaria por cima do refeito na troca): espera na fila');
    const tB = await titulos(b);
    conferir(tB.v2 === 'RG editado sem internet' && tB.v1 === 'Banco mudado pela Ana' && Object.values(tB).includes('Banco editado sem internet'), 'G9. a tela de B mostra o que ficou no banco');
    /* G9c: C volta com as Senhas FECHADAS: nada sobe (espera) */
    const m3 = M.log.length, l3antes = JSON.stringify(linha('vault', 'v3'));
    await semRede(C.ctx, false);
    const esperou = await esperar(c, () => CloudDriver.fila.has('vault|v3') && (CloudDriver.adiado.get('vault|v3') || 0) > Date.now(), null, 20000);
    await espere(800);
    conferir(esperou && JSON.stringify(linha('vault', 'v3')) === l3antes && !subiuCom(m3, FK0).length && !M.log.slice(m3).some((l) => ['PATCH', 'POST'].includes(l.metodo) && /colecao=eq\.vault/.test(l.caminho)),
      'G9c. C volta com as Senhas fechadas: a edição feita com a de antes fica esperando (nada sobe; a linha do banco não muda)');
    /* C abre pelo PIN: adota e a edição sobe UMA vez, com a nova, sem esperar os 2 minutos */
    const nVivas = vivasVault().length;
    const rc = await abrirPeloPin(c, PIN_A);
    const subiu3 = await ateA(async () => (await tituloDe(nova, linha('vault', 'v3').dados_cifrado)) === 'E-mail editado sem internet', 15000);
    await espere(800);
    const o3 = JSON.parse(linha('vault', 'v3').dados_cifrado);
    conferir(rc.ok && subiu3 && o3.fk === FKN && o3.kv === 2 && vivasVault().length === nVivas && !subiuCom(m3, FK0).length && await c.evaluate(() => !CloudDriver.fila.has('vault|v3')),
      'G9c. C abre pelo PIN: adota a nova e a edição sobe uma vez, com a nova, sem item duplicado');
  });

  /* ================= G0 (etapa E5): só abrir o app não muda nada guardado ================= */
  await parte('G0', 'Só abrir o app 2.27.0 (sem tocar no botão): o cadeado, as Senhas da casa e o registro no banco e as chaves entregues ficam iguais', async (novo) => {
    const A = await novo('G0-ana', { vp: 'celular' }), a = A.p;
    const C = await novo('G0-bia', { vp: 'computador' }), c = C.p;
    await abertoComVelha(a, ANA, PIN_A);
    await abertoComVelha(c, BIA, PIN_B);
    await anexar(a, [['fG0', 'familia']]);
    await espere(500);
    const banco = () => JSON.stringify({ docs: db.omni_docs.filter((d) => d.grupo_id === GID), chaves: db.sol_grupo_chaves, priv: db.omni_chave_privada, pub: db.sol_chave_publica });
    const cadeado = (p) => p.evaluate(async () => JSON.stringify(await Cofre.local()));
    const L0a = await cadeado(a), L0c = await cadeado(c), an0 = await anexosDe(a, ['fG0']), b0 = banco(), marca = M.log.length;
    /* fechar e abrir o app de novo nos dois, abrir as Senhas pelo PIN e deixar o app trabalhar (as voltas do Cloud.poll e a liberação) */
    for (const [p, pin] of [[a, PIN_A], [c, PIN_B]]) {
      await reabrir(p);
      const r = await abrirPeloPin(p, pin);
      conferir(r && r.ok, 'G0. reaberto, abre pelo PIN (' + JSON.stringify(r) + ')');
      await p.evaluate(() => Cloud.poll()); await distribuirJa(p); await espere(1500); await p.evaluate(() => Cloud.poll()); await espere(500);
    }
    const tA = await titulos(a), an1 = await anexosDe(a, ['fG0']);
    conferir(ITENS.every((x, i) => tA['v' + i] === x[1]) && an1.fG0.txt === 'anexo fG0', 'G0. tudo aparece como antes (os 6 itens e o anexo)');
    conferir((await cadeado(a)) === L0a && (await cadeado(c)) === L0c, 'G0. o cadeado dos dois aparelhos igual byte a byte');
    conferir(JSON.stringify(an1.fG0.enc) === JSON.stringify(an0.fG0.enc) && JSON.stringify(an1.fG0.bytes) === JSON.stringify(an0.fG0.bytes), 'G0. o anexo guardado neste aparelho igual (a ficha e o arquivo)');
    conferir(banco() === b0 && !linha('settings', 'giro'), 'G0. no banco: as Senhas da casa (vivas e apagadas), o registro, as chaves entregues e as chaves pessoais iguais; nenhuma troca começou');
    const grav = M.log.slice(marca).filter((l) => ['PATCH', 'POST', 'DELETE'].includes(l.metodo) && /omni_docs|sol_guardar_chave_grupo|omni_chave_privada|sol_publicar_minha_chave/.test(l.caminho));
    conferir(!grav.length, 'G0. nenhuma gravação nas Senhas da casa, no registro nem nas chaves (' + grav.map((l) => l.metodo + ' ' + l.caminho).join(' | ') + ')');
  });

  /* ================= G1 + G5 (etapa E5): a troca de verdade, sem a tela ================= */
  await parte('G1', 'A troca de verdade, sem a tela (Giro.executar): a nova chega à família antes da primeira linha, toda linha viva e os anexos na nova (as duas camadas), o registro, o histórico; a de antes não abre nada (G5)', async (novo) => {
    const A = await novo('G1-ana', { vp: 'computador' }), a = A.p;
    const B = await novo('G1-ana-celular', { vp: 'celular' }), b = B.p;
    await abertoComVelha(a, ANA, PIN_A);
    await abertoComVelha(b, ANA, PIN_A);
    await anexar(a, [['fG1fam', 'familia'], ['fG1semfk', 'semfk'], ['fG1local', 'outro']]);
    const an0 = await anexosDe(a, ['fG1fam', 'fG1semfk', 'fG1local']), ids0 = idsVault(), apagado0 = JSON.stringify(linha('vault', 'vApagado')), davi0 = versoes(DAVI), cris0 = versoes(CRIS);
    /* quando a primeira linha é trocada, a nova já está guardada neste aparelho (prox) */
    await a.evaluate(() => { const o = Giro.trocarLinha; window.__prox = null; Giro.trocarLinha = async function (row, ctx) { if (window.__prox === null) { const L = await Cofre.local(), f = L.fam[S.family.id]; window.__prox = !!(f.prox && f.prox.fk === ctx.para.fk && ctx.para.fk !== f.fk); } return o.apply(this, arguments); }; });
    /* logo antes de virar (as linhas já na nova, este aparelho ainda fechando com a de antes): a tela mostra tudo */
    await a.evaluate(() => { const o = Giro.virar; window.__antesDeVirar = null; Giro.virar = async function () { const t = []; for (const v of DB.all('vault')) { try { t.push((await Vault.decObj(v.enc)).title); } catch (e) {} } window.__antesDeVirar = { fk: Cofre.fk, t }; return o.apply(this, arguments); }; });
    const marca = M.log.length;
    const r = await girar(a);
    const g = linha('settings', 'giro'), gd = (g && g.dados) || {}, fkN = gd.para && gd.para.fk, n = await chaveDaPessoa(ANA), nb = await chaveDaPessoa(BIA);
    conferir(r.ok && gd.estado === 'feito' && fkN && fkN !== FK0 && n && n.fk === fkN && n.kv === 2 && nb && igual(nb.raw, n.raw) && !igual(n.raw, VELHA), 'G1. a troca termina ("feito") com uma chave nova, kv 2 (' + JSON.stringify([r.erro || r.r, gd.estado, fkN]) + ')');
    conferir(r.ok && r.passos.indexOf('Avisando a família') >= 0 && r.passos.indexOf('Avisando a família') < r.passos.findIndex((t) => /^Senhas: /.test(t)) && r.passos.includes('Senhas: 6 de 6') && r.passos.includes('Conferindo se está tudo certo'),
      'G1. o andamento para leigo: "Avisando a família" antes de "Senhas: 1 de 6" … "6 de 6", e "Conferindo" (' + (r.passos || []).join(' › ') + ')');
    /* C5: a nova chega a sol_grupo_chaves ANTES da primeira linha trocada; a troca e a nova guardadas antes de tudo */
    const log = M.log.slice(marca);
    const iGiro = log.findIndex((l) => l.metodo === 'POST' && l.corpo && l.corpo.id === 'giro'), iEnt = log.findIndex((l) => /sol_guardar_chave_grupo/.test(l.caminho));
    const iLinha = log.findIndex((l) => l.metodo === 'PATCH' && /colecao=eq\.vault/.test(l.caminho)), iReg = log.findIndex((l) => l.metodo === 'PATCH' && /colecao=eq\.settings&id=eq\.cofre/.test(l.caminho));
    const iUltEnt = log.map((l) => /sol_guardar_chave_grupo/.test(l.caminho)).lastIndexOf(true);
    conferir(iGiro >= 0 && iGiro < iEnt && iUltEnt < iLinha && iLinha < iReg, 'C5. a ordem: a troca → a nova entregue à família (todas as entregas) → a primeira linha → o registro (' + [iGiro, iEnt, iUltEnt, iLinha, iReg].join(',') + ')');
    conferir(await a.evaluate(() => window.__prox) === true, 'C5. a nova já estava guardada neste aparelho (L.fam[gid].prox, fechada pela chave dele) quando a primeira linha foi trocada');
    const env = log[iGiro] && log[iGiro].corpo.dados.envelopes, ke = env && env[ANA] ? await desembrulhar(ANA, env[ANA]) : null;
    conferir(env && Object.keys(env).join() === ANA && ke && ke.fk === fkN && ke.kv === 2 && igual(ke.raw, n.raw) && log[iGiro].corpo.vis === 'restrito' && log[iGiro].corpo.dados.estado === 'preparado',
      'C5. a troca nasce "preparado", restrita, com a nova embrulhada para cada chefe (a Ana: o caminho de volta por outro aparelho dela)');
    /* as Senhas da casa no banco */
    let okL = 0;
    for (const x of vivasVault().filter((y) => y.id !== '_em')) {
      const o = JSON.parse(x.dados_cifrado); let d = null; try { d = await abrirLinha(n.raw, x.dados_cifrado); } catch (e) {}
      if (o.fk === fkN && o.kv === 2 && Object.keys(o).sort().join() === 'c,ct,fk,iv,kv' && d && (await tituloDe(n.raw, x.dados_cifrado)) === ITENS[+x.id.slice(1)][1] && !(await abre(() => decifrar(VELHA, d.enc))) && !(await abre(() => abrirLinha(VELHA, x.dados_cifrado)))) okL++;
    }
    conferir(vivasVault().filter((y) => y.id !== '_em').length === 6 && okL === 6, 'G1. as 6 linhas vivas: fk novo e kv 2, no formato de sempre; as DUAS camadas abrem com a nova (e não com a de antes); os títulos iguais (' + okL + ')');
    conferir(idsVault() === ids0, 'G1. nenhum item novo e nenhum apagado (os mesmos ids)');
    const em = linha('vault', '_em');
    conferir(em.apagado_em && em.dados_cifrado === null && r.ok && r.r.em === 'invalidado' && gd.em === 'invalidado', 'G1. o código de emergência (sem o código de agora): deixa de valer, apagado e sem o conteúdo (refeito com o código: etapa E7)');
    conferir(JSON.stringify(linha('vault', 'vApagado')) === apagado0, 'D-E6. a linha já apagada ficou exatamente como estava (não entra na troca)');
    /* cada linha com CAS próprio, nunca pela fila */
    const pv = log.filter((l) => l.metodo === 'PATCH' && /colecao=eq\.vault/.test(l.caminho));
    const casOk = pv.every((l) => /versao=eq\.\d+/.test(l.caminho) && (/id=eq\._em/.test(l.caminho) ? Object.keys(l.corpo).sort().join() === 'apagado_em,dados_cifrado' : /apagado_em=is\.null/.test(l.caminho) && Object.keys(l.corpo).join() === 'dados_cifrado'));
    conferir(pv.length === 7 && casOk && !log.some((l) => l.metodo === 'POST' && l.corpo && l.corpo.colecao === 'vault') && log[iReg] && /versao=eq\.\d+/.test(log[iReg].caminho),
      'G1. cada linha trocada uma vez, com a versão dela e só o texto (nunca "apagado_em: null", nenhuma pela fila, nenhuma criada); o registro também com a versão (' + pv.length + ')');
    /* o registro, as entregas, a troca, o histórico */
    const rg = regBanco();
    conferir(rg.fk === fkN && rg.kv === 2 && rg.giradoPor === ANA && !!rg.giradoEm && Object.keys(rg.membros).sort().join() === [ANA, BIA].sort().join() && Object.values(rg.membros).every((m) => m.fk === fkN && m.seq === 2),
      'G1. o registro: a nova (kv 2), quem trocou e quando, e quem tem a nova (Ana e Bia, versão 2) (' + JSON.stringify(rg) + ')');
    const e = await entregas(marca);
    conferir(versoes(ANA) === '1,2' && versoes(BIA) === '1,2' && versoes(DAVI) === davi0 && versoes(CRIS) === cris0 && e.length === 2 && e.every((x) => x.fk === fkN && x.kv === 2 && x.seq === 2),
      'G1. a nova entregue (versão + 1) a cada chefe e responsável com chave (Ana, Bia), uma vez; o Davi (membro) e a Cris (sem chave) não; nada entregue com a de antes (' + JSON.stringify(e) + ')');
    conferir(g.vis === 'restrito' && JSON.stringify(gd.envelopes) === '{}' && gd.de.fk === FK0 && gd.de.kv === 1 && gd.para.kv === 2 && gd.por === ANA && gd.total === 6 && gd.feitos === 6 && gd.estranhas === 0 && gd.voltas === 0 && !!gd.fim &&
      Object.keys(gd.entregues).sort().join() === [ANA, BIA].sort().join(), 'G1. a troca no banco: "feito", restrita, de → para, os envelopes esvaziados, 6 de 6, nenhuma volta (' + JSON.stringify(Object.assign({}, gd, { envelopes: Object.keys(gd.envelopes || {}) })) + ')');
    const hist = db.omni_historico.filter((h) => h.grupo_id === GID).map((h) => h.acao);
    conferir(['cofre.giro', 'emergencia.invalidada', 'cofre.girado'].every((x) => hist.includes(x)), 'G1. o histórico: a troca começou, o código de emergência deixou de valer, a chave foi trocada (' + hist.join() + ')');
    /* este aparelho */
    const famA = await famDe(a), chA = await a.evaluate(() => ({ fk: Cofre.fk, kv: Cofre.kv, outras: Cofre.outras.map((o) => o.fk), rodando: Giro.rodando })), tA = await titulos(a);
    conferir(famA.fk === fkN && famA.kv === 2 && JSON.stringify(famA.velhas) === JSON.stringify([FK0]) && famA.prox === null && chA.fk === fkN && chA.kv === 2 && JSON.stringify(chA.outras) === JSON.stringify([FK0]) && !chA.rodando,
      'G1. este aparelho: o cadeado com a nova, a de antes só para abrir, sem o prox; a troca não está mais rodando (' + JSON.stringify([famA, chA]) + ')');
    conferir(ITENS.every((x, i) => tA['v' + i] === x[1]), 'G1. este aparelho mostra os 6 itens');
    const av = await a.evaluate(() => window.__antesDeVirar);
    conferir(av && av.fk === FK0 && ITENS.every((x) => av.t.includes(x[1])), 'G1. durante a troca (antes de virar, ainda com a de antes), este aparelho continua mostrando os 6 (a nova também abre aqui) (' + JSON.stringify(av) + ')');
    const an = await anexosDe(a, ['fG1fam', 'fG1semfk', 'fG1local']);
    let anOk = 0;
    for (const id of ['fG1fam', 'fG1semfk']) if (an[id].enc.fk === fkN && !an[id].enc.antes && an[id].txt === 'anexo ' + id && (await abreBlob(n.raw, an[id].enc.iv, an[id].bytes)) && !(await abreBlob(VELHA, an[id].enc.iv, an[id].bytes))) anOk++;
    conferir(anOk === 2 && r.ok && r.r.anexos && r.r.anexos.feitos === 2 && r.r.anexos.pulados === 1, 'G1. os anexos da família neste aparelho (com e sem enc.fk) fechados de novo com a nova: abrem, e a de antes não abre (' + JSON.stringify(r.r && r.r.anexos) + ')');
    conferir(JSON.stringify(an.fG1local) === JSON.stringify(an0.fG1local), 'G1. o anexo que não é da família ficou como estava');
    conferir(r.ok && r.r.estranhas.length === 0 && r.r.semInterna.length === 0, 'G1. nenhum item "que já não abria"');
    /* G5 com a troca de verdade (não conta como prova, C15: a prova é o fk/kv novo e as duas camadas abrindo com a nova) */
    const s = situacao();
    conferir(!vivasVault().some((x) => { try { return JSON.parse(x.dados_cifrado).fk === FK0; } catch (er) { return false; } }) && s.vault_fora === 0 && s.giro_ok === true && s.falta_entregar === 0,
      'G5. nenhuma linha viva com a de antes; sol_giro_situacao: vault_fora 0, falta_entregar 0, a troca conferida (' + JSON.stringify(s) + ')');
    /* o outro aparelho (aberto durante a troca) adota a nova na próxima volta do Cloud.poll */
    await b.evaluate(() => Cloud.poll());
    const adotou = await esperar(b, (fk) => Cofre.fk === fk && !Cofre._conf, fkN, 20000), tB = await titulos(b);
    conferir(adotou && ITENS.every((x, i) => tB['v' + i] === x[1]), 'G1. o outro aparelho da Ana (aberto) adota a nova e mostra os 6 itens');
    /* nenhum segredo guardado fora do lugar */
    const nb64 = b64(n.raw), vazou = [];
    for (const p of [a, b]) {
      const st = await p.evaluate(() => { const o = []; for (const s of [localStorage, sessionStorage]) for (let i = 0; i < s.length; i++) o.push(s.key(i) + '=' + s.getItem(s.key(i))); return o.join('\n'); });
      if (st.includes(nb64) || st.includes(b64(VELHA))) vazou.push(p.nome);
    }
    if ([A, B].some((x) => x.lixo.console.some((t) => t.includes(nb64) || t.includes(b64(VELHA))))) vazou.push('console');
    if (db.omni_historico.some((h) => String(h.detalhe || '').includes(nb64))) vazou.push('histórico');
    conferir(!vazou.length, 'G1. a chave nova e a de antes nunca em localStorage, sessionStorage, console nem no histórico (' + vazou.join() + ')');
  });

  /* ================= G1c (etapa E5): uma linha gravada com a de antes no meio (aparelho atrasado) ================= */
  await parte('G1c', 'Um aparelho atrasado grava uma linha com a de antes depois de ela ter sido trocada: a conferência acha e troca de novo (uma volta), sem perder a mudança', async (novo) => {
    const A = await novo('G1c-ana', { vp: 'computador' }), a = A.p;
    await abertoComVelha(a, ANA, PIN_A);
    const tarde = await linhaCom(VELHA, 1, FK0, 'Banco mudado por um aparelho atrasado');
    /* depois do 7º PATCH em vault (as 6 linhas e o código de emergência), "um aparelho 2.26" grava o v1 com a de antes */
    M.depoisDe = { 'PATCH vault': 7, acao: () => gravarDoc('vault', 'v1', { dados_cifrado: tarde }, BIA) };
    const r = await girar(a);
    const gd = linha('settings', 'giro').dados, n = await chaveDaPessoa(ANA), o1 = JSON.parse(linha('vault', 'v1').dados_cifrado);
    conferir(r.ok && gd.estado === 'feito' && gd.voltas === 1 && o1.fk === gd.para.fk && (await tituloDe(n.raw, linha('vault', 'v1').dados_cifrado)) === 'Banco mudado por um aparelho atrasado' && !comFk(FK0).length,
      'G1c. a conferência achou a linha gravada com a de antes, trocou de novo (1 volta) e a mudança do aparelho atrasado ficou (' + JSON.stringify([r.erro || 'ok', gd.voltas, o1.fk === (gd.para || {}).fk]) + ')');
    conferir(situacao().vault_fora === 0 && situacao().giro_ok === true, 'G1c. no fim, nada com a de antes (vault_fora 0)');
  });

  /* ================= C11 (etapa E5): itens que já não abriam não travam a troca ================= */
  await parte('C11', 'Itens que já não abriam (o selo, ou só a parte interna): a troca termina, conta à parte e devolve a lista; nada some', async (novo) => {
    const A = await novo('C11-ana', { vp: 'computador' }), a = A.p;
    gravarDoc('vault', 'vQuebrada', { dados_cifrado: JSON.stringify({ c: 1, kv: 1, fk: FK0, iv: b64(crypto.randomBytes(12)), ct: b64(crypto.randomBytes(40)) }) });
    gravarDoc('vault', 'vInterna', { dados_cifrado: await linhaCom(VELHA, 1, FK0, 'Parte interna de outra chave', new Uint8Array(crypto.randomBytes(32))) });
    await abertoComVelha(a, ANA, PIN_A);
    const quebrada0 = JSON.stringify(linha('vault', 'vQuebrada'));
    const p = await a.evaluate(async () => { const r = await Giro.pode(); return { ok: r.ok, motivo: r.motivo, naoAbrem: r.naoAbrem }; });
    conferir(p.ok && JSON.stringify(p.naoAbrem) === JSON.stringify(['vInterna', 'vQuebrada']), 'C11. antes de começar, a lista dos itens que não abrem (para a tela mostrar e oferecer apagar); eles não impedem a troca (' + JSON.stringify(p) + ')');
    const r = await girar(a);
    const gd = linha('settings', 'giro').dados, n = await chaveDaPessoa(ANA), oi = JSON.parse(linha('vault', 'vInterna').dados_cifrado);
    conferir(r.ok && gd.estado === 'feito' && JSON.stringify(r.r.estranhas) === '["vQuebrada"]' && JSON.stringify(r.r.semInterna) === '["vInterna"]' && gd.estranhas === 1,
      'C11. a troca termina e devolve a lista: o que não abre fica como está, o de parte interna que não abre conta à parte (' + JSON.stringify(r.r || r.erro) + ')');
    conferir(JSON.stringify(linha('vault', 'vQuebrada')) === quebrada0 && oi.fk === gd.para.fk && !!(await abrirLinha(n.raw, linha('vault', 'vInterna').dados_cifrado).catch(() => null)) && comFk(gd.para.fk).length === 7,
      'C11. a que não abre não foi tocada; a de parte interna estranha trocou só o selo; as outras 6 na nova');
  });

  /* ================= F0 (etapa E5): dá para começar? ================= */
  await parte('F0', 'Antes de começar (Giro.pode): só chefe, só da chave do registro, sem nada esperando para subir, com o SQL da plataforma e o MoneyTRIO pronto; troca em curso = continuar ou "já está trocando"', async (novo) => {
    const A = await novo('F0-ana', { vp: 'computador' }), a = A.p;
    const C = await novo('F0-bia', { vp: 'celular' }), c = C.p;
    await abertoComVelha(a, ANA, PIN_A);
    await abertoComVelha(c, BIA, PIN_B);
    const pode = (p) => p.evaluate(async () => { const r = await Giro.pode(); return { ok: !!r.ok, motivo: r.motivo || null, texto: r.texto || null }; });
    const nada = () => !linha('settings', 'giro') && comFk(FK0).length === 6 && versoes(ANA) === '1';
    const rc = await pode(c), gc = await girar(c);
    conferir(rc.motivo === 'chefe' && gc.motivo === 'chefe' && /Só um chefe/.test(gc.erro) && nada(), 'F0. a Bia (responsável) não troca: "Só um chefe da família pode fazer isso." e nada muda (' + JSON.stringify([rc, gc.erro]) + ')');
    M.semGiroSql = true;
    const r1 = await pode(a), g1 = await girar(a);
    conferir(r1.motivo === 'semSql' && r1.texto === 'Ainda não dá: falta uma atualização do SolverONE.' && g1.motivo === 'semSql' && nada(), 'F0. sem a sol_giro_situacao no banco (C6/D-E9): "Ainda não dá: falta uma atualização do SolverONE." — nenhum caminho manual (' + JSON.stringify(r1) + ')');
    M.semGiroSql = false;
    db.money_docs.push({ grupo_id: GID, colecao: 'money_lanc', id: 'm1', dados_cifrado: JSON.stringify({ c: 1, kv: 1, fk: FK0, iv: 'AA', ct: 'AA' }), apagado_em: null });
    const r2 = await pode(a), g2 = await girar(a);
    conferir(r2.motivo === 'money' && g2.motivo === 'money' && nada(), 'F0. o MoneyTRIO ainda com dados na chave da família: não troca (' + JSON.stringify(r2) + ')');
    db.money_docs.splice(0, db.money_docs.length);
    gravarDoc('vault', 'vOutra', { dados_cifrado: await linhaCom(new Uint8Array(crypto.randomBytes(32)), 1, 'fk-outra', 'De outra chave') });
    const r3 = await pode(a);
    conferir(r3.motivo === 'estranho' && /Peça ajuda/.test(r3.texto), 'F0. uma linha viva fora da chave do registro (uma segunda chave): não troca, pede ajuda (' + JSON.stringify(r3) + ')');
    db.omni_docs.splice(db.omni_docs.indexOf(linha('vault', 'vOutra')), 1);
    const r4 = await a.evaluate(async () => { CloudDriver.fila.set('vault|v0', { op: 'put', t: Date.now() }); CloudDriver.adiado.set('vault|v0', Date.now() + 120000); try { const r = await Giro.pode(); return { motivo: r.motivo }; } finally { CloudDriver.fila.delete('vault|v0'); CloudDriver.adiado.delete('vault|v0'); } });
    conferir(r4.motivo === 'fila', 'F0. uma mudança das Senhas da casa esperando para subir: não troca (' + JSON.stringify(r4) + ')');
    /* uma troca em curso de outro aparelho (o nome dele vem do banco: nada que vire HTML) e uma deste */
    const giro = (ap, apNome) => gravarDoc('settings', 'giro', { vis: 'restrito', dados: { v: 1, vis: 'restrito', estado: 'recifrando', por: ANA, ap, apNome, de: { kv: 1, fk: FK0 }, para: { kv: 2, fk: 'fk-de-outra-troca' }, envelopes: {}, entregues: {} } }, ANA);
    giro('outro-aparelho', '<img src=x onerror=alert(1)>Celular');
    const r5 = await pode(a), g5 = await girar(a);
    conferir(r5.motivo === 'trocando' && /^Já está trocando no img src=x onerror=alert\(1\)Celular\. Espere terminar\.$/.test(r5.texto) && g5.motivo === 'trocando' && !comFk('fk-de-outra-troca').length && comFk(FK0).length === 6,
      'F0. troca em curso em outro aparelho: "Já está trocando no …" (sem HTML), e nada é tocado (' + JSON.stringify([r5, g5.erro]) + ')');
    const ap = await a.evaluate(async () => Giro.meuAp(await Cofre.local()));
    giro(ap, 'Este');
    const r6 = await pode(a);
    conferir(r6.motivo === 'continuar' && /pela metade/.test(r6.texto), 'F0. troca deste aparelho pela metade: "Continuar de onde parou?" (' + JSON.stringify(r6) + ')');
    const g6 = await girar(a, {});
    conferir(g6.motivo === 'outroAp' && comFk(FK0).length === 6, 'F0. continuar sem ter a nova daqui (nem no cadeado, nem no envelope, nem na família): "Continue no aparelho onde começou", nada tocado (' + JSON.stringify(g6) + ')');
    db.omni_docs.splice(db.omni_docs.indexOf(linha('settings', 'giro')), 1);
    const g7 = await girar(a, {});
    conferir(g7.motivo === 'nada' && !linha('settings', 'giro'), 'F0. "continuar" sem troca nenhuma não começa uma (' + JSON.stringify(g7) + ')');
    /* depois de uma troca feita (à mão), este aparelho ficou com a de antes (sem adotar: como antes da volta do poll que adota) */
    await a.evaluate(() => { Cofre.conferirAoVivo = async () => false; });
    await trocaAMao();
    const r8 = await pode(a);
    conferir(r8.motivo === 'velho', 'F0. este aparelho com a chave de antes do registro: não troca (' + JSON.stringify(r8) + ')');
  });

  /* ================= G7a (etapa E5): cair no meio e retomar ================= */
  await parte('G7a', 'O app recarrega com parte das linhas trocadas: ao abrir pelo PIN, "Continuar" termina com a MESMA chave nova, sem trocar de novo o que já estava e sem item duplicado', async (novo) => {
    const A = await novo('G7a-ana', { vp: 'celular' }), a = A.p;
    await abertoComVelha(a, ANA, PIN_A);
    const ids0 = idsVault(), apagado0 = JSON.stringify(linha('vault', 'vApagado'));
    let naHora = -1, recarregou = null;
    M.depoisDe = { 'PATCH vault': 3, acao: () => { naHora = 6 - comFk(FK0).length; recarregou = a.reload().catch(() => {}); } };
    const r1 = await girar(a).catch((e) => ({ morreu: String(e).split('\n')[0] }));
    await ate(() => recarregou, 10000); await recarregou;
    await a.waitForFunction(() => typeof S !== 'undefined' && S.booted && S.mode === 'cloud' && S.family, null, { timeout: 30000 });
    await espere(800);
    const gd1 = JSON.parse(JSON.stringify(linha('settings', 'giro').dados)), fkN = gd1.para.fk, n = await chaveDaPessoa(ANA), antes = comFk(fkN).length;
    conferir(!r1.ok && gd1.estado === 'recifrando' && naHora === 3 && antes >= 3 && antes < 6 && regBanco().fk === FK0 && n && n.fk === fkN,
      'G7a. recarregou no meio: a troca parada em "recifrando", ' + antes + ' das 6 linhas na nova, o registro ainda o de antes, a nova já com a família (' + JSON.stringify([r1.erro || r1.morreu, gd1.estado, naHora, antes]) + ')');
    await quieto(a); await senhasDaCasa(a);
    const ra = await abrirPeloPin(a, PIN_A), fam = await famDe(a);
    conferir(ra.ok && fam.fk === FK0 && fam.prox === fkN && await a.evaluate(() => Cofre.fk) === FK0, 'G7a. abre pelo PIN com a de antes; a nova continua guardada neste aparelho (prox) depois de recarregar');
    conferir(await a.evaluate(() => Giro.desistir()) === false && linha('settings', 'giro').dados.estado === 'recifrando', 'C5. depois de a nova sair para a família, "Desistir" não vale mais (só continuar)');
    const marca = M.log.length;
    const r2 = await girar(a, {});
    const gd = linha('settings', 'giro').dados, pv = M.log.slice(marca).filter((l) => l.metodo === 'PATCH' && /colecao=eq\.vault/.test(l.caminho));
    conferir(r2.ok && gd.estado === 'feito' && gd.para.fk === fkN && gd.para.kv === 2 && regBanco().fk === fkN && comFk(fkN).length === 6 && !comFk(FK0).length,
      'G7a. "Continuar" termina com a MESMA chave nova (nenhuma segunda chave), kv 2 (' + JSON.stringify(r2.erro || r2.r) + ')');
    conferir(pv.length === 6 - antes + 1, 'G7a. só o que faltava foi trocado: ' + (6 - antes) + ' linhas e o código de emergência (' + pv.length + ' PATCH)');
    const e = await entregas(marca);
    conferir(!e.length && versoes(ANA) === '1,2' && versoes(BIA) === '1,2', 'G7a. a família não recebeu de novo (as entregas de antes ficaram anotadas na troca)');
    let t = 0; for (const x of comFk(fkN)) if ((await tituloDe(n.raw, x.dados_cifrado)) === ITENS[+x.id.slice(1)][1]) t++;
    conferir(idsVault() === ids0 && t === 6 && JSON.stringify(linha('vault', 'vApagado')) === apagado0, 'G7a. os mesmos ids (nenhum "v…" a mais), todos os títulos iguais aos de antes, a apagada como estava');
    const tA = await titulos(a), fam2 = await famDe(a);
    conferir(ITENS.every((x, i) => tA['v' + i] === x[1]) && fam2.fk === fkN && fam2.prox === null && JSON.stringify(fam2.velhas) === JSON.stringify([FK0]), 'G7a. o aparelho mostra os 6 e fica com a nova (a de antes só para abrir)');
  });

  /* ================= G7t (etapa E5): as Senhas fecham no meio ================= */
  await parte('G7t', 'As Senhas da casa fecham no meio da troca: ela para logo ("Parou porque as Senhas fecharam"), e ao abrir de novo "Continuar" termina', async (novo) => {
    const A = await novo('G7t-ana', { vp: 'celular' }), a = A.p;
    await abertoComVelha(a, ANA, PIN_A);
    let naHora = -1;
    M.depoisDe = { 'PATCH vault': 2, acao: () => { naHora = 6 - comFk(FK0).length; a.evaluate(() => Cofre.trancar()).catch(() => {}); } };
    await a.evaluate(() => { Giro.PAUSA_MS = 300; });
    const r1 = await girar(a);
    await espere(500);
    const fkN = linha('settings', 'giro').dados.para.fk, antes = comFk(fkN).length;
    conferir(!r1.ok && r1.motivo === 'trancou' && r1.erro === 'Parou porque as Senhas fecharam. Abra e toque em Continuar.' && antes <= naHora + 1 && antes < 6 && await a.evaluate(() => !Giro.rodando),
      'G7t. trancou: a troca para na linha seguinte, com o texto para leigo (' + JSON.stringify([r1.erro, naHora, antes]) + ')');
    await a.evaluate(() => { Giro.PAUSA_MS = 0; });
    const ra = await abrirPeloPin(a, PIN_A), r2 = await girar(a, {});
    conferir(ra.ok && r2.ok && linha('settings', 'giro').dados.estado === 'feito' && comFk(fkN).length === 6 && regBanco().fk === fkN, 'G7t. abre pelo PIN e "Continuar" termina, com a mesma chave nova');
  });

  /* ================= D1 (etapa E5): desistir antes da entrega ================= */
  await parte('D1', '"Desistir" só antes de a nova sair para a família: a troca vira "desistiu", a nova sai do aparelho e nada mais muda; a próxima troca nasce por cima, com outra chave e a versão seguinte', async (novo) => {
    const A = await novo('D1-ana', { vp: 'celular' }), a = A.p;
    await abertoComVelha(a, ANA, PIN_A);
    /* o app fecha logo depois de a troca nascer, antes de guardar a nova aqui */
    await a.evaluate(() => { Giro.guardarProx = () => new Promise(() => {}); });
    girar(a).catch(() => null);
    await ate(() => linha('settings', 'giro'), 15000); await espere(300);
    await a.reload().catch(() => {});
    await a.waitForFunction(() => typeof S !== 'undefined' && S.booted && S.mode === 'cloud' && S.family, null, { timeout: 30000 });
    await espere(800);
    const g1 = JSON.parse(JSON.stringify(linha('settings', 'giro').dados));
    conferir(g1.estado === 'preparado' && versoes(ANA) === '1' && comFk(FK0).length === 6, 'D1. recarregou logo depois de a troca nascer: "preparado", nada entregue, nenhuma linha mexida (' + g1.estado + ')');
    await quieto(a); await senhasDaCasa(a);
    const ra = await abrirPeloPin(a, PIN_A), d = await a.evaluate(() => Giro.desistir()), fam = await famDe(a), g2 = linha('settings', 'giro').dados;
    conferir(ra.ok && d === true && g2.estado === 'desistiu' && JSON.stringify(g2.envelopes) === '{}' && fam.prox === null && fam.fk === FK0 && versoes(ANA) === '1' && comFk(FK0).length === 6 && regBanco().fk === FK0,
      'D1. "Desistir": a troca "desistiu", sem envelopes, a nova sai deste aparelho, e nada mais mudou');
    const r = await girar(a), g3 = linha('settings', 'giro').dados;
    conferir(r.ok && g3.estado === 'feito' && g3.para.fk !== g1.para.fk && g3.para.kv === 3 && regBanco().kv === 3 && comFk(g3.para.fk).length === 6,
      'D1. a próxima troca nasce por cima da que desistiu (com a versão lida), com outra chave e a versão seguinte (nunca duas chaves com a mesma versão) (' + JSON.stringify([r.erro, g3.para]) + ')');
  });

  /* ================= G8b (etapa E5, C1): dois aparelhos começam juntos ================= */
  await parte('G8b', 'Dois aparelhos da Ana confirmam ao mesmo tempo (C1): o banco aceita uma troca só; o outro diz "Já está trocando" e nunca grava a chave dele por cima', async (novo) => {
    const A = await novo('G8b-ana-celular', { vp: 'celular' }), a = A.p;
    const B = await novo('G8b-ana-computador', { vp: 'computador' }), b = B.p;
    await abertoComVelha(a, ANA, PIN_A);
    await abertoComVelha(b, ANA, PIN_A);
    /* os dois passam pela conferência antes e só gravam a troca quando os dois chegaram lá */
    const segurar = (p) => p.evaluate(() => { const o = Giro.gravarDoc; window.__parado = false; window.__vai = false; Giro.gravarDoc = async function (row, d) { if (d.estado === 'preparado' && !window.__passou) { window.__parado = true; while (!window.__vai) await new Promise((r) => setTimeout(r, 30)); window.__passou = true; } return o.apply(this, arguments); }; });
    await segurar(a); await segurar(b);
    await a.evaluate(() => { Giro.PAUSA_MS = 200; }); await b.evaluate(() => { Giro.PAUSA_MS = 200; });
    const marca = M.log.length, pa = girar(a), pb = girar(b);
    const chegaram = await esperar(a, () => window.__parado, null, 20000) && await esperar(b, () => window.__parado, null, 20000);
    await a.evaluate(() => { window.__vai = true; }); await b.evaluate(() => { window.__vai = true; });
    const [ra, rb] = await Promise.all([pa, pb]);
    const gd = linha('settings', 'giro').dados, fkN = gd.para.fk, um = [ra, rb].filter((x) => x.ok), outro = [ra, rb].find((x) => !x.ok);
    conferir(chegaram && um.length === 1 && outro && outro.motivo === 'trocando' && /^Já está trocando no /.test(outro.erro), 'G8b. uma troca só: a outra para com "Já está trocando no …" (' + JSON.stringify([ra.erro || 'ok', rb.erro || 'ok']) + ')');
    const fks = [...new Set(vivasVault().filter((x) => x.id !== '_em').map((x) => JSON.parse(x.dados_cifrado).fk))];
    conferir(gd.estado === 'feito' && JSON.stringify(fks) === JSON.stringify([fkN]) && regBanco().fk === fkN && um.length === 1 && um[0].r.estranhas.length === 0,
      'G8b. todas as linhas com UMA chave nova (a da troca que ficou), nenhum item "que não abre" (' + JSON.stringify(fks) + ')');
    const posts = M.log.slice(marca).filter((l) => l.metodo === 'POST' && l.corpo && l.corpo.colecao === 'settings' && l.corpo.id === 'giro'), patches = M.log.slice(marca).filter((l) => l.metodo === 'PATCH' && /id=eq\.giro/.test(l.caminho) && l.corpo && l.corpo.dados && l.corpo.dados.para && l.corpo.dados.para.fk !== fkN);
    conferir(posts.length === 2 && !patches.length, 'G8b. os dois tentaram criar (o banco recusou o segundo) e nenhum gravou outra chave por cima (' + posts.length + ' POST, ' + patches.length + ' PATCH de outra chave)');
    const perdeu = ra.ok ? b : a, famP = await famDe(perdeu);
    conferir(famP.prox === null && [fkN, FK0].includes(famP.fk) && famP.velhas.every((v) => [FK0, fkN].includes(v)), 'G8b. o aparelho que não ficou com a troca não guardou nenhuma chave nova dele (' + JSON.stringify(famP) + ')');
  });

  /* ================= G8c (etapa E5, C1): outra troca venceu no meio ================= */
  await parte('G8c', 'Outra troca ficou com a vez no meio (C1): uma linha de chave desconhecida e versão maior faz este aparelho parar ("Continuou em outro aparelho seu"), e a nova dele vai para as de antes, sem se perder', async (novo) => {
    const A = await novo('G8c-ana', { vp: 'celular' }), a = A.p;
    await abertoComVelha(a, ANA, PIN_A);
    const intrusa = await linhaCom(new Uint8Array(crypto.randomBytes(32)), 3, 'fk-da-outra-troca', 'Da outra troca');
    /* depois do 4º PATCH do settings (entregando, as duas entregas, recifrando): a troca passa a ser de outro aparelho */
    M.depoisDe = { 'PATCH settings': 4, acao: () => {
      const g = linha('settings', 'giro');
      gravarDoc('settings', 'giro', { dados: Object.assign({}, g.dados, { ap: 'outro-aparelho', apNome: 'Outro', para: { kv: 3, fk: 'fk-da-outra-troca' } }) }, ANA);
      gravarDoc('vault', 'a0', { dados_cifrado: intrusa }, ANA);
    } };
    const marca = M.log.length;
    const r = await girar(a);
    const minha = (M.log.slice(marca).find((l) => l.metodo === 'POST' && l.corpo && l.corpo.id === 'giro') || { corpo: { dados: { para: {} } } }).corpo.dados.para.fk, fam = await famDe(a);
    conferir(!r.ok && r.motivo === 'assumiram' && r.erro === 'Continuou em outro aparelho seu.' && !comFk(minha).length && comFk(FK0).length === 6,
      'G8c. parou na linha da outra troca, antes de tocar em qualquer linha (' + JSON.stringify([r.erro, comFk(minha).length]) + ')');
    conferir(minha && fam.prox === null && fam.velhas.includes(minha) && fam.fk === FK0, 'G8c. a nova deste aparelho não se perdeu: foi para as de antes, só para abrir (' + JSON.stringify(fam) + ')');
  });

  /* ================= G8d (etapa E5, C1): a vez passou para outro aparelho no meio, sem linha nenhuma dele ================= */
  await parte('G8d', 'A troca passou a ser de outro aparelho no meio (C1): a próxima anotação deste encontra outra versão, relê e para ("Continuou em outro aparelho seu"), sem gravar por cima', async (novo) => {
    const A = await novo('G8d-ana', { vp: 'celular' }), a = A.p;
    await abertoComVelha(a, ANA, PIN_A);
    let outra = null;
    M.depoisDe = { 'PATCH settings': 4, acao: () => { const g = linha('settings', 'giro'); outra = Object.assign({}, g.dados, { ap: 'outro-aparelho', apNome: 'Outro' }); gravarDoc('settings', 'giro', { dados: outra }, ANA); } };
    const marca = M.log.length, r = await girar(a), g = linha('settings', 'giro').dados, fam = await famDe(a);
    const minha = (M.log.slice(marca).find((l) => l.metodo === 'POST' && l.corpo && l.corpo.id === 'giro') || { corpo: { dados: { para: {} } } }).corpo.dados.para.fk;
    conferir(!r.ok && r.motivo === 'assumiram' && g.ap === 'outro-aparelho' && g.estado === 'recifrando' && regBanco().fk === FK0,
      'G8d. parou com "Continuou em outro aparelho seu." e a troca no banco continua a do outro aparelho (nada gravado por cima) (' + JSON.stringify([r.erro, g.ap, g.estado]) + ')');
    conferir(fam.fk === FK0 && fam.prox === minha && g.para.fk === minha, 'G8d. a mesma troca (a mesma nova): o prox fica, para o outro aparelho continuar com ela (' + JSON.stringify(fam) + ')');
  });

  /* ================= AN (etapa E5): o app fecha no meio de um anexo ================= */
  await parte('AN', 'O app fecha no meio de um anexo (antes e depois de gravar o arquivo novo): o anexo continua abrindo, e "Continuar" termina com ele na nova', async (novo) => {
    const A = await novo('AN-ana', { vp: 'celular' }), a = A.p;
    await abertoComVelha(a, ANA, PIN_A);
    await anexar(a, [['fANantes', 'familia'], ['fANdepois', 'familia']]);
    /* "o app morre": antes de gravar o arquivo novo de um, e logo depois de gravar o do outro */
    await a.evaluate(() => { const o = DB.driver.putFile.bind(DB.driver); DB.driver.putFile = async function (id, blob, meta) { if (id === 'fANantes' && !window.__a) { window.__a = 1; throw new Error('o app fechou'); } const r = await o(id, blob, meta); if (id === 'fANdepois' && !window.__d) { window.__d = 1; throw new Error('o app fechou'); } return r; }; });
    const r1 = await girar(a), m1 = await anexosDe(a, ['fANantes', 'fANdepois']);
    conferir(!r1.ok && m1.fANantes.txt === 'anexo fANantes' && !!m1.fANantes.enc.antes, 'AN. parou antes do arquivo novo: a ficha diz as duas, e o anexo abre (' + JSON.stringify([r1.erro, m1.fANantes.enc]) + ')');
    const r2 = await girar(a, {}), m2 = await anexosDe(a, ['fANantes', 'fANdepois']);
    conferir(!r2.ok && m2.fANdepois.txt === 'anexo fANdepois' && !!m2.fANdepois.enc.antes, 'AN. parou logo depois do arquivo novo: o anexo abre (a ficha ainda diz as duas) (' + JSON.stringify([r2.erro, m2.fANdepois.enc]) + ')');
    const r3 = await girar(a, {}), m3 = await anexosDe(a, ['fANantes', 'fANdepois']), fkN = linha('settings', 'giro').dados.para.fk, n = await chaveDaPessoa(ANA);
    let ok = 0; for (const id of ['fANantes', 'fANdepois']) if (m3[id].txt === 'anexo ' + id && m3[id].enc.fk === fkN && !m3[id].enc.antes && (await abreBlob(n.raw, m3[id].enc.iv, m3[id].bytes))) ok++;
    conferir(r3.ok && ok === 2, '"Continuar" termina: os dois anexos na nova, a ficha só com ela, e abrem (' + JSON.stringify([r3.erro || 'ok', m3.fANantes.enc, m3.fANdepois.enc]) + ')');
  });

  /* ================= FU (etapa E6): a troca como trabalho do Fundo ================= */
  await parte('FU', 'A troca no Fundo (Giro.iniciar): a pílula "Deixando a família mais segura" com o andamento e sem ✕, a tela acesa pedida e solta, o aviso antes de fechar, trocar de tela 3 vezes não para, e o fim aparece onde a pessoa está', async (novo) => {
    const A = await novo('FU-ana', { vp: 'celular' }), a = A.p;
    await abertoComVelha(a, ANA, PIN_A);
    await wakeLockDeMentira(a); await vigiarAvisos(a);
    const fecharAntes = await avisaAntesDeFechar(a);
    await a.evaluate(() => { Giro.PAUSA_MS = 600; go('house', 'vault'); });
    await pelaPilula(a);
    const viu = await esperar(a, () => [...document.querySelectorAll('.dgo-tarefa')].some((x) => /Deixando a família mais segura/.test(x.innerText) && /Senhas: \d de 6/.test(x.innerText)), null, 20000);
    const durante = await a.evaluate(() => {
      const t = DGO.fundo.lista().find((x) => x.tipo === 'chave-familia');
      return { t: t && { id: t.id, estado: t.estado, podeCancelar: t.podeCancelar }, x: !!document.querySelector('.dgo-tarefa .dgo-tarefa-bt'), live: !!document.querySelector('.dgo-tarefas[aria-live]'), rodando: Giro.rodando, wl: window.__wl.slice(), cartao: !!document.querySelector('#giroCartao') };
    });
    const avisoDurante = await avisaAntesDeFechar(a);
    conferir(viu && durante.t && durante.t.id === 'giro-' + GID && durante.t.estado === 'rodando' && durante.t.podeCancelar === false && !durante.x && durante.rodando && !durante.cartao,
      'FU. a pílula "Deixando a família mais segura" com "Senhas: i de 6", trabalho do Fundo tipo chave-familia, sem ✕ (parar no meio não); o cartão "Continuar" não aparece enquanto roda (' + JSON.stringify(durante.t) + ')');
    conferir(!fecharAntes && avisoDurante && JSON.stringify(durante.wl) === '["pedido"]' && durante.live, 'FU. enquanto troca: a tela acesa pedida, o aviso antes de fechar ligado (antes não estava) e a pílula num lugar que o leitor de tela anuncia (' + JSON.stringify(durante.wl) + ')');
    /* trocar de tela 3 vezes no meio não para nada */
    for (const [t, s] of [['home', null], ['settings', 'conta'], ['house', 'vault']]) { await a.evaluate(([t, s]) => go(t, s || undefined), [t, s]); await espere(300); }
    const fim = await esperar(a, () => window.__fu && window.__fu.ok, null, 40000);
    await espere(600);
    const gd = linha('settings', 'giro').dados, wl = await a.evaluate(() => window.__wl.slice()), avisoDepois = await avisaAntesDeFechar(a);
    conferir(fim && gd.estado === 'feito' && comFk(gd.para.fk).length === 6 && regBanco().fk === gd.para.fk, 'FU. trocando de tela 3 vezes no meio, a troca termina ("feito", as 6 na nova)');
    conferir(!avisoDepois && JSON.stringify(wl) === '["pedido","solto"]', 'FU. no fim: a tela acesa solta e o aviso antes de fechar desligado (' + JSON.stringify([wl, avisoDepois]) + ')');
    /* E9: o fim é a janela "✓ A família está mais segura" (antes, um aviso curto) */
    conferir(/A família está mais segura/.test(await janelas(a)) && !(await cartaoGiro(a)), 'FU. o fim aparece onde a pessoa está (a janela "✓ A família está mais segura"), sem cartão de troca pela metade');
  });

  /* ================= G7r (etapa E6): recarregar no meio do trabalho do Fundo ================= */
  await parte('G7r', 'O app recarrega no meio da troca do Fundo: a pílula "foi interrompido" com "Continuar de onde parou"; fechadas, as Senhas pedem o PIN e mostram tudo (também o que já foi trocado); o cartão "Continuar" termina com a mesma nova', async (novo) => {
    const A = await novo('G7r-ana', { vp: 'celular' }), a = A.p;
    await abertoComVelha(a, ANA, PIN_A);
    /* o aviso antes de fechar do navegador, se vier, é aceito (quem recarregou disse "sair mesmo assim") */
    a.removeAllListeners('dialog');
    a.on('dialog', (d) => { if (d.type() === 'beforeunload') d.accept().catch(() => {}); else { A.lixo.nativos.push(d.type() + ': ' + d.message()); d.dismiss().catch(() => {}); } });
    const ids0 = idsVault();
    let recarregou = null;
    M.depoisDe = { 'PATCH vault': 3, acao: () => { recarregou = a.reload().catch(() => {}); } };
    await a.evaluate(() => { Giro.PAUSA_MS = 200; go('house', 'vault'); });
    await pelaPilula(a);
    await ate(() => recarregou, 20000); await recarregou;
    await a.waitForFunction(() => typeof S !== 'undefined' && S.booted && S.mode === 'cloud' && S.family, null, { timeout: 30000 });
    const fkN = linha('settings', 'giro').dados.para.fk, antes = comFk(fkN).length;
    const bt = await a.waitForSelector('.dgo-tarefa button[aria-label="Continuar de onde parou"]', { timeout: 10000 }).then(() => true, () => false);
    conferir(bt && antes >= 3 && antes < 6 && linha('settings', 'giro').dados.estado === 'recifrando' && regBanco().fk === FK0, 'G7r. recarregou no meio: a pílula "foi interrompido" com "Continuar de onde parou" (' + antes + ' de 6 já na nova)');
    await quieto(a); await vigiarAvisos(a);
    await a.click('.dgo-tarefa button[aria-label="Continuar de onde parou"]');
    await esperar(a, () => S.route && S.route.tab === 'house' && S.route.sub === 'vault' && Cofre.status && Cofre.status.fase === 'trancado', null, 8000);
    await espere(500);
    const c1 = await cartaoGiro(a);
    conferir(/Abra as Senhas da casa para continuar a troca/.test(await avisos(a)) && /A troca ficou pela metade\. Continuar de onde parou\? Abra as Senhas da casa/.test(c1) && !/conta\.giro/.test(await a.evaluate(() => document.querySelector('#giroCartao').innerHTML)),
      '"Continuar de onde parou" leva às Senhas da casa: fechadas, pede para abrir, e o cartão da troca pela metade já está lá (sem botão até abrir) (' + c1 + ')');
    const ra = await abrirPeloPin(a, PIN_A); await espere(400);
    const t = await titulos(a);
    conferir(ra.ok && ITENS.every((x, i) => t['v' + i] === x[1]) && await a.evaluate(() => !Giro.rodando), 'G7r. abre pelo PIN e mostra os 6 — também os já trocados, antes do "Continuar" (a nova do prox só para abrir) (' + JSON.stringify(t) + ')');
    const temBt = await a.waitForSelector('#giroCartao [data-act="conta.giro.continuar"]', { timeout: 5000 }).then(() => true, () => false);
    const semDesistir = !(await a.$('#giroCartao [data-act="conta.giro.desistir"]'));
    if (temBt) await a.click('#giroCartao [data-act="conta.giro.continuar"]');
    const fim = await ateA(async () => linha('settings', 'giro').dados.estado === 'feito', 30000);
    const gd = linha('settings', 'giro').dados;
    conferir(temBt && semDesistir && fim && gd.para.fk === fkN && gd.para.kv === 2 && comFk(fkN).length === 6 && !comFk(FK0).length && regBanco().fk === fkN && idsVault() === ids0,
      'G7r. o cartão "Continuar" (sem "Desistir": a nova já saiu para a família) termina com a MESMA nova, sem item a mais');
    await espere(600);
    conferir(!(await cartaoGiro(a)), 'G7r. terminada, o cartão sai');
  });

  /* ================= G7b (etapa E6): o aparelho que trocava sumiu; outro do mesmo chefe continua ================= */
  await parte('G7b', 'O aparelho que trocava some no meio (fechado): o outro aparelho do mesmo chefe só oferece continuar depois do prazo sem notícia; "Continuar neste aparelho" termina com a MESMA nova (nenhuma segunda chave)', async (novo) => {
    const A = await novo('G7b-ana-celular', { vp: 'celular' }), a = A.p;
    const B = await novo('G7b-ana-computador', { vp: 'computador' }), b = B.p;
    await abertoComVelha(a, ANA, PIN_A);
    await abertoComVelha(b, ANA, PIN_A);
    const ids0 = idsVault();
    let fechou = null;
    M.depoisDe = { 'PATCH vault': 3, acao: () => { fechou = A.ctx.close().catch(() => {}); } };
    girar(a).catch(() => null);
    await ate(() => fechou, 20000); await fechou; await espere(300);
    const g1 = JSON.parse(JSON.stringify(linha('settings', 'giro').dados)), fkN = g1.para.fk, antes = comFk(fkN).length, entregues = versoes(ANA) + '/' + versoes(BIA);
    /* logo depois: a troca tem notícia recente — o outro aparelho só vê o aviso, e assumir não passa */
    await b.evaluate(async () => { await Cloud.poll(); go('house', 'vault'); render(); });
    await espere(400);
    const c0 = await cartaoGiro(b), r0 = await b.evaluate(() => Giro.assumir());
    conferir(antes >= 3 && antes < 6 && /Já está trocando no /.test(c0) && !(await b.$('#giroCartao [data-act="conta.giro.assumir"]')) && r0.motivo === 'trocando' && linha('settings', 'giro').dados.ap === g1.ap,
      'G7b. com notícia recente, o outro aparelho do chefe só vê "Já está trocando no …" e não assume (' + JSON.stringify([c0, r0.motivo]) + ')');
    /* parada há mais que o prazo: o cartão oferece continuar aqui */
    await b.evaluate(() => { Giro.PARADO_MS = 1500; Giro.ASSUMIR_MS = 500; });
    await espere(1700); await b.evaluate(() => render());
    const c1 = await cartaoGiro(b);
    conferir(/A troca começou no .+ e parou há 0 min\. Continuar neste aparelho\?/.test(c1) && !!(await b.$('#giroCartao [data-act="conta.giro.assumir"]')),
      'G7b. parada há mais que o prazo: "A troca começou no … e parou há 0 min. Continuar neste aparelho?" com o botão (' + c1 + ')');
    /* a troca anda entre as duas leituras (o outro aparelho voltou): não assume */
    setTimeout(() => gravarDoc('settings', 'giro', { dados: JSON.parse(JSON.stringify(linha('settings', 'giro').dados)) }, ANA), 200);
    const r2 = await b.evaluate(() => Giro.assumir());
    conferir(r2.motivo === 'trocando' && linha('settings', 'giro').dados.ap === g1.ap, 'G7b. se a troca anda entre as duas leituras, não assume (a vez fica com o outro) (' + JSON.stringify(r2) + ')');
    await espere(1700); await b.evaluate(async () => { await Cloud.poll(); render(); });
    const marca = M.log.length;
    await b.click('#giroCartao [data-act="conta.giro.assumir"]');
    const fim = await ateA(async () => linha('settings', 'giro').dados.estado === 'feito', 40000);
    const gd = linha('settings', 'giro').dados, n = await chaveDaPessoa(ANA), apB = await b.evaluate(async () => Giro.meuAp(await Cofre.local()));
    conferir(fim && gd.para.fk === fkN && gd.para.kv === 2 && gd.ap === apB && gd.ap !== g1.ap && comFk(fkN).length === 6 && !comFk(FK0).length && regBanco().fk === fkN,
      'G7b. "Continuar neste aparelho" termina com a MESMA nova (kv 2), agora com a vez deste aparelho (' + JSON.stringify([gd.estado, gd.para, gd.ap === apB]) + ')');
    let tt = 0; for (const x of comFk(fkN)) if ((await tituloDe(n.raw, x.dados_cifrado)) === ITENS[+x.id.slice(1)][1]) tt++;
    const posts = M.log.slice(marca).filter((l) => l.metodo === 'POST' && l.corpo && l.corpo.id === 'giro');
    conferir(idsVault() === ids0 && tt === 6 && !posts.length && !(await entregas(marca)).length && versoes(ANA) + '/' + versoes(BIA) === entregues, 'G7b. os mesmos ids, os títulos iguais, nenhuma troca nova e a família não recebeu de novo');
    const famB = await famDe(b);
    conferir(famB.fk === fkN && famB.velhas.includes(FK0) && famB.prox === null, 'G7b. o aparelho que continuou fica com a nova (a de antes só para abrir) (' + JSON.stringify(famB) + ')');
  });

  /* ================= G7e (etapa E11, C5): o aparelho que trocava se perde, e a reserva da troca não serve ================= */
  await parte('G7e', 'C5: o aparelho que trocava se perde no meio das linhas (o contexto e o IndexedDB dele somem, com o prox) e a reserva da troca (os envelopes) não serve; outro aparelho da Ana, fechado durante a troca, abre pelo PIN e "Continuar neste aparelho" termina com a MESMA nova — achada em sol_grupo_chaves, onde ela chegou ANTES da primeira linha', async (novo) => {
    const A = await novo('G7e-ana-celular', { vp: 'celular' }), a = A.p;
    const B = await novo('G7e-ana-computador', { vp: 'computador' }), b = B.p;
    await abertoComVelha(a, ANA, PIN_A);
    await abertoComVelha(b, ANA, PIN_A);
    await b.evaluate(() => { Cofre.trancar(); render(); });   /* o computador fica guardado, com as Senhas fechadas, durante a troca */
    const ids0 = idsVault();
    let fechou = null;
    M.depoisDe = { 'PATCH vault': 3, acao: () => { fechou = A.ctx.close().catch(() => {}); } };
    girar(a).catch(() => null);
    await ate(() => fechou, 20000); await fechou; await espere(300);
    const g1 = JSON.parse(JSON.stringify(linha('settings', 'giro').dados)), fkN = g1.para.fk, entregues = versoes(ANA) + '/' + versoes(BIA);
    const feitas = comFk(fkN).map((x) => x.id + ':' + x.versao).sort();
    conferir(g1.estado === 'recifrando' && feitas.length >= 3 && feitas.length < 6 && entregues === '1,2/1,2' && !!(g1.envelopes || {})[ANA],
      'G7e. o celular some no meio das linhas (' + feitas.length + ' de 6 na nova): a nova já estava com a família (Ana e Bia, versão 2) antes da primeira linha (C5)');
    /* a reserva da troca não serve (os envelopes saem do banco): a nova só pode vir de sol_grupo_chaves */
    gravarDoc('settings', 'giro', { dados: Object.assign({}, g1, { envelopes: {} }) }, ANA);
    const ab = await abrirPeloPin(b, PIN_A);
    await b.evaluate(() => { Giro.PARADO_MS = 1500; Giro.ASSUMIR_MS = 500; });
    await espere(1700); await b.evaluate(async () => { await Cloud.poll(); go('house', 'vault'); render(); });
    const c1 = await cartaoGiro(b);
    conferir(!!(ab && ab.ok) && /A troca começou no .+ e parou há \d+ min\. Continuar neste aparelho\?/.test(c1) && !!(await b.$('#giroCartao [data-act="conta.giro.assumir"]')),
      'G7e. o computador abre pelo PIN (ainda com a de antes) e oferece "Continuar neste aparelho" (' + c1 + ')');
    const marca = M.log.length;
    await b.click('#giroCartao [data-act="conta.giro.assumir"]');
    const fim = await ateA(async () => linha('settings', 'giro').dados.estado === 'feito', 40000);
    const gd = linha('settings', 'giro').dados, n = await chaveDaPessoa(ANA);
    conferir(fim && gd.para.fk === fkN && gd.para.kv === 2 && gd.ap !== g1.ap && comFk(fkN).length === 6 && !comFk(FK0).length && regBanco().fk === fkN && regBanco().kv === 2,
      'G7e. "Continuar neste aparelho" termina com a MESMA nova (kv 2): nenhuma segunda chave, nenhuma linha na de antes (' + JSON.stringify([gd.estado, gd.para]) + ')');
    const buscou = M.log.slice(marca).some((l) => /rpc\/sol_minha_chave_grupo$/.test(l.caminho) && l.quem === ANA);
    let tt = 0; for (const x of comFk(fkN)) if ((await tituloDe(n.raw, x.dados_cifrado)) === ITENS[+x.id.slice(1)][1]) tt++;
    const posts = M.log.slice(marca).filter((l) => l.metodo === 'POST' && l.corpo && l.corpo.id === 'giro');
    conferir(buscou && idsVault() === ids0 && tt === 6 && !posts.length && !(await entregas(marca)).length && versoes(ANA) + '/' + versoes(BIA) === entregues,
      'G7e. a nova veio de sol_grupo_chaves (a família já a tinha); os mesmos ids, os títulos iguais, nenhuma troca nova e ninguém recebeu de novo');
    conferir(feitas.every((x) => { const [id, v] = x.split(':'); return String(linha('vault', id).versao) === v; }), 'G7e. as linhas que o celular já tinha trocado não foram trocadas de novo');
    const famB = await famDe(b);
    conferir(famB.fk === fkN && famB.velhas.includes(FK0) && famB.prox === null, 'G7e. o computador fica com a nova (a de antes só para abrir) (' + JSON.stringify(famB) + ')');
  });

  /* ================= G7c (etapa E6): sem internet no meio ================= */
  await parte('G7c', 'Sem internet no meio da troca: não erra de cara — "Esperando a internet…" — e continua sozinha quando a internet volta, com a mesma nova', async (novo) => {
    const A = await novo('G7c-ana', { vp: 'celular' }), a = A.p;
    await abertoComVelha(a, ANA, PIN_A);
    const ids0 = idsVault();
    await a.evaluate(() => { Giro.REDE_MS = 300; });
    M.depoisDe = { 'PATCH vault': 2, acao: () => { cortarRede(A, true).catch(() => {}); } };
    await comecar(a);
    const esperando = await esperar(a, () => (window.__passos || []).includes('Esperando a internet…'), null, 20000);
    await espere(2000);
    const meio = await a.evaluate(() => ({ res: window.__res, rodando: Giro.rodando, aberto: Cofre.aberto() }));
    const fkN = linha('settings', 'giro').dados.para.fk, antes = comFk(fkN).length;
    conferir(esperando && !meio.res && meio.rodando && meio.aberto && antes >= 2 && antes < 6, 'G7c. sem internet: a troca espera ("Esperando a internet…"), sem erro (' + JSON.stringify([antes, meio, await a.evaluate(() => window.__passos)]) + ')');
    await cortarRede(A, false);
    const r = await resultado(a, 40000), gd = linha('settings', 'giro').dados;
    conferir(r && r.ok && gd.estado === 'feito' && gd.para.fk === fkN && comFk(fkN).length === 6 && !comFk(FK0).length && regBanco().fk === fkN && idsVault() === ids0 && versoes(ANA) === '1,2',
      'G7c. a internet volta e a troca continua sozinha até o fim, com a mesma nova, sem item a mais nem entrega repetida (' + JSON.stringify(r && (r.erro || r.r)) + ')');
  });

  /* ================= G7d (etapa E6): Sair no meio ================= */
  await parte('G7d', 'Sair no meio da troca: a pergunta diz que ela para e continua quando entrar de novo; ao entrar e abrir pelo PIN, "Continuar" termina com a mesma nova', async (novo) => {
    const A = await novo('G7d-ana', { vp: 'celular' }), a = A.p;
    await abertoComVelha(a, ANA, PIN_A);
    await a.evaluate(() => { Giro.PAUSA_MS = 500; go('house', 'vault'); });
    await pelaPilula(a);
    await ateA(async () => { const g = linha('settings', 'giro'); return !!(g && g.dados.estado === 'recifrando' && comFk(g.dados.para.fk).length >= 1); }, 20000);
    a.evaluate(() => ACT['conta.sair']()).catch(() => {});
    const perg = await a.waitForSelector('.modal [data-yes]', { timeout: 8000 }).then(() => janelas(a), () => '');
    conferir(/A troca de segurança para agora e continua de onde parou quando você entrar de novo\. Sair mesmo assim\?/.test(perg) && !/Se sair agora, ele para/.test(perg),
      'G7d. "Sair" no meio da troca pergunta com o texto da pausa (não "ele para") (' + perg + ')');
    await Promise.all([a.waitForNavigation({ timeout: 20000 }).catch(() => {}), a.click('.modal [data-yes]')]);
    await a.waitForFunction(() => typeof S !== 'undefined' && S.gate === 'welcome', null, { timeout: 20000 }).catch(() => {});
    const fkN = linha('settings', 'giro').dados.para.fk, g1 = linha('settings', 'giro').dados;
    conferir(g1.estado !== 'feito' && regBanco().fk === FK0 && comFk(fkN).length < 6, 'G7d. saiu: a troca ficou parada no meio (' + g1.estado + ', ' + comFk(fkN).length + ' de 6)');
    await entrarOmni(a, ANA); await quieto(a); await senhasDaCasa(a);
    const c0 = await cartaoGiro(a);
    const ra = await abrirPeloPin(a, PIN_A); await espere(400);
    const c1 = await cartaoGiro(a), temBt = !!(await a.$('#giroCartao [data-act="conta.giro.continuar"]'));
    conferir(/A troca ficou pela metade\. Continuar de onde parou\? Abra as Senhas da casa/.test(c0) && ra.ok && /A troca ficou pela metade/.test(c1) && temBt, 'G7d. entrou de novo: o cartão da troca pela metade; abre pelo PIN e o "Continuar" aparece (' + c0 + ' → ' + c1 + ')');
    if (temBt) await a.click('#giroCartao [data-act="conta.giro.continuar"]');
    const fim = await ateA(async () => linha('settings', 'giro').dados.estado === 'feito', 30000);
    conferir(fim && linha('settings', 'giro').dados.para.fk === fkN && comFk(fkN).length === 6 && regBanco().fk === fkN, 'G7d. "Continuar" termina com a mesma nova');
  });

  /* ================= G8 (etapa E6): duas abas do mesmo aparelho ================= */
  await parte('G8', 'Duas abas do mesmo aparelho: com a troca rodando numa, a outra recebe "Já está trocando em outra janela deste aparelho." (começar ou continuar) e o banco só vê uma troca; terminada, a trava sai sozinha', async (novo) => {
    const A = await novo('G8-ana', { vp: 'computador' }), a = A.p;
    await abertoComVelha(a, ANA, PIN_A);
    const a2 = await A.ctx.newPage(); a2.base = BASE; a2.nome = 'G8-aba2';
    const erros2 = []; a2.on('pageerror', (e) => erros2.push(String((e && e.message) || e))); a2.on('dialog', (d) => { erros2.push('diálogo ' + d.type()); d.dismiss().catch(() => {}); });
    await entrarOmni(a2, ANA); await quieto(a2); await senhasDaCasa(a2);
    const r0 = await abrirPeloPin(a2, PIN_A);
    await a.evaluate(() => { Giro.PAUSA_MS = 300; });
    const marca = M.log.length;
    await comecar(a);
    await esperar(a, () => Giro.rodando, null, 5000);
    const r2 = await girar(a2);
    await ateA(async () => !!linha('settings', 'giro'), 15000); await espere(500);
    const r3 = await girar(a2, {});
    const r = await resultado(a, 40000), gd = linha('settings', 'giro').dados;
    const posts = M.log.slice(marca).filter((l) => l.metodo === 'POST' && l.corpo && l.corpo.colecao === 'settings' && l.corpo.id === 'giro');
    conferir(r0.ok && r2.motivo === 'outraAba' && r2.erro === 'Já está trocando em outra janela deste aparelho.' && r3.motivo === 'outraAba', 'G8. a outra aba: "Já está trocando em outra janela deste aparelho." ao começar e ao continuar (' + JSON.stringify([r2, r3]) + ')');
    conferir(r && r.ok && gd.estado === 'feito' && posts.length === 1 && comFk(gd.para.fk).length === 6, 'G8. uma troca só no banco (1 POST), terminada pela primeira aba (' + posts.length + ')');
    const r4 = await girar(a2, {});
    conferir(r4.motivo === 'nada' && !erros2.length, 'G8. terminada, a trava sai sozinha: a outra aba já pode (não há o que continuar) (' + JSON.stringify([r4, erros2]) + ')');
    await a2.close();
  });

  /* ================= G10 (etapa E6): a trava das Senhas durante a troca ================= */
  await parte('G10', 'A trava das Senhas durante a troca: 5 min sem toque não tranca; "Bloquear agora" pergunta antes; o app escondido mais de 30 s tranca e a troca pausa ("Parou porque as Senhas fecharam…"); PIN, tudo aparece, "Continuar" termina', async (novo) => {
    const A = await novo('G10-ana', { vp: 'celular' }), a = A.p;
    await abertoComVelha(a, ANA, PIN_A);
    await a.evaluate(() => { Giro.PAUSA_MS = 400; go('house', 'vault'); });
    await comecar(a);
    await esperar(a, () => (window.__passos || []).some((t) => /^Senhas: 2 de/.test(t)), null, 20000);
    /* 5 min sem tocar na tela */
    const ocioso = await a.evaluate(() => { Trava.ultimo -= 6 * 60e3; Trava.ocioso(); return { aberto: Cofre.aberto(), rodando: Giro.rodando }; });
    conferir(ocioso.aberto && ocioso.rodando, 'G10. 5 min sem tocar na tela com a troca rodando: as Senhas não fecham e a troca segue (' + JSON.stringify(ocioso) + ')');
    /* "Bloquear agora": pergunta; "Cancelar" deixa seguir */
    a.evaluate(() => ACT['conta.bloquear']()).catch(() => {});
    const perg = await a.waitForSelector('.modal [data-yes]', { timeout: 5000 }).then(() => janelas(a), () => '');
    await a.click('.modal [data-no]'); await espere(300);
    const segue = await a.evaluate(() => ({ aberto: Cofre.aberto(), rodando: Giro.rodando, res: window.__res }));
    conferir(/A troca de segurança para agora e continua de onde parou quando você abrir as Senhas da casa de novo\. Bloquear mesmo assim\?/.test(perg) && segue.aberto && segue.rodando && !segue.res,
      'G10. "Bloquear agora" no meio pergunta antes (a troca para e continua depois); "Cancelar" deixa tudo seguindo (' + perg + ')');
    /* o app escondido por mais de 30 s */
    await a.evaluate(() => {
      Object.defineProperty(document, 'hidden', { configurable: true, get: () => true }); document.dispatchEvent(new Event('visibilitychange'));
      Trava.saiu -= 31e3; delete document.hidden; document.dispatchEvent(new Event('visibilitychange'));
    });
    const r1 = await resultado(a, 20000), fkN = linha('settings', 'giro').dados.para.fk, antes = comFk(fkN).length;
    conferir(r1 && !r1.ok && r1.motivo === 'trancou' && r1.erro === 'Parou porque as Senhas fecharam. Abra e toque em Continuar.' && !(await a.evaluate(() => Cofre.aberto() || !!S.vaultKey)) && antes < 6 && regBanco().fk === FK0,
      'G10. escondido mais de 30 s: as Senhas fecham e a troca pausa, com o texto para leigo (' + JSON.stringify([r1, antes]) + ')');
    await a.evaluate(() => render()); await espere(200);
    const c0 = await cartaoGiro(a), ra = await abrirPeloPin(a, PIN_A); await espere(400);
    const t = await titulos(a), temBt = !!(await a.$('#giroCartao [data-act="conta.giro.continuar"]'));
    conferir(/Abra as Senhas da casa/.test(c0) && ra.ok && ITENS.every((x, i) => t['v' + i] === x[1]) && temBt, 'G10. de volta: PIN; os 6 aparecem (também os já trocados) e o "Continuar" (' + c0 + ')');
    if (temBt) await a.click('#giroCartao [data-act="conta.giro.continuar"]');
    const fim = await ateA(async () => linha('settings', 'giro').dados.estado === 'feito', 30000);
    conferir(fim && linha('settings', 'giro').dados.para.fk === fkN && comFk(fkN).length === 6 && regBanco().fk === fkN, 'G10. "Continuar" termina com a mesma nova');
  });

  /* ================= G10b (etapa E6): as Senhas fecham enquanto a troca espera a internet ================= */
  await parte('G10b', 'Sem internet e as Senhas fecham enquanto a troca espera a internet: ela para na hora ("Parou porque as Senhas fecharam…"), sem esperar a rede voltar', async (novo) => {
    const A = await novo('G10b-ana', { vp: 'celular' }), a = A.p;
    await abertoComVelha(a, ANA, PIN_A);
    M.depoisDe = { 'PATCH vault': 2, acao: () => { cortarRede(A, true).catch(() => {}); } };
    await comecar(a);
    const esperando = await esperar(a, () => (window.__passos || []).includes('Esperando a internet…'), null, 20000);
    await a.evaluate(() => Trava.trancar());
    const parou = await esperar(a, () => !!window.__res, null, 3000), r = await a.evaluate(() => window.__res);
    conferir(esperando && parou && r && r.motivo === 'trancou' && await a.evaluate(() => !navigator.onLine && !Giro.rodando), 'G10b. esperando a internet, as Senhas fecham: a troca para na hora, com o texto de quando fecham (' + JSON.stringify(r) + ')');
    await cortarRede(A, false);
  });

  /* ================= G7o (etapa E6): a troca pela metade de outra pessoa ================= */
  await parte('G7o', 'A troca pela metade de OUTRA pessoa (parada há 10 min, menos que o prazo de outro chefe): este chefe não vê o cartão de continuar e não assume (antes desse prazo, só quem começou continua)', async (novo) => {
    const A = await novo('G7o-ana', { vp: 'celular' }), a = A.p;
    await abertoComVelha(a, ANA, PIN_A);
    const g = gravarDoc('settings', 'giro', { vis: 'restrito', dados: trocaNoBanco({ por: CRIS, apNome: 'Aparelho da Cris' }) }, CRIS);
    g.atualizado_em = new Date(Date.now() - 10 * 60e3).toISOString();
    await a.evaluate(async () => { const b = await Giro.ler(); await CloudDriver.aceitar('settings', 'giro', b.giro, true); go('house', 'vault'); render(); });
    await espere(300);
    const c = await cartaoGiro(a), r = await a.evaluate(() => Giro.assumir()), d = linha('settings', 'giro').dados;
    conferir(!c && r.motivo === 'trocando' && d.por === CRIS && d.ap === 'aparelho-de-mentira', 'G7o. sem cartão e sem assumir a troca de outra pessoa (' + JSON.stringify([c, r.motivo, d.por === CRIS]) + ')');
  });

  /* ================= G10v (etapa E6): as Senhas fecham bem na hora de virar ================= */
  await parte('G10v', 'As Senhas fecham bem na hora de virar (o registro já mudou): a troca pausa SEM abrir as Senhas de novo; o cadeado daqui já tem a nova; PIN e "Continuar" terminam', async (novo) => {
    const A = await novo('G10v-ana', { vp: 'celular' }), a = A.p;
    await abertoComVelha(a, ANA, PIN_A);
    await a.evaluate(() => { const o = Cofre.adotar; Cofre.adotar = async function () { const r = await o.apply(this, arguments); if (Giro.rodando && !window.__tr) { window.__tr = 1; Cofre.trancar(); } return r; }; });
    const r = await girar(a); await espere(800);
    const gd = linha('settings', 'giro').dados, fkN = gd.para.fk, fam = await famDe(a), fechado = await a.evaluate(() => ({ aberto: Cofre.aberto(), vf: !!Cofre.vf, chave: !!S.vaultKey }));
    conferir(!r.ok && r.motivo === 'trancou' && !fechado.aberto && !fechado.vf && !fechado.chave && regBanco().fk === fkN && fam.fk === fkN && gd.estado === 'virando',
      'G10v. trancou ao virar: a troca pausa e as Senhas ficam fechadas (nada as abre de novo); o registro e o cadeado daqui já com a nova (' + JSON.stringify([r.motivo, fechado, gd.estado]) + ')');
    const ra = await abrirPeloPin(a, PIN_A), fk = await a.evaluate(() => Cofre.fk), r2 = await girar(a, {});
    conferir(ra.ok && fk === fkN && r2.ok && linha('settings', 'giro').dados.estado === 'feito', 'G10v. abre pelo PIN (já com a nova) e "Continuar" termina');
  });

  /* ================= G7f (etapa E6, C8): aprovado de novo pela conta no meio da troca ================= */
  /* "Esqueci o PIN" e a aprovação pelo outro aparelho (Cofre.montar com a chave pessoal e outro PIN) bem na hora de uma gravação da
     troca: quando = "giro" (logo depois de a troca nascer, antes de guardar a nova aqui) ou "registro" (logo depois de virar o
     registro, antes de guardar a nova no cadeado) */
  const reaprovarNoMeio = (p, quando, pinNovo) => p.evaluate((o) => {
    const rest = Conta.rest.bind(Conta);
    Conta.rest = async function (metodo, caminho, corpo) {
      const r = await rest.apply(Conta, arguments);
      const alvo = o.quando === 'giro' ? metodo === 'POST' && corpo && corpo.colecao === 'settings' && corpo.id === 'giro' : metodo === 'PATCH' && /colecao=eq\.settings&id=eq\.cofre/.test(caminho);
      if (alvo && Giro.rodando && !window.__reap) {
        window.__reap = 1;
        const x = await Cofre._pinRaw(o.pin), duk = await Cofre.aes(x.raw); x.raw.fill(0);
        const pk = await Cofre.decifrar(duk, (await Cofre.local()).sk);
        const m = await Cofre.montar(pk, null, o.novo, 'aparelho', 'ap-novo-de-mentira', null); if (m.raw) m.raw.fill(0);
        window.__reapOk = !!m.ok;
      }
      return r;
    };
  }, { pin: PIN_A, novo: pinNovo, quando });
  /* o cadeado deste aparelho abre inteiro com o PIN dado? (a entrada da família, as velhas e o prox) */
  const cadeadoAbre = (p, pin) => p.evaluate(async (pin) => {
    const x = await Cofre._pinRaw(pin); if (!x || !x.raw) return { pin: false };
    const duk = await Cofre.aes(x.raw); x.raw.fill(0);
    const f = (await Cofre.local()).fam[S.family.id], ok = async (v) => { try { (await Cofre.decifrar(duk, v)).fill(0); return true; } catch (e) { return false; } };
    return { pin: true, fam: await ok(f), velhas: (await Promise.all((f.velhas || []).map(ok))).every(Boolean), prox: f.prox ? await ok(f.prox) : null, fk: f.fk };
  }, pin);
  for (const quando of ['registro', 'giro']) {
    await parte(quando === 'registro' ? 'G7f' : 'G7f2', 'C8: aprovado de novo pela conta (outro PIN) bem ' + (quando === 'registro' ? 'depois de virar o registro' : 'depois de a troca nascer') + ': a troca pausa sem gravar no cadeado novo com a chave de antes do aparelho; "Continuar" termina com a MESMA nova e o cadeado abre inteiro pelo PIN novo', async (novo) => {
      const A = await novo('G7f-' + quando, { vp: 'celular' }), a = A.p, PIN_NOVO = '918273';
      await abertoComVelha(a, ANA, PIN_A);
      /* um aparelho com lugar na lista da conta (2.26+): a aprovação de novo dá outro lugar a ele */
      await a.evaluate(() => Cofre.mudarLocal(null, (L) => { L.ap = 'ap-antigo-de-mentira'; return L; }));
      await reaprovarNoMeio(a, quando, PIN_NOVO);
      const r1 = await girar(a), g1 = linha('settings', 'giro').dados, fkN = g1.para.fk, c1 = await cadeadoAbre(a, PIN_NOVO);
      conferir(await a.evaluate(() => window.__reapOk) === true && !r1.ok && r1.motivo === 'trancou' && c1.fam && c1.velhas && c1.prox !== false && c1.fk === FK0,
        'G7f. ' + quando + ': aprovado de novo no meio, a troca pausa ("Parou porque as Senhas fecharam…") e o cadeado novo fica inteiro (nada gravado nele com a chave de antes do aparelho) (' + JSON.stringify([r1.motivo, g1.estado, c1]) + ')');
      const apNovo = await a.evaluate(async () => (await Cofre.local()).ap);
      const r2 = await girar(a, {}), gd = linha('settings', 'giro').dados;
      await a.evaluate(() => Trava.trancar());
      const ra = await abrirPeloPin(a, PIN_NOVO), c2 = await cadeadoAbre(a, PIN_NOVO), fk = await a.evaluate(() => Cofre.fk), t = await titulos(a);
      conferir(r2.ok && gd.estado === 'feito' && gd.para.fk === fkN && comFk(fkN).length === 6 && regBanco().fk === fkN && ra.ok && fk === fkN && c2.fam && c2.velhas && c2.fk === fkN && ITENS.every((x, i) => t['v' + i] === x[1]),
        'G7f. ' + quando + ': "Continuar" direto, mesmo com outro lugar na lista da conta (' + apNovo + '), termina com a MESMA nova (vinda da família) e o aparelho abre pelo PIN novo com ela, mostrando os 6 (' + JSON.stringify([r2.erro || 'ok', c2]) + ')');
    });
  }

  /* ================= C8 (etapa E6): "Começar do zero" no meio da troca ================= */
  await parte('C8', 'C8: com a troca deste chefe pela metade, "Começar do zero" não aparece (a explicação no lugar) e não roda; a de outro chefe não impede', async (novo) => {
    const A = await novo('C8-ana', { vp: 'computador' }), a = A.p;
    await abertoComVelha(a, ANA, PIN_A);
    await vigiarAvisos(a);
    await a.evaluate(() => Trava.trancar());
    /* o "beco" (nenhum outro jeito de usar as Senhas aqui): só aí o "Começar do zero" aparece */
    const beco = { rede: true, outros: 0, temKit: false, pkConta: false, familiaPode: false, guardiao: true, ligado: true, prf: false, bloqueado: false };
    const ver = () => a.evaluate((st) => { const h = TelaConta.avHtml(st, null, false); return { pode: TelaConta.podeZero(st), bt: /data-act="conta\.zero"/.test(h), txt: /Termine antes a troca de segurança/.test(h) }; }, beco);
    const z0 = await ver();
    gravarDoc('settings', 'giro', { vis: 'restrito', dados: trocaNoBanco({}) }, ANA);
    await a.evaluate(() => CloudDriver.pull());
    const z1 = await ver(), zr = await a.evaluate(() => TelaConta.comecarDoZero());
    conferir(z0.pode && z0.bt && !z0.txt && !z1.pode && !z1.bt && z1.txt && zr === false && /Termine antes a troca de segurança num aparelho seu/.test(await avisos(a)),
      'C8. com a troca dela pela metade: "Começar do zero" sai do Avançado (a explicação no lugar) e não roda (' + JSON.stringify([z0, z1]) + ')');
    gravarDoc('settings', 'giro', { vis: 'restrito', dados: trocaNoBanco({ por: BIA }) }, BIA);
    await a.evaluate(() => CloudDriver.pull());
    const z2 = await ver();
    conferir(z2.pode && z2.bt && !z2.txt, 'C8. uma troca de outra pessoa não muda o "Começar do zero" desta (' + JSON.stringify(z2) + ')');
  });

  /* ================= C16 (etapa E6): a troca esquecida no "preparado" ================= */
  await parte('C16', 'C16: uma troca que nasceu e não passou do "preparado" há mais de 24 h vale como desistida (não trava ninguém) e a próxima nasce por cima; com menos, ainda trava', async (novo) => {
    const A = await novo('C16-ana', { vp: 'celular' }), a = A.p;
    await abertoComVelha(a, ANA, PIN_A);
    const g = gravarDoc('settings', 'giro', { vis: 'restrito', dados: trocaNoBanco({ estado: 'preparado', para: { kv: 2, fk: 'fk-esquecida' } }) }, ANA);
    const ver = () => a.evaluate(async () => { const b = await Giro.ler(); return { em: Giro.emCurso(b.giro), p: (await Giro.pode()).motivo }; });
    g.atualizado_em = new Date(Date.now() - 23 * 3600e3).toISOString();
    const p1 = await ver();
    conferir(p1.em && p1.p === 'trocando', 'C16. com 23 h sem notícia, a troca ainda vale (trava: "Já está trocando…") (' + JSON.stringify(p1) + ')');
    const semData = await a.evaluate(() => Giro.emCurso({ vis: 'restrito', dados: { v: 1, estado: 'preparado' }, apagado_em: null }));
    conferir(semData === true, 'C16. uma troca "preparado" sem data conhecida nunca vale como esquecida (continua travando)');
    g.atualizado_em = new Date(Date.now() - 25 * 3600e3).toISOString();
    const p2 = await ver(), r = await girar(a), gd = linha('settings', 'giro').dados;
    conferir(!p2.em && p2.p === undefined && r.ok && gd.estado === 'feito' && gd.para.fk !== 'fk-esquecida' && gd.para.kv === 3 && comFk(gd.para.fk).length === 6,
      'C16. com 25 h: vale como desistida, e a próxima troca nasce por cima, com a versão seguinte à dela (kv 3) (' + JSON.stringify([p2, r.erro, gd.para]) + ')');
  });

  /* ================= AR (etapa E6): os anexos de um aparelho que adotou ================= */
  await parte('AR', 'Depois de adotar a nova (a troca foi em outro aparelho), os anexos guardados só neste aparelho passam para a nova, como trabalho do Fundo ("Arrumando os anexos deste aparelho"); o que não é da família fica', async (novo) => {
    const A = await novo('AR-ana-celular', { vp: 'celular' }), a = A.p;
    const B = await novo('AR-ana-computador', { vp: 'computador' }), b = B.p;
    await abertoComVelha(a, ANA, PIN_A);
    await abertoComVelha(b, ANA, PIN_A);
    const ids = ['fARfam', 'fARsemfk', 'fARlocal'];
    await anexar(b, [['fARfam', 'familia'], ['fARsemfk', 'semfk'], ['fARlocal', 'outro']]);
    const an0 = await anexosDe(b, ids);
    await b.evaluate(() => { window.__fuEv = []; DGO.fundo.aoMudar((ev, t) => { if (t.tipo === 'chave-familia') window.__fuEv.push(ev + ':' + t.titulo); }); });
    const r = await girar(a), fkN = linha('settings', 'giro').dados.para.fk, n = await chaveDaPessoa(ANA);
    await b.evaluate(() => Cloud.poll());
    const adotou = await esperar(b, (fk) => Cofre.fk === fk, fkN, 20000);
    const arrumou = await esperar(b, () => (window.__fuEv || []).some((x) => x === 'feito:Arrumando os anexos deste aparelho'), null, 20000);
    const an = await anexosDe(b, ids);
    let ok = 0; for (const id of ['fARfam', 'fARsemfk']) if (an[id].enc.fk === fkN && !an[id].enc.antes && an[id].txt === 'anexo ' + id && (await abreBlob(n.raw, an[id].enc.iv, an[id].bytes)) && !(await abreBlob(VELHA, an[id].enc.iv, an[id].bytes))) ok++;
    conferir(r.ok && adotou && arrumou && ok === 2, 'AR. o outro aparelho adota e arruma os anexos dele no Fundo: os da família (com e sem enc.fk) na nova, abrem, e a de antes não abre (' + JSON.stringify([adotou, arrumou, ok, await b.evaluate(() => window.__fuEv)]) + ')');
    conferir(JSON.stringify(an.fARlocal) === JSON.stringify(an0.fARlocal), 'AR. o anexo que não é da família ficou como estava');
  });

  /* ================= G4a (etapa E7): o código de emergência continua valendo (digitado na confirmação) ================= */
  await parte('G4a', 'Com o código de emergência de agora (digitado ao confirmar), ele continua valendo: o MESMO código passa a abrir a chave nova; o contato com o acesso liberado abre com o papel que já tem; o código nunca fica guardado', async (novo) => {
    db.omni_cofre_liberado.push({ grupo_id: GID, user_id: DAVI, liberado_em: agora() });
    const A = await novo('G4a-ana', { vp: 'computador' }), a = A.p;
    const E = await novo('G4a-davi', { vp: 'celular' }), e = E.p;
    await abertoComVelha(a, ANA, PIN_A);
    await emergenciaPronta(e);
    const em0 = JSON.parse(linha('vault', '_em').dados_cifrado), hist0 = db.omni_historico.length;
    /* o código digitado com outra cara (minúsculas, espaços no lugar dos traços): a mesma limpeza do abrir pelo código */
    const digitado = CODIGO_EM.toLowerCase().replace(/-/g, ' ');
    await a.evaluate(() => { const o = Giro.virar; window.__opNoVirar = null; Giro.virar = async function (ctx) { window.__opNoVirar = Object.keys(ctx.op); return o.apply(this, arguments); }; });
    const marca = M.log.length;
    const r = await a.evaluate(async (cod) => {
      window.__op = { novo: true, codigoEm: cod };
      try { const r = await Giro.executar(() => {}, {}, window.__op); return { ok: true, r: JSON.parse(JSON.stringify(r)), op: Object.keys(window.__op) }; } catch (er) { return { erro: er.message, op: Object.keys(window.__op) }; }
    }, digitado);
    const gd = linha('settings', 'giro').dados, fkN = gd.para && gd.para.fk, n = await chaveDaPessoa(ANA), l = linha('vault', '_em');
    const o = l && l.dados_cifrado ? JSON.parse(l.dados_cifrado) : null, em = o && o.d && o.d.em;
    let aberto = null; try { aberto = await decifrar(await kdf(CODIGO_EM, em.sal), em); } catch (er) {}
    conferir(r.ok && r.r.em === 'refeito' && gd.em === 'refeito' && gd.estado === 'feito' && l && !l.apagado_em && em && em.fk === fkN && em.kv === 2 && em.sal !== em0.d.em.sal && aberto && igual(aberto, n.raw),
      'G4a. o código de emergência continua valendo: o envelope agora guarda a chave nova (fk novo, kv 2, sal novo) e abre com o MESMO código (' + JSON.stringify([r.erro || (r.r && r.r.em), gd.em, em && em.fk === fkN]) + ')');
    conferir(o && o.em === 1 && o.d.at === em0.d.at && o.d.vis === 'restrito' && Object.keys(o.d).sort().join() === 'at,em,vis' && !(await abre(async () => decifrar(await kdf('ZZZZ-ZZZZ-ZZZZ-ZZZZ', em.sal), em))),
      'G4a. o envelope no formato de sempre ({em:1, d:{em, at, vis}}); outro código não abre');
    const pe = M.log.slice(marca).filter((x) => x.metodo === 'PATCH' && /colecao=eq\.vault&id=eq\._em/.test(x.caminho));
    conferir(pe.length === 1 && /versao=eq\.\d+/.test(pe[0].caminho) && Object.keys(pe[0].corpo).join() === 'dados_cifrado' && !db.omni_historico.slice(hist0).some((h) => h.acao === 'emergencia.invalidada'),
      'G4a. uma gravação só, com a versão lida (CAS) e só o texto; nada de "deixou de valer" no histórico');
    conferir(r.ok && JSON.stringify(r.op) === '["novo"]' && JSON.stringify(await a.evaluate(() => window.__opNoVirar)) === '["novo"]',
      'C16. o código digitado sai da memória da troca logo depois do código de emergência (já não estava lá ao virar; o "Tentar de novo" do Fundo guarda o op)');
    /* o código nunca vai para lugar nenhum: o aparelho, o banco, o histórico, a troca, o console */
    const formas = [CODIGO_EM, digitado, CODIGO_EM.replace(/-/g, '')], vazou = [];
    const st = await a.evaluate(() => { const o = []; for (const s of [localStorage, sessionStorage]) for (let i = 0; i < s.length; i++) o.push(s.key(i) + '=' + s.getItem(s.key(i))); return o.join('\n'); });
    if (formas.some((f) => st.includes(f))) vazou.push('aparelho');
    if (formas.some((f) => JSON.stringify(M.log.slice(marca)).includes(f))) vazou.push('pedidos ao banco');
    if (formas.some((f) => JSON.stringify(db.omni_docs).includes(f) || JSON.stringify(db.omni_historico).includes(f))) vazou.push('banco');
    if (A.lixo.console.some((t) => formas.some((f) => t.includes(f)))) vazou.push('console');
    conferir(!vazou.length, 'G4a. o código de emergência nunca em localStorage, sessionStorage, nos pedidos ao banco, no banco (troca, histórico) nem no console (' + vazou.join() + ')');
    /* o contato de emergência (acesso liberado) abre com o MESMO código, que agora abre a chave nova */
    await e.evaluate(() => Cloud.poll());
    const chegou = await esperar(e, (fk) => { const v = DB.col('vault').get('_em'); return !!(v && v.em && v.em.fk === fk); }, fkN, 20000);
    const rE = await codigoPelaTela(e, CODIGO_EM), tE = await naTela(e);
    conferir(chegou && rE.aberto && rE.fk === fkN && ITENS.every((x) => tE.includes(x[1])) && /Senhas da casa abertas/.test(rE.avisos),
      'G4a. o contato de emergência abre as Senhas da casa com o MESMO código e vê os 6 itens (já com a chave nova) (' + JSON.stringify([chegou, rE, tE]) + ')');
  });

  /* ================= G4b (etapa E7): sem o código, ele deixa de valer; "Fazer o código novo" ================= */
  await parte('G4b', 'Sem o código de emergência: ele deixa de valer (apagado e sem o conteúdo); o chefe vê "Falta um passo" com "Fazer o código novo"; o contato com o código velho ouve que não há código que valha; o código novo abre', async (novo) => {
    db.omni_cofre_liberado.push({ grupo_id: GID, user_id: DAVI, liberado_em: agora() });
    const A = await novo('G4b-ana', { vp: 'celular' }), a = A.p;
    const E = await novo('G4b-davi', { vp: 'celular' }), e = E.p;
    await abertoComVelha(a, ANA, PIN_A);
    await emergenciaPronta(e);
    conferir(!(await a.$('#emFalta')), 'G4b. antes da troca, nenhum "Falta um passo"');
    const r = await girar(a);
    const gd = linha('settings', 'giro').dados, fkN = gd.para.fk, l = linha('vault', '_em');
    conferir(r.ok && r.r.em === 'invalidado' && gd.em === 'invalidado' && !!l.apagado_em && l.dados_cifrado === null && db.omni_historico.some((h) => h.acao === 'emergencia.invalidada'),
      'G4b. sem o código: o código de emergência deixa de valer — apagado e sem o conteúdo (e o histórico avisa os chefes)');
    await a.evaluate(() => render()); await espere(300);
    const card = await a.evaluate(() => { const x = document.querySelector('#emFalta'); return x ? x.innerText.replace(/\s+/g, ' ').trim() : ''; });
    conferir(/Falta um passo: faça o código de emergência novo/.test(card) && /O código antigo não vale mais/.test(card) && !!(await a.$('#emFalta [data-act="gov.env"]')) && /Fazer o código novo/.test(card),
      'G4b. o chefe vê "🆘 Falta um passo…" com o botão "🆘 Fazer o código novo" (' + card + ')');
    /* o contato com o código velho */
    await e.evaluate(() => Cloud.poll());
    const sumiu = await esperar(e, () => !DB.col('vault').get('_em'), null, 20000);
    const r1 = await codigoPelaTela(e, CODIGO_EM);
    conferir(sumiu && !r1.janela && !r1.aberto && /Ainda não há um código de emergência que valha\. Peça o código a um chefe da família\./.test(r1.avisos),
      'G4b. o contato com o código velho: "Ainda não há um código de emergência que valha. Peça o código a um chefe da família." (nem pede o código) (' + JSON.stringify(r1) + ')');
    /* o chefe faz o código novo pelo cartão */
    await a.click('#emFalta [data-act="gov.env"]');
    await a.waitForSelector('.modal [data-yes]', { timeout: 5000 }); await a.click('.modal [data-yes]');
    await a.waitForSelector('.modal .codebig', { timeout: 15000 });
    const novoCod = await a.evaluate(() => document.querySelector('.modal .codebig').textContent.trim());
    await a.click('.modal:has(.codebig) [data-x]').catch(() => {});
    const subiu = await ate(() => { const x = linha('vault', '_em'); try { return !x.apagado_em && JSON.parse(x.dados_cifrado).d.em.fk === fkN; } catch (er) { return false; } }, 15000);
    const em = subiu ? JSON.parse(linha('vault', '_em').dados_cifrado).d.em : null, n = await chaveDaPessoa(ANA);
    let ab = null; try { ab = await decifrar(await kdf(novoCod, em.sal), em); } catch (er) {}
    await a.evaluate(() => render()); await espere(300);
    conferir(subiu && ab && igual(ab, n.raw) && novoCod !== CODIGO_EM && !(await a.$('#emFalta')),
      'G4b. "Fazer o código novo": o código novo guarda a chave nova e o "Falta um passo" some');
    await e.evaluate(() => Cloud.poll());
    await esperar(e, (fk) => { const v = DB.col('vault').get('_em'); return !!(v && v.em && v.em.fk === fk); }, fkN, 20000);
    const r2 = await codigoPelaTela(e, CODIGO_EM);
    conferir(r2.janela && !r2.aberto && /Código incorreto/.test(r2.avisos), 'G4b. o código velho não abre mais (' + r2.avisos + ')');
    const r3 = await codigoPelaTela(e, novoCod), tE = r3.aberto ? await naTela(e) : [];
    conferir(r3.aberto && r3.fk === fkN && ITENS.every((x) => tE.includes(x[1])), 'G4b. o código novo abre (com a chave nova) e o contato vê os 6 itens (' + JSON.stringify([r3, tE]) + ')');
  });

  /* ================= G4c (etapa E7): código errado = como sem código ================= */
  await parte('G4c', 'Um código de emergência errado na troca vale como sem código: ele deixa de valer (nada é refeito com um código que não é o dele)', async (novo) => {
    const A = await novo('G4c-ana', { vp: 'celular' }), a = A.p;
    await abertoComVelha(a, ANA, PIN_A);
    /* o conferirCodigo só confere: não abre as Senhas da casa, e só vale com o envelope da chave pedida */
    const emOutra = JSON.parse(await envelopeEm(CODIGO_EM, new Uint8Array(crypto.randomBytes(32)), 1, 'fk-outra')).d.em;
    await contarUsar(a);
    const cc = await a.evaluate(async ([cod, emOutra]) => {
      const antes = [Cofre.fk, Cofre.kv, Cofre.outras.length].join();
      const certo = await Cofre.conferirCodigo(cod), errado = await Cofre.conferirCodigo('AAAA-BBBB-CCCC-DDDD'), outra = await Cofre.conferirCodigo(cod, emOutra), outraCerta = await Cofre.conferirCodigo(cod, emOutra, 'fk-outra');
      const r = { certo: !!certo && certo.length === 32, errado, outra, outraCerta: !!outraCerta, igual: [Cofre.fk, Cofre.kv, Cofre.outras.length].join() === antes, usar: window.__usar };
      if (certo) certo.fill(0); if (outraCerta) outraCerta.fill(0); return r;
    }, [CODIGO_EM, emOutra]);
    conferir(cc.certo && cc.errado === null && cc.outra === null && cc.outraCerta && cc.igual && cc.usar === 0,
      'G4c. Cofre.conferirCodigo só confere: o código certo abre o envelope daqui, o errado não; o envelope de outra chave só vale pedindo aquela chave; nada é aberto nas Senhas (' + JSON.stringify(cc) + ')');
    const r = await girar(a, { novo: true, codigoEm: 'AAAA-BBBB-CCCC-DDDD' }), l = linha('vault', '_em');
    conferir(r.ok && r.r.em === 'invalidado' && !!l.apagado_em && l.dados_cifrado === null, 'G4c. código errado: o código de emergência deixa de valer (apagado e sem o conteúdo) (' + JSON.stringify(r.erro || r.r.em) + ')');
  });

  /* ================= G4r (etapa E7): recarregou antes do código; o "Continuar" pede de novo ================= */
  await parte('G4r', 'O app recarrega antes do código de emergência (o código só vivia na memória): o cartão "Continuar" pede o código de novo (opcional); um código errado não continua; o certo faz ele continuar valendo', async (novo) => {
    const A = await novo('G4r-ana', { vp: 'celular' }), a = A.p;
    await abertoComVelha(a, ANA, PIN_A);
    a.removeAllListeners('dialog');
    a.on('dialog', (d) => { if (d.type() === 'beforeunload') d.accept().catch(() => {}); else { A.lixo.nativos.push(d.type() + ': ' + d.message()); d.dismiss().catch(() => {}); } });
    let recarregou = null;
    M.depoisDe = { 'PATCH vault': 3, acao: () => { recarregou = a.reload().catch(() => {}); } };
    await a.evaluate(() => { Giro.PAUSA_MS = 200; go('house', 'vault'); });
    await pelaPilula(a, { novo: true, codigoEm: CODIGO_EM });
    await ate(() => recarregou, 20000); await recarregou;
    await a.waitForFunction(() => typeof S !== 'undefined' && S.booted && S.mode === 'cloud' && S.family, null, { timeout: 30000 });
    await espere(800); await quieto(a); await senhasDaCasa(a);
    const ra = await abrirPeloPin(a, PIN_A);
    /* a pílula "foi interrompido" com as Senhas já abertas: "Continuar de onde parou" não segue sozinha (o código não está mais
       na memória): leva ao cartão, que pede o código */
    await vigiarAvisos(a);
    const bt = await a.waitForSelector('.dgo-tarefa button[aria-label="Continuar de onde parou"]', { timeout: 10000 }).then(() => true, () => false);
    if (bt) await a.click('.dgo-tarefa button[aria-label="Continuar de onde parou"]');
    await espere(1200);
    const parado = await a.evaluate(() => !Giro.rodando) && linha('settings', 'giro').dados.estado === 'recifrando';
    await esperar(a, () => !!document.querySelector('#giroCartao #giroCodigo'), null, 8000);
    const c = await cartaoGiro(a), gd0 = linha('settings', 'giro').dados;
    conferir(ra.ok && bt && parado && gd0.estado === 'recifrando' && /A troca ficou pela metade/.test(await avisos(a)) && /Código de emergência atual \(opcional\)/.test(c) && /ele continua valendo/.test(c) && !!(await a.$('#giroCartao [data-act="conta.giro.continuar"]')),
      'G4r. recarregou no meio: "Continuar de onde parou" não segue sozinha; o cartão "Continuar" pede o código de emergência de novo, opcional (' + JSON.stringify([bt, parado]) + ' ' + c + ')');
    await a.evaluate(() => { window.__av = []; Giro.PAUSA_MS = 0; });
    const marca = M.log.length;
    await a.fill('#giroCodigo', 'AAAA-BBBB-CCCC-DDDD'); await a.click('#giroCartao [data-act="conta.giro.continuar"]');
    await espere(1500);
    conferir(/Esse código de emergência não confere/.test(await avisos(a)) && linha('settings', 'giro').dados.estado === 'recifrando' && !M.log.slice(marca).some((x) => x.metodo === 'PATCH') && await a.evaluate(() => !Giro.rodando && document.querySelector('#giroCodigo').value === ''),
      'G4r. um código errado: "Esse código de emergência não confere…", nada continua (nenhuma gravação) e o campo fica vazio');
    await a.fill('#giroCodigo', CODIGO_EM); await a.click('#giroCartao [data-act="conta.giro.continuar"]');
    const fim = await ateA(async () => linha('settings', 'giro').dados.estado === 'feito', 30000);
    const gd = linha('settings', 'giro').dados, l = linha('vault', '_em'), em = JSON.parse(l.dados_cifrado).d.em, n = await chaveDaPessoa(ANA);
    let ab = null; try { ab = await decifrar(await kdf(CODIGO_EM, em.sal), em); } catch (er) {}
    conferir(fim && gd.em === 'refeito' && em.fk === gd.para.fk && ab && igual(ab, n.raw), 'G4r. com o código certo, a troca termina e ele continua valendo (abre a chave nova)');
  });

  /* ================= G4j (etapa E7): já refeito antes de parar ================= */
  await parte('G4j', 'O app para logo depois de refazer o código de emergência (antes de anotar): "Continuar" não pede o código e não mexe nele de novo ("já refeito")', async (novo) => {
    const A = await novo('G4j-ana', { vp: 'celular' }), a = A.p;
    await abertoComVelha(a, ANA, PIN_A);
    await a.evaluate(() => { const o = Giro.emergencia; window.__f3 = null; Giro.emergencia = async function () { const r = await o.apply(this, arguments); window.__f3 = r; return new Promise(() => {}); }; });
    await comecar(a, { novo: true, codigoEm: CODIGO_EM });
    await esperar(a, () => !!window.__f3, null, 20000);
    const f3 = await a.evaluate(() => window.__f3), l0 = JSON.stringify(linha('vault', '_em'));
    await a.reload().catch(() => {});
    await a.waitForFunction(() => typeof S !== 'undefined' && S.booted && S.mode === 'cloud' && S.family, null, { timeout: 30000 });
    await espere(800); await quieto(a); await senhasDaCasa(a);
    const ra = await abrirPeloPin(a, PIN_A);
    await esperar(a, () => !!document.querySelector('#giroCartao [data-act="conta.giro.continuar"]'), null, 8000);
    const semCampo = !(await a.$('#giroCodigo')), est = linha('settings', 'giro').dados.estado;
    const marca = M.log.length;
    await a.click('#giroCartao [data-act="conta.giro.continuar"]');
    const fim = await ateA(async () => linha('settings', 'giro').dados.estado === 'feito', 30000);
    const pe = M.log.slice(marca).filter((x) => x.metodo === 'PATCH' && /id=eq\._em/.test(x.caminho));
    conferir(f3 === 'refeito' && est === 'emergencia' && ra.ok && semCampo && fim && linha('settings', 'giro').dados.em === 'refeito' && JSON.stringify(linha('vault', '_em')) === l0 && !pe.length,
      'G4j. parou com o código já refeito: "Continuar" não pede o código, não mexe nele de novo e termina com "refeito" (' + JSON.stringify([f3, est, semCampo, fim, pe.length]) + ')');
  });

  /* ================= G4k (etapa E7, C16): continuar depois do passo do código com um código na memória ================= */
  await parte('G4k', 'C16: continuar uma troca que já passou do código de emergência com um código na memória (o "Tentar de novo" guarda o op): no fim, o código não fica no op', async (novo) => {
    const A = await novo('G4k-ana', { vp: 'celular' }), a = A.p;
    await abertoComVelha(a, ANA, PIN_A);
    await a.evaluate(() => { const o = Giro.virar; window.__vira = false; Giro.virar = async function () { window.__vira = true; return new Promise(() => {}); }; window.__virarDeVerdade = o; });
    await comecar(a, { novo: true });
    await esperar(a, () => window.__vira, null, 20000);
    await a.reload().catch(() => {});
    await a.waitForFunction(() => typeof S !== 'undefined' && S.booted && S.mode === 'cloud' && S.family, null, { timeout: 30000 });
    await espere(800); await quieto(a); await senhasDaCasa(a);
    const ra = await abrirPeloPin(a, PIN_A), est = linha('settings', 'giro').dados.estado;
    const r = await a.evaluate(async (cod) => { window.__op = { codigoEm: cod }; try { await Giro.executar(() => {}, {}, window.__op); return { ok: true, op: Object.keys(window.__op) }; } catch (e) { return { erro: e.message, op: Object.keys(window.__op) }; } }, CODIGO_EM);
    conferir(ra.ok && est === 'virando' && r.ok && JSON.stringify(r.op) === '[]' && linha('settings', 'giro').dados.estado === 'feito',
      'C16. a troca continuou de depois do código de emergência: termina, e o código não fica no op (' + JSON.stringify([est, r]) + ')');
  });

  /* ================= G4f (etapa E7, pendência da E4): um código feito com a chave de antes esperando na fila ================= */
  await parte('G4f', 'Um código de emergência feito sem internet com a chave de antes nunca sobe; depois de adotar a nova, o chefe vê "Falta um passo" e "Fazer o código novo" sobe já com a nova, por cima, sem item a mais', async (novo) => {
    const B = await novo('G4f-ana-computador', { vp: 'computador' }), b = B.p;
    await abertoComVelha(b, ANA, PIN_A);
    await semRede(B.ctx, true);
    const fe = await b.evaluate(async () => { const cod = await Cofre.envelope(); for (let i = 0; i < 30 && !CloudDriver.fila.has('vault|_em'); i++) await new Promise((r) => setTimeout(r, 100)); return !!cod && CloudDriver.fila.has('vault|_em') && DB.col('vault').get('_em').em.fk; });
    const nova = await trocaAMao();
    const em1 = JSON.stringify(linha('vault', '_em')), ids0 = idsVault();
    await semRede(B.ctx, false);
    await b.evaluate(() => Cloud.poll());
    const adotou = await esperar(b, (fk) => Cofre.fk === fk && !Cofre._conf, FKN, 20000);
    await subir(b); await b.evaluate(() => render()); await espere(400);
    const card = await b.evaluate(() => { const x = document.querySelector('#emFalta'); return x ? x.innerText.replace(/\s+/g, ' ').trim() : ''; });
    conferir(fe === FK0 && adotou && JSON.stringify(linha('vault', '_em')) === em1 && await b.evaluate(() => CloudDriver.fila.has('vault|_em')) && /Falta um passo/.test(card),
      'G4f. o código feito sem internet com a de antes não sobe (o do banco fica); o chefe vê "Falta um passo" (' + card + ')');
    await b.click('#emFalta [data-act="gov.env"]');
    await b.waitForSelector('.modal [data-yes]', { timeout: 5000 }); await b.click('.modal [data-yes]');
    await b.waitForSelector('.modal .codebig', { timeout: 15000 });
    const novoCod = await b.evaluate(() => document.querySelector('.modal .codebig').textContent.trim());
    await b.click('.modal:has(.codebig) [data-x]').catch(() => {});
    const subiu = await ate(() => { try { return JSON.parse(linha('vault', '_em').dados_cifrado).d.em.sal !== JSON.parse(JSON.parse(em1).dados_cifrado).d.em.sal; } catch (er) { return false; } }, 15000);
    await subir(b); await espere(500);
    const em = JSON.parse(linha('vault', '_em').dados_cifrado).d.em;
    let ab = null; try { ab = await decifrar(await kdf(novoCod, em.sal), em); } catch (er) {}
    await b.evaluate(() => render()); await espere(300);
    conferir(subiu && em.fk === FKN && ab && igual(ab, nova) && idsVault() === ids0 && await b.evaluate(() => !CloudDriver.fila.has('vault|_em')) && !(await b.$('#emFalta')),
      'G4f. "Fazer o código novo" sobe já, com a nova, por cima do de antes (o mais novo vale), sem item a mais; o "Falta um passo" some (' + JSON.stringify([subiu, em.fk, !!ab, idsVault()]) + ')');
  });

  /* ================= G4o (etapa E7): dois códigos de emergência ao mesmo tempo ================= */
  await parte('G4o', 'Dois códigos de emergência feitos ao mesmo tempo (um sem internet): vale o feito por último — o de antes nunca passa por cima do mais novo, e nenhum vira um item a mais', async (novo) => {
    const B = await novo('G4o-ana-computador', { vp: 'computador' }), b = B.p;
    await abertoComVelha(b, ANA, PIN_A);
    await semRede(B.ctx, true);
    const feito = await b.evaluate(async () => { const cod = await Cofre.envelope(); for (let i = 0; i < 30 && !CloudDriver.fila.has('vault|_em'); i++) await new Promise((r) => setTimeout(r, 100)); return !!cod && CloudDriver.fila.has('vault|_em'); });
    await espere(50);
    /* outro chefe faz um código depois, com internet */
    gravarDoc('vault', '_em', { dados_cifrado: await envelopeEm('YYYY-YYYY-YYYY-YYYY', VELHA, 1, FK0) }, BIA);
    const l1 = JSON.stringify(linha('vault', '_em')), ids0 = idsVault();
    await vigiarAvisos(b);
    await semRede(B.ctx, false);
    await subir(b, false, null); await espere(600);
    const local = await b.evaluate(() => { const v = DB.col('vault').get('_em'); return v && v.em && v.em.sal; });
    conferir(feito && JSON.stringify(linha('vault', '_em')) === l1 && idsVault() === ids0 && local === JSON.parse(JSON.parse(l1).dados_cifrado).d.em.sal && await b.evaluate(() => !CloudDriver.fila.has('vault|_em')) && /mais novo: vale o dele/.test(await avisos(b)),
      'G4o. o código feito antes, sem internet, não passa por cima do mais novo do outro chefe: fica o dele (também neste aparelho), sem item a mais, e um aviso diz isso');
  });

  /* ================= G13 (etapa E8): a ponte Saúde → MoneyTRIO ================= */
  await parte('G13', 'A ponte Saúde → MoneyTRIO: antes, os avisos que esperam o MoneyTRIO aparecem (a tabela, não a caixa); durante a troca nada vai (fica pendente, nos dois aparelhos); no fim, os resumos velhos do Omni saem da fila do MoneyTRIO ANTES do "feito" e o resumo vai de novo com a nova', async (novo) => {
    const A = await novo('G13-ana', { vp: 'computador' }), a = A.p;
    const C = await novo('G13-bia', { vp: 'celular' }), c = C.p;
    db.sol_ponte.push(msgPonte('pA', ANA), msgPonte('pB', BIA), msgPonte('pLida', ANA, { lido_em: '2026-11-01T12:00:00.000Z', lido_por: BIA }),
      msgPonte('pTipo', ANA, { tipo: 'outra-coisa', dados: { v: 1 } }), msgPonte('pMT', ANA, { de_app: 'moneytrio', para_app: 'omnilife-one', dados: { v: 1 } }));
    const fixos0 = JSON.stringify(['pLida', 'pTipo', 'pMT'].map(ponteDe));
    await abertoComVelha(a, ANA, PIN_A);
    await abertoComVelha(c, BIA, PIN_B);
    await ligarSaude(a);
    await c.evaluate(() => Cloud.poll()); await esperar(c, () => SaudeMT.ligado(), null, 15000);
    /* antes: quantos esperam o MoneyTRIO — também os de quem desligou a ponte (a caixa do banco os esconderia: C10) */
    const p0 = await a.evaluate(async () => { const p = await Giro.pode(); return { ok: p.ok, ponte: p.ponte, rest: await Giro.pontePendentes() }; });
    db.sol_ponte_config.push({ user_id: ANA, de_app: 'omnilife-one', para_app: 'moneytrio', ligado: false });
    const p1 = await a.evaluate(async () => ({ caixa: (await Conta.rpc('sol_ponte_minha_caixa', { p_app: 'moneytrio', p_so_nao_lidas: true, p_limite: 500 })).length, rest: await Giro.pontePendentes() }));
    db.sol_ponte_config.splice(0, db.sol_ponte_config.length);
    conferir(p0.ok && p0.ponte === 2 && p0.rest === 2 && p1.caixa === 0 && p1.rest === 2,
      'G13. antes: 2 avisos da Saúde esperando o MoneyTRIO (pela situação e pela tabela); com a ponte desligada, a caixa do banco esconde e a tabela não (C10) (' + JSON.stringify([p0, p1]) + ')');
    /* durante a troca: nada vai, nos dois aparelhos (fica pendente) */
    await a.evaluate(() => { Giro.PAUSA_MS = 300; });
    const marca = M.log.length;
    await comecar(a);
    await esperar(a, () => (window.__passos || []).some((t) => /^Senhas: 2 de/.test(t)), null, 20000);
    /* um aparelho já com a nova manda um resumo no meio (fica: o MoneyTRIO abre) */
    const fkNova = linha('settings', 'giro').dados.para.fk;
    db.sol_ponte.push(msgPonte('pNova', BIA, { dados: { v: 1, cif: JSON.stringify({ c: 1, kv: 2, fk: fkNova, iv: 'eA==', ct: 'eQ==' }) } }));
    const durA = await a.evaluate(async () => { SaudeMT.agendar(); const r = await SaudeMT.enviar(); return { r, pend: SaudeMT.pendente(), fk: Cofre.fk }; });
    const durC = await c.evaluate(async () => { SaudeMT.agendar(); const r = await SaudeMT.enviar(); return { r, pend: SaudeMT.pendente() }; });
    const nDur = db.sol_ponte.length;
    conferir(durA.r === false && durA.pend && durA.fk === FK0 && durC.r === false && durC.pend && nDur === 6,
      'G13. durante a troca, o resumo da Saúde não vai (nem do aparelho que troca, ainda com a de antes, nem do outro): fica pendente (' + JSON.stringify([durA, durC, nDur]) + ')');
    /* a conferência demora mais que o envio que o virar agenda (1,5 s depois do usarChave, ainda "conferindo"): ele não pode ir */
    await a.evaluate(() => { Giro.PAUSA_MS = 0; const o = Giro.conferir; Giro.conferir = async function () { await new Promise((x) => setTimeout(x, 2500)); return o.apply(this, arguments); }; });
    const r = await resultado(a, 40000);
    const gd = linha('settings', 'giro').dados, fkN = gd.para.fk, n = await chaveDaPessoa(ANA);
    await ate(() => db.sol_ponte.length > 6, 8000);
    const log = M.log.slice(marca);
    const iMarca = log.map((x, i) => (/sol_ponte_marcar_lido/.test(x.caminho) ? i : -1)).filter((i) => i >= 0);
    const iFeito = log.findIndex((x) => x.metodo === 'PATCH' && /id=eq\.giro/.test(x.caminho) && x.corpo && x.corpo.dados && x.corpo.dados.estado === 'feito');
    const iEnv = log.findIndex((x) => /sol_ponte_enviar/.test(x.caminho));
    conferir(r && r.ok && gd.estado === 'feito' && ponteDe('pA').lido_em && ponteDe('pA').lido_por === ANA && ponteDe('pB').lido_em && ponteDe('pB').lido_por === ANA && JSON.stringify(['pLida', 'pTipo', 'pMT'].map(ponteDe)) === fixos0 && !ponteDe('pNova').lido_em,
      'G13. no fim: os 2 resumos velhos do Omni (da Ana e da Bia) marcados como lidos; o já lido, o de outro tipo, o que veio do MoneyTRIO e o que já está na nova ficam como estavam');
    conferir(iMarca.length === 2 && iFeito > iMarca[1] && iEnv > iFeito, 'C10. a ordem: marca os velhos → "feito" → manda o resumo de novo (nada foi mandado antes, nem o que o virar agendou durante a conferência) (' + JSON.stringify([iMarca, iFeito, iEnv]) + ')');
    const nova = db.sol_ponte.filter((x) => !['pA', 'pB', 'pLida', 'pTipo', 'pMT', 'pNova'].includes(x.id)), o = nova[0] && JSON.parse(nova[0].dados.cif);
    let resumo = null; try { resumo = JSON.parse(new TextDecoder().decode(await decifrar(n.raw, o))); } catch (er) {}
    conferir(nova.length === 1 && nova[0].user_id === ANA && nova[0].tipo === 'saude-resumo' && !nova[0].lido_em && o.fk === fkN && o.kv === 2 && resumo && resumo.v === 1 && Array.isArray(resumo.pessoas) && !(await abre(() => decifrar(VELHA, o))),
      'G13. o resumo vai de novo, inteiro, com a chave nova (o MoneyTRIO, já com ela, abre; a de antes não)');
    conferir(situacao().ponte_outra === 0 && situacao().ponte_pendentes === 2 && await a.evaluate(() => !SaudeMT.pendente()), 'G13. sol_giro_situacao: ponte_outra 0 (o "Terminar a troca" não trava na ponte); nada pendente aqui');
    /* o outro aparelho adota e manda o que ficou pendente — com a nova */
    await c.evaluate(() => Cloud.poll());
    await esperar(c, (fk) => Cofre.fk === fk, fkN, 20000);
    const foi = await esperar(c, () => !SaudeMT.pendente(), null, 15000);
    const env = enviosDesde(marca);
    conferir(foi && env.length === 2 && env.every((x) => x.fk === fkN) && db.sol_ponte.filter((x) => x.user_id === BIA && !x.lido_em && x.id !== 'pNova').length === 1,
      'G13. a Bia adota a nova e o resumo que ficou pendente vai — com a nova; nada foi mandado com a de antes (' + JSON.stringify(env) + ')');
  });

  /* ================= G13d (etapa E8): integração desligada = só marca ================= */
  await parte('G13d', 'Com a integração Saúde → MoneyTRIO desligada (e a ponte desligada para a Ana): a troca só marca os resumos velhos (achados pela tabela), sem mandar nada', async (novo) => {
    const A = await novo('G13d-ana', { vp: 'celular' }), a = A.p;
    db.sol_ponte.push(msgPonte('pA', ANA), msgPonte('pB', BIA));
    db.sol_ponte_config.push({ user_id: ANA, de_app: 'omnilife-one', para_app: 'moneytrio', ligado: false });
    await abertoComVelha(a, ANA, PIN_A);
    const marca = M.log.length, r = await girar(a);
    conferir(r.ok && ponteDe('pA').lido_em && ponteDe('pB').lido_em && !enviosDesde(marca).length && db.sol_ponte.length === 2 && situacao().ponte_outra === 0 && await a.evaluate(() => !SaudeMT.pendente()),
      'G13d. desligada: os 2 resumos velhos marcados (mesmo com a ponte desligada para quem trocou), nada mandado, nada pendente');
  });

  /* ================= G13r (etapa E8): rede lenta ao abrir — nunca manda com a de antes ================= */
  await parte('G13r', 'Rede lenta ao abrir depois da troca (o aparelho abre com a de antes e adota segundos depois): o resumo pendente não vai com a de antes; vai com a nova logo depois de adotar', async (novo) => {
    const A = await novo('G13r-ana', { vp: 'celular' }), a = A.p;
    const C = await novo('G13r-bia', { vp: 'celular' }), c = C.p;
    await abertoComVelha(a, ANA, PIN_A);
    await abertoComVelha(c, BIA, PIN_B);
    await ligarSaude(a);
    await c.evaluate(() => Cloud.poll()); await esperar(c, () => SaudeMT.ligado(), null, 15000);
    await c.evaluate(() => { Cofre.trancar(); lsSet(LS.saudeMT, S.family.id); });   /* fechada, com uma mudança da Saúde esperando */
    await cortarRede(C, true);   /* sem internet durante a troca: a cópia daqui do registro fica a de antes */
    const r = await girar(a), fkN = linha('settings', 'giro').dados.para.fk;
    const marca = M.log.length;
    /* volta com a rede lenta: tudo que a Bia lê de omni_docs demora 2,5 s (o registro e o que o app puxa), e ela abre logo */
    await C.ctx.route(SB + '/rest/v1/omni_docs?*', async (route) => { if (route.request().method() === 'GET') await espere(2500); return supabase(route); });
    await cortarRede(C, false);
    const ra = await abrirPeloPin(c, PIN_B);
    const abriu = await c.evaluate(() => Cofre.fk);
    await esperar(c, (fk) => Cofre.fk === fk, fkN, 20000);
    const foi = await esperar(c, () => !SaudeMT.pendente(), null, 20000);
    const todos = enviosDesde(marca), env = todos.filter((x) => x.user === BIA);
    conferir(r.ok && ra.ok && abriu === FK0 && foi && env.length === 1 && todos.every((x) => x.fk === fkN),
      'G13r. abriu com a de antes (a rede lenta) e o resumo pendente esperou: foi uma vez, com a nova, depois de adotar (' + JSON.stringify([abriu === FK0, foi, env]) + ')');
  });

  /* ================= G13b (etapa E8, C10): o app cai logo depois do "feito" ================= */
  await parte('G13b', 'C10: o app cai logo depois de gravar "feito": o resumo velho já estava marcado (o "Terminar a troca" não trava na ponte), e ao abrir de novo o resumo vai com a nova (o pendente foi anotado antes)', async (novo) => {
    const A = await novo('G13b-ana', { vp: 'celular' }), a = A.p;
    db.sol_ponte.push(msgPonte('pA', ANA));
    await abertoComVelha(a, ANA, PIN_A);
    await ligarSaude(a);
    a.removeAllListeners('dialog');
    a.on('dialog', (d) => { if (d.type() === 'beforeunload') d.accept().catch(() => {}); else { A.lixo.nativos.push(d.type() + ': ' + d.message()); d.dismiss().catch(() => {}); } });
    await a.evaluate(() => { const o = Giro.gravarDoc; window.__feito = false; Giro.gravarDoc = async function (row, dados) { const l = await o.apply(this, arguments); if (dados && dados.estado === 'feito') { window.__feito = true; return new Promise(() => {}); } return l; }; });
    await comecar(a);
    await esperar(a, () => window.__feito, null, 30000);
    const gd = linha('settings', 'giro').dados, fkN = gd.para.fk, pend = await a.evaluate(() => SaudeMT.pendente());
    conferir(gd.estado === 'feito' && ponteDe('pA').lido_em && db.sol_ponte.length === 1 && situacao().ponte_outra === 0 && pend,
      'C10. caiu logo depois do "feito": o resumo velho já estava marcado (ponte_outra 0), nada mandado ainda, e o pendente anotado (' + JSON.stringify([gd.estado, !!ponteDe('pA').lido_em, db.sol_ponte.length, pend]) + ')');
    await a.reload().catch(() => {});
    await a.waitForFunction(() => typeof S !== 'undefined' && S.booted && S.mode === 'cloud' && S.family, null, { timeout: 30000 });
    await espere(500); await quieto(a); await senhasDaCasa(a);
    const ra = await abrirPeloPin(a, PIN_A);
    const foi = await ate(() => db.sol_ponte.length === 2, 15000), nova = db.sol_ponte[1], o = nova && JSON.parse(nova.dados.cif);
    /* o banco recebe o resumo antes de o aparelho ler a resposta e tirar o pendente: espera o aparelho também (não só o banco) */
    const semPendente = await esperar(a, () => !SaudeMT.pendente(), null, 10000);
    conferir(ra.ok && foi && o.fk === fkN && o.kv === 2 && semPendente && db.sol_ponte.length === 2, 'C10. abriu de novo: o resumo vai com a nova (uma vez)');
    const d = descartar(ANA, 1);
    conferir(d.n >= 2, 'C10. "Terminar a troca" não trava na ponte: o banco descarta as versões antigas (' + JSON.stringify(d) + ')');
  });

  /* ================= PZ (pendência da E6): rede pendurada no meio da troca ================= */
  await parte('PZ', 'Rede pendurada no meio da troca (o banco faz, mas a resposta não volta): cada chamada tem prazo — a troca para com "Parou sem internet…" em vez de ficar parada para sempre, e "Tentar de novo" termina com a mesma nova', async (novo) => {
    const A = await novo('PZ-ana', { vp: 'celular' }), a = A.p;
    await abertoComVelha(a, ANA, PIN_A);
    await a.evaluate(() => { Giro.PRAZO_MS = 1500; });
    const ids0 = idsVault();
    let segurar = null, segurou = 0;
    await A.ctx.route(SB + '/**', (route) => { const q = route.request(); if (segurar && segurar(q)) { segurou++; segurar = null; return engolir(route); } return supabase(route); });
    let n = 0;
    segurar = (q) => q.method() === 'PATCH' && /colecao=eq\.vault/.test(q.url()) && !/id=eq\._em/.test(q.url()) && ++n === 3;
    const t0 = Date.now(); await comecar(a); const r1 = await resultado(a, 20000), d1 = Date.now() - t0;
    conferir(r1 && r1.motivo === 'rede' && r1.erro === 'Parou sem internet. Toque em Tentar de novo: continua de onde parou.' && segurou === 1 && d1 < 15000 && linha('settings', 'giro').dados.estado === 'recifrando',
      'PZ. a resposta de uma linha não volta: a troca para em segundos com "Parou sem internet. Toque em Tentar de novo…" (' + JSON.stringify([r1, segurou, d1]) + ')');
    segurar = (q) => q.method() === 'GET' && /colecao=eq\.vault&id=eq\._em&select=/.test(q.url());
    await comecar(a, {}); const r2 = await resultado(a, 20000);
    conferir(r2 && r2.motivo === 'rede' && segurou === 2 && linha('settings', 'giro').dados.estado === 'emergencia', 'PZ. a leitura do código de emergência não volta: para também, no passo dele (' + JSON.stringify([r2, segurou]) + ')');
    const r3 = (await comecar(a, {}), await resultado(a, 30000)), gd = linha('settings', 'giro').dados;
    conferir(r3 && r3.ok && gd.estado === 'feito' && gd.para.kv === 2 && comFk(gd.para.fk).length === 6 && !comFk(FK0).length && idsVault() === ids0,
      'PZ. "Tentar de novo" termina com a mesma nova, sem item a mais (' + JSON.stringify(r3 && (r3.erro || 'ok')) + ')');
  });

  /* ================= G1t (etapa E9): a troca pela tela ================= */
  await parte('G1t', 'G1 pela tela: ⚙ → Segurança e aparelhos → Avançado → "🔄 Trocar a chave de segurança da família" → a confirmação (o que muda, o roteiro, "Entendi", TROCAR) → o PIN → a pílula com a tela acesa → a janela do fim; no banco, tudo na nova', async (novo) => {
    const A = await novo('G1t-ana', { vp: 'celular' }), a = A.p;
    await wakeLockDesdeOInicio(A.ctx);
    await abertoComVelha(a, ANA, PIN_A);
    await anexar(a, [['fG1tfam', 'familia']]);
    await vigiarAvisos(a);
    const ids0 = idsVault(), davi0 = versoes(DAVI), cris0 = versoes(CRIS);
    await a.evaluate(() => { Giro.PAUSA_MS = 400; });
    await avancado(a);
    const bt = await botaoTrocar(a);
    conferir(bt && !bt.disabled && bt.txt === '🔄 Trocar a chave de segurança da família' && bt.sub === 'Isso deixa a família mais segura. Pode levar alguns minutos; não feche o app.' && !bt.semSql && bt.w >= 44,
      'G1t. no Avançado: o botão com o nome que o dono escolheu e a frase dele embaixo, ligado, com 44 px (' + JSON.stringify(bt) + ')');
    const marca = M.log.length;
    const abriu = await abrirConfirmacao(a), tj = await textoConfirmacao(a);
    const partes = ['Trocar a chave de segurança da família', 'Isso deixa a família mais segura. Pode levar alguns minutos; não feche o app.', 'O QUE MUDA',
      'As senhas continuam as mesmas. Só muda o cadeado que protege tudo.', 'Seus outros aparelhos pedem o PIN uma vez para continuar abrindo.', 'Um aparelho que entrou aprovado pela família precisa ser aprovado de novo.',
      'O código de emergência muda. Se você tem o código à mão, digite abaixo', 'Código de emergência atual (opcional)', 'Cópias protegidas feitas antes desta troca deixam de trazer de volta as senhas e os anexos protegidos (fotos de documentos, do carro, da apólice) logo que a troca acontece. No fim, faça uma cópia nova.',
      '💾 Fazer uma cópia protegida antes', 'ela não os traz de volta sozinha', 'ANTES DE COMEÇAR', '✓ O MoneyTRIO já terminou a preparação da família.', '✓ Nenhum aviso da Saúde esperando o MoneyTRIO.',
      'Todos os aparelhos da família (os meus e os dos outros chefes e responsáveis) abriram o OmniLifeONE depois da atualização.', 'Estou com internet (de preferência Wi-Fi) e o aparelho está na tomada.', 'Entendi e quero trocar agora', 'Para confirmar, digite TROCAR', 'Trocar agora'];
    const faltam = partes.filter((x) => !tj.toUpperCase().includes(x.toUpperCase()));
    conferir(abriu && !faltam.length && !/Importante: só este aparelho/.test(tj) && !/já não abre/.test(tj), 'G1t. a confirmação: o que muda (1–5, com o código de emergência e o campo dele), a cópia com o aviso honesto, o roteiro (o MoneyTRIO conferido pelo banco), "Entendi", TROCAR (faltou: ' + faltam.join(' | ') + ')');
    const foco = await a.evaluate(() => { const m = document.querySelector('.modal.giro'); return !!m && m.closest('dialog') && m.closest('dialog').contains(document.activeElement); });
    const alvos = await a.evaluate(() => [...document.querySelectorAll('.modal.giro .check, .modal.giro .btn')].map((x) => Math.round(x.getBoundingClientRect().height)));
    const rotulos = await a.evaluate(() => [...document.querySelectorAll('.modal.giro input')].every((i) => !!i.closest('label')));
    conferir(foco && alvos.length >= 6 && alvos.every((h) => h >= 44) && rotulos, 'G1t. acessível: o foco está na janela, cada caixa de marcar e cada botão com 44 px ou mais, cada campo com rótulo (' + JSON.stringify(alvos) + ')');
    conferir(!gravacoesDesde(marca).length, 'G1t. abrir a confirmação não muda nada no banco');
    /* sem marcar e sem digitar: não segue */
    await a.click('.modal.giro [data-ok]');
    const e1 = await a.textContent('.modal.giro #giroErr');
    await confirmarTroca(a, { palavra: 'TROCA' });
    const e2 = await a.textContent('.modal.giro #giroErr');
    conferir(e1 === 'Marque os itens acima e digite TROCAR para confirmar.' && e2 === e1 && !!(await a.$('.modal.giro #giroPalavra')) && !gravacoesDesde(marca).length,
      'G1t. sem marcar tudo, ou com a palavra errada, não segue: "Marque os itens acima e digite TROCAR para confirmar." (' + JSON.stringify([e1, e2]) + ')');
    /* tudo marcado e "trocar" (em minúsculas): o PIN; errado não começa */
    await confirmarTroca(a);
    await digitarPin(a, '000000');
    await a.waitForFunction(() => /PIN errado/.test((document.querySelector('#perr') || {}).textContent || ''), null, { timeout: 10000 });
    conferir(!gravacoesDesde(marca).length && !linha('settings', 'giro') && !(await a.$('.modal.giro #giroPalavra')), 'G1t. com o PIN errado nada começa (só depois do PIN certo)');
    await a.fill('.modal #ppin', PIN_A); await a.click('.modal:has(#ppin) [data-ok]');
    const viu = await esperar(a, () => [...document.querySelectorAll('.dgo-tarefa')].some((x) => /Deixando a família mais segura/.test(x.innerText) && /Senhas: \d de 6/.test(x.innerText)), null, 20000);
    const wl1 = await a.evaluate(() => window.__wl.slice());
    conferir(viu && JSON.stringify(wl1) === '["pedido"]', 'G1t. a pílula "Deixando a família mais segura" com "Senhas: i de 6" e a tela acesa pedida (gravada desde o carregamento) (' + JSON.stringify(wl1) + ')');
    const fim = await esperar(a, () => [...document.querySelectorAll('.modal.giro')].some((m) => /A família está mais segura/.test(m.innerText)), null, 60000);
    await espere(400);
    const tf = await textoFim(a), wl2 = await a.evaluate(() => window.__wl.slice());
    conferir(fim && /✓ A família está mais segura/.test(tf) && tf.includes('Tudo foi trocado e conferido. As senhas continuam as mesmas.') && tf.includes('🆘 Falta um passo: faça o código de emergência novo e entregue à sua pessoa de confiança (no papel ou por mensagem). O código antigo não vale mais: peça para ela jogar fora.') &&
      tf.includes('🆘 Fazer o código novo') && tf.includes('💾 Faça uma cópia protegida nova: as de antes não trazem mais de volta as senhas nem os anexos protegidos.') && !/não puderam ser trocados|não pôde ser trocado/.test(tf),
      'G1t. a janela do fim onde a pessoa está: "✓ A família está mais segura", tudo conferido; o código de emergência deixou de valer → "🆘 Falta um passo" com "Fazer o código novo" (entregar de novo, fora do app; jogar fora o papel); "faça uma cópia nova" (' + tf.slice(0, 160) + ')');
    conferir(JSON.stringify(wl2) === '["pedido","solto"]', 'G1t. no fim, a tela acesa solta (' + JSON.stringify(wl2) + ')');
    /* no banco: tudo na nova (o mesmo que o G1 sem a tela) */
    const gd = linha('settings', 'giro').dados, fkN = gd.para.fk, n = await chaveDaPessoa(ANA);
    let okL = 0;
    for (const x of vivasVault().filter((y) => y.id !== '_em')) {
      const o = JSON.parse(x.dados_cifrado), d = await abrirLinha(n.raw, x.dados_cifrado).catch(() => null);
      if (o.fk === fkN && o.kv === 2 && d && (await tituloDe(n.raw, x.dados_cifrado)) === ITENS[+x.id.slice(1)][1] && !(await abre(() => decifrar(VELHA, d.enc)))) okL++;
    }
    conferir(gd.estado === 'feito' && JSON.stringify(gd.envelopes) === '{}' && gd.para.kv === 2 && fkN !== FK0 && okL === 6 && idsVault() === ids0 && regBanco().fk === fkN && regBanco().kv === 2 && Object.values(regBanco().membros).every((m) => m.fk === fkN),
      'G1t. no banco: a troca "feito" sem envelopes, as 6 linhas vivas na nova (kv 2) nas duas camadas, os mesmos ids, o registro novo (' + okL + ')');
    conferir(versoes(ANA) === '1,2' && versoes(BIA) === '1,2' && versoes(DAVI) === davi0 && versoes(CRIS) === cris0, 'G1t. a nova entregue (versão + 1) à Ana e à Bia (chefe e responsável, D-E1); o Davi e a Cris não');
    const hist = db.omni_historico.filter((h) => h.grupo_id === GID).map((h) => h.acao);
    conferir(['cofre.giro', 'cofre.girado'].every((x) => hist.includes(x)), 'G1t. o histórico: a troca começou e a chave foi trocada (' + hist.join() + ')');
    const an = await anexosDe(a, ['fG1tfam']);
    conferir(an.fG1tfam.enc.fk === fkN && an.fG1tfam.txt === 'anexo fG1tfam' && (await abreBlob(n.raw, an.fG1tfam.enc.iv, an.fG1tfam.bytes)), 'G1t. o anexo deste aparelho na nova (enc.fk novo, abre com ela)');
    /* "🆘 Fazer o código novo": esta janela fecha e a do código abre (uma por vez) */
    await a.click('.modal.giro #fimCodigo');
    const pergunta = await a.waitForFunction(() => [...document.querySelectorAll('.modal')].some((m) => /Gerar o código de emergência/.test(m.innerText)) && ![...document.querySelectorAll('.modal.giro')].length, null, { timeout: 8000 }).then(() => true, () => false);
    conferir(pergunta, 'G1t. "🆘 Fazer o código novo" fecha o fim e abre o "Gerar o código de emergência…"');
  });

  /* ================= G4t (etapa E9): o código de emergência na confirmação ================= */
  await parte('G4t', 'O código de emergência na confirmação: um código errado não segue (nada de deixar de valer por um erro de digitação); com o código de agora, ele continua valendo e o fim diz "O código de emergência continua o mesmo."', async (novo) => {
    const A = await novo('G4t-ana', { vp: 'computador' }), a = A.p;
    await abertoComVelha(a, ANA, PIN_A);
    await avancado(a);
    const marca = M.log.length;
    await abrirConfirmacao(a);
    await confirmarTroca(a, { codigo: 'XXXX-YYYY-ZZZZ-0000' });
    await a.waitForFunction(() => /não confere/.test((document.querySelector('.modal.giro #giroErr') || {}).textContent || ''), null, { timeout: 15000 });
    const e = await a.evaluate(() => ({ err: document.querySelector('.modal.giro #giroErr').textContent, campo: document.querySelector('.modal.giro #giroCodigoC').value, pin: !!document.querySelector('.modal #ppin') }));
    conferir(e.err === 'Esse código de emergência não confere. Confira e digite de novo, ou deixe em branco.' && e.campo === '' && !e.pin && !gravacoesDesde(marca).length,
      'G4t. código errado: "Esse código de emergência não confere…", o campo esvaziado, nem pede o PIN, nada muda (' + JSON.stringify(e) + ')');
    await confirmarTroca(a, { codigo: CODIGO_EM.toLowerCase().replace(/-/g, ' ') });
    await digitarPin(a, PIN_A);
    const fim = await esperar(a, () => [...document.querySelectorAll('.modal.giro')].some((m) => /A família está mais segura/.test(m.innerText)), null, 60000);
    const tf = await textoFim(a), em = linha('vault', '_em'), d = em && !em.apagado_em && JSON.parse(em.dados_cifrado).d.em, gd = linha('settings', 'giro').dados;
    const n = await chaveDaPessoa(ANA), k = d ? await abre(async () => { const raw = await decifrar(await kdf(CODIGO_EM, d.sal), d); if (!igual(raw, n.raw)) throw new Error('outra'); }) : false;
    conferir(fim && gd.em === 'refeito' && d && d.fk === gd.para.fk && k && tf.includes('✓ O código de emergência continua o mesmo.') && !/Falta um passo/.test(tf),
      'G4t. com o código de agora (digitado de outro jeito): ele continua valendo (o MESMO código abre a nova) e o fim diz "O código de emergência continua o mesmo." (' + tf.slice(0, 120) + ')');
    const ls = await a.evaluate(() => { const o = []; for (const s of [localStorage, sessionStorage]) for (let i = 0; i < s.length; i++) o.push(s.getItem(s.key(i))); return o.join('\n'); });
    const norm = CODIGO_EM.replace(/-/g, '').toUpperCase();
    conferir(!ls.toUpperCase().replace(/[\s-]/g, '').includes(norm) && !M.log.some((l) => JSON.stringify(l.corpo || '').toUpperCase().replace(/[\s-]/g, '').includes(norm)) && !A.lixo.console.some((t) => t.toUpperCase().replace(/[\s-]/g, '').includes(norm)),
      'G4t. o código digitado nunca no aparelho (localStorage/sessionStorage), nos pedidos ao banco nem no console');
  });

  /* ================= C52 (etapa E9): sem outro caminho para a chave pessoal ================= */
  await parte('C52', 'C5.2: sem outro jeito de abrir as Senhas da casa se este aparelho sumir (nenhum outro aparelho da conta que entrou pela conta, nem a digital em todos os aparelhos, nem o kit), a confirmação avisa forte e só segue com o "Entendi o risco"', async (novo) => {
    const A = await novo('C52-ana', { vp: 'celular' }), a = A.p;
    await abertoComVelha(a, ANA, PIN_A);
    /* sem o kit; um aparelho da Ana que entrou pela família (não conta) */
    db.omni_chave_privada.splice(0, db.omni_chave_privada.length, ...db.omni_chave_privada.filter((k) => k.user_id !== ANA));
    db.sol_aparelhos.push({ id: 'ap-familia-ana', user_id: ANA, nome: 'Tablet · Chrome', app: 'omnilife-one', como: 'familia', aprovado_por: BIA, aprovado_por_ap: null, criado_em: agora(), visto_em: agora(), removido_em: null, removido_por: null });
    await avancado(a);
    await abrirConfirmacao(a);
    const t1 = await textoConfirmacao(a), temCk = !!(await a.$('.modal.giro #giroCkRisco'));
    conferir(t1.includes('⚠️ Importante: só este aparelho consegue abrir as Senhas da casa por você.') && t1.includes('O mais seguro é antes ligar o kit de emergência') && temCk && t1.includes('Entendi o risco e quero trocar só com este aparelho'),
      'C5.2. sem kit, sem a digital em todos os aparelhos e sem outro aparelho que entrou pela conta (o que entrou pela família não conta): o aviso forte para leigo e o "Entendi o risco…"');
    const marca = M.log.length;
    await confirmarTroca(a, { sem: ['giroCkRisco'] });
    const e = await a.textContent('.modal.giro #giroErr');
    conferir(e === 'Marque os itens acima e digite TROCAR para confirmar.' && !(await a.$('.modal #ppin')) && !gravacoesDesde(marca).length, 'C5.2. sem marcar o "Entendi o risco…", não segue (nem pede o PIN)');
    await a.click('.modal.giro .mf [data-x]');
    await a.waitForSelector('.modal.giro', { state: 'detached', timeout: 5000 }).catch(() => {});
    /* com um aparelho dela que entrou pela conta (em qualquer app), o aviso some */
    db.sol_aparelhos.push({ id: 'ap-conta-ana', user_id: ANA, nome: 'Notebook · Chrome', app: 'moneytrio', como: 'aparelho', aprovado_por: ANA, aprovado_por_ap: null, criado_em: agora(), visto_em: agora(), removido_em: null, removido_por: null });
    await a.waitForFunction(() => !document.querySelector('.modal'), null, { timeout: 8000 }).catch(() => {});
    await avancado(a);
    await abrirConfirmacao(a);
    const t2 = await textoConfirmacao(a);
    conferir(!/Importante: só este aparelho/.test(t2) && !(await a.$('.modal.giro #giroCkRisco')), 'C5.2. com outro aparelho dela que entrou pela conta (no MoneyTRIO), sem o aviso');
  });

  /* ================= C53 (etapa E9): a cópia protegida antes, com o aviso honesto ================= */
  await parte('C53', 'C5.3: "💾 Fazer uma cópia protegida antes" com o aviso honesto (a cópia não salva as senhas sem o cadeado; as antigas não abrem depois); tocar fecha a confirmação, abre a cópia e, depois, a confirmação volta', async (novo) => {
    const A = await novo('C53-ana', { vp: 'celular' }), a = A.p;
    await abertoComVelha(a, ANA, PIN_A);
    await avancado(a);
    await abrirConfirmacao(a);
    const t = await textoConfirmacao(a);
    conferir(t.includes('Atenção: a cópia guarda o resto do app, mas as Senhas da casa e os anexos protegidos (fotos de documentos, do carro, da apólice) vão nela trancados pelo cadeado da família — ela não os traz de volta sozinha. E, logo que a troca acontecer, esta cópia já não traz de volta as senhas nem esses anexos.'),
      'C5.3. o aviso honesto junto do botão da cópia');
    const marca = M.log.length;
    await a.click('.modal.giro #giroCopia');
    const copia = await a.waitForFunction(() => [...document.querySelectorAll('.modal')].some((m) => /Cópia protegida/.test(m.innerText) && m.querySelector('#bsP1')) && !document.querySelector('.modal.giro'), null, { timeout: 8000 }).then(() => true, () => false);
    conferir(copia, 'C5.3. tocar fecha a confirmação e abre a "Cópia protegida" (uma janela por vez)');
    await a.click('.modal:has(#bsP1) [data-no]');
    const volta = await a.waitForSelector('.modal.giro #giroPalavra', { timeout: 8000 }).then(() => true, () => false);
    conferir(volta && !gravacoesDesde(marca).length, 'C5.3. ao fechar a cópia, a confirmação volta; nada mudou no banco');
  });

  /* ================= C11t (etapa E9): os itens que não abrem, na tela ================= */
  await parte('C11t', 'C11 na tela: a confirmação diz quantos itens já não abrem e oferece "Apagar os itens que não abrem"; nada é apagado sem o chefe tocar e provar com o PIN; tocando, só eles ficam apagados e sem o conteúdo, e a confirmação volta sem o aviso', async (novo) => {
    const A = await novo('C11t-ana', { vp: 'celular' }), a = A.p;
    gravarDoc('vault', 'vQuebrada', { dados_cifrado: JSON.stringify({ c: 1, kv: 1, fk: FK0, iv: b64(crypto.randomBytes(12)), ct: b64(crypto.randomBytes(40)) }) });
    gravarDoc('vault', 'vInterna', { dados_cifrado: await linhaCom(VELHA, 1, FK0, 'Parte interna de outra chave', new Uint8Array(crypto.randomBytes(32))) });
    await abertoComVelha(a, ANA, PIN_A);
    const outras0 = JSON.stringify(db.omni_docs.filter((d) => d.colecao === 'vault' && !['vQuebrada', 'vInterna'].includes(d.id)));
    await avancado(a);
    const marca = M.log.length;
    await abrirConfirmacao(a);
    const t = await textoConfirmacao(a);
    conferir(t.includes('⚠️ 2 itens das Senhas da casa já não abrem (estragaram antes, não por causa desta troca). Isso não atrapalha a troca, mas impede o último passo, “Terminar a troca”. Se não precisa deles, apague.') && t.includes('🗑 Apagar os itens que não abrem'),
      'C11. a confirmação: "2 itens … já não abrem" e o botão "Apagar os itens que não abrem"');
    conferir(!gravacoesDesde(marca).length && !linha('vault', 'vQuebrada').apagado_em && !linha('vault', 'vInterna').apagado_em, 'C11. só abrir a confirmação não apaga nada');
    await a.click('.modal.giro #giroApagar');
    await a.waitForSelector('.modal #ppin', { timeout: 10000 });
    const tp = await janelas(a);
    /* cancelar o PIN: nada apagado, a confirmação volta */
    await a.click('.modal:has(#ppin) .mf [data-x]');
    const volta = await a.waitForSelector('.modal.giro #giroPalavra', { timeout: 8000 }).then(() => true, () => false);
    conferir(/Vai apagar 2 itens que não abrem \(não dá para desfazer\)/.test(tp) && volta && !gravacoesDesde(marca).length, 'C11. o PIN antes de apagar ("Vai apagar 2 itens que não abrem (não dá para desfazer)"); cancelado, nada muda e a confirmação volta');
    await a.click('.modal.giro #giroApagar');
    await digitarPin(a, PIN_A);
    const volta2 = await a.waitForFunction(() => { const m = document.querySelector('.modal.giro'); return m && m.querySelector('#giroPalavra') && !m.querySelector('#giroNaoAbrem'); }, null, { timeout: 30000 }).then(() => true, () => false);
    const q = linha('vault', 'vQuebrada'), i = linha('vault', 'vInterna');
    const pv = gravacoesDesde(marca);
    conferir(q.apagado_em && q.dados_cifrado === null && i.apagado_em && i.dados_cifrado === null && pv.length === 2 && pv.every((l) => l.metodo === 'PATCH' && /versao=eq\.\d+/.test(l.caminho) && /apagado_em=is\.null/.test(l.caminho)),
      'C11. com o PIN: os 2 ficam apagados e sem o conteúdo (cada um com a versão lida); nada mais gravado (' + pv.length + ')');
    conferir(volta2 && JSON.stringify(db.omni_docs.filter((d) => d.colecao === 'vault' && !['vQuebrada', 'vInterna'].includes(d.id))) === outras0, 'C11. a confirmação volta sem o aviso; as outras linhas (e a já apagada, D-E6) iguais, byte a byte');
    const tela = await titulos(a);
    conferir(!('vQuebrada' in tela) && !('vInterna' in tela) && ITENS.every((x, k) => tela['v' + k] === x[1]), 'C11. os apagados saem da tela; os 6 continuam');
    const n0 = await a.evaluate(() => Giro.apagarNaoAbrem(['v0', 'v1'])), v0 = linha('vault', 'v0'), v1 = linha('vault', 'v1');
    conferir(n0 === 0 && !v0.apagado_em && !!v0.dados_cifrado && !v1.apagado_em && !!v1.dados_cifrado, 'C11. só apaga o que AINDA não abre: um item que abre fica, mesmo se pedirem (' + n0 + ')');
  });

  /* ================= G13t (etapa E9): os avisos da Saúde no roteiro ================= */
  await parte('G13t', 'O roteiro mostra os avisos da Saúde que esperam o MoneyTRIO, com "Conferir de novo" (seguir mesmo assim é permitido)', async (novo) => {
    const A = await novo('G13t-ana', { vp: 'celular' }), a = A.p;
    db.sol_ponte.push(msgPonte('pA', ANA));
    await abertoComVelha(a, ANA, PIN_A);
    await avancado(a);
    await abrirConfirmacao(a);
    const t1 = await textoConfirmacao(a);
    conferir(t1.includes('⚠️ Há 1 aviso da Saúde esperando o MoneyTRIO. Abra o MoneyTRIO num aparelho seu (pelo PIN, com internet) e espere 1 minuto.') && !!(await a.$('.modal.giro #giroPonteBt')),
      'G13. o roteiro: "Há 1 aviso da Saúde esperando o MoneyTRIO…" com "Conferir de novo"');
    Object.assign(ponteDe('pA'), { lido_em: agora(), lido_por: ANA });   /* o MoneyTRIO leu */
    await a.click('.modal.giro #giroPonteBt');
    const ok = await a.waitForFunction(() => /Nenhum aviso da Saúde esperando o MoneyTRIO/.test((document.querySelector('.modal.giro #giroPonte') || {}).textContent || ''), null, { timeout: 10000 }).then(() => true, () => false);
    conferir(ok && !!(await a.$('.modal.giro #giroPalavra')), 'G13. "Conferir de novo" depois de o MoneyTRIO ler: "✓ Nenhum aviso da Saúde esperando o MoneyTRIO." (a janela continua)');
  });

  /* ================= G1b (etapa E9, C3): o vigia nunca anda para trás ================= */
  await parte('G1b', 'C3: o vigia (no Cloud.poll) nunca devolve à chave de antes uma linha que a troca já passou para a nova — nem com a troca rodando neste aparelho, nem com ela parada no meio (a nova continua entre as que só abrem)', async (novo) => {
    const A = await novo('G1b-ana', { vp: 'celular' }), a = A.p;
    await abertoComVelha(a, ANA, PIN_A);
    await a.evaluate(() => { Giro.PAUSA_MS = 700; Giro.PRAZO_MS = 1500; });
    const marca = M.log.length;
    /* rodando: duas voltas do Cloud.poll no meio das linhas */
    await comecar(a);
    await ate(() => { const g = linha('settings', 'giro'); return g && g.dados.estado === 'recifrando' && g.dados.para && comFk(g.dados.para.fk).length >= 2; }, 20000);
    await umaVolta(a); await umaVolta(a);
    const r1 = await resultado(a, 40000), gd1 = linha('settings', 'giro').dados;
    conferir(r1 && r1.ok && gd1.voltas === 0 && !subiuCom(marca, FK0).length, 'C3. com a troca rodando e duas voltas do Cloud.poll no meio: nada volta para a chave de antes, nenhuma volta da conferência (' + JSON.stringify([r1 && (r1.erro || 'ok'), gd1.voltas, subiuCom(marca, FK0).length]) + ')');
  });
  await parte('G1p', 'C3: com a troca parada no meio (a nova entre as que só abrem, a de antes ainda fechando), o vigia do Cloud.poll não roda: nenhuma linha volta para a chave de antes; "Continuar" termina sem volta da conferência', async (novo) => {
    /* parada no meio (a resposta de uma linha não volta: "Parou sem internet"): a nova continua entre as que só abrem, e a de antes é a que fecha */
    const B = await novo('G1p-ana', { vp: 'celular' }), b = B.p;
    await abertoComVelha(b, ANA, PIN_A);
    await b.evaluate(() => { Giro.PRAZO_MS = 1500; });
    let n = 0, segurar = true;
    await B.ctx.route(SB + '/**', (route) => { const q = route.request(); if (segurar && q.method() === 'PATCH' && /colecao=eq\.vault/.test(q.url()) && !/id=eq\._em/.test(q.url()) && ++n === 4) { segurar = false; return engolir(route); } return supabase(route); });
    const marca2 = M.log.length;
    await comecar(b);
    const r2 = await resultado(b, 30000), gd2 = linha('settings', 'giro').dados;
    const parada = await b.evaluate((fk) => ({ rodando: Giro.rodando, curso: Giro.emCurso(), fk: Cofre.fk, outras: Cofre.outras.map((o) => o.fk), nova: !!Cofre.chaveDe(fk) }), gd2.para.fk);
    const novas = comFk(gd2.para.fk).map((x) => x.id).sort().join();
    await umaVolta(b); await umaVolta(b);
    const depois = comFk(gd2.para.fk).map((x) => x.id).sort().join();
    conferir(r2 && r2.motivo === 'rede' && !parada.rodando && parada.curso && parada.fk === FK0 && parada.nova && novas.split(',').length >= 3,
      'C3. parada no meio: não roda mais, a troca em curso, a de antes fecha e a nova só abre (' + JSON.stringify([r2 && r2.motivo, parada, novas]) + ')');
    conferir(depois === novas && !subiuCom(marca2, FK0).length, 'C3. parada no meio, duas voltas do Cloud.poll: nenhuma linha volta para a chave de antes (o vigia não roda com a troca em curso) (' + JSON.stringify([novas, depois, subiuCom(marca2, FK0).length]) + ')');
    const r3 = (await comecar(b, {}), await resultado(b, 40000)), gd3 = linha('settings', 'giro').dados;
    conferir(r3 && r3.ok && gd3.estado === 'feito' && gd3.voltas === 0 && comFk(gd3.para.fk).length === 6, 'C3. "Continuar" termina sem nenhuma volta da conferência');
  });

  /* ================= G9v (etapa E9): o vigia sobe as linhas tardias ================= */
  await parte('G9v', 'O vigia: depois da troca, uma linha gravada com a chave de antes por um aparelho que não acompanhou (e uma nova assim) sobe para a nova em até 2 voltas do Cloud.poll, sem perder a mudança e sem item a mais', async (novo) => {
    const A = await novo('G9v-ana', { vp: 'celular' }), a = A.p;
    await abertoComVelha(a, ANA, PIN_A);
    const r = await girar(a), gd = linha('settings', 'giro').dados, n = await chaveDaPessoa(ANA);
    conferir(r.ok && gd.estado === 'feito', 'G9v. a troca termina (' + (r.erro || 'ok') + ')');
    /* um aparelho 2.26 (com a de antes) grava v1 mudado e um item novo, fechados com a de antes */
    gravarDoc('vault', 'v1', { dados_cifrado: await linhaCom(VELHA, 1, FK0, 'Banco de mentira — mudado num aparelho atrasado') }, BIA);
    gravarDoc('vault', 'vTarde', { dados_cifrado: await linhaCom(VELHA, 1, FK0, 'Item novo de um aparelho atrasado') }, BIA);
    const ids0 = idsVault(), marca = M.log.length;
    let voltas = 0;
    for (; voltas < 2 && comFk(FK0).length; ) { voltas++; await umaVolta(a); }
    const v1 = linha('vault', 'v1'), vt = linha('vault', 'vTarde');
    const t1 = await tituloDe(n.raw, v1.dados_cifrado), tt2 = await tituloDe(n.raw, vt.dados_cifrado);
    conferir(!comFk(FK0).length && JSON.parse(v1.dados_cifrado).fk === gd.para.fk && JSON.parse(v1.dados_cifrado).kv === 2 && t1 === 'Banco de mentira — mudado num aparelho atrasado' && tt2 === 'Item novo de um aparelho atrasado' && voltas <= 2,
      'G9. as duas linhas tardias na nova (as duas camadas) em ' + voltas + ' volta(s) do Cloud.poll, com a mudança de quem gravou');
    const pv = M.log.slice(marca).filter((l) => l.metodo === 'PATCH' && /colecao=eq\.vault/.test(l.caminho));
    conferir(idsVault() === ids0 && pv.length === 2 && pv.every((l) => /versao=eq\.\d+/.test(l.caminho) && /apagado_em=is\.null/.test(l.caminho) && Object.keys(l.corpo).join() === 'dados_cifrado') && !M.log.slice(marca).some((l) => l.metodo === 'POST' && /omni_docs/.test(l.caminho)),
      'G9. cada uma com a versão dela e só o texto (CAS), nenhum item a mais (' + pv.length + ')');
    const tela = await titulos(a);
    conferir(tela.v1 === 'Banco de mentira — mudado num aparelho atrasado' && tela.vTarde === 'Item novo de um aparelho atrasado', 'G9. a tela mostra as duas');
    await umaVolta(a);
    conferir(M.log.slice(marca).filter((l) => l.metodo === 'PATCH' && /colecao=eq\.vault/.test(l.caminho)).length === 2, 'G9. nada a vigiar: a volta seguinte não grava nada');
    /* o registro volta para a chave de antes (C4: "não confere"): o vigia não mexe em nada (só sobe com a chave daqui = a do registro do banco) */
    const cof = linha('settings', 'cofre'); gravarDoc('settings', 'cofre', { dados: Object.assign({}, cof.dados, { fk: FK0, kv: 1 }) }, ANA);
    gravarDoc('vault', 'v2', { dados_cifrado: await linhaCom(VELHA, 1, FK0, 'Mudado com a de antes') }, BIA);
    const marca2 = M.log.length;
    await umaVolta(a); await umaVolta(a);
    conferir(JSON.parse(linha('vault', 'v2').dados_cifrado).fk === FK0 && !M.log.slice(marca2).some((l) => l.metodo === 'PATCH' && /colecao=eq\.vault/.test(l.caminho)),
      'G9. com o registro do banco dizendo outra chave (não confere, C4), o vigia não mexe em nada');
  });

  /* ================= G11 (etapa E9): só um chefe ================= */
  await parte('G11', 'Permissão: a Bia (responsável) não vê o botão; o ACT direto recusa ("Só um chefe da família pode fazer isso.") sem abrir nada nem perguntar ao banco; com o gatilho do Omni (M.soChefeGiro), o banco recusa (403) quando ela muda a chave no registro ou grava a troca', async (novo) => {
    const C = await novo('G11-bia', { vp: 'celular' }), c = C.p;
    await abertoComVelha(c, BIA, PIN_B);
    await vigiarAvisos(c);
    await avancado(c);
    const v = await c.evaluate(() => ({ bt: !!document.querySelector('[data-act="conta.giro.trocar"]'), item: !!document.querySelector('#segGiro'), txt: document.querySelector('#segAvC').innerText }));
    conferir(!v.bt && !v.item && !/Trocar a chave de segurança/.test(v.txt), 'G11. a Bia (responsável) não vê o botão nem o item no Avançado');
    const marca = M.log.length;
    await c.evaluate(() => ACT['conta.giro.trocar']());
    await espere(800);
    conferir(/Só um chefe da família pode fazer isso\./.test(await avisos(c)) && !(await c.$('.modal.giro')) && !gravacoesDesde(marca).length && !M.log.slice(marca).some((l) => /sol_giro_situacao|sol_chaves_publicas/.test(l.caminho)),
      'G11. o ACT direto pela Bia: "Só um chefe da família pode fazer isso.", nenhuma janela, nada perguntado nem gravado no banco');
    const r = await c.evaluate(async () => { try { await Giro.executar(null, {}, { novo: true }); return 'começou'; } catch (e) { return e.message; } });
    conferir(r === 'Só um chefe da família pode fazer isso.' && !linha('settings', 'giro') && !gravacoesDesde(marca).length, 'G11. nem pelo Giro direto (' + r + ')');
    /* o gatilho do Omni (D-E3): o banco é a última porta */
    M.soChefeGiro = true;
    const reg0 = JSON.stringify(regBanco());
    const st = await c.evaluate(async () => {
      const l = await CloudDriver.linha('settings', 'cofre'), d = Object.assign({}, l.dados, { fk: 'fk-da-bia', kv: (+l.dados.kv || 0) + 1 }), out = {};
      try { await Conta.rest('PATCH', CloudDriver.url('settings', 'cofre') + '&versao=eq.' + l.versao, { vis: 'restrito', dados: d }, 'return=representation'); out.reg = 'passou'; } catch (e) { out.reg = e.status; }
      try { await Conta.rest('POST', 'omni_docs', { grupo_id: S.family.id, colecao: 'settings', id: 'giro', vis: 'restrito', dados: { v: 1, vis: 'restrito', estado: 'preparado', por: Conta.uid() } }, 'return=representation'); out.giro = 'passou'; } catch (e) { out.giro = e.status; }
      return out;
    });
    conferir(st.reg === 403 && st.giro === 403 && JSON.stringify(regBanco()) === reg0 && !linha('settings', 'giro'), 'G11. com M.soChefeGiro: o PATCH direto da Bia mudando a chave do registro → 403, gravar a troca → 403; nada mudou (' + JSON.stringify(st) + ')');
  });

  /* ================= G12b (etapa E9, C6): sem o SQL da plataforma ================= */
  await parte('G12b', 'C6/D-E9: sem a sol_giro_situacao no banco (o SQL da plataforma ainda não aplicado), o botão fica desligado com "Ainda não dá: falta uma atualização do SolverONE." e a confirmação não abre (nem pelo ACT direto); com ela, o botão liga', async (novo) => {
    const A = await novo('G12b-ana', { vp: 'celular' }), a = A.p;
    await abertoComVelha(a, ANA, PIN_A);
    await vigiarAvisos(a);
    M.semGiroSql = true;
    await avancado(a);
    const bt = await botaoTrocar(a);
    conferir(bt && bt.disabled && bt.semSql === '⏳ Ainda não dá: falta uma atualização do SolverONE.' && !/manual|Confirmo que o MoneyTRIO/.test(await a.evaluate(() => document.querySelector('#segAvC').innerText)),
      'G12b. sem a função: o botão desligado e "Ainda não dá: falta uma atualização do SolverONE."; nenhum caminho manual (' + JSON.stringify(bt) + ')');
    const marca = M.log.length;
    await a.click('[data-act="conta.giro.trocar"]', { timeout: 1500 }).catch(() => {});
    await a.evaluate(() => { Giro._sql = null; ACT['conta.giro.trocar'](); });
    const abriu = await a.waitForSelector('.modal.giro', { timeout: 5000 }).then(() => true, () => false);
    await espere(300);
    conferir(!abriu && /Ainda não dá: falta uma atualização do SolverONE\./.test(await avisos(a)) && !gravacoesDesde(marca).length && !linha('settings', 'giro'),
      'G12b. tocar (ou o ACT direto) não abre a confirmação: o aviso "Ainda não dá…" e nada muda no banco');
    const bt2 = await botaoTrocar(a);
    conferir(bt2 && bt2.disabled, 'G12b. depois do toque, o botão continua desligado');
    M.semGiroSql = false;
    await avancado(a);
    const bt3 = await botaoTrocar(a);
    conferir(bt3 && !bt3.disabled && !bt3.semSql, 'G12b. com a função no banco, o botão liga (' + JSON.stringify(bt3) + ')');
  });

  /* ================= AV (etapa E9): os avisos para os outros, o cartão no Avançado e o histórico ================= */
  await parte('AV', 'Para os outros chefes e responsáveis (8.5): "Um chefe da família está trocando…" e, parada, "…precisa continuar"; a troca esquecida no "preparado" (C16) avisa os chefes antes de se desfazer; quem começou vê o cartão "Continuar" também no Avançado (sem o botão); o histórico conta e avisa os chefes e responsáveis (GOV_SENS)', async (novo) => {
    const A = await novo('AV-ana', { vp: 'celular' }), a = A.p;
    const C = await novo('AV-bia', { vp: 'celular' }), c = C.p;
    await abertoComVelha(a, ANA, PIN_A);
    await abertoComVelha(c, BIA, PIN_B);
    const ver = async (p) => {
      await p.evaluate(async () => { const b = await Giro.ler(); if (b.giro) await CloudDriver.aceitar('settings', 'giro', b.giro, true); go('house', 'vault'); render(); });
      await espere(400);
      return p.evaluate(() => { const x = document.querySelector('#giroAviso'); return x ? x.innerText.replace(/\s+/g, ' ').trim() : ''; });
    };
    const g = gravarDoc('settings', 'giro', { vis: 'restrito', dados: trocaNoBanco({ por: ANA }) }, ANA);
    const v1 = await ver(c), va = await ver(a);
    conferir(v1 === '🔄 Um chefe da família está trocando a chave de segurança (alguns minutos). Algumas senhas podem não aparecer até terminar. Não precisa fazer nada.' && va === '',
      'AV. viva: a Bia vê "Um chefe da família está trocando…"; quem começou não vê o aviso (vê o cartão) (' + JSON.stringify([v1, va]) + ')');
    g.atualizado_em = new Date(Date.now() - 10 * 60e3).toISOString(); g.versao++;
    const v2 = await ver(c);
    conferir(v2 === '🔄 A troca de segurança parou no meio. Um chefe da família precisa continuar (o que começou ou outro chefe).', 'AV. parada: "A troca de segurança parou no meio. Um chefe da família precisa continuar (o que começou ou outro chefe)." (' + v2 + ')');
    /* C16: começada por outra pessoa e parada no "preparado" há 2 h: o chefe sabe que ela se desfaz sozinha; a responsável vê a parada */
    Object.assign(g, { dados: trocaNoBanco({ estado: 'preparado', por: CRIS, apNome: 'Aparelho da Cris' }), atualizado_em: new Date(Date.now() - 2 * 3600e3).toISOString() }); g.versao++;
    const v3 = await ver(a), v4 = await ver(c);
    conferir(v3 === '🔄 A troca de segurança começou e parou antes de mudar qualquer coisa. Se o chefe que começou não continuar, ela se desfaz sozinha em 22 h.' && v4 === '🔄 A troca de segurança parou no meio. Um chefe da família precisa continuar (o que começou ou outro chefe).',
      'C16. o chefe é avisado antes: "…se desfaz sozinha em 22 h."; a responsável vê a parada (' + JSON.stringify([v3, v4]) + ')');
    await avancado(a);
    const av1 = await a.evaluate(() => ({ aviso: ((document.querySelector('#segGiro #giroAviso') || {}).innerText || '').trim(), bt: !!document.querySelector('#segGiro [data-act="conta.giro.trocar"]') }));
    conferir(/se desfaz sozinha em 22 h/.test(av1.aviso) && !av1.bt, 'C16. no Avançado também, sem o botão enquanto ela vale (' + JSON.stringify(av1) + ')');
    g.atualizado_em = new Date(Date.now() - 25 * 3600e3).toISOString(); g.versao++;
    const v5 = await ver(a), v6 = await ver(c);
    conferir(v5 === '' && v6 === '', 'C16. com 25 h, vale como desfeita: nenhum aviso');
    /* a troca DELA pela metade, deste aparelho: o cartão "Continuar" também no Avançado (o mesmo das Senhas da casa), sem o botão */
    const meuAp = await a.evaluate(async () => Giro.meuAp(await Cofre.local()));
    Object.assign(g, { dados: trocaNoBanco({ por: ANA, ap: meuAp, apNome: 'Este celular' }), atualizado_em: agora() }); g.versao++;
    await ver(a);
    await avancado(a);
    const av2 = await a.evaluate(() => ({ cartao: ((document.querySelector('#segGiro #giroCartao') || {}).innerText || '').replace(/\s+/g, ' ').trim(), cont: !!document.querySelector('#segGiro [data-act="conta.giro.continuar"]'), codigo: document.querySelectorAll('#giroCodigo').length, bt: !!document.querySelector('[data-act="conta.giro.trocar"]') }));
    conferir(/A troca ficou pela metade\. Continuar de onde parou\?/.test(av2.cartao) && av2.cont && av2.codigo === 1 && !av2.bt, 'AV. no Avançado, quem começou vê o cartão "Continuar" (com o campo do código de emergência, uma vez só) e não o botão de começar outra (' + JSON.stringify(av2) + ')');
    /* o histórico (8.9) e o aviso aos chefes e responsáveis (GOV_SENS) */
    let id = 9000;
    for (const acao of ['cofre.giro', 'emergencia.invalidada', 'cofre.girado', 'cofre.descartado']) db.omni_historico.push({ id: ++id, grupo_id: GID, acao, detalhe: 'Ana', criado_por: ANA, nome: 'Ana', criado_em: agora(), atualizado_em: agora() });
    await umaVolta(c);
    const al = await c.evaluate(() => Gov.alerts().map((x) => x.t));
    const pt = ['🔄 Troca da chave de segurança começou — Ana (Ana)', '🆘 Código de emergência deixou de valer (troca de segurança) — Ana (Ana)', '🔄 Chave de segurança da família trocada — Ana (Ana)', '🧹 Versões antigas da chave de segurança apagadas — Ana (Ana)'];
    conferir(pt.every((x) => al.includes(x)), 'GOV_SENS. os 4 do histórico da troca avisam a Bia (Inbox e Início), com o texto para leigo (' + JSON.stringify(al) + ')');
    const en = await c.evaluate(() => { S.lang = 'en'; const r = ['cofre.giro', 'cofre.girado', 'cofre.descartado', 'emergencia.invalidada'].map(AUDIT_TXT); S.lang = 'pt'; return r; });
    conferir(JSON.stringify(en) === JSON.stringify(['🔄 Security key change started', '🔄 Family security key changed', '🧹 Old security key versions deleted', '🆘 Emergency code stopped working (security change)']), 'AUDIT_TXT. em inglês (' + JSON.stringify(en) + ')');
  });

  /* ================= G14 (etapa E9): leigo e telas ================= */
  await parte('G14', 'Leigo e telas: os textos da troca (botão, confirmação, pílula, erros, fim, cartões e avisos), em PT e EN, sem "cifr", "token", "sincron", e com "chave" (ou "key") só em "chave de segurança" (o nome do dono); sem rolar para o lado em 390 px; prints em 390 e 1280 px da confirmação, da pílula, do fim e do cartão "precisa ser aprovado de novo"', async (novo) => {
    const A = await novo('G14-ana', { vp: 'celular' }), a = A.p;
    const D = await novo('G14-ana-familia', { vp: 'celular' }), d = D.p;
    await abertoComVelha(a, ANA, PIN_A);
    await abertoPelaFamilia(d, ANA, PIN_A);
    const textos = (lang) => a.evaluate((lang) => {
      S.lang = lang; const out = [];
      for (const o of [Giro.T, Cofre.T()]) for (const v of Object.values(o)) out.push(...(typeof v === 'function' ? [v(1, 2), v(2, 3)] : [v]).map(String));
      S.lang = 'pt'; return out;
    }, lang);
    const ruim = (t, lang) => /cifr|token|sincron|encrypt|sync/i.test(t) || (lang === 'pt' ? t.replace(/chave de segurança/gi, '') : t.replace(/security key/gi, '')).match(lang === 'pt' ? /chave/i : /\bkey/i);
    const tpt = await textos('pt'), ten = await textos('en');
    const rp = tpt.filter((t) => ruim(t, 'pt')), re = ten.filter((t) => ruim(t, 'en'));
    conferir(tpt.length > 90 && !rp.length && !re.length && tpt.join() !== ten.join(), 'G14. ' + tpt.length + ' textos da troca, PT e EN: nada de "cifr"/"token"/"sincron", e "chave"/"key" só em "chave de segurança" (' + JSON.stringify(rp.concat(re)).slice(0, 300) + ')');
    await avancado(a);
    await foto(a, 'e9-avancado', '#segGiro');
    await abrirConfirmacao(a);
    const lado = await a.evaluate(() => ({ doc: document.documentElement.scrollWidth <= innerWidth, m: Math.round(document.querySelector('.modal.giro').getBoundingClientRect().width) <= innerWidth }));
    const tj = await textoConfirmacao(a);
    conferir(lado.doc && lado.m && !ruim(tj.replace(/Trocar a chave de segurança da família/g, ''), 'pt'), 'G14. a confirmação em 390 px sem rolar para o lado e sem palavra técnica (' + JSON.stringify(lado) + ')');
    await foto(a, 'e9-confirmacao');
    /* em inglês, a mesma janela */
    await a.click('.modal.giro .mf [data-x]'); await a.waitForSelector('.modal.giro', { state: 'detached', timeout: 5000 }).catch(() => {});
    await a.evaluate(() => { S.lang = 'en'; render(); }); await avancado(a);
    await abrirConfirmacao(a);
    const tje = await textoConfirmacao(a);
    conferir(/Change the family security key/.test(tje) && /To confirm, type CHANGE/.test(tje) && /I understand and want to change it now/.test(tje) && !ruim(tje.replace(/Change the family security key/g, ''), 'en'), 'G14. a confirmação em inglês (' + tje.slice(0, 100) + ')');
    await a.click('.modal.giro .mf [data-x]'); await a.waitForSelector('.modal.giro', { state: 'detached', timeout: 5000 }).catch(() => {});
    await a.evaluate(() => { S.lang = 'pt'; render(); }); await avancado(a);
    /* a troca pela tela: a pílula e o fim */
    await a.evaluate(() => { Giro.PAUSA_MS = 900; });
    await abrirConfirmacao(a); await confirmarTroca(a); await digitarPin(a, PIN_A);
    await esperar(a, () => [...document.querySelectorAll('.dgo-tarefa')].some((x) => /Senhas: [2-5] de 6/.test(x.innerText)), null, 30000);
    const pil = await a.evaluate(() => [...document.querySelectorAll('.dgo-tarefa')].map((x) => x.innerText.replace(/\s+/g, ' ')).join(' | '));
    conferir(/Deixando a família mais segura/.test(pil) && !ruim(pil, 'pt'), 'G14. a pílula para leigo (' + pil.slice(0, 120) + ')');
    await foto(a, 'e9-pilula', '#segGiro');
    await esperar(a, () => [...document.querySelectorAll('.modal.giro')].some((m) => /A família está mais segura/.test(m.innerText)), null, 60000);
    const tf = await textoFim(a);
    conferir(!ruim(tf, 'pt'), 'G14. o fim para leigo');
    await foto(a, 'e9-fim');
    /* o aparelho que entrou pela família: o cartão "precisa ser aprovado de novo" */
    await umaVolta(d);
    await d.evaluate(() => { go('house', 'vault'); render(); });
    const sc = await esperar(d, () => !!document.querySelector('#cfVelho [data-act="cofre.reaprovar"]'), null, 15000), tsc = await d.evaluate(() => ((document.querySelector('#cfVelho') || {}).innerText || '').replace(/\s+/g, ' '));
    conferir(sc && /precisa ser aprovado de novo/.test(tsc) && !ruim(tsc, 'pt'), 'G14. o cartão "precisa ser aprovado de novo" no aparelho que entrou pela família, para leigo (' + tsc.slice(0, 120) + ')');
    conferir(!(await d.$('#emFalta')), 'G14. nesse aparelho (ainda sem a nova), o "Fazer o código novo" não aparece: ele não conseguiria (o cartão diz o que fazer antes)');
    await foto(d, 'e9-cartao-semchave');
  });


  /* ================= G12 (etapa E10): "Terminar a troca" ================= */
  await parte('G12', '"Terminar a troca" (item d): antes da troca → "Termine primeiro…"; o MoneyTRIO não migrado → "O MoneyTRIO ainda não terminou…"; um aparelho velho gravou por cima (ping-pong) → "Falta entregar…"; depois da troca, com o PIN, o banco apaga só as versões antigas de cada pessoa (quem recebeu a versão 1 depois da troca fica), o registro anota e o botão sai; os aparelhos soltam as chaves de antes (sem o descarte, nunca; com algo daqui ainda nela, ainda não)', async (novo) => {
    const A = await novo('G12-ana', { vp: 'celular' }), a = A.p;
    const B = await novo('G12-ana-pc', { vp: 'computador' }), bb = B.p;
    /* a Ana já trocou de chave pessoal uma vez (a chave da família de antes embrulhada de novo para ela, versão 2): antes da troca já
       há uma versão antiga no banco */
    const kA = db.sol_chave_publica.find((k) => k.user_id === ANA).chave_publica;
    db.sol_grupo_chaves.push({ grupo_id: GID, user_id: ANA, versao: 2, chave_embrulhada: await embrulhar(kA, M.cfVelha, 1, FK0), embrulhada_por: ANA, criado_em: agora() });
    linha('settings', 'cofre').dados.membros[ANA].seq = 2;
    await abertoComVelha(a, ANA, PIN_A);
    await abertoComVelha(bb, ANA, PIN_B);
    await anexar(bb, [['fG12b', 'familia']]);
    await vigiarAvisos(a); await contarSoltar(bb);
    /* --- antes da troca --- */
    await avancado(a);
    conferir(!(await a.$('[data-act="conta.giro.descartar"]')) && !(await a.evaluate(() => Giro.podeDescartar())), 'G12. antes da troca, o Avançado não oferece "Terminar a troca"');
    let foto0 = bancoTerm(), marca = M.log.length;
    const j0 = await tocarTerminar(a, true);
    conferir(j0.tipo === 'falta' && j0.txt.includes('Ainda não dá para terminar:') && j0.txt.includes('Termine primeiro “Trocar a chave de segurança da família”.') && bancoTerm() === foto0 && !gravacoesDesde(marca).length &&
      !M.log.slice(marca).some((l) => /sol_descartar_chaves_antigas/.test(l.caminho)),
      'G12. antes da troca, o ACT direto: "Ainda não dá para terminar: Termine primeiro “Trocar a chave de segurança da família”." — nada muda e o banco nem é chamado para apagar (' + j0.txt.slice(0, 140) + ')');
    await fecharTerm(a);
    const d0 = await descartarDireto(a);
    conferir(d0.motivo === 'giro' && d0.txt === 'Termine primeiro “Trocar a chave de segurança da família”.' && bancoTerm() === foto0 && M.log.slice(marca).filter((l) => /sol_descartar_chaves_antigas/.test(l.caminho)).length === 1,
      'G12. o banco, direto (p_ate_versao 1: há versão antiga): descartar:giro → o mesmo texto, e nada muda (' + JSON.stringify(d0) + ')');
    /* --- a troca --- */
    const rg = await girar(a), gd = linha('settings', 'giro').dados, fkN = gd.para.fk;
    conferir(rg.ok && gd.estado === 'feito' && versoes(ANA) === '1,2,3' && versoes(BIA) === '1,2', 'G12. a troca terminou (a Ana com 1,2,3; a Bia com 1,2) (' + JSON.stringify(rg.erro || 'ok') + ')');
    await umaVolta(bb);
    const adotou = await ateA(async () => { const f = await famDe(bb), an = await anexosDe(bb, ['fG12b']); return f.fk === fkN && an.fG12b.enc.fk === fkN; }, 20000);
    conferir(adotou && JSON.stringify((await famDe(bb)).velhas) === '["' + FK0 + '"]', 'G12. o outro aparelho da Ana adotou a nova (velhas = [a de antes]) e passou o anexo dele para a nova');
    await avancado(a);
    const bt = await a.evaluate(() => { const b = document.querySelector('[data-act="conta.giro.descartar"]'), n = document.querySelector('#giroTerminar'); return b ? { dis: b.disabled, txt: b.textContent.trim(), nota: n.innerText.replace(/\s+/g, ' '), h: b.getBoundingClientRect().height } : null; });
    conferir(bt && !bt.dis && bt.txt === '🧹 Terminar a troca (apagar as versões antigas)' && bt.nota.includes('Quando as Senhas da casa tiverem sido abertas nos seus outros aparelhos, nos dos outros chefes e responsáveis e no MoneyTRIO, toque em “Terminar a troca”.') &&
      bt.nota.includes('Depois disso, a versão antiga é apagada de vez: nada antigo abre mais as senhas, nem para quem tiver uma cópia de antes da troca. Faça antes de convidar alguém novo para a família.') && bt.h >= 44,
      'G12. depois da troca, o Avançado oferece "🧹 Terminar a troca (apagar as versões antigas)" com o que fazer antes e o que acontece (' + JSON.stringify(bt) + ')');
    await foto(a, 'e10-avancado', '#giroTerminar');
    /* --- sem o descarte, nenhum aparelho solta a chave de antes --- */
    await reabrirPeloPin(bb, PIN_B);
    conferir(JSON.stringify((await famDe(bb)).velhas) === '["' + FK0 + '"]' && (await outrasDe(bb)).includes(FK0), 'G12. sem o "Terminar a troca", abrir de novo não solta a chave de antes');
    /* --- o MoneyTRIO ainda não migrou --- */
    db.money_docs.push({ grupo_id: GID, colecao: 'tx', id: 'm1', vis: 'publico', dados: null, dados_cifrado: '{"c":1,"m":"c","iv":"x","ct":"y"}', versao: 1, apagado_em: null });
    foto0 = bancoTerm(); marca = M.log.length;
    const j1 = await tocarTerminar(a);
    conferir(j1.tipo === 'falta' && j1.txt.includes('O MoneyTRIO ainda não terminou a preparação da família.') && !j1.txt.includes('Termine primeiro') && bancoTerm() === foto0 && !gravacoesDesde(marca).length,
      'G12. o MoneyTRIO não migrou: "O MoneyTRIO ainda não terminou a preparação da família." e nada muda (' + j1.txt.slice(0, 120) + ')');
    await foto(a, 'e10-falta');
    await fecharTerm(a);
    const d1 = await descartarDireto(a);
    conferir(d1.motivo === 'money' && d1.txt === 'O MoneyTRIO ainda não terminou a preparação da família.' && bancoTerm() === foto0, 'G12. o banco, direto: descartar:money → o mesmo texto, nada muda (' + JSON.stringify(d1) + ')');
    db.money_docs.splice(0);
    /* --- ping-pong: um aparelho velho gravou para a Bia uma versão maior que a do registro --- */
    db.sol_grupo_chaves.push({ grupo_id: GID, user_id: BIA, versao: 3, chave_embrulhada: 'aparelho-velho', embrulhada_por: BIA, criado_em: agora() });
    foto0 = bancoTerm(); marca = M.log.length;
    const j2 = await tocarTerminar(a);
    conferir(j2.tipo === 'falta' && j2.txt.includes('Falta entregar a versão nova para 1 pessoa. Abra as Senhas da casa e espere 1 minuto.') && bancoTerm() === foto0 && !gravacoesDesde(marca).length,
      'G12. ping-pong: "Falta entregar a versão nova para 1 pessoa…" e nada muda (' + j2.txt.slice(0, 120) + ')');
    await fecharTerm(a);
    const d2 = await descartarDireto(a);
    conferir(d2.motivo === 'membros' && d2.txt === 'Falta entregar a versão nova para 1 pessoa. Abra as Senhas da casa e espere 1 minuto.' && bancoTerm() === foto0, 'G12. o banco, direto: descartar:membros → o mesmo texto, nada muda (' + JSON.stringify(d2) + ')');
    db.sol_grupo_chaves.splice(db.sol_grupo_chaves.findIndex((c) => c.user_id === BIA && c.versao === 3), 1);
    /* --- o Davi vira responsável depois da troca: recebe a versão 1, já com a nova --- */
    db.sol_grupo_membros.find((m) => m.grupo_id === GID && m.user_id === DAVI).papel = 'responsavel';
    await distribuirJa(a);
    const kd = await chaveDaPessoa(DAVI);
    conferir(versoes(DAVI) === '1' && kd && kd.fk === fkN && regBanco().membros[DAVI] && regBanco().membros[DAVI].seq === 1 && regBanco().membros[DAVI].fk === fkN, 'G12. o Davi, responsável depois da troca, recebe a versão 1 já com a nova');
    /* --- a confirmação: sem "Entendi" ou sem TROCAR não segue; PIN errado não muda nada --- */
    foto0 = bancoTerm(); marca = M.log.length;
    const j3 = await tocarTerminar(a);
    conferir(j3.tipo === 'confirma' && ['🧹 Terminar a troca', 'Depois disso, a versão antiga é apagada de vez: nada antigo abre mais as senhas, nem para quem tiver uma cópia de antes da troca. Faça antes de convidar alguém novo para a família.', 'Entendi e quero terminar agora', 'Para confirmar, digite TROCAR', '🧹 Terminar agora'].every((t) => j3.txt.includes(t)) && !gravacoesDesde(marca).length,
      'G12. tudo pronto: a confirmação (o que acontece, "Entendi e quero terminar agora", TROCAR); abrir não muda nada (' + j3.txt.slice(0, 160) + ')');
    await foto(a, 'e10-confirmacao');
    await confirmarTerminar(a, { semCheck: true });
    const e1 = await a.textContent('.modal.giro #giroTermErr');
    await confirmarTerminar(a, { palavra: 'TROCA' });
    const e2 = await a.textContent('.modal.giro #giroTermErr');
    conferir(e1 === 'Marque o item acima e digite TROCAR para confirmar.' && e2 === e1 && !(await a.$('.modal #ppin')) && bancoTerm() === foto0, 'G12. sem "Entendi" ou com a palavra errada, não segue (nem pede o PIN) (' + JSON.stringify([e1, e2]) + ')');
    await confirmarTerminar(a);
    await digitarPin(a, '000000');
    await a.waitForFunction(() => /PIN errado/.test((document.querySelector('#perr') || {}).textContent || ''), null, { timeout: 10000 });
    conferir(bancoTerm() === foto0 && !M.log.slice(marca).some((l) => /sol_descartar_chaves_antigas/.test(l.caminho)), 'G12. com o PIN errado, nada muda (o banco nem é chamado)');
    /* --- o PIN certo: o banco apaga só as versões antigas --- */
    await a.fill('.modal #ppin', PIN_A); await a.click('.modal:has(#ppin) [data-ok]');
    const ok = await esperar(a, () => (window.__av || []).some((t) => /Pronto: a troca terminou/.test(t)), null, 20000);
    await ate(() => db.omni_historico.some((h) => h.grupo_id === GID && h.acao === 'cofre.descartado'), 8000);   /* o histórico sobe sem segurar o aviso */
    const reg = regBanco(), hist = db.omni_historico.filter((h) => h.grupo_id === GID && h.acao === 'cofre.descartado');
    conferir(ok && versoes(ANA) === '3' && versoes(BIA) === '2' && versoes(DAVI) === '1' && versoes(CRIS) === '',
      'G12. "✓ Pronto: a troca terminou.": saíram só as versões antigas (a Ana fica com a 3, a Bia com a 2) e o Davi, que recebeu a versão 1 depois da troca, FICA (' + [versoes(ANA), versoes(BIA), versoes(DAVI)].join(' | ') + ')');
    const ch = M.log.slice(marca).filter((l) => /sol_descartar_chaves_antigas/.test(l.caminho));
    conferir(ch.length === 1 && ch[0].corpo.p_ate_versao === 2 && reg.descarte && reg.descarte.ate === 2 && reg.descarte.fk === fkN && !!Date.parse(reg.descarte.em) && reg.fk === fkN && reg.kv === 2 && hist.length === 1,
      'G12. p_ate_versao = a maior versão de quem está na família − 1 (2); o registro anota o descarte desta chave ({ate, em, fk}); o histórico conta (' + JSON.stringify([ch.length && ch[0].corpo, reg.descarte, hist.length]) + ')');
    const cofrePatch = M.log.slice(marca).filter((l) => l.metodo === 'PATCH' && /id=eq\.cofre/.test(l.caminho));
    conferir(cofrePatch.length === 1 && /versao=eq\.\d+/.test(cofrePatch[0].caminho), 'G12. o registro anotado com a versão lida (CAS), uma gravação só');
    await esperar(a, () => !document.querySelector('[data-act="conta.giro.descartar"]'), null, 8000);
    conferir(!(await a.$('[data-act="conta.giro.descartar"]')) && !(await a.evaluate(() => Giro.podeDescartar())), 'G12. depois, o botão "Terminar a troca" sai do Avançado');
    const soltouA = await ateA(async () => (await famDe(a)).velhas.length === 0 && !(await outrasDe(a)).length, 10000);
    conferir(soltouA && (await famDe(a)).fk === fkN, 'G12. este aparelho solta a chave de antes logo depois (nada daqui precisa mais dela): velhas [] e nada só para abrir');
    /* --- o outro aparelho: algo daqui ainda na chave de antes = ainda não solta --- */
    const cifVelha = await linhaCom(VELHA, 1, FK0, 'Tardio de mentira');
    await bb.evaluate((cif) => CloudDriver.recs.set('vault|vTardio', { cif, baseCif: cif, vis: 'restrito', versao: 1, at: new Date().toISOString() }), cifVelha);
    await reabrirPeloPin(bb, PIN_B);
    conferir(JSON.stringify((await famDe(bb)).velhas) === '["' + FK0 + '"]' && (await outrasDe(bb)).includes(FK0), 'G12. o outro aparelho: com uma linha daqui ainda fechada com a de antes, abrir de novo NÃO solta');
    await bb.evaluate(() => { CloudDriver.recs.delete('vault|vTardio'); DB.col('vault').delete('vTardio'); });
    await bb.evaluate(async (fk) => {
      const k = Cofre.chaveDe(fk), r = await Vault.encryptBlob(new Blob([new TextEncoder().encode('anexo fG12v')], { type: 'text/plain' }), k);
      const meta = { id: 'fG12v', name: 'fG12v.txt', type: 'application/octet-stream', size: r.blob.size, vis: 'restrito', enc: { iv: r.iv, type: 'text/plain', fk }, chunks: 1 };
      await DB.driver.putFile('fG12v', r.blob, meta); await DB.put('files', meta, true);
    }, FK0);
    await reabrirPeloPin(bb, PIN_B);
    conferir(JSON.stringify((await famDe(bb)).velhas) === '["' + FK0 + '"]', 'G12. o outro aparelho: com um anexo daqui ainda na de antes, abrir de novo NÃO solta (e o anexo vai para a nova)');
    const arrumou = await ateA(async () => { const an = await anexosDe(bb, ['fG12v']); return an.fG12v.enc.fk === fkN && !an.fG12v.enc.antes && an.fG12v.txt === 'anexo fG12v'; }, 20000);
    await reabrirPeloPin(bb, PIN_B);
    const fb = await famDe(bb), ob = await outrasDe(bb), tb = await titulos(bb), anb = await anexosDe(bb, ['fG12b', 'fG12v']);
    conferir(arrumou && fb.fk === fkN && !fb.velhas.length && !ob.length && tb.v0 === 'Wi-Fi de casa' && Object.keys(tb).filter((k) => k !== '_em').length === 6 && anb.fG12b.txt === 'anexo fG12b' && anb.fG12v.txt === 'anexo fG12v',
      'G12. o outro aparelho, na próxima abertura (tudo daqui na nova): solta a chave de antes (velhas [] e nada só para abrir) e continua abrindo tudo, anexos também (' + JSON.stringify([fb, ob]) + ')');
  });

  /* ================= G12s (etapa E10): sem a função no banco, e quem não é chefe ================= */
  await parte('G12s', 'Sem a sol_giro_situacao / sol_descartar_chaves_antigas (o SQL da plataforma ainda não aplicado): o botão "Terminar a troca" fica desligado e o toque diz "Ainda não dá para terminar: falta uma atualização do SolverONE." (nunca "servidor"), e nada muda; a responsável nem vê o botão e o ACT direto ouve "Só um chefe…" sem perguntar ao banco', async (novo) => {
    const A = await novo('G12s-ana', { vp: 'celular' }), a = A.p;
    const C = await novo('G12s-bia', { vp: 'celular' }), c = C.p;
    await abertoComVelha(a, ANA, PIN_A);
    const rg = await girar(a);
    conferir(rg.ok, 'G12s. a troca terminou');
    M.semGiroSql = true;
    await avancado(a);
    const bt = await a.evaluate(() => { const b = document.querySelector('[data-act="conta.giro.descartar"]'); return b ? { dis: b.disabled, sem: ((document.querySelector('#giroSemSql') || {}).textContent || '').trim() } : null; });
    conferir(bt && bt.dis && bt.sem === '⏳ Ainda não dá: falta uma atualização do SolverONE.', 'G12s. sem a função no banco, "Terminar a troca" fica desligado, com "Ainda não dá: falta uma atualização do SolverONE." (' + JSON.stringify(bt) + ')');
    const foto0 = bancoTerm(), marca = M.log.length;
    const j = await tocarTerminar(a, true);
    conferir(j.tipo === 'falta' && j.txt.includes('Ainda não dá para terminar: falta uma atualização do SolverONE.') && j.txt.split('Ainda não dá para terminar').length === 2 && !/servidor/i.test(j.txt) && bancoTerm() === foto0 && !gravacoesDesde(marca).length,
      'G12s. o ACT direto: "Ainda não dá para terminar: falta uma atualização do SolverONE." (sem "servidor") e nada muda (' + j.txt.slice(0, 120) + ')');
    await fecharTerm(a);
    const d = await descartarDireto(a);
    conferir(d.motivo === 'servidor' && d.txt === 'Ainda não dá para terminar: falta uma atualização do SolverONE.' && bancoTerm() === foto0 && !gravacoesDesde(marca).length && !regBanco().descarte,
      'G12s. Giro.descartar() direto: o banco responde 404 → o mesmo texto; nenhuma versão apagada, o registro sem o descarte (' + JSON.stringify(d) + ')');
    M.semGiroSql = false;
    /* a responsável */
    await entrarOmni(c, BIA); await quieto(c);
    const mc = M.log.length;
    const bia = await c.evaluate(() => ({ html: Giro.terminarHtml(), pode: Giro.podeDescartar(), bot: Giro.botaoHtml(true) }));
    const jb = await tocarTerminar(c, true);
    conferir(!bia.html && !bia.pode && !bia.bot && jb.tipo === 'falta' && jb.txt.includes('Só um chefe da família pode fazer isso.') &&
      !M.log.slice(mc).some((l) => /sol_(giro_situacao|descartar_chaves_antigas)/.test(l.caminho)) && bancoTerm() === foto0,
      'G12s. a Bia (responsável): sem o botão; o ACT direto → "Só um chefe da família pode fazer isso.", sem perguntar ao banco, nada muda (' + jb.txt.slice(0, 100) + ')');
  });

  /* ================= G12p (etapa E10): C10 — a ponte no "Terminar a troca", pelo botão do fim ================= */
  await parte('G12p', 'C10: o fim da troca oferece "Terminar a troca"; um resumo velho da Saúde do Omni que ficou sem marcar não trava (o app marca e tenta de novo); um aviso velho que não é do Omni trava com "Há avisos da Saúde para o MoneyTRIO na versão antiga…" e nada é apagado; quando o MoneyTRIO lê, termina', async (novo) => {
    const A = await novo('G12p-ana', { vp: 'celular' }), a = A.p;
    await abertoComVelha(a, ANA, PIN_A); await vigiarAvisos(a);
    await pelaPilula(a);
    const fim = await esperar(a, () => [...document.querySelectorAll('.modal.giro')].some((m) => /A família está mais segura/.test(m.innerText)), null, 60000);
    const tf = await textoFim(a), fkN = linha('settings', 'giro').dados.para.fk;
    conferir(fim && tf.includes('Quando as Senhas da casa tiverem sido abertas nos seus outros aparelhos, nos dos outros chefes e responsáveis e no MoneyTRIO, toque em “Terminar a troca”.') && tf.includes('🧹 Terminar a troca (apagar as versões antigas)') && tf.includes('Depois disso, a versão antiga é apagada de vez: nada antigo abre mais as senhas'),
      'G12p. a janela do fim oferece "🧹 Terminar a troca" (D-E7), com o que fazer antes (' + tf.slice(-200) + ')');
    db.sol_ponte.push(msgPonte('pVelho', ANA));
    db.sol_ponte.push(msgPonte('pMoney', ANA, { de_app: 'moneytrio', para_app: 'omnilife-one', tipo: 'gastos' }));
    conferir(situacao().ponte_outra === 2, 'G12p. dois avisos não lidos fechados com a de antes (um resumo da Saúde do Omni, um do MoneyTRIO)');
    const ch0 = JSON.stringify(db.sol_grupo_chaves);
    await a.click('.modal.giro #fimTerminar');
    await esperar(a, () => !!document.querySelector('.modal.giro #giroTermPalavra') && ![...document.querySelectorAll('.modal.giro')].some((m) => /A família está mais segura/.test(m.innerText)), null, 20000);
    await confirmarTerminar(a); await digitarPin(a, PIN_A);
    await esperar(a, () => !!document.querySelector('.modal.giro #giroFalta'), null, 20000);
    const j = await janelaTerm(a);
    conferir(j.txt.includes('Há avisos da Saúde para o MoneyTRIO na versão antiga. Abra o MoneyTRIO pelo PIN e espere 1 minuto.') && !!ponteDe('pVelho').lido_em && !ponteDe('pMoney').lido_em &&
      JSON.stringify(db.sol_grupo_chaves) === ch0 && !regBanco().descarte,
      'C10. o resumo velho do Omni marcado e tentou de novo; o aviso que não é do Omni continua e trava: "Há avisos da Saúde para o MoneyTRIO na versão antiga…"; nada apagado (' + j.txt.slice(0, 140) + ')');
    await fecharTerm(a);
    ponteDe('pMoney').lido_em = agora();   /* o MoneyTRIO abriu e leu */
    await avancado(a);
    const j2 = await tocarTerminar(a);
    conferir(j2.tipo === 'confirma', 'G12p. lido o aviso, a confirmação abre');
    await confirmarTerminar(a); await digitarPin(a, PIN_A);
    const ok = await esperar(a, () => (window.__av || []).some((t) => /Pronto: a troca terminou/.test(t)), null, 20000);
    conferir(ok && versoes(ANA) === '2' && versoes(BIA) === '2' && regBanco().descarte && regBanco().descarte.fk === fkN, 'G12p. termina: só as versões em uso ficam');
  });

  /* ================= G12g (etapa E10): C9 — a troca "feito" regravada por um chefe ================= */
  await parte('G12g', 'C9: a troca "feito" gravada por último por uma responsável (o banco quer um chefe) — o chefe confirma e o app regrava a troca (CAS) e termina', async (novo) => {
    const A = await novo('G12g-ana', { vp: 'celular' }), a = A.p;
    await abertoComVelha(a, ANA, PIN_A); await vigiarAvisos(a);
    const rg = await girar(a);
    const rb = await rest(BIA, 'PATCH', docUrl('settings', 'giro'), { dados: Object.assign({}, linha('settings', 'giro').dados, { batida: agora() }) }, 'return=representation');
    conferir(rg.ok && rb.status === 200 && linha('settings', 'giro').atualizado_por === BIA && situacao().giro_ok === false, 'G12g. a troca "feito" foi gravada por último pela Bia: o banco não a aceita como conferida (giro_ok false)');
    await umaVolta(a); await avancado(a);
    const j = await tocarTerminar(a);
    conferir(j.tipo === 'confirma', 'G12g. a troca deste chefe está "feito" e é a do registro: a confirmação abre (o app sabe consertar)');
    const v0 = linha('settings', 'giro').versao;
    await confirmarTerminar(a); await digitarPin(a, PIN_A);
    const ok = await esperar(a, () => (window.__av || []).some((t) => /Pronto: a troca terminou/.test(t)), null, 20000), g = linha('settings', 'giro');
    conferir(ok && g.atualizado_por === ANA && g.versao === v0 + 1 && g.dados.estado === 'feito' && g.vis === 'restrito' && versoes(ANA) === '2' && regBanco().descarte,
      'G12g. regravou a troca (pela Ana, com a versão lida) e terminou (' + JSON.stringify([g.atualizado_por === ANA, g.versao - v0]) + ')');
  });

  /* ================= G12v (etapa E10): C11 — itens que não abrem impedem de terminar ================= */
  await parte('G12v', 'C11: depois da troca, um item que já não abria (a troca o deixou na chave de antes) impede de terminar: "Ainda há senhas na versão antiga…" + "1 item… já não abre… impede de terminar" com "Apagar os itens que não abrem" (só com o PIN); uma linha de outra chave nunca entra na lista para apagar', async (novo) => {
    const A = await novo('G12v-ana', { vp: 'celular' }), a = A.p;
    /* um item que já não abria antes da troca (estragado, na chave de antes): a troca o deixa como está (C11) */
    gravarDoc('vault', 'vQuebrada', { dados_cifrado: await linhaCom(new Uint8Array(crypto.randomBytes(32)), 1, FK0, 'Quebrada de mentira') });
    await abertoComVelha(a, ANA, PIN_A); await vigiarAvisos(a);
    const rg = await girar(a), fkN = linha('settings', 'giro').dados.para.fk;
    /* e uma linha de uma chave que este aparelho não conhece (outro aparelho) */
    gravarDoc('vault', 'vOutra', { dados_cifrado: await linhaCom(new Uint8Array(crypto.randomBytes(32)), 3, 'fk-de-outro', 'Outra de mentira') });
    const sv = situacao();
    conferir(rg.ok && rg.r.estranhas.includes('vQuebrada') && JSON.parse(linha('vault', 'vQuebrada').dados_cifrado).fk === FK0 && sv.vault_fora === 2,
      'G12v. depois da troca, 2 linhas vivas fora: a que já não abria (ficou na de antes) e uma de outra chave (' + JSON.stringify([rg.erro || 'ok', sv.vault_fora]) + ')');
    const foto0 = bancoTerm(), outra0 = JSON.stringify(linha('vault', 'vOutra')), marca = M.log.length;
    const d = await descartarDireto(a);
    conferir(d.motivo === 'vault' && d.txt === 'Ainda há senhas na versão antiga. Abra as Senhas da casa neste aparelho e espere 1 minuto.' && bancoTerm() === foto0, 'G12v. o banco, direto: descartar:vault → "Ainda há senhas na versão antiga…", nada muda (' + JSON.stringify(d) + ')');
    await avancado(a);
    const j = await tocarTerminar(a);
    conferir(j.tipo === 'falta' && j.txt.includes('Ainda há senhas na versão antiga. Abra as Senhas da casa neste aparelho e espere 1 minuto.') && j.txt.includes('1 item das Senhas da casa já não abre (estragou antes da troca) e impede de terminar. Se não precisa dele, apague.') && j.apagar,
      'G12v. o que falta, e "1 item… já não abre… impede de terminar" com "🗑 Apagar os itens que não abrem" (a linha de outra chave não conta) (' + j.txt.slice(0, 200) + ')');
    await a.click('.modal.giro #giroTermApagar');
    await a.waitForSelector('.modal #ppin', { timeout: 15000 });
    const pin = await a.evaluate(() => document.querySelector('.modal:has(#ppin)').innerText.replace(/\s+/g, ' '));
    await a.click('.modal:has(#ppin) [data-x]');
    await espere(400);
    conferir(/Vai apagar 1 item que não abre/.test(pin) && bancoTerm() === foto0 && !gravacoesDesde(marca).length, 'G12v. "Apagar…" pede o PIN; cancelar não muda nada');
    await tocarTerminar(a);
    await a.click('.modal.giro #giroTermApagar');
    await digitarPin(a, PIN_A);
    await esperar(a, () => !!document.querySelector('.modal.giro #giroFalta') && !document.querySelector('.modal #ppin'), null, 20000);
    const j2 = await janelaTerm(a), q = linha('vault', 'vQuebrada');
    conferir(q.apagado_em && q.dados_cifrado === null && JSON.stringify(linha('vault', 'vOutra')) === outra0 && j2.txt.includes('Ainda há senhas na versão antiga') && !j2.apagar && bancoTerm() === foto0,
      'G12v. com o PIN: o estragado apagado e sem o conteúdo; a linha de outra chave intacta (nunca oferecida para apagar); ainda falta ela');
    await fecharTerm(a);
    linha('vault', 'vOutra').apagado_em = agora();   /* o aparelho dela sumiu com ela (fora do app) */
    const j3 = await tocarTerminar(a);
    conferir(j3.tipo === 'confirma', 'G12v. sem nada fora, a confirmação abre');
    await confirmarTerminar(a); await digitarPin(a, PIN_A);
    const ok = await esperar(a, () => (window.__av || []).some((t) => /Pronto: a troca terminou/.test(t)), null, 20000);
    conferir(ok && versoes(ANA) === '2' && regBanco().descarte, 'G12v. termina');
  });

  /* ================= D8 (etapa E11, D-E8): qualquer chefe troca e termina a troca ================= */
  await parte('D8', 'D-E8: qualquer chefe troca e termina a troca — a Bia, feita chefe (quem criou a família é a Ana), vê o botão e troca; a nova vai embrulhada para os dois chefes; a Ana, o outro chefe, termina a troca', async (novo) => {
    db.sol_grupo_membros.find((m) => m.grupo_id === GID && m.user_id === BIA).papel = 'chefe';
    const C = await novo('D8-bia', { vp: 'celular' }), c = C.p;
    const A = await novo('D8-ana', { vp: 'computador' }), a = A.p;
    await abertoComVelha(c, BIA, PIN_B);
    await abertoComVelha(a, ANA, PIN_A);
    const dono = await c.evaluate(() => ({ role: S.role, dono: S.family.owner, eu: Conta.uid() }));
    await avancado(c);
    const bt = await botaoTrocar(c);
    conferir(dono.role === 'admin' && dono.dono !== dono.eu && bt && !bt.disabled, 'D8. a Bia é chefe (não criou a família) e vê o botão "Trocar a chave de segurança da família" ligado (' + JSON.stringify([dono.role, dono.dono === ANA, bt && bt.disabled]) + ')');
    const marca = M.log.length;
    const r = await girar(c);
    const gd = (linha('settings', 'giro') || {}).dados || {}, ini = M.log.slice(marca).find((l) => l.metodo === 'POST' && l.corpo && l.corpo.id === 'giro');
    const env = (ini && ini.corpo.dados.envelopes) || {};
    conferir(r.ok && gd.estado === 'feito' && gd.por === BIA && regBanco().giradoPor === BIA && regBanco().kv === 2 && Object.keys(env).sort().join() === [ANA, BIA].sort().join(),
      'D8. a Bia troca: "feito", por ela, e a reserva da troca embrulhada para os DOIS chefes (' + JSON.stringify([r.erro || 'ok', gd.por === BIA, Object.keys(env).length]) + ')');
    await a.evaluate(() => Cloud.poll());
    await esperar(a, (fk) => Cofre.fk === fk, (gd.para || {}).fk || null, 20000);
    const d = await descartarDireto(a);
    conferir(d.n > 0 && versoes(ANA) === '2' && versoes(BIA) === '2' && regBanco().descarte && regBanco().descarte.fk === (gd.para || {}).fk, 'D8. a Ana (o outro chefe) termina a troca que a Bia fez: as versões antigas saem, o registro anota (' + JSON.stringify(d) + ')');
  });

  /* ================= Revisão de segurança da 2.27.0 (S1–S4) ================= */
  const avisoGiro = (p) => p.evaluate(() => { const x = document.querySelector('#giroAviso'); return x ? x.innerText.replace(/\s+/g, ' ').trim() : ''; });
  const vaultERegistro = () => JSON.stringify([db.omni_docs.filter((d) => d.grupo_id === GID && d.colecao === 'vault').map((d) => [d.id, d.versao, d.dados_cifrado, d.apagado_em]), regBanco()]);

  /* S1 (a parte que o app fecha sozinho): a regra "a versão só sobe" (C4) também no "Continuar". O resto do S1 — uma troca forjada
     pelo próprio banco, com versão maior e saindo da chave do registro — precisa de prova de quem embrulhou (PENDENCIAS) */
  await parte('RS1', 'Revisão (segurança S1): uma troca pela metade que este aparelho não começou, escrita por fora (o banco, ou uma responsável sem o SQL do Omni) com a "vez" e o envelope da Ana, e que não anda para a frente — a nova com versão que não é maior que a do registro, ou saindo de outra chave que não a do registro —: "Continuar" para com "Algo nas Senhas da casa não confere" e nada muda (C4: a versão só sobe)', async (novo) => {
    const A = await novo('RS1-ana', { vp: 'celular' }), a = A.p;
    await abertoComVelha(a, ANA, PIN_A);
    const ids = await a.evaluate(async () => { const L = await Cofre.local(); return { ap: Giro.meuAp(L), nav: Devices.myId() }; });
    const pubA = db.sol_chave_publica.find((k) => k.user_id === ANA).chave_publica;
    for (const [nome, para, de] of [['a nova com a mesma versão (kv 1)', { kv: 1, fk: 'fk-de-fora' }, { kv: 1, fk: FK0 }], ['saindo de outra chave que não a do registro', { kv: 2, fk: 'fk-de-fora2' }, { kv: 1, fk: 'fk-outra' }]]) {
      const X = new Uint8Array(crypto.randomBytes(32));
      gravarDoc('settings', 'giro', { vis: 'restrito', dados: trocaNoBanco({ estado: 'recifrando', por: ANA, ap: ids.ap, nav: ids.nav, apNome: 'Celular', de, para, envelopes: { [ANA]: await embrulhar(pubA, X, para.kv, para.fk) } }) }, BIA);
      await a.evaluate(async () => { await Cloud.poll(); go('house', 'vault'); render(); });
      await espere(300);
      const antes = vaultERegistro(), marca = M.log.length, c = await cartaoGiro(a);
      const r = await girar(a, {});
      const pv = M.log.slice(marca).filter((l) => ['PATCH', 'POST'].includes(l.metodo) && /omni_docs/.test(l.caminho) && /vault|cofre/.test(l.caminho + JSON.stringify(l.corpo || {}))).length;
      const fam = await famDe(a), outras = await outrasDe(a), fk = await a.evaluate(() => Cofre.fk);
      conferir(/Continuar/.test(c) && !r.ok && r.motivo === 'estranho' && /não confere/.test(r.erro) && vaultERegistro() === antes && !pv && !comFk(para.fk).length && fk === FK0 && fam.fk === FK0 && !fam.prox && !outras.includes(para.fk),
        'RS1. ' + nome + ': "Continuar" para ("Algo nas Senhas da casa não confere"), nenhuma linha nem o código de emergência mudam, o registro fica, e a chave de fora não entra neste aparelho (' + JSON.stringify([r.motivo, r.erro, pv, comFk(para.fk).length, fk, fam]) + ')');
    }
    /* e no virar: o registro que, no meio da troca, passou a dizer uma versão maior (com a mesma chave: "a versão mente") nunca desce */
    gravarDoc('settings', 'giro', { vis: 'restrito', dados: trocaNoBanco({ estado: 'desistiu', por: ANA }) }, ANA);
    await a.evaluate(async () => { await Cloud.poll(); Giro.PAUSA_MS = 150; });
    M.depoisDe = { 'PATCH vault': 2, acao: () => { const d = regBanco(); gravarDoc('settings', 'cofre', { dados: Object.assign(d, { kv: 5 }) }, BIA); } };
    const rv = await girar(a);
    const rg = regBanco();
    conferir(!rv.ok && rv.motivo === 'registro' && rg.fk === FK0 && rg.kv === 5, 'RS1. no virar, o registro com versão maior no meio da troca não desce: a troca para ("não confere") e a versão fica 5 (' + JSON.stringify([rv.motivo, rg.fk, rg.kv]) + ')');
  });

  /* S2: a troca de um chefe que não volta não prende a família */
  await parte('RS2', 'Revisão (segurança S2): o chefe que começou a troca some no meio (a nova já com a família): a outra chefe (D-E8) não fica presa — antes do prazo de outro chefe, só o aviso; parada há mais que ele, "Continuar neste aparelho" termina com a MESMA nova, e ela vê as 6; a troca de outro chefe parada ainda no "preparado" segue o C16 (se desfaz sozinha), sem esse cartão', async (novo) => {
    db.sol_grupo_membros.find((m) => m.grupo_id === GID && m.user_id === BIA).papel = 'chefe';
    const A = await novo('RS2-ana', { vp: 'celular' }), a = A.p;
    const C = await novo('RS2-bia', { vp: 'celular' }), c = C.p;
    await abertoComVelha(a, ANA, PIN_A);
    await abertoComVelha(c, BIA, PIN_B);
    const ids0 = idsVault();
    let fechou = null;
    M.depoisDe = { 'PATCH vault': 3, acao: () => { fechou = A.ctx.close().catch(() => {}); } };
    girar(a).catch(() => null);
    await ate(() => fechou, 20000); await fechou; await espere(300);
    const g1 = JSON.parse(JSON.stringify(linha('settings', 'giro').dados)), fkN = g1.para.fk, entregues = versoes(ANA) + '/' + versoes(BIA);
    conferir(g1.estado === 'recifrando' && g1.por === ANA && comFk(fkN).length >= 3 && comFk(fkN).length < 6 && entregues === '1,2/1,2', 'RS2. a Ana some no meio das linhas; a nova já está com as duas chefes (' + JSON.stringify([g1.estado, comFk(fkN).length, entregues]) + ')');
    /* parada há mais que o prazo do mesmo chefe, mas não do de OUTRO chefe: a Bia só vê o aviso e não assume */
    await c.evaluate(async () => { Giro.PARADO_MS = 1000; Giro.ASSUMIR_MS = 300; await Cloud.poll(); go('house', 'vault'); render(); });
    await espere(1300); await c.evaluate(() => render()); await espere(300);
    const c0 = await cartaoGiro(c), av0 = await avisoGiro(c), r0 = await c.evaluate(() => Giro.assumir());
    conferir(!c0 && /parou no meio/.test(av0) && r0.motivo === 'trocando' && linha('settings', 'giro').dados.por === ANA,
      'RS2. pouco depois, a Bia só vê "…parou no meio…" e não assume a troca da Ana (' + JSON.stringify([c0, av0, r0.motivo]) + ')');
    /* parada há mais que o prazo de outro chefe: o cartão "Continuar neste aparelho" (no lugar do aviso) */
    await c.evaluate(() => { Giro.OUTRO_MS = 1500; });
    await espere(1700); await c.evaluate(async () => { await Cloud.poll(); render(); }); await espere(300);
    const c1 = await cartaoGiro(c), av1 = await avisoGiro(c);
    conferir(/Outro chefe da família começou a troca de segurança/.test(c1) && /Continuar neste aparelho/.test(c1) && !!(await c.$('#giroCartao [data-act="conta.giro.assumir"]')) && !av1,
      'RS2. parada há mais que o prazo: a Bia vê o cartão com "Continuar neste aparelho" (e não o aviso) (' + JSON.stringify([c1, av1]) + ')');
    const marca = M.log.length;
    await c.click('#giroCartao [data-act="conta.giro.assumir"]');
    const fim = await ateA(async () => linha('settings', 'giro').dados.estado === 'feito', 40000);
    const gd = linha('settings', 'giro').dados, n = await chaveDaPessoa(BIA);
    conferir(fim && gd.para.fk === fkN && gd.para.kv === 2 && gd.por === BIA && comFk(fkN).length === 6 && !comFk(FK0).length && regBanco().fk === fkN && regBanco().kv === 2,
      'RS2. "Continuar neste aparelho" termina com a MESMA nova (kv 2), agora pela Bia; nenhuma linha na de antes (' + JSON.stringify([gd.estado, gd.para, gd.por === BIA]) + ')');
    let tt = 0; for (const x of comFk(fkN)) if ((await tituloDe(n.raw, x.dados_cifrado)) === ITENS[+x.id.slice(1)][1]) tt++;
    const posts = M.log.slice(marca).filter((l) => l.metodo === 'POST' && l.corpo && l.corpo.id === 'giro');
    conferir(idsVault() === ids0 && tt === 6 && !posts.length, 'RS2. os mesmos ids, os títulos iguais e nenhuma troca nova');
    await esperar(c, () => !Giro.rodando && Cofre.aberto(), null, 10000);
    const st = await c.evaluate(async () => { const t = []; for (const v of DB.all('vault')) { if (v.id === '_em') continue; try { t.push((await Vault.decObj(v.enc)).title); } catch (e) {} } return { vis: t.length, emCurso: Giro.emCurso(), fk: Cofre.fk }; });
    conferir(st.vis === 6 && !st.emCurso && st.fk === fkN, 'RS2. a Bia vê as 6 e a família não está mais presa (' + JSON.stringify(st) + ')');
    /* C16 intacto: de outro chefe, parada no "preparado" (nada mudou ainda), mesmo há mais que o prazo: sem cartão, ela se desfaz sozinha */
    const gp = gravarDoc('settings', 'giro', { vis: 'restrito', dados: trocaNoBanco({ estado: 'preparado', por: ANA, apNome: 'Celular da Ana', de: { kv: 2, fk: fkN }, para: { kv: 3, fk: 'fk-x' } }) }, ANA);
    gp.atualizado_em = new Date(Date.now() - 2 * 3600e3).toISOString();
    await c.evaluate(async () => { const b = await Giro.ler(); await CloudDriver.aceitar('settings', 'giro', b.giro, true); go('house', 'vault'); render(); });
    await espere(300);
    const c2 = await cartaoGiro(c), av2 = await avisoGiro(c), r2 = await c.evaluate(() => Giro.assumir());
    conferir(!c2 && /se desfaz sozinha/.test(av2) && r2.motivo === 'trocando' && linha('settings', 'giro').dados.por === ANA,
      'RS2. no "preparado", a troca de outro chefe segue o C16: sem cartão, "…se desfaz sozinha…", e não se assume (' + JSON.stringify([c2, av2, r2.motivo]) + ')');
  });

  /* S3: depois de "Terminar a troca", o app de antes devolve a chave antiga */
  await parte('RS3', 'Revisão (segurança S3): depois de "Terminar a troca", uma sessão do app de antes (2.26, que não acompanha a troca) entrega a chave antiga de novo, com versão maior — também para quem entrou depois: o primeiro aparelho atualizado que libera percebe, entrega a de agora, avisa os chefes e responsáveis (histórico) e o "Terminar a troca" volta, com o porquê; terminar de novo apaga o que foi entregue', async (novo) => {
    const A = await novo('RS3-ana', { vp: 'computador' }), a = A.p;
    await abertoComVelha(a, ANA, PIN_A);
    const r = await girar(a), d = await descartarDireto(a), fkN = regBanco().fk;
    conferir(r.ok && d.n > 0 && regBanco().descarte && regBanco().descarte.fk === fkN, 'RS3. a troca e o "Terminar a troca" (' + JSON.stringify([r.erro || 'ok', d]) + ')');
    /* a pessoa nova entra DEPOIS do descarte (a ordem D-E11) */
    db.sol_grupo_membros.find((m) => m.grupo_id === GID && m.user_id === DAVI).papel = 'responsavel';
    /* uma sessão do app de antes, da Bia, aberta com a chave de antes: o _distribuir dela compara só o fk de cada pessoa no registro
       com a chave dela, embrulha a de antes de novo (versão + 1) para cada chefe e responsável e marca o registro */
    const reg = regBanco();
    for (const uid of [ANA, BIA, DAVI]) {
      const k = db.sol_chave_publica.find((x) => x.user_id === uid).chave_publica;
      const vs = db.sol_grupo_chaves.filter((x) => x.grupo_id === GID && x.user_id === uid).map((x) => x.versao), seq = (vs.length ? Math.max(...vs) : 0) + 1;
      db.sol_grupo_chaves.push({ grupo_id: GID, user_id: uid, versao: seq, chave_embrulhada: await embrulhar(k, M.cfVelha, 1, FK0), embrulhada_por: BIA, criado_em: agora() });
      reg.membros[uid] = { kid: k.kid, seq, fk: FK0 };
    }
    gravarDoc('settings', 'cofre', { dados: reg }, BIA);
    /* o aparelho atualizado da Ana, com as Senhas abertas: a próxima liberação */
    await vigiarAvisos(a);
    const marca = M.log.length, hist0 = db.omni_historico.filter((h) => h.acao === 'cofre.velha').length;
    await distribuirJa(a);
    await ate(() => db.omni_historico.filter((h) => h.acao === 'cofre.velha').length > hist0, 5000); await espere(300);
    const reg2 = regBanco(), ent = await entregas(marca);
    conferir([ANA, BIA, DAVI].every((u) => ent.some((e) => e.user === u && e.fk === fkN && e.kv === 2)) && !ent.some((e) => e.fk === FK0) && Object.values(reg2.membros).every((m) => m.fk === fkN),
      'RS3. a de agora vai de novo para os três (Ana, Bia e o Davi, que entrou depois), nunca a de antes; o registro volta a dizer a de agora (' + JSON.stringify(ent) + ')');
    conferir(!!(reg2.descarte && reg2.descarte.fk === fkN && reg2.descarte.velha) && db.omni_historico.filter((h) => h.acao === 'cofre.velha').length === hist0 + 1 && /desatualizado/.test(await avisos(a)),
      'RS3. o registro anota que o "Terminar a troca" precisa ser feito de novo, o histórico avisa e este aparelho mostra o aviso (' + JSON.stringify([reg2.descarte, await avisos(a)]) + ')');
    const tx = await a.evaluate(() => ({ sens: GOV_SENS.includes('cofre.velha'), pt: AUDIT_TXT('cofre.velha'), aps: Giro.T.roteiroAps, depois: Giro.T.depois }));
    conferir(tx.sens && /desatualizado/.test(tx.pt) && /Terminar a troca/.test(tx.pt) && /da família/.test(tx.aps) && /outros chefes e responsáveis/.test(tx.aps) && /outros chefes e responsáveis/.test(tx.depois),
      'RS3. o aviso vai aos chefes e responsáveis (GOV_SENS) e os textos pedem os aparelhos de TODOS os chefes e responsáveis atualizados, não só os do chefe (' + JSON.stringify(tx) + ')');
    await umaVolta(a); await avancado(a);
    const av = await a.evaluate(() => ({ bt: !!document.querySelector('[data-act="conta.giro.descartar"]'), nota: ((document.querySelector('#giroTerminar') || {}).innerText || '').replace(/\s+/g, ' ') }));
    conferir(av.bt && /desatualizado/.test(av.nota), 'RS3. no Avançado, "Terminar a troca" volta, com o porquê (' + JSON.stringify(av) + ')');
    /* terminar de novo: o que a sessão de antes entregou sai; o Davi fica só com a de agora */
    const d2 = await descartarDireto(a);
    const kd = []; for (const x of db.sol_grupo_chaves.filter((y) => y.grupo_id === GID && y.user_id === DAVI)) { const k = await desembrulhar(DAVI, x.chave_embrulhada); kd.push(k.fk); }
    const velhasAinda = []; for (const x of db.sol_grupo_chaves.filter((y) => y.grupo_id === GID)) { try { const k = await desembrulhar(x.user_id, x.chave_embrulhada); if (k.fk === FK0) velhasAinda.push(x.user_id + ':' + x.versao); } catch (e) {} }
    const reg3 = regBanco();
    conferir(d2.n > 0 && kd.length && kd.every((f) => f === fkN) && !velhasAinda.length && reg3.descarte && reg3.descarte.fk === fkN && !reg3.descarte.velha,
      'RS3. "Terminar a troca" de novo apaga o que a sessão de antes entregou: o Davi fica só com a de agora, ninguém com a de antes, e o registro anota o descarte limpo (' + JSON.stringify([d2, kd, velhasAinda]) + ')');
    await distribuirJa(a);
    conferir(db.omni_historico.filter((h) => h.acao === 'cofre.velha').length === hist0 + 1, 'RS3. com o registro em dia, outra liberação não avisa de novo');
  });

  /* S4: o código de emergência não fica na memória do Fundo à toa */
  await parte('RS4', 'Revisão (segurança S4): o código de emergência digitado sai da memória (o "op" que o "Tentar de novo" do Fundo guarda) também quando a troca para antes do passo dele por um motivo que tentar de novo não resolve — já trocando em outro aparelho, falta a atualização do SolverONE —; com um motivo que se resolve (as Senhas fechadas), ele fica para o "Tentar de novo"', async (novo) => {
    const A = await novo('RS4-ana', { vp: 'celular' }), a = A.p;
    await abertoComVelha(a, ANA, PIN_A);
    const tenta = () => a.evaluate(async (cod) => { window.__op = { novo: true, codigoEm: cod }; try { await Giro.executar(() => {}, {}, window.__op); return { ok: true, op: Object.keys(window.__op) }; } catch (e) { return { motivo: e.giro || null, op: Object.keys(window.__op) }; } }, CODIGO_EM);
    gravarDoc('settings', 'giro', { vis: 'restrito', dados: trocaNoBanco({ por: ANA }) }, ANA);
    await a.evaluate(async () => { await Cloud.poll(); });
    const r1 = await tenta();
    gravarDoc('settings', 'giro', { vis: 'restrito', dados: trocaNoBanco({ estado: 'desistiu', por: ANA }) }, ANA);
    M.semGiroSql = true;
    const r2 = await tenta();
    M.semGiroSql = false;
    await a.evaluate(() => { Cofre.trancar(); render(); });
    const r3 = await tenta();
    conferir(r1.motivo === 'trocando' && !r1.op.includes('codigoEm') && r2.motivo === 'semSql' && !r2.op.includes('codigoEm'),
      'RS4. "já trocando em outro aparelho" e "falta uma atualização do SolverONE": o código sai do op (' + JSON.stringify([r1, r2]) + ')');
    conferir(r3.motivo === 'fechado' && r3.op.includes('codigoEm'), 'RS4. as Senhas fechadas (resolve-se abrindo): o código fica para o "Tentar de novo" (' + JSON.stringify(r3) + ')');
    conferir(!linha('settings', 'giro').dados.envelopes || !Object.keys(linha('settings', 'giro').dados.envelopes).length, 'RS4. nada começou');
  });

  /* ================= revisão de dados da 2.27.0 (D1–D4) ================= */
  /* D1: a cópia (com arquivos) feita ANTES da troca, restaurada DEPOIS ("Juntar", o único modo na nuvem) */
  await parte('RD1', 'Revisão (dados D1): restaurar depois da troca uma cópia com arquivos feita antes não estraga os anexos que a troca já passou para a chave nova (nem antes nem depois de "Terminar a troca"); um arquivo que falta neste aparelho e cuja ficha é a da cópia continua voltando', async (novo) => {
    const A = await novo('RD1-ana', { vp: 'computador' }), a = A.p;
    await abertoComVelha(a, ANA, PIN_A);
    const ids = ['fRD1fam', 'fRD1semfk', 'fRD1fora'];
    await anexar(a, [['fRD1fam', 'familia'], ['fRD1semfk', 'semfk'], ['fRD1fora', 'outro']]);
    const bk = await a.evaluate(() => backupJSON(true));
    const r = await girar(a);
    const an1 = await anexosDe(a, ids), fkN = regBanco().fk;
    conferir(r.ok && an1.fRD1fam.txt === 'anexo fRD1fam' && an1.fRD1semfk.txt === 'anexo fRD1semfk' && an1.fRD1fam.enc.fk === fkN && an1.fRD1semfk.enc.fk === fkN && !an1.fRD1fora.enc.fk,
      'RD1. a troca passou os dois anexos da família para a nova (o de fora ficou como estava) (' + JSON.stringify([r.erro || 'ok', an1.fRD1fam.enc, an1.fRD1semfk.enc]) + ')');
    /* o arquivo de fora some deste aparelho (a ficha fica): a cópia o traz de volta */
    await a.evaluate(() => DB.driver.delFile('fRD1fora'));
    const restaurar = () => restaurarCopia(a, bk);
    const rs = await restaurar();
    const an2 = await anexosDe(a, ids);
    conferir(rs && rs.modo === 'juntar' && an2.fRD1fam.txt === 'anexo fRD1fam' && an2.fRD1semfk.txt === 'anexo fRD1semfk',
      'RD1. restaurada a cópia de antes ("Juntar"), ainda com a de antes no aparelho: os dois anexos da família continuam abrindo (' + JSON.stringify([an2.fRD1fam.txt, an2.fRD1semfk.txt]) + ')');
    conferir(igual(an2.fRD1fam.bytes, an1.fRD1fam.bytes) && igual(an2.fRD1semfk.bytes, an1.fRD1semfk.bytes) && an2.fRD1fam.enc.iv === an1.fRD1fam.enc.iv && an2.fRD1fam.enc.fk === fkN,
      'RD1. o arquivo e a ficha de cada um são os de depois da troca (a cópia não os trocou pelos de antes)');
    conferir(!!an2.fRD1fora.bytes && igual(an2.fRD1fora.bytes, an1.fRD1fora.bytes), 'RD1. o arquivo que faltava neste aparelho (a ficha é a da cópia) voltou da cópia');
    /* "Terminar a troca" e este aparelho solta a de antes: restaurar de novo também não estraga */
    const d = await descartarDireto(a);
    await a.evaluate(() => Giro.soltarVelhas());
    const out = await outrasDe(a);
    await restaurar();
    const an3 = await anexosDe(a, ids);
    conferir(d.n > 0 && !out.length && an3.fRD1fam.txt === 'anexo fRD1fam' && an3.fRD1semfk.txt === 'anexo fRD1semfk' && igual(an3.fRD1fam.bytes, an1.fRD1fam.bytes),
      'RD1. depois de "Terminar a troca" (a de antes já solta), restaurar a mesma cópia de novo: os dois continuam abrindo (' + JSON.stringify([d, out, an3.fRD1fam.txt, an3.fRD1semfk.txt]) + ')');
  });

  /* D2: a troca parada depois de a nova sair para a família, sem o chefe que começou (o único aparelho dele sumiu) */
  await parte('RD2', 'Revisão (dados D2): a troca da Ana para no meio das senhas e o único aparelho dela some; a Bia (responsável) já tem a nova (C5): as senhas já trocadas continuam aparecendo para ela (a nova só para ABRIR: nada fechado com ela, nada gravado), também depois de fechar e abrir pelo PIN; uma troca que não sai da chave daqui não entra; os textos não prometem o que não dá', async (novo) => {
    const A = await novo('RD2-ana', { vp: 'celular' }), a = A.p;
    const B = await novo('RD2-bia', { vp: 'computador' }), b = B.p;
    await abertoComVelha(a, ANA, PIN_A);
    await abertoComVelha(b, BIA, PIN_B);
    let fechou = null;
    M.depoisDe = { 'PATCH vault': 3, acao: () => { fechou = A.ctx.close().catch(() => {}); } };
    girar(a).catch(() => null);
    await ate(() => fechou, 20000); await fechou; await espere(300);
    const g1 = linha('settings', 'giro').dados, fkN = g1.para.fk, feitas = comFk(fkN).length, kb = await chaveDaPessoa(BIA);
    conferir(g1.estado === 'recifrando' && feitas >= 3 && feitas < 6 && kb && kb.fk === fkN, 'RD2. o aparelho da Ana sumiu com ' + feitas + ' de 6 na nova; a Bia já tem a nova em sol_grupo_chaves (C5)');
    /* três dias depois */
    const gl = linha('settings', 'giro'); gl.atualizado_em = new Date(Date.now() - 3 * 24 * 3600e3).toISOString(); gl.versao++;
    const L0 = await b.evaluate(async () => JSON.stringify(await Cofre.local()));
    const marca = M.log.length;
    /* (a cópia da troca neste aparelho com a hora do banco: o pull pela data não traz de novo uma linha com a data mudada para trás) */
    await b.evaluate(async () => { const x = await Giro.ler(); await CloudDriver.aceitar('settings', 'giro', x.giro, true); await Cloud.poll(); go('house', 'vault'); render(); });
    await umaVolta(b); await espere(500);
    const vistos = async () => { const t = await titulos(b); return ITENS.filter((x, i) => t['v' + i] === x[1]).length; };
    const v1 = await vistos();
    const st = await b.evaluate(async () => ({ fk: Cofre.fk, outras: Cofre.outras.map((o) => o.fk), aviso: ((document.querySelector('#giroAviso') || {}).innerText || '').replace(/\s+/g, ' ').trim() }));
    conferir(v1 === 6, 'RD2. a Bia vê as 6 senhas, também as ' + feitas + ' que a troca já passou para a nova (' + v1 + ' de 6)');
    conferir(st.fk === FK0 && st.outras.includes(fkN) && (await b.evaluate(async () => JSON.stringify(await Cofre.local()))) === L0 && !gravacoesDesde(marca).length,
      'RD2. a nova só ABRE: a chave que fecha continua a de antes, o cadeado deste aparelho igual byte a byte e nada gravado no banco (' + JSON.stringify([st.fk, st.outras, gravacoesDesde(marca).length]) + ')');
    conferir(st.aviso === '🔄 A troca de segurança parou no meio. Um chefe da família precisa continuar (o que começou ou outro chefe).', 'RD2. o aviso para a Bia não diz que só o chefe que começou pode continuar (' + st.aviso + ')');
    /* fechar e abrir pelo PIN: continuam aparecendo já ao abrir (sem esperar o Cloud.poll, parado aqui de propósito) */
    await b.evaluate(() => { window.__poll = Cloud.poll; Cloud.poll = async () => {}; Cofre.trancar(); render(); });
    const ab = await abrirPeloPin(b, PIN_B);
    await esperar(b, (fk) => Cofre.outras.some((o) => o.fk === fk), fkN, 5000);
    await b.evaluate(() => { go('house', 'vault'); render(); }); await espere(300);
    const v2 = await vistos();
    await b.evaluate(() => { Cloud.poll = window.__poll; });
    conferir(ab && ab.ok && v2 === 6, 'RD2. fechada e aberta de novo pelo PIN: as 6 continuam aparecendo, já ao abrir (' + v2 + ' de 6)');
    /* uma troca que não sai da chave deste aparelho (ou cuja versão não sobe) não entra no chaveiro (C4) */
    const g2 = linha('settings', 'giro'); g2.dados = Object.assign({}, g2.dados, { de: { kv: 1, fk: 'fk-de-outra' } }); g2.versao++;
    await b.evaluate(async () => { const x = await Giro.ler(); await CloudDriver.aceitar('settings', 'giro', x.giro, true); Cofre.trancar(); render(); });
    await abrirPeloPin(b, PIN_B); await umaVolta(b); await espere(500);
    const o2 = await outrasDe(b);
    conferir(!o2.includes(fkN) && (await vistos()) === 6 - feitas, 'RD2. uma troca que não sai da chave deste aparelho: a nova não entra (' + JSON.stringify(o2) + ')');
    /* o aviso C5.2 conta o que pode acontecer com a família */
    const sc = await b.evaluate(() => Giro.T.semCaminho);
    conferir(/não houver outro chefe/.test(sc) && /a troca não tem como terminar/.test(sc) && /aprovar aparelhos novos/.test(sc), 'RD2. o aviso de um aparelho só (C5.2) diz o que acontece com a família se ele sumir no meio');
  });

  /* D3: a Saúde fica só no aparelho (NUVEM_LOCAL): o resumo da Bia (no aparelho dela) não pode se perder na troca da Ana */
  await parte('RD3', 'Revisão (dados D3): o resumo da Saúde que o aparelho da Bia mandou (e o MoneyTRIO ainda não leu) sai da fila na troca da Ana, e o reenvio do fim leva só a Saúde do aparelho da Ana; ao adotar a chave nova, cada outro aparelho com algo da Saúde manda de novo o resumo DELE, com a nova — aberto (no Cloud.poll) ou fechado (ao abrir pelo PIN) — e um aparelho sem nada da Saúde não manda nada', async (novo) => {
    const A = await novo('RD3-ana', { vp: 'celular' }), a = A.p;
    const B = await novo('RD3-bia', { vp: 'computador' }), b = B.p;
    const P = await novo('RD3-ana-pc', { vp: 'computador' }), pc = P.p;
    const T = await novo('RD3-ana-tab', { vp: 'computador' }), tab = T.p;
    await abertoComVelha(a, ANA, PIN_A);
    await abertoComVelha(b, BIA, PIN_B);
    await abertoComVelha(pc, ANA, PIN_A);
    await abertoComVelha(tab, ANA, PIN_A);
    await ligarSaude(a);
    for (const x of [b, pc, tab]) { await x.evaluate(() => Cloud.poll()); await esperar(x, () => SaudeMT.ligado(), null, 15000); }
    /* a Bia (no aparelho dela) e o computador da Ana põem o plano e o médico de alguém; os dois resumos vão (com a de antes) e
       esperam o MoneyTRIO. O celular (que vai trocar) e o tablet da Ana não têm nada da Saúde */
    const m0 = M.log.length;
    const saude = (p, op, med) => p.evaluate(async ([op, med]) => { const x = People.list()[0]; await DB.put('health', { id: x.id, plan: { operator: op, valid: '2027-05-01' }, doctor: med }, true); SaudeMT.agendar(); }, [op, med]);
    await saude(b, 'Plano da Bia', 'Dra. Bia'); await saude(pc, 'Plano do computador', 'Dr. Computador');
    await ateA(async () => enviosDesde(m0).length >= 2, 10000);
    const velhos = db.sol_ponte.filter((x) => x.tipo === 'saude-resumo').map((x) => x.id);
    const temNaAna = await a.evaluate(() => People.list().some((p) => ((DB.get('health', p.id) || {}).plan || {}).operator));
    conferir(velhos.length === 2 && db.sol_ponte.every((x) => !x.lido_em) && !temNaAna, 'RD3. os dois resumos (da Bia e do computador da Ana) esperam o MoneyTRIO; o celular da Ana, que vai trocar, não tem nada da Saúde (a Saúde é de cada aparelho)');
    await pc.evaluate(() => { Cofre.trancar(); render(); });
    const m1 = M.log.length;
    const r = await girar(a);
    const fkN = regBanco().fk;
    /* a Bia e o tablet, abertos: adotam no Cloud.poll. O computador, fechado: adota ao abrir pelo PIN */
    for (const x of [b, tab]) { await x.evaluate(() => Cloud.poll()); await esperar(x, (fk) => Cofre.fk === fk, fkN, 20000); }
    const ab = await abrirPeloPin(pc, PIN_A); await esperar(pc, (fk) => Cofre.fk === fk, fkN, 20000);
    const naNova = (x) => { try { return JSON.parse(x.dados.cif).fk === fkN; } catch (e) { return false; } };
    await ateA(async () => db.sol_ponte.filter((x) => !velhos.includes(x.id) && naNova(x)).length >= 3, 12000);
    await espere(2500);
    const n = await chaveDaPessoa(ANA), naoLidas = db.sol_ponte.filter((x) => x.tipo === 'saude-resumo' && !x.lido_em);
    const abertos = [];
    for (const x of naoLidas) { try { abertos.push({ user: x.user_id, r: JSON.parse(new TextDecoder().decode(await decifrar(n.raw, JSON.parse(x.dados.cif)))) }); } catch (e) { abertos.push({ user: x.user_id, r: null }); } }
    const com = (op, med) => abertos.filter((x) => x.r && (x.r.pessoas || []).some((p) => p.operadora === op && p.medico === med));
    const resumo = JSON.stringify(abertos.map((x) => [x.user === BIA ? 'Bia' : 'Ana', x.r && x.r.pessoas.map((p) => p.operadora)]));
    conferir(r.ok && velhos.every((id) => !!db.sol_ponte.find((x) => x.id === id).lido_em) && com('Plano da Bia', 'Dra. Bia').length === 1 && com('Plano da Bia', 'Dra. Bia')[0].user === BIA,
      'RD3. a Bia, aberta (adota no Cloud.poll): o MoneyTRIO ainda recebe o plano que ela pôs no aparelho dela — um resumo dela, não lido, com a nova (' + resumo + ')');
    conferir(ab && ab.ok && com('Plano do computador', 'Dr. Computador').length === 1, 'RD3. o computador da Ana, fechado durante a troca (adota ao abrir pelo PIN): o resumo dele vai de novo, com a nova (' + resumo + ')');
    const env = enviosDesde(m1);
    conferir(env.every((x) => x.fk === fkN) && env.filter((x) => x.user === BIA).length === 1 && env.filter((x) => x.user === ANA).length === 2,
      'RD3. nada foi mandado com a de antes; a Bia uma vez e a Ana duas (o reenvio do fim, do celular, e o computador): o tablet, sem nada da Saúde, não mandou nada ao adotar (' + JSON.stringify(env) + ')');
  });

  /* D4: o que a cópia de antes da troca traz de volta (e o que o aviso e os textos dizem) */
  await parte('RD4', 'Revisão (dados D4): uma cópia feita antes da troca, restaurada depois (ainda sem "Terminar a troca"): o item apagado e o código de emergência de antes não voltam — e nada fica preso só neste aparelho —, o aviso diz quantos não voltaram (não "restaurados ✓"); os textos dizem que as cópias de antes deixam de servir logo que a troca acontece, também para os anexos protegidos', async (novo) => {
    const A = await novo('RD4-ana', { vp: 'computador' }), a = A.p;
    await abertoComVelha(a, ANA, PIN_A);
    const bk = await a.evaluate(() => backupJSON(false));
    await a.evaluate(() => DB.del('vault', 'v3')); await subir(a);
    const r = await girar(a);
    conferir(r.ok && !!linha('vault', 'v3').apagado_em && !!linha('vault', '_em').apagado_em && (await outrasDe(a)).includes(FK0),
      'RD4. a cópia é de antes; o v3 foi apagado depois dela; a troca terminou sem o código (o de emergência deixou de valer) e a de antes ainda está neste aparelho (' + (r.erro || 'ok') + ')');
    await vigiarAvisos(a);
    const banco0 = JSON.stringify(db.omni_docs.filter((d) => d.grupo_id === GID && d.colecao === 'vault'));
    const rs = await restaurarCopia(a, bk);
    await subir(a); await espere(500);
    const st = await a.evaluate(() => ({ v3: !!CloudDriver.recs.get('vault|v3'), v3fila: CloudDriver.fila.has('vault|v3'), emFila: CloudDriver.fila.has('vault|_em'), emTela: !!DB.col('vault').get('_em'), legado: Cofre.legado().size }));
    const av = await avisos(a);
    conferir(rs && rs.modo === 'juntar' && !st.v3 && !st.v3fila && !st.legado, 'RD4. o item apagado não volta e nada fica guardado só neste aparelho, sem subir nem aparecer (' + JSON.stringify(st) + ')');
    conferir(!st.emFila && !st.emTela, 'RD4. o código de emergência de antes (de outra chave) não volta nem fica preso na fila (' + JSON.stringify(st) + ')');
    conferir(rs.naoVoltou === 2 && /2 itens das Senhas da casa não voltaram/.test(av) && /cadeado que não é o de agora/.test(av) && /antes da troca de segurança/.test(av),
      'RD4. o aviso diz quantos itens das Senhas da casa não voltaram, e por quê (' + JSON.stringify([rs.naoVoltou, av]) + ')');
    conferir(JSON.stringify(db.omni_docs.filter((d) => d.grupo_id === GID && d.colecao === 'vault')) === banco0, 'RD4. as Senhas da casa no banco ficaram como estavam');
    /* os textos: as cópias de antes deixam de servir logo que a troca acontece (não só depois de "Terminar a troca"), e os anexos protegidos também */
    const tx = await a.evaluate(() => { const T = Giro.T; return { m5: T.muda5, ca: T.copiaAviso, cn: T.copiaNova, te: T.terminarTexto }; });
    conferir(/logo que a troca acontece/.test(tx.m5) && /anexos protegidos/.test(tx.m5) && /logo que a troca acontecer/.test(tx.ca) && /anexos protegidos/.test(tx.ca) && !/depois que a troca terminar/.test(tx.ca) && /anexos protegidos/.test(tx.cn) && !/nem cópias antigas/.test(tx.te),
      'RD4. os textos não prometem que as cópias de antes servem até "Terminar a troca" e falam dos anexos protegidos (' + JSON.stringify(tx) + ')');
    /* a cópia de um cofre de antes da 2.15.0 (com _meta, a senha principal) continua como antes: fica neste aparelho para "Trazer as senhas antigas" */
    const leg = JSON.stringify({ app: 'OmniLifeONE', v: 1, at: agora(), data: { people: [], vault: [{ id: '_meta', salt: 'eA==', iter: 1, check: { iv: 'eA==', ct: 'eQ==' } }, { id: 'vLegado', kind: 'senha', enc: { iv: 'eA==', ct: 'eQ==' }, files: [], vis: 'restrito' }] } });
    const rl = await restaurarCopia(a, leg);
    const sl = await a.evaluate(() => ({ n: Cofre.legado().size, tem: Cofre.temLegado() }));
    conferir(rl && rl.naoVoltou === 0 && sl.n === 2 && sl.tem, 'RD4. a cópia de um cofre de antes da 2.15.0 (com a senha principal) continua indo para "Trazer as senhas antigas" (' + JSON.stringify([rl && rl.naoVoltou, sl]) + ')');
  });

  const sujos = lixos.filter((l) => l.erros.length || l.nativos.length || l.fora.some((u) => /supabase/i.test(u)));
  conferir(!sujos.length, 'sem erro de script, sem diálogo nativo e nada fora do banco de mentira' + (sujos.length ? ': ' + sujos.map((l) => l.erros.concat(l.nativos).join(' | ')).join(' || ') : ''));
  conferir(!lixos.some((l) => l.console.some((t) => PINS.some((x) => t.includes(x)) || t.includes(CODIGO_EM))), 'nenhum PIN nem código de emergência no console');
  await terminar(falhas, browser, 'Parte E, etapas E1-E11 (SQL no mock, G5, G3, G3c, G11b, M1, M2, C12, N1, CH, G2, G2b, G3D, G3b, G9, G0, G1, G1c, C11, F0, G7a, G7t, D1, G8b, G8c, G8d, AN, FU, G7r, G7b, G7e, G7c, G7d, G8, G10, G10b, G7o, G10v, G7f, G7f2, C8, C16, AR, G4a, G4b, G4c, G4r, G4j, G4f, G13, G13d, G13r, G13b, PZ, G1t, G4t, C52, C53, C11t, G13t, G1b, G1p, G9v, G11, G12b, AV, G14, G12, G12s, G12p, G12g, G12v, D8; revisão de segurança RS1, RS2, RS3, RS4; revisão de dados RD1, RD2, RD3, RD4)');
})().catch((e) => { console.error(e); process.exit(1); });
