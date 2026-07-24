package com.example.backend.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

public record UserResponse(
        Long userId,
        String email,
        String nickname,
        String gender,
        LocalDate birthDate,
        LocalDateTime createdAt,
        String profileImageUrl,
        List<String> tags,
        String bio
) {}
