package com.example.backend.controller;

import com.example.backend.dto.LoginRequest;
import com.example.backend.dto.LoginResponse;
import com.example.backend.dto.SignupRequest;
import com.example.backend.dto.EmailCheckResponse;
import com.example.backend.dto.LoginIdCheckResponse;
import com.example.backend.dto.NicknameCheckResponse;
import com.example.backend.dto.EmailVerificationRequest;
import com.example.backend.dto.EmailVerificationConfirmRequest;
import com.example.backend.dto.FindIdResponse;
import com.example.backend.dto.PasswordResetRequest;
import com.example.backend.dto.PasswordResetConfirmRequest;
import com.example.backend.dto.AccountLinkRequest;
import com.example.backend.service.AuthService;
import com.example.backend.service.EmailVerificationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final EmailVerificationService emailVerificationService;

    @PostMapping("/signup")
    public ResponseEntity<Void> signup(@Valid @RequestBody SignupRequest request) {
        authService.signup(request);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }

    @GetMapping("/check-email")
    public ResponseEntity<EmailCheckResponse> checkEmail(@RequestParam(name = "email") String email) {
        return ResponseEntity.ok(authService.checkEmail(email));
    }

    @GetMapping("/check-login-id")
    public ResponseEntity<LoginIdCheckResponse> checkLoginId(@RequestParam(name = "loginId") String loginId) {
        return ResponseEntity.ok(authService.checkLoginId(loginId));
    }

    @GetMapping("/check-nickname")
    public ResponseEntity<NicknameCheckResponse> checkNickname(@RequestParam(name = "nickname") String nickname) {
        return ResponseEntity.ok(authService.checkNickname(nickname));
    }

    // 이메일 중복확인 + 인증번호 발송을 한 번에 처리
    // (이미 가입된 이메일이면 서비스 단에서 예외를 던져서 GlobalExceptionHandler가 400으로 응답)
    @PostMapping("/email/verify-request")
    public ResponseEntity<Void> requestEmailVerification(@Valid @RequestBody EmailVerificationRequest request) {
        emailVerificationService.sendVerificationCode(request.email());
        return ResponseEntity.ok().build();
    }

    @PostMapping("/email/verify-confirm")
    public ResponseEntity<Void> confirmEmailVerification(@Valid @RequestBody EmailVerificationConfirmRequest request) {
        emailVerificationService.confirmVerificationCode(request.email(), request.code());
        return ResponseEntity.ok().build();
    }

    // ===== 아이디 찾기 =====

    @PostMapping("/find-id/request")
    public ResponseEntity<Void> requestFindId(@Valid @RequestBody EmailVerificationRequest request) {
        emailVerificationService.sendVerificationCodeForAccountRecovery(request.email());
        return ResponseEntity.ok().build();
    }

    // 인증번호 확인은 위의 공용 /email/verify-confirm 을 그대로 재사용함

    @GetMapping("/find-id/result")
    public ResponseEntity<FindIdResponse> findIdResult(@RequestParam(name = "email") String email) {
        return ResponseEntity.ok(authService.findLoginId(email));
    }

    // ===== 비밀번호 재설정 =====

    @PostMapping("/password/reset-request")
    public ResponseEntity<Void> requestPasswordReset(@Valid @RequestBody PasswordResetRequest request) {
        authService.requestPasswordReset(request);
        return ResponseEntity.ok().build();
    }

    // 인증번호 확인도 위의 공용 /email/verify-confirm 을 그대로 재사용함

    @PostMapping("/password/reset")
    public ResponseEntity<Void> resetPassword(@Valid @RequestBody PasswordResetConfirmRequest request) {
        authService.resetPassword(request);
        return ResponseEntity.ok().build();
    }

    // ===== 소셜 계정 연동 (일반가입 계정에 카카오 연결) =====

    @PostMapping("/link-account")
    public ResponseEntity<LoginResponse> linkAccount(@Valid @RequestBody AccountLinkRequest request) {
        return ResponseEntity.ok(authService.linkAccount(request));
    }
}