export const nexusCurrencies = [
  { code: 'EUR', name: 'Euro', symbol: '€' },
  { code: 'USD', name: 'US Dollar', symbol: '$' },
  { code: 'BRL', name: 'Real Brasileiro', symbol: 'R$' }
];

export const translations: Record<string, any> = {
  'pt-PT': {
    common: {
      login: "Entrar",
      activate: "Ativar Licença",
      back: "Voltar",
      save: "Guardar",
      loading: "A processar...",
      today: "Hoje",
      syncing: "A sincronizar..."
    },
    splash: {
      tagline: "Horas, rendimentos e impostos num só lugar"
    },
    landing: {
      hero: "TRANSFORME SEGUNDOS EM",
      heroHighlight: "LUCRO REAL.",
      subhero: "O NexusTime é a única sentinela digital projetada para profissionais que exigem precisão absoluta. Recupere cada segundo de faturamento hoje.",
      badge: "Digital Nexus Solutions • 2026",
      painTitle: "O Problema",
      solutionTitle: "Solução Nexus",
      pains: [
        "Horas extras não faturadas por esquecimento.",
        "Caos total no cálculo de impostos mensais.",
        "Falta de clareza sobre o lucro líquido real."
      ],
      solutions: [
        "Rastreio atómico de cada minuto.",
        "Informações centralizadas IRS, SS E IVA",
        "Relatórios de elite para o contabilista."
      ],
      advantages: [
        { title: "Download em PDF", desc: "Relatórios profissionais prontos para o seu contabilista." },
        { title: "Controlo de Horas Exatas", desc: "Registo rigoroso de entradas, saídas e pausas em tempo real." },
        { title: "Impostos Automáticos", desc: "Cálculo instantâneo de retenções IRS, Seg. Social e IVA." },
        { title: "Sincronização Cloud", desc: "Dados seguros e acessíveis em qualquer dispositivo Nexus." },
        { title: "Suporte Nexus Elite", desc: "Atendimento prioritário 24/7 pela nossa equipa técnica." },
        { title: "Segurança Máxima", desc: "Encriptação de dados de nível bancário e conformidade RGPD." }
      ],
      promo: {
        badge: "Oferta de Lançamento",
        title: "Vantagens",
        highlight: "Exclusivas Elite:",
        period: "/Ano",
        sub: "Pague Uma Vez, Use o Ano Todo",
        cta: "Ativar Licença",
        advantages: [
          "Registo de Horas Atómico",
          "Cálculo Automático de Impostos",
          "Relatórios PDF para Contabilista",
          "Criptografia Nexus Cloud"
        ]
      },
      support: {
        title: "Suporte Técnico Dedicado",
        desc: "Dúvidas sobre a plataforma ou faturamento? Nossa equipe de elite está pronta para ajudar."
      },
      final: {
        title: "NÃO PERCA MAIS",
        highlight: "DINHEIRO HOJE.",
        cta: "Ativar Agora"
      },
      footer: {
        note: "Digital Nexus. Elite Time Management.",
        privacy: "Privacidade",
        terms: "Termos"
      }
    },
    login: {
      secureAccess: "ACESSO SEGURO",
      idNexus: "ID Nexus / Email",
      securityKey: "Palavra-passe",
      validateAccess: "Entrar no App",
      platformNote: "Plataforma Digital Nexus Solutions",
      blockedTitle: "ACESSO BLOQUEADO",
      blockedMsg: "Por favor, confirme o seu e-mail ou contacte o administrador.",
      invalidTitle: "CREDENCIAIS INVÁLIDAS",
      invalidMsg: "O e-mail ou palavra-passe não coincidem.",
      systemError: "ERRO DE SISTEMA"
    },
    dashboard: {
      activeOp: "Operação Ativa",
      shift: "Turno Nexus",
      entry: "Entrada",
      exit: "Saída",
      location: "Local / Serviço",
      locationPlaceholder: "Local...",
      advance: "Adiantamento",
      extra: "Horas Extras",
      notes: "Observações",
      absence: "falta",
      lunch: "almoço",
      sync: "sincronizar",
      update: "sincronizar"
    },
    settings: {
      title: "O Meu Perfil",
      idAndContact: "DADOS PESSOAIS",
      displayName: "Nome Completo",
      taxId: "NIF / ID Fiscal",
      phone: "Telemóvel",
      standardHours: "HORÁRIO BASE",
      defaultEntry: "Entrada Padrão",
      defaultExit: "Saída Padrão",
      hourlyRate: "Valor à Hora (€)",
      saveBtn: "Guardar",
      saving: "A guardar...",
      saved: "Guardado",
      security: {
        title: "Segurança",
        newPassword: "Nova Senha",
        confirmPassword: "Confirmar"
      }
    }
  }
};