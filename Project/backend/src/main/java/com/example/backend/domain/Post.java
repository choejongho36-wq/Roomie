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

    // 본문에 첨부 이미지를 base64로 통째로 심어 넣기 때문에(별도 이미지 업로드 API가
    // 아직 없음) 기존 VARCHAR(1000)로는 턱없이 부족해서 MEDIUMTEXT(최대 16MB)로 확장.
    @Column(columnDefinition = "MEDIUMTEXT")
    private String description;

    @Column(length = 255)
    private String tags;

    @Column(name = "board_type", length = 20)
    private String boardType;

    @Column(nullable = false, length = 20)
    private String status;

    @Column(name = "view_count", nullable = false)
    private Integer viewCount = 0;

    // 공지/이벤트 관리에서 목록 맨 위에 고정하는 기능. 고정된 것들끼리는 pinOrder 오름차순으로
    // 보여주고(작을수록 위), 고정 안 된 글들은 기존처럼 최신순으로 그 아래에 나온다.
    @Column(nullable = false)
    private boolean pinned = false;

    @Column(name = "pin_order")
    private Integer pinOrder;

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

    public void pin(int order) {
        this.pinned = true;
        this.pinOrder = order;
    }

    public void unpin() {
        this.pinned = false;
        this.pinOrder = null;
    }

    public void changePinOrder(int order) {
        this.pinOrder = order;
    }
}