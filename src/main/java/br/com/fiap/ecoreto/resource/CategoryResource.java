package br.com.fiap.ecoreto.resource;

import br.com.fiap.ecoreto.resource.dto.CategoryRequest;
import br.com.fiap.ecoreto.resource.dto.CategoryResponse;
import br.com.fiap.ecoreto.security.CurrentUser;
import br.com.fiap.ecoreto.service.CategoryService;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.DELETE;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.PUT;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.core.SecurityContext;

import java.util.List;

@Path("categories")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class CategoryResource {

    private static final String NOT_FOUND = "Categoria não encontrada.";

    private final CategoryService service = new CategoryService();

    @GET
    public List<CategoryResponse> list() {
        return service.list().stream().map(CategoryResponse::from).toList();
    }

    @POST
    public Response create(@Context SecurityContext security, CategoryRequest body) {
        String name = body == null ? null : body.name;
        CategoryResponse created = CategoryResponse.from(service.create(CurrentUser.from(security), name));
        return Response.status(Response.Status.CREATED).entity(created).build();
    }

    @PUT
    @Path("{id}")
    public CategoryResponse rename(@Context SecurityContext security, @PathParam("id") String id,
                                   CategoryRequest body) {
        String name = body == null ? null : body.name;
        return CategoryResponse.from(
                service.rename(CurrentUser.from(security), Params.pathId(id, NOT_FOUND), name));
    }

    @DELETE
    @Path("{id}")
    public Response delete(@Context SecurityContext security, @PathParam("id") String id) {
        service.delete(CurrentUser.from(security), Params.pathId(id, NOT_FOUND));
        return Response.noContent().build();
    }
}
