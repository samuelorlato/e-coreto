package br.com.fiap.ecoreto.service;

import br.com.fiap.ecoreto.model.VoteType;

public class VoteSummary {

    private final int inFavor;
    private final int against;
    private final int requiredVotes;
    private final double favorPercentage;
    private final double approvalPercentage;
    private final boolean quorumReached;
    private final boolean majorityReached;
    private final boolean thresholdReached;
    private final boolean votingOpen;
    private final VoteType myVote;

    VoteSummary(int inFavor, int against, int requiredVotes, double favorPercentage,
                double approvalPercentage, boolean quorumReached, boolean majorityReached,
                boolean thresholdReached, boolean votingOpen, VoteType myVote) {
        this.inFavor = inFavor;
        this.against = against;
        this.requiredVotes = requiredVotes;
        this.favorPercentage = favorPercentage;
        this.approvalPercentage = approvalPercentage;
        this.quorumReached = quorumReached;
        this.majorityReached = majorityReached;
        this.thresholdReached = thresholdReached;
        this.votingOpen = votingOpen;
        this.myVote = myVote;
    }

    public int getInFavor() {
        return inFavor;
    }

    public int getAgainst() {
        return against;
    }

    public int getTotal() {
        return inFavor + against;
    }

    public int getRequiredVotes() {
        return requiredVotes;
    }

    public double getFavorPercentage() {
        return favorPercentage;
    }

    public double getApprovalPercentage() {
        return approvalPercentage;
    }

    public boolean isQuorumReached() {
        return quorumReached;
    }

    public boolean isMajorityReached() {
        return majorityReached;
    }

    public boolean isThresholdReached() {
        return thresholdReached;
    }

    public boolean isVotingOpen() {
        return votingOpen;
    }

    public VoteType getMyVote() {
        return myVote;
    }
}
