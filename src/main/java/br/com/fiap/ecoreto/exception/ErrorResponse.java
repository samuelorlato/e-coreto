package br.com.fiap.ecoreto.exception;

import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

import java.util.List;

public class ErrorResponse {

    public int status;
    public String message;
    public List<String> details;

    public ErrorResponse() {
    }

    public ErrorResponse(int status, String message, List<String> details) {
        this.status = status;
        this.message = message;
        this.details = details == null ? List.of() : details;
    }

    /** Monta a Response HTTP já com o JSON de erro. */
    public static Response build(int status, String message, List<String> details) {
        return Response.status(status)
                .type(MediaType.APPLICATION_JSON_TYPE)
                .entity(new ErrorResponse(status, message, details))
                .build();
    }

    public static Response build(int status, String message) {
        return build(status, message, List.of());
    }
}
