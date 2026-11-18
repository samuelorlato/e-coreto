package br.com.fiap.ecoreto.resource.dto;

import br.com.fiap.ecoreto.model.Category;

import java.time.LocalDateTime;

public class CategoryResponse {

    public String id;
    public String name;
    public String slug;
    public String createdBy;
    public LocalDateTime createdAt;
    public LocalDateTime updatedAt;

    public static CategoryResponse from(Category c) {
        CategoryResponse r = new CategoryResponse();
        r.id = c.getId().toString();
        r.name = c.getName();
        r.slug = c.getSlug();
        r.createdBy = c.getCreatedBy().toString();
        r.createdAt = c.getCreatedAt();
        r.updatedAt = c.getUpdatedAt();
        return r;
    }
}
