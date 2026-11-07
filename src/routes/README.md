# Routes

Este diretório usa React Router com rotas declaradas em `AppRoutes.tsx`.

## Estrutura

- `AppRoutes.tsx`: define as rotas da aplicação (`/`, `/login`, `/signup`) e o redirecionamento de fallback.
- `PrivateRoute.tsx`: protege rotas que exigem uma sessão Firebase, incluindo visitantes anônimos.
- `RotaNaoVisitante.tsx`: restringe perfil e colaboradores a contas autenticadas de verdade.
