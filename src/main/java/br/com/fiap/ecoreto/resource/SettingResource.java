package br.com.fiap.ecoreto.resource;

import br.com.fiap.ecoreto.resource.dto.SettingRequest;
import br.com.fiap.ecoreto.resource.dto.SettingResponse;
import br.com.fiap.ecoreto.security.CurrentUser;
import br.com.fiap.ecoreto.service.SettingService;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.PUT;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.SecurityContext;

import java.util.List;

@Path("settings")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class SettingResource {

    private final SettingService service = new SettingService();

    @GET
    public List<SettingResponse> list() {
        return service.list().stream().map(SettingResponse::from).toList();
    }

    /** PUT /settings/quorum_percentage com { "value": 15 }. Só autoridades. */
    @PUT
    @Path("{key}")
    public SettingResponse update(@Context SecurityContext security, @PathParam("key") String key,
                                  SettingRequest body) {
        return SettingResponse.from(service.update(CurrentUser.from(security), key,
                body == null ? null : body.value));
    }
}
