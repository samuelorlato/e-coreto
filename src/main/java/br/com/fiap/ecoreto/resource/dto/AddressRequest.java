package br.com.fiap.ecoreto.resource.dto;

import br.com.fiap.ecoreto.model.Address;

/** Endereço enviado pelo front. Campos públicos para o JSON-B preencher. */
public class AddressRequest {

    public String street;
    public String streetNumber;
    public String complement;
    public String neighborhood;
    public String city;
    public String state;
    public String zipCode;
    public Double latitude;
    public Double longitude;

    /** Converte para entidade, já limpando formato (CEP só com dígitos, UF em maiúsculas). A validação é no service. */
    public Address toModel() {
        return new Address(
                trim(street),
                trim(streetNumber),
                trim(complement),
                trim(neighborhood),
                trim(city),
                state == null ? null : trim(state.toUpperCase()),
                zipCode == null ? null : trim(zipCode.replaceAll("\\D", "")),
                latitude,
                longitude);
    }

    private static String trim(String value) {
        if (value == null) {
            return null;
        }
        String t = value.trim();
        return t.isEmpty() ? null : t;
    }
}
