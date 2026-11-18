package br.com.fiap.ecoreto.model;

import java.time.LocalDateTime;
import java.util.UUID;

/** Autoridade: cadastrada por carga administrativa, nunca pelo autocadastro (RN-01). */
public class Authority extends User {

    private final String jobTitle;
    private final String department;

    public Authority(UUID id, String firstName, String lastName, String email,
                     String passwordHash, String passwordSalt, Address address,
                     String jobTitle, String department,
                     LocalDateTime createdAt, LocalDateTime updatedAt) {
        super(id, firstName, lastName, email, passwordHash, passwordSalt, address, createdAt, updatedAt);
        this.jobTitle = jobTitle;
        this.department = department;
    }

    @Override
    public Role getRole() {
        return Role.AUTHORITY;
    }

    public String getJobTitle() {
        return jobTitle;
    }

    public String getDepartment() {
        return department;
    }
}
