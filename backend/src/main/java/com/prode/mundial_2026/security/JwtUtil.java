package com.prode.mundial_2026.security;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
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

    private SecretKey getKey() {
        byte[] keyBytes = Base64.getDecoder().decode(secret);
        return Keys.hmacShaKeyFor(keyBytes);
    }

    // ── FIX SEG #1 ────────────────────────────────────────────────────────────
    // Incluimos tokenVersion en el payload del JWT.
    // Al hacer logout, incrementamos tokenVersion en el Usuario (en la DB).
    // El JwtFilter compara la versión del token contra la versión actual del
    // usuario — si no coinciden, el token se rechaza aunque no haya expirado.
    // ─────────────────────────────────────────────────────────────────────────
    public String generarToken(String email, int tokenVersion) {
        return Jwts.builder()
                .subject(email)
                .claim("tv", tokenVersion)          // tv = token version
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + expiration))
                .signWith(getKey())
                .compact();
    }

    public String extraerEmail(String token) {
        return getClaims(token).getSubject();
    }

    // Extrae la versión del token del payload
    public int extraerTokenVersion(String token) {
        Object tv = getClaims(token).get("tv");
        if (tv == null) return 0;
        if (tv instanceof Integer) return (Integer) tv;
        if (tv instanceof Long)    return ((Long) tv).intValue();
        if (tv instanceof String)  return Integer.parseInt((String) tv);
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

    private Claims getClaims(String token) {
        return Jwts.parser()
                .verifyWith(getKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }
}
