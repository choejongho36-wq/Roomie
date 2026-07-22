package com.example.backend.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;

public record SignupRequest(
                @NotBlank @Email String email,
                @NotBlank @Size(min = 8) String password,
                @NotBlank String nickname,
                @NotBlank String gender,
                @NotNull LocalDate birthDate) {
}