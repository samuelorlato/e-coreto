package br.com.fiap.ecoreto.service;

import br.com.fiap.ecoreto.exception.ValidationException;

import java.util.ArrayList;
import java.util.List;
import java.util.regex.Pattern;

final class Validator {

    private static final Pattern EMAIL = Pattern.compile("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$");

    private final List<String> errors = new ArrayList<>();

    Validator required(String value, String label, int maxLength) {
        if (value == null || value.isBlank()) {
            errors.add(label + " é obrigatório.");
        } else {
            maxLength(value, label, maxLength);
        }
        return this;
    }

    Validator maxLength(String value, String label, int maxLength) {
        if (value != null && value.length() > maxLength) {
            errors.add(label + " deve ter no máximo " + maxLength + " caracteres.");
        }
        return this;
    }

    Validator email(String value) {
        if (value == null || value.isBlank()) {
            errors.add("E-mail é obrigatório.");
        } else if (!EMAIL.matcher(value).matches() || value.length() > 160) {
            errors.add("E-mail inválido.");
        }
        return this;
    }

    Validator matches(String value, String regex, String message) {
        if (value != null && !value.matches(regex)) {
            errors.add(message);
        }
        return this;
    }

    Validator check(boolean condition, String message) {
        if (!condition) {
            errors.add(message);
        }
        return this;
    }

    void throwIfInvalid() {
        if (!errors.isEmpty()) {
            throw new ValidationException("Confira os campos informados.", errors);
        }
    }

    static String clean(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
