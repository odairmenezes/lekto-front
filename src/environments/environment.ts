export const environment = {
  production: false,
  apiUrl: 'http://localhost:7001/api',
  backendUrl: 'http://localhost:7001/api',
  appName: 'Cad+ ERP',
  version: '1.0.0',
  
  // Configurações específicas do ambiente
  config: {
    api: {
      baseUrl: 'http://localhost:7001/api',
      timeout: 30000,
    },
    frontend: {
      port: 4200,
      host: 'localhost',
    },
    environment: 'development',
    features: {
      debug: true,
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