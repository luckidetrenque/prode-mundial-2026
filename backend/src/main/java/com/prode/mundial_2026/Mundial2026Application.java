package com.prode.mundial_2026;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;
import io.github.cdimascio.dotenv.Dotenv;

/**
 * FIX #6: @EnableScheduling necesario para que el @Scheduled de
 * LoginRateLimitFilter.limpiarContadoresExpirados() se ejecute.
 * Sin esta anotación, el método existe pero Spring nunca lo invoca.
 */
@SpringBootApplication
@EnableScheduling
public class Mundial2026Application {

	public static void main(String[] args) {
		Dotenv dotenv = Dotenv.configure().ignoreIfMissing().load();
		dotenv.entries().forEach(entry -> System.setProperty(entry.getKey(), entry.getValue()));

		SpringApplication.run(Mundial2026Application.class, args);
	}
}