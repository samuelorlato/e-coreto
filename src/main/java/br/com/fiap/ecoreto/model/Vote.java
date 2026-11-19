package br.com.fiap.ecoreto.model;

import java.time.LocalDateTime;
import java.util.UUID;

public class Vote extends BaseEntity {

    private final UUID userId;
    private final UUID proposalId;
    private VoteType type;
    private UUID addressId;

    public Vote(UUID userId, UUID proposalId, VoteType type, UUID addressId) {
        super();
        this.userId = userId;
        this.proposalId = proposalId;
        this.type = type;
        this.addressId = addressId;
    }

    public Vote(UUID id, UUID userId, UUID proposalId, VoteType type, UUID addressId,
                LocalDateTime createdAt, LocalDateTime updatedAt) {
        super(id, createdAt, updatedAt);
        this.userId = userId;
        this.proposalId = proposalId;
        this.type = type;
        this.addressId = addressId;
    }

    public void change(VoteType newType, UUID currentAddressId) {
        this.type = newType;
        this.addressId = currentAddressId;
    }

    public UUID getUserId() {
        return userId;
    }

    public UUID getProposalId() {
        return proposalId;
    }

    public VoteType getType() {
        return type;
    }

    public UUID getAddressId() {
        return addressId;
    }
}
