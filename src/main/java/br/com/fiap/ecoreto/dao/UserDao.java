package br.com.fiap.ecoreto.dao;

import br.com.fiap.ecoreto.model.Address;
import br.com.fiap.ecoreto.model.Authority;
import br.com.fiap.ecoreto.model.Resident;
import br.com.fiap.ecoreto.model.Role;
import br.com.fiap.ecoreto.model.User;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.Optional;
import java.util.UUID;

/**
 * Usuários. Lê a coluna role e instancia Resident ou Authority (mapeamento de herança).
 * O endereço atual vem junto, por JOIN.
 */
public class UserDao {

    private static final String SELECT_WITH_ADDRESS =
            "SELECT u.*, a.id a_id, a.street a_street, a.street_number a_street_number, "
                    + "a.complement a_complement, a.neighborhood a_neighborhood, a.city a_city, "
                    + "a.state a_state, a.zip_code a_zip_code, a.latitude a_latitude, "
                    + "a.longitude a_longitude, a.created_at a_created_at, a.updated_at a_updated_at "
                    + "FROM users u JOIN addresses a ON a.id = u.address_id ";

    private final Connection connection;

    public UserDao(Connection connection) {
        this.connection = connection;
    }

    public void insert(User u) throws SQLException {
        String sql = "INSERT INTO users (id, first_name, last_name, email, password_hash, password_salt, "
                + "role, job_title, department, address_id, created_at, updated_at) "
                + "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
        try (PreparedStatement ps = connection.prepareStatement(sql)) {
            Jdbc.setUuid(ps, 1, u.getId());
            ps.setString(2, u.getFirstName());
            ps.setString(3, u.getLastName());
            ps.setString(4, u.getEmail());
            ps.setString(5, u.getPasswordHash());
            ps.setString(6, u.getPasswordSalt());
            ps.setString(7, u.getRole().name());
            ps.setString(8, u instanceof Authority a ? a.getJobTitle() : null);
            ps.setString(9, u instanceof Authority a ? a.getDepartment() : null);
            Jdbc.setUuid(ps, 10, u.getAddress().getId());
            Jdbc.setDateTime(ps, 11, u.getCreatedAt());
            Jdbc.setDateTime(ps, 12, u.getUpdatedAt());
            ps.executeUpdate();
        }
    }

    /** Grava a troca de endereço (único dado do usuário alterável nesta versão). */
    public void updateAddress(User u) throws SQLException {
        u.touch();
        String sql = "UPDATE users SET address_id = ?, updated_at = ? WHERE id = ?";
        try (PreparedStatement ps = connection.prepareStatement(sql)) {
            Jdbc.setUuid(ps, 1, u.getAddress().getId());
            Jdbc.setDateTime(ps, 2, u.getUpdatedAt());
            Jdbc.setUuid(ps, 3, u.getId());
            ps.executeUpdate();
        }
    }

    public Optional<User> findById(UUID id) throws SQLException {
        return findOne(SELECT_WITH_ADDRESS + "WHERE u.id = ?", id.toString());
    }

    /** O e-mail é sempre gravado em minúsculas (CHECK ck_users_email_lower). */
    public Optional<User> findByEmail(String email) throws SQLException {
        return findOne(SELECT_WITH_ADDRESS + "WHERE u.email = ?", email.toLowerCase());
    }

    public boolean existsByEmail(String email) throws SQLException {
        String sql = "SELECT COUNT(*) FROM users WHERE email = ?";
        try (PreparedStatement ps = connection.prepareStatement(sql)) {
            ps.setString(1, email.toLowerCase());
            try (ResultSet rs = ps.executeQuery()) {
                rs.next();
                return rs.getInt(1) > 0;
            }
        }
    }

    /** Total de moradores cadastrados, base do quórum dinâmico (RN-13). */
    public int countResidents() throws SQLException {
        String sql = "SELECT COUNT(*) FROM users WHERE role = ?";
        try (PreparedStatement ps = connection.prepareStatement(sql)) {
            ps.setString(1, Role.RESIDENT.name());
            try (ResultSet rs = ps.executeQuery()) {
                rs.next();
                return rs.getInt(1);
            }
        }
    }

    private Optional<User> findOne(String sql, String param) throws SQLException {
        try (PreparedStatement ps = connection.prepareStatement(sql)) {
            ps.setString(1, param);
            try (ResultSet rs = ps.executeQuery()) {
                return rs.next() ? Optional.of(map(rs)) : Optional.empty();
            }
        }
    }

    private User map(ResultSet rs) throws SQLException {
        Address address = AddressDao.map(rs, "a_");
        UUID id = Jdbc.getUuid(rs, "id");
        Role role = Role.valueOf(rs.getString("role"));
        if (role == Role.AUTHORITY) {
            return new Authority(id, rs.getString("first_name"), rs.getString("last_name"),
                    rs.getString("email"), rs.getString("password_hash"), rs.getString("password_salt"),
                    address, rs.getString("job_title"), rs.getString("department"),
                    Jdbc.getDateTime(rs, "created_at"), Jdbc.getDateTime(rs, "updated_at"));
        }
        return new Resident(id, rs.getString("first_name"), rs.getString("last_name"),
                rs.getString("email"), rs.getString("password_hash"), rs.getString("password_salt"),
                address, Jdbc.getDateTime(rs, "created_at"), Jdbc.getDateTime(rs, "updated_at"));
    }
}
