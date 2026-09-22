# Mack ENADE — Piloto PWA

Aplicação full-stack React + Node/Express preparada para o piloto Mack ENADE.

## Autenticação do piloto

- E-mail cadastrado + `access_code` individual.
- Usuários são lidos das abas `students` e `professors` do Google Sheets.
- `login_active` deve ser `TRUE`.
- Para estudantes, `pilot_eligible` também deve ser `TRUE` quando a coluna estiver presente.
- A sessão é individual por navegador e usa cookie assinado `HttpOnly`.
- Não há dependência de Microsoft Entra/MSAL neste piloto.

## Banco do piloto

Google Sheets privado, acessado **somente pelo backend** via Google Sheets API + Service Account.

Spreadsheet ID configurado no ambiente:

`MACK_ENADE_SPREADSHEET_ID=1s821ayXfONNpZkcQ3loP--MINepO0IybpkeUB0_ZNDs`

Consulte `DEPLOY_PILOT.md` para configurar a Service Account e publicar.

## PWA

O app usa `vite-plugin-pwa` e inclui:

- manifest instalável;
- ícones 192, 512 e maskable;
- modo `standalone`;
- service worker;
- APIs privadas configuradas como `NetworkOnly`;
- fluxo de instalação/atualização no app.

## Desenvolvimento local

1. Instale Node.js 22+.
2. Execute `npm install`.
3. Copie `.env.example` para `.env` e preencha os segredos.
4. Execute `npm run dev`.

## Build

`npm run build`

## Start de produção

`NODE_ENV=production npm start`

## Segurança

Nunca coloque `GOOGLE_SERVICE_ACCOUNT_JSON`, `SESSION_SECRET` ou `GEMINI_API_KEY` em variáveis iniciadas por `VITE_`.
Nunca publique a planilha com acesso "qualquer pessoa com o link" enquanto ela contiver e-mails e códigos de acesso.
