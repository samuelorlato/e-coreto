/**
 * Entidades e enums do domínio.
 *
 * <p>Regras da camada:
 * <ul>
 *   <li>Não conhece DAO, service, JSON nem JAX-RS (sem anotações de framework).</li>
 *   <li>Todas as entidades estendem {@link br.com.fiap.ecoreto.model.BaseEntity} (id UUID, createdAt, updatedAt).</li>
 *   <li>Cada entidade tem dois construtores: um para criar (gera o id) e um para o DAO reconstruir do banco.</li>
 *   <li>Os valores dos enums batem com os CHECK do database/script.sql.</li>
 * </ul>
 */
package br.com.fiap.ecoreto.model;
