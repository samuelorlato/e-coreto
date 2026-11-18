package br.com.fiap.ecoreto.security;

import br.com.fiap.ecoreto.model.User;
import jakarta.ws.rs.NotAuthorizedException;
import jakarta.ws.rs.core.SecurityContext;

/**
 * Pega o usuário logado no resource:
 * {@code User me = CurrentUser.from(securityContext);}
 * Use sempre isto, nunca um id de usuário enviado pelo front.
 */
public final class CurrentUser {

    private CurrentUser() {
    }

    public static User from(SecurityContext context) {
        if (context == null || !(context.getUserPrincipal() instanceof UserPrincipal principal)) {
            // Não deveria acontecer: o BasicAuthFilter barra antes. Fica como proteção.
            throw new NotAuthorizedException("Basic");
        }
        return principal.getUser();
    }
}
