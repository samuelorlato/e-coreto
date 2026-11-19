package br.com.fiap.ecoreto.service;

import br.com.fiap.ecoreto.dao.ProposalDao;
import br.com.fiap.ecoreto.dao.ProposalStatusHistoryDao;
import br.com.fiap.ecoreto.dao.UserDao;
import br.com.fiap.ecoreto.dao.VoteCount;
import br.com.fiap.ecoreto.dao.VoteDao;
import br.com.fiap.ecoreto.exception.ConflictException;
import br.com.fiap.ecoreto.exception.NotFoundException;
import br.com.fiap.ecoreto.exception.ValidationException;
import br.com.fiap.ecoreto.model.Proposal;
import br.com.fiap.ecoreto.model.ProposalStatus;
import br.com.fiap.ecoreto.model.ProposalStatusHistory;
import br.com.fiap.ecoreto.model.User;
import br.com.fiap.ecoreto.model.Vote;
import br.com.fiap.ecoreto.model.VoteType;

import java.sql.Connection;
import java.sql.SQLException;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public class VoteService {

    public VoteSummary summary(User me, UUID proposalId) {
        return Tx.read(c -> buildSummary(c, ProposalService.load(c, proposalId), me));
    }

    public VoteSummary vote(User me, UUID proposalId, VoteType type) {
        if (type == null) {
            throw new ValidationException("Informe o voto.", List.of("type deve ser IN_FAVOR ou AGAINST."));
        }
        return Tx.write(c -> {
            Proposal proposal = ProposalService.load(c, proposalId);
            requireVotingOpen(proposal);

            VoteDao votes = new VoteDao(c);
            UUID addressId = me.getAddress().getId();
            Optional<Vote> existing = votes.findByUserAndProposal(me.getId(), proposalId);
            if (existing.isPresent()) {
                Vote vote = existing.get();
                vote.change(type, addressId);
                votes.update(vote);
            } else {
                votes.insert(new Vote(me.getId(), proposalId, type, addressId));
            }

            checkThreshold(c, proposal);
            return buildSummary(c, proposal, me);
        });
    }

    public VoteSummary removeVote(User me, UUID proposalId) {
        return Tx.write(c -> {
            Proposal proposal = ProposalService.load(c, proposalId);
            requireVotingOpen(proposal);

            VoteDao votes = new VoteDao(c);
            Vote vote = votes.findByUserAndProposal(me.getId(), proposalId)
                    .orElseThrow(() -> new NotFoundException("Você ainda não votou nesta proposta."));
            votes.delete(vote.getId());

            checkThreshold(c, proposal);
            return buildSummary(c, proposal, me);
        });
    }

    private void requireVotingOpen(Proposal proposal) {
        if (proposal.isArchived()) {
            throw new ConflictException("A proposta está arquivada e não recebe mais votos.");
        }
        if (!proposal.getStatus().isVotingOpen()) {
            throw new ConflictException("A votação está encerrada: os votos desta proposta estão congelados.");
        }
    }

    private void checkThreshold(Connection c, Proposal proposal) throws SQLException {
        if (proposal.getStatus() != ProposalStatus.COLLECTING_VOTES) {
            return;
        }
        VoteCount count = new VoteDao(c).countByProposal(proposal.getId());
        int residents = new UserDao(c).countResidents();
        if (VoteThresholdPolicy.isReached(count, residents, Settings.load(c))) {
            proposal.changeStatus(ProposalStatus.AWAITING_REVIEW);
            new ProposalDao(c).update(proposal);
            new ProposalStatusHistoryDao(c).insert(new ProposalStatusHistory(
                    proposal.getId(), ProposalStatus.COLLECTING_VOTES, ProposalStatus.AWAITING_REVIEW, null));
        }
    }

    private VoteSummary buildSummary(Connection c, Proposal proposal, User me) throws SQLException {
        Settings settings = Settings.load(c);
        VoteCount count = new VoteDao(c).countByProposal(proposal.getId());
        int residents = new UserDao(c).countResidents();
        VoteType myVote = new VoteDao(c).findByUserAndProposal(me.getId(), proposal.getId())
                .map(Vote::getType).orElse(null);

        return new VoteSummary(
                count.getInFavor(),
                count.getAgainst(),
                VoteThresholdPolicy.requiredVotes(residents, settings),
                VoteThresholdPolicy.favorPercentage(count),
                settings.approvalPercentage().doubleValue(),
                VoteThresholdPolicy.hasQuorum(count, residents, settings),
                VoteThresholdPolicy.hasMajority(count, settings),
                proposal.getStatus() != ProposalStatus.COLLECTING_VOTES,
                !proposal.isArchived() && proposal.getStatus().isVotingOpen(),
                myVote);
    }
}
