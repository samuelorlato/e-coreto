package br.com.fiap.ecoreto.exception;

import java.util.List;

public class ValidationException extends BusinessException {

    public ValidationException(String message, List<String> details) {
        super(message, details);
    }

    public ValidationException(String message) {
        super(message);
    }
}
