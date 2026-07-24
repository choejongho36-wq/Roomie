package com.example.backend.dto;

public record PasswordChangeRequest(String currentPassword, String newPassword) {}
