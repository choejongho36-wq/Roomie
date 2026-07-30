package com.example.backend.dto;

public record MatchedPairConditionsRequest(
        String region,
        Integer depositMax,
        Integer monthlyRentMax
) {}