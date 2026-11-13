/* 🐾 Pets como aba própria, em 390 px. Confere:
     - a aba 🐾 Pets existe no ☰ (Cuidar da família) e não fica dentro de Família nem da Casa; Família continua listando o pet
       e abre a ficha dele; o cadastro de pessoa não oferece mais "Pet"
     - cadastrar um cachorro pelo formulário próprio (sem PIN nem controle parental), com a raça da lista (que muda com a espécie)
     - foto: redesenhada (≤ 640 px no perfil, ≤ 1080 px na galeria), WebP (ou JPEG quando o navegador não faz WebP), um PNG
       grande fica pequeno, sem EXIF/GPS; foto que não abre é recusada e nada é guardado; "só neste aparelho" não envia nada
     - nuvem (família de mentira, fetch trocado por um gravador): envio para sol-arquivos/omnilife-one/<família>/pet-<id>.webp
       com apikey e a sessão; envio que falha fica pendente e vai ao abrir 🐾 Pets; "outro celular" baixa pelo path e guarda;
       apagar tira daqui e da nuvem (sem internet, apaga depois)
     - vacina, vermífugo, antipulgas e banho como manutenções do pet (sino e agenda), ✓ Feito (vacina com marca e quem
       aplicou, sem MoneyTRIO), 📅 Remarcar e 🚫 Não se aplica
     - ração: dias, quando acaba, aviso de validade (no máximo X sacos), o aviso automático "Comprar ração" e o ✓ dele,
       calculadora da promoção e lista de compras
     - peso com gráfico e a faixa da raça; histórico; um contato como veterinário, hotel e banho e tosa
     - guia para quem cuida montado da ficha, sem trocar o que a pessoa escreveu sem perguntar
     - Saúde do pet sem tipo sanguíneo, RH e SUS; criança vê e não muda; EN; nada passa da largura; nenhum erro
     - qualquer bicho (2.25.0): pet novo começa em "— escolha —" e salvar sem a espécie avisa e não fecha; calopsita (＋ sem
       vacina/antipulgas, campos de ave, peso em gramas, ração em gramas por dia e pacote, guia com a panela antiaderente, EN);
       jabuti de antes (réptil + Jabuti + 🦎) vira quelonio e 🐢 ao salvar, com UVB e hidratação, comida sem conta e sem
       castração no histórico; aquário sem peso e sem castrado/microchip/pedigree, com água e filtro; coelho sem antipulgas, o
       "Antipulgas do pet" antigo ligado como "outro" e Casa → Manutenção sem "Vacina anual do pet"; papagaio com o texto dos
       documentos; nenhum tipo com nome de remédio ou dose; busca ("tartaruga", "passarinho"); EMOJIS; 390 px em cada tipo
   Só valores de mentira (nenhum pet, pet shop, chave ou token de verdade). Uso: node teste/rodar.js */
const { criarConferir, abrirApp, iniciar, terminar } = require('./_base');
const { falhas, conferir } = criarConferir();
const fecharJanelas = (p) => p.evaluate(() => { document.querySelectorAll('dialog[open]').forEach((d) => { try { d.close(); } catch (e) {} }); });
const modal = (p, sel) => p.waitForSelector('.modal ' + sel, { timeout: 8000 }).then(() => true, () => false);
const salvar = async (p, sel) => { await p.click('.modal:has(' + sel + ') [data-ok]'); await p.waitForFunction((s) => !document.querySelector('.modal ' + s), sel, { timeout: 8000 }).catch(() => {}); await p.waitForTimeout(300); };
const cancelar = async (p, sel) => {
  await p.click('.modal:has(' + sel + ') .mf [data-x]');
  if (await p.waitForSelector('.sj-pergunta[open]', { timeout: 1500 }).then(() => true, () => false)) await p.click('[data-sj=descartar]');
  await p.waitForTimeout(300);
};
const sim = async (p) => { await p.waitForSelector('[data-yes]', { timeout: 5000 }); await p.click('[data-yes]'); await p.waitForTimeout(300); };
const semRolagem = (p) => p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1);
/* imagens de mentira, feitas no navegador */
const preparar = (p) => p.evaluate(() => {
  window.__img = async (w, h, tipo, ruido) => {
    const c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d');
    const g = x.createLinearGradient(0, 0, w, h); g.addColorStop(0, '#c8a070'); g.addColorStop(1, '#f4ead8'); x.fillStyle = g; x.fillRect(0, 0, w, h);
    if (ruido) { const d = x.getImageData(0, 0, w, h); for (let i = 0; i < d.data.length; i += 4) { const n = (Math.random() - 0.5) * ruido; d.data[i] += n; d.data[i + 1] += n; d.data[i + 2] += n; } x.putImageData(d, 0, 0); }
    x.fillStyle = '#5a3a20'; x.beginPath(); x.arc(w / 2, h / 2, Math.min(w, h) / 4, 0, 7); x.fill();
    return new Promise((r) => c.toBlob(r, tipo || 'image/png', 0.92));
  };
  window.__arq = (b, nome) => new File([b], nome, { type: b.type });
  /* JPEG com um bloco EXIF de mentira (com "GPS") logo depois do começo do arquivo */
  window.__comExif = async () => {
    const j = new Uint8Array(await (await window.__img(1200, 900, 'image/jpeg')).arrayBuffer());
    const t = new TextEncoder().encode('Exif\0\0GPS-MENTIRA-23.5S-46.6W'), len = t.length + 2;
    const o = new Uint8Array(j.length + 4 + t.length); o.set([0xff, 0xd8, 0xff, 0xe1, len >> 8, len & 255], 0); o.set(t, 6); o.set(j.subarray(2), 6 + t.length);
    return new File([o], 'com-exif.jpg', { type: 'image/jpeg' });
  };
  window.__picks = []; Files.pick = async () => window.__picks.shift() || [];
  /* gravador do Storage: nada sai daqui */
  window.__st = []; window.__falhaEnvio = false; window.__falhaApagar = false;
  const orig = window.fetch.bind(window);
  window.fetch = async (u, o) => {
    u = String(u); if (!u.includes('/storage/v1/')) return orig(u, o);
    o = o || {}; const met = o.method || 'GET', body = o.body instanceof Blob ? { size: o.body.size, type: o.body.type } : null;
    window.__st.push({ u, met, h: Object.assign({}, o.headers || {}), body });
    if (met === 'POST' && window.__falhaEnvio) throw new TypeError('Failed to fetch (sem internet de mentira)');
    if (met === 'DELETE' && window.__falhaApagar) throw new TypeError('Failed to fetch (sem internet de mentira)');
    if (met === 'GET') { const b = await window.__img(64, 48, 'image/webp'); return new Response(b, { status: 200, headers: { 'Content-Type': 'image/webp' } }); }
    return new Response('{"Key":"x"}', { status: 200, headers: { 'Content-Type': 'application/json' } });
  };
  /* "servidor" de mentira: cada DB.patch passa pelo CloudDriver.aninhar e por uma cópia em JS do omni_jsonb_mesclar do SQL
     (null apaga a chave, objetos se juntam por dentro, o resto troca); DB.put troca o registro inteiro. __ops: o que foi chamado */
  window.__mesclar = (a, b) => { const r = Object.assign({}, a || {}); for (const k in b) { const v = b[k]; if (v === null) delete r[k]; else if (v && typeof v === 'object' && !Array.isArray(v) && r[k] && typeof r[k] === 'object' && !Array.isArray(r[k])) r[k] = window.__mesclar(r[k], v); else r[k] = v; } return r; };
  window.__nuvem = {}; window.__ops = [];
  const pt = DB.patch, pu = DB.put;
  DB.patch = function (c, id, f) {
    const k = c + '|' + id, cur = DB.col(c).get(id);
    if (cur) window.__nuvem[k] = window.__mesclar(window.__nuvem[k] || JSON.parse(JSON.stringify(cur)), CloudDriver.aninhar(f));
    window.__ops.push({ op: 'patch', c, id, ks: Object.keys(f) });
    return pt.call(DB, c, id, f);
  };
  DB.put = async function (c, doc, q) { const r = await pu.call(DB, c, doc, q); if (r && r.id) window.__nuvem[c + '|' + r.id] = JSON.parse(JSON.stringify(r)); window.__ops.push({ op: 'put', c, id: r && r.id }); return r; };
});
const tamanho = (p, fid) => p.evaluate(async (fid) => { const b = await Files.blob(fid); if (!b) return null; const bmp = await createImageBitmap(b); const txt = new TextDecoder('latin1').decode(new Uint8Array(await b.arrayBuffer())); return { type: b.type, size: b.size, w: bmp.width, h: bmp.height, exif: /Exif|GPS-MENTIRA/.test(txt) }; }, fid);

(async () => {
  const browser = await iniciar();

  /* =================== 1) "só neste aparelho", responsável =================== */
  console.log('\n[celular, só neste aparelho]');
  const { p, lixo } = await abrirApp(browser, 'celular', { semEntrar: true });
  await p.evaluate(() => ACT['gate.local']());
  await p.waitForSelector('#fn', { timeout: 10000 });
  await p.fill('#fn', 'Família Teste'); await p.fill('#mn', 'Pessoa Teste'); await p.click('#go');
  await p.waitForFunction(() => S.booted, null, { timeout: 15000 });
  await p.waitForTimeout(600); await fecharJanelas(p);
  await p.evaluate(() => { AOne.save({ hello: 1, tips: { home: 1, pets: 1, family: 1, house: 1, health: 1, shop: 1 } }); if (AOne.view) AOne.close(); });
  await preparar(p);

  /* ---------- a aba ---------- */
  conferir(await p.evaluate(() => visibleTabs().some((t) => t.id === 'pets') && DRAWER_GROUPS().find((g) => g.id === 'cuidar').tabs.includes('pets') && !!ICONS.pets), 'a aba 🐾 Pets existe, com ícone, no grupo "Cuidar da família" do ☰');
  await p.click('#hambbtn'); await p.waitForTimeout(400);
  conferir(await p.locator('#drawer [data-dtab="pets"]').count() >= 1, 'o ☰ mostra 🐾 Pets');
  await fecharJanelas(p); await p.waitForTimeout(200);
  await p.evaluate(() => go('house')); await p.waitForTimeout(400);
  conferir(await p.evaluate(() => ![...document.querySelectorAll('.seg button')].some((b) => /Pets/.test(b.textContent)) && !(DRAWER_SUBS().house || []).some((x) => /pet/i.test(x[0])) && !DRAWER_SUBS().family), 'Pets não fica dentro da Casa nem da Família');
  await p.evaluate(() => go('pets')); await p.waitForTimeout(400);
  conferir(await p.evaluate(() => /Nenhum pet ainda/.test(document.querySelector('#screen').textContent) && !!document.querySelector('#screen [data-act="pet.new"]')), 'sem pet: explica e oferece "＋ Cadastrar pet"');
  conferir(await p.evaluate(() => { const f = personFields({ role: 'crianca' }).find((x) => x.k === 'role'); return !f.opts.some((o) => o[0] === 'pet'); }), 'o cadastro de pessoa não oferece mais "Pet" (pet tem o formulário próprio)');

  /* ---------- cadastrar um cachorro ---------- */
  await p.click('#screen [data-act="pet.new"]');
  conferir(await modal(p, '[name="pet.especie"]'), '＋ Cadastrar pet abre o formulário do pet');
  conferir(await p.evaluate(() => !document.querySelector('.modal [name="_pin"]') && !document.querySelector('.modal [name="controls.seeList"]') && !document.querySelector('.modal [name="role"]')), 'o formulário do pet não tem PIN, controle parental nem papel');
  /* o pet novo começa sem espécie ("— escolha —", 2.25.0): salvar assim pergunta "que bicho é?" e o formulário não fecha */
  conferir(await p.evaluate(() => { const s = document.querySelector('.modal [name="pet.especie"]'); return s.value === '' && /— escolha —/.test(s.options[0].textContent) && s.options.length === 11; }), 'pet novo começa com "— escolha —" (e os 10 tipos de bicho)');
  await p.fill('.modal [name="name"]', 'Bolinha de Teste');
  await p.click('.modal:has([name="pet.especie"]) [data-ok]'); await p.waitForTimeout(500);
  conferir(await p.evaluate(() => !!document.querySelector('.modal [name="pet.especie"]') && [...document.querySelectorAll('.toast')].some((t) => /Que bicho é\? Escolha o tipo na lista/.test(t.textContent)) && !Pets.list().length), 'salvar o pet novo sem a espécie avisa ("Que bicho é?") e o formulário não fecha (nada é gravado)');
  /* escolher cachorro para ver as raças dele */
  await p.selectOption('.modal [name="pet.especie"]', 'cachorro');
  const dl = await p.evaluate(() => [...document.querySelector('.modal [name="pet.raca"]').list.options].map((o) => o.value));
  conferir(dl.length >= 50 && dl.includes('Cavachon') && dl.includes('SRD (vira-lata)') && dl.includes('Outra') && dl.includes('Shih Tzu'), 'raças de cachorro para buscar (' + dl.length + '), com "SRD (vira-lata)", "Cavachon" e "Outra"');
  await p.selectOption('.modal [name="pet.especie"]', 'gato');
  const dlg = await p.evaluate(() => [...document.querySelector('.modal [name="pet.raca"]').list.options].map((o) => o.value));
  conferir(dlg.length >= 15 && dlg.includes('Siamês') && !dlg.includes('Cavachon'), 'trocar a espécie para gato troca a lista (' + dlg.length + ' raças de gato)');
  await p.selectOption('.modal [name="pet.especie"]', 'cachorro');
  await p.fill('.modal [name="name"]', 'Bolinha de Teste');
  await p.fill('.modal [name="pet.raca"]', 'Cavachon');
  await p.fill('.modal [name="pet.cor"]', 'branco e caramelo');
  await p.selectOption('.modal [name="pet.sexo"]', 'macho');
  await p.setChecked('.modal [name="pet.castrado"]', true);
  const nasc = await p.evaluate(() => addDays(today(), -400)), cheg = await p.evaluate(() => addDays(today(), -320));
  await p.fill('.modal [name="birth"]', nasc); await p.fill('.modal [name="pet.chegada"]', cheg);
  await p.fill('.modal [name="pet.microchip"]', '000000000000001');
  await p.fill('.modal [name="pet.descricao"]', 'Tem medo de trovão');
  await salvar(p, '[name="pet.especie"]');
  await p.waitForTimeout(400);
  const pid = await p.evaluate(() => (Pets.list()[0] || {}).id);
  const p1 = await p.evaluate((id) => { const x = DB.get('people', id); return x && { role: x.role, pet: x.pet, emoji: x.emoji, rota: S.route }; }, pid);
  conferir(p1 && p1.role === 'pet' && p1.pet.especie === 'cachorro' && p1.pet.raca === 'Cavachon' && p1.pet.castrado === true && p1.pet.sexo === 'macho' && p1.pet.cor === 'branco e caramelo' && p1.emoji === '🐶', 'pet salvo em people com role "pet" e p.pet (espécie, raça, cor, sexo, castrado), ícone 🐶');
  conferir(p1 && p1.rota.tab === 'pets' && p1.rota.sub === 'ficha' && p1.rota.arg === pid, 'depois de salvar, abre a ficha do pet');
  const fichaTxt = await p.evaluate(() => document.querySelector('#screen').textContent);
  conferir(/Cavachon/.test(fichaTxt) && /castrado/.test(fichaTxt) && /Em casa desde/.test(fichaTxt) && /000000000000001/.test(fichaTxt) && /medo de trovão/.test(fichaTxt), 'a ficha mostra raça, castrado, chegada, microchip e o jeito do pet');
  conferir(['Próximos cuidados', 'Ração', 'Saúde', 'Histórico', 'Peso', 'Vacinas e cuidados', 'Contatos', 'Fotos', 'Guia para quem cuida'].every((t) => fichaTxt.includes(t)), 'a ficha tem as seções: próximos cuidados, ração, saúde, histórico, peso, vacinas, contatos, fotos e guia');

  /* ---------- Família continua listando o pet ---------- */
  await p.evaluate(() => go('family')); await p.waitForTimeout(400);
  conferir(await p.locator('#screen [data-act="go"][data-tab="pets"][data-arg="' + pid + '"]').count() === 1 && await p.locator('#screen [data-act="pet.new"]').count() === 1, 'Família lista o pet com "Abrir a ficha do pet" e tem "＋ 🐾 Pet"');
  await p.evaluate((id) => ACT['person.edit']({ id }), pid); await p.waitForTimeout(400);
  conferir(await p.evaluate((id) => S.route.tab === 'pets' && S.route.arg === id && !document.querySelector('.modal'), pid), 'tocar no ✏️ do pet em Família abre a ficha em 🐾 Pets (não o cadastro de pessoa)');

  /* ---------- fotos (só neste aparelho) ---------- */
  const nFiles0 = await p.evaluate(() => DB.raw('files').length);
  const pngGrande = await p.evaluate(async () => { const b = await window.__img(3000, 2000, 'image/png', 30); window.__picks.push([window.__arq(b, 'grande.png')]); return b.size; });
  await p.evaluate((id) => ACT['pet.foto']({ id }), pid);
  await p.waitForFunction((id) => !!(DB.get('people', id).pet || {}).foto, pid, { timeout: 15000 }).catch(() => {});
  const foto = await p.evaluate((id) => DB.get('people', id).pet.foto, pid);
  const t1 = foto ? await tamanho(p, foto.id) : null;
  conferir(t1 && t1.type === 'image/webp' && Math.max(t1.w, t1.h) <= 640 && t1.w === foto.w && t1.h === foto.h, 'foto de perfil redesenhada em WebP, maior lado ≤ 640 px (' + (t1 ? t1.w + '×' + t1.h + ', ' + Math.round(t1.size / 1024) + ' KB' : 'nada') + '), sem cortar (3:2)' );
  conferir(t1 && t1.size < pngGrande / 10 && t1.size < 200 * 1024 && Math.abs(t1.w / t1.h - 1.5) < 0.01, 'um PNG grande (' + Math.round(pngGrande / 1024) + ' KB) virou uma foto leve');
  conferir(await p.evaluate((n) => DB.raw('files').length === n + 1, nFiles0), 'só a foto redesenhada foi guardada (um arquivo, não o original)');
  conferir(!foto.path && !foto.pendente && await p.evaluate(() => window.__st.length) === 0, '"só neste aparelho": nada vai para a nuvem');
  await p.waitForTimeout(500);
  conferir(await p.evaluate(() => { const a = document.querySelector('.petav.lg'); return !!a && a.classList.contains('on') && /blob:/.test(a.style.backgroundImage); }), 'a foto aparece no lugar do emoji, na ficha');
  /* galeria: uma foto com EXIF/GPS de mentira e uma que não abre */
  await p.evaluate(async () => { window.__picks.push([await window.__comExif(), new File([new Uint8Array([1, 2, 3, 4, 5])], 'estragada.png', { type: 'image/png' })]); });
  await p.evaluate((id) => ACT['pet.fotos']({ id }), pid);
  await p.waitForFunction((id) => ((DB.get('people', id).pet || {}).fotos || []).length === 1, pid, { timeout: 15000 }).catch(() => {});
  await p.waitForTimeout(400);
  const g1 = await p.evaluate((id) => DB.get('people', id).pet.fotos || [], pid);
  const t2 = g1[0] ? await tamanho(p, g1[0].id) : null;
  conferir(g1.length === 1 && t2 && Math.max(t2.w, t2.h) <= 1080 && t2.type === 'image/webp', 'galeria: foto redesenhada com o maior lado ≤ 1080 px (' + (t2 ? t2.w + '×' + t2.h : '') + ')');
  conferir(t2 && !t2.exif, 'o EXIF (com o GPS) some no redesenho');
  conferir(await p.evaluate((n) => DB.raw('files').length === n + 2, nFiles0), 'a foto que não abre é recusada: nada dela é guardado');
  conferir(await p.evaluate(() => [...document.querySelectorAll('.toast')].some((t) => /Não consegui preparar/.test(t.textContent))), 'e a pessoa é avisada ("Não consegui preparar esta foto…")');
  /* duas fotos que não abrem: o aviso no plural */
  await p.evaluate(() => { document.querySelectorAll('.toast').forEach((t) => t.remove()); window.__picks.push([1, 2].map((i) => new File([new Uint8Array([i, 2, 3])], 'estragada' + i + '.png', { type: 'image/png' }))); });
  await p.evaluate((id) => ACT['pet.fotos']({ id }), pid);
  await p.waitForTimeout(400);
  conferir(await p.evaluate(() => [...document.querySelectorAll('.toast')].some((t) => /Não consegui preparar 2 fotos, então elas não foram guardadas/.test(t.textContent))), 'duas fotos que não abrem: o aviso fica no plural ("2 fotos, então elas não foram guardadas")');
  /* navegador sem WebP (Safari antigo): JPEG */
  await p.evaluate(async () => {
    const tb = HTMLCanvasElement.prototype.toBlob; window.__tb = tb;
    HTMLCanvasElement.prototype.toBlob = function (cb, tipo, q) { return tb.call(this, cb, tipo === 'image/webp' ? 'image/png' : tipo, q); };
    window.__picks.push([window.__arq(await window.__img(1600, 1200, 'image/png', 10), 'sem-webp.png')]);
  });
  await p.evaluate((id) => ACT['pet.fotos']({ id }), pid);
  await p.waitForFunction((id) => ((DB.get('people', id).pet || {}).fotos || []).length === 2, pid, { timeout: 15000 }).catch(() => {});
  /* recorte transparente (o "tirar o fundo" do iPhone) no JPEG: fundo branco, não preto */
  const alfa = await p.evaluate(async () => {
    const c = document.createElement('canvas'); c.width = 200; c.height = 100; const x = c.getContext('2d'); x.fillStyle = '#5a3a20'; x.fillRect(80, 30, 40, 40);
    const r = await PetFoto.redesenhar(await new Promise((ok) => c.toBlob(ok, 'image/png')), 1080); if (!r) return null;
    const bmp = await createImageBitmap(r.blob), k = document.createElement('canvas'); k.width = bmp.width; k.height = bmp.height; const kx = k.getContext('2d'); kx.drawImage(bmp, 0, 0);
    return { type: r.blob.type, px: [...kx.getImageData(2, 2, 1, 1).data] };
  });
  conferir(alfa && alfa.type === 'image/jpeg' && alfa.px.slice(0, 3).every((v) => v > 235), 'PNG transparente virando JPEG: o fundo fica branco, não preto (' + (alfa ? alfa.px.join(',') : 'nada') + ')');
  await p.evaluate(() => { HTMLCanvasElement.prototype.toBlob = window.__tb; });
  const g2 = await p.evaluate((id) => DB.get('people', id).pet.fotos || [], pid);
  const t3 = g2[1] ? await tamanho(p, g2[1].id) : null;
  conferir(t3 && t3.type === 'image/jpeg' && Math.max(t3.w, t3.h) <= 1080, 'sem WebP no navegador: vira JPEG (' + (t3 ? t3.type : '') + ')');
  await p.waitForTimeout(400);
  conferir(await p.locator('#screen .thumb[data-pfoto].on').count() === 2 && await p.locator('#screen .thumb [data-act="pet.apagarfoto"]').count() === 2, 'a galeria mostra as 2 fotos, com ✕ para o responsável');
  /* ✏️ aberto enquanto uma foto termina de ser guardada (Fundo) e chega um peso (outro celular): salvar não apaga nada disso */
  await p.click('#screen [data-act="pet.edit"]'); await modal(p, '[name="pet.especie"]');
  await p.evaluate(async (id) => { await PetFoto.guardar(id, window.__arq(await window.__img(900, 600, 'image/png'), 'durante.png'), false); await DB.patch('people', id, { 'pet.pesos': [{ d: today(), kg: 5 }] }); }, pid);
  await p.fill('.modal [name="pet.cor"]', 'branco e caramelo claro');
  await salvar(p, '[name="pet.especie"]');
  const aberto = await p.evaluate((id) => { const d = DB.get('people', id).pet; return { n: (d.fotos || []).length, pesos: (d.pesos || []).length, cor: d.cor, foto: !!d.foto, raca: d.raca }; }, pid);
  conferir(aberto.n === 3 && aberto.pesos === 1 && aberto.foto && aberto.cor === 'branco e caramelo claro' && aberto.raca === 'Cavachon', 'salvar o ✏️ do pet não apaga a foto e o peso que chegaram com o formulário aberto (' + JSON.stringify(aberto) + ')');
  await p.evaluate((id) => DB.patch('people', id, { 'pet.pesos': undefined }), pid);
  conferir(await p.evaluate(() => { const a = document.querySelector('#screen [data-act="pet.apagarfoto"][data-f="' + DB.get('people', Pets.list()[0].id).pet.foto.id + '"]'); return !!a && !a.closest('.thumb'); }), 'o responsável tem "🗑 Tirar a foto" para a foto de perfil (não só trocar)');
  /* um lote de fotos de cada vez por pet (o ＋ continua na tela enquanto sobem) */
  const n0 = await p.evaluate((id) => (DB.get('people', id).pet.fotos || []).length, pid);
  await p.evaluate(async (id) => {
    document.querySelectorAll('.toast').forEach((t) => t.remove());
    window.__l3 = window.__arq(await window.__img(400, 300, 'image/png'), 'l3.png');
    window.__picks.push([window.__arq(await window.__img(2600, 1800, 'image/png', 30), 'l1.png'), window.__arq(await window.__img(2600, 1800, 'image/png', 30), 'l2.png')]);
    ACT['pet.fotos']({ id });
  }, pid);
  await p.waitForFunction((id) => PetFoto._lote && PetFoto._lote.has(id), pid, { timeout: 3000 }).catch(() => {});
  await p.evaluate(async (id) => { window.__picks.push([window.__l3]); await ACT['pet.fotos']({ id }); }, pid);
  await p.waitForFunction((a) => (DB.get('people', a.id).pet.fotos || []).length >= a.n + 2 && !(PetFoto._lote && PetFoto._lote.has(a.id)), { id: pid, n: n0 }, { timeout: 15000 }).catch(() => {});
  await p.waitForTimeout(600);
  const lote = await p.evaluate((a) => { window.__picks = []; return { n: (DB.get('people', a.id).pet.fotos || []).length - a.n, toast: [...document.querySelectorAll('.toast')].some((t) => /Ainda estou guardando as fotos/.test(t.textContent)) }; }, { id: pid, n: n0 });
  conferir(lote.n === 2 && lote.toast, 'outro ＋ com o lote anterior ainda subindo: "Ainda estou guardando as fotos…", e o segundo lote não roda junto (' + lote.n + ' fotos novas)');
  /* as 12 vagas contam na hora de guardar: a foto que não cabe fica de fora, nunca empurra as mais antigas */
  const cap = await p.evaluate(async (id) => {
    const L0 = DB.get('people', id).pet.fotos || [], falsas = [];
    for (let i = L0.length; i < 11; i++) falsas.push({ id: 'fcheia' + i, w: 10, h: 10 });
    await DB.patch('people', id, { 'pet.fotos': L0.concat(falsas) });
    const primeira = DB.get('people', id).pet.fotos[0].id, nf = DB.raw('files').length;
    const a = window.__arq(await window.__img(300, 200, 'image/png'), 'c1.png'), b = window.__arq(await window.__img(300, 200, 'image/png'), 'c2.png');
    const r = await Promise.all([PetFoto.guardar(id, a, false), PetFoto.guardar(id, b, false)]);
    const fs = DB.get('people', id).pet.fotos;
    const res = { n: fs.length, primeira: fs[0].id === primeira, arquivos: DB.raw('files').length - nf, cheia: r.filter((x) => x && x.cheia).length };
    await DB.patch('people', id, { 'pet.fotos': fs.filter((f) => !/^fcheia/.test(f.id)) });
    return res;
  }, pid);
  conferir(cap.n === 12 && cap.primeira && cap.arquivos === 1 && cap.cheia === 1, 'galeria com 11 e duas fotos guardadas ao mesmo tempo: uma entra, a outra fica de fora (sem arquivo guardado) e as mais antigas ficam (' + JSON.stringify(cap) + ')');

  /* ---------- vacinas e cuidados ---------- */
  /* a data posta em "última vez" de cada cuidado: o esperado sai dela (não de "hoje" na hora de conferir, que pode já ser o dia
     seguinte se a meia-noite passar no meio — revisão final E da 2.27.0: falhou assim numa suíte às 00:00) */
  const ultimas = {};
  const cuidado = async (rot, ultima) => {
    await p.click('#screen [data-act="pet.cuidado"]');
    await p.waitForSelector('.menu', { timeout: 4000 });
    await p.locator('.menu button', { hasText: rot }).first().click();
    const ok = await modal(p, '[name="interval"]');
    if (ultima != null) { ultimas[rot] = await p.evaluate((n) => addDays(today(), -n), ultima); await p.fill('.modal [name="last"]', ultimas[rot]); }
    await salvar(p, '[name="interval"]');
    return ok;
  };
  conferir(await cuidado('Vacina anual', 300), '＋ em Vacinas e cuidados oferece a vacina e abre a manutenção já preenchida');
  await p.click('#screen [data-act="pet.cuidado"]'); await p.waitForSelector('.menu', { timeout: 4000 });
  conferir(await p.evaluate(() => { const t = document.querySelector('.menu').textContent; return !/Vacina anual/.test(t) && /Vermífugo/.test(t) && /Banho e tosa/.test(t) && /a cada 45 dias/.test(t) && /Outro cuidado/.test(t); }), 'o ＋ não oferece de novo o que já existe; banho e tosa a cada 45 dias');
  await fecharJanelas(p); await p.waitForTimeout(200);
  /* segunda vacina (a antirrábica depois da V10): o ＋ oferece "Outra vacina", sem nome, a cada 365 dias; o ✓ dela pede a marca;
     ela aparece com o nome dela; e 🗑 Excluir no formulário dela (o mesmo da Casa → Manutenção) leva a dose para o Histórico */
  await p.click('#screen [data-act="pet.cuidado"]'); await p.waitForSelector('.menu', { timeout: 4000 });
  const temOutra = await p.locator('.menu button', { hasText: 'Outra vacina' }).count() > 0;
  conferir(temOutra, 'com uma vacina já posta, o ＋ ainda oferece "Outra vacina" (a antirrábica)');
  if (!temOutra) { await fecharJanelas(p); await p.waitForTimeout(200); }
  else {
    await p.locator('.menu button', { hasText: 'Outra vacina' }).first().click(); await modal(p, '[name="interval"]');
    const ov = await p.evaluate(() => ({ t: document.querySelector('.modal [name="title"]').value, iv: document.querySelector('.modal [name="interval"]').value }));
    await p.fill('.modal [name="title"]', 'Antirrábica de Teste'); await p.fill('.modal [name="last"]', await p.evaluate(() => addDays(today(), -100)));
    await salvar(p, '[name="interval"]');
    const ar = await p.evaluate((id) => { const m = Pets.cuidados(id).find((x) => x.title === 'Antirrábica de Teste'); return m && { id: m.id, tipo: m.petTipo, iv: +m.interval, prox: [...document.querySelectorAll('#screen .card.accent .t')].some((t) => /Antirrábica de Teste/.test(t.textContent)) }; }, pid);
    conferir(ov.t === '' && ov.iv === '365' && ar && ar.tipo === 'vacina' && ar.iv === 365 && ar.prox, 'a segunda vacina vem sem nome, a cada 365 dias, é vacina e aparece com o nome dela nos próximos cuidados');
    await p.click('#screen [data-act="pet.feito"][data-m="' + ar.id + '"]');
    conferir(await modal(p, '[name="produto"]'), 'o ✓ Feito da segunda vacina também pede a marca e quem aplicou');
    await p.fill('.modal [name="produto"]', 'Antirrábica Exemplo'); await salvar(p, '[name="produto"]');
    await p.click('#screen [data-act="pet.vercuidado"][data-m="' + ar.id + '"]'); await modal(p, '[name="interval"]');
    await p.click('.modal [data-del]'); await sim(p); await p.waitForTimeout(300);
    const exc = await p.evaluate((a) => ({ m: !!DB.get('maint', a.m), h: (DB.get('people', a.p).pet.historico || []).filter((x) => x.tipo === 'vacina') }), { m: ar.id, p: pid });
    conferir(!exc.m && exc.h.length === 1 && exc.h[0].titulo === '✓ Antirrábica de Teste' && /Antirrábica Exemplo/.test(exc.h[0].nota), '🗑 Excluir no formulário da vacina (o mesmo da Casa → Manutenção): a dose aplicada fica no Histórico do pet (' + JSON.stringify(exc.h) + ')');
    await p.evaluate((id) => DB.patch('people', id, { 'pet.historico': undefined }), pid);
  }
  await cuidado('Vermífugo', 30); await cuidado('Antipulgas', 28); await cuidado('Banho e tosa', 50);
  const cs = await p.evaluate((id) => Pets.cuidados(id).map((m) => ({ id: m.id, t: m.title, tipo: m.petTipo, cat: m.cat, pet: m.pet, iv: +m.interval, next: m.next, d: m._days })), pid);
  const C = (t) => cs.find((x) => x.tipo === t) || {};
  conferir(cs.length === 4 && cs.every((x) => x.cat === 'pet' && x.pet === pid) && C('vacina').iv === 365 && C('vermifugo').iv === 90 && C('antipulgas').iv === 30 && C('banho').iv === 45, 'vacina (365 d), vermífugo (90), antipulgas (30) e banho (45) são manutenções do pet (cat "pet", pet = id)');
  /* a próxima = a última vez (posta 300 dias antes de hoje) + 365 dias, e os dias que faltam contados de hoje (65 no mesmo dia) */
  const espVac = await p.evaluate((u) => { const n = addDays(u, 365); return { next: n, d: diffDays(today(), n), mesmoDia: addDays(u, 300) === today() }; }, ultimas['Vacina anual']);
  conferir(C('vacina').t === 'Vacina anual — Bolinha de Teste' && C('vacina').next === espVac.next && C('vacina').d === espVac.d && (!espVac.mesmoDia || C('vacina').d === 65), 'título com o nome do pet e a próxima calculada da última vez');
  const sino = await p.evaluate(() => Alerts.list().find((a) => /Antipulgas/.test(a.t)));
  conferir(sino && sino.go[0] === 'pets' && sino.go[2] === pid, 'antipulgas vencendo em 2 dias aparece no 🔔 e leva à ficha do pet');
  conferir(await p.evaluate(() => Agenda.occurrences(today(), addDays(today(), 90), { extras: true }).some((o) => /Vacina anual — Bolinha/.test(o.title))), 'e as datas entram na agenda');
  /* ✓ Feito na vacina: marca e quem aplicou, sem MoneyTRIO */
  await p.click('#screen [data-act="pet.feito"][data-m="' + C('vacina').id + '"]');
  conferir(await modal(p, '[name="produto"]'), '✓ Feito na vacina pergunta a marca e quem aplicou');
  conferir(await p.evaluate(() => !document.querySelector('.modal [name="mt"]')), 'e não oferece mandar o gasto ao MoneyTRIO (gastos do pet ainda não, #62)');
  await p.fill('.modal [name="produto"]', 'Vacina Exemplo V10'); await p.fill('.modal [name="vet"]', 'Clínica de Mentira');
  await salvar(p, '[name="produto"]');
  const vac = await p.evaluate((id) => { const m = DB.get('maint', id); const h = (m.history || []).slice(-1)[0] || {}; return { last: m.last, next: m.next, h, hoje: today(), mais: addDays(today(), 365) }; }, C('vacina').id);
  conferir(vac.last === vac.hoje && vac.next === vac.mais && vac.h.produto === 'Vacina Exemplo V10' && vac.h.vet === 'Clínica de Mentira', 'registrada hoje, próxima em 1 ano, com a marca e quem aplicou no histórico da vacina');
  conferir(await p.evaluate(() => /✓ Vacina anual/.test(document.querySelector('#screen').textContent) && /Vacina Exemplo V10/.test(document.querySelector('#screen').textContent)), 'a vacina feita aparece no Histórico do pet');
  /* 📅 Remarcar */
  await p.click('#screen [data-act="pet.remarcar"][data-m="' + C('vermifugo').id + '"]');
  await p.waitForSelector('#askv', { timeout: 4000 });
  const nova = await p.evaluate(() => addDays(today(), 10));
  await p.fill('#askv', nova); await p.click('.modal:has(#askv) [data-ok]'); await p.waitForTimeout(400);
  conferir(await p.evaluate((a) => { const m = DB.get('maint', a.id); return m.next === a.d && m.nextManual === true; }, { id: C('vermifugo').id, d: nova }), '📅 Remarcar muda a próxima data do vermífugo');
  /* 🚫 Não se aplica */
  await p.click('#screen [data-act="pet.na"][data-m="' + C('antipulgas').id + '"]'); await sim(p);
  conferir(await p.evaluate((id) => !DB.get('maint', id) && !Alerts.list().some((a) => /Antipulgas/.test(a.t)), C('antipulgas').id), '🚫 Não se aplica tira o antipulgas da lista e do 🔔 (depois de confirmar)');
  await p.click('#screen [data-act="pet.feito"][data-m="' + C('banho').id + '"]'); await modal(p, '[name="d"]'); await salvar(p, '[name="d"]');
  /* trocar o nome do pet: os avisos dele passam a ter o nome novo (e voltam com o nome de volta) */
  const renomear = async (nome) => { await p.click('#screen [data-act="pet.edit"]'); await modal(p, '[name="pet.especie"]'); await p.fill('.modal [name="name"]', nome); await salvar(p, '[name="pet.especie"]'); return p.evaluate((id) => Pets.cuidados(id).map((m) => m.title), pid); };
  const ren = await renomear('Bolinha Renomeada'), ren2 = await renomear('Bolinha de Teste');
  conferir(ren.length === 3 && ren.every((t) => / — Bolinha Renomeada$/.test(t)) && ren2.every((t) => / — Bolinha de Teste$/.test(t)), 'trocar o nome do pet troca o nome nos avisos dele (' + ren.join(' | ') + ')');

  /* ---------- ração ---------- */
  await p.click('#screen [data-act="pet.racao"]');
  conferir(await modal(p, '[name="sacoKg"]'), 'a ração abre o formulário (marca, fase, saco, gramas, refeições, compra, sacos, validade)');
  const D = await p.evaluate(() => ({ c: addDays(today(), -10), v: addDays(today(), 90) }));
  await p.fill('.modal [name="marca"]', 'Marca Exemplo Adulto'); await p.selectOption('.modal [name="fase"]', 'adulto');
  await p.fill('.modal [name="sacoKg"]', '3'); await p.fill('.modal [name="gRefeicao"]', '25'); await p.fill('.modal [name="refeicoesDia"]', '3');
  await p.fill('.modal [name="compradoEm"]', D.c); await p.fill('.modal [name="sacos"]', '4'); await p.fill('.modal [name="validade"]', D.v);
  await salvar(p, '[name="sacoKg"]');
  /* o esperado sai da data da compra posta acima (não de "hoje" agora: a meia-noite pode ter passado no meio) */
  const rc = await p.evaluate(([id, c0]) => { const c = Pets.racaoCalc(DB.get('people', id).pet.racao); return Object.assign({ acabaEsp: addDays(c0, 160) }, c); }, [pid, D.c]);
  conferir(rc.diario === 75 && rc.diasSaco === 40 && rc.dias === 160 && rc.acabaEm === rc.acabaEsp, 'conta: 75 g por dia, cada saco de 3 kg dura 40 dias, 4 sacos = 160 dias, acaba em compra + 160');
  conferir(rc.vence === true && rc.maxSacos === 2, 'a validade chega antes de acabar: no máximo 2 sacos ((validade − compra) / 40)');
  const rTxt = await p.evaluate(() => document.querySelector('#pracao').textContent);
  conferir(/dura ~160 dias/.test(rTxt) && /Acaba em/.test(rTxt) && /vence antes de acabar/.test(rTxt) && /no máximo 2 sacos/.test(rTxt), 'o cartão mostra "dura ~160 dias", quando acaba e ⚠️ "compre no máximo 2 sacos"');
  const lemb = await p.evaluate(([id, c0]) => { const m = DB.raw('maint').find((x) => x.pet === id && x.petTipo === 'racao'); return m && { id: m.id, t: m.title, next: m.next, cat: m.cat, esp: addDays(c0, 160 - 7), lista: Maint.list().some((x) => x.id === m.id) }; }, [pid, D.c]);
  conferir(lemb && lemb.t === 'Comprar ração — Bolinha de Teste' && lemb.cat === 'pet' && lemb.next === lemb.esp && lemb.lista, 'aviso automático "Comprar ração — Bolinha de Teste" uma semana antes de acabar, pelas manutenções');
  conferir(lemb && lemb.id === 'racao-' + pid, 'o aviso da ração tem id fixo por pet (dois celulares gravam o mesmo registro, não dois avisos)');
  /* calculadora da promoção */
  await p.click('#pracao details.more summary');
  const calc = async (kg, dias) => { await p.fill('#pck', kg); await p.fill('#pcv', await p.evaluate((n) => addDays(today(), n), dias)); await p.waitForTimeout(150); return p.evaluate(() => document.querySelector('#pco').textContent); };
  const c1 = await calc('3', 200), c2 = await calc('10', 200), c3 = await calc('20', 200);
  conferir(/Cabem até 5 sacos de 3 kg/.test(c1) && /Cabem até 1 saco de 10 kg/.test(c2) && /prefira um saco menor/.test(c3), 'calculadora: 5 sacos de 3 kg, 1 de 10 kg, e o de 20 kg vence antes ("' + c3.slice(0, 40) + '…")');
  await p.click('#screen [data-act="pet.shop"]'); await p.waitForTimeout(300);
  conferir(await p.evaluate(() => Shop.open().some((s) => s.name === 'Ração Marca Exemplo Adulto' && s.cat === 'pet')), '🛒 põe a ração na lista de compras');
  /* ✓ Feito no aviso da ração = anotar a compra nova */
  /* o mesmo aviso criado por outro celular antes de sincronizar (outro id): a compra nova junta os dois num só */
  await p.evaluate((id) => DB.put('maint', { title: 'Comprar ração — Bolinha de Teste', cat: 'pet', pet: id, petTipo: 'racao', interval: '', next: addDays(today(), 60), nextManual: true }), pid);
  await p.waitForTimeout(300);
  /* o 🔔 leva à ficha: lá o "Comprar ração" tem o ✓ Comprei, que abre a compra nova */
  const sel = '#screen .card.accent [data-act="pet.feito"][data-m="' + lemb.id + '"]', comprei = await p.locator(sel).count();
  conferir(comprei === 1 && /Comprei/.test(await p.evaluate((s) => (document.querySelector(s) || {}).textContent || '', sel)), 'em "Próximos cuidados" (onde o 🔔 leva), o "Comprar ração" tem ✓ Comprei');
  if (comprei) await p.click(sel); else await p.evaluate((id) => { Maint.done(id); }, lemb.id);
  conferir(await modal(p, '[name="sacoKg"]'), '✓ Feito em "Comprar ração" abre a ração para anotar a compra nova');
  conferir(await p.evaluate(() => document.querySelector('.modal [name="compradoEm"]').value === today() && document.querySelector('.modal [name="validade"]').value === '' && document.querySelector('.modal [name="marca"]').value === 'Marca Exemplo Adulto'), 'já vem com a mesma ração, comprada hoje, e a validade em branco');
  await p.fill('.modal [name="sacos"]', '2'); await p.fill('.modal [name="validade"]', await p.evaluate(() => addDays(today(), 120)));
  await salvar(p, '[name="sacoKg"]');
  const lemb2 = await p.evaluate((id) => { const m = DB.get('maint', id); return { next: m.next, esp: addDays(today(), 73), h: (m.history || []).length, n: DB.raw('maint').filter((x) => x.petTipo === 'racao').length }; }, lemb.id);
  conferir(lemb2.next === lemb2.esp && lemb2.h === 1 && lemb2.n === 1, 'a compra nova recalcula o aviso (sem criar outro, e o repetido de outro celular sai) e fica no histórico dele');

  /* ---------- peso ---------- */
  /* "8,1" e "7,8" com vírgula, como no celular em português */
  for (const [dias, kg] of [[60, '7.2'], [0, '8,1'], [30, '7,8']]) {
    await p.click('#screen [data-act="pet.peso"]'); await modal(p, '[name="kg"]');
    await p.fill('.modal [name="d"]', await p.evaluate((n) => addDays(today(), -n), dias)); await p.fill('.modal [name="kg"]', kg);
    await salvar(p, '[name="kg"]');
  }
  const ps = await p.evaluate((id) => DB.get('people', id).pet.pesos.map((x) => x.kg), pid);
  conferir(JSON.stringify(ps) === '[7.2,7.8,8.1]', 'peso anotado 3 vezes (fora de ordem, "8,1" com vírgula) fica em ordem de data e certo: ' + JSON.stringify(ps));
  await p.click('#screen [data-act="pet.peso"]'); await modal(p, '[name="kg"]');
  conferir(await p.evaluate(() => { const i = document.querySelector('.modal [name="kg"]'); return i.type === 'text' && i.inputMode === 'decimal'; }), 'o peso é campo de texto com teclado de número (type="number" engolia a vírgula: 8,4 virava 84)');
  await cancelar(p, '[name="kg"]');
  /* valor estranho vindo de outro celular ou de um backup não vira HTML na ficha */
  const xss = await p.evaluate(async (id) => {
    /* sem algarismo: o Date do navegador lê "1" como ano e a data viraria válida */
    const ruim = '<img src=x onerror="window.__xss=true">', d = DB.get('people', id).pet, vm = Pets.cuidados(id).find((m) => m.petTipo === 'vermifugo');
    const antes = { pesos: d.pesos, next: DB.get('maint', vm.id).next };
    await DB.patch('people', id, { 'pet.pesos': d.pesos.concat({ d: ruim, kg: 5 }) }); await DB.patch('maint', vm.id, { next: ruim });
    render(); await new Promise((r) => setTimeout(r, 400));
    const res = { xss: !!window.__xss, img: !!document.querySelector('#screen img[src="x"]'), txt: document.querySelector('#screen').textContent.includes('<img src=x') };
    await DB.patch('people', id, { 'pet.pesos': antes.pesos }); await DB.patch('maint', vm.id, { next: antes.next }); render(); await new Promise((r) => setTimeout(r, 300));
    return res;
  }, pid);
  conferir(!xss.xss && !xss.img && xss.txt, 'data estranha no peso e no próximo cuidado aparece como texto, não vira HTML (esc)');
  conferir(await p.evaluate(() => { const g = document.querySelector('svg.petgraf'); return !!g && g.querySelector('polyline').getAttribute('points').split(' ').length === 3 && !!g.querySelector('rect.pfaixa') && /Faixa comum da raça: 6 a 10 kg/.test(document.querySelector('#screen').textContent); }), 'gráfico de linha (SVG, sem biblioteca) com a faixa comum do Cavachon (6 a 10 kg) e "confirme com a veterinária"');
  const w0 = await p.evaluate((id) => Pets.pesoChave(Pets.pesos(DB.get('people', id))[0]), pid);
  await p.click('#screen [data-act="pet.peso"][data-w="' + w0 + '"]'); await modal(p, '[name="kg"]');
  await p.click('.modal [data-del]'); await sim(p); await p.waitForTimeout(300);
  conferir(await p.evaluate((id) => DB.get('people', id).pet.pesos.length === 2, pid), 'tocar num peso permite apagar');
  /* peso que não dá para ler: o formulário fica aberto, com o que a pessoa escreveu */
  await p.click('#screen [data-act="pet.peso"]'); await modal(p, '[name="kg"]');
  await p.fill('.modal [name="kg"]', 'oito'); await p.click('.modal:has([name="kg"]) [data-ok]'); await p.waitForTimeout(300);
  conferir(await p.evaluate(() => { const i = document.querySelector('.modal [name="kg"]'); return !!i && i.value === 'oito' && [...document.querySelectorAll('.toast')].some((t) => /Escreva o peso em kg/.test(t.textContent)); }), 'peso que não dá para ler ("oito"): avisa e o formulário fica aberto, com o que foi escrito');
  /* "3,450" (kg com as gramas, como na balança) e um peso que chega de outro celular com o formulário aberto */
  if (!(await p.evaluate(() => !!document.querySelector('.modal [name="kg"]')))) { await p.click('#screen [data-act="pet.peso"]'); await modal(p, '[name="kg"]'); }
  await p.evaluate((id) => { const d = JSON.parse(JSON.stringify(DB.get('people', id))); d.pet.pesos = (d.pet.pesos || []).concat({ id: 'woutro', d: addDays(today(), -5), kg: 6.6 }); DB.col('people').set(id, d); window.__ops = []; }, pid);
  await p.fill('.modal [name="d"]', await p.evaluate(() => addDays(today(), -2))); await p.fill('.modal [name="kg"]', '3,450');
  await salvar(p, '[name="kg"]');
  const pz = await p.evaluate((id) => ({ kgs: DB.get('people', id).pet.pesos.map((x) => x.kg), ops: window.__ops.filter((o) => o.c === 'people' && o.id === id) }), pid);
  conferir(pz.kgs.includes(3.45), '"3,450" kg (com as gramas, como na balança) é aceito: 3,45 kg (' + JSON.stringify(pz.kgs) + ')');
  conferir(pz.kgs.includes(6.6) && pz.ops.some((o) => o.op === 'put') && !pz.ops.some((o) => o.op === 'patch' && o.ks.includes('pet.pesos')), 'o peso que chegou de outro celular com o formulário aberto fica (a lista muda pelo registro inteiro, não pela lista solta)');
  /* bicho pequeno: as gramas aparecem e o gráfico não fica com eixo negativo */
  const ham = await p.evaluate(() => {
    const box = document.createElement('div');
    box.innerHTML = Pets.pesoCard({ id: 'pHam', pet: { especie: 'roedor', pesos: [{ id: 'w1', d: '2026-01-01', kg: 0.12 }, { id: 'w2', d: '2026-02-01', kg: 0.145 }, { id: 'w3', d: '2026-03-01', kg: 0.16 }] } });
    const cao = document.createElement('div'); cao.innerHTML = Pets.pesoCard({ id: 'pCao', pet: { pesos: [{ id: 'w4', d: '2026-01-01', kg: 7.05 }] } });
    return { txt: box.textContent, eixo: [...box.querySelectorAll('svg text')].map((t) => t.textContent), cao: cao.textContent };
  });
  conferir(/Último: 160 g/.test(ham.txt) && /145 g/.test(ham.txt) && ham.eixo.length === 2 && ham.eixo.every((t) => !/-/.test(t)) && /Último: 7,05 kg/.test(ham.cao), 'peso de hamster em gramas ("145 g", último 160 g; 2.25.0), eixo do gráfico sem negativo (' + ham.eixo.join(' / ') + ') e 7,05 kg sem arredondar');

  /* ---------- histórico ---------- */
  await p.click('#screen [data-act="pet.hist"]'); await modal(p, '[name="titulo"]');
  await p.selectOption('.modal [name="tipo"]', 'consulta'); await p.fill('.modal [name="titulo"]', 'Consulta de rotina'); await p.fill('.modal [name="nota"]', 'Tudo certo, voltar em 6 meses');
  await salvar(p, '[name="titulo"]');
  await p.click('#screen [data-act="pet.hist"]'); await modal(p, '[name="titulo"]');
  await p.selectOption('.modal [name="tipo"]', 'episodio'); await p.fill('.modal [name="titulo"]', 'Comeu um pedaço de meia');
  await salvar(p, '[name="titulo"]');
  let hs = await p.evaluate((id) => DB.get('people', id).pet.historico, pid);
  conferir(hs.length === 2 && hs.some((x) => x.tipo === 'consulta' && x.nota === 'Tudo certo, voltar em 6 meses') && hs.every((x) => x.id && x.d), 'histórico: consulta e "algo que aconteceu", com data e detalhes');
  const hCons = hs.find((x) => x.tipo === 'consulta').id;
  await p.click('#screen [data-act="pet.hist"][data-h="' + hCons + '"]'); await modal(p, '[name="titulo"]');
  await p.fill('.modal [name="titulo"]', 'Consulta de rotina (anual)'); await salvar(p, '[name="titulo"]');
  await p.click('#screen [data-act="pet.hist"][data-h="' + hCons + '"]'); await modal(p, '[name="titulo"]');
  conferir(await p.evaluate(() => document.querySelector('.modal [name="titulo"]').value) === 'Consulta de rotina (anual)', 'editar uma entrada do histórico');
  await p.click('.modal [data-del]'); await sim(p); await p.waitForTimeout(300);
  hs = await p.evaluate((id) => DB.get('people', id).pet.historico, pid);
  conferir(hs.length === 1 && hs[0].tipo === 'episodio', 'e apagar');
  /* entrada que chega de outro celular com o formulário aberto: salvar não a apaga */
  await p.click('#screen [data-act="pet.hist"]'); await modal(p, '[name="titulo"]');
  await p.evaluate((id) => { const d = JSON.parse(JSON.stringify(DB.get('people', id))); d.pet.historico = (d.pet.historico || []).concat({ id: 'houtro', d: today(), tipo: 'episodio', titulo: 'Comeu chocolate (outro celular)', nota: '' }); DB.col('people').set(id, d); window.__ops = []; }, pid);
  await p.fill('.modal [name="titulo"]', 'Consulta de outro dia'); await salvar(p, '[name="titulo"]');
  const hx = await p.evaluate((id) => ({ t: DB.get('people', id).pet.historico.map((x) => x.titulo), ops: window.__ops.filter((o) => o.c === 'people' && o.id === id) }), pid);
  conferir(hx.t.includes('Comeu chocolate (outro celular)') && hx.t.includes('Consulta de outro dia') && hx.ops.some((o) => o.op === 'put') && !hx.ops.some((o) => o.op === 'patch' && o.ks.includes('pet.historico')), 'histórico: a entrada que chegou de outro celular com o formulário aberto fica (pelo registro inteiro, não pela lista solta)');
  /* 🚫 Não se aplica na vacina já aplicada: a dose (data, marca, quem aplicou) continua no histórico do pet */
  await p.click('#screen [data-act="pet.na"][data-m="' + C('vacina').id + '"]');
  await p.waitForSelector('[data-yes]', { timeout: 5000 });
  const naTxt = await p.evaluate(() => document.querySelector('.modal:has([data-yes])').textContent);
  await sim(p);
  const hv = await p.evaluate((a) => ({ m: !!DB.get('maint', a.m), h: (DB.get('people', a.p).pet.historico || []).filter((x) => x.tipo === 'vacina'), tela: document.querySelector('#screen').textContent }), { m: C('vacina').id, p: pid });
  conferir(/continua no Histórico/.test(naTxt) && !hv.m && hv.h.length === 1 && hv.h[0].d === vac.hoje && /✓ Vacina anual/.test(hv.h[0].titulo) && /Vacina Exemplo V10/.test(hv.h[0].nota) && /Clínica de Mentira/.test(hv.h[0].nota) && /Vacina Exemplo V10/.test(hv.tela), '🚫 Não se aplica na vacina: o aviso sai, a dose aplicada (data, marca, quem aplicou) fica no Histórico do pet');

  /* ---------- contatos: um só para veterinário, hotel e banho ---------- */
  await p.click('#screen [data-act="pet.contatos"]'); await modal(p, '[name="vet"]');
  await p.click('.modal [data-novoct]');
  conferir(await modal(p, '[name="phones.0"]'), '"＋ Novo contato" abre o formulário de contato');
  conferir(await p.evaluate(() => document.querySelector('.modal [name="cat"]').value) === 'pet', 'já na categoria 🐾 Pet');
  await p.fill('.modal [name="name"]', 'Pet Shop Exemplo'); await p.fill('.modal [name="phones.0"]', '(11) 90000-0000');
  await salvar(p, '[name="phones.0"]');
  conferir(await modal(p, '[name="vet"]'), 'depois de salvar, volta à escolha dos contatos do pet');
  const cid = await p.evaluate(() => (Contacts.list().find((c) => c.name === 'Pet Shop Exemplo') || {}).id);
  conferir(await p.evaluate((cid) => document.querySelector('.modal [name="vet"]').value === cid, cid), 'com o contato novo já escolhido como veterinário');
  await p.selectOption('.modal [name="hotel"]', cid); await p.selectOption('.modal [name="banho"]', cid);
  await salvar(p, '[name="vet"]');
  const ct = await p.evaluate((id) => DB.get('people', id).pet.contatos, pid);
  conferir(ct && ct.vet === cid && ct.hotel === cid && ct.banho === cid, 'o mesmo contato é veterinário, hotelzinho e banho e tosa');
  conferir(await p.locator('#screen a[href="tel:11900000000"]').count() === 3 && await p.locator('#screen a[href^="https://wa.me/5511900000000"]').count() === 3, 'cada papel com 📞 e 💬 a um toque');

  /* ---------- saúde do pet ---------- */
  await p.evaluate((id) => { Health.edit(id); }, pid);
  await modal(p, '[name="doctor"]');
  const hp = await p.evaluate(() => { const m = document.querySelector('.modal'); return { blood: !!m.querySelector('[name="blood"]'), rh: !!m.querySelector('[name="rh"]'), sus: !!m.querySelector('[name="sus"]'), txt: m.textContent }; });
  conferir(!hp.blood && !hp.rh && !hp.sus, 'Saúde do pet: sem tipo sanguíneo, RH e SUS');
  conferir(/Veterinário\(a\) de referência/.test(hp.txt) && /Plano de saúde pet/.test(hp.txt), 'e com "Veterinário(a) de referência" e "Plano de saúde pet"');
  await p.fill('.modal [name="doctor"]', 'Dra. Exemplo'); await p.fill('.modal [name="_alFood"]', 'Frango');
  await p.fill('.modal .medrow .mn', 'Remédio de Mentira'); await p.fill('.modal .medrow .md', '1 gota'); await p.fill('.modal .medrow .mt', '08:00');
  await salvar(p, '[name="doctor"]');
  conferir(await p.evaluate((id) => { const h = DB.get('health', id); return h && h.doctor === 'Dra. Exemplo' && !h.blood && h.meds[0].name === 'Remédio de Mentira'; }, pid), 'salva na carteira vital (veterinária, alergia, remédio)');
  await p.evaluate(() => { Health.edit(S.meId); }); await modal(p, '[name="doctor"]');
  conferir(await p.evaluate(() => !!document.querySelector('.modal [name="blood"]') && !!document.querySelector('.modal [name="sus"]')), 'pessoa continua com tipo sanguíneo e SUS');
  await cancelar(p, '[name="doctor"]');
  await p.evaluate(() => go('health')); await p.waitForTimeout(300);
  conferir(await p.evaluate(() => !/Falta: tipo sanguíneo/.test([...document.querySelectorAll('#screen .card')].find((c) => /Bolinha/.test(c.textContent)).textContent)), 'na tela Saúde, o pet não aparece como "Falta: tipo sanguíneo"');
  await p.evaluate((id) => go('pets', 'ficha', id), pid); await p.waitForTimeout(400);

  /* ---------- guia para quem cuida ---------- */
  await p.click('#screen [data-act="pet.guia"]');
  conferir(await modal(p, '#gsec'), '📘 monta o guia e abre para conferir');
  const gd = await p.evaluate((id) => { const g = DB.all('guides').find((x) => x.kind === 'pet' && x.pet === id); if (!g) return null; const S_ = (h) => (g.sections.find((s) => s.h === h) || {}).body || ''; return { id: g.id, title: g.title, for: g.for, contacts: g.contacts, comida: S_('Comida (quanto e quando)'), rem: S_('Remédios'), manias: S_('Manias e cuidados'), vet: S_('Veterinário'), hotel: S_('Hotelzinho e banho e tosa'), heads: g.sections.map((s) => s.h) }; }, pid);
  conferir(gd && gd.for.includes(pid) && gd.contacts.includes(cid), 'guia de pet ligado ao pet e ao contato (telefones no texto do guia)');
  conferir(gd && /Marca Exemplo Adulto/.test(gd.comida) && /25 g por refeição, 3 vezes por dia/.test(gd.comida), 'comida: a ração e os horários');
  conferir(gd && /Remédio de Mentira 1 gota \(08:00\)/.test(gd.rem) && /Frango/.test(gd.rem), 'remédios e alergias vêm da Saúde');
  conferir(gd && gd.manias === 'Tem medo de trovão' && /Pet Shop Exemplo: \(11\) 90000-0000/.test(gd.vet) && /🏨 Pet Shop Exemplo/.test(gd.hotel), 'manias, veterinário com telefone e o hotelzinho');
  conferir(gd && /^Guia para quem cuida do Bolinha/.test(gd.title), 'título do guia com "do" para macho (nada de "do(a)"): ' + (gd && gd.title));
  conferir(gd && gd.heads.includes('Passeios') && gd.heads.includes('Se acontecer algo'), 'e as seções para a pessoa completar (passeios, se acontecer algo)');
  await cancelar(p, '#gsec');
  /* a pessoa escreveu no guia: nada é trocado sem perguntar */
  await p.evaluate(async (a) => { const g = JSON.parse(JSON.stringify(DB.get('guides', a.g))); g.sections.find((s) => s.h === 'Manias e cuidados').body = 'Escrito pela pessoa'; await DB.put('guides', g); await DB.patch('people', a.p, { 'pet.descricao': 'Adora bolinha' }); }, { g: gd.id, p: pid });
  await p.click('#screen [data-act="pet.guia"]');
  conferir(await p.waitForSelector('[data-yes]', { timeout: 4000 }).then(() => true, () => false) && /Manias e cuidados/.test(await p.evaluate(() => document.querySelector('.modal:has([data-yes])').textContent)), 'texto escrito pela pessoa: pergunta antes de trocar (e diz qual seção)');
  await p.click('[data-no]'); await modal(p, '#gsec'); await p.waitForTimeout(200); await cancelar(p, '#gsec');
  conferir(await p.evaluate((g) => DB.get('guides', g).sections.find((s) => s.h === 'Manias e cuidados').body === 'Escrito pela pessoa' && DB.all('guides').filter((x) => x.kind === 'pet').length === 1, gd.id), 'Cancelar mantém o que a pessoa escreveu (e não cria outro guia)');
  await p.click('#screen [data-act="pet.guia"]'); await sim(p); await modal(p, '#gsec'); await p.waitForTimeout(200); await cancelar(p, '#gsec');
  conferir(await p.evaluate((g) => DB.get('guides', g).sections.find((s) => s.h === 'Manias e cuidados').body === 'Adora bolinha', gd.id), '"Trocar" põe o que está na ficha agora');
  /* atualizar o guia num celular em inglês não duplica as seções (acha pelo título em português ou em inglês) */
  const nSec = await p.evaluate((g) => DB.get('guides', g).sections.length, gd.id);
  await p.evaluate(() => setLang('en')); await p.waitForTimeout(300);
  await p.click('#screen [data-act="pet.guia"]');
  if (await p.waitForSelector('[data-yes]', { timeout: 1500 }).then(() => true, () => false)) await p.click('[data-no]');
  await modal(p, '#gsec'); await p.waitForTimeout(200); await cancelar(p, '#gsec');
  await p.evaluate(() => setLang('pt')); await p.waitForTimeout(300);
  const gEn = await p.evaluate((g) => DB.get('guides', g).sections.map((s) => s.h), gd.id);
  conferir(gEn.length === nSec && !gEn.includes('Food (how much and when)') && !gEn.includes('Vet'), 'atualizar o guia em inglês não repete as seções (' + gEn.length + ' seções)');

  /* ---------- contatos: o "—" pega também na nuvem; "＋ Novo contato" não perde o que já foi escolhido ---------- */
  await p.click('#screen [data-act="pet.contatos"]'); await modal(p, '[name="vet"]');
  await p.selectOption('.modal [name="hotel"]', ''); await salvar(p, '[name="vet"]');
  const semHotel = await p.evaluate((id) => ({ l: DB.get('people', id).pet.contatos, n: window.__nuvem['people|' + id].pet.contatos }), pid);
  conferir(!semHotel.l.hotel && semHotel.l.vet === cid && semHotel.l.banho === cid && !semHotel.n.hotel && semHotel.n.vet === cid && semHotel.n.banho === cid, 'tirar o hotelzinho ("—") tira aqui e na nuvem (que junta por chave: o vazio vai como null)');
  const clin = await p.evaluate(async () => (await DB.put('contacts', { name: 'Clínica Exemplo', cat: 'pet', vis: 'familia', phones: ['(11) 90000-0001'] })).id);
  await p.click('#screen [data-act="pet.contatos"]'); await modal(p, '[name="vet"]');
  await p.selectOption('.modal [name="vet"]', clin);
  await p.click('.modal [data-novoct]'); await modal(p, '[name="phones.0"]');
  await p.fill('.modal [name="name"]', 'Hotelzinho Exemplo'); await salvar(p, '[name="phones.0"]');
  await modal(p, '[name="vet"]');
  const hot = await p.evaluate(() => (Contacts.list().find((c) => c.name === 'Hotelzinho Exemplo') || {}).id);
  const esc3 = await p.evaluate(() => ['vet', 'hotel', 'banho'].map((k) => document.querySelector('.modal [name="' + k + '"]').value));
  conferir(hot && esc3[0] === clin && esc3[1] === hot && esc3[2] === cid, '"＋ Novo contato" no meio da escolha: a veterinária escolhida fica e o contato novo vai para o papel vazio (hotelzinho)');
  await salvar(p, '[name="vet"]');
  conferir(await p.evaluate((a) => { const c = DB.get('people', a.pid).pet.contatos; return c.vet === a.clin && c.hotel === a.hot && c.banho === a.cid; }, { pid, clin, hot, cid }), 'e salva assim');

  /* ---------- ração: um saco que vence antes de acabar; vírgula; tirar a ração tira o aviso ---------- */
  await p.click('#screen [data-act="pet.racao"]'); await modal(p, '[name="sacoKg"]');
  conferir(await p.evaluate(() => ['sacoKg', 'gRefeicao'].every((k) => { const i = document.querySelector('.modal [name="' + k + '"]'); return i.type === 'text' && i.inputMode === 'decimal'; }) && document.querySelector('#pck').type === 'text'), 'saco (kg), gramas e a calculadora: texto com teclado de número (aceitam vírgula)');
  await p.fill('.modal [name="sacoKg"]', '15,5'); await p.fill('.modal [name="gRefeicao"]', '37,5'); await p.fill('.modal [name="refeicoesDia"]', '2'); await p.fill('.modal [name="sacos"]', '1');
  await p.fill('.modal [name="compradoEm"]', await p.evaluate(() => today())); await p.fill('.modal [name="validade"]', await p.evaluate(() => addDays(today(), 30)));
  await salvar(p, '[name="sacoKg"]');
  const sg = await p.evaluate((id) => { const r = DB.get('people', id).pet.racao; return { r, c: Pets.racaoCalc(r), txt: document.querySelector('#pracao').textContent, toast: [...document.querySelectorAll('.toast')].map((t) => t.textContent).join(' | ') }; }, pid);
  conferir(sg.r.sacoKg === 15.5 && sg.r.gRefeicao === 37.5, '"15,5" kg e "37,5" g com vírgula ficam 15,5 e 37,5 (não 155 e 375)');
  conferir(sg.c && sg.c.sacoGrande && /Um saco de 15,5 kg dura ~207 dias e vence antes de acabar: prefira um saco menor/.test(sg.txt) && !/no máximo 1 saco/.test(sg.txt) && /prefira um saco menor/.test(sg.toast), 'nem um saco acaba antes da validade: "prefira um saco menor" (não "compre no máximo 1 saco"), no cartão e no aviso');
  conferir(/75 g por dia \(37,5 g × 2\)/.test(sg.txt) && /37,5 g por refeição/.test(await p.evaluate((id) => Pets.guiaSecoes(Pets.get(id))[0][1], pid)), 'gramas com a vírgula: "75 g por dia (37,5 g × 2)" no cartão e "37,5 g por refeição" no guia (não 38 g)');
  /* saco que não dá para ler: o formulário fica aberto e o aviso continua; "15 kg" (com a unidade) vale 15 */
  await p.click('#screen [data-act="pet.racao"]'); await modal(p, '[name="sacoKg"]');
  await p.fill('.modal [name="sacoKg"]', 'quinze'); await p.click('.modal:has([name="sacoKg"]) [data-ok]'); await p.waitForTimeout(300);
  const ileg = await p.evaluate((id) => { const i = document.querySelector('.modal [name="sacoKg"]'); return { aberto: !!i && i.value === 'quinze', toast: [...document.querySelectorAll('.toast')].some((t) => /tamanho do saco em kg/.test(t.textContent)), saco: DB.get('people', id).pet.racao.sacoKg }; }, pid);
  conferir(ileg.aberto && ileg.toast && ileg.saco === 15.5, 'tamanho do saco que não dá para ler ("quinze"): avisa e o formulário fica aberto (nada muda)');
  if (!(await p.evaluate(() => !!document.querySelector('.modal [name="sacoKg"]')))) { await p.click('#screen [data-act="pet.racao"]'); await modal(p, '[name="sacoKg"]'); }
  await p.fill('.modal [name="sacoKg"]', '15 kg'); await salvar(p, '[name="sacoKg"]');
  conferir(await p.evaluate((id) => DB.get('people', id).pet.racao.sacoKg === 15 && DB.raw('maint').some((m) => m.pet === id && m.petTipo === 'racao'), pid), '"15 kg" (com a unidade) fica 15 kg e o aviso "Comprar ração" continua');
  await p.click('#screen [data-act="pet.racao"]'); await modal(p, '[name="sacoKg"]');
  await p.fill('.modal [name="sacoKg"]', ''); await salvar(p, '[name="sacoKg"]');
  conferir(await p.evaluate((id) => !DB.raw('maint').some((m) => m.pet === id && m.petTipo === 'racao') && /Anote a ração/.test(document.querySelector('#pracao').textContent), pid), 'tirar o saco da ração apaga o aviso "Comprar ração" (não fica "atrasado" para sempre)');
  await p.click('#screen [data-act="pet.racao"]'); await modal(p, '[name="sacoKg"]');
  await p.fill('.modal [name="sacoKg"]', '3'); await salvar(p, '[name="sacoKg"]');

  /* ---------- lista, busca, largura ---------- */
  await p.evaluate(() => go('pets')); await p.waitForTimeout(500);
  const card = await p.evaluate(() => document.querySelector('#screen .petcard').textContent);
  conferir(/Bolinha de Teste/.test(card) && /Cachorro · Cavachon · 1 ano/.test(card) && /castrado/.test(card) && /Vermífugo/.test(card) && /ração para ~/.test(card) && /último banho/.test(card), 'cartão do pet: foto, nome, espécie · raça · idade, castrado, próximos cuidados, dias de ração e último banho');
  conferir(await p.evaluate((id) => { const x = JSON.parse(JSON.stringify(Pets.get(id))); x.pet.racao = { sacoKg: 0.15, gRefeicao: 75, refeicoesDia: 1, sacos: 1, compradoEm: addDays(today(), -1) }; const h = Pets.cartao(x); return /ração para ~1 dia</.test(h) && !/~1 dias/.test(h); }, pid), 'último dia de ração: "ração para ~1 dia" (não "~1 dias")');
  conferir(await p.evaluate(() => document.querySelector('#screen .petcard .petav.on') !== null), 'o cartão usa a foto de perfil');
  conferir(await semRolagem(p), 'lista dos pets: nada passa da largura da tela (390 px)');
  conferir(await p.evaluate((id) => { const r = Search.find('cavachon'); return r.some((x) => x.t === 'Bolinha de Teste' && /Cavachon/.test(x.s)) && Search.find('Bolinha').filter((x) => x.t === 'Bolinha de Teste').length === 1; }, pid), 'a busca acha o pet pelo nome e pela raça (uma vez só)');
  await p.evaluate(() => Search.find('cavachon').find((x) => x.t === 'Bolinha de Teste').fn()); await p.waitForTimeout(400);
  conferir(await p.evaluate((id) => S.route.tab === 'pets' && S.route.arg === id, pid), 'e leva à ficha');
  conferir(await semRolagem(p), 'ficha do pet: nada passa da largura da tela (390 px)');
  conferir(await p.evaluate(() => typeof AOne.HERE().pets === 'object' && !!HELP().pets && HELP().pets.steps.length >= 5 && Rec.TAB.pets === 'pets' && Rec.acao('pet.foto') === 'pets'), 'AssistONE desta tela, ajuda "pets" e o id "pets" do RootifyONE');

  /* ---------- criança vê e não muda ---------- */
  await p.evaluate(() => { S.role = 'crianca'; render(); }); await p.waitForTimeout(400);
  conferir(await p.evaluate(() => canTab('pets') && S.route.tab === 'pets'), 'criança abre 🐾 Pets');
  conferir(await p.evaluate(() => !document.querySelector('#screen [data-act^="pet."]:not([data-act="pet.verfoto"])') && !document.querySelector('#screen [data-act="health.edit"]') && !document.querySelector('#screen .thumb .x')), 'e não vê nenhum botão de mudar (só ver as fotos)');
  await p.evaluate(() => ACT['pet.new']()); await p.waitForTimeout(300);
  conferir(await p.evaluate(() => !document.querySelector('.modal')), 'criança: "＋ pet" não abre o formulário');
  await p.evaluate(() => { S.role = 'admin'; render(); }); await p.waitForTimeout(300);

  /* ---------- EN ---------- */
  await p.evaluate(() => setLang('en')); await p.waitForTimeout(400);
  const en = await p.evaluate(() => document.querySelector('#screen').textContent);
  conferir(/Vaccines and care/.test(en) && /Coming up/.test(en) && /lasts ~/.test(en) && /Weight/.test(en) && /Guide for the carer/.test(en) && /Contacts/.test(en), 'em inglês: Coming up, Food (lasts ~), Weight, Vaccines and care, Contacts, Guide for the carer');
  conferir(await semRolagem(p), 'em inglês, nada passa da largura');
  await p.evaluate(() => setLang('pt')); await p.waitForTimeout(300);

  /* ---------- tirar a foto de perfil (responsável) ---------- */
  const fPerfil = await p.evaluate((id) => DB.get('people', id).pet.foto.id, pid);
  await p.click('#screen [data-act="pet.apagarfoto"][data-f="' + fPerfil + '"]'); await sim(p);
  conferir(await p.evaluate((a) => !DB.get('people', a.pid).pet.foto && !Files.meta(a.f) && !document.querySelector('.petav.lg.on'), { pid, f: fPerfil }), '"🗑 Tirar a foto" apaga a foto de perfil (o emoji volta)');

  /* ---------- apagar o pet ---------- */
  const fotosIds =await p.evaluate((id) => PetFoto.refs(DB.get('people', id)).map((r) => r.id), pid);
  await p.click('#screen [data-act="pet.edit"]'); await modal(p, '[name="pet.especie"]');
  await p.click('.modal [data-del]'); await sim(p); await p.waitForTimeout(500);
  conferir(await p.evaluate((a) => !DB.get('people', a.pid) && !DB.raw('maint').some((m) => m.pet === a.pid) && !DB.get('health', a.pid) && a.f.every((f) => !Files.meta(f)) && S.route.tab === 'pets' && !S.route.arg, { pid, f: fotosIds }), 'apagar o pet leva as fotos, os cuidados e a carteira vital (e volta à lista)');
  conferir(await p.evaluate(() => !!Contacts.list().find((c) => c.name === 'Pet Shop Exemplo')), 'o contato continua');
  conferir(lixo.erros.length === 0 && lixo.nativos.length === 0, 'nenhum erro de script nem janela nativa' + (lixo.erros.length ? ': ' + lixo.erros.join(' | ') : ''));
  await p.context().close();

  /* =================== 2) nuvem de mentira (fetch do Storage gravado) =================== */
  console.log('\n[celular, família na nuvem de mentira]');
  const v = await abrirApp(browser, 'celular');
  const q = v.p;
  await preparar(q);
  await q.evaluate(() => {
    S.mode = 'cloud'; S.family = { id: 'fam-mentira', name: 'Família de mentira' }; S.role = 'admin';
    Conta.token = async () => 'token-de-mentira';
    AOne.save({ hello: 1, tips: Object.assign({}, AOne.cfg().tips, { home: 1, pets: 1 }) }); if (AOne.view) AOne.close();
    go('pets', 'ficha', 'pThor');
  });
  await q.waitForTimeout(500);
  conferir(await q.evaluate(() => /Cachorro/.test(document.querySelector('#screen').textContent) && /Labrador, 32 kg/.test(document.querySelector('#screen').textContent)), 'pet cadastrado antes da aba (Thor): espécie pelo ícone 🐶 e as observações antigas aparecem');
  /* o exemplo do modo visitante não usa o nome de um pet de verdade: o lembrete é "Reservar hotelzinho" */
  conferir(await q.evaluate(() => DB.raw('reminders').some((r) => r.title === 'Reservar hotelzinho' && r.ctx === 'pet') && !COLS.some((c) => /picol/i.test(JSON.stringify(DB.raw(c) || [])))), 'exemplo do visitante: "Reservar hotelzinho", sem o nome de um pet de verdade');
  /* cuidado de pet de antes da aba (Casa → Manutenção, sem o pet): fica ligado ao Thor ao abrir 🐾 Pets */
  await q.waitForFunction(() => DB.raw('maint').some((x) => /Vermífugo do Thor/.test(x.title) && x.pet), null, { timeout: 5000 }).catch(() => {});
  await q.waitForTimeout(300);
  const leg = await q.evaluate(() => { const m = DB.raw('maint').find((x) => /Vermífugo do Thor/.test(x.title)); return m && { pet: m.pet, tipo: m.petTipo, lista: Pets.cuidados('pThor').some((x) => x.id === m.id), tela: [...document.querySelectorAll('#screen .card')].some((c) => /Vacinas e cuidados/.test(c.textContent) && /Vermífugo do Thor/.test(c.textContent)) }; });
  conferir(leg && leg.pet === 'pThor' && leg.tipo === 'vermifugo' && leg.lista && leg.tela, 'cuidado de pet de antes da aba ("Vermífugo do Thor", sem o pet): ligado ao Thor (vermífugo) e aparece em "Vacinas e cuidados"');
  await q.click('#screen [data-act="pet.cuidado"]'); await q.waitForSelector('.menu', { timeout: 4000 });
  const menuT = await q.evaluate(() => document.querySelector('.menu').textContent); await fecharJanelas(q); await q.waitForTimeout(200);
  conferir(!/Vermífugo/.test(menuT) && /Vacina anual/.test(menuT), 'e o ＋ não oferece outro vermífugo (nada de aviso em dobro)');
  /* com dois pets, o nome de um só dentro de uma palavra ("Mi" em "vermífugo") não liga o cuidado antigo a ele */
  const lig = await q.evaluate(async () => {
    const mi = await DB.put('people', { name: 'Mimi Teste', nick: 'Mi', role: 'pet', emoji: '🐱', pet: { especie: 'gato' } });
    const a = await DB.put('maint', { title: 'Vermífugo do pet', cat: 'pet', interval: 90 }), b = await DB.put('maint', { title: 'Banho da Mimi Teste', cat: 'pet', interval: 45 });
    await Pets.ligarAntigos();
    const r = { a: DB.get('maint', a.id).pet || null, b: DB.get('maint', b.id).pet || null, mi: mi.id };
    await DB.del('maint', a.id); await DB.del('maint', b.id); await DB.del('people', mi.id);
    return r;
  });
  conferir(!lig.a && lig.b === lig.mi, 'cuidado antigo: o nome do pet só vale como palavra inteira ("Mi" dentro de "vermífugo" não liga; "Banho da Mimi Teste" liga à Mimi)');
  conferir(await q.evaluate(() => /Guia para quem cuida/.test(document.querySelector('#screen').textContent) && Pets.guiaSecoes(Pets.get('pThor')).find((x) => x[0] === 'Manias e cuidados')[1] === 'Labrador, 32 kg'), 'o guia de quem cuida usa as observações antigas do pet em "Manias e cuidados"');
  await q.evaluate(async () => { window.__picks.push([window.__arq(await window.__img(1800, 1200, 'image/png', 20), 'perfil.png')]); });
  await q.evaluate(() => ACT['pet.foto']({ id: 'pThor' }));
  await q.waitForFunction(() => !!(DB.get('people', 'pThor').pet || {}).foto, null, { timeout: 15000 }).catch(() => {});
  const up = await q.evaluate(async () => { const f = DB.get('people', 'pThor').pet.foto, b = await Files.blob(f.id); return { f, size: b.size, st: window.__st.slice(), SB: Conta.SB, KEY: Conta.KEY }; });
  const u0 = up.st[0] || { h: {} };
  conferir(up.st.length === 1 && u0.met === 'POST' && u0.u === up.SB + '/storage/v1/object/sol-arquivos/omnilife-one/fam-mentira/pet-' + up.f.id + '.webp', 'nuvem: envia um POST para sol-arquivos/omnilife-one/<família>/pet-<id>.webp');
  conferir(u0.h.apikey === up.KEY && u0.h.Authorization === 'Bearer token-de-mentira' && u0.h['Content-Type'] === 'image/webp' && u0.body && u0.body.size === up.size && u0.body.type === 'image/webp', 'com a apikey pública, a sessão da pessoa e só a foto redesenhada (' + Math.round(up.size / 1024) + ' KB)');
  conferir(up.f.path === 'omnilife-one/fam-mentira/pet-' + up.f.id + '.webp' && !up.f.pendente && up.f.w <= 640, 'o pet guarda só a referência { id, path, w, h }');
  /* sem internet: fica pendente e vai ao abrir 🐾 Pets */
  await q.evaluate(async () => { window.__falhaEnvio = true; window.__picks.push([window.__arq(await window.__img(1200, 900, 'image/jpeg'), 'galeria.jpg')]); });
  await q.evaluate(() => ACT['pet.fotos']({ id: 'pThor' }));
  await q.waitForFunction(() => ((DB.get('people', 'pThor').pet || {}).fotos || []).length === 1, null, { timeout: 15000 }).catch(() => {});
  await q.waitForTimeout(400);
  const pend = await q.evaluate(() => Object.assign({ local: !!Files.meta(DB.get('people', 'pThor').pet.fotos[0].id) }, DB.get('people', 'pThor').pet.fotos[0]));
  conferir(pend && pend.pendente === true && /^omnilife-one\/fam-mentira\/pet-/.test(pend.path) && pend.local, 'envio que falhou: a foto fica aqui com pendente: true');
  conferir(await q.evaluate(() => /esperando a internet/.test(document.querySelector('#screen').textContent) && [...document.querySelectorAll('.toast')].some((t) => /quando a internet voltar/.test(t.textContent))), 'e a tela avisa que vai subir quando a internet voltar');
  await q.evaluate(() => { window.__falhaEnvio = false; PetFoto._reenvT = 0; go('pets'); });
  await q.waitForFunction(() => !DB.get('people', 'pThor').pet.fotos[0].pendente, null, { timeout: 8000 }).catch(() => {});
  conferir(await q.evaluate((path) => { const f = DB.get('people', 'pThor').pet.fotos[0]; return !f.pendente && f.path === path && window.__st.filter((x) => x.met === 'POST' && x.u.endsWith('/sol-arquivos/' + path)).length === 2; }, pend.path), 'ao abrir 🐾 Pets de novo, a foto pendente sobe e deixa de ser pendente');
  /* outro celular: o registro chegou, o arquivo não */
  const nGet0 = await q.evaluate(() => window.__st.filter((x) => x.met === 'GET').length);
  await q.evaluate(async () => { const d = DB.get('people', 'pThor').pet; await DB.patch('people', 'pThor', { 'pet.fotos': d.fotos.concat({ id: 'fnuvem1', path: 'omnilife-one/fam-mentira/pet-fnuvem1.webp', w: 64, h: 48 }) }); go('pets', 'ficha', 'pThor'); });
  conferir(await q.evaluate(() => !Files.meta('fnuvem1')), 'preparo: foto de outro celular (só a referência, sem o arquivo aqui)');
  const baixou = await q.waitForSelector('#screen .thumb[data-pfoto="fnuvem1"].on', { timeout: 8000 }).then(() => true, () => false);
  const gets = await q.evaluate(() => window.__st.filter((x) => x.met === 'GET'));
  const gx = gets[gets.length - 1] || { h: {} };
  conferir(baixou && gets.length === nGet0 + 1 && gx.u === await q.evaluate(() => Conta.SB) + '/storage/v1/object/authenticated/sol-arquivos/omnilife-one/fam-mentira/pet-fnuvem1.webp' && gx.h.Authorization === 'Bearer token-de-mentira', '"outro celular": baixa pelo path (authenticated, com a sessão) e mostra');
  conferir(await q.evaluate(() => { const m = Files.meta('fnuvem1'); return !!m && m.type === 'image/webp' && m.nuvem === 'omnilife-one/fam-mentira/pet-fnuvem1.webp'; }), 'e guarda neste aparelho (IndexedDB)');
  await q.evaluate(() => render()); await q.waitForTimeout(500);
  conferir(await q.evaluate((n) => window.__st.filter((x) => x.met === 'GET').length === n + 1, nGet0), 'na próxima vez não baixa de novo');
  /* apagar (responsável): daqui e da nuvem */
  await q.click('#screen .thumb[data-pfoto="' + pend.id + '"] .x'); await sim(q);
  const del = await q.evaluate((id) => window.__st.filter((x) => x.met === 'DELETE').map((x) => x.u), pend.id);
  conferir(del.length === 1 && del[0].endsWith('/storage/v1/object/sol-arquivos/' + pend.path) && await q.evaluate((id) => !Files.meta(id) && !DB.get('people', 'pThor').pet.fotos.some((f) => f.id === id), pend.id), 'apagar a foto tira daqui e da nuvem (DELETE no Storage)');
  await q.evaluate(() => { window.__falhaApagar = true; });
  await q.click('#screen .thumb[data-pfoto="fnuvem1"] .x'); await sim(q);
  conferir(await q.evaluate(() => lsGet(LS.petFotoApagar, []).some((x) => x.path === 'omnilife-one/fam-mentira/pet-fnuvem1.webp' && x.g === 'fam-mentira') && !Files.meta('fnuvem1')), 'sem internet: sai daqui na hora e o apagar da nuvem fica guardado para depois');
  await q.evaluate(() => { window.__falhaApagar = false; PetFoto._reenvT = 0; go('pets'); });
  await q.waitForFunction(() => !lsGet(LS.petFotoApagar, []).length, null, { timeout: 8000 }).catch(() => {});
  conferir(await q.evaluate(() => !lsGet(LS.petFotoApagar, []).length && window.__st.filter((x) => x.met === 'DELETE' && /pet-fnuvem1/.test(x.u)).length === 2), 'e é apagado da nuvem ao abrir 🐾 Pets de novo');
  /* foto de perfil pendente: no "servidor" (que junta objetos chave a chave) o pendente tem de sair quando ela sobe */
  const perfil = async (falha) => {
    const antes = await q.evaluate(async (f) => { window.__falhaEnvio = f; window.__picks.push([window.__arq(await window.__img(800, 600, 'image/png'), 'perfil2.png')]); return (DB.get('people', 'pThor').pet.foto || {}).id; }, falha);
    await q.evaluate(() => ACT['pet.foto']({ id: 'pThor' }));
    await q.waitForFunction((a) => (DB.get('people', 'pThor').pet.foto || {}).id !== a, antes, { timeout: 15000 }).catch(() => {});
    await q.waitForTimeout(300);
  };
  const fotoNuvem = () => q.evaluate(() => ({ l: DB.get('people', 'pThor').pet.foto, n: window.__nuvem['people|pThor'].pet.foto, tela: /esperando a internet/.test(document.querySelector('#screen').textContent) }));
  await perfil(true); const fp1 = await fotoNuvem();
  await perfil(false); const fp2 = await fotoNuvem();
  conferir(fp1.n.pendente === true && fp2.n.id === fp2.l.id && fp2.n.id !== fp1.n.id && !fp2.n.pendente && !fp2.l.pendente, 'trocar a foto de perfil pendente por uma que subiu: a nova não herda o "pendente" na nuvem');
  await perfil(true);
  await q.evaluate(() => { window.__falhaEnvio = false; PetFoto._reenvT = 0; go('pets', 'ficha', 'pThor'); });
  await q.waitForFunction(() => !DB.get('people', 'pThor').pet.foto.pendente, null, { timeout: 8000 }).catch(() => {});
  await q.waitForTimeout(400);
  const fp3 = await fotoNuvem();
  conferir(fp3.n.id === fp3.l.id && !!fp3.n.path && !fp3.n.pendente && !fp3.l.pendente && !fp3.tela, 'foto de perfil pendente que subiu ao abrir 🐾 Pets: o "pendente" sai também na nuvem (não fica "esperando a internet" para sempre)');
  /* galeria pelo registro inteiro (com versão): a foto deste celular e a de outro, postas ao mesmo tempo, ficam as duas */
  const g0 = await q.evaluate(() => { window.__ops = []; return JSON.parse(JSON.stringify(DB.get('people', 'pThor'))); });
  await q.evaluate(async () => { window.__picks.push([window.__arq(await window.__img(900, 600, 'image/jpeg'), 'a1.jpg')]); });
  await q.evaluate(() => ACT['pet.fotos']({ id: 'pThor' }));
  await q.waitForFunction((n) => (DB.get('people', 'pThor').pet.fotos || []).length === n + 1, (g0.pet.fotos || []).length, { timeout: 15000 }).catch(() => {});
  const gal = await q.evaluate((base) => {
    const mine = JSON.parse(JSON.stringify(DB.get('people', 'pThor'))), theirs = JSON.parse(JSON.stringify(base));
    theirs.pet.fotos = (theirs.pet.fotos || []).concat({ id: 'fb1', path: 'omnilife-one/fam-mentira/pet-fb1.webp', w: 64, h: 48 });
    const m = merge3(base, mine, theirs), ops = window.__ops.filter((o) => o.c === 'people' && o.id === 'pThor');
    return { put: ops.some((o) => o.op === 'put'), patchLista: ops.some((o) => o.op === 'patch' && o.ks.includes('pet.fotos')), ids: (m.doc.pet.fotos || []).map((f) => f.id), novo: mine.pet.fotos[mine.pet.fotos.length - 1].id, conflitos: m.conflitos.length };
  }, g0);
  conferir(gal.put && !gal.patchLista && gal.ids.includes(gal.novo) && gal.ids.includes('fb1') && !gal.conflitos, 'galeria muda pelo registro inteiro (não pela lista solta): fotos de dois celulares ao mesmo tempo ficam as duas (' + gal.ids.join(', ') + ')');
  /* foto pendente de outro aparelho (sem arquivo aqui): "ainda não subiu", sem buscar na nuvem e sem "esperando a internet" aqui */
  await q.evaluate(async () => { const d = DB.get('people', 'pThor').pet; await DB.patch('people', 'pThor', { 'pet.fotos': (d.fotos || []).concat({ id: 'fpend9', path: 'omnilife-one/fam-mentira/pet-fpend9.webp', w: 64, h: 48, pendente: true }) }); go('pets', 'ficha', 'pThor'); });
  await q.waitForTimeout(800);
  const pz9 = await q.evaluate(() => ({ get: window.__st.some((x) => /pet-fpend9/.test(x.u)), lb: (document.querySelector('#screen .thumb[data-pfoto="fpend9"] .lb') || {}).textContent || '', esperando: /esperando a internet/.test(document.querySelector('#screen').textContent) }));
  conferir(!pz9.get && /ainda não subiu/.test(pz9.lb) && !pz9.esperando, 'foto pendente de outro aparelho: "⏳ ainda não subiu", sem buscar na nuvem a cada minuto e sem "esperando a internet" neste');
  await q.evaluate(async () => { const d = DB.get('people', 'pThor').pet; await DB.patch('people', 'pThor', { 'pet.fotos': d.fotos.filter((f) => f.id !== 'fpend9') }); });
  /* registro do pet mexido por outro celular apontando para outro arquivo deste aparelho (a foto restrita, cifrada ou não, de um
     serviço do carro): não sobe para a nuvem, não aparece e não é apagado daqui */
  const seg = await q.evaluate(async () => {
    const snap = JSON.parse(JSON.stringify(DB.get('people', 'pThor')));
    S.vaultKey = await crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
    const cif = await Files.save(new File([new Blob(['SEGREDO-DE-MENTIRA'], { type: 'image/jpeg' })], 'nota.jpg', { type: 'image/jpeg' }), { vis: 'restrito', encrypt: true, raw: true });
    const pla = await Files.save(new File([new Blob(['OUTRO-SEGREDO-DE-MENTIRA'], { type: 'image/jpeg' })], 'n2.jpg', { type: 'image/jpeg' }), { vis: 'restrito', raw: true });
    const n0 = window.__st.length;
    await DB.patch('people', 'pThor', { 'pet.foto': { id: cif, pendente: true }, 'pet.fotos': (snap.pet.fotos || []).concat({ id: pla, path: PetFoto.caminho(pla, 'image/jpeg'), pendente: true }) });
    PetFoto._reenvT = 0; go('pets', 'ficha', 'pThor');
    await new Promise((r) => setTimeout(r, 1500));
    const pedidos = window.__st.slice(n0).filter((x) => x.u.includes(cif) || x.u.includes(pla)).map((x) => x.met + ' ' + x.u);
    const tela = !!document.querySelector('#screen .petav.lg.on') || !!document.querySelector('#screen .thumb[data-pfoto="' + pla + '"].on');
    /* tirar a foto, trocar a de perfil e apagar o pet passam por aqui */
    await PetFoto.apagarArquivo({ id: cif }, 'pThor'); await PetFoto.apagarArquivo({ id: pla, path: PetFoto.caminho(pla, 'image/jpeg') }, 'pThor');
    const ficou = !!Files.meta(cif) && !!Files.meta(pla) && !!(await Files.blob(pla));
    await DB.put('people', snap); await Files.remove(cif); await Files.remove(pla); S.vaultKey = null;
    return { pedidos, tela, ficou };
  });
  conferir(!seg.pedidos.length, 'id de outro arquivo deste aparelho no registro do pet (restrito, cifrado ou não, marcado pendente): nada sobe para a nuvem (' + seg.pedidos.join(' | ') + ')');
  conferir(!seg.tela && seg.ficou, 'e ele não aparece como foto do pet nem é apagado daqui (só o arquivo que o PetFoto guardou para este pet)');
  /* path mexido no registro (outro app, o "restrito", id trocado) e na lista de apagar depois: nada sai de omnilife-one/<família>/pet-<id> */
  const cam = await q.evaluate(async () => {
    const snap = JSON.parse(JSON.stringify(DB.get('people', 'pThor'))), n0 = window.__st.length;
    lsSet(LS.petFotoApagar, [{ g: 'fam-mentira', path: 'moneytrio/fam-mentira/fila.pdf' }]);
    await DB.patch('people', 'pThor', { 'pet.foto': { id: 'fx1', path: 'moneytrio/fam-mentira/comprovante.pdf' }, 'pet.fotos': (snap.pet.fotos || []).concat({ id: 'fx2', path: 'outroapp/fam-mentira/restrito/doc.pdf' }, { id: 'fx3', path: 'omnilife-one/fam-mentira/pet-OUTRA.webp' }) });
    PetFoto._reenvT = 0; go('pets', 'ficha', 'pThor');
    await new Promise((r) => setTimeout(r, 1200));
    window.__falhaApagar = true;
    for (const id of ['fx1', 'fx2', 'fx3']) await PetFoto.apagarArquivo(PetFoto.refs(DB.get('people', 'pThor')).find((r) => r.id === id), 'pThor');
    window.__falhaApagar = false;
    const fora = window.__st.slice(n0).map((x) => x.met + ' ' + x.u).filter((x) => /moneytrio|outroapp|pet-OUTRA|fila\.pdf/.test(x)), fila = lsGet(LS.petFotoApagar, []);
    await DB.put('people', snap); lsSet(LS.petFotoApagar, []);
    return { fora, fila };
  });
  conferir(!cam.fora.length && !cam.fila.length, 'path mexido no registro (outro app, "restrito", id trocado): nada é baixado, enviado nem apagado fora de omnilife-one/<família>/pet-<id>, e a lista de apagar depois não guarda nem manda outro caminho (' + cam.fora.concat(cam.fila.map((x) => x.path)).join(' | ') + ')');
  /* ⚙ → Dados: a foto do pet que já subiu não é "só deste aparelho" */
  const sa = await q.evaluate(async () => {
    const gid0 = CloudDriver.gid, fp = DB.get('people', 'pThor').pet.foto.id;
    const outro = await Files.save(new File([new Blob(['x'], { type: 'text/plain' })], 'nota.txt', { type: 'text/plain' }), { raw: true });
    CloudDriver.gid = 'g-soaqui'; CloudDriver.recs.set('files|' + fp, { doc: Files.meta(fp) }); CloudDriver.recs.set('files|' + outro, { doc: Files.meta(outro) });
    try { return { n: Migrar.soAqui().files, txt: Migrar.card() }; }
    finally { CloudDriver.recs.delete('files|' + fp); CloudDriver.recs.delete('files|' + outro); CloudDriver.gid = gid0; await Files.remove(outro); }
  });
  conferir(sa.n === 1 && /fotos dos pets/.test(sa.txt), '⚙ → Dados: a foto do pet que já está na nuvem não conta como "só neste aparelho" (e o texto diz que as fotos dos pets vão para a nuvem)');
  /* fila da nuvem: tirar a foto depois de pô-la, ainda sem internet, não deixa a foto recriada só com o "pendente" */
  const fila = await q.evaluate(async () => {
    const gid0 = CloudDriver.gid, fl = CloudDriver.flush, key = 'people|pFila';
    CloudDriver.gid = 'g-fila'; CloudDriver.flush = async () => {};
    try {
      await CloudDriver.enfileirar(key, { op: 'patch', fields: { 'pet.foto': { id: 'fa', path: 'x', pendente: true }, 'pet.foto.pendente': true } });
      await CloudDriver.enfileirar(key, { op: 'patch', fields: { 'pet.foto': undefined } });
      const op = CloudDriver.fila.get(key);
      return { ks: Object.keys(op.fields), foto: CloudDriver.aninhar(op.fields).pet.foto };
    } finally { CloudDriver.fila.delete(key); try { await IDB.del('fila', 'g-fila|' + key); } catch (e) {} await new Promise((r) => setTimeout(r, 450)); CloudDriver.gid = gid0; CloudDriver.flush = fl; Sync.badge(); }
  });
  conferir(fila.ks.join() === 'pet.foto' && fila.foto === null, 'fila sem internet: pôr e tirar a foto de perfil vira só "tirar" (o "pet.foto.pendente" de antes não recria a foto; ' + JSON.stringify(fila) + ')');
  /* pet apagado em outro celular enquanto este mandava um peso (o omni_mudar_campos muda até linha apagada): não volta como fantasma */
  const fant = await q.evaluate(async () => {
    const salvo = { drv: DB.driver, gid: CloudDriver.gid, rpc: Conta.rpc, rest: Conta.rest };
    const linha = { id: 'pFantasma', vis: 'publico', dados: { name: 'Rex Fantasma', role: 'pet', pet: {} }, versao: 6, atualizado_em: new Date().toISOString(), apagado_em: new Date().toISOString() };
    try {
      Conta.rpc = async (fn, a) => { linha.dados = window.__mesclar(linha.dados, a.p_campos); linha.versao++; return linha.versao; };
      Conta.rest = async (met, url) => { if (met === 'GET' && /id=eq\.pFantasma/.test(url)) return [JSON.parse(JSON.stringify(linha))]; throw Object.assign(new Error('não esperado'), { status: 500 }); };
      DB.driver = CloudDriver; CloudDriver.gid = 'g-fantasma';
      const doc = { id: 'pFantasma', name: 'Rex Fantasma', role: 'pet', vis: 'familia', pet: {} };
      CloudDriver.recs.set('people|pFantasma', { doc, base: { name: 'Rex Fantasma', role: 'pet', pet: {} }, vis: 'publico', versao: 5 });
      DB.col('people').set('pFantasma', doc);
      await CloudDriver.enviar('people', 'pFantasma', { op: 'patch', fields: { 'pet.pesos': [{ id: 'w1', d: today(), kg: 8 }] } });
      await CloudDriver.receber(Object.assign({ colecao: 'people' }, JSON.parse(JSON.stringify(linha))));
      return { aqui: !!DB.col('people').get('pFantasma'), rec: CloudDriver.recs.has('people|pFantasma') };
    } finally {
      DB.col('people').delete('pFantasma'); CloudDriver.recs.delete('people|pFantasma'); try { await IDB.del('nuvem', 'g-fantasma|people|pFantasma'); } catch (e) {}
      CloudDriver.gid = salvo.gid; DB.driver = salvo.drv; Conta.rpc = salvo.rpc; Conta.rest = salvo.rest;
    }
  });
  conferir(!fant.aqui && !fant.rec, 'pet apagado em outro celular enquanto este mandava um peso: sai daqui (não volta como fantasma com a versão nova)');
  conferir(await semRolagem(q), 'nada passa da largura da tela');
  conferir(v.lixo.erros.length === 0 && v.lixo.nativos.length === 0, 'nenhum erro de script nem janela nativa' + (v.lixo.erros.length ? ': ' + v.lixo.erros.join(' | ') : ''));

  /* =================== 3) qualquer bicho (2.25.0): cada tipo com os cuidados, os campos, a comida e o guia dele =================== */
  console.log('\n[celular, qualquer bicho]');
  const { p: pb, lixo: lb } = await abrirApp(browser, 'celular', { semEntrar: true });
  await pb.evaluate(() => ACT['gate.local']());
  await pb.waitForSelector('#fn', { timeout: 10000 });
  await pb.fill('#fn', 'Família Bichos Teste'); await pb.fill('#mn', 'Pessoa Teste'); await pb.click('#go');
  await pb.waitForFunction(() => S.booted, null, { timeout: 15000 });
  await pb.waitForTimeout(600); await fecharJanelas(pb);
  await pb.evaluate(() => { AOne.save({ hello: 1, tips: { home: 1, pets: 1, family: 1, house: 1, health: 1, shop: 1 } }); if (AOne.view) AOne.close(); });
  const ficha = async (id) => { await pb.evaluate((id) => go('pets', 'ficha', id), id); await pb.waitForTimeout(400); };
  /* as opções do ＋ de cuidados de um pet, uma por linha */
  const menuDe = async (id) => {
    await ficha(id);
    await pb.click('#screen [data-act="pet.cuidado"]'); await pb.waitForSelector('.menu', { timeout: 4000 });
    const t = await pb.evaluate(() => [...document.querySelectorAll('.menu button')].map((b) => b.textContent.trim()));
    await fecharJanelas(pb); await pb.waitForTimeout(200);
    return t;
  };
  const tem = (L, re) => L.some((t) => re.test(t));

  /* ---------- coelho, sozinho na família (o cuidado antigo sem nome de pet vai para ele) ---------- */
  const coelho = await pb.evaluate(async () => (await DB.put('people', { name: 'Orelha Teste', role: 'pet', emoji: '🐰', pet: { especie: 'coelho', raca: 'Mini Lop' } })).id);
  const antigo = await pb.evaluate(async () => (await DB.put('maint', { title: 'Antipulgas do pet', cat: 'pet', interval: 30, last: addDays(today(), -10) })).id);
  await pb.evaluate(() => go('pets'));
  await pb.waitForFunction((id) => !!(DB.get('maint', id) || {}).pet, antigo, { timeout: 5000 }).catch(() => {});
  await ficha(coelho);
  const ant = await pb.evaluate((id) => { const m = DB.get('maint', id); return { pet: m.pet, tipo: m.petTipo, rot: Pets.info(m)[2], tela: /Antipulgas do pet/.test(document.querySelector('#screen').textContent) }; }, antigo);
  conferir(ant.pet === coelho && ant.tipo === 'outro' && ant.rot === 'Antipulgas do pet' && ant.tela, 'coelho sozinho na família: o "Antipulgas do pet" de antes fica ligado a ele como "outro" (com o título dele) e continua na ficha (' + JSON.stringify(ant) + ')');
  const mc = await menuDe(coelho);
  conferir(!tem(mc, /Antipulgas|Banho e tosa|Vacina|Vermífugo/) && tem(mc, /Escovar o pelo/) && tem(mc, /Limpeza completa da gaiola/) && tem(mc, /Outro cuidado/), '＋ do coelho: sem antipulgas, banho e tosa, vacina e vermífugo; com escovar o pelo e a gaiola (' + mc.join(' | ') + ')');
  await pb.evaluate(() => go('house', 'maint')); await pb.waitForTimeout(400);
  const chips = await pb.evaluate(() => [...document.querySelectorAll('#screen [data-act="mt.tpl"]')].map((c) => c.textContent));
  conferir(!tem(chips, /Vacina anual do pet|Vermífugo do pet|Antipulgas do pet/) && tem(chips, /Troca do botijão de gás/), 'Casa → Manutenção com 🐾 Pets ligado: sem o atalho "Vacina anual do pet" (nem vermífugo e antipulgas); os da casa ficam');

  /* ---------- calopsita (ave), cadastrada pelo formulário ---------- */
  await pb.evaluate(() => go('pets')); await pb.waitForTimeout(400);
  await pb.click('#screen [data-act="pet.new"]'); await modal(pb, '[name="pet.especie"]');
  await pb.selectOption('.modal [name="pet.especie"]', 'ave'); await pb.waitForTimeout(150);
  const fAve = await pb.evaluate(() => { const c = (k) => document.querySelector('.modal [name="' + k + '"]').closest('label'); return { cast: c('pet.castrado').style.display, ped: c('pet.pedigree').style.display, cor: c('pet.cor').textContent, chip: c('pet.microchip').textContent, raca: c('pet.raca').textContent }; });
  conferir(fAve.cast === 'none' && fAve.ped === 'none' && /Plumagem/.test(fAve.cor) && /anilha/.test(fAve.chip) && /Espécie/.test(fAve.raca), 'formulário da ave: castrado e pedigree escondidos, a cor diz "Plumagem" e o microchip diz "anilha"');
  const imChip = () => pb.evaluate(() => document.querySelector('.modal [name="pet.microchip"]').inputMode);
  const imAve = await imChip(); await pb.selectOption('.modal [name="pet.especie"]', 'cachorro'); const imCao = await imChip(); await pb.selectOption('.modal [name="pet.especie"]', 'ave');
  conferir(imAve === 'text' && imCao === 'numeric', 'a anilha da ave abre o teclado com letras; o microchip do cachorro continua só com números (' + imAve + ', ' + imCao + ')');
  await pb.fill('.modal [name="name"]', 'Kiwi Teste'); await pb.fill('.modal [name="pet.raca"]', 'Calopsita');
  await salvar(pb, '[name="pet.especie"]');
  const ave = await pb.evaluate(() => (Pets.list().find((x) => x.name === 'Kiwi Teste') || {}).id);
  conferir(await pb.evaluate((id) => { const x = DB.get('people', id); return !!x && x.pet.especie === 'ave' && x.emoji === '🐦'; }, ave), 'calopsita salva como ave, com 🐦');
  const ma = await menuDe(ave);
  conferir(tem(ma, /Consulta anual com veterinária de aves/) && tem(ma, /Limpeza completa da gaiola · a cada 7 dias/) && tem(ma, /Outro cuidado/) && !tem(ma, /Vacina|Vermífugo|Antipulgas|Banho e tosa/), '＋ da calopsita: consulta anual com veterinária de aves, limpeza da gaiola a cada 7 dias e outro cuidado; sem vacina, vermífugo, antipulgas e banho e tosa (' + ma.join(' | ') + ')');
  /* peso em gramas: "35" é 35 g; "1,2 kg" (com a unidade) é 1,2 kg */
  await ficha(ave);
  for (const [dias, g] of [[10, '1,2 kg'], [0, '35']]) {
    await pb.click('#screen [data-act="pet.peso"]'); await modal(pb, '[name="kg"]');
    await pb.fill('.modal [name="d"]', await pb.evaluate((n) => addDays(today(), -n), dias)); await pb.fill('.modal [name="kg"]', g);
    await salvar(pb, '[name="kg"]');
  }
  const pAve = await pb.evaluate((id) => ({ kgs: Pets.pesos(Pets.get(id)).map((x) => x.kg), txt: document.querySelector('#screen').textContent }), ave);
  conferir(JSON.stringify(pAve.kgs) === '[1.2,0.035]' && /Último: 35 g/.test(pAve.txt), 'peso da calopsita: "35" grava 0,035 kg, "1,2 kg" grava 1,2 kg e o cartão mostra "Último: 35 g" (' + JSON.stringify(pAve.kgs) + ')');
  /* "0,145" (o jeito da 2.24.0, em kg) gravava 0 e o peso sumia: agora avisa e o formulário fica aberto */
  await pb.click('#screen [data-act="pet.peso"]'); await modal(pb, '[name="kg"]');
  await pb.fill('.modal [name="d"]', await pb.evaluate(() => addDays(today(), -5))); await pb.fill('.modal [name="kg"]', '0,145');
  await pb.click('.modal:has([name="kg"]) [data-ok]'); await pb.waitForTimeout(500);
  const pAve0 = await pb.evaluate((id) => ({ aberto: !!document.querySelector('.modal [name="kg"]'), aviso: [...document.querySelectorAll('.toast')].some((t) => /0,145 kg = 145/.test(t.textContent)), bruto: (Pets.dados(Pets.get(id)).pesos || []).map((x) => x.kg) }), ave);
  conferir(pAve0.aberto && pAve0.aviso && JSON.stringify(pAve0.bruto) === '[1.2,0.035]', 'peso em gramas: "0,145" avisa ("0,145 kg = 145"), o formulário fica aberto e nada é gravado (nem um peso 0 escondido) (' + JSON.stringify(pAve0) + ')');
  /* décimo de grama (o que o cartão mostra) e "1.200" com ponto de milhar = 1200 g */
  await pb.fill('.modal [name="kg"]', '35,5'); await salvar(pb, '[name="kg"]');
  await pb.click('#screen [data-act="pet.peso"]'); await modal(pb, '[name="kg"]');
  await pb.fill('.modal [name="d"]', await pb.evaluate(() => addDays(today(), -3))); await pb.fill('.modal [name="kg"]', '1.200'); await salvar(pb, '[name="kg"]');
  const pAve2 = await pb.evaluate((id) => ({ kgs: Pets.pesos(Pets.get(id)).map((x) => x.kg), txt: document.querySelector('#screen').textContent, kg: [Pets.kg('1.200', 'kg'), Pets.kg('4.500 g', 'kg'), Pets.kg('8,4', 'kg'), Pets.kg('12.5', 'g')] }), ave);
  conferir(JSON.stringify(pAve2.kgs) === '[1.2,0.0355,1.2,0.035]' && /35,5 g/.test(pAve2.txt) && JSON.stringify(pAve2.kg) === '[1.2,4.5,8.4,0.0125]', 'peso em gramas: "35,5" grava 35,5 g (o cartão mostra "35,5 g"), "1.200" é 1200 g; em kg, "1.200" continua 1,2 kg e "8,4" 8,4 kg (' + JSON.stringify(pAve2.kgs) + ' ' + JSON.stringify(pAve2.kg) + ')');
  /* ração: gramas por dia (sem refeições) e o pacote */
  await pb.click('#screen [data-act="pet.racao"]'); await modal(pb, '[name="sacoKg"]');
  conferir(await pb.evaluate(() => !document.querySelector('.modal [name="refeicoesDia"]') && /Gramas por dia/.test(document.querySelector('.modal [name="gRefeicao"]').closest('label').textContent) && /pacote/.test(document.querySelector('.modal [name="sacoKg"]').closest('label').textContent)), 'ração da calopsita: sem "Refeições por dia", com "Gramas por dia" e o tamanho do pacote');
  await pb.fill('.modal [name="marca"]', 'Mistura Exemplo'); await pb.fill('.modal [name="sacoKg"]', '500 g'); await pb.fill('.modal [name="gRefeicao"]', '10');
  await salvar(pb, '[name="sacoKg"]');
  const rAve = await pb.evaluate((id) => { const r = Pets.dados(Pets.get(id)).racao; return { r, c: Pets.racaoCalc(r), txt: document.querySelector('#pracao').textContent }; }, ave);
  conferir(rAve.r.sacoKg === 0.5 && rAve.c && rAve.c.dias === 50 && /dura ~50 dias/.test(rAve.txt) && !/×/.test(rAve.txt), 'pacote de 0,5 kg ("500 g") com 10 g por dia dura 50 dias, sem "× 1" no cartão (' + JSON.stringify(rAve.r) + ')');
  await pb.click('#screen [data-act="pet.racao"]'); await modal(pb, '[name="sacoKg"]');
  await pb.fill('.modal [name="sacoKg"]', '250'); await salvar(pb, '[name="sacoKg"]');
  const r250 = await pb.evaluate(async (id) => { const r = Pets.dados(Pets.get(id)).racao; await Pets.paraCompras(id); const s = Shop.open().find((x) => x.name === 'Ração Mistura Exemplo'); return { kg: r.sacoKg, txt: document.querySelector('#pracao').textContent, nota: s && s.note }; }, ave);
  await pb.click('#screen [data-act="pet.racao"]'); await modal(pb, '[name="sacoKg"]'); await salvar(pb, '[name="sacoKg"]');
  const rDe = await pb.evaluate((id) => Pets.dados(Pets.get(id)).racao.sacoKg, ave);
  conferir(r250.kg === 0.25 && rDe === 0.25 && /pacote de 250 g dura ~25 dias/.test(r250.txt) && r250.nota === '250 g · Kiwi Teste', 'pacote sem unidade: "250" é 250 g (não 250 kg), o cartão e a lista de compras dizem "250 g" e salvar sem mexer continua 250 g (' + JSON.stringify([r250.kg, rDe, r250.nota]) + ')');
  /* o guia de verdade (📘), como a pessoa monta */
  await pb.click('#screen [data-act="pet.guia"]'); await modal(pb, '#gsec');
  const gAve = await pb.evaluate((id) => { const g = DB.all('guides').find((x) => x.kind === 'pet' && x.pet === id); return g ? g.sections.map((s) => [s.h, s.body]) : []; }, ave);
  await cancelar(pb, '#gsec');
  conferir(gAve.length && !gAve.some((s) => s[0] === 'Passeios') && gAve.some((s) => s[0] === 'Gaiola, água e banho de sol' && /banho de sol/i.test(s[1])) && gAve.some((s) => s[0] === 'Se acontecer algo' && /antiaderente/.test(s[1])), 'guia da calopsita: sem "Passeios", com "Gaiola, água e banho de sol" e "Se acontecer algo" falando da panela antiaderente');
  /* em inglês */
  await pb.evaluate(() => setLang('en')); await pb.waitForTimeout(300);
  const mEn = await menuDe(ave);
  await pb.evaluate(() => setLang('pt')); await pb.waitForTimeout(300);
  conferir(tem(mEn, /Yearly avian vet check-up/) && !tem(mEn, /Flea/), 'em inglês, o ＋ da ave mostra "Yearly avian vet check-up" e nada de "Flea" (' + mEn.join(' | ') + ')');

  /* ---------- jabuti cadastrado antes (réptil + "Jabuti" + 🦎) ---------- */
  const jab = await pb.evaluate(async () => (await DB.put('people', { name: 'Casco Teste', role: 'pet', emoji: '🦎', pet: { especie: 'reptil', raca: 'Jabuti' } })).id);
  conferir(await pb.evaluate((id) => Pets.esp(Pets.get(id))[0] === 'quelonio' && Pets.esp({ pet: { especie: 'ave', raca: 'Papagaio' } })[0] === 'papagaio', jab), 'jabuti de antes (réptil + "Jabuti" + 🦎): Pets.esp diz quelonio (e ave + "Papagaio" diz papagaio)');
  const refino = await pb.evaluate(() => [['reptil', 'Caninana (cobra-tigre)'], ['reptil', 'Píton-tigre'], ['reptil', "Tigre-d'água (tartaruga)"], ['reptil', 'Tigre d’água'], ['reptil', 'Red-eared slider'], ['ave', 'Diamante-papagaio'], ['ave', 'Parrot finch'], ['ave', 'Arara-canindé'], ['ave', 'Parrot']].map(([e, r]) => Pets.esp({ pet: { especie: e, raca: r } })[0]).join());
  conferir(refino === 'reptil,reptil,quelonio,quelonio,quelonio,ave,ave,papagaio,papagaio', 'o tipo escolhido fica: cobra "Caninana (cobra-tigre)" e "Píton-tigre" continuam lagarto ou cobra, "Diamante-papagaio" e "Parrot finch" continuam ave; tigre-d\'água, slider, arara e parrot ainda refinam (' + refino + ')');
  await ficha(jab);
  await pb.click('#screen [data-act="pet.edit"]'); await modal(pb, '[name="pet.especie"]');
  const selJ = await pb.evaluate(() => document.querySelector('.modal [name="pet.especie"]').value);
  await salvar(pb, '[name="pet.especie"]');
  const sJ = await pb.evaluate((id) => { const x = DB.get('people', id); return { esp: x.pet.especie, emoji: x.emoji, raca: x.pet.raca }; }, jab);
  conferir(selJ === 'quelonio' && sJ.esp === 'quelonio' && sJ.emoji === '🐢' && sJ.raca === 'Jabuti', 'abrir o ✏️ do jabuti e salvar sem mexer grava quelonio e 🐢, nunca cachorro/🐶 (' + JSON.stringify(sJ) + ')');
  const mj = await menuDe(jab);
  conferir(tem(mj, /Trocar a lâmpada UVB · a cada 180 dias/) && tem(mj, /Banho morno de hidratação/) && !tem(mj, /Antipulgas|Banho e tosa/), '＋ do jabuti: lâmpada UVB a cada 180 dias e banho morno de hidratação; sem antipulgas e banho e tosa (' + mj.join(' | ') + ')');
  await pb.click('#screen [data-act="pet.racao"]'); await modal(pb, '[name="marca"]');
  const camposJ = await pb.evaluate(() => [...document.querySelectorAll('.modal [name]')].map((i) => i.name).join());
  await pb.fill('.modal [name="marca"]', 'Folhas verdes'); await salvar(pb, '[name="marca"]');
  conferir(camposJ === 'marca,compradoEm,validade' && await pb.evaluate((id) => Pets.dados(Pets.get(id)).racao.marca === 'Folhas verdes' && !DB.get('maint', 'racao-' + id) && !DB.raw('maint').some((m) => m.pet === id && m.petTipo === 'racao') && !document.querySelector('#pracao #pck'), jab), 'comida do jabuti: só o que come, a compra e a validade; "Folhas verdes" não cria o aviso racao-<pid> nem a calculadora 🧮 (' + camposJ + ')');
  const cJ = await pb.evaluate(async (id) => { await Pets.paraCompras(id); return { h3: document.querySelector('#pracao h3').textContent, shop: Shop.open().filter((x) => /Folhas verdes/.test(x.name)).map((x) => x.name + ' | ' + x.note) }; }, jab);
  conferir(/🍽️ Comida/.test(cJ.h3) && !/Ração/.test(cJ.h3) && JSON.stringify(cJ.shop) === '["Folhas verdes | Casco Teste"]', 'comida do jabuti: o cartão se chama "🍽️ Comida" e o 🛒 põe "Folhas verdes" (sem "Ração " na frente), com o nome dele (' + JSON.stringify(cJ) + ')');
  await pb.click('#screen [data-act="pet.hist"]'); await modal(pb, '[name="tipo"]');
  const hJ = await pb.evaluate(() => [...document.querySelectorAll('.modal [name="tipo"] option')].map((o) => o.value));
  await cancelar(pb, '[name="tipo"]');
  conferir(!hJ.includes('castracao') && hJ.includes('consulta') && hJ.includes('outro'), 'o histórico do jabuti não oferece "Castração" (' + hJ.join(', ') + ')');

  /* ---------- aquário (peixe) ---------- */
  const aq = await pb.evaluate(async () => (await DB.put('people', { name: 'Aquario Teste', role: 'pet', emoji: '🐟', pet: { especie: 'peixe', raca: '1 betta' } })).id);
  await ficha(aq);
  conferir(await pb.evaluate(() => !document.querySelector('#screen [data-act="pet.peso"]') && !/⚖️ Peso/.test(document.querySelector('#screen').textContent)), 'aquário: sem cartão de peso (peixe não se pesa)');
  const mq = await menuDe(aq);
  conferir(tem(mq, /Troca parcial da água .*· a cada 7 dias/) && tem(mq, /Testar a água/) && tem(mq, /Lavar o filtro/) && !tem(mq, /Vacina|Vermífugo|Antipulgas|Banho e tosa/), '＋ do aquário: troca parcial da água a cada 7 dias, testar a água e lavar o filtro (' + mq.join(' | ') + ')');
  await pb.click('#screen [data-act="pet.edit"]'); await modal(pb, '[name="pet.especie"]');
  const fq = await pb.evaluate(() => ({ esc: ['pet.castrado', 'pet.microchip', 'pet.pedigree', 'pet.registro'].map((k) => { const i = document.querySelector('.modal [name="' + k + '"]'); return !!i && !i.checkVisibility(); }), raca: document.querySelector('.modal [name="pet.raca"]').closest('label').textContent }));
  await cancelar(pb, '[name="pet.especie"]');
  conferir(fq.esc.every(Boolean) && /Quem mora aqui/.test(fq.raca), 'formulário do aquário: castrado, microchip, pedigree e documento não aparecem (mas continuam no formulário: nada salvo se perde); "Quem mora aqui"');

  /* ---------- papagaio: os documentos de ave silvestre ---------- */
  const pp = await pb.evaluate(async () => (await DB.put('people', { name: 'Louro Teste', role: 'pet', emoji: '🦜', pet: { especie: 'papagaio', raca: 'Maritaca' } })).id);
  await ficha(pp);
  await pb.click('#screen [data-act="pet.edit"]'); await modal(pb, '[name="pet.especie"]');
  const docP = await pb.evaluate(() => document.querySelector('.modal [name="pet.registro"]').closest('label').textContent);
  await cancelar(pb, '[name="pet.especie"]');
  conferir(/criadouro autorizado/.test(docP) && /anilha fechada/.test(docP) && /órgão ambiental/.test(docP), 'papagaio: o campo do documento explica a origem legal ("criadouro autorizado", anilha fechada, "órgão ambiental")');

  /* ---------- todos os tipos: largura, nada de remédio nem dose, busca e ícones ---------- */
  await pb.evaluate(async () => {
    const put = (name, emoji, pet) => DB.put('people', { name, role: 'pet', emoji, pet });
    await put('Rex Teste', '🐶', { especie: 'cachorro', raca: 'SRD (vira-lata)' }); await put('Mingau Teste', '🐱', { especie: 'gato' });
    await put('Bolota Teste', '🐹', { especie: 'roedor', raca: 'Hamster sírio' }); await put('Gecko Teste', '🦎', { especie: 'reptil', raca: 'Gecko-leopardo' });
    await put('Furao Teste', '🐾', { especie: 'outro', raca: 'Furão' });
  });
  const todos = await pb.evaluate(() => Pets.list().map((x) => [x.id, Pets.esp(x)[0]]));
  conferir(new Set(todos.map((x) => x[1])).size === 10,'um pet de cada um dos 10 tipos (' + todos.map((x) => x[1]).join(', ') + ')');
  const largos = [], remedios = [];
  /* nome de remédio ou dose não entra em ficha nem em guia (só "nunca use antipulgas ou vermífugo de cão ou gato") */
  const REMEDIO = /ivermectina|fipronil|fluralaner|bravecto|doxiciclina|piretrina|mg\/kg|ml\/kg|\bdoses?\b/i;
  for (const [id, tipo] of todos) {
    await ficha(id);
    const f = await pb.evaluate((id) => ({ txt: document.querySelector('#screen').textContent, guia: Pets.guiaSecoes(Pets.get(id)).map((s) => s[0] + ' ' + s[1]).join(' '), larg: document.documentElement.scrollWidth <= innerWidth + 1 }), id);
    if (!f.larg) largos.push(tipo);
    if (REMEDIO.test(f.txt + ' ' + f.guia)) remedios.push(tipo + ': ' + (f.txt + ' ' + f.guia).match(REMEDIO)[0]);
  }
  conferir(!largos.length, 'nada passa da largura da tela (390 px) na ficha de cada tipo' + (largos.length ? ': ' + largos.join(', ') : ''));
  conferir(!remedios.length, 'nenhum tipo mostra nome de remédio (ivermectina, fipronil…) nem dose na ficha ou no guia' + (remedios.length ? ': ' + remedios.join(' | ') : ''));
  conferir(await pb.evaluate(() => Search.find('tartaruga').some((x) => x.t === 'Casco Teste') && Search.find('passarinho').some((x) => x.t === 'Kiwi Teste')), 'a busca: "tartaruga" acha o jabuti e "passarinho" acha a calopsita');
  conferir(await pb.evaluate(() => ['🐹', '🦎', '🐢'].every((e) => EMOJIS.includes(e))), 'Família: a lista de ícones tem 🐹 🦎 🐢 (o pet não perde o ícone ao ser salvo por lá)');
  const fx = await pb.evaluate(() => [['outro', 'Mini porquinho'], ['roedor', 'Hamster sírio golden'], ['cachorro', 'Golden Retriever'], ['cachorro', 'Cavachon'], ['roedor', 'Porquinho-da-índia']].map(([e, r]) => JSON.stringify(Pets.faixa({ pet: { especie: e, raca: r } }))).join(' '));
  conferir(fx === 'null [0.11,0.14] [25,34] [6,10] [0.815,1]', 'faixa de peso pelo tipo: "Mini porquinho" (outro) sem a do porquinho-da-índia, "Hamster sírio golden" com a do hamster; o cachorro com as mesmas de sempre (' + fx + ')');
  const pap = await pb.evaluate(() => [Pets.PAPEIS({ pet: { especie: 'ave' } }), Pets.PAPEIS({ pet: { especie: 'peixe' } }), Pets.PAPEIS({ pet: { especie: 'cachorro' } }), Pets.PAPEIS({ pet: { especie: 'gato' } })].map((L) => L.map((x) => x[1]).join('')).join(' '));
  conferir(pap === '🩺🧳🛒 🩺🧳🛒 🩺🏨🛁 🩺🏨🛁', 'contatos: nos exóticos quem cuida nas viagens é 🧳 e a loja 🛒; cachorro e gato com 🏨 e 🛁 (' + pap + ')');
  const outroTxt = await pb.evaluate(() => { const f = Pets.list().find((x) => x.name === 'Furao Teste'), c = Pets.list().find((x) => x.name === 'Rex Teste'); return [/Use só o que a veterinária indicar/.test(Pets.view(f.id)), /Use só o que a veterinária indicar/.test(Pets.view(c.id))]; });
  conferir(outroTxt[0] && !outroTxt[1], 'Outro (furão): o cartão de cuidados diz "Use só o que a veterinária indicar"; o cachorro não (' + outroTxt + ')');
  /* guia já montado de uma ave com a vizinha nas viagens; o bicho vira cachorro e o 📘 roda de novo: uma seção de viagem só,
     e o texto pronto da ave (gaiola, panela antiaderente) sai */
  const tr = await pb.evaluate(async () => { const c = await DB.put('contacts', { name: 'Vizinha Teste', cat: 'pet', vis: 'familia', phones: ['(11) 90000-0001'] }); return (await DB.put('people', { name: 'Troca Teste', role: 'pet', emoji: '🐦', pet: { especie: 'ave', raca: 'Calopsita', contatos: { hotel: c.id } } })).id; });
  const guiaDe = async (id) => { await ficha(id); await pb.click('#screen [data-act="pet.guia"]'); await modal(pb, '#gsec'); const g = await pb.evaluate((id) => DB.all('guides').find((x) => x.kind === 'pet' && x.pet === id).sections.map((s) => [s.h, s.body]), id); await cancelar(pb, '#gsec'); return g; };
  const gT1 = await guiaDe(tr);
  await pb.evaluate(async (id) => { const x = JSON.parse(JSON.stringify(DB.get('people', id))); x.pet.especie = 'cachorro'; x.emoji = '🐶'; await DB.put('people', x); }, tr);
  const gT2 = await guiaDe(tr);
  const viag = gT2.filter((s) => /Quem cuida nas viagens|Hotelzinho e banho e tosa/.test(s[0]));
  conferir(gT1.some((s) => /^🧳 Vizinha Teste/.test(s[1])) && viag.length === 1 && /^🏨 Vizinha Teste/.test(viag[0][1]) && !gT2.some((s) => /Gaiola, água e banho de sol/.test(s[0]) || /antiaderente/.test(s[1])) && gT2.some((s) => s[0] === 'Passeios' && !s[1]) && gT2.some((s) => s[0] === 'Se acontecer algo' && !s[1]), 'guia montado de uma ave que virou cachorro: uma seção de viagem só (🧳 → 🏨), sem a "Gaiola, água e banho de sol" e sem a panela antiaderente; "Passeios" e "Se acontecer algo" vazios (' + gT2.map((s) => s[0] + (s[1] ? ' ✎' : '')).join(' | ') + ')');
  conferir(lb.erros.length === 0 && lb.nativos.length === 0, 'nenhum erro de script nem janela nativa' + (lb.erros.length ? ': ' + lb.erros.join(' | ') : ''));
  await pb.context().close();

  await terminar(falhas, browser, '🐾 Pets como aba própria — ficha, fotos leves na nuvem da família, vacinas e cuidados, ração com validade, peso, histórico, contatos e guia, para qualquer bicho, em 390 px.');
})().catch((e) => { console.error(e); process.exit(1); });
