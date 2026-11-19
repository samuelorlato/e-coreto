package br.com.fiap.ecoreto.security;

import br.com.fiap.ecoreto.model.User;

import java.security.Principal;

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
