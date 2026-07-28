package com.example.backend.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

// 로그인한 사용자가 특정 게시글을 이미 조회했는지 기록해서, 같은 사람이 같은 글을
// 여러 번 봐도 조회수가 계속 올라가지 않게(첫 조회 때만 올라가게) 하기 위한 테이블.
@Entity
@Table(name = "post_view", uniqueConstraints = @UniqueConstraint(columnNames = { "post_id", "user_id" }))
@Getter
@NoArgsConstructor
public class PostView {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "view_id")
    private Long viewId;

    @Column(name = "post_id", nullable = false)
    private Long postId;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    public PostView(Long postId, Long userId) {
        this.postId = postId;
        this.userId = userId;
    }

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }
}
