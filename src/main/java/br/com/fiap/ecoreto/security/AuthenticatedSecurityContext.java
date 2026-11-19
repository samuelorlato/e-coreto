package br.com.fiap.ecoreto.security;

import br.com.fiap.ecoreto.model.User;
import jakarta.ws.rs.core.SecurityContext;

public class AuthenticatedSecurityContext implements SecurityContext {

    private final UserPrincipal principal;
    private final boolean secure;

    public AuthenticatedSecurityContext(User user, boolean secure) {
        this.principal = new UserPrincipal(user);
        this.secure = secure;
    }

    @Override
    public UserPrincipal getUserPrincipal() {
        return principal;
    }

    @Override
    public boolean isUserInRole(String role) {
        return principal.getUser().getRole().name().equals(role);
    }

    @Override
    public boolean isSecure() {
        return secure;
    }

    @Override
    public String getAuthenticationScheme() {
        return BASIC_AUTH;
    }
}
