package br.com.fiap.ecoreto.model;

import java.util.EnumSet;
import java.util.Set;

public enum ProposalStatus {
    COLLECTING_VOTES("Coletando apoio"),
    AWAITING_REVIEW("Aguardando análise"),
    UNDER_REVIEW("Em análise"),
    APPROVED("Aprovada"),
    REJECTED("Recusada"),
    IN_PROGRESS("Em execução"),
    COMPLETED("Concluída");

    private final String label;

    ProposalStatus(String label) {
        this.label = label;
    }

    public String getLabel() {
        return label;
    }

    public Set<ProposalStatus> manualTransitions() {
        return switch (this) {
            case AWAITING_REVIEW -> EnumSet.of(UNDER_REVIEW, REJECTED);
            case UNDER_REVIEW -> EnumSet.of(APPROVED, REJECTED);
            case APPROVED -> EnumSet.of(IN_PROGRESS);
            case IN_PROGRESS -> EnumSet.of(COMPLETED);
            default -> EnumSet.noneOf(ProposalStatus.class);
        };
    }

    public boolean canChangeManuallyTo(ProposalStatus target) {
        return manualTransitions().contains(target);
    }

    public boolean isVotingOpen() {
        return this == COLLECTING_VOTES || this == AWAITING_REVIEW;
    }

    public boolean acceptsOfficialResponse() {
        return this == APPROVED || this == REJECTED || this == IN_PROGRESS || this == COMPLETED;
    }
}
