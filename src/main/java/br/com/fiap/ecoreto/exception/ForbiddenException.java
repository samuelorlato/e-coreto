package br.com.fiap.ecoreto.exception;

/** 403: o usuário está autenticado, mas o perfil dele não permite a ação. */
public class ForbiddenException extends BusinessException {

    public ForbiddenException(String message) {
        super(message);
    }
}
