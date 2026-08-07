package com.example.backend.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

// 글 하나를 여러 게시판에 동시에(중복으로) 고정할 수 있도록, Post의 boardType/pinned/pinOrder
// 단일 컬럼 대신 별도 테이블로 "이 글은 이 게시판에 이 순서로 고정되어 있다"를 표현한다.
// 예: 고민상담 글 하나를 고민상담 + 잡담 두 게시판에 동시에 고정 노출시키는 것도 가능.
@Entity
@Table(name = "post_pin", uniqueConstraints = @UniqueConstraint(columnNames = { "post_id", "board_type" }))
@Getter
@NoArgsConstructor
public class PostPin {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "post_pin_id")
    private Long postPinId;

    @Column(name = "post_id", nullable = false)
    private Long postId;

    // 이 글이 고정되어 보여질 게시판. 글 자신의 boardType과 달라도 된다(다른 게시판에도
    // 중복으로 노출시키는 "고정" 용도이기 때문).
    @Column(name = "board_type", nullable = false, length = 20)
    private String boardType;

    // 같은 게시판(boardType) 안에서 고정된 글끼리의 순서. 작을수록 위.
    @Column(name = "pin_order", nullable = false)
    private int pinOrder;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    public PostPin(Long postId, String boardType, int pinOrder) {
        this.postId = postId;
        this.boardType = boardType;
        this.pinOrder = pinOrder;
    }

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }

    public void changePinOrder(int order) {
        this.pinOrder = order;
    }
}
