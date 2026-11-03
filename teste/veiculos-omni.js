/* 🚗 Veículos (2.20.0), em 390 px: ficha pronta, franquia em destaque, assistência com 📞, placa e chassi trancados.
   Um PIN só (03/Nov/2026): com as Senhas da casa fechadas, trazer a ficha, ver a placa e editar abrem a janela "Confirme que é você" ali mesmo.
   Só valores de mentira (placa, chassi, apólice e telefones inventados). Prints: PRINTS=<pasta> node teste/veiculos-omni.js */
const fs = require('fs'), path = require('path');
const { BASE, criarConferir, abrirApp, iniciar, terminar } = require('./_base');
const { falhas, conferir } = criarConferir();
const PRINTS = process.env.PRINTS || '';
const PLACA = 'TST0A00', CHASSI = '9ZZTESTE000000001', APOLICE = '0000 00 0000000';
const PDF = Buffer.from('%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj 2 0 obj<</Type/Pages/Count 0/Kids[]>>endobj\ntrailer<</Root 1 0 R>>\n%%EOF\n');
const FICHA = {
  formato: 'omnilife.ficha-veiculo', versao: 1, id: 'ficha-teste-1',
  veiculo: { nome: 'Carro de Teste 2020', marca: 'Marca', modelo: 'Modelo 1.0 Flex manual', anoFab: 2020, anoMod: 2021, comb: 'flex', observacoes: 'Ficha de mentira para o teste.' },
  protegido: { placa: PLACA, chassi: CHASSI, renavam: '00000000000', apolice: APOLICE, item: '7' },
  seguro: { seguradora: 'Seguradora Exemplo', inicio: '2026-09-24', fim: '2027-09-24', bonus: 5, franquia: 5000,
    franquias: ['Vidro: R$ 100,00'], coberturas: ['Batida, roubo e incêndio: 100% da tabela FIPE', 'Danos a terceiros: R$ 50 mil'],
    assistencia: [{ rotulo: 'Guincho, todo o Brasil', numero: '0300 000 0000' }, { rotulo: 'WhatsApp', numero: '11 0000 0000' }, 'Ouvidoria: 0800 000 0000'],
    app: 'https://exemplo.com.br/app', corretor: { nome: 'Corretora Exemplo', telefone: '(11) 90000-0000', email: 'corretor@exemplo.com.br' },
    custo: { total: 1234.5, como: 'cartão + pontos', categoria: 'Veículo · Seguro Auto' } },
  lembretes: [{ data: '2027-08-24', texto: 'Cotar a renovação do seguro (teste)' }, { data: '2027-09-17', texto: 'Seguro vence em 7 dias (teste)' }],
  manutencao: [{ titulo: 'Revisão do carro', intervaloDias: 365, ultima: '2026-01-15', nota: '6ª revisão · 47,7 mil km (teste)' }],
  documento: { titulo: 'Apólice do seguro — teste', tipo: 'seguro', validade: '2027-09-24', arquivo: { nome: 'apolice-teste.pdf', tipo: 'application/pdf', base64: PDF.toString('base64') } }
};
/* print do tamanho da tela do celular; com `ate`, rola até esse pedaço antes (sem avisos rápidos por cima) */
const foto = async (p, nome, ate) => {
  if (!PRINTS) return; fs.mkdirSync(PRINTS, { recursive: true });
  await p.evaluate((sel) => {
    document.querySelectorAll('.toast').forEach((t) => t.remove());
    document.querySelectorAll('.aone-row [data-k="ok"]').forEach((x) => x.click());   /* a dica do AssistONE (uma vez por tela) */
    const e = sel ? document.querySelector(sel) : null;
    window.scrollTo({ top: e ? Math.max(0, e.getBoundingClientRect().top + scrollY - 130) : 0, behavior: 'instant' });
  }, ate || '');
  await p.waitForTimeout(250); await p.screenshot({ path: path.join(PRINTS, nome + '.png') });
};
const fecharJanelas = (p) => p.evaluate(() => { document.querySelectorAll('dialog[open]').forEach((d) => { try { d.close(); } catch (e) {} }); });

(async () => {
  const browser = await iniciar();
  console.log('\n[celular, só neste aparelho]');
  const { p, lixo } = await abrirApp(browser, 'celular', { semEntrar: true });
  await p.evaluate(() => ACT['gate.local']());
  await p.waitForSelector('#fn', { timeout: 10000 });
  await p.fill('#fn', 'Família Teste'); await p.fill('#mn', 'Pessoa Teste'); await p.click('#go');
  await p.waitForFunction(() => S.booted, null, { timeout: 15000 });
  await p.waitForTimeout(600); await fecharJanelas(p);
  await p.evaluate(async () => { await Vault.setup('senha-de-mentira-123'); AOne.save({ tips: { house: 1 } }); });   /* sem a dica do AssistONE por cima dos prints */
  await p.evaluate(() => go('house', 'cars')); await p.waitForTimeout(400); await fecharJanelas(p);
  conferir(await p.locator('.seg button', { hasText: 'Veículos' }).count() === 1, 'aba 🚗 Veículos na Casa');
  conferir(await p.locator('text=Nenhum veículo ainda').count() === 1, 'lista vazia explica o que fazer');
  await foto(p, '01-veiculos-vazio');

  /* trazer a ficha pronta pelo botão (escolher arquivo de verdade) */
  const [fc] = await Promise.all([p.waitForEvent('filechooser'), p.click('[data-act="car.import"]')]);
  await fc.setFiles({ name: 'ficha-teste.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(FICHA)) });
  await p.waitForSelector('text=Vai trazer:', { timeout: 5000 });
  const resumo = await p.locator('dialog[open]').innerText();
  conferir(/Carro de Teste 2020/.test(resumo) && /2 lembretes/.test(resumo) && /PDF/.test(resumo), 'confirmação mostra o que vai trazer');
  conferir(!resumo.includes(PLACA) && !resumo.includes(CHASSI), 'confirmação não mostra placa nem chassi');
  await foto(p, '02-trazer-ficha');
  await p.locator('dialog[open] button', { hasText: 'Trazer' }).click();
  await p.waitForFunction(() => S.route && S.route.sub === 'cars' && S.route.arg, null, { timeout: 10000 });
  await p.waitForFunction(() => document.querySelector('#carsec [data-olho]'), null, { timeout: 10000 });
  const carId = await p.evaluate(() => S.route.arg);
  let txt = await p.locator('#main, main, body').first().innerText();
  conferir(/5\.000,00/.test(txt) && txt.includes('Acima disso, vale acionar o seguro.'), 'franquia em destaque com "acima disso, vale acionar o seguro"');
  conferir(!txt.includes(PLACA) && !txt.includes(CHASSI) && !txt.includes(APOLICE), 'placa, chassi e apólice escondidos até tocar no 👁');
  const tels = await p.locator('a[href^="tel:"]').count(), was = await p.locator('a[href^="https://wa.me/"]').count();
  conferir(tels >= 3 && was >= 1, 'assistência e corretor com 📞 Ligar (' + tels + ') e 💬 WhatsApp (' + was + ')');
  conferir(await p.locator('a[href="https://exemplo.com.br/app"]').count() === 1, 'botão "Abrir o app da seguradora"');
  conferir(/1\.234,50/.test(txt) && txt.includes('nada é enviado ao MoneyTRIO'), 'referência do MoneyTRIO, sem envio');
  conferir(txt.includes('Revisão do carro') && txt.includes('Apólice do seguro — teste') && txt.includes('Cotar a renovação'), 'documento, revisão e lembretes ligados ao carro');
  await foto(p, '03-ficha-do-carro'); await foto(p, '03b-assistencia-e-seguro', '.card.accent + .card');
  await foto(p, '03c-placa-escondida', '#carsec'); await foto(p, '03d-documentos-revisao-lembretes', '[data-act="car.doc"]');
  await p.locator('#carsec [data-olho]').first().click();
  conferir((await p.locator('#carsec').innerText()).includes(PLACA), '👁 mostra a placa');
  await p.locator('#carsec [data-olho]').first().click();

  /* onde os dados foram parar */
  const d = await p.evaluate(async ([placa, chassi, carId]) => {
    const c = DB.get('places', carId), v = DB.col('vault').get(c.vaultId);
    const dentroIdb = JSON.stringify(await IDB.entries('docs'));
    const ls = JSON.stringify(Object.assign({}, localStorage)) + JSON.stringify(Object.assign({}, sessionStorage));
    const busca = Search.sources();
    const doc = DB.all('docs').find((x) => x.veiculo === carId), fm = doc && Files.meta(doc.files[0]);
    const pdf = doc ? await (await Files.blob(doc.files[0])).text() : '';
    const sec = await Cars.segredo(c);
    return { lugar: JSON.stringify(c), cofre: JSON.stringify(v), dentroIdb, ls, temBusca: busca.some((x) => x.t === c.name), buscaPlaca: busca.some((x) => x.q.includes(placa.toLowerCase()) || x.q.includes(chassi.toLowerCase())),
      lembretes: DB.all('reminders').filter((r) => r.veiculo === carId).map((r) => r.due), mt: Maint.list().find((m) => m.veiculo === carId), doc, fmEnc: !!(fm && fm.enc), pdf: pdf.slice(0, 8), sec, vaultKind: v && v.kind };
  }, [PLACA, CHASSI, carId]);
  conferir(!d.lugar.includes(PLACA) && !d.lugar.includes(CHASSI) && !d.lugar.includes(APOLICE) && !d.lugar.includes('1234.5') && !d.lugar.includes('pontos'), 'registro do carro sem placa, chassi, apólice e custo');
  conferir(!!d.cofre && !d.cofre.includes(PLACA) && d.vaultKind === 'seguro', 'placa e chassi embaralhados num item das Senhas da casa');
  conferir(!d.dentroIdb.includes(PLACA) && !d.dentroIdb.includes(CHASSI), 'nada de placa e chassi às claras no aparelho (IndexedDB)');
  conferir(!d.ls.includes(PLACA) && !d.ls.includes(CHASSI), 'nada de placa e chassi no localStorage/sessionStorage');
  conferir(d.temBusca && !d.buscaPlaca, 'busca 🔎 acha o carro pelo nome, nunca pela placa ou chassi');
  conferir(d.sec && d.sec.placa === PLACA && d.sec.chassi === CHASSI && d.sec.number === APOLICE && d.sec.item === '7', 'Senhas da casa abertas: placa, chassi e apólice voltam certos');
  conferir(JSON.stringify(d.lembretes.sort()) === '["2027-08-24","2027-09-17"]', 'dois lembretes nas datas pedidas');
  conferir(d.mt && d.mt.last === '2026-01-15' && d.mt.next === '2027-01-15' && /47,7 mil km/.test(JSON.stringify(d.mt.history)), 'revisão do carro com a última vez e o histórico');
  conferir(d.doc && d.doc.type === 'seguro' && d.doc.expires === '2027-09-24' && d.doc.vis === 'restrito' && d.fmEnc && d.pdf.startsWith('%PDF'), 'PDF guardado como documento do carro, trancado, e abre de volta');

  /* trazer de novo: não duplica */
  const [fc2] = await Promise.all([p.waitForEvent('filechooser'), p.evaluate(() => { go('house', 'cars'); setTimeout(() => document.querySelector('[data-act="car.import"]').click(), 300); })]);
  await fc2.setFiles({ name: 'ficha-teste.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(FICHA)) });
  await p.waitForTimeout(600);
  conferir(await p.evaluate(() => Cars.list().length) === 1 && (await p.locator('text=Esta ficha já está no app').count()) >= 1, 'a mesma ficha não entra duas vezes');
  await p.evaluate(() => { document.querySelectorAll('.toast').forEach((t) => t.remove()); });
  await foto(p, '04-lista-com-carro');
  /* ficha estragada: recusada antes de gravar qualquer coisa */
  const ruins = await p.evaluate((f) => {
    const c = (mud) => Cars.validar(Object.assign(JSON.parse(JSON.stringify(f)), mud));
    return [c({}) === '', c({ formato: 'outra' }) !== '', c({ versao: 2 }) !== '', c({ lembretes: { a: 1 } }) !== '', c({ manutencao: 'x' }) !== '', c({ seguro: [] }) !== '',
      c({ documento: { arquivo: { base64: '%%%não é base64' } } }) !== '', c({ veiculo: { nome: ' ' } }) !== ''];
  }, FICHA);
  conferir(ruins.every(Boolean), 'ficha estragada ou de outro formato é recusada (' + ruins.join(',') + ')');

  /* editar: placa vem preenchida (cofre aberto) e a franquia muda */
  await p.evaluate((id) => go('house', 'cars', id), carId); await p.waitForTimeout(400);
  await p.click('[data-act="car.edit"]'); await p.waitForSelector('dialog[open] [name="_sec.placa"]');
  conferir(await p.inputValue('dialog[open] [name="_sec.placa"]') === PLACA && await p.inputValue('dialog[open] [name="_sec.custoTotal"]') === '1234.5', 'editar: placa e custo preenchidos, com as Senhas da casa abertas');
  await foto(p, '05-editar-carro');
  await p.fill('dialog[open] [name="seguro.franquia"]', '6000');
  await p.locator('dialog[open] [data-ok]').click(); await p.waitForTimeout(600);
  conferir(/6\.000,00/.test(await p.locator('body').innerText()), 'franquia nova aparece');
  conferir(await p.evaluate(async (id) => { const s = await Cars.segredo(DB.get('places', id)); return s && s.placa; }, carId) === PLACA, 'placa continua trancada e certa depois de editar');

  /* Senhas da casa: o item avisa onde editar a placa */
  await p.evaluate(async (id) => { const c = DB.get('places', id); editVault(DB.col('vault').get(c.vaultId)); }, carId);
  await p.waitForSelector('dialog[open]');
  conferir((await p.locator('dialog[open]').innerText()).includes('Casa → 🚗 Veículos'), 'item das Senhas da casa explica onde ficam placa e chassi');
  await p.keyboard.press('Escape'); await p.waitForTimeout(300); await fecharJanelas(p);

  /* trancado: some tudo */
  await p.evaluate(() => { Vault.lock(); render(); }); await p.waitForTimeout(400);
  txt = await p.locator('body').innerText();
  conferir(txt.includes('Abrir as Senhas da casa') && !txt.includes(PLACA), 'Senhas da casa fechadas: placa some e aparece o botão para abrir');
  await foto(p, '06-trancado', '#carsec');

  /* membro (não responsável): sem custo e sem dados protegidos */
  await p.evaluate(() => { S.role = 'membro'; render(); }); await p.waitForTimeout(300);
  txt = await p.locator('body').innerText();
  conferir(!txt.includes('Referência do MoneyTRIO') && txt.includes('Só os responsáveis veem.'), 'membro: sem custo e sem placa');
  await p.evaluate(() => { S.role = 'admin'; render(); });

  /* Onde está?, Documentos e Manutenção ligados ao carro */
  await p.evaluate((id) => go('house', 'where', id), carId); await p.waitForTimeout(300);
  conferir(await p.locator('text=Ver a ficha do carro').count() === 1, 'Onde está? leva para a ficha do carro');
  conferir(await p.evaluate(() => Docs.fields().some((f) => f.k === 'veiculo') && Maint.fields().some((f) => f.k === 'veiculo')), 'documento e manutenção têm "De qual veículo"');
  conferir(await p.evaluate(() => !!HELP().veiculos && Search.sources().some((x) => /Veículos: o carro e o seguro/.test(x.t))), 'ajuda ❓ do carro, também na busca');

  /* o que a revisão da 2.20.0 achou */
  await p.evaluate(async () => { await Vault.unlock('senha-de-mentira-123'); });
  await p.evaluate((id) => go('house', 'cars', id), carId); await p.waitForFunction(() => document.querySelector('#carsec [data-olho]'), null, { timeout: 5000 });
  await p.locator('#carsec [data-olho]').first().click();
  conferir(await p.evaluate(() => { A11y.read(); try { A11y.stop(); } catch (e) {} return !document.querySelector('#carsec').innerText.includes('TST0A00'); }), 'ler a tela em voz alta esconde de novo a placa revelada');
  /* item do cofre que não está neste aparelho: avisa, não cria outro e não apaga nada */
  const vidOk = await p.evaluate(async (id) => { const c = DB.get('places', id), v = c.vaultId; await DB.put('places', Object.assign({}, c, { vaultId: 'nao-esta-aqui' })); return v; }, carId);
  await p.waitForFunction(() => /não estão neste aparelho/.test(document.querySelector('#carsec').innerText), null, { timeout: 5000 });
  conferir(await p.locator('[data-act="car.secnovo"]').count() === 1, 'item do cofre que não chegou: avisa e oferece "começar de novo"');
  conferir(await p.evaluate(async (id) => { const c = DB.get('places', id), antes = DB.raw('vault').length; const r = await Cars.guardarSegredo(c, { placa: 'OUTRA00' }); return r === 'nao-esta-aqui' && DB.raw('vault').length === antes; }, carId), 'sem o item, salvar não cria outro item solto');
  await p.evaluate(async ([id, v]) => { const c = DB.get('places', id); await DB.put('places', Object.assign({}, c, { vaultId: v })); }, [carId, vidOk]);
  conferir(await p.evaluate(async (id) => { const c = DB.get('places', id), v = DB.col('vault').get(c.vaultId), u = v.updatedAt; const o = await Cars.segredo(c); await new Promise((r) => setTimeout(r, 20)); await Cars.guardarSegredo(c, o); return DB.col('vault').get(c.vaultId).updatedAt === u; }, carId), 'salvar sem mudar a placa não regrava o item do cofre');
  /* cofre fecha com o formulário aberto: placa some da janela */
  await p.evaluate((id) => go('house', 'cars', id), carId); await p.waitForTimeout(300);
  await p.click('[data-act="car.edit"]'); await p.waitForSelector('dialog[open] [name="_sec.placa"]');
  await p.evaluate(() => Vault.lock()); await p.waitForTimeout(1500);
  conferir(await p.evaluate(() => { const i = document.querySelector('dialog[open] [name="_sec.placa"]'); return !!i && i.value === '' && i.closest('.fld').classList.contains('hidden'); }), 'Senhas da casa fecham com o formulário aberto: placa some da janela');
  await fecharJanelas(p); await p.waitForTimeout(300);
  /* apagar o carro e trazer a ficha de novo: nada duplicado, PDF e revisão reaproveitados */
  const conta = () => p.evaluate(() => ({ carros: Cars.list().length, cofre: DB.raw('vault').filter((v) => v.id !== '_meta').length, lembretes: DB.all('reminders').filter((r) => /\(teste\)/.test(r.title)).length,
    docs: DB.all('docs').length, docsLigados: DB.all('docs').filter((d) => d.veiculo).length, revisoes: DB.all('maint').filter((m) => m.title === 'Revisão do carro').length, revLigada: DB.all('maint').filter((m) => m.veiculo).length, arquivos: DB.raw('files').length }));
  await p.evaluate(async (id) => { await Vault.unlock('senha-de-mentira-123'); await Cars.apagar(DB.get('places', id)); }, carId); await p.waitForTimeout(300);
  let n = await conta();
  conferir(n.carros === 0 && n.cofre === 0 && n.lembretes === 0 && n.docs === 1 && n.docsLigados === 0 && n.revisoes === 1 && n.revLigada === 0, 'apagar o carro: leva o item do cofre e os lembretes; documento e revisão ficam soltos (' + JSON.stringify(n) + ')');
  await p.evaluate((f) => Cars.gravar(f), FICHA); n = await conta();
  conferir(n.carros === 1 && n.cofre === 1 && n.lembretes === 2 && n.docs === 1 && n.docsLigados === 1 && n.revisoes === 1 && n.revLigada === 1, 'trazer de novo depois de apagar: nada duplicado (' + JSON.stringify(n) + ')');
  /* falha no meio da importação: desfaz tudo */
  const antes = await conta();
  const erroMeio = await p.evaluate(async (f) => {
    const g = Object.assign(JSON.parse(JSON.stringify(f)), { id: 'ficha-teste-2' }); g.veiculo.nome = 'Outro carro'; g.documento.titulo = 'Outro documento'; g.manutencao = [{ titulo: 'Troca de óleo (teste)', ultima: '2026-02-01' }];
    const orig = DB.put.bind(DB); DB.put = async (c, d, q) => { if (c === 'reminders') throw new Error('falha de mentira'); return orig(c, d, q); };
    try { await Cars.gravar(g); return 'não falhou'; } catch (e) { return e.message; } finally { DB.put = orig; }
  }, FICHA);
  n = await conta();
  conferir(erroMeio === 'falha de mentira' && JSON.stringify(n) === JSON.stringify(antes) && await p.evaluate(() => !DB.all('maint').some((m) => /óleo/.test(m.title))), 'falha no meio da ficha: desfaz carro, cofre, documento e PDF (' + JSON.stringify(n) + ')');
  conferir(await p.evaluate(async () => { const s = Cars.validar({ formato: 'omnilife.ficha-veiculo', versao: 1, veiculo: { nome: 'x' }, documento: { arquivo: { base64: 'AAAAA' } } }); return s !== ''; }), 'PDF em base64 cortado é recusado antes de gravar');

  /* 2.20.1: manutenção do carro vai ao MoneyTRIO com a categoria que existe lá (nunca "Manutenção") */
  const PONTE = 'ecossistema.ponte.v1';
  const ids = await p.evaluate(async (PONTE) => {
    localStorage.removeItem(PONTE); await DB.saveSetting({ mt: Object.assign({}, Bridge.cfg(), { enabled: true }) });
    const rev = DB.all('maint').find((m) => m.title === 'Revisão do carro');
    const cox = await DB.put('maint', { title: 'Troca do coxim (teste)', cat: 'carro', interval: 365 });
    const casa = await DB.put('maint', { title: 'Limpeza da caixa (teste)', cat: 'casa', interval: 180 });
    return { rev: rev.id, cox: cox.id, casa: casa.id };
  }, PONTE);
  const registrar = async (id, escolha) => {
    await p.evaluate((id) => { ACT['mt.done']({ id }); }, id); await p.waitForSelector('dialog[open] [name="cost"]');
    const sugestao = await p.evaluate(() => { const s = document.querySelector('dialog[open] [name="mtsub"]'); return s ? s.value : null; });
    if (escolha) await p.selectOption('dialog[open] [name="mtsub"]', escolha);
    await p.fill('dialog[open] [name="cost"]', '100'); await p.locator('dialog[open] [data-ok]').click(); await p.waitForTimeout(300);
    const ultima = await p.evaluate((PONTE) => { const m = (JSON.parse(localStorage.getItem(PONTE) || '{"msgs":[]}').msgs || []); return m[m.length - 1] && m[m.length - 1].dados; }, PONTE);
    return { sugestao, ultima };
  };
  let rg = await registrar(ids.rev);
  conferir(rg.sugestao === 'Revisao Periodica' && rg.ultima.grupo === 'VEICULO' && rg.ultima.sub === 'Revisao Periodica', 'revisão do carro: sugere e envia "Revisao Periodica" (' + JSON.stringify(rg) + ')');
  rg = await registrar(ids.cox);
  conferir(rg.sugestao === 'Mecânico / Eletrico / Funilaria' && rg.ultima.sub === 'Mecânico / Eletrico / Funilaria', 'coxim: sugere e envia "Mecânico / Eletrico / Funilaria"');
  rg = await registrar(ids.cox, 'Revisao Periodica');
  conferir(rg.ultima.sub === 'Revisao Periodica', 'dá para trocar a categoria sugerida');
  rg = await registrar(ids.casa);
  conferir(rg.sugestao === null && rg.ultima.grupo === 'HABITACAO' && rg.ultima.sub === 'Manutenção', 'manutenção da casa continua igual (HABITACAO, "Manutenção")');
  conferir(await p.evaluate((PONTE) => !(JSON.parse(localStorage.getItem(PONTE)).msgs || []).some((m) => m.dados && m.dados.grupo === 'VEICULO' && m.dados.sub === 'Manutenção'), PONTE), 'nenhum custo do carro sai com "Manutenção"');
  /* enviados antes com "Manutenção": só listados, nada reenviado */
  const antes2 = await p.evaluate((PONTE) => { const b = JSON.parse(localStorage.getItem(PONTE)); b.msgs.push({ id: 'velho1', de: 'omnilife-one', para: 'moneytrio', tipo: 'gasto', criadoEm: '2026-10-20T10:00:00Z', lidoEm: null, dados: { valor: 350, grupo: 'VEICULO', sub: 'Manutenção', desc: 'Troca de óleo (OmniLifeONE)', data: '2026-10-20' } }); localStorage.setItem(PONTE, JSON.stringify(b)); return b.msgs.length; }, PONTE);
  await p.evaluate(() => go('settings', 'integr')); await p.waitForTimeout(400);
  txt = await p.locator('body').innerText();
  conferir(txt.includes('Custos do carro enviados com "Manutenção"') && txt.includes('Troca de óleo (OmniLifeONE)') && /350,00/.test(txt) && txt.includes('o MoneyTRIO ainda não leu'), 'Integrações lista o que já foi com "Manutenção" (data, valor, descrição)');
  conferir(await p.evaluate((PONTE) => JSON.parse(localStorage.getItem(PONTE)).msgs.length, PONTE) === antes2, 'a lista não reenvia nada');
  await foto(p, '08-integracoes-moneytrio', '#main h4');

  /* um PIN só (03/Nov/2026): Senhas da casa fechadas não cortam o caminho — abrem ali mesmo (a janela "Confirme que é você") */
  const SENHA = 'senha-de-mentira-123';
  const abrirNaJanela = async (senha) => { await p.waitForSelector('dialog[open] .omni-chaves', { timeout: 5000 }); await p.fill('.omni-chaves #omni-pin', senha); await p.click('.omni-chaves [data-ok]'); };
  const F3 = JSON.parse(JSON.stringify(FICHA)); F3.id = 'ficha-teste-3'; F3.veiculo.nome = 'Carro de Teste 3'; delete F3.documento; F3.lembretes = []; F3.manutencao = [];
  await p.evaluate(() => { Vault.lock(); go('house', 'cars'); }); await p.waitForTimeout(400); await fecharJanelas(p);
  const nAntes = await p.evaluate(() => Cars.list().length);
  const trazerF3 = async () => {
    const [fc3] = await Promise.all([p.waitForEvent('filechooser'), p.click('[data-act="car.import"]')]);
    await fc3.setFiles({ name: 'ficha-teste-3.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(F3)) });
    await p.waitForSelector('text=Vai trazer:', { timeout: 5000 });
  };
  await trazerF3();
  conferir(await p.evaluate(() => !S.vaultKey && S.route.sub === 'cars'), 'Senhas da casa fechadas: escolhe o arquivo e confere antes, sem sair de 🚗 Veículos');
  await p.locator('dialog[open] button', { hasText: 'Trazer' }).click();
  conferir(await p.waitForSelector('dialog[open] .omni-chaves', { timeout: 5000 }).then(() => true, () => false) && await p.evaluate(() => S.route.sub === 'cars' && !document.querySelector('dialog#solver-cofre')), 'ao tocar em 📥 Trazer, a janela "🔓 Confirme que é você" abre ali mesmo');
  await foto(p, '09-trazer-confirme-que-e-voce');
  await p.locator('.omni-chaves [data-x]', { hasText: 'Agora não' }).click(); await p.waitForTimeout(500);
  conferir(await p.evaluate((n) => Cars.list().length === n && !S.vaultKey && S.route.sub === 'cars' && !document.querySelector('dialog[open]'), nAntes), '"Agora não" cancela sem gravar nada e fica em 🚗 Veículos');
  await trazerF3(); await p.locator('dialog[open] button', { hasText: 'Trazer' }).click();
  await abrirNaJanela('errada-de-mentira'); await p.waitForTimeout(800);
  conferir(await p.evaluate(() => /Senha errada/.test(document.querySelector('.omni-chaves [data-msg]').textContent) && !S.vaultKey), 'senha errada: avisa na própria janela e continua fechado');
  await abrirNaJanela(SENHA);
  await p.waitForFunction((n) => Cars.list().length === n + 1 && S.route.arg, nAntes, { timeout: 15000 });
  conferir(await p.evaluate(() => S.route.tab === 'house' && S.route.sub === 'cars' && Cars.list().some((c) => c.ficha === 'ficha-teste-3' && c.vaultId)), 'com a senha certa, a ficha entra (placa trancada) e a tela vai para o carro, nunca para as Senhas da casa');
  /* ficha do carro: "🔓 Abrir as Senhas da casa" abre ali mesmo e redesenha */
  await p.evaluate(() => { Vault.lock(); render(); }); await p.waitForTimeout(400);
  const rota = await p.evaluate(() => S.route.arg);
  await p.click('[data-act="car.abrircasa"]'); await abrirNaJanela(SENHA);
  conferir(await p.waitForFunction(() => document.querySelector('#carsec [data-olho]'), null, { timeout: 10000 }).then(() => true, () => false) && await p.evaluate((a) => S.route.sub === 'cars' && S.route.arg === a, rota), 'ficha do carro: 🔓 abre as Senhas da casa ali mesmo e mostra a placa escondida, sem trocar de tela');
  /* formulário do carro: a nota abre as Senhas da casa por cima e reabre com a placa, sem perder o que foi digitado */
  await p.evaluate(() => { Vault.lock(); render(); }); await p.waitForTimeout(400);
  await p.click('[data-act="car.edit"]'); await p.waitForSelector('dialog[open] [data-casa]');
  await p.fill('dialog[open] [name="name"]', 'Carro de Teste 3 mudado');
  await p.click('dialog[open] [data-casa]'); await p.waitForSelector('dialog[open] .omni-chaves', { timeout: 5000 });
  conferir(await p.evaluate(() => SolverJanela.quantas()) === 2, 'formulário do carro: a janela "Confirme que é você" abre por cima do formulário');
  await abrirNaJanela(SENHA);
  await p.waitForSelector('dialog[open] [name="_sec.placa"]', { timeout: 10000 });
  conferir(await p.inputValue('dialog[open] [name="_sec.placa"]') === PLACA && await p.inputValue('dialog[open] [name="name"]') === 'Carro de Teste 3 mudado', 'formulário do carro: reabre com a placa e com o que já tinha sido digitado');
  await fecharJanelas(p); await p.waitForTimeout(300);

  /* inglês */
  await p.evaluate(() => { S.lang = 'en'; go('house', 'cars', Cars.list()[0].id); }); await p.waitForTimeout(400);
  txt = await p.locator('body').innerText();
  conferir(txt.includes('Vehicles') && txt.includes("Above this, it's worth filing a claim.") && txt.includes('24h assistance and phones'), 'textos em inglês');
  await foto(p, '07-ingles');
  await p.evaluate(() => { S.lang = 'pt'; render(); });
  conferir(!lixo.erros.length, 'nenhum erro de script' + (lixo.erros.length ? ': ' + lixo.erros.join(' | ') : ''));
  conferir(!lixo.nativos.length, 'nenhum alert/confirm/prompt nativo');
  await p.context().close();

  /* visitante: sem cofre, não oferece a ficha pronta */
  console.log('\n[celular, visitante]');
  const v = await abrirApp(browser, 'celular');
  await v.p.evaluate(() => go('house', 'cars')); await v.p.waitForTimeout(400); await fecharJanelas(v.p);
  conferir(await v.p.locator('[data-act="car.import"]').count() === 0, 'visitante: sem "Trazer ficha pronta"');
  await v.p.click('[data-act="car.new"]'); await v.p.waitForSelector('dialog[open]');
  conferir((await v.p.locator('dialog[open]').innerText()).includes('No modo visitante não dá para guardar placa e chassi.'), 'visitante: explica que placa e chassi não ficam');
  conferir(!v.lixo.erros.length, 'visitante: nenhum erro de script');
  await terminar(falhas, browser, 'veículos do OmniLifeONE (ficha pronta, seguro, placa e chassi trancados) em 390 px.');
})().catch((e) => { console.error(e); process.exit(1); });
