# 🗺️ Mapa de Clientes - Rastreamento em Tempo Real

Sistema profissional de mapeamento de clientes com Google Maps e Supabase, featuring rastreamento de localização em tempo real e visualização 3D.

![Status](https://img.shields.io/badge/status-active-success.svg)
![License](https://img.shields.io/badge/license-MIT-blue.svg)

## ✨ Características

- 🌍 **Rastreamento em tempo real** da localização do usuário
- 🎯 **Visualização 3D** interativa com animações suaves
- 📱 **Design responsivo** otimizado para mobile e desktop
- ⚡ **Performance otimizada** com lazy loading e código modular
- 🔒 **Seguro** com headers de segurança configurados
- 🎨 **UI/UX moderna** com animações fluidas
- ♿ **Acessível** com suporte a leitores de tela
- 🌐 **PWA ready** (Progressive Web App)

## 🚀 Tecnologias

- **Google Maps JavaScript API** (v3 Beta) com AdvancedMarkerElement
- **Supabase** para backend em tempo real
- **Vanilla JavaScript** (ES6+) - sem frameworks
- **CSS3** com variáveis customizadas e animações
- **HTML5** semântico e acessível

## 📋 Pré-requisitos

Antes de começar, você vai precisar:

1. **Google Maps API Key**
   - Acesse: [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
   - Crie um novo projeto ou selecione um existente
   - Ative a API: `Maps JavaScript API`
   - Crie uma credencial (API Key)

2. **Google Maps Map ID**
   - Acesse: [Google Maps Platform - Map Styles](https://console.cloud.google.com/google/maps-apis/studio/maps)
   - Crie um novo Map ID
   - Configure o estilo do mapa (opcional)

3. **Supabase Project**
   - Acesse: [Supabase Dashboard](https://app.supabase.com/)
   - Crie um novo projeto
   - Copie a `URL` e `anon/public key` das configurações

## 🔧 Instalação e Configuração

### 1. Clone o repositório

\`\`\`bash
git clone https://github.com/seu-usuario/mapa-clientes.git
cd mapa-clientes
\`\`\`

### 2. Configure as variáveis de ambiente

Copie o arquivo de exemplo:

\`\`\`bash
cp .env.example .env
\`\`\`

Edite o arquivo `.env` com suas credenciais:

\`\`\`env
GOOGLE_MAPS_API_KEY=sua_chave_aqui
SUPABASE_URL=sua_url_aqui
SUPABASE_ANON_KEY=sua_chave_aqui
GOOGLE_MAPS_MAP_ID=seu_map_id_aqui
\`\`\`

### 3. Atualize o index.html

Substitua as credenciais de exemplo no arquivo `index.html`:

\`\`\`javascript
const CONFIG = {
    SUPABASE_URL: "SUA_SUPABASE_URL",
    SUPABASE_ANON_KEY: "SUA_SUPABASE_ANON_KEY",
    MAP_ID: "SEU_MAP_ID",
    // ...
};
\`\`\`

E na tag script do Google Maps:

\`\`\`html
<script src="https://maps.googleapis.com/maps/api/js?key=SUA_API_KEY&callback=initMap&v=beta&libraries=places" async defer></script>
\`\`\`

## 🌐 Deploy

### Deploy na Vercel (Recomendado)

#### Opção 1: Via CLI

\`\`\`bash
# Instale a Vercel CLI globalmente
npm install -g vercel

# Faça login
vercel login

# Deploy para preview
npm run deploy:preview

# Deploy para produção
npm run deploy
\`\`\`

#### Opção 2: Via GitHub

1. Faça push do seu código para o GitHub
2. Acesse [vercel.com](https://vercel.com/)
3. Clique em "New Project"
4. Importe seu repositório
5. Configure as variáveis de ambiente no dashboard da Vercel:
   - `GOOGLE_MAPS_API_KEY`
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `GOOGLE_MAPS_MAP_ID`
6. Clique em "Deploy"

### Deploy em outro servidor

O projeto é 100% estático, basta fazer upload do arquivo `index.html` para qualquer servidor web:

\`\`\`bash
# Exemplo: GitHub Pages
git add .
git commit -m "Deploy to GitHub Pages"
git push origin main
\`\`\`

Depois ative o GitHub Pages nas configurações do repositório.

## 💻 Desenvolvimento Local

Para rodar o projeto localmente:

\`\`\`bash
# Opção 1: Usando live-server (recomendado)
npm run dev

# Opção 2: Usando Python
python -m http.server 3000

# Opção 3: Usando PHP
php -S localhost:3000
\`\`\`

Acesse: `http://localhost:3000`

## 📱 Funcionalidades

### Rastreamento de Localização

O aplicativo automaticamente:
- Solicita permissão de localização ao usuário
- Centraliza o mapa na localização atual
- Atualiza a posição em tempo real usando `watchPosition`
- Mostra um marcador customizado com animação de pulso

### Visualização 3D

- Clique no botão "3D" para alternar entre vista 2D e 3D
- Animações suaves com easing customizado
- Inclinação (tilt) de 67° e rotação (heading) de 45°

### Responsividade

- Adaptado para telas pequenas (smartphones)
- Controles otimizados para touch
- Font-size mínimo de 16px para evitar zoom automático no iOS

## 🏗️ Estrutura do Código

O código está organizado em módulos para melhor manutenção:

\`\`\`javascript
// Configuração centralizada
CONFIG = { ... }

// Estado global da aplicação
AppState = { ... }

// Módulos
Utils = { ... }              // Utilitários gerais
SupabaseModule = { ... }     // Integração com Supabase
GeolocationModule = { ... }  // Geolocalização
MapModule = { ... }          // Google Maps
EventModule = { ... }        // Gerenciamento de eventos
\`\`\`

## 🎨 Customização

### Alterar cores

Edite as variáveis CSS no topo do `<style>`:

\`\`\`css
:root {
    --primary-color: #4285f4;
    --primary-dark: #1a73e8;
    --white: #ffffff;
    /* ... */
}
\`\`\`

### Alterar posição inicial do mapa

No arquivo `index.html`, modifique:

\`\`\`javascript
const CONFIG = {
    DEFAULT_CENTER: { lat: -23.5505, lng: -46.6333 }, // São Paulo
    DEFAULT_ZOOM: 17,
    // ...
};
\`\`\`

### Alterar estilo do mapa

1. Acesse [Google Maps Platform - Map Styles](https://console.cloud.google.com/google/maps-apis/studio/maps)
2. Crie um novo estilo
3. Copie o Map ID
4. Atualize no código

## 📊 Integração com Supabase

### Exemplo: Salvar localização do usuário

\`\`\`javascript
// No GeolocationModule.updateLocation()
async saveLocation(position) {
    const { data, error } = await AppState.supabase
        .from('user_locations')
        .insert([
            {
                user_id: 'user-123',
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
                timestamp: new Date().toISOString()
            }
        ]);

    if (error) console.error('Erro ao salvar:', error);
}
\`\`\`

### Exemplo: Exibir marcadores de clientes

\`\`\`javascript
async function loadCustomers() {
    const { data, error } = await AppState.supabase
        .from('customers')
        .select('*');

    if (data) {
        data.forEach(customer => {
            new google.maps.Marker({
                map: AppState.map,
                position: { lat: customer.lat, lng: customer.lng },
                title: customer.name
            });
        });
    }
}
\`\`\`

## 🔒 Segurança

O projeto implementa:

- **Content Security Policy** headers
- **X-Frame-Options** para prevenir clickjacking
- **X-XSS-Protection** para proteção contra XSS
- **Referrer-Policy** para controle de referrer
- **HTTPS only** (recomendado para geolocalização)

## 📈 Performance

Otimizações implementadas:

- ✅ Preconnect para CDNs críticos
- ✅ Async/defer em scripts externos
- ✅ CSS inline para evitar render blocking
- ✅ Animações com `requestAnimationFrame`
- ✅ Debounce em eventos frequentes
- ✅ Will-change para otimizar animações
- ✅ Código modular e reutilizável

## 🐛 Troubleshooting

### Mapa não carrega

- Verifique se a API Key do Google Maps está correta
- Confirme que a API `Maps JavaScript API` está habilitada
- Verifique o console do navegador para erros

### Localização não funciona

- Use HTTPS (geolocalização requer conexão segura)
- Verifique permissões do navegador
- Teste em dispositivo físico (não emulador)

### Erro de CORS

- Adicione seu domínio nas restrições da API Key
- Configure o CORS no Supabase

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 🤝 Contribuindo

Contribuições são sempre bem-vindas!

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 👨‍💻 Autor

Seu Nome - [@seu_usuario](https://github.com/seu-usuario)

## 📞 Suporte

- 📧 Email: seu.email@example.com
- 🐛 Issues: [GitHub Issues](https://github.com/seu-usuario/mapa-clientes/issues)

## 🙏 Agradecimentos

- Google Maps Platform
- Supabase
- Comunidade open source

---

⭐ Se este projeto foi útil para você, considere dar uma estrela no GitHub!
