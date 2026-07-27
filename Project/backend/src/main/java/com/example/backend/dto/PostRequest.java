package com.example.backend.dto;

import java.time.LocalDate;

public record PostRequest(
        String title,
        String region,
        Integer budgetMin,
        Integer budgetMax,
        LocalDate moveInDate,
        String roomType,
        Integer recruitCount,
        String description,
        String tags,
        String boardType
) {}
