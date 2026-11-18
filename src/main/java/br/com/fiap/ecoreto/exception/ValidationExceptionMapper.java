package br.com.fiap.ecoreto.exception;

import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.ext.ExceptionMapper;
import jakarta.ws.rs.ext.Provider;

@Provider
public class ValidationExceptionMapper implements ExceptionMapper<ValidationException> {

    @Override
    public Response toResponse(ValidationException e) {
        return ErrorResponse.build(400, e.getMessage(), e.getDetails());
    }
}
