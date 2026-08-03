package com.example.backend.service;

import com.example.backend.domain.UserCategoryWeight;
import com.example.backend.repository.UserCategoryWeightRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserCategoryWeightService {

    private static final int MIN_WEIGHT = 1; // 낮음
    private static final int MAX_WEIGHT = 3; // 높음
    private static final int QUESTION_COUNT = 20;

    private final UserCategoryWeightRepository userCategoryWeightRepository;

    // 설문 문항 중 일부/전부에 대해 사용자가 저장해둔 가중치. 하나도 저장 안 했으면 빈 맵
    // (호출부인 CompatibilityCalculator가 문항별 기본 가중치로 채워서 사용함).
    public Map<Integer, Integer> getWeights(Long userId) {
        return userCategoryWeightRepository.findAllByUserId(userId).stream()
                .collect(Collectors.toMap(UserCategoryWeight::getQuestionId, UserCategoryWeight::getWeight));
    }

    // 설문 완료 후 가중치 설정 화면에서 "완료"를 누르면 호출 (건드리지 않은 항목은 요청에서 아예 빠져도 됨)
    public void saveWeights(Long userId, Map<Integer, Integer> weights) {
        weights.forEach((questionId, weight) -> {
            if (questionId < 1 || questionId > QUESTION_COUNT) {
                throw new IllegalArgumentException("존재하지 않는 문항입니다: " + questionId);
            }
            if (weight < MIN_WEIGHT || weight > MAX_WEIGHT) {
                throw new IllegalArgumentException("가중치는 " + MIN_WEIGHT + "~" + MAX_WEIGHT + " 사이여야 합니다.");
            }

            UserCategoryWeight entry = userCategoryWeightRepository.findByUserIdAndQuestionId(userId, questionId)
                    .orElseGet(() -> new UserCategoryWeight(userId, questionId, weight));
            entry.updateWeight(weight);
            userCategoryWeightRepository.save(entry);
        });
    }
}
