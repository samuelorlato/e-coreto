package br.com.fiap.ecoreto.model;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Usuário da plataforma. É abstrata: na prática é um {@link Resident} ou uma {@link Authority}
 * (o UserDao decide pela coluna role).
 */
public abstract class User extends BaseEntity {

    private String firstName;
    private String lastName;
    private String email;
    private String passwordHash;
    private String passwordSalt;
    private Address address;

    protected User(String firstName, String lastName, String email,
                   String passwordHash, String passwordSalt, Address address) {
        super();
        this.firstName = firstName;
        this.lastName = lastName;
        this.email = email;
        this.passwordHash = passwordHash;
        this.passwordSalt = passwordSalt;
        this.address = address;
    }

    protected User(UUID id, String firstName, String lastName, String email,
                   String passwordHash, String passwordSalt, Address address,
                   LocalDateTime createdAt, LocalDateTime updatedAt) {
        super(id, createdAt, updatedAt);
        this.firstName = firstName;
        this.lastName = lastName;
        this.email = email;
        this.passwordHash = passwordHash;
        this.passwordSalt = passwordSalt;
        this.address = address;
    }

    public abstract Role getRole();

    public boolean isAuthority() {
        return getRole() == Role.AUTHORITY;
    }

    public String getFullName() {
        return firstName + " " + lastName;
    }

    public String getFirstName() {
        return firstName;
    }

    public String getLastName() {
        return lastName;
    }

    public String getEmail() {
        return email;
    }

    public String getPasswordHash() {
        return passwordHash;
    }

    public String getPasswordSalt() {
        return passwordSalt;
    }

    public Address getAddress() {
        return address;
    }

    /** Troca o endereço atual (o endereço antigo continua no banco). */
    public void moveTo(Address newAddress) {
        this.address = newAddress;
    }
}
