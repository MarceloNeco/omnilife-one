/* Teste automático: as janelas do OmniLifeONE pela janela comum (janela.js 1.0.2) — passada das janelas, 17/Out/2026.
   Em 390 px (celular) e no computador, com dados de mentira (modo visitante):
     - cada janela trava a rolagem e os toques de trás; o cabeçalho fixo não pula; a página volta ao mesmo lugar
     - fecha pelo ✕, pelo botão, por Esc, pelo Voltar do celular e por toque na parte escura; arrastar de dentro para fora não fecha
     - texto digitado pergunta "Descartar?" (Continuar / Descartar); busca e janela sem texto não perguntam
     - uma janela por vez; a confirmação curta pedida de dentro de uma janela abre por cima (alertdialog) e fecha junto
     - gaveta ☰, menu do perfil, SOS, tour e ajuda (que expande dentro da janela) pela janela comum
     - o aviso (toast) aparece por cima da janela aberta; telas de bloqueio só travam a rolagem
     - nenhum alert/confirm/prompt nativo
   Uso: node teste/rodar.js */
const { criarConferir, abrirApp, iniciar, terminar } = require('./_base');

(async () => {
  const browser = await iniciar();
  const { falhas, conferir } = criarConferir();
  let cenarios = 0;

  for (const nome of ['celular', 'computador']) {
    console.log('\n[' + nome + ']');
    const { p, lixo } = await abrirApp(browser, nome);
    const ev = (f, a) => p.evaluate(f, a);
    const quantas = () => ev(() => SolverJanela.quantas());
    const topo = () => ev(() => { const h = document.querySelector('header.app'); return h ? Math.round(h.getBoundingClientRect().top) : null; });
    const esperar = (ms) => p.waitForTimeout(ms || 350);
    /* as ações abrem a janela e só respondem quando ela fecha: não se espera a resposta */
    const abrirTarefa = () => ev(() => { ACT['task.new']({}); });
    /* clique de verdade no meio do botão, sem o Playwright rolar a página para "enxergar" o cabeçalho fixo */
    const clicarEm = async (sel) => { const r = await ev((s) => { const b = document.querySelector(s).getBoundingClientRect(); return { x: b.left + b.width / 2, y: b.top + b.height / 2 }; }, sel); await p.mouse.click(r.x, r.y); };
    const fechaTudo = async () => { await ev(() => closeModals()); await ev(() => { if (Drawer.j) Drawer.close(); }); await esperar(300); };

    /* página alta para ter rolagem de verdade */
    await ev(() => { document.getElementById('screen').style.minHeight = '3000px'; window.scrollTo({ top: 300, behavior: 'instant' }); });
    await esperar(150);
    const y0 = await ev(() => scrollY);
    conferir(y0 === 300 && await topo() === 0, 'página rolada 300 px, cabeçalho fixo em top 0');

    /* ---- 1. uma janela de formulário: trava, saídas ---- */
    await abrirTarefa(); await esperar();
    const d1 = await ev(() => { const d = document.querySelector('dialog.sj[open].mback'); return d ? { modal: d.matches(':modal'), temForm: !!d.querySelector('input') } : null; });
    conferir(d1 && d1.modal && d1.temForm, 'a janela de formulário é um <dialog> modal (classe mback)');
    conferir(await ev(() => getComputedStyle(document.documentElement).overflow) === 'hidden', 'com a janela aberta, a página de trás não rola');
    conferir(await topo() === 0, 'o cabeçalho fixo não pula com a janela aberta (top ' + await topo() + ')');
    await p.mouse.move(nome === 'celular' ? 195 : 40, 40); await p.mouse.wheel(0, 600); await esperar(200);
    conferir(await ev(() => scrollY) === y0, 'a roda do mouse fora da janela não rola a página de trás');
    if (nome === 'celular') {
      const cdp = await p.context().newCDPSession(p);
      await cdp.send('Input.synthesizeScrollGesture', { x: 195, y: 60, yDistance: -400, speed: 800, gestureSourceType: 'touch' }); await esperar(300);
      conferir(await ev(() => scrollY) === y0, 'arrastar o dedo fora da janela não rola a página de trás');
    }
    const coberto = await ev(() => { const b = document.getElementById('searchbtn').getBoundingClientRect(); const e = document.elementFromPoint(b.left + b.width / 2, b.top + b.height / 2); return !!(e && e.closest('dialog.sj')); });
    conferir(coberto, 'o botão de trás (🔍) está coberto pela janela: tocar nele não faz nada além de "cancelar"');
    await p.keyboard.press('Escape'); await esperar();
    conferir(await quantas() === 0 && await ev(() => scrollY) === y0 && await topo() === 0, 'Esc fecha; a página volta ao mesmo lugar e o cabeçalho em top 0');

    await abrirTarefa(); await esperar();
    await p.click('dialog.sj[open] .xbtn'); await esperar();
    conferir(await quantas() === 0, 'o ✕ fecha');
    await abrirTarefa(); await esperar();
    await p.click('dialog.sj[open] .mf [data-x]'); await esperar();
    conferir(await quantas() === 0, 'o botão "Cancelar" fecha');
    const hash0 = await ev(() => location.hash);
    await abrirTarefa(); await esperar();
    await p.goBack(); await esperar(450);
    conferir(await quantas() === 0 && await ev(() => location.hash) === hash0, 'o Voltar do celular fecha só a janela e não muda de tela');
    await abrirTarefa(); await esperar();
    await p.mouse.click(6, 6); await esperar();
    conferir(await quantas() === 0, 'tocar na parte escura fora da janela fecha');
    /* arrastar de dentro para fora não fecha */
    await abrirTarefa(); await esperar();
    const caixa = await ev(() => { const r = document.querySelector('dialog.sj[open] .modal').getBoundingClientRect(); return { x: r.left + 30, y: r.top + 20 }; });
    await p.mouse.move(caixa.x, caixa.y); await p.mouse.down(); await p.mouse.move(4, 4, { steps: 4 }); await p.mouse.up(); await esperar();
    conferir(await quantas() === 1, 'arrastar de dentro da caixa e soltar fora NÃO fecha');
    await p.keyboard.press('Escape'); await esperar();

    /* ---- 2. "Descartar?" com texto; busca sem texto não pergunta ---- */
    await abrirTarefa(); await esperar();
    await p.fill('dialog.sj[open] input[name=title], dialog.sj[open] input[type=text]', 'texto de mentira'); await esperar(150);
    await p.keyboard.press('Escape'); await esperar();
    conferir(await ev(() => !!document.querySelector('.sj-pergunta[open]')) && await quantas() === 2, 'com texto digitado, Esc pergunta "Descartar?" (por cima, sem fechar a janela)');
    await p.click('[data-sj=continuar]'); await esperar();
    conferir(await quantas() === 1 && await ev(() => document.querySelector('dialog.sj[open].mback input[type=text]').value) === 'texto de mentira', '"Continuar" mantém a janela com o texto');
    await p.mouse.click(6, 6); await esperar();
    conferir(await ev(() => !!document.querySelector('.sj-pergunta[open]')), 'tocar fora com texto também pergunta');
    await p.click('[data-sj=descartar]'); await esperar(450);
    conferir(await quantas() === 0, '"Descartar" fecha as duas');
    await abrirTarefa(); await esperar();
    await p.fill('dialog.sj[open] input[type=text]', 'outro texto'); await p.goBack(); await esperar(450);
    conferir(await ev(() => !!document.querySelector('.sj-pergunta[open]')), 'o Voltar com texto digitado também pergunta');
    await p.click('[data-sj=descartar]'); await esperar(450);
    conferir(await quantas() === 0 && await ev(() => location.hash) === hash0, 'descartou: tudo fechado e a tela é a mesma');

    await ev(() => { ACT['search.open']({}); }); await esperar();
    await p.fill('dialog.sj[open] input', 'leite'); await esperar(200);
    await p.keyboard.press('Escape'); await esperar();
    conferir(await quantas() === 0 && await ev(() => !document.querySelector('.sj-pergunta')), 'busca com texto digitado fecha direto (sem "Descartar?")');

    /* ---- 3. uma janela por vez; confirmação por cima ---- */
    await ev(() => { window.__a = modal({ title: 'A', body: '<p>primeira</p>' }); window.__b = modal({ title: 'B', body: '<p>segunda</p>' }); }); await esperar();
    conferir(await quantas() === 1 && await ev(() => SolverJanela.esperando()) === 1 && await ev(() => document.querySelector('dialog.sj[open] h3').textContent) === 'A', 'duas janelas pedidas: só a primeira aparece, a segunda espera a vez');
    await ev(() => __a.close()); await esperar(500);
    conferir(await quantas() === 1 && await ev(() => document.querySelector('dialog.sj[open] h3').textContent) === 'B', 'a segunda aparece quando a primeira fecha');
    await ev(() => __b.close()); await esperar();

    await abrirTarefa(); await esperar();
    await p.fill('dialog.sj[open] input[type=text]', 'não pode sumir'); await esperar(100);
    await ev(() => { window.__r = 'esperando'; confirmBox('Excluir isto?', 'Excluir', true).then(v => { window.__r = v; }); }); await esperar();
    const conf = await ev(() => ({ n: SolverJanela.quantas(), role: SolverJanela.aberta().el.getAttribute('role') }));
    conferir(conf.n === 2 && conf.role === 'alertdialog', 'a confirmação curta pedida de dentro da janela abre POR CIMA (alertdialog)');
    await p.keyboard.press('Escape'); await esperar();
    conferir(await quantas() === 1 && await ev(() => window.__r) === false && await ev(() => document.querySelector('dialog.sj[open].mback input[type=text]').value) === 'não pode sumir' && await ev(() => !document.querySelector('.sj-pergunta')),
      'Esc na confirmação fecha só ela (sem "Descartar?") e o formulário guarda o texto');
    await ev(() => { window.__r = 'esperando'; confirmBox('Excluir isto?', 'Excluir', true).then(v => { window.__r = v; }); }); await esperar();
    await p.goBack(); await esperar(450);
    conferir(await quantas() === 1 && await ev(() => window.__r) === false, 'o Voltar na confirmação fecha só ela');
    await ev(() => { window.__r = 'esperando'; confirmBox('Excluir isto?', 'Excluir', true).then(v => { window.__r = v; }); }); await esperar();
    await ev(() => MODAIS[0].j.fechar('fechar')); await esperar(450);
    conferir(await quantas() === 0 && await ev(() => window.__r) === false, 'fechar a janela de baixo fecha a confirmação junto');
    await ev(() => { window.__r = 'esperando'; confirmBox('Tem certeza?', 'Sim').then(v => { window.__r = v; }); }); await esperar();
    await p.click('dialog.sj[open] [data-yes]'); await esperar();
    conferir(await ev(() => window.__r) === true && await quantas() === 0, 'confirmação fora de janela abre normal e "Sim" responde true');

    /* ---- 4. ajuda de dentro de uma janela expande dentro dela ---- */
    await ev(() => { ACT['ah.rnew']({}); }); await esperar();
    const antes = await quantas();
    await p.click('dialog.sj[open] [data-help]'); await esperar();
    conferir(antes === 1 && await quantas() === 1 && await ev(() => !!document.querySelector('dialog.sj[open] .mb > .helpin[open] .helpsteps')), 'a ajuda aberta de dentro da janela expande dentro dela (nada empilha)');
    await p.keyboard.press('Escape'); await esperar();
    if (await quantas()) { await p.click('[data-sj=descartar]').catch(() => {}); await esperar(400); }
    conferir(await quantas() === 0, 'fecha');
    await ev(() => { Help.open('inbox'); }); await esperar();
    conferir(await quantas() === 1 && await ev(() => !!document.querySelector('dialog.sj[open] .helpsteps')), 'a ajuda aberta fora de janela abre a sua janela');
    await p.keyboard.press('Escape'); await esperar();

    /* ---- 5. gaveta ☰ ---- */
    await clicarEm('#hambbtn'); await esperar();
    conferir(await ev(() => !!document.querySelector('dialog.drawerjan[open] #drawer .ditem')) && await ev(() => document.getElementById('hambbtn').getAttribute('aria-expanded')) === 'true', 'a gaveta ☰ é uma janela da janela comum');
    conferir(await ev(() => getComputedStyle(document.documentElement).overflow) === 'hidden' && await topo() === 0, 'com a gaveta aberta a página de trás não rola e o cabeçalho não pula');
    await p.keyboard.press('Escape'); await esperar();
    conferir(await quantas() === 0 && await ev(() => document.activeElement.id) === 'hambbtn' && await ev(() => document.getElementById('hambbtn').getAttribute('aria-expanded')) === 'false', 'Esc fecha a gaveta e o foco volta ao ☰');
    await clicarEm('#hambbtn'); await esperar(); await p.goBack(); await esperar(450);
    conferir(await quantas() === 0 && await ev(() => location.hash) === hash0, 'o Voltar fecha a gaveta sem mudar de tela');
    await clicarEm('#hambbtn'); await esperar(); await p.mouse.click(nome === 'celular' ? 380 : 1200, 400); await esperar();
    conferir(await quantas() === 0, 'tocar na parte escura fora da gaveta fecha');
    await clicarEm('#hambbtn'); await esperar(); await p.click('dialog.drawerjan[open] .dquick button, dialog.drawerjan[open] .ditem:not(.active)'); await esperar(600);
    conferir(await quantas() === 0 || await ev(() => !document.querySelector('dialog.drawerjan[open]')), 'escolher um destino fecha a gaveta');
    await fechaTudo();
    await ev(() => { go('shop'); }); await esperar(600);
    await clicarEm('#hambbtn'); await esperar();
    await p.click('dialog.drawerjan[open] [data-dtab="agenda"].ditem'); await esperar(700);
    conferir(await quantas() === 0 && await ev(() => location.hash.indexOf('#/agenda') === 0), 'escolher "Calendário" na gaveta fecha e troca de tela (depois do Voltar da gaveta)');
    await ev(() => { go('home'); }); await esperar(600);

    /* ---- 6. menu do perfil ---- */
    await clicarEm('#whoami'); await esperar();
    conferir(await ev(() => !!document.querySelector('dialog.menujan[open] .menu.whomenu')) && await ev(() => getComputedStyle(document.documentElement).overflow) === 'hidden', 'o menu do perfil é uma janela da janela comum');
    const pos = await ev(() => { const r = document.querySelector('dialog.menujan[open] .menu').getBoundingClientRect(); return r.right <= innerWidth && r.bottom <= innerHeight && r.left >= 0; });
    conferir(pos, 'o menu fica dentro da tela, junto do botão');
    await p.mouse.click(6, 500); await esperar();
    conferir(await quantas() === 0, 'tocar fora do menu fecha');
    await clicarEm('#whoami'); await esperar(); await p.keyboard.press('Escape'); await esperar();
    conferir(await quantas() === 0 && await ev(() => document.activeElement.id) === 'whoami', 'Esc fecha o menu e o foco volta ao botão do perfil');
    await clicarEm('#whoami'); await esperar(); await p.goBack(); await esperar(450);
    conferir(await quantas() === 0, 'o Voltar fecha o menu');
    await clicarEm('#whoami'); await esperar(); await p.click('dialog.menujan[open] [data-i="0"]'); await esperar(700);
    conferir(await quantas() === 0 && await ev(() => location.hash.indexOf('#/settings') === 0), 'escolher "Configurações" no menu fecha o menu e troca de tela');
    await ev(() => { go('home'); }); await esperar(600);

    /* ---- 7. SOS ---- */
    await ev(() => { Health.sos(); }); await esperar();
    conferir(await ev(() => !!document.querySelector('dialog.sj[open].sos .shead')) && await ev(() => getComputedStyle(document.documentElement).overflow) === 'hidden', 'o SOS é uma janela da janela comum (tela cheia, página de trás travada)');
    await p.click('dialog.sos #sclose'); await esperar();
    conferir(await quantas() === 0, 'o ✕ do SOS fecha');
    await ev(() => { Health.sos(); }); await esperar(); await p.keyboard.press('Escape'); await esperar();
    conferir(await quantas() === 0, 'Esc fecha o SOS');
    await ev(() => { Health.sos(); }); await esperar(); await p.goBack(); await esperar(450);
    conferir(await quantas() === 0 && await ev(() => location.hash) === hash0, 'o Voltar fecha o SOS sem mudar de tela');

    /* ---- 8. tour ---- */
    await ev(() => { AOne.tour(); }); await esperar(700);
    conferir(await ev(() => !!document.querySelector('dialog.aone-tourjan[open] .aone-spot') && !!document.querySelector('dialog.aone-tourjan[open] .aone-tbub')), 'o tour é uma janela da janela comum, com o destaque e o balão');
    await p.click('dialog.aone-tourjan [data-t=next]'); await esperar();
    conferir(await quantas() === 1 && await ev(() => document.querySelector('.aone-tbub .tiny').textContent.startsWith('2 /')), 'o passo seguinte troca o conteúdo da mesma janela (nada empilha)');
    await p.keyboard.press('Escape'); await esperar();
    conferir(await quantas() === 0 && await ev(() => AOne._tour) === false, 'Esc encerra o tour');
    await ev(() => { AOne.tour(); }); await esperar(700); await p.click('dialog.aone-tourjan [data-t=end]'); await esperar();
    conferir(await quantas() === 0, '"Sair" encerra o tour');

    /* ---- 9. aviso por cima da janela; tela de bloqueio ---- */
    await abrirTarefa(); await esperar();
    await ev(() => toast('aviso de teste', 5000)); await esperar(150);
    /* o que está fora da janela fica inerte (não "enxerga" toque), então a conferência é pela imagem: se o aviso estiver
       por cima, o retângulo dele muda quando ele some; se estivesse atrás da janela, ficaria igual */
    const area = await ev(() => { const t = document.querySelector('#toasts .toast').getBoundingClientRect(); return { x: Math.round(t.left + 4), y: Math.round(t.top + 4), width: Math.round(t.width - 8), height: Math.round(t.height - 8) }; });
    const comAviso = await p.screenshot({ clip: area });
    await ev(() => { document.querySelector('#toasts .toast').style.visibility = 'hidden'; }); await esperar(100);
    const semAviso = await p.screenshot({ clip: area });
    conferir(await ev(() => document.getElementById('toasts').matches(':popover-open')) && Buffer.compare(comAviso, semAviso) !== 0, 'o aviso (toast) aparece por cima da janela aberta');
    await p.keyboard.press('Escape'); await esperar();
    await ev(() => { const l = document.createElement('div'); l.className = 'lock'; l.id = 'lock-teste'; document.body.appendChild(l); });
    conferir(await ev(() => getComputedStyle(document.documentElement).overflow) === 'hidden', 'tela de bloqueio (digital, alarme): trava a rolagem da página');
    await ev(() => document.getElementById('lock-teste').remove());

    /* ---- 10. nada nativo, sem erros ---- */
    conferir(lixo.nativos.length === 0, 'nenhum alert/confirm/prompt nativo apareceu (' + lixo.nativos.length + ')');
    conferir(lixo.erros.length === 0, 'nenhum erro de script' + (lixo.erros.length ? ': ' + lixo.erros.join(' | ') : ''));
    cenarios++;
    await p.context().close();
  }
  /* ---- anúncio: a contagem 3, 2, 1 é a única exceção escrita; passada a contagem, todas as saídas valem ---- */
  for (const nome of ['celular', 'computador']) {
    console.log('\n[anúncio, ' + nome + ']');
    const { p } = await abrirApp(browser, nome, { anuncio: true });
    await p.waitForSelector('dialog.sj[open] .modal.adpop', { timeout: 9000 }).catch(() => {});
    const a0 = await p.evaluate(() => { const d = document.querySelector('dialog.sj[open] .modal.adpop'); const x = d && d.closest('dialog').querySelector('.xbtn'); return d ? { disabled: x.disabled, txt: x.textContent } : null; });
    conferir(a0 && a0.disabled && /^[123]$/.test(a0.txt), 'o anúncio abre com a contagem no ✕ (' + (a0 && a0.txt) + ')');
    await p.keyboard.press('Escape'); await p.mouse.click(6, 6); await p.goBack().catch(() => {}); await p.waitForTimeout(250);
    conferir(await p.evaluate(() => !!document.querySelector('dialog.sj[open] .modal.adpop')), 'durante a contagem nada fecha (Esc, toque fora e Voltar)');
    await p.waitForFunction(() => { const x = document.querySelector('dialog.sj[open] .modal.adpop .xbtn'); return x && !x.disabled; }, null, { timeout: 6000 }).catch(() => {});
    conferir(await p.evaluate(() => { const x = document.querySelector('dialog.sj[open] .modal.adpop .xbtn'); return !!x && !x.disabled && x.textContent === '×'; }), 'passada a contagem o ✕ volta a valer');
    await p.keyboard.press('Escape'); await p.waitForTimeout(400);
    conferir(await p.evaluate(() => SolverJanela.quantas()) === 0, 'depois da contagem o Esc fecha o anúncio');
    await p.context().close();
  }
  await terminar(falhas, browser, 'janelas do OmniLifeONE pela janela comum em ' + cenarios + ' tamanhos de tela.');
})().catch(e => { console.error('Erro no teste:', e.message); process.exit(1); });
