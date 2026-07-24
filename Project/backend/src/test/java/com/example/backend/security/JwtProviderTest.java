package com.example.backend.security;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class JwtProviderTest {

    private final JwtProvider jwtProvider = new JwtProvider(
            "roomie-test-secret-key-please-replace-in-production-32bytes+",
            1000 * 60
    );

    @Test
    void createsAndParsesValidToken() {
        String token = jwtProvider.createToken("user@example.com");

        assertTrue(jwtProvider.isValid(token));
        assertEquals("user@example.com", jwtProvider.getEmail(token));
    }

    @Test
    void rejectsTamperedToken() {
        String token = jwtProvider.createToken("user@example.com");

        assertFalse(jwtProvider.isValid(token + "tampered"));
    }
}
