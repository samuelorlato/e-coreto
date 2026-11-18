package br.com.fiap.ecoreto.model;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Endereço. É imutável: mudar de endereço cria um registro novo, assim o voto
 * continua apontando para o endereço do momento em que foi dado (RN-10).
 */
public class Address extends BaseEntity {

    private final String street;
    private final String streetNumber;
    private final String complement;
    private final String neighborhood;
    private final String city;
    private final String state;
    private final String zipCode;
    private final Double latitude;
    private final Double longitude;

    public Address(String street, String streetNumber, String complement, String neighborhood,
                   String city, String state, String zipCode, Double latitude, Double longitude) {
        super();
        this.street = street;
        this.streetNumber = streetNumber;
        this.complement = complement;
        this.neighborhood = neighborhood;
        this.city = city;
        this.state = state;
        this.zipCode = zipCode;
        this.latitude = latitude;
        this.longitude = longitude;
    }

    public Address(UUID id, String street, String streetNumber, String complement, String neighborhood,
                   String city, String state, String zipCode, Double latitude, Double longitude,
                   LocalDateTime createdAt, LocalDateTime updatedAt) {
        super(id, createdAt, updatedAt);
        this.street = street;
        this.streetNumber = streetNumber;
        this.complement = complement;
        this.neighborhood = neighborhood;
        this.city = city;
        this.state = state;
        this.zipCode = zipCode;
        this.latitude = latitude;
        this.longitude = longitude;
    }

    public String getStreet() {
        return street;
    }

    public String getStreetNumber() {
        return streetNumber;
    }

    public String getComplement() {
        return complement;
    }

    public String getNeighborhood() {
        return neighborhood;
    }

    public String getCity() {
        return city;
    }

    public String getState() {
        return state;
    }

    public String getZipCode() {
        return zipCode;
    }

    public Double getLatitude() {
        return latitude;
    }

    public Double getLongitude() {
        return longitude;
    }
}
