package br.com.fiap.ecoreto.security;

import br.com.fiap.ecoreto.model.User;
import jakarta.ws.rs.NotAuthorizedException;
import jakarta.ws.rs.core.SecurityContext;

public final class CurrentUser {

    private CurrentUser() {
    }

    public static User from(SecurityContext context) {
        if (context == null || !(context.getUserPrincipal() instanceof UserPrincipal principal)) {
            throw new NotAuthorizedException("Basic");
        }
        return principal.getUser();
    }
}
