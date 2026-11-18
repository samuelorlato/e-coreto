package br.com.fiap.ecoreto.dao;

import br.com.fiap.ecoreto.model.Vote;
import br.com.fiap.ecoreto.model.VoteType;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.Optional;
import java.util.UUID;

public class VoteDao {

    private final Connection connection;

    public VoteDao(Connection connection) {
        this.connection = connection;
    }

    public void insert(Vote v) throws SQLException {
        String sql = "INSERT INTO votes (id, user_id, proposal_id, vote_type, address_id, created_at, updated_at) "
                + "VALUES (?, ?, ?, ?, ?, ?, ?)";
        try (PreparedStatement ps = connection.prepareStatement(sql)) {
            Jdbc.setUuid(ps, 1, v.getId());
            Jdbc.setUuid(ps, 2, v.getUserId());
            Jdbc.setUuid(ps, 3, v.getProposalId());
            ps.setString(4, v.getType().name());
            Jdbc.setUuid(ps, 5, v.getAddressId());
            Jdbc.setDateTime(ps, 6, v.getCreatedAt());
            Jdbc.setDateTime(ps, 7, v.getUpdatedAt());
            ps.executeUpdate();
        }
    }

    public void update(Vote v) throws SQLException {
        v.touch();
        String sql = "UPDATE votes SET vote_type = ?, address_id = ?, updated_at = ? WHERE id = ?";
        try (PreparedStatement ps = connection.prepareStatement(sql)) {
            ps.setString(1, v.getType().name());
            Jdbc.setUuid(ps, 2, v.getAddressId());
            Jdbc.setDateTime(ps, 3, v.getUpdatedAt());
            Jdbc.setUuid(ps, 4, v.getId());
            ps.executeUpdate();
        }
    }

    public void delete(UUID id) throws SQLException {
        try (PreparedStatement ps = connection.prepareStatement("DELETE FROM votes WHERE id = ?")) {
            Jdbc.setUuid(ps, 1, id);
            ps.executeUpdate();
        }
    }

    public Optional<Vote> findByUserAndProposal(UUID userId, UUID proposalId) throws SQLException {
        String sql = "SELECT * FROM votes WHERE user_id = ? AND proposal_id = ?";
        try (PreparedStatement ps = connection.prepareStatement(sql)) {
            Jdbc.setUuid(ps, 1, userId);
            Jdbc.setUuid(ps, 2, proposalId);
            try (ResultSet rs = ps.executeQuery()) {
                if (!rs.next()) {
                    return Optional.empty();
                }
                return Optional.of(new Vote(
                        Jdbc.getUuid(rs, "id"),
                        Jdbc.getUuid(rs, "user_id"),
                        Jdbc.getUuid(rs, "proposal_id"),
                        VoteType.valueOf(rs.getString("vote_type")),
                        Jdbc.getUuid(rs, "address_id"),
                        Jdbc.getDateTime(rs, "created_at"),
                        Jdbc.getDateTime(rs, "updated_at")));
            }
        }
    }

    public VoteCount countByProposal(UUID proposalId) throws SQLException {
        String sql = "SELECT "
                + "NVL(SUM(CASE WHEN vote_type = 'IN_FAVOR' THEN 1 ELSE 0 END), 0) in_favor, "
                + "NVL(SUM(CASE WHEN vote_type = 'AGAINST' THEN 1 ELSE 0 END), 0) against "
                + "FROM votes WHERE proposal_id = ?";
        try (PreparedStatement ps = connection.prepareStatement(sql)) {
            Jdbc.setUuid(ps, 1, proposalId);
            try (ResultSet rs = ps.executeQuery()) {
                rs.next();
                return new VoteCount(rs.getInt("in_favor"), rs.getInt("against"));
            }
        }
    }
}
