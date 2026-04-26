package com.prode.mundial_2026;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import io.github.cdimascio.dotenv.Dotenv;

// @SpringBootApplication combina tres anotaciones:
//   @Configuration        → esta clase configura el contexto de Spring
//   @EnableAutoConfiguration → Spring detecta y configura todo automáticamente
//   @ComponentScan        → escanea todos los @Component, @Service, etc.

@SpringBootApplication
public class Mundial2026Application {

	public static void main(String[] args) {
		// Cargar variables de entorno desde el archivo .env
		Dotenv dotenv = Dotenv.configure().ignoreIfMissing().load();
		dotenv.entries().forEach(entry -> System.setProperty(entry.getKey(), entry.getValue()));

		SpringApplication.run(Mundial2026Application.class, args);
	}
}
