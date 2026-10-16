/* =====================================================================
   diretrizes-config.js — OmniLifeONE
   O único arquivo do módulo comum (diretrizes.js) que muda de app para app.
   O OmniLifeONE já tem login (conta SolverONE), menu ☰, idioma, anúncios, AssistONE,
   OCR, IA, avisos e Configurações próprios: aqui tudo isso fica DESLIGADO no módulo.
   Do módulo, o app usa só:
     - DGO.feedback  — 💬 "Dar uma opinião / avisar um problema" (☰, ⚙ → Geral e cartão de erro da tela)
     - DGO.fundo     — trabalho demorado (IA e leitura de foto): pílula, tela acesa, aviso antes de fechar
     - DGO.compat    — dados do aparelho que vão junto do feedback (o quadro do aparelho continua o do app)
     - DGO.recursos  — interruptores do RootifyONE e a tela de manutenção (o recursos.js repassa para ele)
   ===================================================================== */
DGO.iniciar({
  app: 'omnilife-one',                      /* gaveta de dados: nunca mude */
  nome: { pt: 'OmniLifeONE', en: 'OmniLifeONE' },
  versaoApp: '2.17.0',
  cor: '#8a6ff2',
  corFundoBarra: '#0e1016',

  /* idioma: quem manda é o app (⚙ → Geral); o index.html avisa o módulo ao abrir e ao trocar */
  idiomaPadrao: 'pt',
  idiomaCompartilhado: false,
  seletorIdiomaVisivel: false,
  /* o módulo não reescreve nada das telas do app (o app já nasce em PT e EN e formata as datas) */
  datasAutomaticas: false,
  varreduraAutomatica: false,
  responsivo: false,
  empurrarConteudo: false,
  ignorar: ['body > *'],

  /* partes do módulo que o app já tem: desligadas */
  anuncios: { ativo: false, arquivo: '', popup: { ativo: false } },
  login: { ativo: false, biometria: false, permitirVisitante: false, permitirPagante: false, permitirAnunciante: false },
  niveis: { ativo: false, arquivo: '' },
  ocr: { ativo: false },
  ia: { ativo: false, botaoNaFaixa: false },
  notificacoes: { ativo: false },
  pwa: { ativo: false },
  /* o app tem o próprio quadro "O seu aparelho" (⚙ → Geral): o módulo não mostra faixa nem bloqueio */
  compat: { bloqueio: false, aviso: false, usa: ['indexedDB', 'armazenamento', 'camera', 'microfone', 'localizacao', 'notificacoes'] },

  /* Feedback dos usuários: banco da plataforma SolverONE (o mesmo endereço e a mesma chave PÚBLICA
     do login do app — publishable key, pública por desenho; nunca a secret nem a service_role) */
  supabase: { url: 'https://qvdvkqydhnadhewcidia.supabase.co', anonKey: 'sb_publishable_oRJmeUwlBbOP_HoOXf0xLw_4O8v43EA' },
  feedback: {
    ativo: true,
    perguntaDiaria: false,
    /* a tela de agora, no mapa do app (ex.: "shop/scan" · "Compras") */
    tela: function () { try { return window.OmniFeedbackTela ? window.OmniFeedbackTela() : null; } catch (e) { return null; } }
  }
});
