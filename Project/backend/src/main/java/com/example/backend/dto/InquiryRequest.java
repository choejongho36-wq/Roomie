package com.example.backend.dto;

public record InquiryRequest(
        String title,
        String category,
        String content,
        boolean secret
) {}
