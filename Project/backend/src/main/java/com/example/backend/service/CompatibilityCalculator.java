package com.example.backend.service;

import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;

/**
 * 설문 답변(1~5 리커트 척도) 두 벌을 받아 호환도 점수(0~100)를 계산한다.
 * <p>
 * 기존 코사인 유사도는 모든 값이 [0,1]인 양의 공간에 몰려 각도 차이가 작게 나와
 * "정반대인데 높은 점수"가 나오는 문제가 있었다. 여기서는 문항별 답변 거리를
 * 가중 평균해서 "얼마나 벌어져 있나"를 직접 점수화한다.
 * <p>
 * 가중치는 사용자가 설문 완료 후 문항별로 직접 설정할 수 있다({@link UserCategoryWeightService}).
 * 설정하지 않은 문항은 아래 DEFAULT_WEIGHTS를 그대로 쓴다.
 */
@Component
public class CompatibilityCalculator {

    private static final int MIN_ANSWER = 1;
    private static final int MAX_ANSWER = 5;
    private static final int MAX_DIFF = MAX_ANSWER - MIN_ANSWER; // 4

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
            3, // 12 흡연 — 유무가 갈리면 이진 판정으로 크게 벌어지므로 다른 항목과 같은 최고 단계면 충분
            2, // 13 음주
            2, // 14 음주 후 행동
            2, // 15 친구 초대
            2, // 16 갈등 해결
            1, // 17 벌레
            2, // 18 공용 비품
            2, // 19 월 생활비
            2  // 20 방 크기
    };

    // 흡연은 "얼마나 피우냐"의 정도가 아니라 "피우냐 / 아예 안 피우냐"의 범주 문제라
    // 가중치만으로는 다른 문항들이 다 잘 맞을 때 점수를 충분히 끌어내리지 못한다(가중치 총합 대비 비중이 작음).
    // 그래서 흡연자/비흡연자가 갈리면 다른 항목이 아무리 잘 맞아도 점수 상한을 씌운다.
    private static final int SMOKING_QUESTION_ID = 12;
    private static final int SMOKER_MAX_ANSWER = 1; // 1 흡연, 2 비흡연
    private static final int SMOKING_MISMATCH_SCORE_CAP = 40;

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

        double weightedPenalty = 0.0;
        double totalWeight = 0.0;
        boolean smokingMismatch = false;

        for (int i = 0; i < count; i++) {
            int questionId = i + 1;
            int weight = weightFor(questionId, customWeights);

            double penaltyRatio;
            if (questionId == SMOKING_QUESTION_ID) {
                // 흡연자/비흡연자 경계만 본다 (선택지 자체가 2개뿐이라 세부 정도 차이가 없음).
                boolean aSmokes = a.get(i) <= SMOKER_MAX_ANSWER;
                boolean bSmokes = b.get(i) <= SMOKER_MAX_ANSWER;
                smokingMismatch = aSmokes != bSmokes;
                penaltyRatio = smokingMismatch ? 1.0 : 0.0;
            } else if (questionId == BATHROOM_QUESTION_ID) {
                // 둘 중 하나라도 "신경 안 씀"이면 겹칠 고정 시간대가 없으니 페널티 없음.
                // 둘 다 고정 시간대를 답했을 때만 같은 시간대인지를 본다.
                boolean eitherFlexible = a.get(i) == BATHROOM_FLEXIBLE_ANSWER || b.get(i) == BATHROOM_FLEXIBLE_ANSWER;
                boolean sameFixedSlot = !eitherFlexible && a.get(i).equals(b.get(i));
                penaltyRatio = sameFixedSlot ? 1.0 : 0.0;
            } else if (questionId == BUGS_QUESTION_ID) {
                boolean neitherHandles = a.get(i) > BUGS_CAPABLE_MAX_ANSWER && b.get(i) > BUGS_CAPABLE_MAX_ANSWER;
                penaltyRatio = neitherHandles ? 1.0 : 0.0;
            } else {
                int diff = Math.abs(a.get(i) - b.get(i));
                penaltyRatio = (double) diff / MAX_DIFF;
            }

            weightedPenalty += weight * penaltyRatio;
            totalWeight += weight;
        }

        if (totalWeight == 0) {
            return 0;
        }

        double ratio = 1.0 - (weightedPenalty / totalWeight);
        int rawScore = (int) Math.round(ratio * 100);
        return smokingMismatch ? Math.min(rawScore, SMOKING_MISMATCH_SCORE_CAP) : rawScore;
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
}
