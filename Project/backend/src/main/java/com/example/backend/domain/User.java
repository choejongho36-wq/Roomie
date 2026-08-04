package com.example.backend.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "user")
@Getter
@NoArgsConstructor
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "user_id")
    private Long userId;

    @Column(name = "login_id", nullable = false, unique = true, length = 20)
    private String loginId;

    @Column(nullable = false, length = 20)
    private String provider = "LOCAL";

    @Column(name = "provider_id", length = 100)
    private String providerId;

    @Column(nullable = false, unique = true, length = 100)
    private String email;

    @Column(nullable = false, length = 255)
    private String password;

    @Column(nullable = false, unique = true, length = 30)
    private String nickname;

    @Column(length = 10)
    private String gender;

    @Column(name = "birth_date")
    private LocalDate birthDate;

    @Column(length = 20)
    private String phone;

    @Column(length = 100)
    private String region;

    @Column(length = 100)
    private String job;

    @Column(name = "profile_image_url", length = 255)
    private String profileImageUrl;

    @Column(length = 500)
    private String tags;

    @Column(length = 150)
    private String bio;

    @Column(name = "is_verified", nullable = false)
    private Boolean isVerified = false;

    @Column(name = "email_verified", nullable = false)
    private Boolean emailVerified = false;

    @Column(nullable = false, length = 20)
    private String status;

    // 관리자 페이지 접근 권한. "USER" | "ADMIN" (기본값 USER)
    // 기존 레코드에는 이 컬럼이 없다가 새로 추가되므로, NOT NULL로 두면 MySQL strict mode에서
    // 기존 행 때문에 ALTER TABLE이 실패할 수 있어 nullable로 둔다. null은 USER와 동일하게 취급한다.
    @Column(length = 20)
    private String role = "USER";

    // 정지 해제 예정 일시. status가 SUSPENDED이면서 이 값이 null이면 영구정지, 값이 있으면 그 시점까지 정지.
    @Column(name = "suspended_until")
    private LocalDateTime suspendedUntil;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "nickname_changed_at")
    private LocalDateTime nicknameChangedAt;

    // 관리자 대시보드 "오늘 방문자 수" 집계용. 로그인 성공 시마다 갱신된다.
    @Column(name = "last_login_at")
    private LocalDateTime lastLoginAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        if (this.status == null)
            this.status = "ACTIVE";
        if (this.role == null)
            this.role = "USER";
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    public void updateProfileImage(String profileImageUrl) {
        this.profileImageUrl = profileImageUrl;
    }

    public void updateTags(String tags) {
        this.tags = tags;
    }

    public void updateBio(String bio) {
        this.bio = bio;
    }

    public void updateNickname(String nickname) {
        this.nickname = nickname;
        this.nicknameChangedAt = LocalDateTime.now();
    }

    public void updatePassword(String password) {
        this.password = password;
    }

    public void withdraw() {
        this.status = "WITHDRAWN";
        // 탈퇴해도 행은 남겨야 다른 테이블(채팅/게시글/매칭 등)의 참조가 안 깨지지만,
        // login_id/email/nickname은 UNIQUE 제약이라 그대로 두면 원래 값으로 재가입이 영영 불가능해짐.
        // 그래서 이 시점에 아무도 안 쓸 값으로 바꿔서, 원래 아이디/이메일/닉네임을 다시 쓸 수 있게 풀어줌.
        this.loginId = "withdrawn_" + this.userId;
        this.email = "withdrawn_" + this.userId + "@roomie.local";
        this.nickname = "탈퇴회원" + this.userId;
    }

    /**
     * @param until 정지 해제 예정 일시. null이면 영구정지.
     */
    public void suspend(LocalDateTime until) {
        this.status = "SUSPENDED";
        this.suspendedUntil = until;
    }

    public void activate() {
        this.status = "ACTIVE";
        this.suspendedUntil = null;
    }

    /**
     * 정지 기간이 지난 임시 정지인지 확인한다. 영구정지(suspendedUntil == null)는 대상이 아니다.
     */
    public boolean isSuspensionExpired() {
        return "SUSPENDED".equals(this.status)
                && this.suspendedUntil != null
                && !this.suspendedUntil.isAfter(LocalDateTime.now());
    }

    public boolean isAdmin() {
        return this.role != null && this.role.equalsIgnoreCase("ADMIN");
    }

    public void recordLogin() {
        this.lastLoginAt = LocalDateTime.now();
    }

    public void completeAdditionalInfo(String gender, LocalDate birthDate, String phone) {
        this.gender = gender;
        this.birthDate = birthDate;
        if (phone != null && !phone.isBlank()) {
            this.phone = phone;
        }
    }

    public void updateRegionAndJob(String region, String job) {
        this.region = region;
        this.job = job;
    }

    // 회원가입용 생성자
    public User(String email, String password, String nickname, String gender, LocalDate birthDate) {
        this.email = email;
        this.password = password;
        this.nickname = nickname;
        this.gender = gender;
        this.birthDate = birthDate;
        this.isVerified = false;
        this.emailVerified = false;
        this.status = "ACTIVE";
    }

    public User(String loginId, String email, String password, String nickname, String gender,
            LocalDate birthDate, String phone, String region, String job) {
        this(email, password, nickname, gender, birthDate);
        this.loginId = loginId;
        this.phone = phone;
        this.region = region;
        this.job = job;
    }

    public User(String provider, String providerId, String loginId, String email,
            String password, String nickname, String profileImageUrl) {
        this.provider = provider;
        this.providerId = providerId;
        this.loginId = loginId;
        this.email = email;
        this.password = password;
        this.nickname = nickname;
        this.profileImageUrl = profileImageUrl;
        this.isVerified = false;
        this.emailVerified = true;
        this.status = "ACTIVE";
    }

    public boolean isSocialAccount() {
        return !"LOCAL".equals(this.provider);
    }

    public boolean needsAdditionalInfo() {
        return this.gender == null || this.birthDate == null;
    }
}