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
import java.util.Map;

@Service
@RequiredArgsConstructor
public class SurveyComparisonService {

    // 2026-07-31: 프론트 설문 문항이 주제별로 재배열되면서 id/문구가 바뀜에 따라 함께 갱신.
    private static final List<SurveyQuestionPrompt> QUESTIONS = List.of(
            new SurveyQuestionPrompt(1, "취침 시간", List.of("새벽 3시 이후", "새벽 1~3시", "밤 11시~1시", "밤 10~11시", "밤 10시 이전")),
            new SurveyQuestionPrompt(2, "화장실 사용", List.of("6시 이전에 써.", "6~7시 사이에 써.", "7~8시 사이에 써.", "8~9시 사이에 써.", "9시 이후에 쓰거나 정해진 시간이 없어.")),
            new SurveyQuestionPrompt(3, "코골이", List.of("심하게 골아.", "비교적 조용히 고는거같아.", "피곤할때 가끔 골아.", "골지 않아.", "나도 코를 고는지 안 고는지 몰라.")),
            new SurveyQuestionPrompt(4, "야간 생활", List.of("평소와 똑같아.", "조금 조심해.", "상황에 따라 다른거 같아.", "최대한 조용히 행동하지.", "소음이 발생하는 행동자체를 안해.")),
            new SurveyQuestionPrompt(5, "청결", List.of("거의 정리하지 않아.", "하루에 한 번 정도 정리하는 편이야.", "어느 정도 정리하지만 완벽하게 유지하려고는 않아.", "사용한 물건은 바로 정리하는 편이야.", "항상 완벽하게 정리된 상태야")),
            new SurveyQuestionPrompt(6, "청소 방식", List.of("사람을 고용해서 청소해.", "정해진 당번표 없이 그때그때 필요할 때 치워.", "상황에 따라 다른게 좋아.", "어느 정도 정해진 기준(요일, 담당)이 있어야 해.", "명확한 당번표나 규칙을 정해서 지키는 게 좋아.")),
            new SurveyQuestionPrompt(7, "생활 소음", List.of("거의 신경 쓰지 않는 편이야.", "큰 소음만 아니면 괜찮아.", "평범한거 같은데?", "작은 소음도 신경 쓰일때가 있어.", "아주 작은 소음도 예민해서 신경쓰여.")),
            new SurveyQuestionPrompt(8, "전화 통화", List.of("거의 매일 통화해!", "주 3~5회 정도 통화해.", "주 1~2회 정도 통화해.", "필요한 경우에만 짧게 통화해.", "거의 통화하지 않아.")),
            new SurveyQuestionPrompt(9, "이어폰 사용", List.of("블루투스 스피커로 빵빵하게 틀어놔.", "핸드폰 스피커를 틀어놔.", "상황에 따라 스피커나 이어폰을 모두 사용해.", "대부분 이어폰을 사용하거나 작게 틀어.", "항상 이어폰만 사용해.")),
            new SurveyQuestionPrompt(10, "실내 취식", List.of("거의 모든 식사를 집에서 해.", "자주 집에서 먹어.", "가끔 먹어.", "거의 먹지 않아.", "집에서는 절대 먹지 않아.")),
            new SurveyQuestionPrompt(11, "야식", List.of("거의 매일 먹어.", "주 3~5회 먹어.", "주 1~2회 먹어.", "한 달에 몇 번?", "거의 안 먹어.")),
            new SurveyQuestionPrompt(12, "흡연", List.of("흡연해.", "흡연하지 않아.")),
            new SurveyQuestionPrompt(13, "음주", List.of("일주일에 4회 이상", "일주일에 1~2회", "한 달에 1~2회", "가끔 마셔.", "마시지 않아.")),
            new SurveyQuestionPrompt(14, "음주 후 행동", List.of("엄청 시끄러워져.", "평소보단 시끄러워져.", "평소와 비슷한듯?", "평소보다 조용해져.", "술을 안 마셔.")),
            new SurveyQuestionPrompt(15, "친구 초대", List.of("허락없이 언제든 상관없어.", "말만 해주면 언제든 상관없어.", "허락을 구한 뒤에 초대하는거면 언제든 상관없어.", "허락을 구해도 자주는 부담스러워.", "집에 다른 사람을 초대하지 않는게 좋아.")),
            new SurveyQuestionPrompt(16, "갈등 해결", List.of("바로 이야기로 해결하려고 해.", "하루 이내에 대화를 시도해보는거 같아.", "몇일은 지난 후 이야기할거 같아.", "일주일은 지난 후 이야기할거 같아.", "먼저 이야기하지 않는 편이야.")),
            new SurveyQuestionPrompt(17, "벌레", List.of("바로 잡아.", "대부분 직접 처리해.", "상황에 따라 다른거 같아.", "다른 사람이 있으면 부탁하는 편이야.", "벌레는 절대 혼자 처리못해.")),
            new SurveyQuestionPrompt(18, "공용 비품", List.of("공용으로 쓸 수 있는건 함께 사용하는게 좋아.", "몇가지 빼고는 함께 사용하는게 좋아.", "상황에 따라 다른것 같아", "몇가지 빼고는 따로 사용하는게 좋아.", "모든 물건을 개인용으로 사용할래.")),
            new SurveyQuestionPrompt(19, "월 생활비", List.of("100만 원 이상", "70~100만 원", "50~70만 원", "30~50만 원", "30만 원 미만")),
            new SurveyQuestionPrompt(20, "방 크기", List.of("20평 이상이어야 해.", "15~19평", "10~14평", "7~9평", "6평 이하도 좋아."))
    );

    private final SurveyResultRepository surveyResultRepository;
    private final UserRepository userRepository;
    private final CompatibilityCalculator compatibilityCalculator;
    private final UserCategoryWeightService userCategoryWeightService;

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
                .map(this::toHighlight)
                .toList();

        List<SurveyComparisonHighlightResponse> differences = items.stream()
                .sorted(Comparator
                        .comparing(SurveyComparisonItemResponse::difference).reversed()
                        .thenComparing(SurveyComparisonItemResponse::questionId))
                .limit(3)
                .map(this::toHighlight)
                .toList();

        return new SurveyComparisonResponse(
                otherUserId,
                otherUser.getNickname(),
                calculateCompatibilityScore(myUserId, myAnswers, otherAnswers),
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

    private SurveyComparisonHighlightResponse toHighlight(SurveyComparisonItemResponse item) {
        return new SurveyComparisonHighlightResponse(
                item.category(),
                item.myAnswer(),
                item.otherAnswer(),
                item.difference()
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

    private int calculateCompatibilityScore(Long myUserId, List<Integer> myAnswers, List<Integer> otherAnswers) {
        Map<Integer, Integer> myWeights = userCategoryWeightService.getWeights(myUserId);
        return compatibilityCalculator.score(myAnswers, otherAnswers, myWeights);
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
