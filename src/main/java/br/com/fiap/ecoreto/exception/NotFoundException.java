package br.com.fiap.ecoreto.exception;

/** 404: registro inexistente. */
public class NotFoundException extends BusinessException {

    public NotFoundException(String message) {
        super(message);
    }
}
