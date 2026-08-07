package com.example.backend.dto;

import java.time.LocalDateTime;

public record ConversationResponse(
        Long partnerId,
        String partnerNickname,
        String partnerProfileImageUrl,
        boolean partnerVerified,
        String lastMessage,
        LocalDateTime lastMessageAt,
        long unreadCount
) {}
