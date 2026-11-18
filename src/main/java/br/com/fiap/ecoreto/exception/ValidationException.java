package br.com.fiap.ecoreto.exception;

import java.util.List;

/** 400: campo obrigatório vazio ou formato inválido. details lista os problemas de cada campo. */
public class ValidationException extends BusinessException {

    public ValidationException(String message, List<String> details) {
        super(message, details);
    }

    public ValidationException(String message) {
        super(message);
    }
}
