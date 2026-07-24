package com.example.backend.dto;

public record CommentRequest(Long parentCommentId, String content) {}
