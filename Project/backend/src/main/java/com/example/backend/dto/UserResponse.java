package com.example.backend.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

public record UserResponse(
        String loginId,
        String email,
        String nickname,
        String gender,
        LocalDate birthDate,
        String phone,
        LocalDateTime createdAt,
        String profileImageUrl,
        List<String> tags
) {}
