# 🤝 Guia de Contribuição

Obrigado por considerar contribuir com o projeto! Este documento fornece diretrizes para contribuir.

## 📋 Código de Conduta

Este projeto adere aos princípios de respeito, inclusão e colaboração. Esperamos que todos os contribuidores:

- Sejam respeitosos e construtivos
- Aceitem críticas construtivas
- Foquem no que é melhor para a comunidade
- Demonstrem empatia com outros membros

## 🚀 Como Contribuir

### Reportar Bugs

Se você encontrou um bug:

1. Verifique se já não existe uma issue aberta sobre o problema
2. Abra uma nova issue com:
   - Título descritivo
   - Passos para reproduzir
   - Comportamento esperado vs. observado
   - Screenshots (se aplicável)
   - Informações do ambiente (navegador, OS, etc.)

### Sugerir Melhorias

Para sugerir novas funcionalidades:

1. Abra uma issue com a tag `enhancement`
2. Descreva claramente:
   - O problema que a funcionalidade resolveria
   - Como você imagina a solução
   - Exemplos de uso

### Pull Requests

1. **Fork o repositório**
   \`\`\`bash
   git clone https://github.com/seu-usuario/mapa-clientes.git
   cd mapa-clientes
   \`\`\`

2. **Crie uma branch**
   \`\`\`bash
   git checkout -b feature/minha-feature
   # ou
   git checkout -b fix/meu-bugfix
   \`\`\`

3. **Faça suas alterações**
   - Mantenha o código limpo e comentado
   - Siga as convenções de código do projeto
   - Teste suas alterações

4. **Commit suas mudanças**
   \`\`\`bash
   git add .
   git commit -m "feat: adiciona nova funcionalidade X"
   \`\`\`

5. **Push para o GitHub**
   \`\`\`bash
   git push origin feature/minha-feature
   \`\`\`

6. **Abra um Pull Request**
   - Descreva suas mudanças
   - Referencie issues relacionadas
   - Aguarde revisão

## 📝 Convenções de Código

### JavaScript

- Use ES6+ syntax
- Use `const` e `let` (não `var`)
- Nomes descritivos para variáveis e funções
- Comentários em português para melhor compreensão
- Módulos organizados por responsabilidade

\`\`\`javascript
// ✅ Bom
const getUserLocation = () => {
    return navigator.geolocation.getCurrentPosition();
};

// ❌ Ruim
var x = () => {
    return navigator.geolocation.getCurrentPosition();
};
\`\`\`

### CSS

- Use variáveis CSS para cores e valores reutilizáveis
- Organize por seções com comentários
- Mobile-first approach

\`\`\`css
/* ✅ Bom */
:root {
    --primary-color: #4285f4;
}

.button {
    background: var(--primary-color);
}

/* ❌ Ruim */
.button {
    background: #4285f4;
}
\`\`\`

### Commits

Siga o padrão [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` nova funcionalidade
- `fix:` correção de bug
- `docs:` documentação
- `style:` formatação, sem mudança de código
- `refactor:` refatoração de código
- `test:` adição de testes
- `chore:` tarefas de build, dependências

\`\`\`bash
# Exemplos
git commit -m "feat: adiciona botão de resetar zoom"
git commit -m "fix: corrige erro de geolocalização no Safari"
git commit -m "docs: atualiza README com instruções de deploy"
\`\`\`

## 🧪 Testes

Antes de submeter um PR, teste:

1. **Funcionalidade básica**
   - Mapa carrega corretamente
   - Geolocalização funciona
   - Botão 3D alterna corretamente

2. **Responsividade**
   - Teste em desktop (Chrome, Firefox, Safari)
   - Teste em mobile (iOS Safari, Chrome Android)
   - Teste em tablet

3. **Performance**
   - Verifique o console para erros
   - Teste com conexão lenta

## 📚 Estrutura do Projeto

\`\`\`
mapa-clientes/
├── index.html          # Arquivo principal
├── vercel.json         # Configuração Vercel
├── package.json        # Dependências e scripts
├── .gitignore          # Arquivos ignorados
├── .env.example        # Exemplo de variáveis
├── README.md           # Documentação principal
├── DEPLOY.md           # Guia de deploy
├── CONTRIBUTING.md     # Este arquivo
└── LICENSE             # Licença MIT
\`\`\`

## 🎯 Áreas que Precisam de Ajuda

- [ ] Adicionar testes automatizados
- [ ] Melhorar acessibilidade (ARIA labels)
- [ ] Adicionar suporte a múltiplos idiomas
- [ ] Criar componentes reutilizáveis
- [ ] Otimizar performance para conexões lentas
- [ ] Documentar API do Supabase
- [ ] Criar exemplos de uso

## 💡 Ideias para Contribuir

- **Novos recursos**: Pesquisa de endereço, rotas, clusters de marcadores
- **Melhorias de UI**: Temas, animações, feedback visual
- **Integrações**: Outras plataformas de mapas, diferentes backends
- **Documentação**: Tutoriais, vídeos, exemplos
- **Performance**: Lazy loading, cache, service workers
- **Acessibilidade**: Navegação por teclado, leitores de tela

## ❓ Dúvidas

Se tiver dúvidas sobre como contribuir:

- Abra uma issue com a tag `question`
- Entre em contato: seu.email@example.com

## 🙏 Agradecimentos

Toda contribuição é valiosa! Obrigado por ajudar a melhorar este projeto.

---

Feito com ❤️ pela comunidade
