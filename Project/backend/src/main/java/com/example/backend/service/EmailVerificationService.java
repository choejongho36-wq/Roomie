package com.example.backend.service;

import com.example.backend.domain.EmailVerification;
import com.example.backend.repository.EmailVerificationRepository;
import com.example.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class EmailVerificationService {

    private static final SecureRandom RANDOM = new SecureRandom();

    private final EmailVerificationRepository emailVerificationRepository;
    private final UserRepository userRepository;
    private final JavaMailSender mailSender;

    @Value("${email.verification.expire-minutes:5}")
    private long expireMinutes;

    // 1단계(회원가입): 인증번호 발송 (이미 가입된 이메일이면 발송 대신 에러)
    public void sendVerificationCode(String email) {
        if (userRepository.existsByEmail(email)) {
            throw new IllegalArgumentException("이미 가입된 이메일입니다.");
        }
        issueAndSend(email);
    }

    // 1단계(아이디 찾기 / 비밀번호 재설정): 이미 가입된 이메일이어야만 발송함 (회원가입과 반대 조건)
    public void sendVerificationCodeForAccountRecovery(String email) {
        if (!userRepository.existsByEmail(email)) {
            throw new IllegalArgumentException("가입되지 않은 이메일입니다.");
        }
        issueAndSend(email);
    }

    private void issueAndSend(String email) {
        String code = generateCode();
        LocalDateTime expiresAt = LocalDateTime.now().plusMinutes(expireMinutes);

        emailVerificationRepository.findByEmail(email)
                .ifPresentOrElse(
                        existing -> {
                            existing.reissue(code, expiresAt);
                            emailVerificationRepository.save(existing); // detached 상태라 명시적 save 필요
                        },
                        () -> emailVerificationRepository.save(new EmailVerification(email, code, expiresAt))
                );

        sendMail(email, code);
    }

    // 2단계: 사용자가 입력한 인증번호 확인
    public void confirmVerificationCode(String email, String code) {
        EmailVerification verification = emailVerificationRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("인증 요청을 먼저 진행해주세요."));

        if (verification.isExpired()) {
            throw new IllegalArgumentException("인증번호가 만료되었습니다. 다시 요청해주세요.");
        }
        if (!verification.getCode().equals(code)) {
            throw new IllegalArgumentException("인증번호가 일치하지 않습니다.");
        }
        verification.markVerified();
        emailVerificationRepository.save(verification); // detached 상태라 명시적 save 필요
    }

    // 회원가입 시점에 서버가 최종적으로 다시 확인하는 용도 (프론트 우회 방지)
    public boolean isVerified(String email) {
        return emailVerificationRepository.findByEmail(email)
                .map(EmailVerification::isVerified)
                .orElse(false);
    }

    // 비밀번호 재설정처럼 "한 번 쓰고 끝"인 인증은, 다 쓴 뒤 삭제해서 재사용(리플레이)을 막음
    public void invalidate(String email) {
        emailVerificationRepository.findByEmail(email).ifPresent(emailVerificationRepository::delete);
    }

    private String generateCode() {
        int number = RANDOM.nextInt(1_000_000); // 0 ~ 999999
        return String.format("%06d", number); // 항상 6자리로 (앞자리 0 유지)
    }

    private void sendMail(String email, String code) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(email);
        message.setSubject("[Roomie] 이메일 인증번호입니다");
        message.setText(
                "안녕하세요, Roomie입니다.\n\n"
                        + "요청하신 이메일 인증번호는 아래와 같습니다.\n\n"
                        + "인증번호: " + code + "\n\n"
                        + "이 인증번호는 " + expireMinutes + "분간 유효합니다.\n"
                        + "본인이 요청하지 않았다면 이 메일을 무시하셔도 됩니다."
        );
        mailSender.send(message);
    }
}