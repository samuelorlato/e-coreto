package br.com.fiap.ecoreto.tools;

import br.com.fiap.ecoreto.security.PasswordHasher;

public final class SeedPasswordGenerator {

    private static final String DEFAULT_PASSWORD = "Demo@2026";
    private static final int DEFAULT_COUNT = 12;

    private SeedPasswordGenerator() {
    }

    public static void main(String[] args) {
        String password = args.length > 0 ? args[0] : DEFAULT_PASSWORD;
        int count = args.length > 1 ? Integer.parseInt(args[1]) : DEFAULT_COUNT;

        System.out.println("-- Senha de demonstracao (todas as contas): " + password);
        System.out.println("-- Formato: 'password_salt', 'password_hash'  -- #linha");
        for (int i = 1; i <= count; i++) {
            String salt = PasswordHasher.generateSalt();
            String hash = PasswordHasher.hash(password, salt);
            if (!PasswordHasher.matches(password, salt, hash)) {
                throw new IllegalStateException("Falha na verificação do hash #" + i);
            }
            System.out.printf("'%s', '%s'  -- #%02d%n", salt, hash, i);
        }
    }
}
