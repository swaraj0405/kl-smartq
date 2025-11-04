package com.klsmartq.service;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import java.time.Instant;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;
import java.util.Date;

@Component
public class JwtUtil {

    @Value("${jwt.secret:dev-secret-kl-smartq}")
    private String jwtSecret;

    public boolean validateToken(String token) {
        try {
            Claims claims = Jwts.parserBuilder()
                    .setSigningKey(Keys.hmacShaKeyFor(adjustKey(jwtSecret.getBytes(StandardCharsets.UTF_8))))
                    .build()
                    .parseClaimsJws(token)
                    .getBody();
            Date exp = claims.getExpiration();
            return exp == null || exp.after(new Date());
        } catch (Exception ex) {
            return false;
        }
    }

    public String getUserIdFromToken(String token) {
        Claims claims = Jwts.parserBuilder()
                .setSigningKey(Keys.hmacShaKeyFor(adjustKey(jwtSecret.getBytes(StandardCharsets.UTF_8))))
                .build()
                .parseClaimsJws(token)
                .getBody();
        return claims.getSubject();
    }

    public String generateToken(String subject, String email, long expirationSeconds) {
        java.util.Date exp = java.util.Date.from(Instant.now().plusSeconds(expirationSeconds));
        return Jwts.builder()
                .setSubject(subject)
                .claim("email", email)
                .setExpiration(exp)
                .signWith(Keys.hmacShaKeyFor(adjustKey(jwtSecret.getBytes(StandardCharsets.UTF_8))), SignatureAlgorithm.HS256)
                .compact();
    }

    private static byte[] adjustKey(byte[] input) {
        if (input.length >= 32) return input;
        byte[] out = new byte[32];
        for (int i = 0; i < out.length; i++) {
            out[i] = input[i % input.length];
        }
        return out;
    }
}
