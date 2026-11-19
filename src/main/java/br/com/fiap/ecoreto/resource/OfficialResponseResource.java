package br.com.fiap.ecoreto.resource;

import br.com.fiap.ecoreto.resource.dto.OfficialResponseResponse;
import br.com.fiap.ecoreto.resource.dto.ResponseRequest;
import br.com.fiap.ecoreto.security.CurrentUser;
import br.com.fiap.ecoreto.service.OfficialResponseService;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.core.SecurityContext;

import java.util.List;

@Path("proposals/{id}/responses")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class OfficialResponseResource {

    private final OfficialResponseService service = new OfficialResponseService();

    @GET
    public List<OfficialResponseResponse> list(@PathParam("id") String id) {
        return service.list(Params.pathId(id, ProposalResource.NOT_FOUND)).stream()
                .map(OfficialResponseResponse::from).toList();
    }

    @POST
    public Response publish(@Context SecurityContext security, @PathParam("id") String id, ResponseRequest body) {
        OfficialResponseResponse created = OfficialResponseResponse.from(service.publish(
                CurrentUser.from(security), Params.pathId(id, ProposalResource.NOT_FOUND),
                body == null ? null : body.content));
        return Response.status(Response.Status.CREATED).entity(created).build();
    }
}
