package br.com.fiap.ecoreto.security;

import br.com.fiap.ecoreto.model.User;

import java.security.Principal;

/** Embrulha o usuário autenticado para guardá-lo no SecurityContext. */
public class UserPrincipal implements Principal {

    private final User user;

    public UserPrincipal(User user) {
        this.user = user;
    }

    public User getUser() {
        return user;
    }

    @Override
    public String getName() {
        return user.getEmail();
    }
}
