package br.com.fiap.ecoreto.resource;

import br.com.fiap.ecoreto.exception.ValidationException;
import br.com.fiap.ecoreto.model.User;
import br.com.fiap.ecoreto.resource.dto.AddressRequest;
import br.com.fiap.ecoreto.resource.dto.RegisterRequest;
import br.com.fiap.ecoreto.resource.dto.UserResponse;
import br.com.fiap.ecoreto.security.CurrentUser;
import br.com.fiap.ecoreto.service.UserService;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.PUT;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.core.SecurityContext;

import java.util.List;

@Path("users")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class UserResource {

    private final UserService service = new UserService();

    @POST
    public Response register(RegisterRequest body) {
        if (body == null) {
            throw new ValidationException("Envie os dados do cadastro.");
        }
        User created = service.registerResident(body.firstName, body.lastName, body.email, body.password,
                body.address == null ? null : body.address.toModel());
        return Response.status(Response.Status.CREATED).entity(UserResponse.from(created)).build();
    }

    @GET
    @Path("me")
    public UserResponse me(@Context SecurityContext security) {
        return UserResponse.from(CurrentUser.from(security));
    }

    @PUT
    @Path("me/address")
    public UserResponse changeAddress(@Context SecurityContext security, AddressRequest body) {
        if (body == null) {
            throw new ValidationException("Confira os campos informados.", List.of("Endereço é obrigatório."));
        }
        return UserResponse.from(service.changeAddress(CurrentUser.from(security), body.toModel()));
    }
}
