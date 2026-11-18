/**
 * Acesso a dados via JDBC. É o único pacote com SQL.
 *
 * <p>Regras da camada:
 * <ul>
 *   <li>Cada DAO recebe a {@link java.sql.Connection} no construtor. Quem abre, faz commit/rollback
 *       e fecha a conexão é o service (assim vários DAOs participam da mesma transação).</li>
 *   <li>Sempre PreparedStatement com {@code ?} e try-with-resources. Nunca concatenar valores no SQL.</li>
 *   <li>UUID ↔ VARCHAR2 e LocalDateTime ↔ TIMESTAMP pelos métodos de {@code Jdbc}.</li>
 *   <li>Enums gravam {@code name()} e leem com {@code valueOf}.</li>
 *   <li>update chama {@code touch()} antes de gravar.</li>
 *   <li>Sem regra de negócio aqui: o DAO grava e lê, quem decide é o service.</li>
 *   <li>Address, OfficialResponse e ProposalStatusHistory são imutáveis: sem update nem delete.</li>
 * </ul>
 */
package br.com.fiap.ecoreto.dao;
