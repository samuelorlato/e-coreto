package br.com.fiap.ecoreto.model;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/** Proposta de melhoria criada por um usuário. */
public class Proposal extends BaseEntity {

    private String title;
    private String description;
    private String body;
    private ProposalStatus status;
    private final UUID createdBy;
    private LocalDateTime archivedAt;
    private UUID archivedBy;
    private List<Category> categories = new ArrayList<>();

    /** Nova proposta: sempre nasce em COLLECTING_VOTES (RN-05). */
    public Proposal(String title, String description, String body, UUID createdBy) {
        super();
        this.title = title;
        this.description = description;
        this.body = body;
        this.createdBy = createdBy;
        this.status = ProposalStatus.COLLECTING_VOTES;
    }

    public Proposal(UUID id, String title, String description, String body, ProposalStatus status,
                    UUID createdBy, LocalDateTime archivedAt, UUID archivedBy,
                    LocalDateTime createdAt, LocalDateTime updatedAt) {
        super(id, createdAt, updatedAt);
        this.title = title;
        this.description = description;
        this.body = body;
        this.status = status;
        this.createdBy = createdBy;
        this.archivedAt = archivedAt;
        this.archivedBy = archivedBy;
    }

    public void edit(String title, String description, String body) {
        this.title = title;
        this.description = description;
        this.body = body;
    }

    public void changeStatus(ProposalStatus newStatus) {
        this.status = newStatus;
    }

    public void archive(UUID byUserId) {
        this.archivedAt = LocalDateTime.now();
        this.archivedBy = byUserId;
    }

    public boolean isArchived() {
        return archivedAt != null;
    }

    public boolean isAuthor(UUID userId) {
        return createdBy.equals(userId);
    }

    public String getTitle() {
        return title;
    }

    public String getDescription() {
        return description;
    }

    public String getBody() {
        return body;
    }

    public ProposalStatus getStatus() {
        return status;
    }

    public UUID getCreatedBy() {
        return createdBy;
    }

    public LocalDateTime getArchivedAt() {
        return archivedAt;
    }

    public UUID getArchivedBy() {
        return archivedBy;
    }

    public List<Category> getCategories() {
        return categories;
    }

    public void setCategories(List<Category> categories) {
        this.categories = new ArrayList<>(categories);
    }
}
