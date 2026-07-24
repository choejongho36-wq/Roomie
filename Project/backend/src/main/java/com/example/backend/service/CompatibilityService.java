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

    public List<RecommendationResponse> recommendForUser(Long userId) {
        List<SurveyResult> ownSurveys = surveyResultRepository.findByUserIdOrderByCompletedAtDesc(userId);
        if (ownSurveys.isEmpty()) {
            return List.of();
        }

        SurveyResult mine = ownSurveys.get(0);
        List<Double> mineVector = vectorFromSurvey(mine);
        if (mineVector.isEmpty()) {
            return List.of();
        }

        Map<Long, SurveyResult> latestByUser = surveyResultRepository.findByUserIdNot(userId).stream()
                .collect(Collectors.toMap(SurveyResult::getUserId, r -> r,
                        BinaryOperator.maxBy(Comparator.comparing(SurveyResult::getCompletedAt))));

        return latestByUser.values().stream()
                .map(result -> buildRecommendation(result, mineVector))
                .filter(Objects::nonNull)
                .sorted(Comparator.comparing(RecommendationResponse::compatibilityScore).reversed())
                .toList();
    }

    private RecommendationResponse buildRecommendation(SurveyResult result, List<Double> mineVector) {
        List<Double> otherVector = vectorFromSurvey(result);
        if (otherVector.isEmpty() || otherVector.size() != mineVector.size()) {
            return null;
        }

        Optional<User> userOpt = userRepository.findById(result.getUserId());
        if (userOpt.isEmpty()) {
            return null;
        }

        int score = calculateScore(mineVector, otherVector);
        User user = userOpt.get();
        List<String> tags = toTags(user.getTags());

        return new RecommendationResponse(
                result.getUserId(),
                user.getNickname(),
                user.getProfileImageUrl(),
                user.getBio(),
                tags,
                score,
                calculateAge(user.getBirthDate())
        );
    }

    private int calculateScore(List<Double> a, List<Double> b) {
        double dot = 0.0;
        double aNorm = 0.0;
        double bNorm = 0.0;
        for (int i = 0; i < a.size(); i++) {
            dot += a.get(i) * b.get(i);
            aNorm += Math.pow(a.get(i), 2);
            bNorm += Math.pow(b.get(i), 2);
        }
        if (aNorm == 0 || bNorm == 0) {
            return 0;
        }
        double similarity = dot / (Math.sqrt(aNorm) * Math.sqrt(bNorm));
        return (int) Math.round(similarity * 100);
    }

    private List<Double> parseVector(String vectorJson) {
        if (vectorJson == null || vectorJson.isBlank()) {
            return Collections.emptyList();
        }
        String trimmed = vectorJson.trim();
        if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
            trimmed = trimmed.substring(1, trimmed.length() - 1);
        }
        if (trimmed.isBlank()) {
            return Collections.emptyList();
        }
        return Arrays.stream(trimmed.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .map(Double::parseDouble)
                .toList();
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

    private List<Double> normalizeAnswers(List<Integer> answers) {
        return answers.stream()
                .map(answer -> (answer - 1) / 4.0)
                .toList();
    }

    private List<Double> vectorFromSurvey(SurveyResult result) {
        List<Double> vector = parseVector(result.getVector());
        if (!vector.isEmpty()) {
            return vector;
        }
        List<Integer> answers = parseAnswers(result.getAnswers());
        return normalizeAnswers(answers);
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
