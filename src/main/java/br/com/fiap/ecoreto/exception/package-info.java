/**
 * Exceções de negócio e ExceptionMappers (um por exceção).
 *
 * <p>Contrato: toda falha devolve {@code { "status", "message", "details" }}.
 * <ul>
 *   <li>{@link br.com.fiap.ecoreto.exception.ValidationException} → 400</li>
 *   <li>{@link br.com.fiap.ecoreto.exception.ForbiddenException} → 403</li>
 *   <li>{@link br.com.fiap.ecoreto.exception.NotFoundException} → 404</li>
 *   <li>{@link br.com.fiap.ecoreto.exception.ConflictException} → 409</li>
 *   <li>{@link br.com.fiap.ecoreto.exception.DataAccessException} e inesperadas → 500, sem o texto do Oracle</li>
 * </ul>
 * O 401 é devolvido direto pelo BasicAuthFilter. Mensagens para o usuário em português.
 */
package br.com.fiap.ecoreto.exception;
