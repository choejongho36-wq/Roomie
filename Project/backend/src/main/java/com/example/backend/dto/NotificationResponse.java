package com.example.backend.dto;

import java.time.LocalDateTime;

public record NotificationResponse(
        Long notificationId,
        Long senderId,
        String senderNickname,
        String senderProfileImageUrl,
        String content,
        String type,
        Long targetId,
        boolean read,
        LocalDateTime createdAt
) {}
