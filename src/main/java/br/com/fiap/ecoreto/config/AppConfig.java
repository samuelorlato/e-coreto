package br.com.fiap.ecoreto.config;

import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.Properties;

public final class AppConfig {

    private static final Properties PROPS = load();

    private AppConfig() {
    }

    public static String get(String key) {
        String envName = key.toUpperCase().replace('.', '_');
        String fromEnv = System.getenv(envName);
        if (fromEnv != null && !fromEnv.isBlank()) {
            return fromEnv;
        }
        String value = PROPS.getProperty(key);
        if (value == null) {
            throw new IllegalStateException("Configuração ausente: " + key);
        }
        return value;
    }

    public static int getInt(String key) {
        return Integer.parseInt(get(key).trim());
    }

    private static Properties load() {
        Properties props = new Properties();
        loadInto(props, "application.properties", true);
        loadInto(props, "application-local.properties", false);
        return props;
    }

    private static void loadInto(Properties props, String name, boolean required) {
        try (InputStream in = AppConfig.class.getClassLoader().getResourceAsStream(name)) {
            if (in == null) {
                if (required) {
                    throw new IllegalStateException("Arquivo não encontrado no classpath: " + name);
                }
                return;
            }
            props.load(new InputStreamReader(in, StandardCharsets.UTF_8));
        } catch (IOException e) {
            throw new IllegalStateException("Erro ao ler " + name, e);
        }
    }
}
