package br.com.fiap.ecoreto.exception;

import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.ext.ExceptionMapper;
import jakarta.ws.rs.ext.Provider;

@Provider
public class ConflictExceptionMapper implements ExceptionMapper<ConflictException> {

    @Override
    public Response toResponse(ConflictException e) {
        return ErrorResponse.build(409, e.getMessage(), e.getDetails());
    }
}
