package br.com.fiap.ecoreto.tools;

import br.com.fiap.ecoreto.config.ConnectionFactory;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.sql.Connection;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.ArrayList;
import java.util.List;

public final class DatabaseSetup {

    private static final String DEFAULT_SCRIPT = "database/script.sql";

    private static final String[] TABLES = {
            "system_settings", "addresses", "users", "categories", "proposals",
            "proposal_categories", "votes", "official_responses", "proposal_status_history"
    };

    private DatabaseSetup() {
    }

    public static void main(String[] args) throws IOException {
        boolean dryRun = false;
        String scriptPath = DEFAULT_SCRIPT;
        for (String arg : args) {
            if ("--dry-run".equals(arg)) {
                dryRun = true;
            } else {
                scriptPath = arg;
            }
        }

        Path path = Path.of(scriptPath);
        if (!Files.exists(path)) {
            System.err.println("Script não encontrado: " + path.toAbsolutePath());
            System.err.println("Rode a partir da raiz do projeto ou informe o caminho como argumento.");
            System.exit(1);
        }

        List<String> statements = splitStatements(Files.readString(path, StandardCharsets.UTF_8));
        System.out.println("Script: " + path.toAbsolutePath() + " (" + statements.size() + " comandos)");

        if (dryRun) {
            System.out.println("Dry-run: nada foi executado.");
            return;
        }
        if (!execute(statements)) {
            System.exit(1);
        }
    }

    private static boolean execute(List<String> statements) {
        try (Connection connection = ConnectionFactory.getConnection();
             Statement statement = connection.createStatement()) {

            int number = 0;
            for (String sql : statements) {
                number++;
                try {
                    statement.execute(sql);
                } catch (SQLException e) {
                    System.err.printf("%nErro no comando %d de %d:%n%s%n%nOracle: %s%n",
                            number, statements.size(), preview(sql), e.getMessage());
                    return false;
                }
            }
            System.out.println("Concluído: " + statements.size() + " comandos executados com sucesso.");
            printSummary(statement);
            return true;

        } catch (SQLException e) {
            System.err.println("Não foi possível conectar ao banco: " + e.getMessage());
            System.err.println("Confira db.url, db.user e db.password (application-local.properties) "
                    + "ou as variáveis DB_URL, DB_USER e DB_PASSWORD.");
            return false;
        }
    }

    private static void printSummary(Statement statement) {
        System.out.println("Linhas por tabela:");
        for (String table : TABLES) {
            try (ResultSet rs = statement.executeQuery("SELECT COUNT(*) FROM " + table)) {
                rs.next();
                System.out.printf("  %-26s %d%n", table, rs.getInt(1));
            } catch (SQLException e) {
                System.out.printf("  %-26s (erro: %s)%n", table, e.getMessage());
            }
        }
    }

    private static String preview(String sql) {
        String oneLine = sql.replaceAll("\\s+", " ").trim();
        return oneLine.length() > 300 ? oneLine.substring(0, 300) + "..." : oneLine;
    }

    static List<String> splitStatements(String script) {
        List<String> result = new ArrayList<>();
        StringBuilder current = new StringBuilder();
        boolean inQuote = false;
        boolean inPlsql = false;

        for (String line : script.split("\\R", -1)) {
            if (inPlsql) {
                if (line.trim().equals("/")) {
                    addIfNotBlank(result, current);
                    inPlsql = false;
                } else {
                    current.append(line).append('\n');
                }
                continue;
            }

            if (!inQuote && current.toString().isBlank()) {
                String trimmed = line.trim();
                if (trimmed.isEmpty() || trimmed.startsWith("--")) {
                    continue;
                }
                String upper = trimmed.toUpperCase();
                if (upper.startsWith("BEGIN") || upper.startsWith("DECLARE")) {
                    inPlsql = true;
                    current.setLength(0);
                    current.append(line).append('\n');
                    continue;
                }
            }

            for (int i = 0; i < line.length(); i++) {
                char ch = line.charAt(i);
                if (inQuote) {
                    current.append(ch);
                    if (ch == '\'') {
                        if (i + 1 < line.length() && line.charAt(i + 1) == '\'') {
                            current.append('\'');
                            i++;
                        } else {
                            inQuote = false;
                        }
                    }
                } else if (ch == '\'') {
                    inQuote = true;
                    current.append(ch);
                } else if (ch == '-' && i + 1 < line.length() && line.charAt(i + 1) == '-') {
                    break;
                } else if (ch == ';') {
                    addIfNotBlank(result, current);
                } else {
                    current.append(ch);
                }
            }
            current.append('\n');
        }
        addIfNotBlank(result, current);
        return result;
    }

    private static void addIfNotBlank(List<String> result, StringBuilder current) {
        String sql = current.toString().trim();
        if (!sql.isEmpty()) {
            result.add(sql);
        }
        current.setLength(0);
    }
}