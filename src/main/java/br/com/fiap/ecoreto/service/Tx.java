package br.com.fiap.ecoreto.service;

import br.com.fiap.ecoreto.config.ConnectionFactory;
import br.com.fiap.ecoreto.exception.ConflictException;
import br.com.fiap.ecoreto.exception.DataAccessException;

import java.sql.Connection;
import java.sql.SQLException;
import java.sql.SQLIntegrityConstraintViolationException;

/**
 * Abre a conexão e controla a transação para os services. É o mesmo padrão do guia (seção 3),
 * escrito uma vez só para não repetir o try/commit/rollback em todo método:
 *
 * <pre>
 * try (Connection c = ConnectionFactory.getConnection()) {
 *     c.setAutoCommit(false);
 *     try { ...; c.commit(); } catch (Exception e) { c.rollback(); throw e; }
 * }
 * </pre>
 *
 * Uso: {@code Tx.write(c -> { new ProposalDao(c).update(p); return p; });}
 */
final class Tx {

    /** Trabalho que usa a conexão. Pode lançar SQLException. */
    @FunctionalInterface
    interface Work<T> {
        T run(Connection c) throws SQLException;
    }

    private Tx() {
    }

    /** Só leitura: abre a conexão, executa e fecha. */
    static <T> T read(Work<T> work) {
        try (Connection c = ConnectionFactory.getConnection()) {
            return work.run(c);
        } catch (SQLException e) {
            throw translate(e);
        }
    }

    /** Escrita atômica: commit se tudo der certo, rollback em qualquer erro (inclusive de negócio). */
    static <T> T write(Work<T> work) {
        try (Connection c = ConnectionFactory.getConnection()) {
            c.setAutoCommit(false);
            try {
                T result = work.run(c);
                c.commit();
                return result;
            } catch (SQLException | RuntimeException e) {
                c.rollback();
                throw e;
            }
        } catch (SQLException e) {
            throw translate(e);
        }
    }

    private static RuntimeException translate(SQLException e) {
        if (e instanceof SQLIntegrityConstraintViolationException) {
            // Ex.: dois cadastros simultâneos com o mesmo e-mail passando pela checagem do service
            return new ConflictException("O registro já existe ou está em uso por outro registro.");
        }
        return new DataAccessException(e);
    }
}
