package br.com.fiap.ecoreto.resource.dto;

/** Corpo de POST /users (cadastro de morador). */
public class RegisterRequest {

    public String firstName;
    public String lastName;
    public String email;
    public String password;
    public AddressRequest address;
}
