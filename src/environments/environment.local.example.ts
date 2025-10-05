// ============================================
// CADPLUS ERP - CONFIGURAÇÕES LOCAIS (EXEMPLO)
// ============================================
// 
// ATENÇÃO: Este arquivo contém dados sensíveis!
// 
// INSTRUÇÕES:
// 1. Copie este arquivo para environment.local.ts
// 2. Adicione environment.local.ts ao .gitignore
// 3. Configure suas URLs e chaves reais
// 4. NUNCA commite dados sensíveis!
//
// ============================================

export const environment = {
  production: false,
  
  // URLs SENSÍVEIS - Configure com suas URLs reais
  apiUrl: 'https://sua-api-real.com/api',
  backendUrl: 'https://sua-api-real.com/api',
  
  appName: 'Cad+ ERP',
  version: '1.0.0',
  
  // Configurações sensíveis
  config: {
    api: {
      baseUrl: 'https://sua-api-real.com/api',
      timeout: 30000,
      // Chaves de API (se necessário)
      apiKey: 'SUA_CHAVE_API_AQUI',
      secretKey: 'SUA_CHAVE_SECRETA_AQUI',
    },
    frontend: {
      port: 4200,
      host: 'localhost',
    },
    environment: 'local',
    features: {
      debug: true,
      auditLogs: true,
    },
    security: {
      jwtStorageKey: 'cadplus_token',
      refreshTokenKey: 'cadplus_refresh_token',
      // Chaves de segurança adicionais
      encryptionKey: 'SUA_CHAVE_CRIPTOGRAFIA',
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
    
    // Configurações de banco de dados (se necessário)
    database: {
      host: 'localhost',
      port: 5432,
      name: 'cadplus_db',
      // NUNCA coloque senhas aqui em produção!
      // Use variáveis de ambiente do servidor
    },
    
    // Configurações de terceiros
    thirdParty: {
      googleMapsApiKey: 'SUA_CHAVE_GOOGLE_MAPS',
      firebaseConfig: {
        apiKey: 'SUA_CHAVE_FIREBASE',
        authDomain: 'seu-projeto.firebaseapp.com',
        projectId: 'seu-projeto-id',
      },
    },
  }
};
