package br.com.fiap.ecoreto.resource.dto;

import br.com.fiap.ecoreto.model.Proposal;
import br.com.fiap.ecoreto.service.ProposalView;

import java.time.LocalDateTime;
import java.util.List;

public class ProposalResponse {

    public String id;
    public String title;
    public String description;
    public String body;
    public String status;
    public String statusLabel;
    public String createdBy;
    public String authorName;
    public boolean archived;
    public LocalDateTime archivedAt;
    public String archivedBy;
    public List<CategoryResponse> categories;
    public int votesInFavor;
    public int votesAgainst;
    public int votesTotal;
    public LocalDateTime createdAt;
    public LocalDateTime updatedAt;

    public static ProposalResponse from(ProposalView view) {
        Proposal p = view.getProposal();
        ProposalResponse r = new ProposalResponse();
        r.id = p.getId().toString();
        r.title = p.getTitle();
        r.description = p.getDescription();
        r.body = p.getBody();
        r.status = p.getStatus().name();
        r.statusLabel = p.getStatus().getLabel();
        r.createdBy = p.getCreatedBy().toString();
        r.authorName = view.getAuthorName();
        r.archived = p.isArchived();
        r.archivedAt = p.getArchivedAt();
        r.archivedBy = p.getArchivedBy() == null ? null : p.getArchivedBy().toString();
        r.categories = p.getCategories().stream().map(CategoryResponse::from).toList();
        r.votesInFavor = view.getVotes().getInFavor();
        r.votesAgainst = view.getVotes().getAgainst();
        r.votesTotal = view.getVotes().getTotal();
        r.createdAt = p.getCreatedAt();
        r.updatedAt = p.getUpdatedAt();
        return r;
    }
}
