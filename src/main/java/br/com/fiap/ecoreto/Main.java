package br.com.fiap.ecoreto;

import br.com.fiap.ecoreto.config.ServerConfig;
import org.glassfish.grizzly.http.server.HttpServer;

public class Main {

    public static void main(String[] args) throws InterruptedException {
        HttpServer server = ServerConfig.start();
        Runtime.getRuntime().addShutdownHook(new Thread(server::shutdownNow));
        System.out.println("API no ar em " + ServerConfig.baseUri() + " (Ctrl+C para parar)");
        Thread.currentThread().join();
    }
}
