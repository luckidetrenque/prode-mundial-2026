package com.prode.mundial_2026.security;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.util.Base64;
import java.util.Date;

@Component
public class JwtUtil {

    @Value("${jwt.secret}")
    private String secret;

    @Value("${jwt.expiration}")
    private Long expiration;

    /**
     * FIX #8: Validación de longitud mínima del secret al arrancar la aplicación.
     * HMAC-SHA256 requiere al menos 256 bits (32 bytes) de clave.
     * Sin esta validación, un secret corto lanzaría una excepción críptica en
     * runtime
     * la primera vez que se intenta generar un token, con un mensaje poco claro.
     *
     * Cómo generar un secret válido:
     * openssl rand -base64 64
     */
    @PostConstruct
    void validarSecret() {
        if (secret == null || secret.isBlank()) {
            throw new IllegalStateException(
                    "JWT_SECRET no configurado. Agregá JWT_SECRET en el archivo .env");
        }
        byte[] bytes;
        try {
            bytes = Base64.getDecoder().decode(secret);
        } catch (IllegalArgumentException e) {
            throw new IllegalStateException(
                    "JWT_SECRET no es un string Base64 válido. " +
                            "Generá uno con: openssl rand -base64 64",
                    e);
        }
        // HMAC-SHA256 requiere mínimo 32 bytes (256 bits)
        if (bytes.length < 32) {
            throw new IllegalStateException(
                    "JWT_SECRET demasiado corto (" + bytes.length + " bytes). " +
                            "Se requieren al menos 32 bytes. " +
                            "Generá uno con: openssl rand -base64 64");
        }
    }

    public String generarToken(String email, int tokenVersion) {
        return Jwts.builder()
                .subject(email)
                .claim("tv", tokenVersion)
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + expiration))
                .signWith(getKey())
                .compact();
    }

    public String extraerEmail(String token) {
        return getClaims(token).getSubject();
    }

    public int extraerTokenVersion(String token) {
        Object tv = getClaims(token).get("tv");
        if (tv == null)
            return 0;
        if (tv instanceof Integer)
            return (Integer) tv;
        if (tv instanceof Long)
            return ((Long) tv).intValue();
        if (tv instanceof String)
            return Integer.parseInt((String) tv);
        return 0;
    }

    public boolean esTokenValido(String token) {
        try {
            getClaims(token);
            return true;
        } catch (JwtException | IllegalArgumentException e) {
            return false;
        }
    }

    private SecretKey getKey() {
        byte[] keyBytes = Base64.getDecoder().decode(secret);
        return Keys.hmacShaKeyFor(keyBytes);
    }

    private Claims getClaims(String token) {
        return Jwts.parser()
                .verifyWith(getKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }
}