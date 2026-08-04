package com.example.backend.service;

import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;

/**
 * 설문 답변(1~5 리커트 척도) 두 벌을 받아 호환도 점수(0~100)를 계산한다.
 * <p>
 * 기존 코사인 유사도는 모든 값이 [0,1]인 양의 공간에 몰려 각도 차이가 작게 나와
 * "정반대인데 높은 점수"가 나오는 문제가 있었다. 그 다음엔 문항별 답변 거리를 가중 평균하는
 * 방식을 썼는데, 이건 문항 수(20개)에 걸쳐 평균 내다 보니 개별 문항의 가중치를 "높음"으로
 * 올려도 전체 점수에 거의 영향이 없는 문제가 있었다(가중치 총합이라는 분모에 같이 희석됨).
 * <p>
 * 그래서 지금은 평균이 아니라 "100점에서 문항별로 정해진 만큼 직접 깎는" 방식을 쓴다.
 * 문항이 어긋난 정도(penaltyRatio, 0~1)에 사용자가 그 문항에 설정한 가중치(낮음/보통/높음)별
 * 최대 감점폭({@link #WEIGHT_MAX_DEDUCTION})을 곱해서 뺀다 — "높음"으로 설정한 문항이 어긋나면
 * 확실히 점수가 떨어지고, "낮음"이면 어긋나도 거의 안 떨어진다.
 * <p>
 * 가중치는 사용자가 설문 완료 후 문항별로 직접 설정할 수 있다({@link UserCategoryWeightService}).
 * 설정하지 않은 문항은 아래 DEFAULT_WEIGHTS를 그대로 쓴다.
 */
@Component
public class CompatibilityCalculator {

    private static final int MIN_ANSWER = 1;
    private static final int MAX_ANSWER = 5;
    private static final int MAX_DIFF = MAX_ANSWER - MIN_ANSWER; // 4

    // 대부분의 문항 차이가 1~2점 정도라 어긋난 정도(penaltyRatio)가 작게 잡히는 문제 완화용.
    // 일반 문항의 penaltyRatio에 1보다 큰 지수를 씌워서, 작은 차이는 원래보다 덜 어긋난 것으로,
    // 큰 차이는 상대적으로 더 크게 어긋난 것으로 잡는다.
    private static final double PENALTY_SPREAD_EXPONENT = 1.5;

    // 가중치(낮음=1/보통=2/높음=3) 단계별로, 그 문항이 완전히 어긋났을 때(penaltyRatio=1.0)
    // 100점에서 최대 몇 점을 깎을지. index = 가중치 값. 0번 슬롯은 사용하지 않음.
    // 평균이 아니라 직접 차감이라 문항 수와 무관하게 항상 이만큼 영향을 준다.
    private static final int[] WEIGHT_MAX_DEDUCTION = {0, 2, 6, 15};

    // 문항별 기본 가중치 (index = 질문 id, 1-based). 0번 슬롯은 사용하지 않음.
    // 3=높음, 2=보통, 1=낮음 — 사용자가 직접 고르는 3단계와 동일한 척도.
    // 2026-07-31: 프론트 설문 문항이 주제별로 재배열되면서 id 순서가 바뀜에 따라 함께 갱신.
    private static final int[] DEFAULT_WEIGHTS = {
            0,
            3, // 1 취침 시간
            2, // 2 화장실 사용
            3, // 3 코골이
            3, // 4 야간 생활
            3, // 5 청결
            3, // 6 청소 방식
            3, // 7 생활 소음
            1, // 8 전화 통화
            2, // 9 이어폰 사용
            2, // 10 실내 취식
            1, // 11 야식
            3, // 12 흡연 — 채점에서 제외되는 문항이라 이 가중치 자체는 안 쓰임 (아래 SMOKING_QUESTION_ID 참고)
            2, // 13 음주
            2, // 14 음주 후 행동
            2, // 15 친구 초대
            2, // 16 갈등 해결
            1, // 17 벌레
            2, // 18 공용 비품
            2, // 19 월 생활비
            2  // 20 방 크기
    };

    // 흡연(12번)은 더 이상 "답변 거리"로 채점하지 않는다. 이 문항은 이제 "상대방의 흡연을
    // 내가 어디까지 허용하는지"를 묻는 허용도 문항이라 두 사람의 답을 서로 비교하는 게 의미가
    // 없고, 실제 흡연 여부/종류(User.smoking, smokingType)와 비교해 추천 목록 자체에서
    // 거르는 필터로 CompatibilityService에서 처리한다. 그래서 점수 계산 루프에서는 건너뛴다.
    private static final int SMOKING_QUESTION_ID = 12;

    // 화장실 사용 시간대는 "얼마나 다르냐"가 아니라 "겹치냐 안 겹치냐"의 문제다.
    // 같은 시간대면 최대 페널티, 조금이라도 다르면(정도 무관) 페널티 없음.
    // 단 "신경 안 씀"(정해진 시간이 없음)은 실제 시간대가 아니라 유연함 표시라,
    // 둘 다 신경 안 씀이든 한쪽만 신경 안 씀이든 겹칠 시간대 자체가 없으니 항상 페널티 없음.
    private static final int BATHROOM_QUESTION_ID = 2;
    private static final int BATHROOM_FLEXIBLE_ANSWER = 5; // 상황에 따라 다르거나 정해진 시간이 없음

    // 벌레는 "둘이 얼마나 비슷하게 답했나"가 아니라 "둘 중 한 명이라도 처리할 수 있나"의 문제다.
    // 한쪽만 처리 가능하면(답이 반대여도) 문제없고, 둘 다 못 잡을 때만 페널티를 준다.
    private static final int BUGS_QUESTION_ID = 17;
    private static final int BUGS_CAPABLE_MAX_ANSWER = 2; // 1~2: 직접 처리 가능

    /**
     * @param a 내 답변 목록 (각 원소 1~5)
     * @param b 상대 답변 목록 (각 원소 1~5)
     * @return 0~100 호환도 점수. 비교할 답변이 없으면 0.
     */
    public int score(List<Integer> a, List<Integer> b) {
        return score(a, b, Map.of());
    }

    /**
     * @param a 내 답변 목록 (각 원소 1~5)
     * @param b 상대 답변 목록 (각 원소 1~5)
     * @param customWeights 문항 id -> 가중치(1~3). 조회 기준 사용자가 직접 설정한 값 (없는 문항은 기본값 사용)
     * @return 0~100 호환도 점수. 비교할 답변이 없으면 0.
     */
    public int score(List<Integer> a, List<Integer> b, Map<Integer, Integer> customWeights) {
        int count = Math.min(a.size(), b.size());
        if (count == 0) {
            return 0;
        }

        double totalDeduction = 0.0;

        for (int i = 0; i < count; i++) {
            int questionId = i + 1;

            if (questionId == SMOKING_QUESTION_ID) {
                // 실제 흡연 여부/종류 기반 필터링은 CompatibilityService에서 처리하므로 채점에서 제외.
                continue;
            }

            int weight = weightFor(questionId, customWeights);
            double penaltyRatio = penaltyRatioFor(questionId, a.get(i), b.get(i));
            totalDeduction += WEIGHT_MAX_DEDUCTION[weight] * penaltyRatio;
        }

        int score = (int) Math.round(100 - totalDeduction);
        return Math.max(0, Math.min(100, score));
    }

    // 문항 하나가 "얼마나 어긋났는지"를 0(완전 일치)~1(완전 불일치)로 반환한다.
    private double penaltyRatioFor(int questionId, int answerA, int answerB) {
        if (questionId == BATHROOM_QUESTION_ID) {
            // 둘 중 하나라도 "신경 안 씀"이면 겹칠 고정 시간대가 없으니 페널티 없음.
            // 둘 다 고정 시간대를 답했을 때만 같은 시간대인지를 본다.
            boolean eitherFlexible = answerA == BATHROOM_FLEXIBLE_ANSWER || answerB == BATHROOM_FLEXIBLE_ANSWER;
            boolean sameFixedSlot = !eitherFlexible && answerA == answerB;
            return sameFixedSlot ? 1.0 : 0.0;
        }
        if (questionId == BUGS_QUESTION_ID) {
            boolean neitherHandles = answerA > BUGS_CAPABLE_MAX_ANSWER && answerB > BUGS_CAPABLE_MAX_ANSWER;
            return neitherHandles ? 1.0 : 0.0;
        }
        int diff = Math.abs(answerA - answerB);
        return Math.pow((double) diff / MAX_DIFF, PENALTY_SPREAD_EXPONENT);
    }

    private int weightFor(int questionId, Map<Integer, Integer> customWeights) {
        Integer custom = customWeights.get(questionId);
        if (custom != null) {
            return clampWeight(custom);
        }
        if (questionId >= 1 && questionId < DEFAULT_WEIGHTS.length) {
            return DEFAULT_WEIGHTS[questionId];
        }
        return 1; // 알 수 없는 문항은 기본 가중치
    }

    // 커스텀 가중치는 프론트에서 1~3 중 하나로 저장되지만, API로 범위 밖 값이 들어와도 계산이 깨지지 않도록 방어한다.
    private int clampWeight(int weight) {
        return Math.max(1, Math.min(3, weight));
    }

    // 회원가입 시 입력하는 실제 흡연 여부/종류(User.smoking, smokingType)의 심각도.
    // 비흡연(0) < 액상형 전자담배(1) < 궐련형 전자담배(2) < 연초(3).
    // CompatibilityService가 추천 목록에서 이 값과 상대의 허용도를 비교해 걸러낸다.
    public int smokingSeverity(String smoking, String smokingType) {
        if (!"SMOKER".equals(smoking)) {
            return 0;
        }
        return switch (smokingType) {
            case "LIQUID" -> 1;
            case "HEATED" -> 2;
            case "CIGARETTE" -> 3;
            default -> 3;
        };
    }

    // 설문 12번(흡연 허용도) 답변이 받아들이는 최대 심각도.
    // 1=연초도 괜찮음(전부 허용) ~ 4=흡연자 싫음(비흡연자만 허용).
    public int maxAcceptedSmokingSeverity(int toleranceAnswer) {
        return switch (toleranceAnswer) {
            case 1 -> 3;
            case 2 -> 2;
            case 3 -> 1;
            case 4 -> 0;
            default -> 0; // 알 수 없는 답변은 안전하게 가장 엄격한 기준
        };
    }
}
