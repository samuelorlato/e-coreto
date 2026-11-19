package br.com.fiap.ecoreto.model;

import java.time.LocalDateTime;
import java.util.UUID;

public class Category extends BaseEntity {

    private String name;
    private String slug;
    private final UUID createdBy;

    public Category(String name, String slug, UUID createdBy) {
        super();
        this.name = name;
        this.slug = slug;
        this.createdBy = createdBy;
    }

    public Category(UUID id, String name, String slug, UUID createdBy,
                    LocalDateTime createdAt, LocalDateTime updatedAt) {
        super(id, createdAt, updatedAt);
        this.name = name;
        this.slug = slug;
        this.createdBy = createdBy;
    }

    public void rename(String newName, String newSlug) {
        this.name = newName;
        this.slug = newSlug;
    }

    public boolean isCreatedBy(UUID userId) {
        return createdBy.equals(userId);
    }

    public String getName() {
        return name;
    }

    public String getSlug() {
        return slug;
    }

    public UUID getCreatedBy() {
        return createdBy;
    }
}
