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
    OCR.read = async () => a.texto.replace('DATA', d.split('-').reverse().join('/'));
    AI.on = () => true; Net.canAI = () => true;
    AI.ask0 = async (prompt, imgs) => { window.__prompt = prompt; window.__imgs = (imgs || []).length; return { tipo: 'nota', data: d, km: 49500, oficina: 'Auto Center Exemplo', itens: [{ nome: 'Troca de óleo', tipo: 'servico', valor: 250 }, { nome: 'Filtro de óleo', tipo: 'peca', valor: 60 }, { nome: 'Pastilhas de freio', tipo: 'peca', valor: 300 }], total: 610 }; };
  }, { texto: TEXTO });
  await p.evaluate((id) => go('cars', 'vida', id), ids.car); await p.waitForTimeout(400);
  await p.evaluate((id) => { ACT['vida.foto']({ id }); }, ids.car);
  conferir(await formAberto(p, 'Confira o que foi lido'), 'foto da nota: depois de ler, abre "Confira o que foi lido"');
  const pr = await p.evaluate(() => window.__prompt || '');
  conferir(!!pr && ![PLACA, CHASSI, CPF, '91234-5678', 'Fulano', 'Mentiroso'].some((x) => pr.includes(x)) && /\[placa\]/.test(pr) && /\[chassi\]/.test(pr), 'para a IA vai só o texto, sem placa, chassi, CPF, telefone e nome do cliente');
  conferir(await p.evaluate(() => window.__imgs) === 0, 'a foto em si não vai para a IA');
  const lido = await p.evaluate(() => ({ km: document.querySelector('.modal [name="km"]').value, of: document.querySelector('.modal [name="oficina"]').value, it: document.querySelector('.modal [name="itens"]').value, sub: document.querySelector('.modal [name="mtsub"]').value, ia: /Lido com a IA/.test(document.querySelector('.modal').textContent) }));
  conferir(lido.km === '49500' && lido.of === 'Auto Center Exemplo' && /Troca de óleo: 250,00/.test(lido.it) && lido.ia, 'a janela vem preenchida com o que foi lido (km, oficina, itens com valor)');
  conferir(lido.sub === 'Revisao Periodica', 'troca de óleo e filtro: sugere "Revisao Periodica" no MoneyTRIO');
  await foto(p, '05-foto-lida');
  await p.setChecked('.modal [name="mt"]', true);
  await salvar(p);
  const s2 = await p.evaluate((id) => { const s = Vida.servicos(id).find((x) => x.km === 49500); return { ok: !!s, files: s && (s.files || []).length, env: s && s.mtEnviado, mt: window.__mt.map((m) => m.dados), carKm: DB.get('places', id).km }; }, ids.car);
  conferir(s2.ok && s2.files === 1 && s2.carKm === 49500, 'salvo com a foto da nota, e a km do carro sobe para 49.500');
  conferir(s2.mt.length === 1 && s2.mt[0].grupo === 'VEICULO' && s2.mt[0].sub === 'Revisao Periodica' && s2.mt[0].valor === 610 && s2.env, 'com "Enviar o custo" marcado: vai ao MoneyTRIO uma vez, grupo VEICULO, "Revisao Periodica", R$ 610');
  await p.evaluate((id) => { const s = Vida.servicos(id).find((x) => x.km === 49500); ACT['vida.edit']({ id: s.id }); }, ids.car);
  await formAberto(p, 'Troca de óleo');
  conferir(await p.evaluate(() => !document.querySelector('.modal [name="mt"]') && /Já enviado ao MoneyTRIO/.test(document.querySelector('.modal').textContent)), 'ao abrir de novo: "Já enviado ao MoneyTRIO" e sem a opção de mandar outra vez');
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

  /* ---------- EN ---------- */
  await p.evaluate((id) => { S.lang = 'en'; go('cars', 'vida', id); }, ids.car); await p.waitForTimeout(500);
  const en = await p.evaluate(() => document.querySelector('main') ? document.querySelector('main').textContent : document.body.textContent);
  conferir(/Car health/.test(en) && /Everything that was done/.test(en) && !/Saúde do carro|Tudo o que foi feito|Gastos por ano/.test(en), 'em inglês, a Vida do carro fica toda em inglês');
  await p.evaluate(() => { S.lang = 'pt'; });

  conferir(!lixo.erros.length, 'nenhum erro na página' + (lixo.erros.length ? ': ' + lixo.erros.join(' | ') : ''));
  await terminar(falhas, browser, 'Veículos como aba própria e Vida do carro (foto da nota, serviço repetido, orçamento, revisão por km, MoneyTRIO) em 390 px.');
})().catch((e) => { console.error('Erro no teste:', e.message, e.stack); process.exit(1); });
