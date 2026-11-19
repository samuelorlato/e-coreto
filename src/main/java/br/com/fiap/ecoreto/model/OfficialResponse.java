package br.com.fiap.ecoreto.model;

import java.time.LocalDateTime;
import java.util.UUID;

public class OfficialResponse extends BaseEntity {

    private final UUID proposalId;
    private final UUID createdBy;
    private final String content;
    private final ProposalStatus proposalStatus;

    public OfficialResponse(UUID proposalId, UUID createdBy, String content, ProposalStatus proposalStatus) {
        super();
        this.proposalId = proposalId;
        this.createdBy = createdBy;
        this.content = content;
        this.proposalStatus = proposalStatus;
    }

    public OfficialResponse(UUID id, UUID proposalId, UUID createdBy, String content,
                            ProposalStatus proposalStatus, LocalDateTime createdAt, LocalDateTime updatedAt) {
        super(id, createdAt, updatedAt);
        this.proposalId = proposalId;
        this.createdBy = createdBy;
        this.content = content;
        this.proposalStatus = proposalStatus;
    }

    public UUID getProposalId() {
        return proposalId;
    }

    public UUID getCreatedBy() {
        return createdBy;
    }

    public String getContent() {
        return content;
    }

    public ProposalStatus getProposalStatus() {
        return proposalStatus;
    }
}
