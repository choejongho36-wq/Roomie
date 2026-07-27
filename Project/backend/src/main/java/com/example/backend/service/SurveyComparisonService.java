package com.example.backend.service;

import com.example.backend.domain.SurveyResult;
import com.example.backend.domain.User;
import com.example.backend.dto.SurveyComparisonHighlightResponse;
import com.example.backend.dto.SurveyComparisonItemResponse;
import com.example.backend.dto.SurveyComparisonResponse;
import com.example.backend.repository.SurveyResultRepository;
import com.example.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.Arrays;
import java.util.Comparator;
import java.util.List;

@Service
@RequiredArgsConstructor
public class SurveyComparisonService {

    private static final List<SurveyQuestionPrompt> QUESTIONS = List.of(
            new SurveyQuestionPrompt(1, "청결", List.of("물건을 사용한 뒤 거의 정리하지 않는다.", "방이 자주 어질러지며 하루에 한 번 정도 정리한다.", "어느 정도 정리하지만 완벽하게 유지하지는 않는다.", "사용한 물건은 바로 정리하는 편이다.", "항상 완벽하게 정리된 상태를 유지한다.")),
            new SurveyQuestionPrompt(2, "취침 시간", List.of("새벽 3시 이후", "새벽 1~3시", "밤 11시~1시", "밤 10~11시", "밤 10시 이전")),
            new SurveyQuestionPrompt(3, "요리", List.of("거의 매일 요리한다.", "주 3~5회 정도 요리한다.", "주 1~2회 정도 요리한다.", "한 달에 몇 번 정도만 요리한다.", "거의 요리하지 않는다.")),
            new SurveyQuestionPrompt(4, "전화 통화", List.of("거의 매일 오래 통화한다.", "자주 통화한다.", "가끔 통화한다.", "필요한 경우에만 짧게 통화한다.", "거의 통화하지 않는다.")),
            new SurveyQuestionPrompt(5, "생활 소음", List.of("웬만한 소음은 거의 신경 쓰지 않는다.", "큰 소음만 신경 쓰인다.", "보통 수준이다.", "작은 소음도 신경 쓰이는 편이다.", "아주 작은 소음도 잠이나 생활에 영향을 준다.")),
            new SurveyQuestionPrompt(6, "공용 비품", List.of("대부분 함께 구매하고 함께 사용한다.", "가능한 함께 사용하는 편이다.", "상황에 따라 다르다.", "웬만하면 따로 구매해서 사용한다.", "모든 물건을 개인용으로 사용하는 것을 선호한다.")),
            new SurveyQuestionPrompt(7, "친구 초대", List.of("거의 매주 초대한다.", "한 달에 2~3번 정도 초대한다.", "한 달에 1번 정도 초대한다.", "거의 초대하지 않는다.", "집에는 다른 사람을 초대하지 않는다.")),
            new SurveyQuestionPrompt(8, "이어폰 사용", List.of("대부분 스피커를 사용한다.", "스피커를 자주 사용한다.", "상황에 따라 이어폰과 스피커를 모두 사용한다.", "대부분 이어폰을 사용한다.", "항상 이어폰을 사용한다.")),
            new SurveyQuestionPrompt(9, "야간 생활", List.of("평소와 똑같이 생활한다.", "조금만 조심한다.", "상황에 따라 다르다.", "최대한 조용히 생활한다.", "소음이 발생하는 행동은 하지 않는다.")),
            new SurveyQuestionPrompt(10, "갈등 해결", List.of("바로 이야기하며 해결하려고 한다.", "하루 이내에 대화를 시도한다.", "상황을 보고 판단한다.", "시간이 지난 후 이야기한다.", "먼저 이야기하지 않는 편이다.")),
            new SurveyQuestionPrompt(11, "벌레", List.of("직접 바로 잡는다.", "대부분 직접 처리한다.", "상황에 따라 다르다.", "다른 사람에게 부탁하는 편이다.", "벌레를 전혀 처리하지 못한다.")),
            new SurveyQuestionPrompt(12, "코골이", List.of("거의 매일 심하게 곤다.", "자주 곤다.", "가끔 곤다.", "거의 골지 않는다.", "전혀 골지 않는다.")),
            new SurveyQuestionPrompt(13, "흡연", List.of("실내 흡연을 한다.", "흡연을 자주 한다.", "가끔 흡연한다.", "전자담배만 사용한다.", "흡연하지 않는다.")),
            new SurveyQuestionPrompt(14, "음주", List.of("일주일에 4회 이상", "일주일에 2~3회", "일주일에 1회", "한 달에 1~2회", "거의 마시지 않는다.")),
            new SurveyQuestionPrompt(15, "음주 후 행동", List.of("매우 시끄러워진다.", "다소 시끄러워지는 편이다.", "평소와 비슷하다.", "조용한 편이다.", "거의 술을 마시지 않는다.")),
            new SurveyQuestionPrompt(16, "야식", List.of("거의 매일 먹는다.", "주 3~5회", "주 1~2회", "한 달에 몇 번", "거의 먹지 않는다.")),
            new SurveyQuestionPrompt(17, "실내 취식", List.of("거의 모든 식사를 방에서 한다.", "자주 방에서 먹는다.", "가끔 먹는다.", "거의 먹지 않는다.", "방에서는 절대 먹지 않는다.")),
            new SurveyQuestionPrompt(18, "실내 온도", List.of("매우 따뜻한 환경", "따뜻한 편", "보통", "시원한 편", "매우 시원한 환경")),
            new SurveyQuestionPrompt(19, "월 생활비", List.of("100만 원 이상", "70~100만 원", "50~70만 원", "30~50만 원", "30만 원 미만")),
            new SurveyQuestionPrompt(20, "방 크기", List.of("12평 이상", "10~12평", "7~10평", "5~7평", "5평 이하도 괜찮다."))
    );

    private final SurveyResultRepository surveyResultRepository;
    private final UserRepository userRepository;

    public SurveyComparisonResponse compare(Long myUserId, Long otherUserId) {
        if (myUserId.equals(otherUserId)) {
            throw new IllegalArgumentException("본인과는 비교할 수 없습니다.");
        }

        SurveyResult mySurvey = latestSurvey(myUserId);
        SurveyResult otherSurvey = latestSurvey(otherUserId);
        User otherUser = userRepository.findById(otherUserId)
                .orElseThrow(() -> new IllegalArgumentException("상대 사용자를 찾을 수 없습니다."));

        List<Integer> myAnswers = parseAnswers(mySurvey.getAnswers());
        List<Integer> otherAnswers = parseAnswers(otherSurvey.getAnswers());
        int count = Math.min(Math.min(myAnswers.size(), otherAnswers.size()), QUESTIONS.size());

        List<SurveyComparisonItemResponse> items = QUESTIONS.stream()
                .limit(count)
                .map(question -> toItem(question, myAnswers.get(question.id() - 1), otherAnswers.get(question.id() - 1)))
                .toList();

        List<SurveyComparisonHighlightResponse> topReasons = items.stream()
                .sorted(Comparator
                        .comparing(SurveyComparisonItemResponse::difference)
                        .thenComparing(SurveyComparisonItemResponse::questionId))
                .limit(3)
                .map(item -> toHighlight(item, "서로의 답변 차이가 작아 생활 리듬을 맞추기 좋아요."))
                .toList();

        List<SurveyComparisonHighlightResponse> differences = items.stream()
                .sorted(Comparator
                        .comparing(SurveyComparisonItemResponse::difference).reversed()
                        .thenComparing(SurveyComparisonItemResponse::questionId))
                .limit(3)
                .map(item -> toHighlight(item, item.difference() == 0
                        ? "큰 차이가 없어 조율 부담이 적어요."
                        : "생활 방식 차이가 있어 입주 전 조율하면 좋아요."))
                .toList();

        return new SurveyComparisonResponse(
                otherUserId,
                otherUser.getNickname(),
                calculateCompatibilityScore(myAnswers, otherAnswers),
                topReasons,
                differences,
                items
        );
    }

    private SurveyResult latestSurvey(Long userId) {
        return surveyResultRepository.findByUserIdOrderByCompletedAtDesc(userId).stream()
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("비교할 설문 결과가 없습니다."));
    }

    private SurveyComparisonItemResponse toItem(SurveyQuestionPrompt question, int myScore, int otherScore) {
        int difference = Math.abs(myScore - otherScore);
        return new SurveyComparisonItemResponse(
                question.id(),
                question.category(),
                answerText(question, myScore),
                answerText(question, otherScore),
                myScore,
                otherScore,
                difference,
                matchLevel(difference)
        );
    }

    private SurveyComparisonHighlightResponse toHighlight(SurveyComparisonItemResponse item, String description) {
        return new SurveyComparisonHighlightResponse(
                item.category(),
                item.myAnswer(),
                item.otherAnswer(),
                item.difference(),
                description
        );
    }

    private String answerText(SurveyQuestionPrompt question, int score) {
        if (score < 1 || score > question.options().size()) {
            return score + "점";
        }
        return question.options().get(score - 1);
    }

    private String matchLevel(int difference) {
        if (difference == 0) return "완전 일치";
        if (difference == 1) return "비슷함";
        if (difference == 2) return "조율 필요";
        return "차이 큼";
    }

    private int calculateCompatibilityScore(List<Integer> myAnswers, List<Integer> otherAnswers) {
        int count = Math.min(myAnswers.size(), otherAnswers.size());
        if (count == 0) {
            return 0;
        }

        double dot = 0.0;
        double myNorm = 0.0;
        double otherNorm = 0.0;
        for (int i = 0; i < count; i++) {
            double myValue = (myAnswers.get(i) - 1) / 4.0;
            double otherValue = (otherAnswers.get(i) - 1) / 4.0;
            dot += myValue * otherValue;
            myNorm += Math.pow(myValue, 2);
            otherNorm += Math.pow(otherValue, 2);
        }
        if (myNorm == 0 || otherNorm == 0) {
            return 0;
        }
        double similarity = dot / (Math.sqrt(myNorm) * Math.sqrt(otherNorm));
        return (int) Math.round(similarity * 100);
    }

    private List<Integer> parseAnswers(String answersJson) {
        if (answersJson == null || answersJson.isBlank()) {
            return List.of();
        }
        String trimmed = answersJson.trim();
        if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
            trimmed = trimmed.substring(1, trimmed.length() - 1);
        }
        if (trimmed.isBlank()) {
            return List.of();
        }
        return Arrays.stream(trimmed.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .map(Integer::parseInt)
                .toList();
    }

    private record SurveyQuestionPrompt(Integer id, String category, List<String> options) {}
}
