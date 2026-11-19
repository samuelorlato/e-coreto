package br.com.fiap.ecoreto.resource;

import br.com.fiap.ecoreto.exception.ValidationException;
import br.com.fiap.ecoreto.model.ProposalStatus;
import br.com.fiap.ecoreto.resource.dto.HistoryResponse;
import br.com.fiap.ecoreto.resource.dto.ProposalRequest;
import br.com.fiap.ecoreto.resource.dto.ProposalResponse;
import br.com.fiap.ecoreto.resource.dto.StatusRequest;
import br.com.fiap.ecoreto.security.CurrentUser;
import br.com.fiap.ecoreto.service.ProposalService;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.PUT;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.QueryParam;
import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.core.SecurityContext;

import java.util.List;
import java.util.UUID;

@Path("proposals")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class ProposalResource {

    static final String NOT_FOUND = "Proposta não encontrada.";

    private final ProposalService service = new ProposalService();

    @GET
    public List<ProposalResponse> list(@QueryParam("status") String status,
                                       @QueryParam("category") String category,
                                       @QueryParam("archived") String archived) {
        ProposalStatus st = Params.optionalEnum(ProposalStatus.class, status, "status");
        UUID categoryId = Params.optionalId(category, "category");
        boolean onlyArchived = "true".equalsIgnoreCase(archived);
        return service.list(st, categoryId, onlyArchived).stream().map(ProposalResponse::from).toList();
    }

    @POST
    public Response create(@Context SecurityContext security, ProposalRequest body) {
        ProposalRequest b = require(body);
        ProposalResponse created = ProposalResponse.from(service.create(CurrentUser.from(security),
                b.title, b.description, b.body, Params.ids(b.categoryIds, "categoryIds")));
        return Response.status(Response.Status.CREATED).entity(created).build();
    }

    @GET
    @Path("{id}")
    public ProposalResponse get(@PathParam("id") String id) {
        return ProposalResponse.from(service.get(Params.pathId(id, NOT_FOUND)));
    }

    @PUT
    @Path("{id}")
    public ProposalResponse edit(@Context SecurityContext security, @PathParam("id") String id,
                                 ProposalRequest body) {
        ProposalRequest b = require(body);
        return ProposalResponse.from(service.edit(CurrentUser.from(security), Params.pathId(id, NOT_FOUND),
                b.title, b.description, b.body, Params.ids(b.categoryIds, "categoryIds")));
    }

    @POST
    @Path("{id}/status")
    public ProposalResponse changeStatus(@Context SecurityContext security, @PathParam("id") String id,
                                         StatusRequest body) {
        ProposalStatus target = Params.optionalEnum(ProposalStatus.class, body == null ? null : body.status, "status");
        return ProposalResponse.from(
                service.changeStatus(CurrentUser.from(security), Params.pathId(id, NOT_FOUND), target));
    }

    @POST
    @Path("{id}/archive")
    public ProposalResponse archive(@Context SecurityContext security, @PathParam("id") String id) {
        return ProposalResponse.from(service.archive(CurrentUser.from(security), Params.pathId(id, NOT_FOUND)));
    }

    @GET
    @Path("{id}/history")
    public List<HistoryResponse> history(@PathParam("id") String id) {
        return service.history(Params.pathId(id, NOT_FOUND)).stream().map(HistoryResponse::from).toList();
    }

    private ProposalRequest require(ProposalRequest body) {
        if (body == null) {
            throw new ValidationException("Envie os dados da proposta.");
        }
        return body;
    }
}
