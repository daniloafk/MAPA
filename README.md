# Mapa de Clientes – Cloudflare Pages

Projeto hospedado no Cloudflare Pages com backend usando Pages Functions.

## Estrutura

- `/functions/api/optimize-route.js` – Backend de otimização de rotas
- `index.html` – Frontend
- `/css` – Estilos
- `/js` – Scripts
- `/img` – Imagens
- `/assets` – Planilhas e anexos

## Variáveis de Ambiente

Configure no Cloudflare Pages:

- `GOOGLE_SERVICE_ACCOUNT_KEY` → Cole o JSON completo da service account

## Deploy

O deploy é automático via git para Cloudflare Pages.