/**
 * Regras de negócio (RN-01 a RN-20) e controle de transação.
 *
 * <p>Regras da camada:
 * <ul>
 *   <li>Toda regra de negócio fica aqui: permissões por perfil, transições de status, limiar de apoio, validações.</li>
 *   <li>O service abre a conexão (via {@code Tx}) e a repassa para os DAOs. Operações com mais de um passo
 *       (mudar status + histórico + arquivar) acontecem numa transação só.</li>
 *   <li>Sem SQL aqui: o SQL fica no dao.</li>
 *   <li>Sem JAX-RS/JSON aqui: o service recebe valores simples e devolve entidades ou "views".</li>
 *   <li>Sempre usa o usuário autenticado recebido do resource, nunca um id vindo do front.</li>
 *   <li>Erros de negócio lançam as exceções do pacote exception, com mensagem em português.</li>
 * </ul>
 */
package br.com.fiap.ecoreto.service;
