package com.example.backend.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "POST")
@Getter
@NoArgsConstructor
public class Post {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "post_id")
    private Long postId;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(nullable = false, length = 50)
    private String region;

    @Column(name = "budget_min")
    private Integer budgetMin;

    @Column(name = "budget_max")
    private Integer budgetMax;

    @Column(name = "move_in_date")
    private LocalDate moveInDate;

    @Column(name = "room_type", length = 20)
    private String roomType;

    @Column(name = "recruit_count", nullable = false)
    private Integer recruitCount;

    @Column(length = 1000)
    private String description;

    @Column(nullable = false, length = 20)
    private String status;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        if (this.status == null)
            this.status = "RECRUITING";
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    // 게시글 작성용 생성자
    public Post(Long userId, String region, Integer budgetMin, Integer budgetMax,
            LocalDate moveInDate, String roomType, Integer recruitCount, String description) {
        this.userId = userId;
        this.region = region;
        this.budgetMin = budgetMin;
        this.budgetMax = budgetMax;
        this.moveInDate = moveInDate;
        this.roomType = roomType;
        this.recruitCount = recruitCount;
        this.description = description;
        this.status = "RECRUITING";
    }

    public void update(String region, Integer budgetMin, Integer budgetMax,
            LocalDate moveInDate, String roomType, Integer recruitCount, String description) {
        this.region = region;
        this.budgetMin = budgetMin;
        this.budgetMax = budgetMax;
        this.moveInDate = moveInDate;
        this.roomType = roomType;
        this.recruitCount = recruitCount;
        this.description = description;
    }
}