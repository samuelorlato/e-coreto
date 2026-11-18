package br.com.fiap.ecoreto.resource.dto;

import br.com.fiap.ecoreto.model.Authority;
import br.com.fiap.ecoreto.model.User;

import java.time.LocalDateTime;

/** Dados do usuário devolvidos ao front. Nunca inclui hash nem sal da senha. */
public class UserResponse {

    public String id;
    public String firstName;
    public String lastName;
    public String fullName;
    public String email;
    public String role;
    public boolean authority;
    public String jobTitle;
    public String department;
    public AddressResponse address;
    public LocalDateTime createdAt;

    public static UserResponse from(User u) {
        UserResponse r = new UserResponse();
        r.id = u.getId().toString();
        r.firstName = u.getFirstName();
        r.lastName = u.getLastName();
        r.fullName = u.getFullName();
        r.email = u.getEmail();
        r.role = u.getRole().name();
        r.authority = u.isAuthority();
        if (u instanceof Authority a) {
            r.jobTitle = a.getJobTitle();
            r.department = a.getDepartment();
        }
        r.address = AddressResponse.from(u.getAddress());
        r.createdAt = u.getCreatedAt();
        return r;
    }
}
