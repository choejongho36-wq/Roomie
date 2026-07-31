package com.example.backend.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "chat_leave", uniqueConstraints = @UniqueConstraint(columnNames = {"user_id", "partner_id"}))
@Getter
@NoArgsConstructor
public class ChatLeave {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "chat_leave_id")
    private Long chatLeaveId;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "partner_id", nullable = false)
    private Long partnerId;

    @Column(name = "left_at", nullable = false, updatable = false)
    private LocalDateTime leftAt;

    @PrePersist
    protected void onCreate() {
        this.leftAt = LocalDateTime.now();
    }

    public ChatLeave(Long userId, Long partnerId) {
        this.userId = userId;
        this.partnerId = partnerId;
    }
}
