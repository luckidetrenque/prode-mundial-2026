package com.prode.mundial_2026.security;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.util.Base64;
import java.util.Date;

// @Component → Spring crea una instancia de esta clase y la gestiona
@Component
public class JwtUtil {

    // Lee el valor de jwt.secret desde application.properties
    @Value("${jwt.secret}")
    private String secret;

    @Value("${jwt.expiration}")
    private Long expiration; // en milisegundos (86400000 = 24 horas)

    // Genera la clave criptográfica a partir del secreto
    private SecretKey getKey() {
        byte[] keyBytes = Base64.getDecoder().decode(secret);
        return Keys.hmacShaKeyFor(keyBytes);
    }

    // Genera un token JWT para el usuario autenticado
    // El "subject" es el número de afiliado del admin
    public String generarToken(Integer afiliado) {
        return Jwts.builder()
                .subject(afiliado.toString())
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + expiration))
                .signWith(getKey())
                .compact();
    }

    // Extrae el número de afiliado del token
    public Integer extraerAfiliado(String token) {
        String subject = Jwts.parser()
                .verifyWith(getKey())
                .build()
                .parseSignedClaims(token)
                .getPayload()
                .getSubject();
        return Integer.parseInt(subject);
    }

    // Verifica si el token es válido (firma correcta y no expirado)
    public boolean esTokenValido(String token) {
        try {
            Jwts.parser()
                    .verifyWith(getKey())
                    .build()
                    .parseSignedClaims(token);
            return true;
        } catch (JwtException | IllegalArgumentException e) {
            // Token inválido, expirado o mal formado
            return false;
        }
    }
}
