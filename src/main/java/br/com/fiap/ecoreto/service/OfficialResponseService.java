package br.com.fiap.ecoreto.service;

import br.com.fiap.ecoreto.dao.OfficialResponseDao;
import br.com.fiap.ecoreto.exception.ConflictException;
import br.com.fiap.ecoreto.model.OfficialResponse;
import br.com.fiap.ecoreto.model.Proposal;
import br.com.fiap.ecoreto.model.User;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/** Respostas oficiais (RN-17 a RN-19). Não existe editar nem apagar. */
public class OfficialResponseService {

    public List<ResponseView> list(UUID proposalId) {
        return Tx.read(c -> {
            ProposalService.load(c, proposalId);
            UserNames names = new UserNames(c);
            List<ResponseView> result = new ArrayList<>();
            for (OfficialResponse r : new OfficialResponseDao(c).findByProposal(proposalId)) {
                result.add(new ResponseView(r, names.of(r.getCreatedBy())));
            }
            return result;
        });
    }

    /**
     * RN-17: só autoridades, e só em propostas Aprovadas, Recusadas, Em execução ou Concluídas.
     * RN-19: grava a situação da proposta no momento da publicação.
     */
    public ResponseView publish(User me, UUID proposalId, String content) {
        ProposalService.requireAuthority(me, "Só autoridades podem publicar respostas oficiais.");
        String text = Validator.clean(content);
        new Validator().required(text, "Resposta", 2000).throwIfInvalid();

        return Tx.write(c -> {
            Proposal proposal = ProposalService.load(c, proposalId);
            if (!proposal.getStatus().acceptsOfficialResponse()) {
                throw new ConflictException("Respostas oficiais só podem ser publicadas em propostas "
                        + "aprovadas, recusadas, em execução ou concluídas.");
            }
            OfficialResponse response = new OfficialResponse(proposalId, me.getId(), text, proposal.getStatus());
            new OfficialResponseDao(c).insert(response);
            return new ResponseView(response, me.getFullName());
        });
    }
}
