/* Teste automático: UM PIN SÓ no OmniLifeONE 2.21.0 (cofre.js 1.6.0, decisão do dono de 03/Nov/2026).
   O app abre em visitante e o teste faz o papel de uma família na nuvem (sem internet de verdade: o banco não é
   chamado), com as Senhas da casa já prontas neste aparelho e um PIN de mentira. Confere:
     1. guardar a primeira chave de IA pede UM PIN, na janela "Digite o seu PIN" (a das Senhas da casa), nunca a do cofre;
        as Senhas da casa e as chaves abrem juntas, e o PIN das chaves é o mesmo (vale nos outros apps)
     2. com tudo trancado, usar uma chave pede o PIN uma vez e abre as duas coisas
     3. com as Senhas da casa abertas, usar uma chave não pede nada
     4. abrir as Senhas da casa pela tela delas abre as chaves junto
     5. "Mostrar a chave guardada" pergunta o PIN de novo (e PIN errado não abre)
     6. trocar o PIN das Senhas da casa troca o das chaves (continua um PIN só)
     7. cofre de antes, com outro PIN: junta uma vez ("Juntar tudo num PIN só") e depois vale o PIN da pessoa
     8. permissão "🔑 Chaves de IA": o chefe vê ⚙ → IA; outra pessoa só se o chefe der; o campo aparece só para o chefe
   Só valores de mentira. Uso: node teste/rodar.js */
const { criarConferir, abrirApp, iniciar, terminar } = require('./_base');

const PIN = '481516', PIN_NOVO = '623342', PIN_ANTIGO = 'antigo-de-mentira-7';
const CHAVE = 'mentira-groq-um-pin-0123456789';

/* família na nuvem de mentira + Senhas da casa prontas neste aparelho (o que o "Começar" faria, sem o banco) */
async function familia(p, papel) {
  await p.evaluate(async (a) => {
    S.mode = 'cloud'; S.family = { id: 'fam-mentira', name: 'Família de mentira' }; S.role = a.papel;
    Conta.uid = () => 'u-mentira';
    CloudDriver.abrirCofre = async () => {}; CloudDriver.fecharCofre = () => {}; Cofre.distribuir = () => Promise.resolve();
    const dukRaw = Cofre.rnd(32), duk = await Cofre.aes(dukRaw), sal = b64FromBuf(Cofre.rnd(16));
    const L = { v: 1, uid: 'u-mentira', pin: Object.assign({ sal, iter: COFRE_ITER }, await Cofre.cifrar(await Cofre.kdf(a.pin, sal, COFRE_ITER), dukRaw)), prf: null,
      sk: await Cofre.cifrar(duk, Cofre.rnd(64)), fam: { 'fam-mentira': Object.assign({ kv: 1, fk: 'fk-mentira' }, await Cofre.cifrar(duk, Cofre.rnd(32))) }, erros: 0, ate: 0, bloqueado: false };
    await Cofre.gravarLocal(L);
  }, { pin: PIN, papel: papel || 'admin' });
}
const janelaUmPin = (p, ms) => p.waitForFunction(() => [...document.querySelectorAll('.modal h3')].some((h) => /Digite o seu PIN/.test(h.textContent)), null, { timeout: ms || 6000 }).then(() => true, () => false);
const janelaCofre = (p) => p.evaluate(() => { const j = document.querySelector('dialog#solver-cofre[open]'); return j ? j.textContent : ''; });
async function digitar(p, pin) { await p.fill('#upin', pin); await p.click('.modal [data-ok]'); }
const tranca = (p) => p.evaluate(async () => { await SolverCofre.trancar(); Cofre.trancar(); });

(async () => {
  const browser = await iniciar();
  const { falhas, conferir } = criarConferir();

  /* ---------- 1 a 6 ---------- */
  let { ctx, p, lixo } = await abrirApp(browser, 'celular');
  await familia(p);
  conferir(await p.evaluate(() => SolverCofre.versao) === '1.6.0', 'cofre.js 1.6.0 no app');
  const salvando = p.evaluate((c) => Keys.set('groq', c, { pt: 'teste', en: 'test' }).then(() => 'ok', (e) => e.message), CHAVE);
  conferir(await janelaUmPin(p), '1. guardar a primeira chave: aparece a janela "Digite o seu PIN" (a das Senhas da casa)');
  conferir(/mesmo PIN das Senhas da casa/.test(await p.evaluate(() => document.querySelector('.modal').textContent)), '1. a janela explica que é o mesmo PIN das Senhas da casa');
  await digitar(p, PIN);
  conferir(await salvando === 'ok', '1. com o PIN, a chave fica guardada');
  conferir(!(await janelaCofre(p)), '1. a janela do cofre ("Proteger as chaves de IA") nunca aparece');
  conferir(await p.evaluate(() => Cofre.aberto() && SolverCofre.aberto()), '1. as Senhas da casa e as chaves abriram juntas');
  await tranca(p);
  conferir(await p.evaluate((pin) => SolverCofre.abrir(pin).then(() => true, () => false), PIN), '1. o PIN das chaves é o mesmo PIN da pessoa (vale nos outros apps)');

  /* 2. tudo trancado: um PIN abre as duas */
  await tranca(p);
  const lendo2 = p.evaluate(() => Keys.need('groq', { pt: 'teste', en: 'test' }));
  conferir(await janelaUmPin(p), '2. tudo trancado: usar a chave pede o PIN uma vez');
  await digitar(p, PIN);
  conferir(await lendo2 === CHAVE && await p.evaluate(() => Cofre.aberto()) && !(await janelaCofre(p)), '2. um PIN só abre a chave e as Senhas da casa');

  /* 3. Senhas da casa abertas: nada é perguntado */
  await p.evaluate(() => SolverCofre.trancar());
  conferir(await p.evaluate(() => Keys.need('groq', { pt: 'teste', en: 'test' })) === CHAVE && !(await janelaUmPin(p, 500)) && !(await janelaCofre(p)),
    '3. com as Senhas da casa abertas, a chave sai sem nenhuma pergunta');

  /* 4. abrir as Senhas da casa pela tela delas abre as chaves junto */
  await tranca(p);
  await p.evaluate(async (pin) => { const r = await Cofre.destrancarPin(pin); if (r.ok) PinUnico.junto(pin); }, PIN);
  conferir(await p.waitForFunction(() => SolverCofre.aberto(), null, { timeout: 5000 }).then(() => true, () => false), '4. abrir as Senhas da casa (Casa → Senhas da casa) abre as chaves junto');

  /* 5. mostrar a chave: pergunta de novo */
  const mostrando = p.evaluate(() => { SolverCofre.trancar(); return Keys.need('groq', { pt: 'mostrar', en: 'show' }, true, true).then((v) => v, (e) => 'erro:' + e.message); });
  conferir(await janelaUmPin(p), '5. "Mostrar a chave guardada" pergunta o PIN de novo, mesmo com as Senhas da casa abertas');
  await digitar(p, '000000');
  conferir(await p.waitForFunction(() => /PIN errado/.test((document.querySelector('#uerr') || {}).textContent || ''), null, { timeout: 5000 }).then(() => true, () => false), '5. PIN errado: avisa e não abre');
  await digitar(p, PIN);
  conferir(await mostrando === CHAVE, '5. PIN certo: mostra');

  /* 6. trocar o PIN das Senhas da casa */
  await p.evaluate(async (novo) => { Cofre.pedirNovoPin = async () => novo; await Cofre.trocarPin(); }, PIN_NOVO);
  await p.waitForTimeout(300);
  await tranca(p);
  const r6 = await p.evaluate(async (a) => [await SolverCofre.abrir(a.velho).then(() => 'abriu', (e) => e.message), await SolverCofre.trancar(), await SolverCofre.abrir(a.novo).then(() => 'abriu', (e) => e.message)], { velho: PIN, novo: PIN_NOVO });
  conferir(r6[0] === 'pin-errado' && r6[2] === 'abriu', '6. trocar o PIN das Senhas da casa troca o das chaves (continua um PIN só)');

  await ctx.close();

  /* ---------- 7. cofre de antes, com outro PIN ---------- */
  ({ ctx, p, lixo } = await abrirApp(browser, 'celular'));
  await p.evaluate(async (a) => { await SolverCofre.criar(a.pin); await SolverCofre.gravar('ia:groq', a.chave); await SolverCofre.trancar(); }, { pin: PIN_ANTIGO, chave: CHAVE });
  await familia(p);
  const lendo7 = p.evaluate(() => Keys.need('groq', { pt: 'teste', en: 'test' }));
  conferir(await janelaUmPin(p), '7. cofre de antes: primeiro a janela de sempre ("Digite o seu PIN")');
  await digitar(p, PIN);
  conferir(await p.waitForSelector('dialog#solver-cofre[open]', { timeout: 8000 }).then(() => true, () => false) && /Juntar tudo num PIN só/.test(await janelaCofre(p)),
    '7. como o PIN das chaves era outro, só desta vez aparece "Juntar tudo num PIN só"');
  await p.fill('dialog#solver-cofre input[type=password]', PIN_ANTIGO);
  await p.click('dialog#solver-cofre button[type=submit]');
  conferir(await lendo7 === CHAVE, '7. com o PIN antigo, a chave abre');
  await tranca(p);
  const lendo7b = p.evaluate(() => Keys.need('groq', { pt: 'teste', en: 'test' }));
  conferir(await janelaUmPin(p), '7. da próxima vez: só a janela de sempre');
  await digitar(p, PIN);
  conferir(await lendo7b === CHAVE && !(await janelaCofre(p)), '7. e o PIN da pessoa abre tudo (juntou)');
  await ctx.close();

  /* ---------- 8. permissão "🔑 Chaves de IA" ---------- */
  ({ ctx, p, lixo } = await abrirApp(browser, 'celular'));
  await familia(p, 'responsavel');
  const iaTela = () => p.evaluate(async () => { go('settings', 'ai'); await new Promise((r) => setTimeout(r, 300)); return document.querySelector('main') ? document.querySelector('main').textContent : document.body.textContent; });
  await p.evaluate(() => { const eu = DB.get('people', S.meId); if (eu) delete eu.chavesIA; });
  conferir(/ficam com o chefe da família/.test(await iaTela()), '8. quem não é chefe e não tem a permissão vê "As chaves de IA ficam com o chefe da família"');
  conferir(await p.evaluate(() => !personFields(DB.get('people', S.meId)).some((f) => f.k === 'chavesIA')), '8. só o chefe vê o campo "🔑 Pode ver e usar as chaves de IA"');
  await p.evaluate(() => { const eu = DB.get('people', S.meId); if (eu) eu.chavesIA = true; });
  conferir(!/ficam com o chefe da família/.test(await iaTela()), '8. com a permissão dada pelo chefe, ⚙ → IA aparece');
  await p.evaluate(() => { S.role = 'admin'; const eu = DB.get('people', S.meId); if (eu) delete eu.chavesIA; });
  conferir(!/ficam com o chefe da família/.test(await iaTela()) && await p.evaluate(() => personFields({ role: 'responsavel' }).some((f) => f.k === 'chavesIA')),
    '8. o chefe sempre vê as chaves e é quem vê o campo para dar a permissão');
  conferir(!lixo.erros.length, 'sem erro na página' + (lixo.erros.length ? ': ' + lixo.erros.join(' | ') : ''));
  await ctx.close();

  await terminar(falhas, browser, 'um PIN só no OmniLifeONE — Senhas da casa e chaves de IA juntas, cofre antigo junta uma vez, permissão das chaves.');
})().catch((e) => { console.error('Erro no teste:', e.message); process.exit(1); });
