package com.example.backend.dto;

import java.time.LocalDate;

public record MatchedPairConditionsRequest(
        String region,
        Integer depositMax,
        Integer monthlyRentMax,
        LocalDate moveInDate
) {}