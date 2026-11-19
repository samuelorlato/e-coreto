package br.com.fiap.ecoreto.exception;

import jakarta.ws.rs.WebApplicationException;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.ext.ExceptionMapper;
import jakarta.ws.rs.ext.Provider;

@Provider
public class WebApplicationExceptionMapper implements ExceptionMapper<WebApplicationException> {

    @Override
    public Response toResponse(WebApplicationException e) {
        int status = e.getResponse() != null ? e.getResponse().getStatus() : 500;
        String message = switch (status) {
            case 400 -> "Requisição inválida. Confira o corpo enviado.";
            case 401 -> "Credenciais inválidas.";
            case 403 -> "Você não tem permissão para esta ação.";
            case 404 -> "Recurso não encontrado.";
            case 405 -> "Método não permitido para esta rota.";
            case 415 -> "Envie o corpo em JSON (Content-Type: application/json).";
            default -> "Erro inesperado. Tente novamente mais tarde.";
        };
        return ErrorResponse.build(status, message);
    }
}
