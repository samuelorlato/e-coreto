package br.com.fiap.ecoreto.dao;

import br.com.fiap.ecoreto.model.Category;
import br.com.fiap.ecoreto.model.Proposal;
import br.com.fiap.ecoreto.model.ProposalStatus;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Propostas e a tabela de ligação proposal_categories.
 * Nada é apagado de verdade: arquivar é preencher archived_at/archived_by (soft delete).
 */
public class ProposalDao {

    private final Connection connection;

    public ProposalDao(Connection connection) {
        this.connection = connection;
    }

    public void insert(Proposal p) throws SQLException {
        String sql = "INSERT INTO proposals (id, title, description, body, status, created_by, "
                + "archived_at, archived_by, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
        try (PreparedStatement ps = connection.prepareStatement(sql)) {
            Jdbc.setUuid(ps, 1, p.getId());
            ps.setString(2, p.getTitle());
            ps.setString(3, p.getDescription());
            ps.setString(4, p.getBody());
            ps.setString(5, p.getStatus().name());
            Jdbc.setUuid(ps, 6, p.getCreatedBy());
            Jdbc.setDateTime(ps, 7, p.getArchivedAt());
            Jdbc.setUuid(ps, 8, p.getArchivedBy());
            Jdbc.setDateTime(ps, 9, p.getCreatedAt());
            Jdbc.setDateTime(ps, 10, p.getUpdatedAt());
            ps.executeUpdate();
        }
    }

    public void update(Proposal p) throws SQLException {
        p.touch();
        String sql = "UPDATE proposals SET title = ?, description = ?, body = ?, status = ?, "
                + "archived_at = ?, archived_by = ?, updated_at = ? WHERE id = ?";
        try (PreparedStatement ps = connection.prepareStatement(sql)) {
            ps.setString(1, p.getTitle());
            ps.setString(2, p.getDescription());
            ps.setString(3, p.getBody());
            ps.setString(4, p.getStatus().name());
            Jdbc.setDateTime(ps, 5, p.getArchivedAt());
            Jdbc.setUuid(ps, 6, p.getArchivedBy());
            Jdbc.setDateTime(ps, 7, p.getUpdatedAt());
            Jdbc.setUuid(ps, 8, p.getId());
            ps.executeUpdate();
        }
    }

    /** Substitui as categorias da proposta pelas informadas. */
    public void replaceCategories(UUID proposalId, List<Category> categories) throws SQLException {
        try (PreparedStatement del = connection.prepareStatement(
                "DELETE FROM proposal_categories WHERE proposal_id = ?")) {
            Jdbc.setUuid(del, 1, proposalId);
            del.executeUpdate();
        }
        String sql = "INSERT INTO proposal_categories (proposal_id, category_id, created_at) "
                + "VALUES (?, ?, SYSTIMESTAMP)";
        try (PreparedStatement ps = connection.prepareStatement(sql)) {
            for (Category c : categories) {
                Jdbc.setUuid(ps, 1, proposalId);
                Jdbc.setUuid(ps, 2, c.getId());
                ps.addBatch();
            }
            ps.executeBatch();
        }
    }

    public Optional<Proposal> findById(UUID id) throws SQLException {
        try (PreparedStatement ps = connection.prepareStatement("SELECT * FROM proposals WHERE id = ?")) {
            Jdbc.setUuid(ps, 1, id);
            try (ResultSet rs = ps.executeQuery()) {
                return rs.next() ? Optional.of(map(rs)) : Optional.empty();
            }
        }
    }

    /**
     * Lista propostas com filtros opcionais (null = sem filtro).
     *
     * @param archived false = só ativas (archived_at IS NULL); true = só arquivadas
     */
    public List<Proposal> list(ProposalStatus status, UUID categoryId, boolean archived) throws SQLException {
        StringBuilder sql = new StringBuilder("SELECT p.* FROM proposals p WHERE ");
        sql.append(archived ? "p.archived_at IS NOT NULL" : "p.archived_at IS NULL");
        List<String> params = new ArrayList<>();
        if (status != null) {
            sql.append(" AND p.status = ?");
            params.add(status.name());
        }
        if (categoryId != null) {
            sql.append(" AND EXISTS (SELECT 1 FROM proposal_categories pc "
                    + "WHERE pc.proposal_id = p.id AND pc.category_id = ?)");
            params.add(categoryId.toString());
        }
        sql.append(" ORDER BY p.created_at DESC");

        try (PreparedStatement ps = connection.prepareStatement(sql.toString())) {
            for (int i = 0; i < params.size(); i++) {
                ps.setString(i + 1, params.get(i));
            }
            try (ResultSet rs = ps.executeQuery()) {
                List<Proposal> list = new ArrayList<>();
                while (rs.next()) {
                    list.add(map(rs));
                }
                return list;
            }
        }
    }

    private Proposal map(ResultSet rs) throws SQLException {
        return new Proposal(
                Jdbc.getUuid(rs, "id"),
                rs.getString("title"),
                rs.getString("description"),
                rs.getString("body"),
                ProposalStatus.valueOf(rs.getString("status")),
                Jdbc.getUuid(rs, "created_by"),
                Jdbc.getDateTime(rs, "archived_at"),
                Jdbc.getUuid(rs, "archived_by"),
                Jdbc.getDateTime(rs, "created_at"),
                Jdbc.getDateTime(rs, "updated_at"));
    }
}
