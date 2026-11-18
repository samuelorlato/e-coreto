package br.com.fiap.ecoreto.model;

import java.time.LocalDateTime;
import java.util.UUID;

/** Resposta oficial de uma autoridade. Imutável: nunca é editada nem apagada (RN-18). */
public class OfficialResponse extends BaseEntity {

    private final UUID proposalId;
    private final UUID createdBy;
    private final String content;
    /** Situação da proposta quando a resposta foi publicada (RN-19). */
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
