# e-Coreto · Interface web

Front-end do e-Coreto em **React 19 + Tailwind CSS 4**, com **Vite** (servidor de desenvolvimento e build) e **React Router** (navegação com transições). Ícones: **lucide-react**. Animações só com CSS e recursos nativos do navegador, sem bibliotecas extras.

A interface foi construída a partir das entidades, das regras de negócio do [README principal](../README.md) e do contrato da API em [`docs/api.md`](../docs/api.md). Ela conversa com a **API Java** (`npm run dev`) e também tem um **modo demonstração** (`npm run dev:demo`) com uma API simulada no navegador: as mesmas rotas, respostas e mensagens de erro do back-end, com os dados do `database/script.sql`. Assim dá para usar e apresentar tudo mesmo sem Oracle.

## Como rodar

Pré-requisito: **Node.js 20.19+** (ou 22.12+).

### Com a API Java (integrado)

1. Na raiz do projeto, configure o Oracle e suba a API (seção 9 do [README principal](../README.md)): `mvn compile exec:java`. Ela fica em `http://localhost:8080/api`.
2. Em outro terminal:

```bash
cd web
npm install
npm run dev
```

3. Abra `http://localhost:5173`. O Vite repassa as chamadas `/api` para a porta 8080 (proxy), então não há configuração de CORS a fazer.

Na tela de login, "Entrar com uma conta de demonstração" lista as contas do `script.sql` (senha `Demo@2026`), por exemplo `helena.duarte@prefeitura.exemplo.br` (autoridade) e `ana.souza@email.exemplo.br` (moradora). Se a API estiver desligada, a tela avisa: "Não foi possível falar com a API. Confira se o back-end está rodando."

### Sem back-end (modo demonstração)

```bash
cd web
npm run dev:demo
```

Os dados alterados ficam no `localStorage` do navegador. O link **Restaurar** no rodapé ("Dados de demonstração") volta tudo ao estado do `script.sql`.

| Comando | O que faz |
|---|---|
| `npm run dev` | Front integrado à API Java (proxy `/api` → porta 8080) |
| `npm run dev:demo` | Front com a API simulada (sem back-end) |
| `npm run build` / `npm run build:demo` | Gera a versão final em `web/dist/` (integrada / demonstração) |
| `npm run preview` | Serve o `dist/` (com o mesmo proxy `/api`) |
| `npm run seed` | Regenera `src/mocks/seed.json` a partir de `database/script.sql` |

### Variáveis (opcionais, em `web/.env.local`)

| Variável | Padrão | Função |
|---|---|---|
| `API_PROXY_TARGET` | `http://localhost:8080` | Para onde o Vite repassa `/api` (dev e preview) |
| `VITE_API_URL` | `/api` | Endereço que o navegador chama. Num deploy sem proxy, use o endereço completo da API |
| `VITE_USE_MOCK` | `false` (`true` no `dev:demo`) | Liga a API simulada |
| `VITE_MOCK_DELAY` | `250` no dev, `0` no build | Atraso artificial (ms) das respostas simuladas |

Nenhuma tela sabe qual API está em uso: todas chamam `src/services/api.js`, que fala com `src/lib/http.js`.

### O que foi conferido na integração

Com a API Java rodando nesta máquina (sem banco configurado): preflight de CORS, 401 sem login, 400 com os mesmos erros campo a campo da validação Java, 404 em rota inexistente, proxy do Vite e as mensagens do front quando a API dá erro ou está desligada. As respostas têm o mesmo formato da API simulada. O fluxo completo com dados reais depende das credenciais do Oracle (veja a seção 9 do README principal).

## Visual e experiência

- **Limpo e dividido:** cada página tem uma coluna de leitura, seções separadas por espaço (não por caixas) e só o essencial à vista. Explicações saem da tela e vão para o tour.
- **Tour "Como funciona":** abre sozinho no primeiro acesso de cada pessoa (5 passos, com as regras do limiar em números atuais). Pode ser reaberto pelo menu da conta, pelo rodapé ou pelo "Como funciona?" da votação.
- **Tema claro e escuro:** segue o sistema na primeira visita; o botão de lua/sol no topo troca e lembra a escolha. As cores são tokens semânticos (`bg-canvas`, `text-fg`, `border-line`… em `src/index.css`), então cada tela funciona nos dois temas sem código extra.
- **Animações suaves (CSS):** transição entre páginas (View Transitions API, o título "voa" da lista para a proposta), números que rolam no placar, barras que crescem, entrada em cascata da lista. Quem configura "reduzir movimento" no sistema não vê animações.
- **Comemoração:** quando um voto faz a proposta atingir o limiar, aparece um confete (CSS puro) e um aviso de que ela foi para a prefeitura.
- **Lista por fases:** as 7 situações viram fases que o morador entende (Em votação, Na prefeitura, Em andamento, Concluídas, Arquivadas). Cada proposta mostra um anel com o progresso até o limiar; o voto acontece na página da proposta.

## Telas

| Rota | Tela | Quem |
|---|---|---|
| `#/login` | Login (contas de demonstração recolhidas) | Público |
| `#/cadastro` | Cadastro de morador em 2 etapas: dados e endereço | Público |
| `#/` | Propostas por fase, busca e categoria | Todos |
| `#/propostas/nova` | Nova proposta (título, resumo, texto, categorias, criar categoria na hora) | Todos |
| `#/propostas/:id` | Proposta: etapas, votação, ações da prefeitura, texto, respostas oficiais, histórico | Todos |
| `#/propostas/:id/editar` | Edição (só o autor, só em "Coletando apoio") | Autor |
| `#/indicadores` | Participação, tempos médios, mais apoiadas, por categoria, por região, paradas | Todos |
| `#/categorias` | Criar, renomear e remover categorias (com as regras de dono e uso) | Todos |
| `#/parametros` | Regras da votação; a prefeitura edita | Leitura: todos · Edição: autoridade |
| `#/perfil` | Dados, troca de endereço e suas propostas | Todos |
| `#/painel` | Filas da prefeitura: para analisar, em análise, aprovadas, em execução, sem resposta, paradas | Autoridade |

## Desempenho e acessibilidade (Lighthouse)

Medido no build de produção do modo demonstração (servido com compressão), Lighthouse 13, em todas as telas acima, logado como autoridade:

| Perfil | Desempenho | Acessibilidade | Boas práticas | SEO |
|---|---|---|---|---|
| Celular (tema claro) | 96–99 | 100 | 100 | 100 |
| Celular (tema escuro) | 97–99 | 100 | 100 | 100 |
| Computador | 100 | 100 | 100 | 100 |

O que ajuda a manter assim:

- **Uma página por arquivo:** cada rota é carregada sob demanda (`lazy` em `src/App.jsx`), então a primeira carga só baixa o necessário.
- **Leve por padrão:** fontes do sistema (nenhum arquivo de fonte para baixar) e nenhuma biblioteca de animação.
- **Sem pulos de layout:** páginas que dependem de vários dados aparecem de uma vez, e o rodapé fica abaixo da dobra.

Para medir de novo: gere o build, sirva o `dist/` (ex.: `npm run preview`) e rode o Lighthouse do Chrome (DevTools → Lighthouse) em cada rota.

## Estrutura

```
web/
├─ index.html            ponto de entrada (aplica o tema antes da pintura)
├─ public/               favicon.svg, robots.txt
├─ scripts/generate-seed.mjs   lê database/script.sql e gera o seed da API simulada
└─ src/
   ├─ main.jsx, App.jsx  inicialização e rotas (createHashRouter + páginas sob demanda)
   ├─ index.css          Tailwind, tokens de cor dos temas, animações e transições
   ├─ lib/               cliente HTTP, formatação pt-BR, situações/fases, validações
   ├─ services/api.js    uma função por rota de docs/api.md
   ├─ mocks/             API simulada: server.js (rotas e regras), db.js, crypto.js, seed.json
   ├─ context/           sessão, tema, avisos e tour
   ├─ hooks/             useApi, useThreshold (regras do limiar), useAnimatedNumber
   ├─ components/        layout, UI base, tour, comemoração e componentes de proposta
   └─ pages/             uma página por rota
```

## Decisões

- **Regras no front são só para a interface.** O front esconde o que não é permitido (ex.: editar fora de "Coletando apoio"), mas quem decide é o back-end, e os erros dele (`{status, message, details}`) são mostrados ao usuário.
- **Situação pode mudar com um voto.** Depois de votar, a tela recarrega a proposta e o histórico, porque o voto pode disparar a passagem automática para "Aguardando análise".
- **Cores "a favor" (#0d9488) e "contra" (#e34948)** foram validadas para daltonismo e contraste nos dois temas.
- **HashRouter (`#/rota`):** funciona em qualquer hospedagem estática sem configurar rotas no servidor.
