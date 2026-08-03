package com.example.backend.repository;

import com.example.backend.domain.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    boolean existsByEmail(String email);
    Optional<User> findByLoginId(String loginId);
    boolean existsByLoginId(String loginId);
    boolean existsByNickname(String nickname);
    Optional<User> findByProviderAndProviderId(String provider, String providerId);
    List<User> findTop10ByNicknameContainingIgnoreCaseAndUserIdNot(String nickname, Long excludedUserId);
    org.springframework.data.domain.Page<User> findAllByOrderByCreatedAtDesc(org.springframework.data.domain.Pageable pageable);
    List<User> findTop5ByOrderByCreatedAtDesc();
    List<User> findByCreatedAtAfter(LocalDateTime dateTime);
    org.springframework.data.domain.Page<User> findByNicknameContainingIgnoreCaseOrEmailContainingIgnoreCaseOrderByCreatedAtDesc(
            String nickname, String email, org.springframework.data.domain.Pageable pageable);
    List<User> findByStatusAndSuspendedUntilNotNullAndSuspendedUntilBefore(String status, LocalDateTime dateTime);

    // 관리자 게시글 검색에서 작성자 닉네임으로 회원을 찾기 위해 사용.
    List<User> findByNicknameContainingIgnoreCase(String nickname);
}