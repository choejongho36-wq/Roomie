package com.example.backend.dto;

import jakarta.validation.constraints.NotNull;

public record MatchedPairCreateRequest(@NotNull Long partnerUserId) {}