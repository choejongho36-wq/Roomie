package com.example.backend.exception;

import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.mail.MailException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<String> handleIllegalArgument(IllegalArgumentException e) {
        return ResponseEntity.badRequest().body(e.getMessage());
    }

    // 메일 서버 인증 실패/연결 실패 등으로 발송 자체가 안 되는 경우, 원인 노출 없이 안내만 해줌
    // (사용자에게는 노출하지 않되, 서버 로그에는 원인을 남겨서 디버깅 가능하게 함)
    @ExceptionHandler(MailException.class)
    public ResponseEntity<String> handleMailException(MailException e) {
        log.error("이메일 발송 실패", e);
        return ResponseEntity.internalServerError().body("인증번호 발송에 실패했습니다. 잠시 후 다시 시도해주세요.");
    }
}