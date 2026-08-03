package com.example.backend.dto;

import java.time.LocalDateTime;

public record MyCommentResponse(
        Long commentId,
        Long postId,
        String postTitle,
        String content,
        LocalDateTime createdAt
) {}
