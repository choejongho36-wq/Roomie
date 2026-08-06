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

    // SurveyQuestions.ts의 문항 id 19("희망 월세")는 0-base로 answers 배열의 19번째(index 18)에 해당한다.
    private static final int RENT_QUESTION_INDEX = 18;

    // SurveyQuestions.ts의 문항 id 12("흡연 허용도")는 0-base로 answers 배열의 12번째(index 11)에 해당한다.
    private static final int SMOKING_TOLERANCE_QUESTION_INDEX = 11;

    public List<RecommendationResponse> recommendForUser(Long userId) {
        List<SurveyResult> ownSurveys = surveyResultRepository.findByUserIdOrderByCompletedAtDesc(userId);
        if (ownSurveys.isEmpty()) {
            return List.of();
        }

        User me = userRepository.findById(userId).orElse(null);
        if (me == null) {
            return List.of();
        }
        String myGender = me.getGender();

        SurveyResult mine = ownSurveys.get(0);
        List<Integer> myAnswers = parseAnswers(mine.getAnswers());
        if (myAnswers.isEmpty()) {
            return List.of();
        }

        // 호환도는 "내가 볼 때" 기준이라 내가 설정한 가중치로 상대방들을 채점한다.
        Map<Integer, Integer> myWeights = userCategoryWeightService.getWeights(userId);

        // 흡연 허용도(설문 12번)도 "내가 볼 때" 기준 — 내가 어디까지 허용하는지로 상대를 거른다.
        int myMaxSmokingSeverity = myAnswers.size() > SMOKING_TOLERANCE_QUESTION_INDEX
                ? compatibilityCalculator.maxAcceptedSmokingSeverity(myAnswers.get(SMOKING_TOLERANCE_QUESTION_INDEX))
                : 0;

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
                .map(result -> buildRecommendation(result, myAnswers, myWeights, myMaxSmokingSeverity, myGender))
                .filter(Objects::nonNull)
                .sorted(Comparator.comparing(RecommendationResponse::compatibilityScore).reversed())
                .toList();
    }

    private RecommendationResponse buildRecommendation(
            SurveyResult result, List<Integer> myAnswers, Map<Integer, Integer> myWeights,
            int myMaxSmokingSeverity, String myGender) {
        List<Integer> otherAnswers = parseAnswers(result.getAnswers());
        if (otherAnswers.isEmpty()) {
            return null;
        }

        Optional<User> userOpt = userRepository.findById(result.getUserId());
        if (userOpt.isEmpty()) {
            return null;
        }
        User user = userOpt.get();
        // 탈퇴 시 설문결과도 같이 지우고 있지만, 그 로직이 생기기 전에 이미 탈퇴한 계정처럼
        // 남아있을 수 있는 예외 케이스를 위해 여기서도 한 번 더 확실히 걸러냄
        if ("WITHDRAWN".equals(user.getStatus())) {
            return null;
        }

        // 매칭은 유저끼리만 — 관리자 계정은 룸메이트 매칭 대상이 아니므로 항상 제외
        if (user.isAdmin()) {
            return null;
        }

        // 동성 매칭만 지원함 (MM/FF) — 성별이 다르면 점수 계산도 할 필요 없이 바로 제외
        if (!Objects.equals(myGender, user.getGender())) {
            return null;
        }

        // 내가 허용하는 흡연 수준을 넘는 상대는 점수 볼 것도 없이 추천 목록에서 제외한다.
        int candidateSmokingSeverity = compatibilityCalculator.smokingSeverity(user.getSmoking(), user.getSmokingType());
        if (candidateSmokingSeverity > myMaxSmokingSeverity) {
            return null;
        }

        int score = compatibilityCalculator.score(myAnswers, otherAnswers, myWeights);
        List<String> tags = toTags(user.getTags());

        RentRange rentRange = extractRentRange(otherAnswers);

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
                user.getSmoking(),
                user.getSmokingType(),
                user.getEmailVerified(),
                rentRange.min(),
                rentRange.max()
        );
    }

    private record RentRange(Integer min, Integer max) {
        private static final RentRange NONE = new RentRange(null, null);
    }

    // "희망 월세" 문항 응답(1~5점)을 실제 보기 문구가 가리키는 구간(만원)으로 환산한다.
    // 단일 대표값 대신 구간 자체를 내려줘서, 프론트에서 선택한 슬라이더 범위와 "겹치기만
    // 해도" 매칭되게 한다(예: 슬라이더 60~70과 응답 구간 70~100은 70에서 겹치므로 포함).
    // 전세·년세(1번) 응답이거나 응답이 없으면 (null, null)로 반환해 필터에서 제외한다.
    private RentRange extractRentRange(List<Integer> answers) {
        if (answers.size() <= RENT_QUESTION_INDEX) {
            return RentRange.NONE;
        }
        Integer score = answers.get(RENT_QUESTION_INDEX);
        if (score == null) {
            return RentRange.NONE;
        }
        return switch (score) {
            case 1 -> RentRange.NONE;       // 전세·년세라 월세 없음
            case 2 -> new RentRange(100, 9999); // 100만 원 이상 (사실상 상한 없음)
            case 3 -> new RentRange(70, 100);   // 70~100만 원
            case 4 -> new RentRange(50, 70);    // 50~70만 원
            case 5 -> new RentRange(0, 50);     // 50만 원 미만
            default -> RentRange.NONE;
        };
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