package br.com.fiap.ecoreto.exception;

/** 409: e-mail ou categoria duplicados, transição de status inválida, voto travado etc. */
public class ConflictException extends BusinessException {

    public ConflictException(String message) {
        super(message);
    }
}
