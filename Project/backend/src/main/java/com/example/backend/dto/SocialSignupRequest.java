package com.example.backend.dto;

import jakarta.validation.constraints.NotBlank;

import java.time.LocalDate;

public record SocialSignupRequest(
        @NotBlank String ticket,
        @NotBlank String nickname,
        @NotBlank String gender,
        LocalDate birthDate,
        String phone,
        // 직업은 "거의 다 됐어요!" 화면에서 더 이상 입력받지 않아 프론트에서 항상 빈 문자열("")을 보낸다.
        // @NotBlank가 남아있으면 이 필드 검증에 걸려 신규 소셜가입 저장 자체가 실패한다.
        String job
) {}