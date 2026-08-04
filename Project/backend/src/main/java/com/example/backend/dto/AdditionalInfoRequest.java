package com.example.backend.dto;

import java.time.LocalDate;

public record AdditionalInfoRequest(String gender, LocalDate birthDate, String phone, String region, String job) {}