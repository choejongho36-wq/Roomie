package com.example.backend.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "chat_request")
@Getter
@NoArgsConstructor
public class ChatRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "chat_request_id")
    private Long chatRequestId;

    @Column(name = "requester_id", nullable = false)
    private Long requesterId;

    @Column(name = "target_id", nullable = false)
    private Long targetId;

    @Column(nullable = false, length = 20)
    private String status;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }

    public ChatRequest(Long requesterId, Long targetId) {
        this.requesterId = requesterId;
        this.targetId = targetId;
        this.status = "PENDING";
    }

    public void accept() {
        this.status = "ACCEPTED";
    }

    public void decline() {
        this.status = "DECLINED";
    }
}
