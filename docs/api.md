# API e-Coreto: contrato para o front

Base: `http://localhost:8080/api`. Corpo e resposta em JSON. Toda rota exige `Authorization: Basic base64(email:senha)` (o `web/js/api.js` já faz isso depois de `Api.login(...)`), **exceto** `POST /users`.

Erros sempre no formato `{ "status": 409, "message": "...", "details": [] }`. Mostre `message` ao usuário e, se houver, a lista `details` (problemas campo a campo).

Ids são UUID em texto. Datas vêm como `"2026-11-18T17:42:00"`.

## Login

Não existe rota de login: o front guarda a credencial com `Api.login(email, senha)` e confere chamando `GET /users/me`. Se der 401, a senha está errada → `Api.logout()`.

```js
Api.login(email, senha);
try { const me = await Api.get('/users/me'); } catch (e) { if (e.status === 401) Api.logout(); }
```

## Usuários

| Método | Rota | Corpo | Resposta |
|---|---|---|---|
| POST | `/users` | ver abaixo | 201 + usuário |
| GET | `/users/me` | — | usuário |
| PUT | `/users/me/address` | endereço | usuário |

```json
{
  "firstName": "Ana", "lastName": "Souza", "email": "ana@email.com", "password": "minhasenha",
  "address": { "street": "Rua das Palmeiras", "streetNumber": "45", "complement": null,
               "neighborhood": "Jardim das Acácias", "city": "São Paulo", "state": "SP", "zipCode": "04010-200" }
}
```

Usuário devolvido: `id, firstName, lastName, fullName, email, role (RESIDENT|AUTHORITY), authority (boolean), jobTitle, department, address{...}, createdAt`. Use `authority` para mostrar/esconder os botões de autoridade.

## Categorias

| Método | Rota | Corpo |
|---|---|---|
| GET | `/categories` | — |
| POST | `/categories` | `{ "name": "Saúde" }` |
| PUT | `/categories/{id}` | `{ "name": "Saúde Pública" }` |
| DELETE | `/categories/{id}` | — (204) |

Nome repetido (sem diferenciar maiúscula/acento) → 409. Editar/remover só o criador ou autoridade (403), e só se nenhuma proposta usa (409).

## Propostas

| Método | Rota | Corpo |
|---|---|---|
| GET | `/proposals?status=&category=&archived=` | — |
| POST | `/proposals` | `{ "title", "description", "body", "categoryIds": ["uuid", ...] }` |
| GET | `/proposals/{id}` | — |
| PUT | `/proposals/{id}` | igual ao POST (só o autor, só em `COLLECTING_VOTES`) |
| POST | `/proposals/{id}/status` | `{ "status": "UNDER_REVIEW" }` (autoridade) |
| POST | `/proposals/{id}/archive` | `{}` (autoridade, só parada há `stale_after_days` dias) |
| GET | `/proposals/{id}/history` | — |

Filtros do GET: `status` (um dos códigos abaixo), `category` (id da categoria), `archived=true` para ver só as arquivadas (padrão: só as ativas).

Proposta devolvida: `id, title, description, body, status, statusLabel, createdBy, authorName, archived, archivedAt, archivedBy, categories[], votesInFavor, votesAgainst, votesTotal, createdAt, updatedAt`.

Transições que a autoridade pode fazer:

| De | Para |
|---|---|
| `AWAITING_REVIEW` | `UNDER_REVIEW`, `REJECTED` |
| `UNDER_REVIEW` | `APPROVED`, `REJECTED` |
| `APPROVED` | `IN_PROGRESS` |
| `IN_PROGRESS` | `COMPLETED` |

`COLLECTING_VOTES → AWAITING_REVIEW` é automática (ao atingir o limiar). `REJECTED` arquiva a proposta.

Histórico: `id, fromStatus, fromStatusLabel, toStatus, toStatusLabel, changedBy, changedByName ("Sistema" se automático), automatic, createdAt`.

## Votos

| Método | Rota | Corpo |
|---|---|---|
| GET | `/proposals/{id}/votes/summary` | — |
| PUT | `/proposals/{id}/votes/me` | `{ "type": "IN_FAVOR" }` ou `"AGAINST"` (cria ou altera) |
| DELETE | `/proposals/{id}/votes/me` | — |

As três devolvem o placar: `inFavor, against, total, requiredVotes, favorPercentage, approvalPercentage, quorumReached, majorityReached, thresholdReached, votingOpen, myVote (IN_FAVOR|AGAINST|null)`. Com `votingOpen = false` desabilite os botões de voto.

## Respostas oficiais

| Método | Rota | Corpo |
|---|---|---|
| GET | `/proposals/{id}/responses` | — |
| POST | `/proposals/{id}/responses` | `{ "content": "..." }` (autoridade; proposta aprovada, recusada, em execução ou concluída) |

Resposta: `id, proposalId, content, proposalStatus, proposalStatusLabel, createdBy, authorName, createdAt`. Não existe editar nem apagar.

## Parâmetros

| Método | Rota | Corpo |
|---|---|---|
| GET | `/settings` | — |
| PUT | `/settings/{key}` | `{ "value": 15 }` (autoridade) |

Chaves: `quorum_percentage`, `min_votes_floor`, `approval_percentage`, `stale_after_days`, `max_categories_per_proposal`.

## Relatórios (GET)

| Rota | Devolve |
|---|---|
| `/reports/ranking?limit=10` | lista: `id, title, status, inFavor, against, totalVotes` |
| `/reports/votes-by-region` | lista: `zipCode, street, neighborhood, totalVotes, inFavor, against` |
| `/reports/by-category` | lista: `id, name, proposals, totalVotes` |
| `/reports/avg-time` | objeto: `avgDaysToThreshold, avgDaysToDecision, avgDaysToExecution, avgDaysToCompletion` |
| `/reports/stale?days=90` | lista: `id, title, createdAt, daysOpen` |
| `/reports/participation` | objeto: `residents, residentsWhoVoted, participationRate, proposals, reachedThreshold, thresholdRate, decided, responded, responseRate, approved, completed, executionRate` (taxas em %) |
