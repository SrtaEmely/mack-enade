# Correções aplicadas para o piloto

- Login deixou de iniciar autenticado por padrão.
- Removidos atalhos para alternar Estudante/Professor no frontend.
- Removidas contas/códigos de teste da tela de login e do modo PILOT.
- Autenticação agora usa e-mail + access code do Google Sheets.
- Removido estado global de usuário autenticado no servidor.
- Adicionadas sessões individuais assinadas em cookie HttpOnly.
- Adicionados middlewares `requireAuth` e `requireRole` em rotas sensíveis.
- Rotas administrativas protegidas para COORDINATOR/ADMIN.
- Google Sheets deixou de usar GViz/CSV público e passou a usar Google Sheets API no backend.
- Adicionado suporte a Service Account por `GOOGLE_SERVICE_ACCOUNT_JSON`.
- Escrita de perguntas, códigos de acesso, status de login e prêmios passa a persistir na planilha.
- Perguntas DRAFT/PENDING/REJECTED não são entregues a estudantes.
- Estudantes recebem questões e prêmios filtrados pelo próprio curso.
- Códigos de acesso não são devolvidos por APIs administrativas.
- Removidos códigos de acesso padrão/fallback.
- Adicionado rate limiting básico ao login.
- Cloud Run passa a usar `process.env.PORT`.
- Removido manifest PWA estático duplicado; `vite-plugin-pwa` é a fonte canônica.
- Mantidos PWA, ícones, service worker, instalação e atualização.

## Validação realizada neste ambiente

Foi executada uma validação estática de TypeScript/TSX focada em erros de sintaxe e não foram encontrados erros de parser nas alterações.

A instalação completa de dependências (`npm install`) não terminou neste ambiente por timeout de rede. Portanto, execute `npm install` e `npm run build` no Google AI Studio/Cloud Run ou localmente antes de liberar o piloto.
