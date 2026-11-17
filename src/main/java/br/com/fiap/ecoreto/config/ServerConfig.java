package br.com.fiap.ecoreto.config;

import br.com.fiap.ecoreto.Main;
import org.glassfish.grizzly.http.server.HttpServer;
import org.glassfish.jersey.grizzly2.httpserver.GrizzlyHttpServerFactory;
import org.glassfish.jersey.server.ResourceConfig;

import java.net.URI;

public final class ServerConfig {

    private static final String API_PATH = "/api/";

    private ServerConfig() {
    }

    public static URI baseUri() {
        return URI.create("http://" + AppConfig.get("server.host") + ":"
                + AppConfig.getInt("server.port") + API_PATH);
    }

    public static HttpServer start() {
        String base = Main.class.getPackageName();
        ResourceConfig config = new ResourceConfig()
                .packages(base + ".resource", base + ".exception", base + ".security")
                .register(CorsFilter.class);
        return GrizzlyHttpServerFactory.createHttpServer(baseUri(), config);
    }
}
