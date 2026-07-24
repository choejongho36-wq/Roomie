package com.example.backend.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "SURVEY_RESULT")
@Getter
@NoArgsConstructor
public class SurveyResult {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "survey_result_id")
    private Long surveyResultId;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Setter
    @Column(nullable = false, length = 200)
    private String answers;

    @Setter
    @Column(columnDefinition = "TEXT")
    private String vector;

    @Column(name = "completed_at", nullable = false, updatable = false)
    private LocalDateTime completedAt;

    @PrePersist
    protected void onCreate() {
        this.completedAt = LocalDateTime.now();
    }

    public SurveyResult(Long userId, String answers, String vector) {
        this.userId = userId;
        this.answers = answers;
        this.vector = vector;
    }
}
