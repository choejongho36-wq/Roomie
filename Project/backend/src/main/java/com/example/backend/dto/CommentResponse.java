package com.example.backend.dto;

import java.time.LocalDateTime;

public record CommentResponse(
        Long commentId,
        Long userId,
        String nickname,
        String profileImageUrl,
        Long parentCommentId,
        String content,
        LocalDateTime createdAt
) {}
