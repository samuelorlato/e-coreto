package br.com.fiap.ecoreto.dao;

import br.com.fiap.ecoreto.model.OfficialResponse;
import br.com.fiap.ecoreto.model.ProposalStatus;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/** Respostas oficiais são imutáveis (RN-18): só insert e consulta. */
public class OfficialResponseDao {

    private final Connection connection;

    public OfficialResponseDao(Connection connection) {
        this.connection = connection;
    }

    public void insert(OfficialResponse r) throws SQLException {
        String sql = "INSERT INTO official_responses (id, proposal_id, created_by, content, proposal_status, "
                + "created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)";
        try (PreparedStatement ps = connection.prepareStatement(sql)) {
            Jdbc.setUuid(ps, 1, r.getId());
            Jdbc.setUuid(ps, 2, r.getProposalId());
            Jdbc.setUuid(ps, 3, r.getCreatedBy());
            ps.setString(4, r.getContent());
            ps.setString(5, r.getProposalStatus().name());
            Jdbc.setDateTime(ps, 6, r.getCreatedAt());
            Jdbc.setDateTime(ps, 7, r.getUpdatedAt());
            ps.executeUpdate();
        }
    }

    public List<OfficialResponse> findByProposal(UUID proposalId) throws SQLException {
        String sql = "SELECT * FROM official_responses WHERE proposal_id = ? ORDER BY created_at";
        try (PreparedStatement ps = connection.prepareStatement(sql)) {
            Jdbc.setUuid(ps, 1, proposalId);
            try (ResultSet rs = ps.executeQuery()) {
                List<OfficialResponse> list = new ArrayList<>();
                while (rs.next()) {
                    list.add(new OfficialResponse(
                            Jdbc.getUuid(rs, "id"),
                            Jdbc.getUuid(rs, "proposal_id"),
                            Jdbc.getUuid(rs, "created_by"),
                            rs.getString("content"),
                            ProposalStatus.valueOf(rs.getString("proposal_status")),
                            Jdbc.getDateTime(rs, "created_at"),
                            Jdbc.getDateTime(rs, "updated_at")));
                }
                return list;
            }
        }
    }
}
