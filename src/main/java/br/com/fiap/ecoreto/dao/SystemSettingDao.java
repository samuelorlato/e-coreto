package br.com.fiap.ecoreto.dao;

import br.com.fiap.ecoreto.model.SystemSetting;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

/** Parâmetros: vêm do seed do script.sql, então aqui só há consulta e update. */
public class SystemSettingDao {

    private final Connection connection;

    public SystemSettingDao(Connection connection) {
        this.connection = connection;
    }

    public List<SystemSetting> findAll() throws SQLException {
        try (PreparedStatement ps = connection.prepareStatement(
                "SELECT * FROM system_settings ORDER BY setting_key");
             ResultSet rs = ps.executeQuery()) {
            List<SystemSetting> list = new ArrayList<>();
            while (rs.next()) {
                list.add(map(rs));
            }
            return list;
        }
    }

    public Optional<SystemSetting> findByKey(String key) throws SQLException {
        try (PreparedStatement ps = connection.prepareStatement(
                "SELECT * FROM system_settings WHERE setting_key = ?")) {
            ps.setString(1, key);
            try (ResultSet rs = ps.executeQuery()) {
                return rs.next() ? Optional.of(map(rs)) : Optional.empty();
            }
        }
    }

    public void update(SystemSetting s) throws SQLException {
        s.touch();
        String sql = "UPDATE system_settings SET setting_value = ?, updated_at = ? WHERE id = ?";
        try (PreparedStatement ps = connection.prepareStatement(sql)) {
            ps.setBigDecimal(1, s.getValue());
            Jdbc.setDateTime(ps, 2, s.getUpdatedAt());
            Jdbc.setUuid(ps, 3, s.getId());
            ps.executeUpdate();
        }
    }

    private SystemSetting map(ResultSet rs) throws SQLException {
        return new SystemSetting(
                Jdbc.getUuid(rs, "id"),
                rs.getString("setting_key"),
                rs.getBigDecimal("setting_value"),
                rs.getString("description"),
                Jdbc.getDateTime(rs, "created_at"),
                Jdbc.getDateTime(rs, "updated_at"));
    }
}
