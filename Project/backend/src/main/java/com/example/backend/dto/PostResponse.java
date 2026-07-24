package com.example.backend.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;

public record PostResponse(
        Long postId,
        Long userId,
        String nickname,
        String region,
        Integer budgetMin,
        Integer budgetMax,
        LocalDate moveInDate,
        String roomType,
        Integer recruitCount,
        String description,
        String status,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {}
