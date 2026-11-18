package br.com.fiap.ecoreto.model;

import java.time.LocalDateTime;
import java.util.Objects;
import java.util.UUID;

/**
 * Base de todas as entidades: id UUID e datas de criação/atualização.
 */
public abstract class BaseEntity {

    private UUID id;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    /** Usado ao criar um registro novo: gera o id e as datas. */
    protected BaseEntity() {
        this.id = UUID.randomUUID();
        this.createdAt = LocalDateTime.now();
        this.updatedAt = this.createdAt;
    }

    /** Usado pelo DAO ao ler um registro do banco. */
    protected BaseEntity(UUID id, LocalDateTime createdAt, LocalDateTime updatedAt) {
        this.id = Objects.requireNonNull(id, "id");
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    /** Atualiza o updatedAt. O DAO chama antes de gravar um update. */
    public void touch() {
        this.updatedAt = LocalDateTime.now();
    }

    public UUID getId() {
        return id;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) {
            return true;
        }
        if (o == null || getClass() != o.getClass()) {
            return false;
        }
        return id.equals(((BaseEntity) o).id);
    }

    @Override
    public int hashCode() {
        return id.hashCode();
    }
}
