package com.example.backend.service;

import com.example.backend.domain.User;
import com.example.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.List;

/**
 * 기간제 정지(7일/30일 등)가 만료된 회원을 자동으로 ACTIVE로 되돌린다.
 * 영구정지(suspendedUntil == null)는 대상에서 제외되며, 관리자가 직접 활성화해야 한다.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class SuspensionScheduler {

    private final UserRepository userRepository;

    // 매시 정각에 실행
    @Scheduled(cron = "0 0 * * * *")
    public void releaseExpiredSuspensions() {
        List<User> expired = userRepository.findByStatusAndSuspendedUntilNotNullAndSuspendedUntilBefore(
                "SUSPENDED", LocalDateTime.now());
        if (expired.isEmpty()) {
            return;
        }
        expired.forEach(User::activate);
        userRepository.saveAll(expired);
        log.info("정지 기간 만료로 {}명의 회원을 자동 활성화했습니다.", expired.size());
    }
}
