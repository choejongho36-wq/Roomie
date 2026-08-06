package com.example.backend.controller;

import com.example.backend.domain.User;
import com.example.backend.dto.RecommendationResponse;
import com.example.backend.dto.SurveyComparisonExplanationResponse;
import com.example.backend.dto.SurveyComparisonResponse;
import com.example.backend.repository.UserRepository;
import com.example.backend.service.CompatibilityService;
import com.example.backend.service.SurveyComparisonExplanationService;
import com.example.backend.service.SurveyComparisonService;
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
    private final SurveyComparisonExplanationService surveyComparisonExplanationService;
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
        // 한 번 생성한 설명은 저장해뒀다가 재사용한다. 페이지를 나갔다 다시 들어와도
        // (설문을 다시 제출하지 않는 한) 같은 문구가 나온다.
        String explanation = surveyComparisonExplanationService.getOrGenerate(user.getUserId(), userId);
        return new SurveyComparisonExplanationResponse(explanation);
    }
}
