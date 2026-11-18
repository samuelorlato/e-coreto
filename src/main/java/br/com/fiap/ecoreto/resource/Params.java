package br.com.fiap.ecoreto.resource;

import br.com.fiap.ecoreto.exception.NotFoundException;
import br.com.fiap.ecoreto.exception.ValidationException;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/** Conversão de parâmetros de texto (path, query, corpo) para UUID e enums, com erro em português. */
final class Params {

    private Params() {
    }

    /** Id da URL: se não for um UUID válido, o registro não existe (404). */
    static UUID pathId(String value, String notFoundMessage) {
        try {
            return UUID.fromString(value);
        } catch (IllegalArgumentException | NullPointerException e) {
            throw new NotFoundException(notFoundMessage);
        }
    }

    /** Id opcional de query string ou corpo: inválido é erro de validação (400). */
    static UUID optionalId(String value, String field) {
        if (value == null || value.isBlank()) {
            return null;
        }
        try {
            return UUID.fromString(value.trim());
        } catch (IllegalArgumentException e) {
            throw new ValidationException("Confira os campos informados.", List.of(field + " inválido."));
        }
    }

    static List<UUID> ids(List<String> values, String field) {
        List<UUID> result = new ArrayList<>();
        if (values != null) {
            for (String v : values) {
                UUID id = optionalId(v, field);
                if (id != null) {
                    result.add(id);
                }
            }
        }
        return result;
    }

    /** Converte texto em enum; vazio vira null; valor fora da lista é 400 com os valores aceitos. */
    static <E extends Enum<E>> E optionalEnum(Class<E> type, String value, String field) {
        if (value == null || value.isBlank()) {
            return null;
        }
        try {
            return Enum.valueOf(type, value.trim().toUpperCase());
        } catch (IllegalArgumentException e) {
            List<String> accepted = new ArrayList<>();
            for (E constant : type.getEnumConstants()) {
                accepted.add(constant.name());
            }
            throw new ValidationException("Confira os campos informados.",
                    List.of(field + " inválido. Valores aceitos: " + String.join(", ", accepted) + "."));
        }
    }
}
