package com.example.backend.service;

import com.example.backend.domain.MatchedPair;
import com.example.backend.domain.SurveyResult;
import com.example.backend.domain.User;
import com.example.backend.dto.RecommendationResponse;
import com.example.backend.repository.MatchedPairRepository;
import com.example.backend.repository.SurveyResultRepository;
import com.example.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.*;
import java.util.function.BinaryOperator;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CompatibilityService {

    private final SurveyResultRepository surveyResultRepository;
    private final UserRepository userRepository;
    private final CompatibilityCalculator compatibilityCalculator;
    private final UserCategoryWeightService userCategoryWeightService;
    private final MatchedPairRepository matchedPairRepository;

    public List<RecommendationResponse> recommendForUser(Long userId) {
        List<SurveyResult> ownSurveys = surveyResultRepository.findByUserIdOrderByCompletedAtDesc(userId);
        if (ownSurveys.isEmpty()) {
            return List.of();
        }

        SurveyResult mine = ownSurveys.get(0);
        List<Integer> myAnswers = parseAnswers(mine.getAnswers());
        if (myAnswers.isEmpty()) {
            return List.of();
        }

        // 호환도는 "내가 볼 때" 기준이라 내가 설정한 가중치로 상대방들을 채점한다.
        Map<Integer, Integer> myWeights = userCategoryWeightService.getWeights(userId);

        Map<Long, SurveyResult> latestByUser = surveyResultRepository.findByUserIdNot(userId).stream()
                .collect(Collectors.toMap(SurveyResult::getUserId, r -> r,
                        BinaryOperator.maxBy(Comparator.comparing(SurveyResult::getCompletedAt))));

        // 이미 하우스가 확정된(매칭 확정) 상대는 더 이상 추천 후보로 보여줄 필요가 없음
        Set<Long> confirmedPartnerIds = matchedPairRepository
                .findByUserIdAndStatus(userId, MatchedPair.STATUS_CONFIRMED).stream()
                .map(pair -> pair.getUserAId().equals(userId) ? pair.getUserBId() : pair.getUserAId())
                .collect(Collectors.toSet());

        return latestByUser.values().stream()
                .filter(result -> !confirmedPartnerIds.contains(result.getUserId()))
                .map(result -> buildRecommendation(result, myAnswers, myWeights))
                .filter(Objects::nonNull)
                .sorted(Comparator.comparing(RecommendationResponse::compatibilityScore).reversed())
                .toList();
    }

    private RecommendationResponse buildRecommendation(SurveyResult result, List<Integer> myAnswers, Map<Integer, Integer> myWeights) {
        List<Integer> otherAnswers = parseAnswers(result.getAnswers());
        if (otherAnswers.isEmpty()) {
            return null;
        }

        Optional<User> userOpt = userRepository.findById(result.getUserId());
        if (userOpt.isEmpty()) {
            return null;
        }

        int score = compatibilityCalculator.score(myAnswers, otherAnswers, myWeights);
        User user = userOpt.get();
        List<String> tags = toTags(user.getTags());

        return new RecommendationResponse(
                result.getUserId(),
                user.getNickname(),
                user.getProfileImageUrl(),
                user.getBio(),
                tags,
                score,
                calculateAge(user.getBirthDate()),
                user.getJob(),
                user.getRegion(),
                user.getEmailVerified()
        );
    }

    private List<Integer> parseAnswers(String answersJson) {
        if (answersJson == null || answersJson.isBlank()) {
            return Collections.emptyList();
        }
        String trimmed = answersJson.trim();
        if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
            trimmed = trimmed.substring(1, trimmed.length() - 1);
        }
        if (trimmed.isBlank()) {
            return Collections.emptyList();
        }
        return Arrays.stream(trimmed.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .map(Integer::parseInt)
                .toList();
    }

    private List<String> toTags(String tags) {
        if (tags == null || tags.isBlank()) {
            return List.of();
        }
        return Arrays.stream(tags.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .toList();
    }

    private int calculateAge(LocalDate birthDate) {
        if (birthDate == null) {
            return 0;
        }
        LocalDate today = LocalDate.now();
        int age = today.getYear() - birthDate.getYear();
        if (today.getDayOfYear() < birthDate.getDayOfYear()) {
            age -= 1;
        }
        return age;
    }
}
