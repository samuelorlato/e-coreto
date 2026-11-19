package br.com.fiap.ecoreto.dao;

import br.com.fiap.ecoreto.model.Address;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.Optional;
import java.util.UUID;

public class AddressDao {

    private final Connection connection;

    public AddressDao(Connection connection) {
        this.connection = connection;
    }

    public void insert(Address a) throws SQLException {
        String sql = "INSERT INTO addresses (id, street, street_number, complement, neighborhood, city, "
                + "state, zip_code, latitude, longitude, created_at, updated_at) "
                + "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
        try (PreparedStatement ps = connection.prepareStatement(sql)) {
            Jdbc.setUuid(ps, 1, a.getId());
            ps.setString(2, a.getStreet());
            ps.setString(3, a.getStreetNumber());
            ps.setString(4, a.getComplement());
            ps.setString(5, a.getNeighborhood());
            ps.setString(6, a.getCity());
            ps.setString(7, a.getState());
            ps.setString(8, a.getZipCode());
            Jdbc.setDouble(ps, 9, a.getLatitude());
            Jdbc.setDouble(ps, 10, a.getLongitude());
            Jdbc.setDateTime(ps, 11, a.getCreatedAt());
            Jdbc.setDateTime(ps, 12, a.getUpdatedAt());
            ps.executeUpdate();
        }
    }

    public Optional<Address> findById(UUID id) throws SQLException {
        String sql = "SELECT * FROM addresses WHERE id = ?";
        try (PreparedStatement ps = connection.prepareStatement(sql)) {
            Jdbc.setUuid(ps, 1, id);
            try (ResultSet rs = ps.executeQuery()) {
                return rs.next() ? Optional.of(map(rs, "")) : Optional.empty();
            }
        }
    }

    static Address map(ResultSet rs, String prefix) throws SQLException {
        return new Address(
                Jdbc.getUuid(rs, prefix + "id"),
                rs.getString(prefix + "street"),
                rs.getString(prefix + "street_number"),
                rs.getString(prefix + "complement"),
                rs.getString(prefix + "neighborhood"),
                rs.getString(prefix + "city"),
                rs.getString(prefix + "state"),
                rs.getString(prefix + "zip_code"),
                Jdbc.getDouble(rs, prefix + "latitude"),
                Jdbc.getDouble(rs, prefix + "longitude"),
                Jdbc.getDateTime(rs, prefix + "created_at"),
                Jdbc.getDateTime(rs, prefix + "updated_at"));
    }
}
