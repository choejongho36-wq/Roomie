package com.example.backend.service;

import com.example.backend.domain.User;
import com.example.backend.dto.EmailCheckResponse;
import com.example.backend.dto.LoginIdCheckResponse;
import com.example.backend.dto.NicknameCheckResponse;
import com.example.backend.dto.LoginRequest;
import com.example.backend.dto.LoginResponse;
import com.example.backend.dto.SignupRequest;
import com.example.backend.dto.FindIdResponse;
import com.example.backend.dto.PasswordResetRequest;
import com.example.backend.dto.PasswordResetConfirmRequest;
import com.example.backend.dto.AccountLinkRequest;
import com.example.backend.domain.UserSocialLink;
import com.example.backend.repository.UserRepository;
import com.example.backend.repository.UserSocialLinkRepository;
import com.example.backend.security.JwtProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import java.time.format.DateTimeFormatter;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtProvider jwtProvider;
    private final UserSocialLinkRepository userSocialLinkRepository;
    private final EmailVerificationService emailVerificationService;

    public void signup(SignupRequest request) {
        if (userRepository.existsByLoginId(request.loginId())) {
            throw new IllegalArgumentException("이미 사용 중인 아이디입니다.");
        }
        if (userRepository.existsByEmail(request.email())) {
            throw new IllegalArgumentException("이미 가입된 이메일입니다.");
        }
        if (userRepository.existsByNickname(request.nickname())) {
            throw new IllegalArgumentException("이미 사용 중인 닉네임입니다.");
        }
        // 프론트에서 "인증완료" 상태로 보여도, 직접 API를 호출하는 우회를 막기 위해 서버에서 한 번 더 확인
        if (!emailVerificationService.isVerified(request.email())) {
            throw new IllegalArgumentException("이메일 인증을 완료해주세요.");
        }
        if (!"SMOKER".equals(request.smoking()) && !"NON_SMOKER".equals(request.smoking())) {
            throw new IllegalArgumentException("흡연 여부를 선택해주세요.");
        }
        if ("SMOKER".equals(request.smoking())
                && (request.smokingType() == null || request.smokingType().isBlank())) {
            throw new IllegalArgumentException("흡연 종류를 선택해주세요.");
        }
        User user = new User(
                request.loginId(),
                request.email(),
                passwordEncoder.encode(request.password()),
                request.nickname(),
                request.gender(),
                request.birthDate(),
                request.phone(),
                request.region(),
                request.job(),
                request.smoking(),
                request.smokingType()
        );
        // 위에서 이미 이메일 인증 완료를 확인했으니 가입과 동시에 인증 상태로 저장
        user.markEmailVerified();
        userRepository.save(user);
    }

    public EmailCheckResponse checkEmail(String email) {
        if (email == null || !email.matches("^[\\w.+-]+@[\\w-]+\\.[a-zA-Z]{2,}$")) {
            throw new IllegalArgumentException("올바른 이메일 형식이 아닙니다.");
        }
        boolean available = !userRepository.existsByEmail(email);
        return new EmailCheckResponse(available);
    }

    public LoginIdCheckResponse checkLoginId(String loginId) {
        if (loginId == null || !loginId.matches("^[a-z0-9]{4,20}$")) {
            throw new IllegalArgumentException("아이디는 영문 소문자와 숫자로 4자 이상 20자 이하여야 합니다.");
        }
        boolean available = !userRepository.existsByLoginId(loginId);
        return new LoginIdCheckResponse(available);
    }

    public NicknameCheckResponse checkNickname(String nickname) {
        if (nickname == null || !nickname.matches("^[a-zA-Z0-9가-힣]{2,10}$")) {
            throw new IllegalArgumentException("닉네임은 한글, 영문, 숫자로 2자 이상 10자 이하여야 합니다.");
        }
        boolean available = !userRepository.existsByNickname(nickname);
        return new NicknameCheckResponse(available);
    }

    public LoginResponse login(LoginRequest request) {
        User user = userRepository.findByLoginId(request.loginId())
                .orElseThrow(() -> new IllegalArgumentException("아이디 또는 비밀번호가 일치하지 않습니다."));
        if (!passwordEncoder.matches(request.password(), user.getPassword())) {
            throw new IllegalArgumentException("아이디 또는 비밀번호가 일치하지 않습니다.");
        }
        if ("WITHDRAWN".equals(user.getStatus())) {
            throw new IllegalArgumentException("탈퇴한 계정입니다.");
        }
        if ("SUSPENDED".equals(user.getStatus())) {
            // 정지 기간이 이미 지났다면 스케줄러가 아직 안 돌았더라도 로그인 시점에 바로 풀어준다.
            if (user.isSuspensionExpired()) {
                user.activate();
                userRepository.save(user);
            } else {
                String message = user.getSuspendedUntil() == null
                        ? "영구 정지된 계정입니다."
                        : "정지된 계정입니다. (%s까지 정지)".formatted(
                                user.getSuspendedUntil().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm")));
                throw new IllegalArgumentException(message);
            }
        }
        user.recordLogin();
        userRepository.save(user);
        return new LoginResponse(jwtProvider.createToken(user.getLoginId()));
    }

    // ===== 아이디 찾기 =====

    // 이메일 인증번호 발송은 컨트롤러에서 emailVerificationService.sendVerificationCodeForAccountRecovery()로 바로 호출

    public FindIdResponse findLoginId(String email) {
        if (!emailVerificationService.isVerified(email)) {
            throw new IllegalArgumentException("이메일 인증을 먼저 완료해주세요.");
        }
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("가입된 계정을 찾을 수 없습니다."));
        emailVerificationService.invalidate(email); // 한 번 조회했으면 재사용 못 하게 무효화
        return new FindIdResponse(user.getLoginId());
    }

    // ===== 비밀번호 재설정 =====

    // 아이디+이메일이 실제로 같은 계정 소유인지 먼저 확인한 뒤에만 인증번호를 보냄
    public void requestPasswordReset(PasswordResetRequest request) {
        User user = userRepository.findByLoginId(request.loginId())
                .orElseThrow(() -> new IllegalArgumentException("일치하는 계정을 찾을 수 없습니다."));
        if (!user.getEmail().equals(request.email())) {
            throw new IllegalArgumentException("일치하는 계정을 찾을 수 없습니다.");
        }
        emailVerificationService.sendVerificationCodeForAccountRecovery(request.email());
    }

    public void resetPassword(PasswordResetConfirmRequest request) {
        if (!emailVerificationService.isVerified(request.email())) {
            throw new IllegalArgumentException("이메일 인증을 먼저 완료해주세요.");
        }
        User user = userRepository.findByLoginId(request.loginId())
                .orElseThrow(() -> new IllegalArgumentException("일치하는 계정을 찾을 수 없습니다."));
        if (!user.getEmail().equals(request.email())) {
            throw new IllegalArgumentException("일치하는 계정을 찾을 수 없습니다.");
        }
        user.updatePassword(passwordEncoder.encode(request.newPassword()));
        userRepository.save(user);
        emailVerificationService.invalidate(request.email());
    }

    // ===== 소셜 계정 연동 =====

    // 카카오 인증 직후 발급된 5분짜리 티켓 + 기존 계정 비밀번호를 함께 확인한 뒤에만 연동함.
    // (티켓 = "방금 그 카카오 계정 주인" 증명, 비밀번호 = "기존 일반계정 주인" 증명. 둘 다 통과해야 안전)
    public LoginResponse linkAccount(AccountLinkRequest request) {
        var claims = jwtProvider.parseLinkTicket(request.ticket());
        if (claims == null) {
            throw new IllegalArgumentException("연동 요청이 만료됐어요. 카카오 로그인을 다시 시도해주세요.");
        }
        String email = claims.getSubject();
        String provider = claims.get("provider", String.class);
        String providerId = claims.get("providerId", String.class);

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("연동할 계정을 찾을 수 없습니다."));
        if ("WITHDRAWN".equals(user.getStatus())) {
            throw new IllegalArgumentException("탈퇴한 계정입니다.");
        }
        if (user.getPassword() == null || !passwordEncoder.matches(request.password(), user.getPassword())) {
            throw new IllegalArgumentException("비밀번호가 일치하지 않습니다.");
        }
        if (userSocialLinkRepository.existsByUserIdAndProvider(user.getUserId(), provider)) {
            throw new IllegalArgumentException("이미 " + provider + " 계정이 연동되어 있습니다.");
        }

        userSocialLinkRepository.save(new UserSocialLink(user.getUserId(), provider, providerId));
        return new LoginResponse(jwtProvider.createToken(user.getLoginId()));
    }

    // 마이페이지에서 "카카오 연동하기" 버튼을 눌렀을 때, 지금 로그인된 사용자 확인 후 발급
    public String createLinkIntent(String loginId) {
        User user = userRepository.findByLoginId(loginId)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));
        return jwtProvider.createLinkIntentTicket(user.getUserId());
    }
}