package br.com.fiap.ecoreto.dao;

import br.com.fiap.ecoreto.model.ProposalStatus;
import br.com.fiap.ecoreto.model.ProposalStatusHistory;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/** Histórico de situações (RN-20). Imutável: só insert e consulta. */
public class ProposalStatusHistoryDao {

    private final Connection connection;

    public ProposalStatusHistoryDao(Connection connection) {
        this.connection = connection;
    }

    public void insert(ProposalStatusHistory h) throws SQLException {
        String sql = "INSERT INTO proposal_status_history (id, proposal_id, from_status, to_status, changed_by, "
                + "created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)";
        try (PreparedStatement ps = connection.prepareStatement(sql)) {
            Jdbc.setUuid(ps, 1, h.getId());
            Jdbc.setUuid(ps, 2, h.getProposalId());
            ps.setString(3, h.getFromStatus() == null ? null : h.getFromStatus().name());
            ps.setString(4, h.getToStatus().name());
            Jdbc.setUuid(ps, 5, h.getChangedBy());
            Jdbc.setDateTime(ps, 6, h.getCreatedAt());
            Jdbc.setDateTime(ps, 7, h.getUpdatedAt());
            ps.executeUpdate();
        }
    }

    public List<ProposalStatusHistory> findByProposal(UUID proposalId) throws SQLException {
        String sql = "SELECT * FROM proposal_status_history WHERE proposal_id = ? ORDER BY created_at";
        try (PreparedStatement ps = connection.prepareStatement(sql)) {
            Jdbc.setUuid(ps, 1, proposalId);
            try (ResultSet rs = ps.executeQuery()) {
                List<ProposalStatusHistory> list = new ArrayList<>();
                while (rs.next()) {
                    String from = rs.getString("from_status");
                    list.add(new ProposalStatusHistory(
                            Jdbc.getUuid(rs, "id"),
                            Jdbc.getUuid(rs, "proposal_id"),
                            from == null ? null : ProposalStatus.valueOf(from),
                            ProposalStatus.valueOf(rs.getString("to_status")),
                            Jdbc.getUuid(rs, "changed_by"),
                            Jdbc.getDateTime(rs, "created_at"),
                            Jdbc.getDateTime(rs, "updated_at")));
                }
                return list;
            }
        }
    }
}
