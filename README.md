# Sistema de Entregas com Fleet Routing API

Sistema completo de rastreamento e otimização de entregas com Google Maps e Fleet Routing API.

## 🚀 Funcionalidades

- ✅ Rastreamento em tempo real com GPS
- ✅ 73 endereços cadastrados da planilha Excel
- ✅ QR Code scanner para adicionar clientes
- ✅ Sidebar com busca de clientes
- ✅ **Otimização de rotas com TODOS os endereços** (Fleet Routing API)
- ✅ Marcadores no mapa para cada entrega
- ✅ Cálculo de distância e tempo total

## 📋 Pré-requisitos

1. Conta Google Cloud Platform com billing ativado
2. APIs ativadas:
   - Maps JavaScript API
   - Directions API
   - Route Optimization API
3. Service Account configurado
4. Projeto Supabase configurado

## 🔧 Configuração

### 1. Service Account (já configurado no Passo 1 do guia)

### 2. Configurar variáveis de ambiente na Vercel

Após fazer o deploy inicial:

1. Vá para: https://vercel.com/dashboard
2. Selecione seu projeto
3. Vá em **"Settings"** → **"Environment Variables"**
4. Adicione a variável:
   - **Name:** `GOOGLE_SERVICE_ACCOUNT_KEY`
   - **Value:** Cole TODO o conteúdo do arquivo JSON do Service Account
   - **Environment:** Production, Preview, Development
5. Clique em **"Save"**
6. **Redeploy** o projeto

### 3. Estrutura de arquivos

```
/
├── index.html              # Frontend principal
├── api/
│   └── optimize-route.js   # Backend serverless (Fleet Routing)
├── package.json            # Dependências Node.js
├── vercel.json            # Configuração Vercel
└── README.md              # Este arquivo
```

## 🚀 Deploy

### Via Vercel CLI

```bash
# Instalar Vercel CLI
npm install -g vercel

# Fazer deploy
vercel

# Deploy em produção
vercel --prod
```

### Via Git (GitHub/GitLab)

1. Conecte seu repositório no Vercel
2. Vercel detecta automaticamente a configuração
3. Configure a variável de ambiente `GOOGLE_SERVICE_ACCOUNT_KEY`
4. Deploy automático a cada push

## 📊 Custo estimado

- **Route Optimization API:** ~$0.03 por requisição
- **Directions API:** ~$0.005 por requisição
- **Crédito gratuito:** $200/mês
- **Uso típico:** ~10-50 requisições/mês = **$0.35 - $1.75/mês**
- **Você paga:** **$0** (dentro do crédito gratuito)

## 🆘 Troubleshooting

### Erro 401 no backend
- Verifique se `GOOGLE_SERVICE_ACCOUNT_KEY` está configurada
- Confirme que o JSON está completo (sem quebras de linha)

### Erro 403 - Permission Denied
- Verifique se Service Account tem papel "Cloud Optimization AI Admin"
- Confirme que Route Optimization API está ativada

### Backend não responde
- Verifique logs em: Vercel Dashboard → Functions → Logs
- Confirme que `/api/optimize-route` está acessível

## 📝 Suporte

Em caso de dúvidas, verifique:
- Logs do Console (F12)
- Logs da Vercel
- Documentação: https://cloud.google.com/optimization/docs
