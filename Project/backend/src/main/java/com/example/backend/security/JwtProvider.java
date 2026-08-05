package com.example.backend.security;

import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;

@Component
public class JwtProvider {

    private final SecretKey key;
    private final long expirationMs;

    public JwtProvider(
            @Value("${jwt.secret}") String secret,
            @Value("${jwt.expiration-ms}") long expirationMs
    ) {
        this.key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        this.expirationMs = expirationMs;
    }

    public String createToken(String loginId) {
        Date now = new Date();
        Date expiry = new Date(now.getTime() + expirationMs);
        return Jwts.builder()
                .subject(loginId)
                .issuedAt(now)
                .expiration(expiry)
                .signWith(key)
                .compact();
    }

    public String getLoginId(String token) {
        return Jwts.parser()
                .verifyWith(key)
                .build()
                .parseSignedClaims(token)
                .getPayload()
                .getSubject();
    }

    public boolean isValid(String token) {
        try {
            Jwts.parser().verifyWith(key).build().parseSignedClaims(token);
            return true;
        } catch (JwtException | IllegalArgumentException e) {
            return false;
        }
    }

    // 계정 연동 티켓: 카카오 인증을 방금 통과한 사람만 발급받는 5분짜리 임시 토큰.
    // 로그인 토큰과 절대 혼용되지 않도록 purpose 클레임으로 구분함.
    public String createLinkTicket(String provider, String providerId, String email) {
        Date now = new Date();
        Date expiry = new Date(now.getTime() + 5 * 60 * 1000); // 5분
        return Jwts.builder()
                .subject(email)
                .claim("purpose", "account_link")
                .claim("provider", provider)
                .claim("providerId", providerId)
                .issuedAt(now)
                .expiration(expiry)
                .signWith(key)
                .compact();
    }

    // 검증 실패(만료/위조/용도 불일치)면 null 반환
    public io.jsonwebtoken.Claims parseLinkTicket(String ticket) {
        try {
            io.jsonwebtoken.Claims claims = Jwts.parser().verifyWith(key).build()
                    .parseSignedClaims(ticket).getPayload();
            if (!"account_link".equals(claims.get("purpose", String.class))) {
                return null;
            }
            return claims;
        } catch (JwtException | IllegalArgumentException e) {
            return null;
        }
    }
}