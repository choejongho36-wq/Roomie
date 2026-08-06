package com.example.backend.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

// 궁합 비교 AI 설명은 Groq 호출 결과라 매번 다르게 나온다. 한 번 생성한 설명은 저장해뒀다가
// 같은 조합(viewer -> target)을 다시 조회할 때 그대로 재사용해서, 페이지를 나갔다 들어와도
// 답변이 바뀌지 않게 한다. 다만 둘 중 한 명이 설문을 다시 제출하면(completedAt이 달라지면)
// 캐시를 버리고 새로 생성한다.
@Entity
@Table(name = "survey_comparison_explanation", uniqueConstraints = @UniqueConstraint(columnNames = { "viewer_user_id", "target_user_id" }))
@Getter
@NoArgsConstructor
public class SurveyComparisonExplanation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "explanation_id")
    private Long explanationId;

    @Column(name = "viewer_user_id", nullable = false)
    private Long viewerUserId;

    @Column(name = "target_user_id", nullable = false)
    private Long targetUserId;

    @Column(name = "explanation", nullable = false, length = 1000)
    private String explanation;

    @Column(name = "viewer_survey_completed_at")
    private LocalDateTime viewerSurveyCompletedAt;

    @Column(name = "target_survey_completed_at")
    private LocalDateTime targetSurveyCompletedAt;

    // 궁합 점수는 "보는 사람"이 설정한 카테고리 가중치로 계산되므로(CompatibilityCalculator.score),
    // 보는 사람이 가중치를 바꾸면 점수가 달라져서 예전 설명이 안 맞을 수 있다. 생성 당시 가중치를
    // "questionId:weight,questionId:weight,..." 형태로 스냅샷 찍어두고, 지금 가중치와 다르면 캐시를 버린다.
    @Column(name = "viewer_weights_snapshot", length = 500)
    private String viewerWeightsSnapshot;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    public SurveyComparisonExplanation(Long viewerUserId, Long targetUserId, String explanation,
            LocalDateTime viewerSurveyCompletedAt, LocalDateTime targetSurveyCompletedAt, String viewerWeightsSnapshot) {
        this.viewerUserId = viewerUserId;
        this.targetUserId = targetUserId;
        this.explanation = explanation;
        this.viewerSurveyCompletedAt = viewerSurveyCompletedAt;
        this.targetSurveyCompletedAt = targetSurveyCompletedAt;
        this.viewerWeightsSnapshot = viewerWeightsSnapshot;
    }

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = this.createdAt;
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    public void update(String explanation, LocalDateTime viewerSurveyCompletedAt, LocalDateTime targetSurveyCompletedAt,
            String viewerWeightsSnapshot) {
        this.explanation = explanation;
        this.viewerSurveyCompletedAt = viewerSurveyCompletedAt;
        this.targetSurveyCompletedAt = targetSurveyCompletedAt;
        this.viewerWeightsSnapshot = viewerWeightsSnapshot;
    }

    // 저장된 캐시가 지금 두 사람의 최신 설문 완료 시각, 그리고 보는 사람의 가중치와 일치하는지(=여전히 유효한지) 확인한다.
    public boolean isStaleFor(LocalDateTime currentViewerCompletedAt, LocalDateTime currentTargetCompletedAt,
            String currentViewerWeightsSnapshot) {
        return !java.util.Objects.equals(viewerSurveyCompletedAt, currentViewerCompletedAt)
                || !java.util.Objects.equals(targetSurveyCompletedAt, currentTargetCompletedAt)
                || !java.util.Objects.equals(viewerWeightsSnapshot, currentViewerWeightsSnapshot);
    }
}
