package br.com.fiap.ecoreto.resource;

import br.com.fiap.ecoreto.model.VoteType;
import br.com.fiap.ecoreto.resource.dto.VoteRequest;
import br.com.fiap.ecoreto.resource.dto.VoteSummaryResponse;
import br.com.fiap.ecoreto.security.CurrentUser;
import br.com.fiap.ecoreto.service.VoteService;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.DELETE;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.PUT;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.SecurityContext;

@Path("proposals/{id}/votes")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class VoteResource {

    private final VoteService service = new VoteService();

    @GET
    @Path("summary")
    public VoteSummaryResponse summary(@Context SecurityContext security, @PathParam("id") String id) {
        return VoteSummaryResponse.from(service.summary(CurrentUser.from(security),
                Params.pathId(id, ProposalResource.NOT_FOUND)));
    }

    @PUT
    @Path("me")
    public VoteSummaryResponse vote(@Context SecurityContext security, @PathParam("id") String id,
                                    VoteRequest body) {
        VoteType type = Params.optionalEnum(VoteType.class, body == null ? null : body.type, "type");
        return VoteSummaryResponse.from(service.vote(CurrentUser.from(security),
                Params.pathId(id, ProposalResource.NOT_FOUND), type));
    }

    @DELETE
    @Path("me")
    public VoteSummaryResponse remove(@Context SecurityContext security, @PathParam("id") String id) {
        return VoteSummaryResponse.from(service.removeVote(CurrentUser.from(security),
                Params.pathId(id, ProposalResource.NOT_FOUND)));
    }
}
