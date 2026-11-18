package br.com.fiap.ecoreto.service;

import br.com.fiap.ecoreto.dao.UserDao;
import br.com.fiap.ecoreto.model.User;

import java.sql.Connection;
import java.sql.SQLException;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

/** Busca nomes de usuários para exibição, sem repetir a mesma consulta na mesma operação. */
final class UserNames {

    static final String SYSTEM = "Sistema";

    private final UserDao users;
    private final Map<UUID, String> cache = new HashMap<>();

    UserNames(Connection c) {
        this.users = new UserDao(c);
    }

    /** Nome completo do usuário; "Sistema" quando o id é nulo (mudança automática, RN-20). */
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
