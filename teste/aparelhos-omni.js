/* Aparelhos da conta (2.26.0, Parte A): aprovar um aparelho novo pelo outro aparelho, OmniLifeONE ↔ OmniLifeONE, no
   "Supabase de mentira" (teste/mock-sol.js): cada aparelho é um contexto do navegador e todos falam com o mesmo banco,
   que mora neste processo. Nada vai para a internet nem para o Supabase de verdade.
   Por enquanto (etapa 2 da construção) só a fumaça, duas rodadas seguidas (cada uma um aparelho novo):
     - Ana entra pela janela da conta (e-mail e senha) no banco de mentira; o registro de acesso "login" chega
     - a família abre (Família Teste, Ana chefe, 4 pessoas); o app cria a pessoa dela e registra o aparelho na família
     - Casa → Senhas da casa: a Jornada lê o estado de verdade ("primeira vez" neste aparelho) e a tela ainda é a de hoje
       (2.25): passo a passo e "Pegue o papel com o código de recuperação" + "Usar neste …"
     - nenhuma requisição sai do site local e do banco de mentira; nenhum erro de script nem diálogo nativo
   E o banco de mentira faz o que o SQL faz (as próximas etapas dependem dele): pedidos de membro de qualquer papel, os
   ataques "troca", "troca-sem-compromisso" e "troca-depois", o dono recusa o próprio pedido, PIN da conta, passkey,
   404 das tabelas novas por REST e o DELETE da omni_chave_privada (403 42501 com M.semDelete).
   Pessoas, senhas e chaves de mentira. Uso: node teste/rodar.js   ·   sozinho: BASE=http://localhost:8099 node teste/aparelhos-omni.js */
const { BASE, criarConferir, iniciar, terminar } = require('./_base');
const { M, db, rpcs, prepararChaves, compromisso, cf, PESSOAS, ANA, BIA, CRIS, DAVI, GID } = require('./mock-sol');
const { aparelho, entrarOmni, senhasDaCasa } = require('./_nuvem');

/* espera uma condição do lado do banco (Node) */
async function ate(fn, ms) { const fim = Date.now() + (ms || 8000); while (Date.now() < fim) { if (fn()) return true; await new Promise((r) => setTimeout(r, 100)); } return !!fn(); }

(async () => {
  const browser = await iniciar();
  const { falhas, conferir } = criarConferir();
  await prepararChaves();

  for (const rodada of [1, 2]) {
    console.log('Fumaça, rodada ' + rodada + ': a Ana entra no OmniLifeONE (aparelho novo) pelo banco de mentira');
    const n0 = M.log.length, a0 = M.acessos.length;
    const { ctx, p, lixo } = await aparelho(browser, { nome: 'Ana ' + rodada, vp: 'computador', base: BASE });
    await entrarOmni(p, ANA);
    const log = () => M.log.slice(n0);
    const sessao = await p.evaluate(() => { const s = JSON.parse(localStorage.getItem('solverone.sessao.v1') || 'null'); return { email: s && s.email, uid: Conta.uid() }; });
    conferir(log().some((x) => x.metodo === 'POST' && x.caminho === '/auth/v1/token?grant_type=password') && sessao.email === 'ana@teste.com' && sessao.uid === ANA,
      rodada + ': entrou pela janela da conta (e-mail e senha), no banco de mentira');
    conferir(await ate(() => M.acessos.slice(a0).some((x) => x.uid === ANA && x.evento === 'login' && x.app === 'omnilife-one')), rodada + ': o registro de acesso "login" chegou');
    const fam = await p.evaluate((bia) => ({ id: S.family.id, nome: S.family.name, papel: S.role, n: Object.keys(S.family.members).length, bia: (S.family.members[bia] || {}).role, gate: S.gate }), BIA);
    conferir(fam.id === GID && fam.nome === 'Família Teste' && fam.papel === 'admin' && fam.n === 4 && fam.bia === 'responsavel' && !fam.gate,
      rodada + ': a família abre (Família Teste, Ana chefe, 4 pessoas, Bia responsável)');
    conferir(await ate(() => db.omni_docs.some((d) => d.colecao === 'people' && d.id === 'p-ana' && d.criado_por === ANA) && db.omni_aparelhos.filter((a) => a.user_id === ANA && a.grupo_id === GID).length === rodada),
      rodada + ': o app criou a pessoa da Ana (uma vez só) e registrou este aparelho na família (omni_aparelhos)');

    const sc = await senhasDaCasa(p);
    conferir(sc.guia === true, rodada + ': Casa → Senhas da casa: o passo a passo abre sozinho na primeira vez neste aparelho');
    conferir(sc.status.fase === 'novo' && sc.status.caso === 'primeiraVez' && sc.status.rede && sc.status.temPub && sc.status.temKit && !sc.status.tem && sc.status.familiaPode && sc.status.jaTem === true,
      rodada + ': a Jornada lê o estado de verdade: sem cadeado neste aparelho, "primeira vez" (a conta já tem as chaves e a cópia pelo código; sem PIN da conta; a Bia pode aprovar)');
    conferir(/Pegue o papel com o código de recuperação/.test(sc.texto) && await p.evaluate(() => /Usar neste/.test((document.querySelector('[data-act="cofre.comecar"]') || {}).textContent || '')),
      rodada + ': a tela pede o papel com o código e oferece "🔑 Usar neste …" (como na 2.25)');
    conferir(!(await p.$('.modal')), rodada + ': nenhuma janela ficou aberta');
    if (rodada === 1) {
      /* as chaves de mentira estão no formato de hoje: o código do papel abre a chave pessoal e ela abre a CF da família */
      const k = await p.evaluate(async (codigo) => {
        const pv = await Cofre.privadaPeloCodigo(codigo), r = pv && await Cofre.buscarMinha(await Cofre.importarSk(pv.pkcs8));
        return { kid: pv && pv.kid === (await Cofre.minhasNoBanco()).pub.kid, errado: await Cofre.privadaPeloCodigo('AAAAA-BBBBB-CCCCC-DDDDD'), kv: r && r.kv, fk: r && r.fk, cf: r && b64FromBuf(r.raw) };
      }, PESSOAS[ANA].codigo);
      conferir(k.kid && k.errado === null && k.kv === 1 && k.fk === 'fk-teste' && k.cf === Buffer.from(cf()).toString('base64'),
        '1: as chaves de mentira abrem como hoje: o código do papel abre a chave da Ana, que abre a CF da família (código errado não abre)');
    }

    const sb = lixo.fora.filter((u) => /supabase/i.test(u)), hosts = [...new Set(lixo.fora.map((u) => { try { return new URL(u).host; } catch (e) { return u.slice(0, 40); } }))];
    conferir(log().length > 10 && !sb.length, rodada + ': nada saiu: o Supabase só pelo banco de mentira (' + log().length + ' chamadas); o resto foi cortado' + (hosts.length ? ' (' + hosts.join(', ') + ')' : ''));
    conferir(!lixo.erros.length, rodada + ': nenhum erro de script' + (lixo.erros.length ? ': ' + lixo.erros.join(' | ') : ''));
    conferir(!lixo.nativos.length, rodada + ': nenhum alert/confirm/prompt do navegador' + (lixo.nativos.length ? ': ' + lixo.nativos.join(' | ') : ''));
    await ctx.close();
  }
  conferir(db.omni_docs.filter((d) => d.colecao === 'people' && d.id === 'p-ana').length === 1 && !db.sol_aparelhos.length && !db.sol_acesso_pedidos.length && !db.sol_pin_conta.length,
    'depois das duas rodadas: uma pessoa só para a Ana; nada nas tabelas novas (abrir a tela das Senhas da casa só lê)');
  conferir([ANA, BIA].every((u) => db.sol_chave_publica.some((k) => k.user_id === u) && db.omni_chave_privada.some((k) => k.user_id === u)) &&
    ![CRIS, DAVI].some((u) => db.sol_chave_publica.some((k) => k.user_id === u) || db.omni_chave_privada.some((k) => k.user_id === u) || db.sol_grupo_chaves.some((k) => k.user_id === u)),
    'as chaves de mentira: Ana e Bia têm (pública, cópia pelo código e a CF embrulhada); a Cris (responsável) ainda não; o Davi (membro) nunca');

  /* o banco de mentira faz o que o SQL faz (as próximas etapas dependem disso). O Davi (membro) faz as chamadas pelo
     próprio app (Conta.rpc/Conta.rest e as contas do SolProto); no fim o banco volta a como estava. */
  console.log('O banco de mentira: pedidos, ataques, passkey, PIN e as tabelas por REST');
  const antes = JSON.parse(JSON.stringify(db));
  const dv = await aparelho(browser, { nome: 'Davi', vp: 'celular', base: BASE }), d = dv.p;
  await entrarOmni(d, DAVI);
  const pedir = (grupo) => d.evaluate(async (grupo) => {
    const par = await SolProto.novoPar(), nB = SolProto.b64u(SolProto.rnd(32));
    const id = await Conta.rpc('sol_pedido_criar', { p_nome: 'Linux · Chrome', p_app: 'omnilife', p_pub: par.pub, p_compromisso: await SolProto.compromisso(par.pub, nB), p_grupo: grupo ? S.family.id : null });
    (window.__B = window.__B || {})[id] = { par, nB }; return id;
  }, grupo);
  const pf = await pedir(true), pp = db.sol_acesso_pedidos.find((x) => x.id === pf);
  const errado = await d.evaluate(() => Conta.rpc('sol_pedido_criar', { p_nome: 'x', p_app: 'omnilife', p_pub: {}, p_compromisso: 'x', p_grupo: '33333333-3333-3333-3333-333333333333' }).then(() => '', (e) => e.message));
  conferir(pp && pp.user_id === DAVI && pp.grupo_id === GID && errado === 'família errada', 'banco: um membro (de qualquer papel) pede "para a família"; outra família = "família errada"');
  const vista = (uid) => rpcs.sol_pedidos_para_mim(uid).find((x) => x.id === pf);
  conferir(vista(ANA).tipo === 'familia' && vista(DAVI).tipo === 'pessoal' && vista(CRIS).tipo === 'familia' && vista(ANA).quem_nome === 'Davi Teste', 'banco: o pedido aparece para quem pode aprovar (chefe/responsável: "familia"; o dono: "pessoal")');
  M.ataque = 'troca'; const t1 = vista(ANA); M.ataque = 'troca-sem-compromisso'; const t2 = vista(ANA); M.ataque = null;
  conferir(t1.pub.x === M.ATACANTE.pub.x && t1.compromisso === compromisso(M.ATACANTE.pub, M.ATACANTE.n) && t2.pub.x === M.ATACANTE.pub.x && t2.compromisso === pp.compromisso,
    'banco: M.ataque "troca" troca a pública e forja o compromisso; "troca-sem-compromisso" só troca a pública');
  conferir(await d.evaluate((id) => Conta.rpc('sol_pedido_recusar', { p_id: id }), pf) === true && pp.estado === 'recusado' && pp.respondido_por === DAVI, 'banco: o dono do pedido recusa o próprio pedido (o "Cancelar")');
  /* um pedido pessoal inteiro, com o banco trocando a pub_a/n_a e a resposta depois de aprovado ("troca-depois", K1) */
  const pq = await pedir(false);
  const k1 = await d.evaluate(async (id) => {
    const B = window.__B[id], A = await SolProto.novoPar(), nA = SolProto.b64u(SolProto.rnd(32)), uid = Conta.uid();
    const ok1 = await Conta.rpc('sol_pedido_desafio', { p_id: id, p_pub_a: A.pub, p_n_a: nA }), ok2 = await Conta.rpc('sol_pedido_revelar', { p_id: id, p_n_b: B.nB });
    const resp = await SolProto.fechar(await SolProto.chave(A.priv, B.par.pub, id, uid, nA, B.nB), id, SolProto.cargaPessoal(SolProto.utf8('pkcs8-de-mentira')));
    const ok3 = await Conta.rpc('sol_pedido_aprovar', { p_id: id, p_resposta: resp, p_meu_ap: null });
    window.__fixo = { pubA: A.pub, nA }; return ok1 && ok2 && ok3;
  }, pq);
  M.ataque = 'troca-depois';
  const k1b = await d.evaluate(async (id) => {
    const B = window.__B[id], f = window.__fixo, uid = Conta.uid(), r = (await Conta.rpc('sol_pedido_buscar', { p_id: id }))[0];
    const abre = async (pubA, nA) => { try { return SolProto.lerCarga(await SolProto.abrirResp(await SolProto.chave(B.par.priv, pubA, id, uid, nA, B.nB), id, r.resposta), r.tipo); } catch (e) { return null; } };
    const fixo = await abre(f.pubA, f.nA), doBanco = await abre(r.pub_a, r.n_a);
    return { estado: r.estado, trocou: r.pub_a.x !== f.pubA.x && r.n_a !== f.nA, fixo: !!fixo, doBanco: doBanco && doBanco.tipo, outra: doBanco && SolProto.deUtf8(doBanco.sk) !== 'pkcs8-de-mentira', ap: r.aparelho };
  }, pq);
  M.ataque = null;
  const pqb = db.sol_acesso_pedidos.find((x) => x.id === pq), apq = db.sol_aparelhos.find((a) => a.id === k1b.ap);
  conferir(k1 && k1b.estado === 'aprovado' && k1b.trocou && !k1b.fixo && k1b.doBanco === 'pessoal' && k1b.outra,
    'banco: "troca-depois" devolve outra pub_a/n_a e uma resposta do atacante (abre com a do banco, não com a fixada nos 6 números)');
  conferir(pqb.estado === 'usado' && pqb.resposta === null && apq && apq.como === 'aparelho' && apq.user_id === DAVI && apq.aprovado_por === DAVI, 'banco: lida a resposta, o pedido vira "usado" sem resposta e o aparelho entra na lista ("aparelho")');
  const reg = await d.evaluate(async () => [await Conta.rpc('sol_aparelho_registrar', { p_nome: 'Linux · Chrome', p_app: 'omnilife', p_como: 'primeiro' }).then(() => 'registrou', (e) => e.message),
    await Conta.rpc('sol_aparelho_registrar', { p_nome: 'Linux · Chrome', p_app: 'omnilife', p_como: 'kit' })]);
  conferir(/já tem aparelho|precisa ser aprovado/.test(reg[0]) && db.sol_aparelhos.some((a) => a.id === reg[1] && a.como === 'kit'), 'banco: "primeiro" só na conta sem aparelho; "kit" entra');
  const pin = await d.evaluate(async (ap) => {
    const sal = SolProto.novoSalConta(), v = await SolProto.verificador('736251', sal), info0 = (await Conta.rpc('sol_pin_info'))[0];
    const def = await Conta.rpc('sol_pin_definir', { p_v_novo: v, p_sal_novo: sal, p_v_atual: null, p_ap: ap });
    const errado = await Conta.rpc('sol_pin_conferir', { p_v: await SolProto.verificador('000000', sal), p_ap: ap }), certo = await Conta.rpc('sol_pin_conferir', { p_v: v, p_ap: ap });
    return { tem0: info0.tem, def: def.ok && def.versao === 1 && /^[A-Za-z0-9_-]{43}$/.test(def.segredo), errado: errado.erro === 'pin' && errado.restam === 9, certo: certo.ok && certo.segredo === def.segredo };
  }, reg[1]);
  conferir(!pin.tem0 && pin.def && pin.errado && pin.certo && db.sol_pin_conta.some((x) => x.user_id === DAVI && !JSON.stringify(x).includes('736251')), 'banco: PIN da conta — definir (versão 1 e o segredo do aparelho), errado conta, certo devolve o mesmo segredo; o PIN não chega ao banco');
  const pk = await d.evaluate(async () => {
    const cred = SolProto.b64u(SolProto.rnd(24)), sal = SolProto.b64u(SolProto.rnd(32));
    const g = await Conta.rpc('sol_passkey_guardar', { p_cred: cred, p_sal: sal, p_fechada: { iv: 'aXYtZGUtbWVudGlyYQ==', ct: 'Y3QtZGUtbWVudGlyYQ==' } });
    const n1 = (await Conta.rpc('sol_passkeys_minhas')).length, t = await Conta.rpc('sol_passkey_tirar', { p_cred: cred }), n2 = (await Conta.rpc('sol_passkeys_minhas')).length;
    return g === true && n1 === 1 && t === true && n2 === 0;
  });
  conferir(pk && db.sol_passkeys.some((k) => k.user_id === DAVI && k.removido_em), 'banco: a passkey é guardada de verdade (sol_passkeys_minhas) e sai com sol_passkey_tirar');
  const rest = await d.evaluate(async () => {
    const st = (pr) => pr.then(() => 'ok', (e) => (e.status || '') + ' ' + (e.code || ''));
    const tabs = await Promise.all(['sol_aparelhos', 'sol_acesso_pedidos', 'sol_passkeys', 'sol_pin_conta', 'sol_aparelho_pin'].map((t) => st(Conta.rest('GET', t + '?select=*'))));
    const uid = Conta.uid(), q = 'omni_chave_privada?user_id=eq.' + uid;
    const criou = await st(Conta.rest('POST', 'omni_chave_privada?on_conflict=user_id', { user_id: uid, privada_cifrado: '{"v":1,"kid":"de-mentira"}', sal: 'c2FsLWRlLW1lbnRpcmE=', iteracoes: 600000 }, 'resolution=merge-duplicates,return=minimal'));
    return { tabs, criou, q };
  });
  M.semDelete = true; const apagar1 = await d.evaluate((q) => Conta.rest('DELETE', q).then(() => 'ok', (e) => e.status + ' ' + e.code), rest.q); const ficou = db.omni_chave_privada.some((r) => r.user_id === DAVI);
  M.semDelete = false; const apagar2 = await d.evaluate((q) => Conta.rest('DELETE', q).then(() => 'ok', (e) => e.status + ' ' + e.code), rest.q);
  conferir(rest.tabs.every((x) => x === '404 PGRST205'), 'banco: sol_aparelhos, sol_acesso_pedidos, sol_passkeys, sol_pin_conta e sol_aparelho_pin dão 404 por REST (só pelas funções)');
  conferir(rest.criou === 'ok' && apagar1 === '403 42501' && ficou && apagar2 === 'ok' && !db.omni_chave_privada.some((r) => r.user_id === DAVI) && db.omni_chave_privada.some((r) => r.user_id === ANA) && db.omni_chave_privada.some((r) => r.user_id === BIA),
    'banco: omni_chave_privada — com M.semDelete (o GRANT de hoje) apagar dá 403 42501 e nada muda; sem ele, apaga só a linha da própria pessoa');
  conferir(!dv.lixo.erros.length && !dv.lixo.nativos.length && !dv.lixo.fora.some((u) => /supabase/i.test(u)), 'banco: sem erro de script, sem diálogo nativo e nada fora do banco de mentira');
  await dv.ctx.close();
  for (const t of Object.keys(db)) db[t].splice(0, db[t].length, ...antes[t]);

  await terminar(falhas, browser, 'fumaça do banco de mentira — a Ana entra pela conta, a família abre e as Senhas da casa mostram o estado de hoje, duas vezes, sem nada sair para a internet.');
})().catch((e) => { console.error('Erro no teste:', e.message); process.exit(1); });
