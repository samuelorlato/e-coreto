package br.com.fiap.ecoreto.model;

import java.time.LocalDateTime;
import java.util.UUID;

public class Resident extends User {

    public Resident(String firstName, String lastName, String email,
                    String passwordHash, String passwordSalt, Address address) {
        super(firstName, lastName, email, passwordHash, passwordSalt, address);
    }

    public Resident(UUID id, String firstName, String lastName, String email,
                    String passwordHash, String passwordSalt, Address address,
                    LocalDateTime createdAt, LocalDateTime updatedAt) {
        super(id, firstName, lastName, email, passwordHash, passwordSalt, address, createdAt, updatedAt);
    }

    @Override
    public Role getRole() {
        return Role.RESIDENT;
    }
}
