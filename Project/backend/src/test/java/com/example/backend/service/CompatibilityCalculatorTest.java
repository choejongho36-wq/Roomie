package com.example.backend.service;

import org.junit.jupiter.api.Test;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class CompatibilityCalculatorTest {

    private final CompatibilityCalculator calculator = new CompatibilityCalculator();

    // 화장실(2번)과 벌레(17번)는 "같으면 나쁨"인 반전 로직이라, 나머지 18문항만 3으로 맞추고
    // 이 둘은 애초에 "이상적인" 궁합(화장실 다른 시간대, 벌레 반대 성향)으로 깔아서 baseline을 만점으로 만든다.
    private List<Integer> idealBaseA() {
        List<Integer> answers = new ArrayList<>(Collections.nCopies(20, 3));
        answers.set(1, 1); // 화장실: 6시 이전
        answers.set(16, 1); // 벌레: 바로 잡음
        return answers;
    }

    private List<Integer> idealBaseB() {
        List<Integer> answers = new ArrayList<>(Collections.nCopies(20, 3));
        answers.set(1, 3); // 화장실: 7~8시 (A와 다른 시간대)
        answers.set(16, 5); // 벌레: 혼자 처리 못함 (A와 정반대)
        return answers;
    }

    @Test
    void idealAnswersAcrossQuirkyCategoriesScoreMax() {
        assertEquals(100, calculator.score(idealBaseA(), idealBaseB()));
    }

    @Test
    void smokingMismatchIsPenalizedRegardlessOfDegree() {
        List<Integer> a = idealBaseA();
        a.set(11, 2); // 비흡연

        List<Integer> smokerB = idealBaseB();
        smokerB.set(11, 1); // 흡연

        List<Integer> nonSmokerB = idealBaseB();
        nonSmokerB.set(11, 2); // 비흡연

        int mismatchScore = calculator.score(a, smokerB);
        int matchScore = calculator.score(a, nonSmokerB);

        assertTrue(mismatchScore < matchScore, "흡연 여부가 다르면 점수가 더 낮아야 함");
        assertEquals(100, matchScore, "흡연 여부가 같고 나머지가 이상적이면 만점");
    }

    @Test
    void bathroomSameSlotIsWorseThanAnyDifferentSlot() {
        List<Integer> base = idealBaseA();
        base.set(1, 1); // 6시 이전

        List<Integer> sameSlot = idealBaseB();
        sameSlot.set(1, 1); // 6시 이전 (base와 동일)

        List<Integer> oneSlotAway = idealBaseB();
        oneSlotAway.set(1, 2); // 6~7시

        List<Integer> threeSlotsAway = idealBaseB();
        threeSlotsAway.set(1, 5); // 신경 안 씀

        int sameScore = calculator.score(base, sameSlot);
        int oneAwayScore = calculator.score(base, oneSlotAway);
        int threeAwayScore = calculator.score(base, threeSlotsAway);

        assertTrue(sameScore < oneAwayScore, "같은 시간대면 다른 시간대보다 점수가 낮아야 함");
        assertEquals(oneAwayScore, threeAwayScore, "다르기만 하면 얼마나 다른지와 무관하게 점수가 같아야 함");
    }

    @Test
    void bathroomBothFlexibleHasNoPenaltyEvenThoughAnswersAreEqual() {
        List<Integer> a = idealBaseA();
        a.set(1, 5); // 신경 안 씀

        List<Integer> b = idealBaseB();
        b.set(1, 5); // 신경 안 씀 (a와 값은 같지만 "겹치는 고정 시간대"가 아님)

        assertEquals(100, calculator.score(a, b), "둘 다 신경 안 씀이면 답이 같아도 페널티가 없어야 함");
    }

    @Test
    void customWeightOverridesDefaultForThatQuestionOnly() {
        // 취침 시간(1번, 기본 가중치 3)에서만 차이를 주고, 나머지는 이상적으로 맞춘다.
        List<Integer> a = idealBaseA();
        a.set(0, 1);
        List<Integer> b = idealBaseB();
        b.set(0, 5); // 최대 차이(diff=4)

        int defaultWeightScore = calculator.score(a, b);
        int loweredWeightScore = calculator.score(a, b, Map.of(1, 1)); // 취침 시간 가중치를 최저로 낮춤
        int raisedWeightScore = calculator.score(a, b, Map.of(1, 3)); // 이미 기본값이 3이라 동일해야 함

        assertTrue(loweredWeightScore > defaultWeightScore, "가중치를 낮추면 그 문항의 불일치가 전체 점수에 덜 반영돼야 함");
        assertEquals(defaultWeightScore, raisedWeightScore, "기본값과 같은 커스텀 가중치는 점수에 변화가 없어야 함");
    }

    @Test
    void customWeightFallsBackToDefaultForUnspecifiedQuestions() {
        List<Integer> a = idealBaseA();
        List<Integer> b = idealBaseB();

        // 취침 시간만 커스텀으로 지정해도 나머지 문항(화장실/벌레 포함)은 기본 로직 그대로 적용돼 만점 유지.
        assertEquals(100, calculator.score(a, b, Map.of(1, 2)));
    }

    @Test
    void bugsOppositeAnswersScoreHigherThanSameAnswers() {
        List<Integer> handlesAlone = idealBaseA();
        handlesAlone.set(16, 1); // 바로 잡음

        List<Integer> alsoHandlesAlone = idealBaseB();
        alsoHandlesAlone.set(16, 1); // 바로 잡음 (동일 성향)

        List<Integer> cannotHandle = idealBaseB();
        cannotHandle.set(16, 5); // 혼자 처리 못함 (정반대 성향)

        int sameScore = calculator.score(handlesAlone, alsoHandlesAlone);
        int oppositeScore = calculator.score(handlesAlone, cannotHandle);

        assertTrue(oppositeScore > sameScore, "벌레 처리 성향은 반대일수록 궁합 점수가 높아야 함");
    }
}
