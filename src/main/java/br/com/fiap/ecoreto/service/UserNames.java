package br.com.fiap.ecoreto.service;

import br.com.fiap.ecoreto.dao.UserDao;
import br.com.fiap.ecoreto.model.User;

import java.sql.Connection;
import java.sql.SQLException;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

final class UserNames {

    static final String SYSTEM = "Sistema";

    private final UserDao users;
    private final Map<UUID, String> cache = new HashMap<>();

    UserNames(Connection c) {
        this.users = new UserDao(c);
    }

    String of(UUID userId) throws SQLException {
        if (userId == null) {
            return SYSTEM;
        }
        if (!cache.containsKey(userId)) {
            cache.put(userId, users.findById(userId).map(User::getFullName).orElse("Usuário removido"));
        }
        return cache.get(userId);
    }
}
