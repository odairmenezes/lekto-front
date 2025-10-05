export const environment = {
  production: true,
  apiUrl: 'https://api.cadplus.com.br/api',
  backendUrl: 'https://api.cadplus.com.br/api',
  appName: 'Cad+ ERP',
  version: '1.0.0',
  
  // Configurações específicas do ambiente de produção
  config: {
    api: {
      baseUrl: 'https://api.cadplus.com.br/api',
      timeout: 30000,
    },
    frontend: {
      port: 443,
      host: 'cadplus.com.br',
    },
    environment: 'production',
    features: {
      debug: false,
      auditLogs: true,
    },
    security: {
      jwtStorageKey: 'cadplus_token',
      refreshTokenKey: 'cadplus_refresh_token',
    },
    pagination: {
      defaultPageSize: 10,
      maxPageSize: 100,
    },
    ui: {
      theme: {
        primaryColor: '#1976d2',
        accentColor: '#ff4081',
      },
      animations: true,
    },
  }
};