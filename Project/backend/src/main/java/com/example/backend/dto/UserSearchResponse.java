package com.example.backend.dto;

public record UserSearchResponse(
        Long userId,
        String nickname,
        String profileImageUrl
) {}
