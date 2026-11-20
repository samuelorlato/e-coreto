# e-Coreto
> Uma plataforma para o morador propor, apoiar e acompanhar melhorias no seu bairro, e para o poder público responder de forma transparente.

**e-Coreto** é uma plataforma de participação cidadã hospedada pela prefeitura e voltada aos moradores de um mesmo bairro. Qualquer morador pode propor uma melhoria, os vizinhos votam a favor ou contra, e quando uma proposta reúne apoio suficiente ela chega às autoridades, que analisam, decidem e **respondem publicamente**. Do primeiro voto à obra concluída, tudo fica registrado e visível.

---

## Sumário

1. [A proposta em 6 critérios](#1-a-proposta-em-6-critérios)
2. [ODS da ONU](#2-ods-da-onu)
3. [Perfis de usuário](#3-perfis-de-usuário)
4. [Como funciona: a jornada de uma proposta](#4-como-funciona-a-jornada-de-uma-proposta)
5. [Regras de negócio](#5-regras-de-negócio)
6. [Parâmetros configuráveis](#6-parâmetros-configuráveis)
7. [Privacidade e segurança](#7-privacidade-e-segurança)
8. [Visão técnica](#8-visão-técnica)
9. [Como executar](#9-como-executar)
10. [Uso de IA generativa](#10-uso-de-ia-generativa)
11. [Equipe e vídeo pitch](#11-equipe-e-vídeo-pitch)

---

## 1. A proposta em 6 critérios

### 1.1 Quem é o cidadão beneficiado
Os **moradores do bairro** (especialmente os que hoje não têm tempo, meios ou conhecimento para participar de audiências e reuniões presenciais) e as **autoridades locais**, que passam a ter um retrato claro do que a comunidade quer, com dados de apoio e de localização.

### 1.2 Qual problema será resolvido
As decisões locais costumam ser tomadas sem ouvir quem mora no lugar. Faltam um canal simples para propor melhorias e uma forma de saber se a ideia foi analisada, aprovada, recusada ou executada. O resultado é desconfiança, ideias que se perdem e recursos aplicados longe das prioridades reais.

### 1.3 Como a solução vai funcionar
1. O morador se cadastra com seu endereço e cria uma **proposta**, com título, resumo, texto completo e categorias.
2. Os vizinhos **votam a favor ou contra**.
3. Ao atingir o **limiar de apoio** (quórum mínimo de votos e maioria a favor), a proposta é encaminhada automaticamente à prefeitura.
4. A **autoridade** analisa, aprova ou recusa e publica uma **resposta oficial**, que não pode ser editada, para manter a transparência.
5. Propostas aprovadas seguem para execução e conclusão, com cada mudança de situação registrada.

### 1.4 Quais tecnologias serão usadas
Java com acesso a banco via JDBC (camadas Model, DAO, Service e API REST), banco relacional Oracle, API com JAX-RS/Jersey sobre servidor Grizzly e interface web em React, Tailwind CSS e Vite, responsiva e com tema claro e escuro. Detalhes na [seção 8](#8-visão-técnica).

### 1.5 Quem participa do ecossistema
- **Moradores**: propõem, votam e acompanham.
- **Autoridades** (vereadores, secretarias, gabinete): analisam, decidem e respondem.
- **Prefeitura**: hospeda a plataforma e valida os endereços.
- **Associações de bairro e ONGs**: mobilizam moradores e ajudam quem tem menos acesso digital.
- **Órgãos de controle e imprensa local**: acompanham o histórico público de decisões.

### 1.6 Como o impacto será medido e ampliado
**Medição** (todos os indicadores saem de consultas SQL sobre os dados da própria plataforma):

| Indicador | O que mostra |
|---|---|
| Taxa de participação (moradores que votaram ÷ moradores cadastrados) | Engajamento da comunidade |
| Propostas que atingiram o limiar de apoio | Qualidade e força das ideias |
| Tempo médio entre criação, decisão e execução | Agilidade do poder público |
| Percentual de propostas respondidas pelas autoridades | Transparência |
| Taxa de execução de propostas aprovadas | Resultado concreto |
| Votos por região (rua, CEP) e por categoria | Onde estão as demandas |

**Ampliação:** como os critérios de apoio são parâmetros configuráveis e as categorias são criadas pelos próprios moradores, replicar a plataforma para outro bairro ou cidade é cadastrar novos dados, não reescrever código. O passo seguinte previsto é suportar vários bairros numa mesma instalação.

---

## 2. ODS da ONU

| ODS | Como o projeto contribui |
|---|---|
| **11. Cidades e comunidades sustentáveis** (principal) | Gestão participativa do território: moradores influenciam o planejamento e a zeladoria do bairro (meta 11.3). |
| **10. Redução das desigualdades** | Dá voz igual a todos, com um voto por pessoa, e inclui quem não frequenta os espaços formais de decisão (meta 10.2). |
| **9. Indústria, inovação e infraestrutura** | Infraestrutura digital pública que conecta cidadãos e governo com dados abertos à decisão. |

---

## 3. Perfis de usuário

| Perfil | Como entra | O que pode fazer |
|---|---|---|
| **Morador** (`RESIDENT`) | Cadastro público com endereço | Criar e editar as próprias propostas, votar, criar categorias, acompanhar tudo |
| **Autoridade** (`AUTHORITY`) | Cadastrada pela administração (nunca por autocadastro) | Tudo o que o morador faz, mais: mudar o status das propostas, arquivar, publicar respostas oficiais e ajustar parâmetros |

O voto de uma autoridade vale **o mesmo** que o de um morador.

---

## 4. Como funciona: a jornada de uma proposta

```
Coletando apoio ──► Aguardando análise ──► Em análise ──► Aprovada ──► Em execução ──► Concluída
                         │                     │
                         └──────────┬──────────┘
                                    ▼
                                Recusada (arquivada)
```

| Situação | Código | Significado |
|---|---|---|
| Coletando apoio | `COLLECTING_VOTES` | Aberta a votos. Ainda não atingiu o limiar. |
| Aguardando análise | `AWAITING_REVIEW` | Atingiu o limiar e espera as autoridades. Passagem automática. |
| Em análise | `UNDER_REVIEW` | Uma autoridade está avaliando. Votos congelados. |
| Aprovada | `APPROVED` | A prefeitura aceitou a proposta. |
| Recusada | `REJECTED` | A prefeitura recusou, com resposta pública. Fica arquivada. |
| Em execução | `IN_PROGRESS` | A proposta está sendo realizada. |
| Concluída | `COMPLETED` | Realizada. |

**Arquivar** é independente da situação: a proposta sai da lista principal, mas continua disponível para consulta, com todo o histórico. Nada é apagado de verdade.

---

## 5. Regras de negócio

### Cadastro e perfis
- **RN-01** Só moradores se cadastram pela plataforma. Autoridades entram por carga administrativa.
- **RN-02** O e-mail é único. A senha nunca é guardada em texto: só um hash com sal.
- **RN-03** Todo usuário tem endereço. Numa versão futura, o endereço seria validado por geolocalização para garantir que a pessoa mora no bairro.

### Propostas
- **RN-04** Qualquer usuário cria propostas com título, resumo, texto completo e de 1 a 3 categorias.
- **RN-05** Toda proposta nasce em *Coletando apoio*.
- **RN-06** Só o **autor** edita a proposta, e **somente enquanto ela coleta apoio**. Assim ninguém troca o conteúdo depois que as pessoas já votaram.

### Categorias
- **RN-07** Qualquer usuário cria categorias, que ficam disponíveis a todos. O nome é único, sem distinguir maiúsculas nem acentos ("Saúde" e "saude" são a mesma). Só o criador ou uma autoridade pode editar ou remover, e apenas se nenhuma proposta a usa.

### Votação
- **RN-08** Cada usuário tem **um voto por proposta**, a favor ou contra, e pode votar em quantas propostas quiser.
- **RN-09** O voto pode ser alterado ou retirado enquanto a proposta estiver em *Coletando apoio* ou *Aguardando análise*. Depois disso, fica congelado.
- **RN-10** Cada voto guarda o **endereço do votante no momento do voto**, para relatórios por região, mesmo que ele se mude depois.

### Limiar de apoio
- **RN-11** Uma proposta atinge o limiar quando cumpre **as duas** condições:
    1. **Quórum:** número de votos ≥ o *maior* entre o piso mínimo e uma porcentagem do total de moradores cadastrados;
    2. **Maioria:** pelo menos **60%** dos votos computados são a favor.
- **RN-12** Ao atingir o limiar, a proposta passa sozinha para *Aguardando análise* e **não volta atrás**, mesmo que votos mudem depois.
- **RN-13** O quórum é dinâmico: acompanha o crescimento da base de moradores. O piso evita que, no início, uma ou duas pessoas decidam.

### Decisão das autoridades
- **RN-14** Só autoridades mudam a situação, seguindo o fluxo da seção 4.
- **RN-15** Uma proposta só pode ser **recusada depois de atingir o limiar**. Ao recusar, ela é arquivada automaticamente.
- **RN-16** Uma proposta que **não atingiu o limiar** depois de muito tempo (padrão: 90 dias) pode ser arquivada por uma autoridade.

### Respostas oficiais
- **RN-17** Só autoridades publicam respostas, e apenas em propostas *Aprovadas*, *Recusadas*, *Em execução* ou *Concluídas*. Servem para explicar o motivo da recusa, os próximos passos, o andamento etc.
- **RN-18** Uma resposta **nunca é editada nem apagada**, para preservar o registro do que a autoridade disse. Se precisar se retratar ou atualizar, a autoridade publica uma nova resposta.
- **RN-19** Cada resposta registra a situação da proposta no momento da publicação.

### Transparência
- **RN-20** Toda mudança de situação é registrada (de qual para qual, quem fez e quando). Mudanças automáticas aparecem como feitas pelo sistema.

---

## 6. Parâmetros configuráveis

As autoridades podem ajustar estes valores sem alterar o código:

| Parâmetro | Padrão | Função |
|---|---|---|
| `quorum_percentage` | 10 | % do total de moradores cadastrados que precisa votar |
| `min_votes_floor` | 5 | Piso absoluto de votos, válido enquanto a base é pequena |
| `approval_percentage` | 60 | % mínimo de votos a favor sobre os votos computados |
| `stale_after_days` | 90 | Dias sem atingir o limiar até a proposta poder ser arquivada |
| `max_categories_per_proposal` | 3 | Máximo de categorias por proposta |

---

## 7. Privacidade e segurança

- Senhas guardadas com hash e sal (SHA-256 nesta versão de demonstração).
- O endereço serve para confirmar o vínculo com o bairro e para relatórios agregados por região. Os votos individuais não são expostos aos demais usuários.
- Ações restritas (decidir, arquivar, responder, alterar parâmetros) são verificadas na camada de serviço pelo perfil do usuário.

---

## 8. Visão técnica

| Camada | Tecnologia |
|---|---|
| Linguagem (back-end) | Java |
| Banco de dados | Oracle, acessado via JDBC |
| API | JAX-RS (`jakarta.ws.rs`) com Jersey, sobre Grizzly HttpServer |
| Interface | React 19, Tailwind CSS 4, Vite e React Router; responsiva, com tema claro e escuro |

**Organização do código do back-end** (camadas separadas, cada uma no seu pacote):

```
config/     conexão com o banco e inicialização do servidor
dao/        acesso a dados via JDBC (um DAO por entidade)
exception/  exceções de negócio e mapeamento para mensagens claras
model/      entidades e enums (BaseEntity, User, Resident, Authority, Proposal, ...)
resource/   endpoints REST (JAX-RS)
security/   hash de senha e autenticação
service/    regras de negócio (limiar de apoio, permissões, transições de status)
tools/      utilitários (DatabaseSetup, SeedPasswordGenerator)
```

O **front-end** fica em `web/` e está documentado em [`web/README.md`](web/README.md). Ele consome a API descrita em [`docs/api.md`](docs/api.md).

O `script.sql` fica em `database/script.sql`.

**Modelo de dados** (identificadores UUID, todas as tabelas com `created_at` e `updated_at`):

`users` · `addresses` · `proposals` · `categories` · `proposal_categories` (N:N) · `votes` (N:N com atributos) · `official_responses` · `proposal_status_history` · `system_settings`

Os diagramas estão em [`docs/`](docs/):
- `docs/class-diagram.png`: diagrama de classes (UML)
- `docs/er-diagram.png`: diagrama entidade-relacionamento

---

## 9. Como executar

O sistema tem três partes que sobem nesta ordem: **banco de dados → API (back-end) → interface (front-end)**. A API e a interface ficam rodando ao mesmo tempo, cada uma no seu terminal.

### Pré-requisitos

| Item | Versão |
|---|---|
| Java | 17 ou superior |
| Maven | 3.6.3 ou superior |
| Node.js (com npm) | 20.19 ou superior (ou 22.12+) |
| Banco Oracle | acesso a um schema (URL, usuário e senha) |

### 9.1 Banco de dados

1. **Configure a conexão.** Na pasta `src/main/resources/`, copie `application-local.properties.example` para `application-local.properties` e preencha `db.url`, `db.user` e `db.password` com as suas credenciais. Exemplo de formato da URL: `jdbc:oracle:thin:@oracle.fiap.com.br:1521:ORCL`.
   *(Alternativa: definir as variáveis de ambiente `DB_URL`, `DB_USER` e `DB_PASSWORD`, que têm precedência sobre os arquivos.)*
2. **Crie as tabelas e a carga inicial.** Na **raiz do projeto**:

   ```
   mvn compile exec:java -Dmain.class=br.com.fiap.ecoreto.tools.DatabaseSetup
   ```

   O programa executa o `database/script.sql` e, ao final, lista a quantidade de linhas por tabela. Se algo falhar, mostra o comando com erro e a mensagem do Oracle.

> ⚠️ O script **recria as tabelas do projeto do zero** (apaga as existentes com o mesmo nome). Use um schema dedicado. Também é possível executar o `database/script.sql` como *script* inteiro em um cliente SQL (SQL Developer: F5; DBeaver: Alt+X).

### 9.2 API (back-end)

Ainda na raiz do projeto:

```
mvn compile exec:java
```

A API sobe em `http://localhost:8080/api/`. **Deixe este terminal aberto.** Para trocar a porta, altere `server.port` no arquivo de propriedades (e ajuste `VITE_API_URL` no front, veja abaixo).

### 9.3 Interface (front-end)

Em **outro terminal**:

```
cd web
npm install
```

Para a interface conversar com a API real (modo **integrado**, o que grava e lê do Oracle), crie o arquivo `web/.env.local` com o conteúdo:

```
VITE_USE_MOCK=false
```

Se a API estiver em outro endereço, acrescente também `VITE_API_URL=http://localhost:8080/api` (este é o valor padrão). Depois:

```
npm run dev
```

Acesse **http://localhost:5173**.

> Se você criar ou alterar o `.env.local` com o servidor já rodando, pare-o (`Ctrl+C`) e rode `npm run dev` novamente.

**Dois modos de uso do front:**

| Modo | Como ativar | Dados | Quando usar |
|---|---|---|---|
| **Integrado** (recomendado) | `VITE_USE_MOCK=false` em `web/.env.local` | Oracle, via API Java | Uso normal e apresentação do sistema completo |
| **Simulado** | padrão (sem `.env.local`) | API simulada no navegador, com os dados do `script.sql`; alterações ficam no `localStorage` | Ver a interface sem Java nem Oracle. O link **Restaurar**, no rodapé, volta tudo ao estado inicial |

Outros comandos úteis do front: `npm run build` (gera `web/dist/`) e `npm run preview` (serve o build). Detalhes em [`web/README.md`](web/README.md).

### 9.4 Contas de demonstração

Valem no banco (`script.sql`) e na API simulada. **Senha de todas: `Demo@2026`.**

| Perfil | E-mail |
|---|---|
| Autoridade | `helena.duarte@prefeitura.exemplo.br` |
| Autoridade | `carlos.mendes@prefeitura.exemplo.br` |
| Morador | `ana.souza@email.exemplo.br` (e os demais moradores de demonstração) |

### 9.5 Problemas comuns

| Sintoma | Causa provável | O que fazer |
|---|---|---|
| "Não foi possível conectar ao banco" ao rodar o `DatabaseSetup` | URL, usuário ou senha incorretos | Conferir `db.url`, `db.user` e `db.password` |
| Erro `ORA-…` durante o script | Usuário sem permissão de criar tabelas ou views | Usar um schema com `CREATE TABLE` e `CREATE VIEW` |
| Porta 8080 ocupada | Outro programa usando a porta | Mudar `server.port` e ajustar `VITE_API_URL` |
| O front mostra erro de conexão com o servidor | API fora do ar ou endereço errado | Subir a API (9.2) e conferir `VITE_API_URL` |
| Votei no front, mas nada muda no banco | Front no modo simulado | Criar `web/.env.local` com `VITE_USE_MOCK=false` e reiniciar o `npm run dev` |
| Mudei o `.env.local` e nada mudou | O servidor do front não foi reiniciado | `Ctrl+C` e `npm run dev` de novo |
| `npm install` ou `npm run dev` falha | Node.js antigo | Atualizar para 20.19+ |

---

## 10. Uso de IA generativa

Declaração das ferramentas de IA usadas no projeto e da finalidade de cada uma:

| Ferramenta | Para quê foi usada |
|---|---|
| Claude (Anthropic) | Brainstorm e escolha da ideia; revisão das regras de negócio e da modelagem de dados (UML e ER); estrutura do projeto e das configurações; geração do `script.sql` (esquema e carga inicial), do `DatabaseSetup` e dos utilitários de senha; rascunho desta documentação; apoio à implementação do back-end (DAOs, services e endpoints) e do front-end (`web/`). |

Todo código e texto gerado com apoio de IA foi lido, testado, revisado e compreendido pela equipe antes de ser incorporado. As decisões de projeto (ideia, regras de negócio e modelagem) são do grupo.

---

## 11. Equipe e vídeo pitch

- **Grupo 5**
- **Integrantes:**
    - RM 562076 - Samuel Trevisan Orlato
    - RM 564281 - Gabriel Kenji Yoshida Fudizachi
    - RM 565879 - Jhonatan Talaveiro Pacheco
    - RM 561510 - Nathan de Melo Soares
    - RM 563597 - Davyd Neves Evangelista da Silva
- **Vídeo pitch:** https://www.youtube.com/watch?v=sPpOCyvBtTQ