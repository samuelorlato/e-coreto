package br.com.fiap.ecoreto.service;

import br.com.fiap.ecoreto.config.ConnectionFactory;
import br.com.fiap.ecoreto.exception.ConflictException;
import br.com.fiap.ecoreto.exception.DataAccessException;

import java.sql.Connection;
import java.sql.SQLException;
import java.sql.SQLIntegrityConstraintViolationException;

final class Tx {

    @FunctionalInterface
    interface Work<T> {
        T run(Connection c) throws SQLException;
    }

    private Tx() {
    }

    static <T> T read(Work<T> work) {
        try (Connection c = ConnectionFactory.getConnection()) {
            return work.run(c);
        } catch (SQLException e) {
            throw translate(e);
        }
    }

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
            return new ConflictException("O registro já existe ou está em uso por outro registro.");
        }
        return new DataAccessException(e);
    }
}
