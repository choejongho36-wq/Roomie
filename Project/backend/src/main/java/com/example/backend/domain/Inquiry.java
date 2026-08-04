package com.example.backend.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "inquiry")
@Getter
@NoArgsConstructor
public class Inquiry {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "inquiry_id")
    private Long inquiryId;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(nullable = false, length = 100)
    private String title;

    // 대분류: 버그 / 신고 / 문의 / 제안
    @Column(nullable = false, length = 20)
    private String category;

    @Column(nullable = false, length = 2000)
    private String content;

    @Column(nullable = false, length = 20)
    private String status;

    @Column(length = 2000)
    private String answer;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "answered_at")
    private LocalDateTime answeredAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        if (this.status == null)
            this.status = "PENDING";
    }

    public Inquiry(Long userId, String title, String category, String content) {
        this.userId = userId;
        this.title = title;
        this.category = category;
        this.content = content;
        this.status = "PENDING";
    }

    public void update(String title, String category, String content) {
        this.title = title;
        this.category = category;
        this.content = content;
    }

    public void answer(String answer) {
        this.answer = answer;
        this.status = "ANSWERED";
        this.answeredAt = LocalDateTime.now();
    }

    public void clearAnswer() {
        this.answer = null;
        this.status = "PENDING";
        this.answeredAt = null;
    }
}
