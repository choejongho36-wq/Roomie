package com.example.backend.dto;

import jakarta.validation.constraints.NotBlank;

import java.time.LocalDate;

public record SocialSignupRequest(
        @NotBlank String ticket,
        @NotBlank String nickname,
        @NotBlank String gender,
        LocalDate birthDate,
        String phone,
        @NotBlank String job
) {}