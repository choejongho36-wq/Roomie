package com.example.backend.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;

public record PostResponse(
        Long postId,
        Long userId,
        String nickname,
        String authorProfileImageUrl,
        String title,
        String region,
        Integer budgetMin,
        Integer budgetMax,
        LocalDate moveInDate,
        Integer moveInMonthMin,
        Integer moveInMonthMax,
        String roomType,
        Integer recruitCount,
        String description,
        String tags,
        String boardType,
        String status,
        Integer viewCount,
        Long bookmarkCount,
        Boolean bookmarked,
        LocalDateTime createdAt,
        LocalDateTime updatedAt,
        Boolean pinned,
        Integer pinOrder,
        Long recommendCount,
        Boolean recommended
) {}
