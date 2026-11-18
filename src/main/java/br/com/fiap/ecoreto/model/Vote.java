package br.com.fiap.ecoreto.model;

import java.time.LocalDateTime;
import java.util.UUID;

/** Voto de um usuário numa proposta (um por proposta, RN-08). */
public class Vote extends BaseEntity {

    private final UUID userId;
    private final UUID proposalId;
    private VoteType type;
    /** Endereço do votante no momento do voto (RN-10). */
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

    /** Muda o voto e registra o endereço atual do votante. */
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
