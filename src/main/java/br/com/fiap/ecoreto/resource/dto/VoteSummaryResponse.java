package br.com.fiap.ecoreto.resource.dto;

import br.com.fiap.ecoreto.service.VoteSummary;

/** Placar da proposta. Não expõe votos individuais, só os totais e o voto do próprio usuário. */
public class VoteSummaryResponse {

    public int inFavor;
    public int against;
    public int total;
    public int requiredVotes;
    public double favorPercentage;
    public double approvalPercentage;
    public boolean quorumReached;
    public boolean majorityReached;
    public boolean thresholdReached;
    public boolean votingOpen;
    public String myVote;

    public static VoteSummaryResponse from(VoteSummary s) {
        VoteSummaryResponse r = new VoteSummaryResponse();
        r.inFavor = s.getInFavor();
        r.against = s.getAgainst();
        r.total = s.getTotal();
        r.requiredVotes = s.getRequiredVotes();
        r.favorPercentage = s.getFavorPercentage();
        r.approvalPercentage = s.getApprovalPercentage();
        r.quorumReached = s.isQuorumReached();
        r.majorityReached = s.isMajorityReached();
        r.thresholdReached = s.isThresholdReached();
        r.votingOpen = s.isVotingOpen();
        r.myVote = s.getMyVote() == null ? null : s.getMyVote().name();
        return r;
    }
}
