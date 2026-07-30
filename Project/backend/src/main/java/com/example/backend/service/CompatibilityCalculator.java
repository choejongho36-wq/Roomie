package com.example.backend.service;

import org.springframework.stereotype.Component;

import java.util.List;

/**
 * 설문 답변(1~5 리커트 척도) 두 벌을 받아 호환도 점수(0~100)를 계산한다.
 * <p>
 * 기존 코사인 유사도는 모든 값이 [0,1]인 양의 공간에 몰려 각도 차이가 작게 나와
 * "정반대인데 높은 점수"가 나오는 문제가 있었다. 여기서는 문항별 답변 거리를
 * 가중 평균해서 "얼마나 벌어져 있나"를 직접 점수화한다.
 */
@Component
public class CompatibilityCalculator {

    private static final int MIN_ANSWER = 1;
    private static final int MAX_ANSWER = 5;
    private static final int MAX_DIFF = MAX_ANSWER - MIN_ANSWER; // 4

    // 문항별 가중치 (index = 질문 id, 1-based). 0번 슬롯은 사용하지 않음.
    // 3=높음, 2=보통, 1=낮음
    private static final int[] WEIGHTS = {
            0,
            3, // 1 청결
            3, // 2 취침 시간
            2, // 3 요리
            1, // 4 전화 통화
            3, // 5 생활 소음
            2, // 6 공용 비품
            2, // 7 친구 초대
            2, // 8 이어폰 사용
            3, // 9 야간 생활
            2, // 10 갈등 해결
            1, // 11 벌레
            3,  // 12 코골이
            12, // 13 흡연 — 유무가 갈리면 크게 벌어지도록 가중치를 확 높임
            2, // 14 음주
            2, // 15 음주 후 행동
            1, // 16 야식
            2, // 17 실내 취식
            3, // 18 청소 방식
            2, // 19 월 생활비
            2  // 20 방 크기
    };

    // 흡연은 "얼마나 피우냐"의 정도가 아니라 "피우냐 / 아예 안 피우냐"의 범주 문제다.
    // 하드 캡 대신 위 WEIGHTS의 높은 가중치로 자연스럽게 점수를 크게 끌어내린다.
    private static final int SMOKING_QUESTION_ID = 13;
    private static final int SMOKER_MAX_ANSWER = 1; // 1 흡연, 2 비흡연

    /**
     * @param a 내 답변 목록 (각 원소 1~5)
     * @param b 상대 답변 목록 (각 원소 1~5)
     * @return 0~100 호환도 점수. 비교할 답변이 없으면 0.
     */
    public int score(List<Integer> a, List<Integer> b) {
        int count = Math.min(a.size(), b.size());
        if (count == 0) {
            return 0;
        }

        double weightedPenalty = 0.0;
        double totalWeight = 0.0;

        for (int i = 0; i < count; i++) {
            int questionId = i + 1;
            int weight = weightFor(questionId);

            int diff;
            if (questionId == SMOKING_QUESTION_ID) {
                // 흡연 정도(1~4)의 차이는 무시하고, 흡연자/비흡연자 경계만 본다.
                boolean aSmokes = a.get(i) <= SMOKER_MAX_ANSWER;
                boolean bSmokes = b.get(i) <= SMOKER_MAX_ANSWER;
                diff = aSmokes == bSmokes ? 0 : MAX_DIFF;
            } else {
                diff = Math.abs(a.get(i) - b.get(i));
            }

            weightedPenalty += weight * ((double) diff / MAX_DIFF);
            totalWeight += weight;
        }

        if (totalWeight == 0) {
            return 0;
        }

        double ratio = 1.0 - (weightedPenalty / totalWeight);
        return (int) Math.round(ratio * 100);
    }

    private int weightFor(int questionId) {
        if (questionId >= 0 && questionId < WEIGHTS.length) {
            return WEIGHTS[questionId];
        }
        return 1; // 알 수 없는 문항은 기본 가중치
    }
}
