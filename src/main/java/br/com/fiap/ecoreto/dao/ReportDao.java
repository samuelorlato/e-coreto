package br.com.fiap.ecoreto.dao;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.ResultSetMetaData;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Consultas dos indicadores de impacto (README, seção 1.6). Só leitura.
 * Cada linha volta como um Map com as colunas em camelCase (ex.: in_favor → inFavor).
 */
public class ReportDao {

    private final Connection connection;

    public ReportDao(Connection connection) {
        this.connection = connection;
    }

    /** Propostas ativas com mais apoio. */
    public List<Map<String, Object>> ranking(int limit) throws SQLException {
        String sql = "SELECT p.id, p.title, p.status, "
                + "NVL(SUM(CASE WHEN v.vote_type = 'IN_FAVOR' THEN 1 ELSE 0 END), 0) in_favor, "
                + "NVL(SUM(CASE WHEN v.vote_type = 'AGAINST' THEN 1 ELSE 0 END), 0) against, "
                + "COUNT(v.id) total_votes "
                + "FROM proposals p LEFT JOIN votes v ON v.proposal_id = p.id "
                + "WHERE p.archived_at IS NULL "
                + "GROUP BY p.id, p.title, p.status "
                + "ORDER BY in_favor DESC, total_votes DESC, p.title "
                + "FETCH FIRST ? ROWS ONLY";
        return query(sql, limit);
    }

    /** Votos por região, usando o endereço do momento do voto (RN-10). */
    public List<Map<String, Object>> votesByRegion() throws SQLException {
        String sql = "SELECT a.zip_code, a.street, a.neighborhood, COUNT(*) total_votes, "
                + "SUM(CASE WHEN v.vote_type = 'IN_FAVOR' THEN 1 ELSE 0 END) in_favor, "
                + "SUM(CASE WHEN v.vote_type = 'AGAINST' THEN 1 ELSE 0 END) against "
                + "FROM votes v JOIN addresses a ON a.id = v.address_id "
                + "GROUP BY a.zip_code, a.street, a.neighborhood "
                + "ORDER BY total_votes DESC, a.zip_code";
        return query(sql);
    }

    /** Quantidade de propostas e de votos por categoria. */
    public List<Map<String, Object>> byCategory() throws SQLException {
        String sql = "SELECT c.id, c.name, COUNT(DISTINCT pc.proposal_id) proposals, COUNT(v.id) total_votes "
                + "FROM categories c "
                + "LEFT JOIN proposal_categories pc ON pc.category_id = c.id "
                + "LEFT JOIN votes v ON v.proposal_id = pc.proposal_id "
                + "GROUP BY c.id, c.name "
                + "ORDER BY proposals DESC, total_votes DESC, c.name";
        return query(sql);
    }

    /** Tempo médio, em dias, da criação até cada marco da jornada. */
    public Map<String, Object> averageTimes() throws SQLException {
        String days = "CAST(h.created_at AS DATE) - CAST(p.created_at AS DATE)";
        String sql = "SELECT "
                + "ROUND(AVG(CASE WHEN h.to_status = 'AWAITING_REVIEW' THEN " + days + " END), 1) avg_days_to_threshold, "
                + "ROUND(AVG(CASE WHEN h.to_status IN ('APPROVED', 'REJECTED') THEN " + days + " END), 1) avg_days_to_decision, "
                + "ROUND(AVG(CASE WHEN h.to_status = 'IN_PROGRESS' THEN " + days + " END), 1) avg_days_to_execution, "
                + "ROUND(AVG(CASE WHEN h.to_status = 'COMPLETED' THEN " + days + " END), 1) avg_days_to_completion "
                + "FROM proposal_status_history h JOIN proposals p ON p.id = h.proposal_id";
        return query(sql).get(0);
    }

    /** Propostas ativas que estão coletando apoio há mais de N dias (candidatas a arquivar, RN-16). */
    public List<Map<String, Object>> stale(int days) throws SQLException {
        String sql = "SELECT p.id, p.title, p.created_at, "
                + "TRUNC(CAST(SYSTIMESTAMP AS DATE) - CAST(p.created_at AS DATE)) days_open "
                + "FROM proposals p "
                + "WHERE p.archived_at IS NULL AND p.status = 'COLLECTING_VOTES' "
                + "AND p.created_at <= SYSTIMESTAMP - NUMTODSINTERVAL(?, 'DAY') "
                + "ORDER BY p.created_at";
        return query(sql, days);
    }

    /** Contagens brutas dos indicadores de participação. O service calcula as taxas. */
    public Map<String, Object> participationCounts() throws SQLException {
        String sql = "SELECT "
                + "(SELECT COUNT(*) FROM users WHERE role = 'RESIDENT') residents, "
                + "(SELECT COUNT(DISTINCT v.user_id) FROM votes v JOIN users u ON u.id = v.user_id "
                + "  WHERE u.role = 'RESIDENT') residents_who_voted, "
                + "(SELECT COUNT(*) FROM proposals) proposals, "
                + "(SELECT COUNT(DISTINCT proposal_id) FROM proposal_status_history "
                + "  WHERE to_status = 'AWAITING_REVIEW') reached_threshold, "
                + "(SELECT COUNT(*) FROM proposals WHERE status IN ('APPROVED', 'REJECTED', 'IN_PROGRESS', 'COMPLETED')) decided, "
                + "(SELECT COUNT(DISTINCT proposal_id) FROM official_responses) responded, "
                + "(SELECT COUNT(*) FROM proposals WHERE status IN ('APPROVED', 'IN_PROGRESS', 'COMPLETED')) approved, "
                + "(SELECT COUNT(*) FROM proposals WHERE status = 'COMPLETED') completed "
                + "FROM dual";
        return query(sql).get(0);
    }

    private List<Map<String, Object>> query(String sql, Object... params) throws SQLException {
        try (PreparedStatement ps = connection.prepareStatement(sql)) {
            for (int i = 0; i < params.length; i++) {
                ps.setObject(i + 1, params[i]);
            }
            try (ResultSet rs = ps.executeQuery()) {
                ResultSetMetaData meta = rs.getMetaData();
                List<Map<String, Object>> rows = new ArrayList<>();
                while (rs.next()) {
                    Map<String, Object> row = new LinkedHashMap<>();
                    for (int c = 1; c <= meta.getColumnCount(); c++) {
                        Object value = rs.getObject(c);
                        if (value instanceof Timestamp ts) {
                            value = ts.toLocalDateTime();
                        }
                        row.put(toCamelCase(meta.getColumnLabel(c)), value);
                    }
                    rows.add(row);
                }
                return rows;
            }
        }
    }

    /** Oracle devolve o nome da coluna em maiúsculas: IN_FAVOR → inFavor. */
    private static String toCamelCase(String column) {
        String[] parts = column.toLowerCase().split("_");
        StringBuilder sb = new StringBuilder(parts[0]);
        for (int i = 1; i < parts.length; i++) {
            if (!parts[i].isEmpty()) {
                sb.append(Character.toUpperCase(parts[i].charAt(0))).append(parts[i].substring(1));
            }
        }
        return sb.toString();
    }
}
