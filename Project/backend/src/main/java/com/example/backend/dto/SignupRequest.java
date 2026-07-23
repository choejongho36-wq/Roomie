package com.example.backend.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;


import java.time.LocalDate;

public record SignupRequest(
                @NotBlank
                @Pattern(
                    regexp = "^[a-z0-9]{4,20}$",
                    message = "아이디는 영문 소문자와 숫자로 4자 이상 20자 이하여야 합니다."
                )
                String loginId,

                @NotBlank @Email String email,

                @NotBlank @Size(min = 8, max = 24, message = "비밀번호는 8자 이상 24자 이하여야 합니다.")
                @Pattern(
                    regexp = "^(?=.*[A-Za-z])(?=.*\\d)(?=.*[^A-Za-z0-9]).+$",
                    message = "비밀번호는 영문, 숫자, 특수문자를 모두 포함해야 합니다."
                )
                String password,

                @NotBlank String nickname,
                @NotBlank String gender,
                @NotNull LocalDate birthDate,

                @NotBlank
                @Pattern(
                    regexp = "^[0-9]{10,11}$",
                    message = "휴대폰 번호는 숫자만 10~11자리로 입력해주세요."
                )
                String phone) {
}
