package com.example.backend.dto;

import java.time.LocalDate;

public record AdditionalInfoRequest(
        String nickname, String gender, LocalDate birthDate, String phone, String job
) {}