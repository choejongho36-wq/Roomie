package com.example.backend.dto;

import java.time.LocalDateTime;

public record ChatMessageResponse(
        Long messageId,
        Long senderId,
        Long receiverId,
        String content,
        LocalDateTime createdAt
) {}
