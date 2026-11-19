package br.com.fiap.ecoreto.service;

import br.com.fiap.ecoreto.dao.CategoryDao;
import br.com.fiap.ecoreto.dao.ProposalDao;
import br.com.fiap.ecoreto.dao.ProposalStatusHistoryDao;
import br.com.fiap.ecoreto.dao.VoteDao;
import br.com.fiap.ecoreto.exception.ConflictException;
import br.com.fiap.ecoreto.exception.ForbiddenException;
import br.com.fiap.ecoreto.exception.NotFoundException;
import br.com.fiap.ecoreto.exception.ValidationException;
import br.com.fiap.ecoreto.model.Category;
import br.com.fiap.ecoreto.model.Proposal;
import br.com.fiap.ecoreto.model.ProposalStatus;
import br.com.fiap.ecoreto.model.ProposalStatusHistory;
import br.com.fiap.ecoreto.model.User;

import java.sql.Connection;
import java.sql.SQLException;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;

public class ProposalService {

    public List<ProposalView> list(ProposalStatus status, UUID categoryId, boolean archived) {
        return Tx.read(c -> {
            UserNames names = new UserNames(c);
            List<ProposalView> result = new ArrayList<>();
            for (Proposal p : new ProposalDao(c).list(status, categoryId, archived)) {
                result.add(toView(c, p, names));
            }
            return result;
        });
    }

    public ProposalView get(UUID id) {
        return Tx.read(c -> toView(c, load(c, id), new UserNames(c)));
    }

    public ProposalView create(User me, String title, String description, String body, List<UUID> categoryIds) {
        String t = Validator.clean(title);
        String d = Validator.clean(description);
        String b = Validator.clean(body);
        validateContent(t, d, b);

        return Tx.write(c -> {
            List<Category> categories = loadCategories(c, categoryIds);
            Proposal proposal = new Proposal(t, d, b, me.getId());
            proposal.setCategories(categories);

            ProposalDao proposals = new ProposalDao(c);
            proposals.insert(proposal);
            proposals.replaceCategories(proposal.getId(), categories);
            new ProposalStatusHistoryDao(c).insert(new ProposalStatusHistory(
                    proposal.getId(), null, ProposalStatus.COLLECTING_VOTES, me.getId()));
            return toView(c, proposal, new UserNames(c));
        });
    }

    public ProposalView edit(User me, UUID id, String title, String description, String body,
                             List<UUID> categoryIds) {
        String t = Validator.clean(title);
        String d = Validator.clean(description);
        String b = Validator.clean(body);
        validateContent(t, d, b);

        return Tx.write(c -> {
            Proposal proposal = load(c, id);
            if (!proposal.isAuthor(me.getId())) {
                throw new ForbiddenException("Só o autor pode editar a proposta.");
            }
            if (proposal.isArchived() || proposal.getStatus() != ProposalStatus.COLLECTING_VOTES) {
                throw new ConflictException("A proposta só pode ser editada enquanto está coletando apoio.");
            }
            List<Category> categories = loadCategories(c, categoryIds);
            proposal.edit(t, d, b);
            proposal.setCategories(categories);

            ProposalDao proposals = new ProposalDao(c);
            proposals.update(proposal);
            proposals.replaceCategories(proposal.getId(), categories);
            return toView(c, proposal, new UserNames(c));
        });
    }

    public ProposalView changeStatus(User me, UUID id, ProposalStatus target) {
        requireAuthority(me, "Só autoridades podem mudar a situação de uma proposta.");
        if (target == null) {
            throw new ValidationException("Informe a nova situação.", List.of("status é obrigatório."));
        }

        return Tx.write(c -> {
            Proposal proposal = load(c, id);
            if (proposal.isArchived()) {
                throw new ConflictException("A proposta está arquivada e não pode mudar de situação.");
            }
            ProposalStatus from = proposal.getStatus();
            if (!from.canChangeManuallyTo(target)) {
                throw new ConflictException(transitionError(from, target));
            }

            proposal.changeStatus(target);
            if (target == ProposalStatus.REJECTED) {
                proposal.archive(me.getId());
            }
            new ProposalDao(c).update(proposal);
            new ProposalStatusHistoryDao(c).insert(new ProposalStatusHistory(id, from, target, me.getId()));
            return toView(c, proposal, new UserNames(c));
        });
    }

    public ProposalView archive(User me, UUID id) {
        requireAuthority(me, "Só autoridades podem arquivar propostas.");

        return Tx.write(c -> {
            Proposal proposal = load(c, id);
            if (proposal.isArchived()) {
                throw new ConflictException("A proposta já está arquivada.");
            }
            if (proposal.getStatus() != ProposalStatus.COLLECTING_VOTES) {
                throw new ConflictException(
                        "Só propostas que não atingiram o limiar de apoio podem ser arquivadas manualmente.");
            }
            int days = Settings.load(c).staleAfterDays();
            if (proposal.getCreatedAt().isAfter(LocalDateTime.now().minusDays(days))) {
                throw new ConflictException(
                        "A proposta só pode ser arquivada após " + days + " dias sem atingir o limiar de apoio.");
            }
            proposal.archive(me.getId());
            new ProposalDao(c).update(proposal);
            return toView(c, proposal, new UserNames(c));
        });
    }

    public List<HistoryEntryView> history(UUID id) {
        return Tx.read(c -> {
            load(c, id);
            UserNames names = new UserNames(c);
            List<HistoryEntryView> result = new ArrayList<>();
            for (ProposalStatusHistory h : new ProposalStatusHistoryDao(c).findByProposal(id)) {
                result.add(new HistoryEntryView(h, names.of(h.getChangedBy())));
            }
            return result;
        });
    }

    static Proposal load(Connection c, UUID id) throws SQLException {
        Proposal proposal = new ProposalDao(c).findById(id)
                .orElseThrow(() -> new NotFoundException("Proposta não encontrada."));
        proposal.setCategories(new CategoryDao(c).findByProposal(id));
        return proposal;
    }

    static void requireAuthority(User me, String message) {
        if (!me.isAuthority()) {
            throw new ForbiddenException(message);
        }
    }

    private ProposalView toView(Connection c, Proposal p, UserNames names) throws SQLException {
        if (p.getCategories().isEmpty()) {
            p.setCategories(new CategoryDao(c).findByProposal(p.getId()));
        }
        return new ProposalView(p, names.of(p.getCreatedBy()), new VoteDao(c).countByProposal(p.getId()));
    }

    private void validateContent(String title, String description, String body) {
        new Validator()
                .required(title, "Título", 120)
                .required(description, "Resumo", 500)
                .required(body, "Texto completo", 4000)
                .throwIfInvalid();
    }

    private List<Category> loadCategories(Connection c, List<UUID> ids) throws SQLException {
        int max = Settings.load(c).maxCategoriesPerProposal();
        Set<UUID> unique = new LinkedHashSet<>();
        if (ids != null) {
            for (UUID id : ids) {
                if (id != null) {
                    unique.add(id);
                }
            }
        }
        if (unique.isEmpty() || unique.size() > max) {
            throw new ValidationException("Confira os campos informados.",
                    List.of("Escolha de 1 a " + max + " categorias."));
        }
        CategoryDao dao = new CategoryDao(c);
        List<Category> categories = new ArrayList<>();
        for (UUID id : unique) {
            categories.add(dao.findById(id).orElseThrow(() -> new ValidationException(
                    "Confira os campos informados.", List.of("Categoria não encontrada: " + id))));
        }
        return categories;
    }

    private String transitionError(ProposalStatus from, ProposalStatus to) {
        if (to == ProposalStatus.REJECTED && from == ProposalStatus.COLLECTING_VOTES) {
            return "A proposta só pode ser recusada depois de atingir o limiar de apoio.";
        }
        if (to == ProposalStatus.AWAITING_REVIEW) {
            return "A passagem para \"Aguardando análise\" é automática, ao atingir o limiar de apoio.";
        }
        return "Não é possível mudar de \"" + from.getLabel() + "\" para \"" + to.getLabel() + "\".";
    }
}
