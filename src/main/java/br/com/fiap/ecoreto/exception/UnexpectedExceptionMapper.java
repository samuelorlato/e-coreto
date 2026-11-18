package br.com.fiap.ecoreto.exception;

import jakarta.ws.rs.ProcessingException;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.ext.ExceptionMapper;
import jakarta.ws.rs.ext.Provider;

/** Qualquer outra exceção: 500 com mensagem genérica. O detalhe fica só no console. */
@Provider
public class UnexpectedExceptionMapper implements ExceptionMapper<Exception> {

    @Override
    public Response toResponse(Exception e) {
        // JSON que não dá para converter (ex.: texto onde se esperava número) chega como ProcessingException
        if (e instanceof ProcessingException) {
            return ErrorResponse.build(400, "Requisição inválida. Confira o corpo enviado.");
        }
        System.err.println("[ERRO INESPERADO] " + e);
        e.printStackTrace();
        return ErrorResponse.build(500, "Erro inesperado. Tente novamente mais tarde.");
    }
}
