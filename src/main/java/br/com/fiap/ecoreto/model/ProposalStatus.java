package br.com.fiap.ecoreto.model;

import java.util.EnumSet;
import java.util.Set;

/**
 * Situações de uma proposta (README, seção 4). Os valores batem com o CHECK ck_proposals_status.
 *
 * <pre>
 * COLLECTING_VOTES -> AWAITING_REVIEW (automático) -> UNDER_REVIEW -> APPROVED -> IN_PROGRESS -> COMPLETED
 *                          AWAITING_REVIEW / UNDER_REVIEW -> REJECTED
 * </pre>
 */
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

    /** Nome da situação em português, para mensagens ao usuário. */
    public String getLabel() {
        return label;
    }

    /** Transições que uma autoridade pode fazer manualmente (RN-14, RN-15). */
    public Set<ProposalStatus> manualTransitions() {
        return switch (this) {
            case AWAITING_REVIEW -> EnumSet.of(UNDER_REVIEW, REJECTED);
            case UNDER_REVIEW -> EnumSet.of(APPROVED, REJECTED);
            case APPROVED -> EnumSet.of(IN_PROGRESS);
            case IN_PROGRESS -> EnumSet.of(COMPLETED);
            // COLLECTING_VOTES só sai pelo limiar (automático). REJECTED e COMPLETED são finais.
            default -> EnumSet.noneOf(ProposalStatus.class);
        };
    }

    public boolean canChangeManuallyTo(ProposalStatus target) {
        return manualTransitions().contains(target);
    }

    /** RN-09: votos podem ser criados, alterados ou retirados só nestas situações. */
    public boolean isVotingOpen() {
        return this == COLLECTING_VOTES || this == AWAITING_REVIEW;
    }

    /** RN-17: situações em que a autoridade pode publicar resposta oficial. */
    public boolean acceptsOfficialResponse() {
        return this == APPROVED || this == REJECTED || this == IN_PROGRESS || this == COMPLETED;
    }
}
