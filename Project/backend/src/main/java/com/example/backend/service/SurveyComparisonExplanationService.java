package com.example.backend.service;

import com.example.backend.domain.SurveyComparisonExplanation;
import com.example.backend.domain.SurveyResult;
import com.example.backend.dto.SurveyComparisonResponse;
import com.example.backend.repository.SurveyComparisonExplanationRepository;
import com.example.backend.repository.SurveyResultRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.TreeMap;
import java.util.stream.Collectors;

// AI 궁합 설명(Groq 호출)은 같은 입력을 넣어도 매번 다른 문장이 나온다.
// 한 번 생성한 설명은 (보는 사람, 상대방) 조합으로 저장해뒀다가 다시 조회할 때 그대로 돌려줘서,
// 페이지를 나갔다 들어와도 답변이 바뀌지 않게 한다.
// 둘 중 한 명이라도 설문을 다시 제출해서 완료 시각이 달라지면 캐시가 낡은 것으로 보고 새로 생성한다.
@Service
@RequiredArgsConstructor
public class SurveyComparisonExplanationService {

    private final SurveyComparisonExplanationRepository explanationRepository;
    private final SurveyResultRepository surveyResultRepository;
    private final SurveyComparisonService surveyComparisonService;
    private final SurveySummaryService surveySummaryService;
    private final UserCategoryWeightService userCategoryWeightService;

    @Transactional
    public String getOrGenerate(Long viewerUserId, Long targetUserId) {
        LocalDateTime viewerCompletedAt = latestCompletedAt(viewerUserId);
        LocalDateTime targetCompletedAt = latestCompletedAt(targetUserId);
        String viewerWeightsSnapshot = weightsSnapshot(viewerUserId);

        var cached = explanationRepository.findByViewerUserIdAndTargetUserId(viewerUserId, targetUserId);
        if (cached.isPresent()
                && !cached.get().isStaleFor(viewerCompletedAt, targetCompletedAt, viewerWeightsSnapshot)) {
            return cached.get().getExplanation();
        }

        SurveyComparisonResponse comparison = surveyComparisonService.compare(viewerUserId, targetUserId);
        String explanation = surveySummaryService.explainComparison(
                comparison.nickname(),
                comparison.compatibilityScore(),
                comparison.topReasons(),
                comparison.differences()
        );

        if (cached.isPresent()) {
            cached.get().update(explanation, viewerCompletedAt, targetCompletedAt, viewerWeightsSnapshot);
        } else {
            explanationRepository.save(new SurveyComparisonExplanation(
                    viewerUserId, targetUserId, explanation, viewerCompletedAt, targetCompletedAt, viewerWeightsSnapshot));
        }

        return explanation;
    }

    private LocalDateTime latestCompletedAt(Long userId) {
        return surveyResultRepository.findByUserIdOrderByCompletedAtDesc(userId).stream()
                .findFirst()
                .map(SurveyResult::getCompletedAt)
                .orElse(null);
    }

    // 궁합 점수 계산에 실제로 쓰이는 건 "보는 사람"의 가중치뿐이라(CompatibilityCalculator.score),
    // 보는 사람 가중치만 스냅샷 찍어서 비교하면 충분하다. questionId 순서를 고정해서 같은 값이면
    // 항상 같은 문자열이 나오도록 TreeMap으로 정렬한다.
    private String weightsSnapshot(Long userId) {
        Map<Integer, Integer> weights = new TreeMap<>(userCategoryWeightService.getWeights(userId));
        return weights.entrySet().stream()
                .map(e -> e.getKey() + ":" + e.getValue())
                .collect(Collectors.joining(","));
    }
}
