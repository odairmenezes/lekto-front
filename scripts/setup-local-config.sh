#!/bin/bash

# ============================================
# CADPLUS ERP - Script de Configuração Local
# ============================================

echo "🔒 CadPlus ERP - Configuração Local"
echo "===================================="

# Verificar se o arquivo local já existe
if [ -f "src/environments/environment.local.ts" ]; then
    echo "⚠️  Arquivo environment.local.ts já existe!"
    read -p "Deseja sobrescrever? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "❌ Operação cancelada."
        exit 1
    fi
fi

# Copiar arquivo de exemplo
echo "📋 Copiando arquivo de exemplo..."
cp src/environments/environment.local.example.ts src/environments/environment.local.ts

# Verificar se foi copiado com sucesso
if [ -f "src/environments/environment.local.ts" ]; then
    echo "✅ Arquivo environment.local.ts criado com sucesso!"
    echo ""
    echo "📝 Próximos passos:"
    echo "1. Edite o arquivo: src/environments/environment.local.ts"
    echo "2. Configure suas URLs e chaves reais"
    echo "3. NUNCA commite este arquivo!"
    echo ""
    echo "🔧 Para usar a configuração local:"
    echo "   ng build --configuration=local"
    echo ""
    echo "⚠️  Lembre-se: Este arquivo está no .gitignore!"
else
    echo "❌ Erro ao criar arquivo de configuração local."
    exit 1
fi

# Verificar se está no .gitignore
if grep -q "environment.local.ts" .gitignore; then
    echo "✅ Arquivo está protegido no .gitignore"
else
    echo "⚠️  Adicione 'src/environments/environment.local.ts' ao .gitignore"
fi

echo ""
echo "🎉 Configuração local criada com sucesso!"
