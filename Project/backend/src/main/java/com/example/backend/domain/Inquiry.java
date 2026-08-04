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

    // 비밀글. true면 작성자 본인과 관리자만 content/answer를 볼 수 있다.
    // 기존 레코드에는 컬럼이 없다가 새로 추가되므로, MySQL strict mode에서 ALTER TABLE이
    // 실패하지 않도록 DEFAULT를 명시해 기존 행이 자동으로 false를 갖게 한다.
    @Column(name = "is_secret", nullable = false, columnDefinition = "boolean default false")
    private boolean secret;

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

    public Inquiry(Long userId, String title, String category, String content, boolean secret) {
        this.userId = userId;
        this.title = title;
        this.category = category;
        this.content = content;
        this.status = "PENDING";
        this.secret = secret;
    }

    public void update(String title, String category, String content, boolean secret) {
        this.title = title;
        this.category = category;
        this.content = content;
        this.secret = secret;
    }

    // 관리자 수정용. 비밀글 여부는 관리자 편집 화면에 노출하지 않으므로 그대로 유지한다.
    public void update(String title, String category, String content) {
        update(title, category, content, this.secret);
    }

    public void answer(String answer) {
        this.answer = answer;
        this.status = "ANSWERED";
        this.answeredAt = LocalDateTime.now();
    }
}
