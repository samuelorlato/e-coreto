package br.com.fiap.ecoreto.service;

import br.com.fiap.ecoreto.dao.VoteCount;
import br.com.fiap.ecoreto.model.Proposal;

/** Proposta pronta para exibir: a entidade + nome do autor + contagem de votos. */
public class ProposalView {

    private final Proposal proposal;
    private final String authorName;
    private final VoteCount votes;

    ProposalView(Proposal proposal, String authorName, VoteCount votes) {
        this.proposal = proposal;
        this.authorName = authorName;
        this.votes = votes;
    }

    public Proposal getProposal() {
        return proposal;
    }

    public String getAuthorName() {
        return authorName;
    }

    public VoteCount getVotes() {
        return votes;
    }
}
