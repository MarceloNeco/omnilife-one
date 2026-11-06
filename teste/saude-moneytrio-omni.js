/* 🩺 Saúde → MoneyTRIO (2.23.0), em 390 px. Família na nuvem de mentira (o banco não é chamado: Conta.rpc é trocado por
   um gravador) com as Senhas da casa prontas e os dados de exemplo do app (pessoas e o cachorro Thor). Confere:
     - desligado (padrão): salvar a Saúde não manda nada
     - ligar manda o resumo uma vez, pelo sol_ponte_enviar (omnilife-one → moneytrio, tipo saude-resumo, grupo = família)
     - o resumo vai cifrado com a chave da família no formato do cofre ({c:1, kv, fk, iv, ct}) e, aberto, só tem
       perfil_id, apelido, operadora, validade e medico (pet com "especie": "pet") — nada de carteirinha, SUS, sangue,
       alergias, remédios, condições ou telefones
     - manda de novo quando muda a operadora, a validade ou o médico; mudar outra coisa não manda
     - com as Senhas da casa fechadas fica pendente e vai quando elas abrem
     - erro no servidor: fica pendente; criança e "só neste aparelho" não mandam nem veem a opção
   Só valores de mentira. Uso: node teste/rodar.js */
const { criarConferir, abrirApp, iniciar, terminar } = require('./_base');
const PIN = '481516';

async function familia(p) {
  await p.evaluate(async (pin) => {
    S.mode = 'cloud'; S.family = { id: 'fam-mentira', name: 'Família de mentira' }; S.role = 'admin';
    Conta.uid = () => 'u-mentira';
    CloudDriver.abrirCofre = async () => {}; CloudDriver.fecharCofre = () => {}; Cofre.distribuir = () => Promise.resolve();
    AOne.save({ hello: 1, tips: Object.assign({}, AOne.cfg().tips, { settings: 1, health: 1, home: 1 }) }); if (AOne.view) AOne.close();
    const dukRaw = Cofre.rnd(32), duk = await Cofre.aes(dukRaw), sal = b64FromBuf(Cofre.rnd(16));
    const L = { v: 1, uid: 'u-mentira', pin: Object.assign({ sal, iter: COFRE_ITER }, await Cofre.cifrar(await Cofre.kdf(pin, sal, COFRE_ITER), dukRaw)), prf: null,
      sk: await Cofre.cifrar(duk, Cofre.rnd(64)), fam: { 'fam-mentira': Object.assign({ kv: 3, fk: 'fk-mentira' }, await Cofre.cifrar(duk, Cofre.rnd(32))) }, erros: 0, ate: 0, bloqueado: false };
    await Cofre.gravarLocal(L);
    window.__rpc = []; window.__falha = false;
    Conta.rpc = async (nome, args) => { if (window.__falha) throw new Error('sem conexão de mentira'); window.__rpc.push({ nome, args: JSON.parse(JSON.stringify(args)) }); return 'id-mentira'; };
    await Cofre.destrancarPin(pin);
  }, PIN);
}
/* abre a mensagem como o MoneyTRIO abriria: com a chave da família */
const abrir = (p, i) => p.evaluate(async (i) => {
  const m = window.__rpc[i]; if (!m) return null;
  const o = JSON.parse(m.args.p_dados.cif);
  const txt = new TextDecoder().decode(await Cofre.decifrar(Cofre.vf, o));
  return { nome: m.nome, args: m.args, env: Object.keys(o).sort().join(','), c: o.c, kv: o.kv, fk: o.fk, txt, j: JSON.parse(txt) };
}, i);
/* edita a Saúde pela janela de verdade */
async function editarSaude(p, pid, campos) {
  await p.evaluate((pid) => { Health.edit(pid); }, pid);
  await p.waitForSelector('.modal [name="plan.operator"]', { timeout: 5000 });
  for (const [k, v] of Object.entries(campos)) await p.fill('.modal [name="' + k + '"]', v);
  await p.click('.modal:has([name="plan.operator"]) [data-ok]');
  await p.waitForFunction(() => !document.querySelector('.modal [name="plan.operator"]'), null, { timeout: 5000 }).catch(() => {});
  await p.waitForTimeout(400);
}
const ligar = async (p, sim) => {
  await p.evaluate(() => { go('settings', 'integr'); }); await p.waitForSelector('[data-chg="mt.saude"]', { timeout: 5000 });
  await p.setChecked('[data-chg="mt.saude"]', sim); await p.waitForTimeout(800);
};

(async () => {
  const browser = await iniciar();
  const { falhas, conferir } = criarConferir();
  let { ctx, p, lixo } = await abrirApp(browser, 'celular');
  await familia(p);
  conferir(await p.evaluate(() => Cofre.aberto() && SaudeMT.pode() && !SaudeMT.ligado()), 'preparo: família na nuvem, Senhas da casa abertas, integração desligada');

  /* desligado */
  await editarSaude(p, 'pAna', { 'plan.operator': 'Operadora Nova de Mentira' });
  conferir(await p.evaluate(() => window.__rpc.length) === 0, 'desligado: mudar o plano não manda nada');

  /* ligar */
  await p.evaluate(async () => { await DB.put('health', Object.assign({}, DB.get('health', 'pThor') || { id: 'pThor' }, { doctor: 'Veterinária de Mentira', plan: { operator: '', number: 'PET-0001', valid: '' } })); });
  await ligar(p, true);
  conferir(await p.evaluate(() => SaudeMT.ligado() && window.__rpc.length === 1), 'ligar manda o resumo uma vez');
  const m = await abrir(p, 0);
  conferir(m && m.nome === 'sol_ponte_enviar' && m.args.p_de === 'omnilife-one' && m.args.p_para === 'moneytrio' && m.args.p_tipo === 'saude-resumo' && m.args.p_grupo === 'fam-mentira' && m.args.p_dados.v === 1, 'pela sol_ponte_enviar: omnilife-one → moneytrio, saude-resumo, grupo = família, v 1');
  conferir(m && m.env === 'c,ct,fk,iv,kv' && m.c === 1 && m.kv === 3 && m.fk === 'fk-mentira' && Object.keys(m.args.p_dados).sort().join() === 'cif,v', 'cifrado no formato do cofre {c:1, kv, fk, iv, ct}; fora do cif não vai nada');
  conferir(m && !/Operadora Nova|Plano Saúde Exemplo|Ana/.test(JSON.stringify(m.args)), 'o texto aberto não aparece na mensagem (só cifrado)');
  const pes = (m && m.j.pessoas) || [];
  conferir(m && m.j.v === 1 && /^\d{4}-\d{2}-\d{2}T/.test(m.j.enviado_em) && pes.length >= 2, 'abrindo com a chave da família: v 1, enviado_em e as pessoas');
  conferir(pes.every((x) => Object.keys(x).every((k) => ['perfil_id', 'apelido', 'operadora', 'validade', 'medico', 'especie'].includes(k))), 'cada pessoa só com perfil_id, apelido, operadora, validade e medico');
  conferir(!/0 123 456789|PET-0001|0800|"O"|Amendoim|Losartana|Asma|sus|blood|allerg|meds|conditions|phone|number/i.test(m.txt), 'nunca vai carteirinha, SUS, tipo sanguíneo, alergias, remédios, condições ou telefones');
  const ana = pes.find((x) => x.perfil_id === 'pAna'), thor = pes.find((x) => x.perfil_id === 'pThor');
  conferir(ana && ana.operadora === 'Operadora Nova de Mentira' && !ana.especie, 'pessoa: a operadora nova vai');
  conferir(thor && thor.especie === 'pet' && thor.medico === 'Veterinária de Mentira', 'pet (Thor): vai com "especie": "pet" e o veterinário em "medico"');

  /* o que manda de novo e o que não manda */
  await editarSaude(p, 'pAna', { notes: 'nota de mentira' });
  conferir(await p.evaluate(() => window.__rpc.length) === 1, 'mudar outra coisa (observação) não manda');
  await editarSaude(p, 'pAna', { 'plan.valid': '2030-01-31' });
  conferir(await p.evaluate(() => window.__rpc.length) === 2 && (await abrir(p, 1)).j.pessoas.find((x) => x.perfil_id === 'pAna').validade === '2030-01-31', 'mudar só a validade manda o resumo de novo');
  await editarSaude(p, 'pBruno', { doctor: 'Dr. Mentira' });
  conferir(await p.evaluate(() => window.__rpc.length) === 3, 'mudar o médico manda de novo');

  /* Senhas da casa fechadas: pendente até abrir */
  await p.evaluate(() => Cofre.trancar());
  await editarSaude(p, 'pBruno', { doctor: 'Dra. Outra Mentira' });
  conferir(await p.evaluate(() => window.__rpc.length === 3 && SaudeMT.pendente()), 'Senhas da casa fechadas: não manda e fica pendente');
  await ligar(p, true); await p.evaluate(() => go('settings', 'integr')); await p.waitForTimeout(400);
  conferir(/esperando/.test(await p.evaluate(() => document.querySelector('main').textContent)), '⚙ → Integrações mostra que tem uma atualização esperando');
  await p.evaluate(async (pin) => { await Cofre.destrancarPin(pin); }, PIN);
  conferir(await p.waitForFunction(() => window.__rpc.length === 4 && !SaudeMT.pendente(), null, { timeout: 5000 }).then(() => true, () => false), 'ao abrir as Senhas da casa, o pendente vai');
  conferir((await abrir(p, 3)).j.pessoas.find((x) => x.perfil_id === 'pBruno').medico === 'Dra. Outra Mentira', 'e vai o resumo atualizado');

  /* erro no servidor: continua pendente */
  await p.evaluate(() => { window.__falha = true; });
  await editarSaude(p, 'pAna', { 'plan.operator': 'Operadora Três' });
  conferir(await p.evaluate(() => SaudeMT.pendente()), 'erro no envio: fica pendente para tentar de novo');
  await p.evaluate(() => { window.__falha = false; });

  /* desligar */
  await ligar(p, false);
  const n = await p.evaluate(() => window.__rpc.length);
  await editarSaude(p, 'pAna', { 'plan.operator': 'Operadora Quatro' });
  conferir(await p.evaluate((n) => !SaudeMT.ligado() && !SaudeMT.pendente() && window.__rpc.length === n, n), 'desligado de novo: não manda mais nada');

  /* criança e "só neste aparelho" */
  const outros = await p.evaluate(async () => {
    const r = S.role; S.role = 'crianca'; const crianca = SaudeMT.pode(); S.role = r;
    const m = S.mode; S.mode = 'local'; const local = SaudeMT.pode(); go('settings', 'integr'); await new Promise((x) => setTimeout(x, 400));
    const temCaixa = !!document.querySelector('[data-chg="mt.saude"]'); S.mode = m;
    return { crianca, local, temCaixa };
  });
  conferir(!outros.crianca && !outros.local && !outros.temCaixa, 'criança e "só neste aparelho": não mandam e não veem a opção');
  conferir(!lixo.erros.length, 'nenhum erro na página' + (lixo.erros.length ? ': ' + lixo.erros.join(' | ') : ''));
  await ctx.close();
  await terminar(falhas, browser, 'Saúde → MoneyTRIO — híbrida, cifrada com a chave da família, só os 5 campos (pets também), manda ao ligar e quando muda plano, validade ou médico, pendente com as Senhas da casa fechadas.');
})().catch((e) => { console.error('Erro no teste:', e.message); process.exit(1); });
