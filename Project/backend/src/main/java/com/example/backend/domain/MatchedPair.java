package com.example.backend.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

// 채팅에서 "룸메이트 확정"을 누른 두 사용자를 연결하는 엔티티.
// 이 프로젝트의 기존 컨벤션(User, Post 등)을 따라 JPA 연관관계 어노테이션은 쓰지 않고
// 순수 Long 외래키만 사용함 (N+1/지연로딩 문제를 원천 차단하기 위함)
@Entity
@Table(name = "matched_pair")
@Getter
@NoArgsConstructor
public class MatchedPair {

    public static final String STATUS_SEARCHING = "SEARCHING"; // 방 찾는 중
    public static final String STATUS_CONFIRMED = "CONFIRMED"; // 집 확정 -> HOUSE로 전환됨

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_a_id", nullable = false)
    private Long userAId;

    @Column(name = "user_b_id", nullable = false)
    private Long userBId;

    @Column(nullable = false, length = 20)
    private String status;

    @Column(length = 100)
    private String region;

    @Column(name = "deposit_max")
    private Integer depositMax; // 보증금 최대

    @Column(name = "monthly_rent_max")
    private Integer monthlyRentMax; // 월세 최대

    @Column(name = "move_in_date")
    private LocalDate moveInDate;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "confirmed_at")
    private LocalDateTime confirmedAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        if (this.status == null) {
            this.status = STATUS_SEARCHING;
        }
    }

    public MatchedPair(Long userAId, Long userBId) {
        this.userAId = userAId;
        this.userBId = userBId;
        this.status = STATUS_SEARCHING;
    }

    public boolean includesUser(Long userId) {
        return userAId.equals(userId) || userBId.equals(userId);
    }

    public void updateConditions(String region, Integer depositMax, Integer monthlyRentMax, LocalDate moveInDate) {
        this.region = region;
        this.depositMax = depositMax;
        this.monthlyRentMax = monthlyRentMax;
        this.moveInDate = moveInDate;
    }

    public void confirm() {
        this.status = STATUS_CONFIRMED;
        this.confirmedAt = LocalDateTime.now();
    }
}