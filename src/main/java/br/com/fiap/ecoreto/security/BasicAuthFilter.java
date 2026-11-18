package br.com.fiap.ecoreto.security;

import br.com.fiap.ecoreto.exception.ErrorResponse;
import br.com.fiap.ecoreto.model.User;
import br.com.fiap.ecoreto.service.UserService;
import jakarta.annotation.Priority;
import jakarta.ws.rs.HttpMethod;
import jakarta.ws.rs.Priorities;
import jakarta.ws.rs.container.ContainerRequestContext;
import jakarta.ws.rs.container.ContainerRequestFilter;
import jakarta.ws.rs.core.HttpHeaders;
import jakarta.ws.rs.ext.Provider;

import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.Optional;

/**
 * Autenticação HTTP Basic: toda requisição envia
 * {@code Authorization: Basic base64(email:senha)}.
 *
 * <p>Liberadas sem credencial: requisições OPTIONS (preflight de CORS) e POST /users (cadastro).
 * Na falha devolve 401 SEM o header WWW-Authenticate, para o navegador não abrir a janela nativa de login.
 */
@Provider
@Priority(Priorities.AUTHENTICATION)
public class BasicAuthFilter implements ContainerRequestFilter {

    private static final String PREFIX = "Basic ";

    private final UserService userService = new UserService();

    @Override
    public void filter(ContainerRequestContext request) {
        if (isPublic(request)) {
            return;
        }

        String header = request.getHeaderString(HttpHeaders.AUTHORIZATION);
        if (header == null || !header.startsWith(PREFIX)) {
            abort(request, "Faça login para continuar.");
            return;
        }

        String email;
        String password;
        try {
            String decoded = new String(
                    Base64.getDecoder().decode(header.substring(PREFIX.length()).trim()),
                    StandardCharsets.UTF_8);
            int sep = decoded.indexOf(':');
            if (sep < 0) {
                abort(request, "Credenciais inválidas.");
                return;
            }
            email = decoded.substring(0, sep).trim().toLowerCase();
            password = decoded.substring(sep + 1);
        } catch (IllegalArgumentException e) {
            abort(request, "Credenciais inválidas.");
            return;
        }

        Optional<User> user = userService.authenticate(email, password);
        if (user.isEmpty()) {
            abort(request, "E-mail ou senha incorretos.");
            return;
        }

        boolean secure = request.getSecurityContext() != null && request.getSecurityContext().isSecure();
        request.setSecurityContext(new AuthenticatedSecurityContext(user.get(), secure));
    }

    private boolean isPublic(ContainerRequestContext request) {
        String method = request.getMethod();
        if (HttpMethod.OPTIONS.equals(method)) {
            return true;
        }
        String path = request.getUriInfo().getPath();
        if (path.startsWith("/")) {
            path = path.substring(1);
        }
        if (path.endsWith("/")) {
            path = path.substring(0, path.length() - 1);
        }
        return HttpMethod.POST.equals(method) && path.equals("users");
    }

    private void abort(ContainerRequestContext request, String message) {
        request.abortWith(ErrorResponse.build(401, message));
    }
}
