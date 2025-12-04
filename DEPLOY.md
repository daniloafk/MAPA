# 🚀 Guia Completo de Deploy

Este documento fornece instruções detalhadas para fazer deploy do projeto em diferentes plataformas.

## 📋 Índice

- [Vercel (Recomendado)](#vercel)
- [GitHub Pages](#github-pages)
- [Netlify](#netlify)
- [AWS S3 + CloudFront](#aws-s3--cloudfront)
- [Configuração do Supabase](#configuração-do-supabase)
- [Configuração do Google Maps](#configuração-do-google-maps)

---

## Vercel

A Vercel é a plataforma recomendada por oferecer deploy automático, HTTPS gratuito e excelente performance.

### Método 1: Deploy via Dashboard (Mais Fácil)

1. **Crie conta na Vercel**
   - Acesse: https://vercel.com/signup
   - Conecte com sua conta do GitHub

2. **Importe o projeto**
   - Clique em "New Project"
   - Selecione "Import Git Repository"
   - Escolha seu repositório

3. **Configure as variáveis de ambiente**
   - Em "Environment Variables", adicione:
     ```
     GOOGLE_MAPS_API_KEY=sua_chave_aqui
     SUPABASE_URL=sua_url_aqui
     SUPABASE_ANON_KEY=sua_chave_aqui
     GOOGLE_MAPS_MAP_ID=seu_map_id_aqui
     ```

4. **Deploy**
   - Clique em "Deploy"
   - Aguarde a conclusão (geralmente 30-60 segundos)
   - Acesse sua URL: `https://seu-projeto.vercel.app`

### Método 2: Deploy via CLI

\`\`\`bash
# Instalar Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy (primeira vez)
vercel

# Siga as instruções:
# - Set up and deploy? Yes
# - Which scope? Selecione sua conta
# - Link to existing project? No
# - Project name? mapa-clientes (ou outro nome)
# - Directory? ./
# - Override settings? No

# Configurar variáveis de ambiente
vercel env add GOOGLE_MAPS_API_KEY
vercel env add SUPABASE_URL
vercel env add SUPABASE_ANON_KEY
vercel env add GOOGLE_MAPS_MAP_ID

# Deploy para produção
vercel --prod
\`\`\`

### Atualizações Automáticas

Após o setup inicial, cada push para a branch `main` acionará automaticamente um novo deploy.

---

## GitHub Pages

Deploy gratuito direto do GitHub.

### Passo a Passo

1. **Configure o repositório**
   \`\`\`bash
   git add .
   git commit -m "Prepare for deploy"
   git push origin main
   \`\`\`

2. **Ative GitHub Pages**
   - Acesse: `Settings` → `Pages`
   - Source: `Deploy from a branch`
   - Branch: `main` / `root`
   - Save

3. **Acesse seu site**
   - URL: `https://seu-usuario.github.io/mapa-clientes/`

### Notas importantes

- ⚠️ GitHub Pages não suporta variáveis de ambiente server-side
- Você precisará incluir as credenciais diretamente no código (não recomendado para produção)
- Ou usar uma solução como GitHub Actions + Secrets

---

## Netlify

Alternativa excelente à Vercel com recursos similares.

### Deploy via Dashboard

1. **Crie conta**
   - Acesse: https://app.netlify.com/signup

2. **Novo Site**
   - Click "Add new site" → "Import an existing project"
   - Conecte com GitHub
   - Selecione seu repositório

3. **Configure**
   - Build command: (deixe em branco)
   - Publish directory: `/`

4. **Variáveis de ambiente**
   - Vá em `Site settings` → `Environment variables`
   - Adicione suas variáveis

5. **Deploy**
   - Click "Deploy site"
   - URL: `https://seu-site.netlify.app`

### Deploy via CLI

\`\`\`bash
# Instalar Netlify CLI
npm install -g netlify-cli

# Login
netlify login

# Inicializar
netlify init

# Deploy
netlify deploy --prod
\`\`\`

---

## AWS S3 + CloudFront

Para quem precisa de controle total e infraestrutura AWS.

### Passo a Passo

1. **Criar bucket S3**
   \`\`\`bash
   aws s3 mb s3://mapa-clientes
   \`\`\`

2. **Configurar bucket para hosting**
   \`\`\`bash
   aws s3 website s3://mapa-clientes --index-document index.html
   \`\`\`

3. **Upload dos arquivos**
   \`\`\`bash
   aws s3 sync . s3://mapa-clientes --exclude ".git/*"
   \`\`\`

4. **Configurar CloudFront**
   - Crie uma distribuição apontando para o bucket
   - Configure SSL/TLS com certificado ACM
   - Aguarde propagação (15-30 minutos)

5. **Acessar**
   - URL: `https://seu-dominio.cloudfront.net`

---

## Configuração do Supabase

### 1. Criar Projeto

1. Acesse: https://app.supabase.com/
2. Click "New Project"
3. Preencha:
   - Name: `mapa-clientes`
   - Database Password: (senha forte)
   - Region: escolha a mais próxima

### 2. Obter Credenciais

1. Vá em `Settings` → `API`
2. Copie:
   - **Project URL**: `SUPABASE_URL`
   - **anon public key**: `SUPABASE_ANON_KEY`

### 3. Criar Tabelas (Exemplo)

Execute no SQL Editor:

\`\`\`sql
-- Tabela de usuários
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Tabela de localizações
CREATE TABLE user_locations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    timestamp TIMESTAMP DEFAULT NOW()
);

-- Tabela de clientes
CREATE TABLE customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    address TEXT,
    lat DECIMAL(10, 8) NOT NULL,
    lng DECIMAL(11, 8) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Habilitar Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso (exemplo: permitir leitura pública)
CREATE POLICY "Enable read access for all users" ON customers
    FOR SELECT USING (true);
\`\`\`

### 4. Configurar CORS

1. Vá em `Settings` → `API` → `CORS`
2. Adicione seus domínios:
   - `http://localhost:3000`
   - `https://seu-projeto.vercel.app`

---

## Configuração do Google Maps

### 1. Criar Projeto no Google Cloud

1. Acesse: https://console.cloud.google.com/
2. Crie novo projeto: "Mapa de Clientes"

### 2. Ativar APIs

1. Vá em "APIs & Services" → "Library"
2. Ative as seguintes APIs:
   - **Maps JavaScript API** ✅ (obrigatório)
   - Places API (opcional)
   - Geocoding API (opcional)
   - Geolocation API (opcional)

### 3. Criar API Key

1. Vá em "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "API Key"
3. Copie a chave criada

### 4. Restringir API Key (Segurança)

1. Click na API Key criada
2. Em "Application restrictions":
   - Selecione "HTTP referrers"
   - Adicione seus domínios:
     ```
     http://localhost:3000/*
     https://seu-projeto.vercel.app/*
     ```

3. Em "API restrictions":
   - Selecione "Restrict key"
   - Marque apenas as APIs que você ativou

### 5. Criar Map ID

1. Acesse: https://console.cloud.google.com/google/maps-apis/studio/maps
2. Click "Create Map ID"
3. Configurações:
   - Name: "Mapa de Clientes"
   - Type: JavaScript
4. Customize o estilo (opcional)
5. Copie o Map ID

### 6. Configurar Faturamento

⚠️ **IMPORTANTE**: Mesmo com créditos gratuitos, é necessário configurar uma conta de faturamento.

1. Vá em "Billing" → "Link a billing account"
2. Crie uma nova conta de faturamento
3. Adicione um método de pagamento

**Créditos Gratuitos:**
- $200 USD por mês em créditos
- Suficiente para ~28.000 carregamentos de mapa

---

## ⚡ Checklist Pré-Deploy

Antes de fazer deploy em produção, verifique:

- [ ] Todas as credenciais foram configuradas
- [ ] API Keys estão restritas aos domínios corretos
- [ ] HTTPS está habilitado (obrigatório para geolocalização)
- [ ] CORS está configurado no Supabase
- [ ] Faturamento do Google Cloud está ativo
- [ ] Código foi testado localmente
- [ ] Variáveis de ambiente não estão hardcoded
- [ ] .gitignore está configurado corretamente

---

## 🔧 Troubleshooting

### Erro: "This page can't load Google Maps correctly"

**Solução:**
- Verifique se a API Key está correta
- Confirme que a API JavaScript Maps está habilitada
- Verifique restrições de domínio

### Erro: "Geolocation permission denied"

**Solução:**
- Use HTTPS (obrigatório)
- Limpe permissões do navegador e tente novamente
- Verifique se o domínio está na lista de permitidos

### Erro: CORS no Supabase

**Solução:**
- Adicione seu domínio nas configurações de CORS do Supabase
- Aguarde alguns minutos para propagação

---

## 📞 Suporte

Se encontrar problemas:

1. Verifique a documentação oficial das plataformas
2. Abra uma issue no GitHub
3. Entre em contato: seu.email@example.com

---

✅ **Deploy concluído com sucesso!** Seu mapa está online e pronto para uso.
