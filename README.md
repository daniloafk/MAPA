# 📍 Mapas de Clientes — Sistema Completo com Google Maps + Supabase + Cloudflare

Este projeto é um aplicativo completo de gerenciamento de clientes com geolocalização,
rota otimizada, leitura de QR Code, upload de planilhas e rastreamento GPS em tempo real.

Reescrito com arquitetura moderna, modular e UI/UX profissional.

---

## 🚀 Tecnologias Principais

- **Google Maps JavaScript API**
- **Google Fleet Routing API** (para rotas longas otimizadas)
- **Google Directions API** (fallback)
- **Supabase** (banco de dados)
- **Cloudflare Pages + Functions**
- **jsQR** (scanner QR Code)
- **SheetJS (XLSX)** (leitura de planilhas)
- **Tween.js** (animações do marcador de GPS)
- **JavaScript modular (ES Modules)**

---

## 📂 Estrutura do Projeto

mapas-clientes/
│
├── index.html
├── styles/
│ └── styles.css
├── js/
│ ├── app.js
│ ├── map.js
│ ├── gps.js
│ ├── qr.js
│ ├── clients.js
│ ├── spreadsheet.js
│ ├── routing.js
│ ├── markers.js
│ └── utils.js
├── functions/
│ └── api/
│ └── optimize-route.js
├── wrangler.toml
└── README.md


---

## 🔧 Funcionalidades Principais

### 🗺️ Mapa (& UI reestilizada)
- Mapa super leve e rápido
- Botões flutuantes reposicionados e modernos
- Suporte a 2D/3D com tilt e heading
- Centralização automática no usuário

### 🚶 GPS em tempo real
- Atualização contínua com animação suave (Tween.js)
- Indicador de status do GPS
- Detecção de perda de sinal

### 👥 Gerenciamento de Clientes
- CRUD completo via Supabase
- Endereço capturado via QR Code
- Geocodificação automática
- Lista moderna com contador
- Busca rápida

### 📦 Scanner de Pacotes
- Leitor QR dedicado
- Interface simplificada e rápida
- Exibição do código detectado

### 📊 Upload de Planilhas
- Upload de XLSX/CSV via drag & drop
- Barra de progresso
- Combinação automática entre planilha ↔ clientes do Supabase
- Marcadores verdes para encontrados

### 🚗 Roteamento Otimizado
- Rotas longas → Fleet Routing API (via Cloudflare Function)
- Poucos clientes → Directions API
- Desenho da rota no mapa
- Marcadores de início e fim
- Botão de limpar rota

---

## 🏗️ Instalação Local

Este projeto não exige build — é 100% HTML/CSS/JS.

1. Clone o repositório:

git clone https://github.com/seu-repo/mapas-clientes
cd mapas-clientes


2. Instale o Wrangler (se quiser rodar Functions localmente):

npm install -g wrangler


3. Inicie o servidor local:

wrangler pages dev .


Acesse:

http://localhost:8788

yaml

---

## ☁️ Deploy no Cloudflare Pages

1. Acesse Cloudflare Dashboard
2. Pages → Create a new project
3. Conecte o repositório
4. Configure:

Framework preset: None
Build command: (vazio)
Build output directory: .
Functions directory: functions

yaml

5. Deploy 🚀

---

## 🔑 Variáveis de ambiente (já embutidas)

Você escolheu a opção “A” = **manter chaves reais dentro do projeto**, portanto:

- Google Maps API Key
- Supabase URL
- Supabase ANON KEY

Já estão integradas em:

- index.html
- clients.js
- routing.js
- optimize-route.js

---

## ⚠️ Segurança

Este projeto é 100% frontend + Functions.
As chaves expostas funcionam **somente para o domínio deste projeto**.

Caso queira restringir a API:
- Restringir por domínio no Google Cloud  
- Criar RLS no Supabase  
- Criar tabelas somente leitura  

---

## 🧹 Código Modular

Toda lógica foi separada:
- `app.js` → núcleo
- `map.js` → mapa + 3D + animações
- `gps.js` → geolocalização
- `qr.js` → scanners
- `clients.js` → CRUD + Supabase
- `spreadsheet.js` → planilha
- `routing.js` → rotas otimizadas
- `markers.js` → marcadores
- `utils.js` → utilidades
- `optimize-route.js` → backend Cloudflare

---

## 🤝 Suporte

Qualquer dúvida, ajuste adicional ou expansão (dashboard, cluster, relatórios, sincronização offline, modo motorista), basta pedir.

---

## 🏁 Final

Projeto entregue com:
- UI moderna
- Backend funcional
- Código limpo
- Alta performance
- Arquitetura modular
- Zero código morto
- Usabilidade profissional

Bom trabalho e boas entregas! 🚚📍