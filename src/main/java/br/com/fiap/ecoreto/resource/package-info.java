/**
 * Endpoints REST (JAX-RS), base {@code /api}.
 *
 * <p>Regras da camada:
 * <ul>
 *   <li>Só converte HTTP/JSON ↔ chamadas de service: lê path, query e corpo (DTOs do subpacote dto),
 *       chama o service e devolve o DTO de resposta.</li>
 *   <li>Sem regra de negócio e sem SQL.</li>
 *   <li>O usuário logado vem de {@code CurrentUser.from(securityContext)}, nunca de um id enviado pelo front.</li>
 *   <li>Criação devolve 201; remoção devolve 204; erros saem pelos ExceptionMappers.</li>
 * </ul>
 */
package br.com.fiap.ecoreto.resource;
