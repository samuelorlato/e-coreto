/**
 * Segurança: hash de senha e autenticação HTTP Basic.
 *
 * <ul>
 *   <li>{@link br.com.fiap.ecoreto.security.PasswordHasher}: Base64(SHA-256(salt || senha)), salt de 16 bytes.</li>
 *   <li>{@link br.com.fiap.ecoreto.security.BasicAuthFilter}: valida o header Authorization em toda
 *       requisição (exceto OPTIONS e POST /users) e coloca o usuário no SecurityContext.</li>
 *   <li>{@link br.com.fiap.ecoreto.security.CurrentUser}: lê o usuário logado dentro do resource.</li>
 * </ul>
 * A autorização por perfil (morador x autoridade) NÃO fica aqui: fica no service.
 */
package br.com.fiap.ecoreto.security;
