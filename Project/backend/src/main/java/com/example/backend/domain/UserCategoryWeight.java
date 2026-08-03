package com.example.backend.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "user_category_weight", uniqueConstraints = @UniqueConstraint(columnNames = {"user_id", "question_id"}))
@Getter
@NoArgsConstructor
public class UserCategoryWeight {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    // 프론트 SurveyQuestions.ts / CompatibilityCalculator의 문항 id(1~20)와 동일하게 맞춰야 함
    @Column(name = "question_id", nullable = false)
    private Integer questionId;

    // 1=낮음, 2=보통, 3=높음
    @Column(nullable = false)
    private Integer weight;

    public UserCategoryWeight(Long userId, Integer questionId, Integer weight) {
        this.userId = userId;
        this.questionId = questionId;
        this.weight = weight;
    }

    public void updateWeight(Integer weight) {
        this.weight = weight;
    }
}
