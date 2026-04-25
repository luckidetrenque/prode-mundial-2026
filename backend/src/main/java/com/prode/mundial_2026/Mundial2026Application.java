package com.prode.mundial_2026;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

// @SpringBootApplication combina tres anotaciones:
//   @Configuration        → esta clase configura el contexto de Spring
//   @EnableAutoConfiguration → Spring detecta y configura todo automáticamente
//   @ComponentScan        → escanea todos los @Component, @Service, etc.

@SpringBootApplication
public class Mundial2026Application {

	public static void main(String[] args) {
		SpringApplication.run(Mundial2026Application.class, args);
	}

}
