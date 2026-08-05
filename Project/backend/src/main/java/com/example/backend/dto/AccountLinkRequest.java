package com.example.backend.dto;

import jakarta.validation.constraints.NotBlank;

public record AccountLinkRequest(
        @NotBlank String ticket,
        @NotBlank String password
) {}