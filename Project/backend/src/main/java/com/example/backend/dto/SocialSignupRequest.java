package com.example.backend.dto;

import jakarta.validation.constraints.NotBlank;

import java.time.LocalDate;

public record SocialSignupRequest(
        @NotBlank String ticket,
        @NotBlank String gender,
        LocalDate birthDate,
        String phone,
        @NotBlank String region,
        @NotBlank String job,
        @NotBlank String smoking,
        String smokingType
) {}