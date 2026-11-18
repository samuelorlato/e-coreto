package br.com.fiap.ecoreto.exception;

import java.util.List;

/**
 * Base das exceções de negócio. A mensagem vai direto para o usuário, então é em português.
 */
public abstract class BusinessException extends RuntimeException {

    private final List<String> details;

    protected BusinessException(String message, List<String> details) {
        super(message);
        this.details = details == null ? List.of() : List.copyOf(details);
    }

    protected BusinessException(String message) {
        this(message, List.of());
    }

    public List<String> getDetails() {
        return details;
    }
}
