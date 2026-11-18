package br.com.fiap.ecoreto.resource.dto;

import br.com.fiap.ecoreto.model.Address;

public class AddressResponse {

    public String id;
    public String street;
    public String streetNumber;
    public String complement;
    public String neighborhood;
    public String city;
    public String state;
    public String zipCode;
    public Double latitude;
    public Double longitude;

    public static AddressResponse from(Address a) {
        AddressResponse r = new AddressResponse();
        r.id = a.getId().toString();
        r.street = a.getStreet();
        r.streetNumber = a.getStreetNumber();
        r.complement = a.getComplement();
        r.neighborhood = a.getNeighborhood();
        r.city = a.getCity();
        r.state = a.getState();
        r.zipCode = a.getZipCode();
        r.latitude = a.getLatitude();
        r.longitude = a.getLongitude();
        return r;
    }
}
