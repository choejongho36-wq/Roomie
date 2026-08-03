package com.example.backend.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

// 게시글 신고 기록. 같은 회원이 같은 글을 중복 신고할 수 없도록 (post_id, user_id) 유니크 제약을 건다.
@Entity
@Table(name = "post_report", uniqueConstraints = @UniqueConstraint(columnNames = { "post_id", "user_id" }))
@Getter
@NoArgsConstructor
public class PostReport {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "report_id")
    private Long reportId;

    @Column(name = "post_id", nullable = false)
    private Long postId;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    // 신고 사유 (예: "혐오/차별적 표현이에요"). 프론트 신고 사유 선택 목록의 문구를 그대로 저장한다.
    @Column(length = 50)
    private String reason;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    public PostReport(Long postId, Long userId, String reason) {
        this.postId = postId;
        this.userId = userId;
        this.reason = reason;
    }

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }
}
