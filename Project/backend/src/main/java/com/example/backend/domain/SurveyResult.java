package com.example.backend.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "survey_result")
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

    @Column(name = "completed_at", nullable = false, updatable = false)
    private LocalDateTime completedAt;

    @PrePersist
    protected void onCreate() {
        this.completedAt = LocalDateTime.now();
    }

    public SurveyResult(Long userId, String answers) {
        this.userId = userId;
        this.answers = answers;
    }
}
