# Rota Certa Pro

IMPORTANTE — TRABALHE COM ECONOMIA DE CRÉDITOS:

Este projeto pode ultrapassar os créditos gratuitos disponíveis nesta sessão. Por isso:

- Priorize entregar o máximo de funcionalidade possível dentro dos créditos que você tiver agora, seguindo a ordem de prioridade definida ao final deste prompt.

- Não corte a estrutura de pastas nem a separação de services para economizar créditos — a arquitetura descrita abaixo deve ser respeitada mesmo que o projeto fique incompleto.

- Quando eu disser "continue", retome exatamente do ponto em que parou, sem refazer o que já está pronto, seguindo a mesma ordem de prioridade.

Ordem de prioridade para construir o projeto (do essencial ao complementar):

1. Configuração base do projeto (Vite + React + Router), estrutura de pastas completa (mesmo que alguns arquivos fiquem só com esqueleto/comentário do que farão), firebase/config.js e AuthContext

2. services/authService.js e userService.js + páginas LoginPage e SignupPage funcionando (cadastro e login reais)

3. services/clientService.js (CRUD completo) + hook useClients

4. HomePage com Header, barra de busca e ClientList/ClientRow renderizando dados reais do Firestore

5. Sidebar com os estados logado/deslogado e AddClientModal funcional (criar cliente)

6. ClientDetailModal com botão "Abrir mapa" e exibição de createdAt/updatedAt/createdBy/updatedBy

7. Edição de cliente (reaproveitando o formulário em modo edição) restrita a usuário logado

8. Regras do Firestore (firestore.rules)

9. Configuração de PWA (manifest + service worker)

10. Refinamento visual final (tema escuro, estados de foco, responsividade fina)

---

Crie um projeto Vite + React (JavaScript ou TypeScript) chamado "Rota Certa": um sistema de cadastro e consulta de clientes/endereços para uma equipe de campo, integrado ao Firebase (Auth + Firestore), com suporte a PWA.

## Stack e configuração geral

- Vite + React + React Router DOM

- Firebase: Authentication (email/senha) e Firestore como banco de dados

- vite-plugin-pwa configurado com manifest (nome "Rota Certa", ícone com pino de mapa, theme_color #0f6f6e, background_color #eef1ec) e service worker com cache das rotas principais e da última lista de clientes carregada, para que usuários deslogados e logados tenham carregamento rápido mesmo com conexão instável

- Variáveis de ambiente (.env) para as chaves do Firebase, nunca hardcoded

- Estado global de autenticação via Context API (AuthContext), expondo: usuário atual, uid, loading e funções de login/logout/cadastro

## Estrutura de pastas

Organize o projeto separando claramente UI de lógica de dados:

src/

  main.jsx

  App.jsx

  routes/

    AppRoutes.jsx

  contexts/

    AuthContext.jsx

  firebase/

    config.js              -> inicialização do app Firebase (auth, firestore)

  services/

    authService.js          -> login(email, senha), logout(), cadastrarUsuario(dados), observarUsuarioLogado(callback)

    clientService.js         -> criarCliente(dados, uid), listarClientes(), buscarClientePorId(id), atualizarCliente(id, dados, uid), excluirCliente(id), observarClientes(callback) [onSnapshot em tempo real]

    userService.js            -> criarPerfilUsuario(uid, dados), buscarUsuario(uid)

  hooks/

    useAuth.js

    useClients.js             -> encapsula listarClientes/observarClientes + estado de loading/erro para os componentes consumirem

  pages/

    HomePage.jsx

    LoginPage.jsx

    SignupPage.jsx

  components/

    layout/

      Header.jsx

      Sidebar.jsx

    clients/

      ClientList.jsx

      ClientRow.jsx

      ClientSearchBar.jsx

      ClientDetailModal.jsx

      AddClientModal.jsx

    common/

      Modal.jsx

      Button.jsx

      ProtectedAction.jsx     -> componente/wrapper que só renderiza os filhos (ex: botão editar) se houver usuário logado

  utils/

    formatDate.js

    mapLinks.js                -> gera a URL do Google Maps a partir de coordenada OU de rua+número

    validators.js               -> validação de whatsapp, campos obrigatórios etc.

Regra importante: nenhum componente de página ou modal deve chamar o Firestore/Firebase Auth diretamente. Toda leitura e escrita passa pelos arquivos dentro de services/, e os componentes consomem esses serviços através dos hooks (useAuth, useClients) ou chamando os services diretamente nos handlers de submit.

## Modelo de dados no Firestore

Coleção "clientes":

{

  nomeCliente: string (obrigatório),

  nomeComercio: string | null,

  rua: string (obrigatório),

  numero: string,

  complemento: string | null,

  whatsapp: string,

  coordenada: { lat: number, lng: number } | null,   // preenchida apenas quando o endereço não é conhecido

  createdAt: timestamp (serverTimestamp no create),

  updatedAt: timestamp (serverTimestamp em toda escrita),

  createdBy: string (uid de quem criou, nunca sobrescrever),

  updatedBy: string (uid de quem fez a última alteração)

}

Coleção "usuarios":

{

  nome: string,

  email: string,

  createdAt: timestamp,

  updatedAt: timestamp

}

## Regras de segurança do Firestore (gere o firestore.rules também)

- Leitura da coleção "clientes": pública, sem necessidade de autenticação

- Criação e atualização de "clientes": apenas usuários autenticados (request.auth != null); ao criar, createdBy deve ser igual ao uid do usuário autenticado; updatedBy sempre igual ao uid de quem está fazendo a alteração

- Coleção "usuarios": cada usuário só pode ler/criar/editar o próprio documento (uid do documento == request.auth.uid)

## Fluxo de autenticação

- LoginPage: formulário de email e senha, usa authService.login(); em caso de sucesso, redireciona para "/"

- SignupPage: formulário de cadastro (nome, email, senha), usa authService.cadastrarUsuario() que cria o usuário no Auth e o perfil correspondente em "usuarios" via userService; após cadastro, também redireciona para "/"

- Usuário deslogado navegando em "/" deve continuar tendo acesso de leitura normalmente

## Layout e componentes (comportamento funcional)

Header (fixo no topo, sempre visível):

- Botão de menu (ícone hambúrguer) que abre a Sidebar

- Barra de busca visível para qualquer usuário (logado ou não), que filtra a lista de clientes por nomeCliente, nomeComercio ou rua, em tempo real (client-side sobre os dados já carregados por useClients)

Sidebar (menu lateral deslizante, com overlay escuro por trás):

- Se deslogado: mostra apenas o botão "Entrar", que navega para /login

- Se logado: mostra o botão "Adicionar nova localização" (abre AddClientModal) e o botão "Sair" com a fonte em vermelho (chama authService.logout() e redireciona para "/")

AddClientModal (só acessível estando logado):

- Campos: nome do cliente, nome do comércio, rua, número, complemento, WhatsApp, latitude e longitude (os dois últimos opcionais, usados apenas quando o endereço não é conhecido)

- Botões "Salvar" (chama clientService.criarCliente, passando o uid do usuário logado) e "Cancelar" (fecha sem salvar)

- Validação: nomeCliente e rua obrigatórios; os demais opcionais

ClientList / ClientRow (lista principal):

- Cada item mostra: nome do cliente em destaque (fonte maior), e logo abaixo o nome do comércio em fonte menor, apenas se nomeComercio existir

- Ao clicar em um cliente, abre ClientDetailModal com os dados completos

ClientDetailModal:

- Mostra todos os campos do cliente, incluindo createdAt, updatedAt, createdBy e updatedBy formatados de forma legível

- Botão "Abrir mapa", com ícone de mapa/pino bem destacado visualmente (cor de destaque própria, diferente do resto da UI), que monta a URL do Google Maps: se houver coordenada, usa lat/lng; caso contrário, monta a busca por rua + número (função utilitária em utils/mapLinks.js) e abre em nova aba

- Se o usuário estiver logado: mostra um botão "Alterar dados" que permite editar e salvar (reaproveitar o mesmo formulário do AddClientModal em modo edição, chamando clientService.atualizarCliente)

- Se o usuário estiver deslogado: não mostra opção de edição, apenas uma mensagem discreta indicando que é preciso entrar na conta para alterar os dados

## Sistema de design (siga isto, não use o visual padrão de SaaS com cards arredondados e sombra genérica)

- Paleta: fundo #eef1ec (papel esverdeado claro), superfícies #ffffff, texto principal #16211f, texto secundário #56635f, texto terciário #8b968f, linhas divisórias #d7ddd4

- Cor primária de interação: verde-petróleo #0f6f6e (hover #0b4f4f)

- Cor de destaque exclusiva para tudo relacionado a mapa/localização (ícone de pino, botão "Abrir mapa"): laranja-queimado #b34700, com fundo #fbe9dd

- Cor de perigo (botão "Sair" e ações destrutivas): vermelho #ac2b1f

- Suporte a tema escuro via prefers-color-scheme, invertendo os tokens de cor mantendo o mesmo esquema (petróleo/laranja/vermelho em tons mais claros sobre fundo escuro)

- Tipografia: "Archivo" (peso 600-800) para títulos e nome do cliente na lista; "Inter" para textos e formulários; "IBM Plex Mono" para dados técnicos (coordenadas, WhatsApp, datas de criação/alteração)

- Lista de clientes em formato de linhas com divisórias finas (não usar cards com sombra); o ícone de mapa em cada linha usa a cor laranja de destaque

- Modais deslizam de baixo para cima em telas pequenas e aparecem centralizados em telas maiores

- Interface totalmente em português do Brasil, com foco visível em todos os elementos interativos (acessibilidade de teclado) e responsiva do mobile ao desktop

Gere o projeto seguindo a ordem de prioridade definida no início deste prompt, respeitando a estrutura de pastas, os services implementados com as funções de CRUD descritas, os componentes conectados a eles pelos hooks, as regras do Firestore e a configuração de PWA.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/e6cda284-2491-4fe8-915a-70ba9d45569b).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
