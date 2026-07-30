package com.example.backend.service;

import com.example.backend.domain.SurveyResult;
import com.example.backend.domain.User;
import com.example.backend.dto.RecommendationResponse;
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

        Map<Long, SurveyResult> latestByUser = surveyResultRepository.findByUserIdNot(userId).stream()
                .collect(Collectors.toMap(SurveyResult::getUserId, r -> r,
                        BinaryOperator.maxBy(Comparator.comparing(SurveyResult::getCompletedAt))));

        return latestByUser.values().stream()
                .map(result -> buildRecommendation(result, myAnswers))
                .filter(Objects::nonNull)
                .sorted(Comparator.comparing(RecommendationResponse::compatibilityScore).reversed())
                .toList();
    }

    private RecommendationResponse buildRecommendation(SurveyResult result, List<Integer> myAnswers) {
        List<Integer> otherAnswers = parseAnswers(result.getAnswers());
        if (otherAnswers.isEmpty()) {
            return null;
        }

        Optional<User> userOpt = userRepository.findById(result.getUserId());
        if (userOpt.isEmpty()) {
            return null;
        }

        int score = compatibilityCalculator.score(myAnswers, otherAnswers);
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
