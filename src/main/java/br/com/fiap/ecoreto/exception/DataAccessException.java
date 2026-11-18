package br.com.fiap.ecoreto.exception;

/**
 * 500: falha no banco. Embrulha a SQLException para os services não precisarem declarar throws.
 * A mensagem do Oracle vai só para o log, nunca para o usuário.
 */
public class DataAccessException extends RuntimeException {

    public DataAccessException(Throwable cause) {
        super(cause);
    }
}
