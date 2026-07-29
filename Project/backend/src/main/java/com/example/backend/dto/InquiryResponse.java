package com.example.backend.dto;

import java.time.LocalDateTime;

public record InquiryResponse(
        Long inquiryId,
        Long userId,
        String nickname,
        String profileImageUrl,
        String title,
        String category,
        String content,
        String status,
        String answer,
        LocalDateTime createdAt,
        LocalDateTime answeredAt
) {}
