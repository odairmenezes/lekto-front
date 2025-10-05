# CadPlus ERP - Sistema de Gestão Hospitalar

## 📋 Sobre o Projeto

O **CadPlus ERP** é um sistema completo de gestão hospitalar desenvolvido em Angular 17 com arquitetura moderna e escalável. O projeto demonstra competências avançadas em desenvolvimento frontend, incluindo gerenciamento de estado, autenticação JWT, validações robustas e interface responsiva.

### 🎯 Principais Funcionalidades

- **Autenticação Segura**: Sistema de login com JWT e refresh tokens
- **Gestão de Usuários**: CRUD completo com validações avançadas (CPF, email, senhas seguras)
- **Gestão de Endereços**: Sistema de endereços múltiplos com endereço principal
- **Dashboard Interativo**: Estatísticas em tempo real e ações rápidas
- **Sistema de Auditoria**: Logs detalhados de todas as operações
- **Perfil do Usuário**: Edição de dados pessoais e alteração de senha
- **Interface Responsiva**: Design moderno com Angular Material

### 🛠️ Tecnologias Utilizadas

- **Frontend**: Angular 17, TypeScript, Angular Material
- **Autenticação**: JWT, Guards, Interceptors
- **Validações**: Validators customizados (CPF, senhas, telefones)
- **Estado**: RxJS Observables, BehaviorSubject
- **Estilização**: SCSS, Angular Material Design
- **Build**: Angular CLI, Vite (dev server)

## 🚀 Instalação e Configuração

### Pré-requisitos

- Node.js 18.x ou superior
- npm 9.x ou superior
- Angular CLI 17+

### Instalação

1. **Clone o repositório**
```bash
git clone <repository-url>
cd front-lelklto
```

2. **Instale as dependências**
```bash
npm install
```

3. **Configure o ambiente**
O projeto está configurado para conectar com a API em `http://localhost:7001/api`. Para alterar:

```bash
# Edite o arquivo de ambiente
nano src/environments/environment.ts
```

4. **Execute o projeto**
```bash
npm start
```

O sistema estará disponível em `http://localhost:4200`

## 🔧 Configuração de Ambiente

### Configurações Disponíveis

O projeto possui diferentes configurações de ambiente:

- **Development**: `src/environments/environment.ts` (padrão)
- **Production**: `src/environments/environment.prod.ts`
- **Local**: `src/environments/environment.local.example.ts` (exemplo)

### Configuração Local

Para configurações sensíveis locais:

1. **Copie o arquivo de exemplo**:
   ```bash
   cp src/environments/environment.local.example.ts src/environments/environment.local.ts
   ```

2. **Ou use o script automatizado**:
   ```bash
   ./scripts/setup-local-config.sh
   ```

3. **Configure suas URLs e chaves** no arquivo `environment.local.ts`

4. **Build com configuração local**:
   ```bash
   ng build --configuration=local
   ```

### ⚠️ Importante

- O arquivo `environment.local.ts` está no `.gitignore`
- **NUNCA** commite dados sensíveis
- Use apenas URLs de desenvolvimento em `environment.ts`

## 📱 Como Usar o Sistema

### 1. Login
- Acesse `http://localhost:4200`
- Use as credenciais fornecidas para fazer login
- O sistema utiliza JWT para autenticação segura

### 2. Dashboard
- Visualize estatísticas em tempo real
- Acesse ações rápidas através dos cards
- Monitore configurações do sistema

### 3. Gestão de Usuários
- **Listar**: Visualize todos os usuários cadastrados
- **Criar**: Adicione novos usuários com validações completas
- **Editar**: Modifique dados pessoais e endereços
- **Visualizar**: Consulte detalhes completos do usuário

### 4. Perfil do Usuário
- Edite seus dados pessoais
- Altere sua senha com validações de segurança
- Visualize informações da conta

### 5. Auditoria
- Consulte logs de todas as operações
- Pesquise por CPF específico
- Monitore atividades do sistema

## 🏗️ Arquitetura do Projeto

### Estrutura de Pastas

```
src/app/
├── core/                    # Serviços principais e configurações
│   ├── guards/             # Guards de autenticação
│   ├── interceptors/       # Interceptors HTTP
│   └── services/           # Serviços principais
├── features/               # Módulos de funcionalidades
│   ├── auth/              # Autenticação
│   ├── dashboard/         # Dashboard e componentes
│   └── users/             # Gestão de usuários
├── layout/                # Componentes de layout
├── shared/                # Componentes compartilhados
│   ├── components/       # Componentes reutilizáveis
│   ├── models/           # Interfaces e modelos
│   ├── pipes/            # Pipes customizados
│   └── validators/       # Validadores customizados
└── environments/         # Configurações de ambiente
```

### Serviços Principais

- **AuthService**: Gerenciamento de autenticação e tokens
- **CadDataService**: Comunicação com a API backend
- **UserService**: Operações relacionadas a usuários
- **DashboardStatsService**: Estatísticas do dashboard
- **AuditService**: Logs de auditoria
- **NotificationService**: Notificações do sistema

### Validações Implementadas

- **CPF**: Validação completa com dígitos verificadores
- **Email**: Validação de formato e unicidade
- **Senhas**: Mínimo 8 caracteres, maiúscula, minúscula, especial
- **Telefone**: Formato brasileiro com máscara
- **CEP**: Validação de formato e consulta automática

## 🔒 Segurança

### Autenticação
- Tokens JWT com expiração configurável
- Refresh tokens para renovação automática
- Guards para proteção de rotas
- Interceptors para adição automática de headers

### Validações
- Validação client-side e server-side
- Sanitização de dados de entrada
- Proteção contra XSS e CSRF
- Validação rigorosa de CPF e documentos

### Configurações Sensíveis
- Arquivos de ambiente separados por contexto
- Dados sensíveis protegidos no .gitignore
- Configurações de produção isoladas

## 🧪 Testes e Qualidade

### Validações Implementadas
- Validação de formulários em tempo real
- Feedback visual para erros de validação
- Mensagens de erro específicas e claras
- Prevenção de submissão com dados inválidos

### Performance
- Lazy loading de módulos
- Otimização de bundles
- Interceptors para cache de requisições
- Paginação para listas grandes

## 📊 Build e Deploy

### Comandos Disponíveis

```bash
# Desenvolvimento
npm start

# Build de produção
npm run build

# Build com configuração específica
ng build --configuration=production
ng build --configuration=local

# Testes
npm run test

# Lint
npm run lint
```

### Configurações de Build

- **Development**: Source maps, sem otimização
- **Production**: Otimizado, minificado, sem source maps
- **Local**: Configurações personalizadas locais

## 🔧 Desenvolvimento

### Adicionando Novas Funcionalidades

1. **Criar componente**:
```bash
ng generate component features/nova-funcionalidade
```

2. **Adicionar rota**:
```typescript
// app.routes.ts
{ path: 'nova-rota', component: NovoComponent }
```

3. **Implementar serviço**:
```typescript
// core/services/novo.service.ts
@Injectable({ providedIn: 'root' })
export class NovoService { }
```

### Padrões de Código

- **TypeScript**: Tipagem forte em todos os componentes
- **Angular Material**: Componentes UI padronizados
- **SCSS**: Estilos organizados por componente
- **RxJS**: Programação reativa para operações assíncronas

## 📈 Melhorias Futuras

### Funcionalidades Planejadas
- Sistema de notificações push
- Relatórios avançados com gráficos
- Integração com APIs externas
- Sistema de backup automático
- Dashboard com métricas em tempo real

### Otimizações Técnicas
- Implementação de PWA
- Cache inteligente de dados
- Compressão de imagens automática
- Lazy loading avançado
- Service Workers para offline

## 🤝 Contribuição

Este projeto foi desenvolvido como demonstração de competências técnicas para processo seletivo. Para contribuições:

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📞 Contato

Para dúvidas técnicas ou informações sobre o projeto:

- **Email**: [seu-email@exemplo.com]
- **LinkedIn**: [seu-linkedin]
- **GitHub**: [seu-github]

---

## 📄 Licença

Este projeto foi desenvolvido para fins de demonstração técnica. Todos os direitos reservados.

---

**Desenvolvido com ❤️ usando Angular 17 e TypeScript**