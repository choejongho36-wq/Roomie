package com.example.backend.controller;

import com.example.backend.domain.User;
import com.example.backend.dto.RecommendationResponse;
import com.example.backend.dto.SurveyComparisonExplanationResponse;
import com.example.backend.dto.SurveyComparisonResponse;
import com.example.backend.repository.UserRepository;
import com.example.backend.service.CompatibilityService;
import com.example.backend.service.SurveyComparisonService;
import com.example.backend.service.SurveySummaryService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/recommendations")
@RequiredArgsConstructor
public class RecommendationController {

    private final CompatibilityService compatibilityService;
    private final SurveyComparisonService surveyComparisonService;
    private final SurveySummaryService surveySummaryService;
    private final UserRepository userRepository;

    @GetMapping
    public List<RecommendationResponse> getRecommendations(Authentication authentication) {
        User user = userRepository.findByLoginId(authentication.getName())
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));
        return compatibilityService.recommendForUser(user.getUserId());
    }

    @GetMapping("/{userId}/comparison")
    public SurveyComparisonResponse getComparison(Authentication authentication, @PathVariable Long userId) {
        User user = userRepository.findByLoginId(authentication.getName())
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));
        return surveyComparisonService.compare(user.getUserId(), userId);
    }

    @GetMapping("/{userId}/comparison/ai-explanation")
    public SurveyComparisonExplanationResponse getComparisonAiExplanation(
            Authentication authentication, @PathVariable Long userId
    ) {
        User user = userRepository.findByLoginId(authentication.getName())
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));
        SurveyComparisonResponse comparison = surveyComparisonService.compare(user.getUserId(), userId);
        String explanation = surveySummaryService.explainComparison(
                comparison.nickname(),
                comparison.compatibilityScore(),
                comparison.topReasons(),
                comparison.differences()
        );
        return new SurveyComparisonExplanationResponse(explanation);
    }
}
