package com.example.backend.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

public record UserResponse(
        Long userId,
        String loginId,
        String email,
        String nickname,
        String gender,
        LocalDate birthDate,
        String phone,
        String region,
        String job,
        String smoking,
        String smokingType,
        LocalDateTime createdAt,
        String profileImageUrl,
        List<String> tags,
        String bio,
        String provider,
        Boolean emailVerified,
        Boolean isAdmin,
        Boolean needsAdditionalInfo,
        List<String> linkedProviders
) {}