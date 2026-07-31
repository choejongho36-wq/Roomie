package com.example.backend.dto;

import jakarta.validation.constraints.NotBlank;

public record WithdrawRequest(@NotBlank String password) {}