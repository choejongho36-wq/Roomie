package com.example.backend.dto;

import java.time.LocalDateTime;

public record ConversationResponse(
        Long partnerId,
        String partnerNickname,
        String partnerProfileImageUrl,
        String lastMessage,
        LocalDateTime lastMessageAt
) {}
