package com.example.backend.dto;

import java.time.LocalDateTime;

public record NotificationResponse(
        Long notificationId,
        Long senderId,
        String senderNickname,
        String senderProfileImageUrl,
        String content,
        boolean read,
        LocalDateTime createdAt
) {}
