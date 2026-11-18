package br.com.fiap.ecoreto.exception;

import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.ext.ExceptionMapper;
import jakarta.ws.rs.ext.Provider;

/** Erro de banco: registra no console e devolve mensagem genérica (nunca o texto do Oracle). */
@Provider
public class DataAccessExceptionMapper implements ExceptionMapper<DataAccessException> {

    @Override
    public Response toResponse(DataAccessException e) {
        System.err.println("[ERRO DE BANCO] " + e.getCause());
        e.printStackTrace();
        return ErrorResponse.build(500, "Erro ao acessar o banco de dados. Tente novamente mais tarde.");
    }
}
