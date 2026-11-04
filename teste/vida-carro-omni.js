/* 🚗 Veículos como aba própria e 🔧 Vida do carro (2.22.0), em 390 px. Confere:
     - a aba 🚗 Veículos fica fora da Casa (☰ e Casa) e o endereço antigo (#/house/cars/<id>) leva para a aba nova
     - anotar um serviço à mão: vai para a Vida do carro, atualiza a km do carro e não aparece em Casa → Manutenção
     - serviço repetido: o coxim trocado há 20 dias aparece com ⚠️, a data, a oficina e o aviso da garantia de 90 dias
     - foto da nota: lida no aparelho; para a IA vai só o texto, sem placa, chassi, CPF, telefone e nomes; a pessoa
       confere; o custo vai ao MoneyTRIO com a categoria do carro, uma vez só
     - leitura sem IA (no aparelho): data, km, total e itens com preço
     - orçamento não entra no histórico, nos gastos nem na km
     - revisão feita pela Vida do carro recalcula a próxima (data e km), sem linha repetida
     - saúde do carro, gastos por ano, EN e nada passando da largura da tela
   Só valores de mentira. Prints: PRINTS=<pasta> node teste/vida-carro-omni.js */
const fs = require('fs'), path = require('path');
const { criarConferir, abrirApp, iniciar, terminar } = require('./_base');
const { falhas, conferir } = criarConferir();
const PRINTS = process.env.PRINTS || '';
const PLACA = 'TST0A00', CHASSI = '9ZZTESTE000000001', CPF = '123.456.789-09', FONE = '(11) 91234-5678', NOME = 'Fulano Mentiroso';
const foto = async (p, nome, ate) => {
  if (!PRINTS) return; fs.mkdirSync(PRINTS, { recursive: true });
  await p.evaluate((sel) => {
    document.querySelectorAll('.toast').forEach((t) => t.remove());
    const e = sel ? document.querySelector(sel) : null;
    window.scrollTo({ top: e ? Math.max(0, e.getBoundingClientRect().top + scrollY - 130) : 0, behavior: 'instant' });
  }, ate || '');
  await p.waitForTimeout(250); await p.screenshot({ path: path.join(PRINTS, nome + '.png') });
};
const fecharJanelas = (p) => p.evaluate(() => { document.querySelectorAll('dialog[open]').forEach((d) => { try { d.close(); } catch (e) {} }); });
const formAberto = (p, re) => p.waitForFunction((re) => [...document.querySelectorAll('.modal h3')].some((h) => new RegExp(re).test(h.textContent)) && document.querySelector('.modal [name="itens"]'), re, { timeout: 8000 }).then(() => true, () => false);
const salvar = async (p) => { await p.click('.modal:has([name="itens"]) [data-ok]'); await p.waitForFunction(() => !document.querySelector('.modal [name="itens"]'), null, { timeout: 8000 }).catch(() => {}); await p.waitForTimeout(300); };

(async () => {
  const browser = await iniciar();
  console.log('\n[celular, só neste aparelho]');
  const { p, lixo } = await abrirApp(browser, 'celular', { semEntrar: true });
  await p.evaluate(() => ACT['gate.local']());
  await p.waitForSelector('#fn', { timeout: 10000 });
  await p.fill('#fn', 'Família Teste'); await p.fill('#mn', 'Pessoa Teste'); await p.click('#go');
  await p.waitForFunction(() => S.booted, null, { timeout: 15000 });
  await p.waitForTimeout(600); await fecharJanelas(p);
  const ids = await p.evaluate(async () => {
    await Vault.setup('senha-de-mentira-123'); AOne.save({ hello: 1, tips: { house: 1, cars: 1 } });
    window.__mt = []; Bridge.post = (m) => { window.__mt.push(m); };
    const c = await DB.put('places', { kind: 'veiculo', parent: '', name: 'Carro de Teste', carro: { marca: 'Marca', modelo: 'Modelo 1.0' }, seguro: { seguradora: 'Seguradora Exemplo', fim: addDays(today(), 200) } });
    const r = await DB.put('maint', { title: 'Revisão do carro', cat: 'carro', interval: 365, last: addDays(today(), -300), next: addDays(today(), 65), nextManual: false, veiculo: c.id, cadaKm: 10000, ultKm: 47700, history: [] });
    return { car: c.id, rev: r.id };
  });

  /* ---------- aba própria ---------- */
  await p.evaluate(() => go('house')); await p.waitForTimeout(400);
  conferir(await p.evaluate(() => ![...document.querySelectorAll('.seg button')].some((b) => /Veículos/.test(b.textContent))), 'Casa não tem mais a parte "Veículos"');
  conferir(await p.evaluate(() => visibleTabs().some((t) => t.id === 'cars') && DRAWER_GROUPS().some((g) => g.tabs.includes('cars'))), 'a aba 🚗 Veículos existe e está no ☰');
  await p.evaluate((id) => { location.hash = '#/house/cars/' + id; }, ids.car); await p.waitForTimeout(500);
  conferir(await p.evaluate((id) => S.route.tab === 'cars' && S.route.sub === 'ficha' && S.route.arg === id && location.hash === '#/cars/ficha/' + id, ids.car), 'endereço antigo (Casa → Veículos) leva para a aba nova, na ficha do carro');
  conferir(await p.locator('h3', { hasText: 'Vida do carro' }).count() === 1 && await p.locator('[data-act="vida.foto"]').count() === 1, 'a ficha do carro tem o cartão "🔧 Vida do carro" com a foto da nota');

  /* ---------- anotar à mão ---------- */
  await p.evaluate((id) => { ACT['vida.new']({ id }); }, ids.car);
  conferir(await formAberto(p, 'Anotar serviço'), 'anotar à mão abre a janela do serviço');
  await p.fill('.modal [name="d"]', await p.evaluate(() => addDays(today(), -20)));
  await p.fill('.modal [name="km"]', '48000'); await p.fill('.modal [name="oficina"]', 'Oficina Exemplo');
  await p.fill('.modal [name="itens"]', 'Coxim do motor: 350,00\nMão de obra: 120,00');
  await p.setChecked('.modal [name="mt"]', false);
  await salvar(p);
  const s1 = await p.evaluate((id) => { const s = Vida.servicos(id)[0]; return s ? { cost: s.cost, km: s.km, n: s.itens.length, carKm: DB.get('places', id).km, casa: Maint.list().some((m) => m.id === s.id), linha: Vida.linha(id).length, mt: window.__mt.length } : null; }, ids.car);
  conferir(s1 && s1.cost === 470 && s1.km === 48000 && s1.n === 2, 'serviço salvo com os itens, a km e o total somado (R$ 470)' + (s1 ? '' : ': nada salvo'));
  conferir(s1 && s1.carKm === 48000, 'a quilometragem do carro passa a ser a da nota');
  conferir(s1 && !s1.casa && s1.linha === 1, 'o serviço fica na Vida do carro e não aparece em Casa → Manutenção');
  conferir(s1 && s1.mt === 0, 'sem "Enviar o custo" marcado, nada vai ao MoneyTRIO');

  /* ---------- serviço repetido ---------- */
  await p.evaluate((id) => { ACT['vida.new']({ id }); }, ids.car);
  await formAberto(p, 'Anotar serviço');
  await p.fill('.modal [name="itens"]', 'Coxim dianteiro: 400,00');
  const aviso = await p.waitForFunction(() => /Coxim dianteiro/.test((document.querySelector('#vidarep') || {}).textContent || ''), null, { timeout: 4000 }).then(() => p.evaluate(() => document.querySelector('#vidarep').textContent), () => '');
  conferir(/⚠️/.test(aviso) && /há 20 dias/.test(aviso) && /Oficina Exemplo/.test(aviso) && /48\.000 km/.test(aviso), 'coxim de novo: ⚠️ "já feito há 20 dias", com a oficina e a km');
  conferir(/90 dias/.test(aviso) && /garantia/.test(aviso), 'e lembra da garantia de 90 dias do Código de Defesa do Consumidor');
  await foto(p, '04-servico-repetido');
  await p.click('.modal:has([name="itens"]) .mf [data-x]');
  /* com algo escrito, a janela comum pergunta "Descartar?" antes de fechar */
  if (await p.waitForSelector('.sj-pergunta[open]', { timeout: 2000 }).then(() => true, () => false)) await p.click('[data-sj=descartar]');
  await p.waitForTimeout(400);
  conferir(await p.evaluate((id) => Vida.servicos(id).length === 1 && !document.querySelector('.modal [name="itens"]'), ids.car), 'Cancelar (e descartar): nada é salvo');

  /* ---------- foto da nota (IA de mentira) ---------- */
  const TEXTO = 'AUTO CENTER EXEMPLO LTDA\nCliente: ' + NOME + '\nCPF: ' + CPF + '\nFone ' + FONE + '\nPlaca: ' + PLACA + ' Chassi ' + CHASSI + '\nData: DATA\nKM: 49.500\nTroca de oleo 5W30 250,00\nFiltro de oleo 60,00\nPastilhas de freio dianteiras 300,00\nTOTAL 610,00';
  await p.evaluate(async (a) => {
    const cv = document.createElement('canvas'); cv.width = cv.height = 8; const b = await new Promise((r) => cv.toBlob(r, 'image/jpeg'));
    window.__foto = new File([b], 'nota.jpg', { type: 'image/jpeg' });
    Files.pick = async () => [window.__foto];
    const d = addDays(today(), -5); window.__d5 = d;
    OCR.read = async (f, cb, semTarefa) => { window.__semTarefa = semTarefa; return a.texto.replace('DATA', d.split('-').reverse().join('/')); };
    AI.on = () => true; Net.canAI = () => true;
    AI.ask0 = async (prompt, imgs) => { window.__prompt = prompt; window.__imgs = (imgs || []).length; return { tipo: 'nota', data: d, km: 49500, oficina: 'Auto Center Exemplo', itens: [{ nome: 'Troca de óleo', tipo: 'servico', valor: 250 }, { nome: 'Filtro de óleo', tipo: 'peca', valor: 60 }, { nome: 'Pastilhas de freio', tipo: 'peca', valor: 300 }], total: 610 }; };
  }, { texto: TEXTO });
  await p.evaluate((id) => go('cars', 'vida', id), ids.car); await p.waitForTimeout(400);
  await p.evaluate((id) => { ACT['vida.foto']({ id }); }, ids.car);
  conferir(await formAberto(p, 'Confira o que foi lido'), 'foto da nota: depois de ler, abre "Confira o que foi lido"');
  const pr = await p.evaluate(() => window.__prompt || '');
  conferir(!!pr && ![PLACA, CHASSI, CPF, '91234-5678', 'Fulano', 'Mentiroso'].some((x) => pr.includes(x)) && /\[placa\]/.test(pr) && /\[chassi\]/.test(pr), 'para a IA vai só o texto, sem placa, chassi, CPF, telefone e nome do cliente');
  conferir(await p.evaluate(() => window.__imgs) === 0, 'a foto em si não vai para a IA');
  conferir(await p.evaluate(() => window.__semTarefa) === true, 'a leitura da foto roda dentro do trabalho em segundo plano (sem outra tarefa que puxe a pessoa de volta)');
  const lido = await p.evaluate(() => ({ km: document.querySelector('.modal [name="km"]').value, of: document.querySelector('.modal [name="oficina"]').value, it: document.querySelector('.modal [name="itens"]').value, sub: document.querySelector('.modal [name="mtsub"]').value, ia: /Lido com a IA/.test(document.querySelector('.modal').textContent) }));
  conferir(lido.km === '49500' && lido.of === 'Auto Center Exemplo' && /Troca de óleo: 250,00/.test(lido.it) && lido.ia, 'a janela vem preenchida com o que foi lido (km, oficina, itens com valor)');
  conferir(lido.sub === 'Revisao Periodica', 'troca de óleo e filtro: sugere "Revisao Periodica" no MoneyTRIO');
  await foto(p, '05-foto-lida');
  await p.setChecked('.modal [name="mt"]', true);
  await salvar(p);
  const s2 = await p.evaluate((id) => { const s = Vida.servicos(id).find((x) => x.km === 49500); return { ok: !!s, files: s && (s.files || []).length, env: s && s.mtEnviado, mt: window.__mt.map((m) => m.dados), carKm: DB.get('places', id).km }; }, ids.car);
  conferir(s2.ok && s2.files === 1 && s2.carKm === 49500, 'salvo com a foto da nota, e a km do carro sobe para 49.500');
  conferir(await p.evaluate((id) => { const s = Vida.servicos(id).find((x) => x.km === 49500); const m = Files.meta(s.files[0]); return !!m && m.vis === 'restrito' && !!m.enc; }, ids.car), 'a foto da nota fica trancada (só responsáveis), como os documentos do carro');
  conferir(s2.mt.length === 1 && s2.mt[0].grupo === 'VEICULO' && s2.mt[0].sub === 'Revisao Periodica' && s2.mt[0].valor === 610 && s2.env, 'com "Enviar o custo" marcado: vai ao MoneyTRIO uma vez, grupo VEICULO, "Revisao Periodica", R$ 610');
  await p.evaluate((id) => { const s = Vida.servicos(id).find((x) => x.km === 49500); ACT['vida.edit']({ id: s.id }); }, ids.car);
  await formAberto(p, 'Troca de óleo');
  conferir(await p.evaluate(() => !document.querySelector('.modal [name="mt"]') && /Já enviado ao MoneyTRIO/.test(document.querySelector('.modal').textContent)), 'ao abrir de novo: "Já enviado ao MoneyTRIO" e sem a opção de mandar outra vez');
  conferir(await p.waitForSelector('.modal #vfotos .thumb', { timeout: 4000 }).then(() => true, () => false), 'ao abrir de novo, a foto da nota aparece (📎) para ver ou tirar');
  await salvar(p);
  conferir(await p.evaluate(() => window.__mt.length) === 1, 'salvar de novo não manda outra vez');

  /* ---------- sem IA: leitura no aparelho ---------- */
  const loc = await p.evaluate((t) => Vida.local(Vida.mascarar(t.replace('DATA', '05/10/2026'))), TEXTO);
  conferir(loc.d === '2026-10-05' && loc.km === 49500 && loc.total === 610 && loc.itens.some((x) => /Troca de oleo/i.test(x.n) && x.v === 250) && !loc.ia, 'sem IA, o aparelho acha a data, a km, o total e os itens com preço');
  conferir(/exemplo/i.test(loc.oficina), 'e o nome da oficina (' + loc.oficina + ')');
  conferir(await p.evaluate(() => { const t = Vida.mascarar('Pessoa Teste levou o carro'); return !/Pessoa|Teste/.test(t); }), 'nomes da família também saem do texto');

  /* ---------- orçamento ---------- */
  await p.evaluate((id) => { ACT['vida.new']({ id }); }, ids.car);
  await formAberto(p, 'Anotar serviço');
  await p.selectOption('.modal [name="tipo"]', 'orcamento');
  await p.fill('.modal [name="km"]', '60000'); await p.fill('.modal [name="itens"]', 'Coxim do motor: 500,00');
  await salvar(p);
  const o = await p.evaluate((id) => ({ orc: Vida.servicos(id).filter((s) => s.orc).length, linha: Vida.linha(id).some((x) => x.valor === 500), km: DB.get('places', id).km, mt: window.__mt.length }), ids.car);
  conferir(o.orc === 1 && !o.linha && o.km === 49500 && o.mt === 1, 'orçamento fica guardado à parte: fora do histórico, dos gastos, da km e do MoneyTRIO');

  /* ---------- revisão pela Vida do carro ---------- */
  await p.evaluate((id) => { ACT['vida.new']({ id }); }, ids.car);
  await formAberto(p, 'Anotar serviço');
  await p.fill('.modal [name="km"]', '50100'); await p.fill('.modal [name="itens"]', 'Revisão dos 50 mil: 900,00');
  await p.waitForTimeout(400);
  conferir(await p.evaluate(() => document.querySelector('.modal [name="rev"]').checked), 'com "Revisão" nos itens, já vem marcado "Esta foi a revisão programada"');
  await p.setChecked('.modal [name="mt"]', false);
  await salvar(p);
  const rv = await p.evaluate((a) => { const m = DB.get('maint', a.rev); return { last: m.last, next: m.next, ult: m.ultKm, hist: (m.history || []).length, dup: Vida.linha(a.car).filter((x) => x.d === today() && /Revis/.test(x.t)).length, prox: Vida.revisao(DB.get('places', a.car)).kmProx }; }, ids);
  conferir(rv.last === await p.evaluate(() => today()) && rv.next === await p.evaluate(() => addDays(today(), 365)) && rv.ult === 50100 && rv.prox === 60100, 'a próxima revisão é recalculada: daqui a 365 dias ou aos 60.100 km');
  conferir(rv.hist === 1 && rv.dup === 1, 'a revisão aparece uma vez só na Vida do carro (sem linha repetida)');

  /* ---------- Casa → Manutenção: "Feito" com km ---------- */
  await p.evaluate((id) => { ACT['mt.done']({ id }); }, ids.rev);
  await p.waitForSelector('.modal [name="km"]', { timeout: 5000 });
  await p.fill('.modal [name="km"]', '50500'); await p.setChecked('.modal [name="mt"]', false);
  await p.click('.modal:has([name="km"]) [data-ok]'); await p.waitForTimeout(500);
  conferir(await p.evaluate((a) => DB.get('places', a.car).km === 50500 && DB.get('maint', a.rev).ultKm === 50500, ids), 'manutenção do carro marcada como feita em Casa → Manutenção: guarda a km (carro e revisão)');

  /* ---------- tela da Vida do carro ---------- */
  await p.evaluate((id) => go('cars', 'vida', id), ids.car); await p.waitForTimeout(500);
  const tela = await p.evaluate(() => document.querySelector('main') ? document.querySelector('main').textContent : document.body.textContent);
  conferir(/Saúde do carro/.test(tela) && /Próxima revisão/.test(tela) && /50\.500 km/.test(tela), 'Vida do carro: saúde do carro com a próxima revisão e a km');
  conferir(/Feito nos últimos 90 dias/.test(tela) && /Coxim do motor/.test(tela), 'mostra o que foi feito nos últimos 90 dias (para não pagar de novo)');
  conferir(/Gastos por ano/.test(tela) && /Orçamentos guardados/.test(tela), 'gastos por ano e orçamentos guardados à parte');
  conferir(![PLACA, CHASSI].some((x) => tela.includes(x)), 'a tela não mostra placa nem chassi');
  conferir(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'nada passa da largura da tela (390 px)');
  await foto(p, '03-vida-do-carro');
  await foto(p, '03b-vida-do-carro-lista', '.card:has(h3:is(:not(:empty))) + .card');
  await p.evaluate((id) => go('cars', 'ficha', id), ids.car); await p.waitForTimeout(400);
  await foto(p, '02-ficha-com-vida', '.card:has([data-act="vida.foto"])');
  await p.evaluate(() => go('cars')); await p.waitForTimeout(300);
  await foto(p, '01-aba-veiculos');


  /* ---------- achados da revisão de código (04/Nov/2026), num segundo carro ---------- */
  const c2 = await p.evaluate(async () => {
    const c = await DB.put('places', { kind: 'veiculo', parent: '', name: 'Segundo carro', carro: {}, seguro: {}, km: 61000 });
    const r = await DB.put('maint', { title: 'Revisão programada', cat: 'carro', interval: 365, last: addDays(today(), -400), next: addDays(today(), -35), nextManual: false, veiculo: c.id, cadaKm: 10000, ultKm: 47700, history: [] });
    return { car: c.id, rev: r.id };
  });
  const novo2 = async () => { await p.evaluate((id) => { ACT['vida.new']({ id }); }, c2.car); await formAberto(p, 'Anotar serviço'); };
  const descartar = async () => { await p.click('.modal:has([name="itens"]) .mf [data-x]'); if (await p.waitForSelector('.sj-pergunta[open]', { timeout: 2000 }).then(() => true, () => false)) await p.click('[data-sj=descartar]'); await p.waitForTimeout(300); };
  await novo2();
  await p.fill('.modal [name="d"]', await p.evaluate(() => addDays(today(), -30)));
  await p.fill('.modal [name="km"]', '62.300'); await p.fill('.modal [name="itens"]', 'Embreagem: 1890,00\nMão de obra: 300,00');
  await p.setChecked('.modal [name="mt"]', false); await salvar(p);
  let e1 = await p.evaluate((id) => { const s = Vida.servicos(id)[0]; return { id: s.id, cost: s.cost, v: s.itens[0].v, km: s.km, car: DB.get('places', id).km }; }, c2.car);
  conferir(e1.cost === 2190 && e1.v === 1890, 'item de R$ 1.890 (escrito "1890,00") guarda o valor certo e entra no total');
  conferir(e1.km === 62300 && e1.car === 62300, 'km escrita com ponto ("62.300") vira 62.300 km, não 62');
  await p.evaluate((id) => { ACT['vida.edit']({ id }); }, e1.id); await formAberto(p, 'Embreagem');
  conferir(/Embreagem: 1\.890,00/.test(await p.evaluate(() => document.querySelector('.modal [name="itens"]').value)), 'ao abrir de novo, aparece "Embreagem: 1.890,00"');
  await salvar(p);
  e1 = await p.evaluate((id) => { const s = DB.get('maint', id); return { cost: s.cost, v: s.itens[0].v }; }, e1.id);
  conferir(e1.cost === 2190 && e1.v === 1890, 'salvar de novo não estraga o valor de R$ 1.890');
  await novo2();
  await p.fill('.modal [name="itens"]', 'Bateria: 500,00\nMão de obra: 80,00'); await p.waitForTimeout(500);
  conferir(!/Mão de obra/.test(await p.evaluate(() => document.querySelector('#vidarep').textContent)), '"Mão de obra" (que toda nota tem) não acusa serviço repetido');
  await descartar();
  /* revisão feita sem km: conta da km do carro e não fica "atrasada" */
  await novo2();
  await p.fill('.modal [name="itens"]', 'Revisão completa: 900,00'); await p.waitForTimeout(400); await p.setChecked('.modal [name="mt"]', false);
  await salvar(p);
  const sr = await p.evaluate((a) => { const s = Vida.servicos(a.car).find((x) => x.cost === 900); const rv = Vida.revisao(DB.get('places', a.car)); return { id: s.id, ult: DB.get('maint', a.rev).ultKm, passou: rv.kmPassou, dias: rv.dias }; }, c2);
  conferir(sr.ult === 62300 && !sr.passou && sr.dias > 300, 'revisão feita sem km: a contagem recomeça da km do carro (não aparece "atrasada")');
  const hist = () => p.evaluate((a) => ({ n: (DB.get('maint', a.rev).history || []).filter((h) => h.servico === a.sid).length, linha: Vida.linha(a.car).filter((x) => x.valor === 900).length }), Object.assign({ sid: sr.id }, c2));
  await p.evaluate((id) => { ACT['vida.edit']({ id }); }, sr.id); await formAberto(p, 'Revisão'); await salvar(p);
  let h = await hist();
  conferir(h.n === 1 && h.linha === 1, 'salvar a revisão de novo não repete a linha no histórico');
  await p.evaluate((id) => { ACT['vida.edit']({ id }); }, sr.id); await formAberto(p, 'Revisão');
  await p.selectOption('.modal [name="tipo"]', 'orcamento'); await salvar(p);
  h = await hist();
  conferir(h.n === 0 && h.linha === 0, 'virou orçamento: sai do histórico da revisão e dos gastos');
  await p.evaluate((id) => { ACT['vida.edit']({ id }); }, sr.id); await formAberto(p, 'Revisão');
  await p.selectOption('.modal [name="tipo"]', 'nota'); await p.setChecked('.modal [name="rev"]', true); await salvar(p);
  conferir((await hist()).n === 1, 'voltou a "Serviço feito": a linha volta (uma vez)');
  await p.evaluate((id) => { ACT['vida.edit']({ id }); }, sr.id); await formAberto(p, 'Revisão');
  await p.click('.modal [data-del]'); await p.waitForSelector('.modal [data-yes]', { timeout: 4000 }); await p.click('.modal [data-yes]'); await p.waitForTimeout(500);
  h = await hist();
  conferir(h.n === 0 && h.linha === 0 && !(await p.evaluate((id) => !!DB.get('maint', id), sr.id)), 'apagado: some da Vida do carro e do histórico da revisão');
  /* nomes das peças */
  const ch = await p.evaluate(() => ({ al: Vida.chave('Alinhamento dos pneus'), ba: Vida.chave('Balanceamento de pneus'), pn: Vida.chave('Pneu novo'), rf: Vida.chave('Revisão dos freios'), rv: Vida.chave('6ª Revisão'), ca: Vida.chave('Coxim do amortecedor'), cm: Vida.chave('Coxim do motor'), mo: Vida.chave('Mão de obra troca do coxim') }));
  conferir(ch.al === 'alinhamento' && ch.ba === 'balanceamento' && ch.pn === 'pneu', 'alinhamento e balanceamento "dos pneus" não contam como troca de pneu');
  conferir(ch.rf !== 'revisao' && ch.rv === 'revisao', '"Revisão dos freios" não é a revisão programada');
  conferir(ch.ca !== ch.cm && ch.mo === 'coxim', 'coxim do amortecedor ≠ coxim do motor; "Mão de obra troca do coxim" conta como coxim');
  /* o que sai do texto antes da IA, e o que fica */
  const T2 = 'AUTO CENTER EXEMPLO LTDA\nEnd.: Rua das Flores, 123  Bairro: Centro\nCliente: ANDRE SOUZA   Data: 05/10/2026   KM: 49.500\nPlaca: ' + PLACA + ' Chassi ' + CHASSI + ' Renavam 01234567890\nAndré e Ângela levaram o carro\nOleo SAE 5W30 sintetico 250,00\nKit embreagem 1250,00\nCOM 1500 km de garantia\nFILTRO DO MOTOR 60,00\nRADIADOR 1.890,00\nSubtotal 3.450,00\nDesconto 50,00\nTotal geral 3.400,00';
  const mk = await p.evaluate((t) => { const o = People.list; People.list = () => [{ name: 'André Ângela' }]; try { const m = Vida.mascarar(t); return { m, l: Vida.local(m) }; } finally { People.list = o; } }, T2);
  conferir(!/Rua das Flores|Centro\b/.test(mk.m) && !/ANDRE|SOUZA|André|Ângela/.test(mk.m) && ![PLACA, CHASSI, '01234567890'].some((x) => mk.m.includes(x)), 'saem do texto: endereço ("End.:"), nome do cliente, nomes com acento, placa, chassi e renavam');
  conferir(/Data: 05\/10\/2026/.test(mk.m) && /KM: 49\.500/.test(mk.m) && /5W30/.test(mk.m) && /1250,00/.test(mk.m) && /1500 km/.test(mk.m), 'ficam: a data e a km da linha do cliente, "SAE 5W30", "1250,00" e "1500 km"');
  conferir(mk.l.total === 3400 && mk.l.d === '2026-10-05' && mk.l.km === 49500, 'sem IA: o total é o "Total geral" (não o Subtotal), com a data e a km');
  conferir(mk.l.itens.some((x) => x.n === 'FILTRO DO MOTOR') && mk.l.itens.some((x) => x.n === 'RADIADOR' && x.v === 1890) && mk.l.itens.some((x) => x.n === 'Kit embreagem' && x.v === 1250), 'sem IA: nomes inteiros ("FILTRO DO MOTOR", "RADIADOR") e valores de milhar certos');


  /* ---------- 2ª revisão de código (04/Nov/2026) ---------- */
  const r2 = await p.evaluate(() => ({
    rev: ['Revisão anual (óleo e filtros)', 'Revisão + troca de óleo', 'Car service', 'Scheduled service'].every((t) => Vida.ehRevisao(t)),
    naoRev: ['Revisão geral dos freios', 'Revisão no freio', 'Revisão freios', 'Revisão do sistema de freio'].every((t) => !Vida.ehRevisao(t)),
    km: [kmDe('52,300'), kmDe('49.500,5'), kmDe('10,000')],
    it: Vida.itensDe('Troca de óleo 5W-30\nPneu 175/70 R-14\nMão de obra - 120,00\nDesconto: -50,00\nDesconto: 30,00\nEngine mount: 1,250.00'),
    soma: Vida.soma(Vida.itensDe('Coxim: 350,00\nMão de obra: 120,00\nSubtotal: 470,00\nDesconto: 20,00\nTotal: 450,00')),
    l1: Vida.local('CONCESSIONARIA EXEMPLO LTDA\nData: 01/11/2026\nRevisão 40.000 km 890,00\nTotal 890,00'),
    l2: Vida.local('OFICINA EXEMPLO\nTotal de peças 500,00\nTotal de serviços 200,00\nValor a pagar 700,00'),
    l3: Vida.local('OFICINA EXEMPLO\nVenc. 10/12/2099\nData de emissão 05/10/2026\nPastilha dianteira 120,10\nMão de obra 350,20'),
    chaves: [Vida.chave('Coxim dianteiro do amortecedor'), Vida.chave('Calibragem dos pneus'), Vida.chave('Óleo da direção hidráulica'), Vida.chave('Aditivo de combustível'), Vida.chave('Óleo de freio')]
  }));
  conferir(r2.rev && r2.naoRev, 'revisão programada reconhecida com óleo/filtro no nome e em inglês; "revisão (geral) dos freios" não conta');
  conferir(r2.km.join() === '52300,49500,10000', 'km com vírgula de milhar ("52,300") não vira 52');
  conferir(r2.it[0].n === 'Troca de óleo 5W-30' && r2.it[0].v === 0 && r2.it[1].v === 0 && r2.it[2].v === 120 && r2.it[3].v === -50 && r2.it[4].v === -30 && r2.it[5].v === 1250, 'itens: "5W-30" e "R-14" são nome (não preço), desconto é negativo, "1,250.00" vale 1.250');
  conferir(r2.soma === 450, 'Total vazio: a soma ignora Subtotal/Total e desconta o desconto (R$ 450)');
  conferir(r2.l1.km === 40000, 'sem IA: "Revisão 40.000 km 890,00" não vira km 890');
  conferir(r2.l2.total === 700 && !r2.l2.itens.some((x) => /pagar/i.test(x.n)), 'sem IA: "Valor a pagar" é o total, não um item');
  conferir(r2.l3.d === '2026-10-05' && r2.l3.total === '', 'sem IA: a data é a de emissão (não a de vencimento); sem linha de total, o Total fica vazio (vale a soma)');
  conferir(r2.chaves[0] === 'coxim-amortecedor' && r2.chaves[1] !== 'pneu' && r2.chaves[2] === 'direcao-hidraulica' && r2.chaves[3] !== 'arrefecimento' && r2.chaves[4] === 'fluido-freio', 'nomes das peças: coxim do amortecedor, calibragem, direção hidráulica, aditivo de combustível e óleo de freio');
  /* o que sai do texto antes da IA (nota fiscal, CPF e telefone em outros formatos, sobrenome que é peça) */
  const mk2 = await p.evaluate(() => {
    const o = People.list; People.list = () => [{ name: 'Roberta Correia' }];
    try {
      return {
        danfe: Vida.mascarar('NOME / RAZÃO SOCIAL CNPJ / CPF DATA DA EMISSÃO\nJOÃO DA SILVA 123.456.789-09 05/10/2026\nENDEREÇO BAIRRO / DISTRITO CEP\nRUA DAS FLORES, 123 CENTRO 01234-567 05/10/2026\nNome/Razão Social: MARIA DE SOUZA\nRazão Social: AUTO CENTER EXEMPLO LTDA'),
        docs: Vida.mascarar('CPF: 123456789-09\nCPF 123 456 789 09\nTel: 11 98765 4321\nWhatsApp 11 9 8765 4321\nFone 11 3456 7890\nTotal 1.234,56 KM 49.500'),
        linhas: Vida.mascarar('ORDEM DE SERVIÇO\nCliente:\nData: 05/10/2026\nNome do cliente\nCoxim do motor 350,00\nCliente:\nJOAO DA SILVA'),
        sobrenome: Vida.mascarar('Roberta Correia trouxe o carro\nCorreia dentada 450,00')
      };
    } finally { People.list = o; }
  });
  conferir(!/JOÃO|SILVA|MARIA|SOUZA|FLORES|01234-567/.test(mk2.danfe) && /05\/10\/2026/.test(mk2.danfe) && /AUTO CENTER EXEMPLO LTDA/.test(mk2.danfe), 'nota fiscal (DANFE): nome e endereço do cliente na linha de baixo saem; a data e o nome da oficina ficam');
  conferir(!/123456789-09|123 456 789 09|98765|3456 7890/.test(mk2.docs) && /1\.234,56/.test(mk2.docs) && /49\.500/.test(mk2.docs), 'CPF e telefone em outros formatos saem; preço e km ficam');
  conferir(/Data: 05\/10\/2026/.test(mk2.linhas) && /Coxim do motor 350,00/.test(mk2.linhas) && !/JOAO/.test(mk2.linhas), '"Cliente:" vazio não engole a data nem o item da linha de baixo; o nome na linha de baixo sai');
  conferir(!/Roberta/.test(mk2.sobrenome) && /Correia dentada 450,00/.test(mk2.sobrenome), 'sobrenome que é peça ("Correia"): o nome da pessoa sai, a "Correia dentada" fica');

  /* revisão marcada por um serviço: apagar ou virar orçamento devolve a revisão como estava */
  const c3 = await p.evaluate(async () => {
    const c = await DB.put('places', { kind: 'veiculo', parent: '', name: 'Terceiro carro', carro: {}, seguro: {}, km: 70000 });
    const r = await DB.put('maint', { title: 'Revisão + troca de óleo', cat: 'carro', interval: 365, last: addDays(today(), -400), next: addDays(today(), -35), nextManual: false, veiculo: c.id, cadaKm: 10000, ultKm: 60000, history: [] });
    return { car: c.id, rev: r.id, last: r.last, next: r.next };
  });
  const novo3 = async () => { await p.evaluate((id) => { ACT['vida.new']({ id }); }, c3.car); await formAberto(p, 'Anotar serviço'); };
  await novo3();
  await p.fill('.modal [name="d"]', await p.evaluate(() => addDays(today(), -10)));
  await p.fill('.modal [name="km"]', '70500'); await p.fill('.modal [name="itens"]', 'Troca de óleo e filtros: 450,00'); await p.setChecked('.modal [name="mt"]', false);
  conferir(await p.evaluate(() => !!document.querySelector('.modal [name="rev"]')), 'revisão com "óleo" no nome: a caixa "Esta foi a revisão programada" aparece');
  await p.setChecked('.modal [name="rev"]', true); await salvar(p);
  const sid3 = await p.evaluate((id) => Vida.servicos(id)[0].id, c3.car);
  const rv3 = () => p.evaluate((a) => { const m = DB.get('maint', a.rev); return { last: m.last, next: m.next, ult: m.ultKm, n: (m.history || []).filter((h) => h.servico === a.sid).length }; }, Object.assign({ sid: sid3 }, c3));
  let x3 = await rv3();
  conferir(x3.n === 1 && x3.last === await p.evaluate(() => addDays(today(), -10)) && x3.ult === 70500, 'marcada à mão: a revisão passa a ter sido feita há 10 dias, aos 70.500 km');
  await p.evaluate((id) => { ACT['vida.edit']({ id }); }, sid3); await formAberto(p, 'Troca');
  conferir(await p.evaluate(() => document.querySelector('.modal [name="rev"]').checked), 'ao abrir de novo, a caixa da revisão continua marcada (não depende do texto)');
  await p.fill('.modal [name="d"]', await p.evaluate(() => addDays(today(), -20))); await salvar(p);
  x3 = await rv3();
  conferir(x3.n === 1 && x3.last === await p.evaluate(() => addDays(today(), -20)), 'data corrigida para antes: a revisão acompanha (uma linha, feita há 20 dias)');
  await p.evaluate((id) => { ACT['vida.edit']({ id }); }, sid3); await formAberto(p, 'Troca');
  await p.selectOption('.modal [name="tipo"]', 'orcamento'); await salvar(p);
  x3 = await rv3();
  conferir(x3.n === 0 && x3.last === c3.last && x3.next === c3.next && x3.ult === 60000, 'virou orçamento: a revisão volta a como estava (atrasada desde antes)');
  await p.evaluate((id) => { ACT['vida.edit']({ id }); }, sid3); await formAberto(p, 'Troca');
  await p.selectOption('.modal [name="tipo"]', 'nota'); await p.setChecked('.modal [name="rev"]', true); await salvar(p);
  await p.evaluate((id) => { ACT['vida.edit']({ id }); }, sid3); await formAberto(p, 'Troca');
  await p.click('.modal [data-del]'); await p.waitForSelector('.modal [data-yes]', { timeout: 4000 }); await p.click('.modal [data-yes]'); await p.waitForTimeout(500);
  x3 = await rv3();
  conferir(x3.n === 0 && x3.last === c3.last && x3.next === c3.next, 'apagado: a revisão volta a como estava');
  /* data no futuro, Total que acompanha os itens, km digitada errado */
  await novo3();
  await p.fill('.modal [name="d"]', await p.evaluate(() => addDays(today(), 5))); await p.fill('.modal [name="km"]', '715000'); await p.fill('.modal [name="itens"]', 'Bateria: 500,00\nMão de obra: 50,00'); await p.setChecked('.modal [name="mt"]', false);
  await p.click('.modal:has([name="itens"]) [data-ok]'); await p.waitForTimeout(500);
  conferir(await p.evaluate(() => !!document.querySelector('.modal [name="itens"]') && /futuro/.test(document.querySelector('#toasts').textContent)), 'serviço feito com data no futuro: avisa e não salva');
  await p.fill('.modal [name="d"]', await p.evaluate(() => today())); await salvar(p);
  const sb = await p.evaluate((id) => { const s = Vida.servicos(id).find((x) => x.cost === 550); return { id: s && s.id, car: DB.get('places', id).km }; }, c3.car);
  conferir(!!sb.id && sb.car === 715000, 'km digitada a mais (715.000) vai para o carro…');
  await p.evaluate((id) => { ACT['vida.edit']({ id }); }, sb.id); await formAberto(p, 'Bateria');
  conferir(await p.evaluate(() => document.querySelector('.modal [name="total"]').value === ''), 'ao abrir de novo, o Total vem vazio (era a soma dos itens)');
  await p.fill('.modal [name="km"]', '71500'); await p.fill('.modal [name="itens"]', 'Bateria: 520,00\nMão de obra: 50,00'); await salvar(p);
  const sb2 = await p.evaluate((a) => ({ cost: DB.get('maint', a.id).cost, car: DB.get('places', a.car).km }), { id: sb.id, car: c3.car });
  conferir(sb2.cost === 570, '…e corrigir o preço muda o custo (R$ 570)');
  conferir(sb2.car === 71500, 'corrigir a km do serviço corrige a km do carro (71.500)');
  /* criança: vê, mas não abre, não apaga e não manda nada ao MoneyTRIO */
  const kid = await p.evaluate(async (id) => {
    const orig = isChild; isChild = () => true; window.__mt.length = 0;
    try {
      go('cars', 'vida', id); await new Promise((r) => setTimeout(r, 400));
      const clic = !!document.querySelector('main [data-act="vida.edit"]');
      await ACT['vida.edit']({ id: Vida.servicos(id)[0].id });
      return { clic, aberta: !!document.querySelector('.modal [name="itens"]'), mt: window.__mt.length, foto: !document.querySelector('main [data-act="vida.foto"]') };
    } finally { isChild = orig; }
  }, c3.car);
  conferir(!kid.clic && !kid.aberta && kid.mt === 0 && kid.foto, 'criança: a lista não abre serviço, nada vai ao MoneyTRIO e não aparece a foto da nota');
  /* Vida do carro desligada no RootifyONE: o AssistONE não oferece e a foto não roda */
  const off = await p.evaluate(async () => {
    const orig = Rec.on; Rec.on = (id) => id !== 'veiculos.vida' && orig.call(Rec, id); window.__pick = 0; const op = Files.pick; Files.pick = async () => { window.__pick++; return []; };
    try { const acts = AOne.HERE().cars[2].map((a) => a[0]).join(' | '); await ACT['vida.foto']({}); return { acts, pick: window.__pick }; } finally { Rec.on = orig; Files.pick = op; }
  });
  conferir(!/Foto da nota/.test(off.acts) && off.pick === 0, 'Vida do carro desligada: o AssistONE não oferece a foto e a foto não roda');
  /* cancelar a leitura: nada vai para a IA */
  const canc = await p.evaluate(async (id) => {
    window.__ia = 0; const oa = AI.ask0, oo = OCR.read, op = Files.pick;
    AI.ask0 = async () => { window.__ia++; return null; }; OCR.read = async () => { await new Promise((r) => setTimeout(r, 700)); return 'Coxim 100,00'; }; Files.pick = async () => [window.__foto, window.__foto];
    try {
      ACT['vida.foto']({ id }); await new Promise((r) => setTimeout(r, 300));
      const t = DGO.fundo.lista().find((x) => /nota do carro/.test(x.titulo || '')); if (t) DGO.fundo.cancelar(t.id);
      await new Promise((r) => setTimeout(r, 2000));
      return { achou: !!t, ia: window.__ia, form: !!document.querySelector('.modal [name="itens"]') };
    } finally { AI.ask0 = oa; OCR.read = oo; Files.pick = op; }
  }, c3.car);
  conferir(canc.achou && canc.ia === 0 && !canc.form, 'cancelar a leitura (✕ na pílula): nada vai para a IA e a janela não abre');
  /* carro apagado: os serviços dele continuam em "Todos" */
  await p.evaluate(async (id) => { await Cars.apagar(DB.get('places', id)); go('cars', 'vida'); }, c3.car); await p.waitForTimeout(500);
  conferir(await p.evaluate(() => /carro apagado/.test(document.querySelector('main').textContent)), 'carro apagado: a Vida do carro dele continua visível em "Todos"');

  /* ---------- EN ---------- */
  await p.evaluate((id) => { S.lang = 'en'; go('cars', 'vida', id); }, ids.car); await p.waitForTimeout(500);
  const en = await p.evaluate(() => document.querySelector('main') ? document.querySelector('main').textContent : document.body.textContent);
  conferir(/Car health/.test(en) && /Everything that was done/.test(en) && !/Saúde do carro|Tudo o que foi feito|Gastos por ano/.test(en), 'em inglês, a Vida do carro fica toda em inglês');
  await p.evaluate(() => { S.lang = 'pt'; });

  conferir(!lixo.erros.length, 'nenhum erro na página' + (lixo.erros.length ? ': ' + lixo.erros.join(' | ') : ''));
  await terminar(falhas, browser, 'Veículos como aba própria e Vida do carro (foto da nota, serviço repetido, orçamento, revisão por km, MoneyTRIO) em 390 px.');
})().catch((e) => { console.error('Erro no teste:', e.message, e.stack); process.exit(1); });
