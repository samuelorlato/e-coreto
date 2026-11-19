package br.com.fiap.ecoreto.dao;

import br.com.fiap.ecoreto.model.Category;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public class CategoryDao {

    private final Connection connection;

    public CategoryDao(Connection connection) {
        this.connection = connection;
    }

    public void insert(Category c) throws SQLException {
        String sql = "INSERT INTO categories (id, name, slug, created_by, created_at, updated_at) "
                + "VALUES (?, ?, ?, ?, ?, ?)";
        try (PreparedStatement ps = connection.prepareStatement(sql)) {
            Jdbc.setUuid(ps, 1, c.getId());
            ps.setString(2, c.getName());
            ps.setString(3, c.getSlug());
            Jdbc.setUuid(ps, 4, c.getCreatedBy());
            Jdbc.setDateTime(ps, 5, c.getCreatedAt());
            Jdbc.setDateTime(ps, 6, c.getUpdatedAt());
            ps.executeUpdate();
        }
    }

    public void update(Category c) throws SQLException {
        c.touch();
        String sql = "UPDATE categories SET name = ?, slug = ?, updated_at = ? WHERE id = ?";
        try (PreparedStatement ps = connection.prepareStatement(sql)) {
            ps.setString(1, c.getName());
            ps.setString(2, c.getSlug());
            Jdbc.setDateTime(ps, 3, c.getUpdatedAt());
            Jdbc.setUuid(ps, 4, c.getId());
            ps.executeUpdate();
        }
    }

    public void delete(UUID id) throws SQLException {
        try (PreparedStatement ps = connection.prepareStatement("DELETE FROM categories WHERE id = ?")) {
            Jdbc.setUuid(ps, 1, id);
            ps.executeUpdate();
        }
    }

    public Optional<Category> findById(UUID id) throws SQLException {
        try (PreparedStatement ps = connection.prepareStatement("SELECT * FROM categories WHERE id = ?")) {
            Jdbc.setUuid(ps, 1, id);
            try (ResultSet rs = ps.executeQuery()) {
                return rs.next() ? Optional.of(map(rs)) : Optional.empty();
            }
        }
    }

    public Optional<Category> findBySlug(String slug) throws SQLException {
        try (PreparedStatement ps = connection.prepareStatement("SELECT * FROM categories WHERE slug = ?")) {
            ps.setString(1, slug);
            try (ResultSet rs = ps.executeQuery()) {
                return rs.next() ? Optional.of(map(rs)) : Optional.empty();
            }
        }
    }

    public List<Category> findAll() throws SQLException {
        try (PreparedStatement ps = connection.prepareStatement("SELECT * FROM categories ORDER BY name");
             ResultSet rs = ps.executeQuery()) {
            List<Category> list = new ArrayList<>();
            while (rs.next()) {
                list.add(map(rs));
            }
            return list;
        }
    }

    public List<Category> findByProposal(UUID proposalId) throws SQLException {
        String sql = "SELECT c.* FROM categories c "
                + "JOIN proposal_categories pc ON pc.category_id = c.id "
                + "WHERE pc.proposal_id = ? ORDER BY c.name";
        try (PreparedStatement ps = connection.prepareStatement(sql)) {
            Jdbc.setUuid(ps, 1, proposalId);
            try (ResultSet rs = ps.executeQuery()) {
                List<Category> list = new ArrayList<>();
                while (rs.next()) {
                    list.add(map(rs));
                }
                return list;
            }
        }
    }

    public boolean isInUse(UUID id) throws SQLException {
        String sql = "SELECT COUNT(*) FROM proposal_categories WHERE category_id = ?";
        try (PreparedStatement ps = connection.prepareStatement(sql)) {
            Jdbc.setUuid(ps, 1, id);
            try (ResultSet rs = ps.executeQuery()) {
                rs.next();
                return rs.getInt(1) > 0;
            }
        }
    }

    private Category map(ResultSet rs) throws SQLException {
        return new Category(
                Jdbc.getUuid(rs, "id"),
                rs.getString("name"),
                rs.getString("slug"),
                Jdbc.getUuid(rs, "created_by"),
                Jdbc.getDateTime(rs, "created_at"),
                Jdbc.getDateTime(rs, "updated_at"));
    }
}
