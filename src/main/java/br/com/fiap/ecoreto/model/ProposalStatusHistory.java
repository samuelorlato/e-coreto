package br.com.fiap.ecoreto.model;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Registro de uma mudança de situação (RN-20). Imutável.
 * changedBy nulo significa mudança automática, feita pelo sistema.
 */
public class ProposalStatusHistory extends BaseEntity {

    private final UUID proposalId;
    private final ProposalStatus fromStatus;
    private final ProposalStatus toStatus;
    private final UUID changedBy;

    public ProposalStatusHistory(UUID proposalId, ProposalStatus fromStatus,
                                 ProposalStatus toStatus, UUID changedBy) {
        super();
        this.proposalId = proposalId;
        this.fromStatus = fromStatus;
        this.toStatus = toStatus;
        this.changedBy = changedBy;
    }

    public ProposalStatusHistory(UUID id, UUID proposalId, ProposalStatus fromStatus,
                                 ProposalStatus toStatus, UUID changedBy,
                                 LocalDateTime createdAt, LocalDateTime updatedAt) {
        super(id, createdAt, updatedAt);
        this.proposalId = proposalId;
        this.fromStatus = fromStatus;
        this.toStatus = toStatus;
        this.changedBy = changedBy;
    }

    public boolean isAutomatic() {
        return changedBy == null;
    }

    public UUID getProposalId() {
        return proposalId;
    }

    public ProposalStatus getFromStatus() {
        return fromStatus;
    }

    public ProposalStatus getToStatus() {
        return toStatus;
    }

    public UUID getChangedBy() {
        return changedBy;
    }
}
