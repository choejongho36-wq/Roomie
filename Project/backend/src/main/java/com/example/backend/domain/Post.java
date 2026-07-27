package com.example.backend.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "post")
@Getter
@NoArgsConstructor
public class Post {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "post_id")
    private Long postId;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(length = 200)
    private String title;

    @Column(nullable = false, length = 50)
    private String region;

    @Column(name = "budget_min")
    private Integer budgetMin;

    @Column(name = "budget_max")
    private Integer budgetMax;

    @Column(name = "move_in_date")
    private LocalDate moveInDate;

    @Column(name = "move_in_month_min")
    private Integer moveInMonthMin;

    @Column(name = "move_in_month_max")
    private Integer moveInMonthMax;

    @Column(name = "room_type", length = 20)
    private String roomType;

    @Column(name = "recruit_count", nullable = false)
    private Integer recruitCount;

    @Column(length = 1000)
    private String description;

    @Column(length = 255)
    private String tags;

    @Column(name = "board_type", length = 20)
    private String boardType;

    @Column(nullable = false, length = 20)
    private String status;

    @Column(name = "view_count", nullable = false)
    private Integer viewCount = 0;

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
    public Post(Long userId, String title, String region, Integer budgetMin, Integer budgetMax,
            LocalDate moveInDate, Integer moveInMonthMin, Integer moveInMonthMax, String roomType,
            Integer recruitCount, String description, String tags, String boardType) {
        this.userId = userId;
        this.title = title;
        this.region = region;
        this.budgetMin = budgetMin;
        this.budgetMax = budgetMax;
        this.moveInDate = moveInDate;
        this.moveInMonthMin = moveInMonthMin;
        this.moveInMonthMax = moveInMonthMax;
        this.roomType = roomType;
        this.recruitCount = recruitCount;
        this.description = description;
        this.tags = tags;
        this.boardType = boardType;
        this.status = "RECRUITING";
    }

    public void update(String title, String region, Integer budgetMin, Integer budgetMax,
            LocalDate moveInDate, Integer moveInMonthMin, Integer moveInMonthMax, String roomType,
            Integer recruitCount, String description, String tags, String boardType) {
        this.title = title;
        this.region = region;
        this.budgetMin = budgetMin;
        this.budgetMax = budgetMax;
        this.moveInDate = moveInDate;
        this.moveInMonthMin = moveInMonthMin;
        this.moveInMonthMax = moveInMonthMax;
        this.roomType = roomType;
        this.recruitCount = recruitCount;
        this.description = description;
        this.tags = tags;
        this.boardType = boardType;
    }

    public void increaseViewCount() {
        this.viewCount = (this.viewCount == null ? 0 : this.viewCount) + 1;
    }
}