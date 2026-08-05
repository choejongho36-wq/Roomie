package com.example.backend.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

// 일반가입 계정에 소셜 계정을 "연동"했을 때의 연결 정보.
// (소셜로 처음 가입한 계정은 여전히 user.provider/provider_id에 기록되고, 이 테이블은 안 씀)
@Entity
@Table(name = "user_social_link")
@Getter
@NoArgsConstructor
public class UserSocialLink {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(nullable = false, length = 20)
    private String provider; // "KAKAO"

    @Column(name = "provider_id", nullable = false, length = 100)
    private String providerId;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }

    public UserSocialLink(Long userId, String provider, String providerId) {
        this.userId = userId;
        this.provider = provider;
        this.providerId = providerId;
    }
}