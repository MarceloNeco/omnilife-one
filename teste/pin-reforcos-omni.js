/* Teste automático: REFORÇOS do PIN único no OmniLifeONE (revisão de 03/Nov/2026 da 2.21.x, cofre.js 1.6.0).
   Mesmo modelo do pin-unico-omni.js: o app abre em visitante e o teste faz o papel de uma família na nuvem (sem
   internet de verdade: o banco não é chamado), com as Senhas da casa prontas neste aparelho e PINs de mentira. Confere:
     1. ligar a digital das Senhas da casa pede o PIN de agora (PIN errado ou Cancelar não liga)
     2. trocar o PIN pede o PIN de agora ou a digital (PIN errado não troca nada; a digital confirma) — a troca só deste aparelho,
        que desde a 2.26.0 só existe sem o SQL do PIN da conta (K12); a do PIN da conta pede o "PIN atual", que o banco confere
        (pin-conta-omni.js, B3)
     3. "🔒 Trancar o cofre agora" com as Senhas da casa abertas fecha as duas e diz isso; o próximo uso pede o PIN
     4. ⚙ → IA: quem tem o PIN único pronto não vê "Abrir a tela do cofre" (vê a digital das Senhas da casa), e a
        tela comum não abre nem chamando a ação; sem as Senhas da casa, o botão continua lá
     5. "Esqueci o PIN" na janela "Digite o seu PIN" aberta por cima de outra janela: o passo seguinte ("Abrir sem o PIN",
        2.26.0) aparece na hora, por cima da de baixo (nada na fila); "Voltar" deixa a de baixo e não apaga nada
     6. outra pessoa na mesma aba: trocar o PIN dela não troca o PIN das chaves de quem as guardou (a troca só deste aparelho;
        a do PIN da conta é conferida no pin-conta-omni.js, B3)
     7. sair da conta tranca as chaves de IA (na nuvem e no "só neste aparelho")
     8. criar as Senhas da casa (conta nova, 2.26.0) com as chaves abertas por outro PIN: as chaves trancam e não mudam de PIN
     9. "Esqueci o PIN" com o código do papel (2.26.0: "Tenho o código de recuperação antigo"): o PIN novo passa a abrir as
        chaves também nos outros apps; e a digital oferecida logo depois de escolher o PIN liga sem pedir o PIN de novo
    10. código de recuperação novo pede o PIN de agora (PIN errado ou Cancelar não faz código nenhum)
    11. PIN bloqueado neste aparelho: a janela diz como liberar (2.26.0: "Esqueci o PIN" e aprovar pelo outro aparelho; o PIN da
        conta só libera o aparelho que já passou para ele)
    12. trocar o endereço do "Personalizado" com chave guardada pede o PIN (Cancelar não salva nada)
    13. quem ligou antes a digital do cofre de chaves pode desligá-la em ⚙ → IA (a tela comum não abre mais)
    14. abrir as Senhas da casa com as chaves abertas por outro PIN: as chaves trancam e não mudam de PIN
    15. sem o PIN único, "Abrir a tela do cofre" tranca as chaves antes (a tela pede o PIN ao abrir)
   Só valores de mentira. Uso: node teste/rodar.js */
const { criarConferir, abrirApp, iniciar, terminar } = require('./_base');

const PIN = '481516', PIN_NOVO = '623342', PIN_B = '735921', PIN_B_NOVO = '846203', PIN_ANTIGO = 'antigo-de-mentira-7', PIN_INTRUSO = '479135';
const CHAVE = 'mentira-groq-reforco-0123456789';

/* família na nuvem de mentira + Senhas da casa prontas neste aparelho para a pessoa `uid` (o que o "Começar" faria, sem o banco).
   A "chave privada" de mentira fica em window.__pk[uid] para o teste do código do papel. */
async function familia(p, uid, pin) {
  await p.evaluate(async (a) => {
    window.__uid = a.uid; window.__pk = window.__pk || {};
    /* o "Olá" e as dicas do AssistONE abrem sozinhos e cobririam os botões que o teste toca */
    AOne.save({ hello: 1, tips: Object.assign({}, AOne.cfg().tips, { home: 1, settings: 1, house: 1, cars: 1 }) }); if (AOne.view) AOne.close();
    S.mode = 'cloud'; S.family = { id: 'fam-mentira', name: 'Família de mentira' }; S.role = 'admin';
    Conta.uid = () => window.__uid;
    CloudDriver.abrirCofre = async () => {}; CloudDriver.fecharCofre = () => {}; Cofre.distribuir = () => Promise.resolve();
    const dukRaw = Cofre.rnd(32), duk = await Cofre.aes(dukRaw), sal = b64FromBuf(Cofre.rnd(16)), pk = Cofre.rnd(64);
    window.__pk[a.uid] = new Uint8Array(pk);
    const L = { v: 1, uid: a.uid, pin: Object.assign({ sal, iter: COFRE_ITER }, await Cofre.cifrar(await Cofre.kdf(a.pin, sal, COFRE_ITER), dukRaw)), prf: null,
      sk: await Cofre.cifrar(duk, pk), fam: { 'fam-mentira': Object.assign({ kv: 1, fk: 'fk-mentira' }, await Cofre.cifrar(duk, Cofre.rnd(32))) }, erros: 0, ate: 0, bloqueado: false };
    await Cofre.gravarLocal(L);
  }, { uid, pin });
}
/* criar a conta e o código antigo sem o banco: tudo o que iria à internet responde de mentira */
const semBanco = (p, nb) => p.evaluate((nb) => {
  CloudDriver.sync = async () => {}; CloudDriver.linha = async () => null; Cofre.registro = () => null;
  Cofre.minhasNoBanco = async () => nb; Cofre.publicarPub = async () => {}; Cofre.mostrarCodigo = async () => true;
  Cofre.novoPar = async () => ({ pub: { kid: 'kid-mentira' }, pkcs8: Cofre.rnd(64) });
  Cloud.audit = () => {}; Cloud.myName = () => 'Pessoa de mentira';
}, nb);
const janelaUmPin = (p, ms) => p.waitForFunction(() => [...document.querySelectorAll('.modal h3')].some((h) => /Digite o seu PIN/.test(h.textContent)), null, { timeout: ms || 6000 }).then(() => true, () => false);
const janelaProva = (p, ms) => p.waitForSelector('.modal #ppin', { timeout: ms || 6000 }).then(() => true, () => false);
const textoJanela = (p) => p.evaluate(() => { const i = document.querySelector('.modal #ppin'); const m = i && i.closest('.modal'); return m ? m.textContent : ''; });
/* o PIN novo pelo formulário do PIN novo (só números, 6 ou mais); sem o formulário, segue sem travar */
async function pinNovo(p, pin) { if (!(await p.waitForSelector('.modal #pcP1', { timeout: 6000 }).then(() => true, () => false))) return; await p.fill('.modal #pcP1', pin); await p.fill('.modal #pcP2', pin); await p.click('.modal #pcOk'); }
/* sem a janela (versão sem o reforço), seguem sem travar: as conferências é que falham */
async function provar(p, pin) { if (!(await janelaProva(p, 1500))) return; await p.fill('.modal #ppin', pin); await p.click('.modal:has(#ppin) [data-ok]'); }
const cancelarProva = (p) => p.click('.modal:has(#ppin) .mf [data-x]', { timeout: 1500 }).catch(() => {});
async function digitar(p, pin) { await p.fill('#upin', pin); await p.click('.modal:has(#upin) [data-ok]'); }
const erroProva = (p, re) => p.waitForFunction((re) => new RegExp(re).test((document.querySelector('#perr') || {}).textContent || ''), re, { timeout: 5000 }).then(() => true, () => false);
const temJanela = (p, re) => p.evaluate((re) => [...document.querySelectorAll('.modal h3')].some((h) => new RegExp(re).test(h.textContent)), re);
/* fecha o que tiver ficado aberto (na versão sem o reforço, a tela comum do passo 4), para o passo seguinte valer sozinho */
const limparJanelas = (p) => p.evaluate(() => { for (let i = 0; i < 9 && SolverJanela.aberta(); i++) SolverJanela.aberta().fechar('fechar'); });
const tranca = (p) => p.evaluate(async () => { await SolverCofre.trancar(); Cofre.trancar(); });
/* o PIN abre as chaves como nos outros apps (a janela do cofre.js) */
const abreChaves = (p, pin) => p.evaluate(async (pin) => { await SolverCofre.trancar(); return SolverCofre.abrir(pin).then(() => 'abriu', (e) => e.message); }, pin);
/* guardar a primeira chave: PIN único (as chaves ficam ligadas à pessoa e com o PIN dela) */
async function guardarChave(p, pin) {
  const salvando = p.evaluate((c) => Keys.set('groq', c, { pt: 'teste', en: 'test' }).then(() => 'ok', (e) => e.message), CHAVE);
  if (!(await janelaUmPin(p))) return 'sem janela';
  await digitar(p, pin);
  return salvando;
}

(async () => {
  const browser = await iniciar();
  const { falhas, conferir } = criarConferir();

  /* ---------- 1 a 5: uma pessoa ---------- */
  let { ctx, p, lixo } = await abrirApp(browser, 'celular');
  await familia(p, 'u-mentira', PIN);
  conferir(await guardarChave(p, PIN) === 'ok', 'preparo: a chave de mentira fica guardada com o PIN único');

  /* 1. ligar a digital */
  await p.evaluate(() => { window.__prf = 0; Cofre.prfNovo = async () => { window.__prf++; return null; }; });
  let ligando = p.evaluate(() => Cofre.ligarDigital());
  conferir(await janelaProva(p) && /Para ligar a digital, digite o seu PIN de agora/.test(await textoJanela(p)), '1. ligar a digital (Senhas da casa abertas) pede o PIN de agora');
  await provar(p, '000000');
  conferir(await p.waitForFunction(() => /PIN errado/.test((document.querySelector('#perr') || {}).textContent || ''), null, { timeout: 5000 }).then(() => true, () => false), '1. PIN errado: avisa');
  await cancelarProva(p); await ligando;
  conferir(await p.evaluate(() => window.__prf) === 0, '1. PIN errado e Cancelar: a digital não é ligada');
  ligando = p.evaluate(() => Cofre.ligarDigital());
  await janelaProva(p); await provar(p, PIN); await ligando;
  conferir(await p.evaluate(() => window.__prf) === 1, '1. com o PIN de agora, segue para ligar a digital');

  /* 2. trocar o PIN (sem o banco: a troca só deste aparelho, a que vale quando falta o SQL do PIN da conta) */
  await p.evaluate(() => { Sol.ligadoPin = false; window.__novo = 0; const f = TelaConta.formPin; TelaConta.formPin = function (op) { window.__novo++; return f.call(this, op); }; });
  let trocando = p.evaluate(() => Cofre.trocarPin());
  conferir(await janelaProva(p) && /primeiro digite o PIN de agora/.test(await textoJanela(p)), '2. trocar o PIN (Senhas da casa abertas) pede o PIN de agora');
  await provar(p, '000000');
  await p.waitForFunction(() => /PIN errado/.test((document.querySelector('#perr') || {}).textContent || ''), null, { timeout: 5000 }).catch(() => {});
  await cancelarProva(p); await trocando;
  conferir(await p.evaluate(() => window.__novo) === 0, '2. PIN errado: nem chega a pedir o PIN novo');
  conferir(await abreChaves(p, PIN) === 'abriu' && await p.evaluate(async (pin) => (await Cofre.destrancarPin(pin)).ok === true, PIN), '2. PIN errado: o PIN das Senhas da casa e o das chaves continuam os mesmos');
  /* a digital (de mentira) também confirma */
  await p.evaluate(async () => { const L = await Cofre.local(); L.prf = { cred: 'cred-mentira', sal: 'sal-mentira', iv: '', ct: '' }; await Cofre.gravarLocal(L); Cofre.conferirDigital = async () => ({ ok: true }); });
  trocando = p.evaluate(() => Cofre.trocarPin());
  conferir(await janelaProva(p) && await p.evaluate(() => !!document.querySelector('.modal:has(#ppin) [data-dig]')), '2. com a digital ligada, a janela oferece "Confirmar com a digital"');
  await p.click('.modal:has(#ppin) [data-dig]', { timeout: 1500 }).catch(() => {}); await pinNovo(p, PIN_NOVO); await trocando;
  await p.waitForTimeout(400);
  conferir(await p.evaluate(() => window.__novo) === 1 && await abreChaves(p, PIN_NOVO) === 'abriu', '2. a digital confirma e o PIN troca (o das chaves junto)');
  await p.evaluate(async () => { const L = await Cofre.local(); L.prf = null; await Cofre.gravarLocal(L); });

  /* 3. trancar agora */
  await p.evaluate(async (pin) => { await Cofre.destrancarPin(pin); await SolverCofre.abrir(pin); }, PIN_NOVO);
  conferir(await p.evaluate(() => Cofre.aberto() && SolverCofre.aberto()), 'preparo: Senhas da casa e chaves abertas');
  await p.evaluate(() => ACT['cofre.lock']());
  conferir(await p.evaluate(() => !Cofre.aberto() && !SolverCofre.aberto()), '3. "Trancar o cofre agora" fecha as chaves e também as Senhas da casa');
  conferir(/Senhas da casa e chaves de IA trancadas/.test(await p.evaluate(() => document.querySelector('#toasts').textContent)), '3. o aviso diz que as duas ficaram trancadas');
  const lendo3 = p.evaluate(() => Keys.need('groq', { pt: 'teste', en: 'test' }).then((v) => v, () => ''));
  conferir(await janelaUmPin(p), '3. o próximo uso da chave pede o PIN (não reabre sozinho)');
  await p.click('.modal [data-x]:not(.xbtn)', { timeout: 1500 }).catch(() => {}); await lendo3;

  /* 4. ⚙ → IA e a tela comum do cofre */
  await p.evaluate(async (pin) => { await Cofre.destrancarPin(pin); }, PIN_NOVO);
  const iaTela = () => p.evaluate(async () => { go('settings', 'ai'); await new Promise((r) => setTimeout(r, 500)); const m = document.querySelector('main') || document.body; return { botao: !!m.querySelector('[data-act="cofre.tela"]'), texto: m.textContent }; });
  let t4 = await iaTela();
  conferir(!t4.botao, '4. PIN único pronto: ⚙ → IA não oferece "Abrir a tela do cofre"');
  conferir(/A digital das Senhas da casa abre também as chaves de IA/.test(t4.texto), '4. no lugar, explica que a digital das Senhas da casa abre as chaves');
  await p.evaluate(() => ACT['cofre.tela']());
  await p.waitForTimeout(600);
  conferir(await p.evaluate(() => !SolverJanela.aberta() && !document.querySelector('dialog#solver-cofre[open]')), '4. chamando a ação mesmo assim, a tela comum do cofre não abre');
  await limparJanelas(p);
  await p.evaluate(async () => { const L = await Cofre.local(); window.__L = L; await IDB.del('kv', Cofre.K()); });
  await p.waitForTimeout(300);
  t4 = await iaTela();
  conferir(t4.botao, '4. sem as Senhas da casa neste aparelho, o botão "Abrir a tela do cofre" continua');
  await p.evaluate(async () => { await Cofre.gravarLocal(window.__L); delete window.__L; });

  /* 10. código de recuperação novo */
  await p.evaluate(async (pin) => {
    await Cofre.destrancarPin(pin); window.__cod = 0; window.__mnb = 0;
    Cofre.mostrarCodigo = async () => { window.__cod++; return false; };
    Cofre.minhasNoBanco = async () => { window.__mnb++; return { pub: { kid: 'kid-mentira' } }; };
  }, PIN_NOVO);
  let codigo = p.evaluate(() => Cofre.novoCodigo());
  conferir(await janelaProva(p) && /Para fazer um código novo, primeiro digite o PIN de agora/.test(await textoJanela(p)), '10. código de recuperação novo (Senhas da casa abertas) pede o PIN de agora');
  await provar(p, '000000'); await erroProva(p, 'PIN errado');
  await cancelarProva(p); await codigo;
  conferir(await p.evaluate(() => window.__cod + window.__mnb) === 0, '10. PIN errado e Cancelar: nenhum código novo é feito');
  codigo = p.evaluate(() => Cofre.novoCodigo());
  await janelaProva(p); await provar(p, PIN_NOVO); await codigo;
  conferir(await p.evaluate(() => window.__cod) === 1, '10. com o PIN de agora, segue para mostrar o código novo');

  /* 11. PIN bloqueado */
  await p.evaluate(async () => { const L = await Cofre.local(); L.bloqueado = true; await Cofre.gravarLocal(L); });
  codigo = p.evaluate(() => Cofre.novoCodigo());
  await janelaProva(p); await provar(p, PIN_NOVO);
  conferir(await erroProva(p, 'errou muitas vezes neste .*Esqueci o PIN.* aprove pelo outro aparelho'), '11. PIN bloqueado: a janela diz como liberar ("Esqueci o PIN" e aprovar pelo outro aparelho)');
  await cancelarProva(p); await codigo;
  conferir(await p.evaluate(() => window.__cod) === 1, '11. bloqueado: nenhum código novo é feito');
  await p.evaluate(async () => { const L = await Cofre.local(); L.bloqueado = false; await Cofre.gravarLocal(L); });

  /* 12. endereço do Personalizado */
  await p.evaluate(async (pin) => { await SolverCofre.trancar(); await SolverCofre.abrir(pin); await SolverCofre.gravar('ia:custom', 'mentira-custom-0123456789'); S.prefs.aiBase = 'http://127.0.0.1:9/velho'; }, PIN_NOVO);
  await p.evaluate(() => { KeyVault.open('custom'); });
  await p.waitForSelector('.modal #vbase', { timeout: 5000 });
  await p.fill('.modal #vbase', 'http://127.0.0.1:9/novo');
  await p.click('.modal:has(#vbase) [data-ok]');
  conferir(await janelaUmPin(p) && /Você trocou o endereço/.test(await p.evaluate(() => (document.querySelector('#upin') || document.body).closest('.modal').textContent)), '12. trocar o endereço do Personalizado com a chave guardada pede o PIN (mesmo com as chaves abertas)');
  await p.click('.modal:has(#upin) [data-x]:not(.xbtn)', { timeout: 1500 }).catch(() => {});
  await p.waitForTimeout(400);
  conferir(await p.evaluate(() => S.prefs.aiBase === 'http://127.0.0.1:9/velho' && !SolverCofre.aberto()), '12. Cancelar: o endereço novo não é salvo e as chaves ficam trancadas');
  await p.click('.modal:has(#vbase) [data-ok]');
  if (await janelaUmPin(p)) await digitar(p, PIN_NOVO);
  conferir(await p.waitForFunction(() => S.prefs.aiBase === 'http://127.0.0.1:9/novo', null, { timeout: 5000 }).then(() => true, () => false), '12. com o PIN, o endereço novo é salvo');
  await p.waitForFunction(() => !document.querySelector('.modal #vbase'), null, { timeout: 8000 }).catch(() => {});
  await p.evaluate(() => closeModals());

  /* 13. desligar a digital antiga do cofre de chaves */
  const viuBotao = () => p.evaluate(async () => { go('settings', 'ai'); for (let i = 0; i < 20; i++) { await new Promise((r) => setTimeout(r, 100)); if (document.querySelector('[data-act="cofre.semdigitalchaves"]')) return true; } return false; });
  conferir(!(await viuBotao()), '13. sem digital antiga das chaves: nenhum botão para desligar');
  await p.evaluate(() => { window.__des = 0; window.__orig = [SolverCofre.digitalAtiva, SolverCofre.desativarDigital]; SolverCofre.digitalAtiva = () => true; SolverCofre.desativarDigital = async () => { window.__des++; return true; }; });
  conferir(await viuBotao(), '13. com a digital antiga das chaves ligada: ⚙ → IA mostra "Parar de usar a digital antiga das chaves"');
  await p.click('[data-act="cofre.semdigitalchaves"]');
  conferir(await p.waitForFunction(() => window.__des === 1, null, { timeout: 3000 }).then(() => true, () => false), '13. o botão desliga a digital antiga das chaves');
  await p.evaluate(() => { [SolverCofre.digitalAtiva, SolverCofre.desativarDigital] = window.__orig; });

  /* 5. "Esqueci o PIN" por cima de outra janela. 2.26.0: sem a pergunta do "sim" — o passo seguinte ("Abrir sem o PIN") vem
     por cima e nada é apagado antes do cadeado novo estar pronto */
  await tranca(p);
  await semBanco(p, { pub: { kid: 'kid-mentira' }, bk: {} });
  await p.evaluate(() => modal({ title: 'Groq de mentira', body: '<p>janela de baixo</p>' }));
  const lendo5 = p.evaluate(() => Keys.need('groq', { pt: 'teste', en: 'test' }).then((v) => v, () => ''));
  conferir(await janelaUmPin(p), '5. a janela "Digite o seu PIN" abre por cima da outra');
  await p.click('.modal [data-esq]');
  conferir(await p.waitForFunction(() => [...document.querySelectorAll('.modal h3')].some((h) => /Abrir sem o PIN/.test(h.textContent)), null, { timeout: 6000 }).then(() => true, () => false)
    && await p.evaluate(() => SolverJanela.esperando() === 0), '5. o passo seguinte ("Abrir sem o PIN") aparece na hora, sem nada na fila');
  conferir(await temJanela(p, 'Groq de mentira'), '5. por cima da janela de baixo, que continua');
  await p.click('.modal #apVolta'); await lendo5;
  conferir(await temJanela(p, 'Groq de mentira') && await p.evaluate(async () => !!(await Cofre.local())), '5. "Voltar": a janela de baixo continua e o PIN deste aparelho não é apagado');
  await p.evaluate(() => closeModals());
  conferir(!lixo.erros.length, '1 a 5 e 10 a 13: sem erro na página' + (lixo.erros.length ? ': ' + lixo.erros.join(' | ') : ''));
  await ctx.close();

  /* ---------- 6 e 7. outra pessoa na mesma aba; sair tranca ---------- */
  ({ ctx, p, lixo } = await abrirApp(browser, 'celular'));
  await familia(p, 'u-A', PIN);
  conferir(await guardarChave(p, PIN) === 'ok' && await p.evaluate(() => SolverCofre.pessoas().join()) === 'u-A', 'preparo: as chaves são da pessoa A');
  await familia(p, 'u-B', PIN_B);
  await p.evaluate(async (pin) => { Cofre.trancar(); await Cofre.destrancarPin(pin); }, PIN_B);
  conferir(await p.evaluate(() => Cofre.aberto() && SolverCofre.aberto()), 'preparo: B abriu as Senhas da casa dela e as chaves de A ainda estão abertas');
  await p.evaluate(() => { Sol.ligadoPin = false; });
  trocando = p.evaluate(() => Cofre.trocarPin());
  await janelaProva(p); await provar(p, PIN_B); await pinNovo(p, PIN_B_NOVO); await trocando;
  await p.waitForTimeout(400);
  conferir(await abreChaves(p, PIN) === 'abriu', '6. B trocou o PIN dela: o PIN de A continua abrindo as chaves de A');
  conferir(await abreChaves(p, PIN_B_NOVO) === 'pin-errado', '6. e o PIN novo de B não abre as chaves de A');
  await p.evaluate((pin) => SolverCofre.abrir(pin), PIN);
  await p.evaluate(async () => { Cloud.logout = async () => {}; await ACT['cloud.logout'](); });
  conferir(await p.waitForFunction(() => !SolverCofre.aberto(), null, { timeout: 3000 }).then(() => true, () => false), '7. sair da conta (nuvem) tranca as chaves de IA');
  await ctx.close();

  ({ ctx, p, lixo } = await abrirApp(browser, 'celular'));
  await p.evaluate(async (pin) => { S.mode = 'local'; await SolverCofre.criar(pin); }, PIN_ANTIGO);
  conferir(await p.evaluate(() => SolverCofre.aberto()), 'preparo: chaves abertas no "só neste aparelho"');
  await p.evaluate(async () => { window.__guia = null; DGO.ia.guia = () => { window.__guia = SolverCofre.aberto(); }; await ACT['cofre.tela'](); });
  conferir(await p.evaluate(() => window.__guia) === false, '15. sem o PIN único, "Abrir a tela do cofre" tranca as chaves antes de abrir a tela');
  await p.evaluate((pin) => SolverCofre.abrir(pin), PIN_ANTIGO);
  await p.evaluate(() => signOut());
  conferir(await p.waitForFunction(() => !SolverCofre.aberto(), null, { timeout: 3000 }).then(() => true, () => false), '7. sair no "só neste aparelho" tranca as chaves de IA');
  await ctx.close();

  /* ---------- 8. "Começar" com as chaves abertas por outro PIN ---------- */
  ({ ctx, p, lixo } = await abrirApp(browser, 'celular'));
  await p.evaluate(async (a) => { await SolverCofre.criar(a.pin); await SolverCofre.gravar('ia:groq', a.chave); }, { pin: PIN_ANTIGO, chave: CHAVE });
  await p.evaluate(() => {
    window.__uid = 'u-mentira'; S.mode = 'cloud'; S.family = { id: 'fam-mentira', name: 'Família de mentira' }; S.role = 'admin'; Conta.uid = () => window.__uid;
    CloudDriver.abrirCofre = async () => {}; CloudDriver.fecharCofre = () => {}; Cofre.distribuir = () => Promise.resolve(); Bio.available = async () => false;
  });
  await semBanco(p, { pub: null, bk: null });
  /* a conta nova pela rede de mentira: este aparelho entra na lista e o PIN da conta nasce (versão 1) */
  await p.evaluate(() => { Sol.pode = () => true; Sol.apRegistrar = async () => 'ap-mentira'; Sol.pinDefinir = async () => ({ ok: true, versao: 1, segredo: SolProto.b64u(SolProto.rnd(32)) }); });
  conferir(await p.evaluate(() => SolverCofre.aberto() && !SolverCofre.pessoas().length), 'preparo: chaves abertas pelo PIN próprio delas, sem dono');
  const r8 = await p.evaluate((pin) => Cofre.criarConta(pin), PIN_INTRUSO);
  await p.waitForTimeout(800);
  conferir(r8.ok === true && await p.evaluate(() => Cofre.aberto()), '8. criar (conta nova) abriu as Senhas da casa');
  conferir(await p.evaluate(() => !SolverCofre.aberto() && !SolverCofre.pessoas().length), '8. as chaves abertas por outro PIN trancaram e não foram ligadas a quem começou');
  conferir(await abreChaves(p, PIN_INTRUSO) === 'pin-errado' && await abreChaves(p, PIN_ANTIGO) === 'abriu', '8. o PIN das chaves não mudou (o PIN escolhido ao criar não abre as chaves)');
  conferir(!lixo.erros.length, '8: sem erro na página' + (lixo.erros.length ? ': ' + lixo.erros.join(' | ') : ''));
  await ctx.close();

  /* ---------- 14. abrir as Senhas da casa com as chaves abertas por outro PIN ---------- */
  ({ ctx, p, lixo } = await abrirApp(browser, 'celular'));
  await p.evaluate(async (a) => { await SolverCofre.criar(a.pin); await SolverCofre.gravar('ia:groq', a.chave); }, { pin: PIN_ANTIGO, chave: CHAVE });
  await familia(p, 'u-mentira', PIN);
  await p.evaluate(async (pin) => { await Cofre.destrancarPin(pin); }, PIN);
  conferir(await p.evaluate(() => Cofre.aberto() && SolverCofre.aberto() && !SolverCofre.pessoas().length), 'preparo: Senhas da casa abertas e chaves abertas pelo PIN próprio delas, sem dono');
  await p.evaluate((pin) => { PinUnico.junto(pin); }, PIN);
  await p.waitForTimeout(1200);
  await limparJanelas(p); await p.evaluate(() => closeModals());
  conferir(await p.evaluate(() => !SolverCofre.pessoas().length), '14. as chaves abertas por outro PIN não são ligadas a quem abriu as Senhas da casa');
  conferir(await abreChaves(p, PIN_ANTIGO) === 'abriu' && await abreChaves(p, PIN) === 'pin-errado', '14. o PIN das chaves não muda sem provar o PIN delas');
  conferir(!lixo.erros.length, '14: sem erro na página' + (lixo.erros.length ? ': ' + lixo.erros.join(' | ') : ''));
  await ctx.close();

  /* ---------- 9. "Esqueci o PIN" com o código do papel (2.26.0: "Abrir sem o PIN" → "Tenho o código de recuperação antigo") ---------- */
  ({ ctx, p, lixo } = await abrirApp(browser, 'celular'));
  await familia(p, 'u-mentira', PIN);
  conferir(await guardarChave(p, PIN) === 'ok', 'preparo: chaves guardadas com o PIN único (ligadas à pessoa)');
  await semBanco(p, { pub: { kid: 'kid-mentira' }, bk: {} });
  await p.evaluate(() => {
    Cofre.trancar();   /* "Esqueci o PIN": o cadeado fica até o novo estar pronto */
    /* a rede de mentira: o código entra como "kit" e a conta ainda não tem PIN (o PIN escolhido vira o da conta) */
    Sol.pode = () => true; Sol.apRegistrar = async () => 'ap-kit-mentira'; Sol.apTirar = async () => true;
    Sol.pinInfo = async () => ({ tem: false, sal: null, versao: 0, tentativas: 0 }); Sol.pinDefinir = async () => ({ ok: true, versao: 1, segredo: SolProto.b64u(SolProto.rnd(32)) });
    Cofre.privadaPeloCodigo = async () => ({ pkcs8: new Uint8Array(window.__pk['u-mentira']), kid: 'kid-mentira' });
    Cofre.importarSk = async () => ({}); Cofre.buscarMinha = async () => ({ kv: 1, fk: 'fk-mentira', raw: Cofre.rnd(32) });
    Bio.available = async () => true; window.__prf = 0; Cofre.prfNovo = async () => { window.__prf++; return null; };
  });
  await p.evaluate(() => { TelaConta.codigoAntigo({ esqueci: true }); });
  await p.waitForSelector('.modal #apCod', { timeout: 8000 }); await p.fill('.modal #apCod', 'CODIGO-DE-MENTIRA'); await p.click('.modal #apCodOk');
  await pinNovo(p, PIN_NOVO);
  await p.waitForSelector('.modal #apDigSim', { timeout: 15000 }).catch(() => {});
  conferir(/digital/.test(await p.evaluate(() => { const b = document.querySelector('.modal #apDigSim'); return b ? b.closest('.modal').textContent : ''; })), '9. depois de escolher o PIN, oferece a digital');
  await p.click('.modal #apDigSim', { timeout: 3000 }).catch(() => {});
  await p.waitForFunction(() => window.__prf === 1, null, { timeout: 5000 }).catch(() => {});
  conferir(await p.evaluate(() => window.__prf) === 1 && !(await p.evaluate(() => !!document.querySelector('.modal #ppin'))), '9. a digital oferecida liga sem pedir o PIN de novo (acabou de ser escolhido)');
  await p.waitForTimeout(600);
  conferir(await abreChaves(p, PIN_NOVO) === 'abriu', '9. o PIN novo abre as chaves como nos outros apps');
  conferir(await abreChaves(p, PIN) === 'pin-errado', '9. o PIN esquecido não abre mais as chaves');
  conferir(!lixo.erros.length, '9: sem erro na página' + (lixo.erros.length ? ': ' + lixo.erros.join(' | ') : ''));
  await ctx.close();

  await terminar(falhas, browser, 'reforços do PIN único — PIN de agora para trocar o PIN e ligar a digital, trancar e sair trancam tudo, tela comum fora, Esqueci por cima de janela, outra pessoa, criar com as chaves abertas, código do papel, código novo, endereço do Personalizado e digital antiga das chaves.');
})().catch((e) => { console.error('Erro no teste:', e.message); process.exit(1); });
