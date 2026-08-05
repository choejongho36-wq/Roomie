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
    void smokingQuestionNeverAffectsScoreAnymore() {
        // 흡연(12번)은 이제 "허용도" 문항이라 답변끼리 비교해 채점하지 않는다.
        // 실제 흡연 여부 기반 필터링은 CompatibilityService가 담당하므로,
        // 여기서는 답이 무엇이든 점수에 전혀 영향을 주면 안 된다.
        List<Integer> a = idealBaseA();
        a.set(11, 1);

        List<Integer> sameAnswer = idealBaseB();
        sameAnswer.set(11, 1);

        List<Integer> differentAnswer = idealBaseB();
        differentAnswer.set(11, 4);

        assertEquals(100, calculator.score(a, sameAnswer));
        assertEquals(100, calculator.score(a, differentAnswer),
                "흡연 허용도 답변이 달라도 채점에는 영향이 없어야 함");
    }

    @Test
    void smokingSeverityRanksNonSmokerBelowEveryTypeOfSmoker() {
        assertEquals(0, calculator.smokingSeverity("NON_SMOKER", null), "비흡연자는 항상 심각도 0");
        assertEquals(1, calculator.smokingSeverity("SMOKER", "LIQUID"), "액상형이 흡연자 중 가장 낮은 심각도");
        assertEquals(2, calculator.smokingSeverity("SMOKER", "HEATED"));
        assertEquals(3, calculator.smokingSeverity("SMOKER", "CIGARETTE"), "연초가 가장 높은 심각도");
        assertEquals(3, calculator.smokingSeverity("SMOKER", null), "흡연자인데 종류를 모르면 가장 엄격하게 취급");
    }

    @Test
    void maxAcceptedSmokingSeverityMatchesToleranceAnswerOrder() {
        assertEquals(3, calculator.maxAcceptedSmokingSeverity(1), "연초도 괜찮으면 전부 허용");
        assertEquals(2, calculator.maxAcceptedSmokingSeverity(2), "궐련형까지 허용이면 연초만 제외");
        assertEquals(1, calculator.maxAcceptedSmokingSeverity(3), "액상형까지 허용이면 궐련형·연초 제외");
        assertEquals(0, calculator.maxAcceptedSmokingSeverity(4), "흡연자가 싫으면 비흡연자만 허용");
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
    void penaltySpreadExponentPenalizesLargerDifferencesDisproportionatelyMore() {
        // 모든 일반 문항(화장실/벌레/흡연 제외)에 같은 크기의 차이를 줘서, 지수 보정 효과가
        // 점수에 뚜렷하게 드러나게 한다.
        List<Integer> base = idealBaseA();

        List<Integer> diffOneEverywhere = idealBaseB();
        List<Integer> diffTwoEverywhere = idealBaseB();
        for (int i = 0; i < 20; i++) {
            if (i == 1 || i == 11 || i == 16) continue; // 화장실/흡연/벌레는 특수 로직이라 제외
            diffOneEverywhere.set(i, base.get(i) + 1);
            diffTwoEverywhere.set(i, base.get(i) + 2);
        }

        int diffOneScore = calculator.score(base, diffOneEverywhere);
        int diffTwoScore = calculator.score(base, diffTwoEverywhere);

        assertTrue(diffOneScore > diffTwoScore, "차이가 작을수록 점수가 더 높아야 함");
        // 선형이면 diff=2가 diff=1보다 정확히 2배 깎여야 하지만(100-diffOneScore)*2,
        // 지수(1.5) 보정이 들어가면 그보다 더 크게 깎여야 한다.
        int linearDrop = (100 - diffOneScore) * 2;
        int actualDrop = 100 - diffTwoScore;
        assertTrue(actualDrop > linearDrop, "지수 보정이 적용되면 diff=2의 감점이 선형 2배보다 더 커야 함");
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
    void weightLevelDeductsPointsDirectlyInsteadOfBeingDilutedByAverage() {
        // 청결(5번)에서 완전히 어긋난 상황을 낮음/높음으로 각각 설정했을 때, 가중 평균 방식이었던
        // 예전엔 문항 하나의 가중치를 아무리 바꿔도 최대 4~5점밖에 안 움직였다. 지금은 가중치 단계별로
        // 정해진 점수를 직접 빼는 방식이라 두 자릿수 차이가 나야 한다.
        List<Integer> a = idealBaseA();
        a.set(4, 1);
        List<Integer> b = idealBaseB();
        b.set(4, 5); // 청결 완전 불일치 (diff=4)

        int lowWeightScore = calculator.score(a, b, Map.of(5, 1)); // 낮음
        int highWeightScore = calculator.score(a, b, Map.of(5, 3)); // 높음

        assertEquals(98, lowWeightScore, "낮음이면 완전히 어긋나도 최대 2점만 깎여야 함");
        assertEquals(85, highWeightScore, "높음이면 완전히 어긋났을 때 15점 깎여야 함");
        assertTrue(lowWeightScore - highWeightScore >= 10,
                "가중치 차이가 두 자릿수 점수 차이로 체감돼야 함 (예전 가중 평균 방식은 최대 4~5점 차이였음)");
    }

    @Test
    void customWeightFallsBackToDefaultForUnspecifiedQuestions() {
        List<Integer> a = idealBaseA();
        List<Integer> b = idealBaseB();

        // 취침 시간만 커스텀으로 지정해도 나머지 문항(화장실/벌레 포함)은 기본 로직 그대로 적용돼 만점 유지.
        assertEquals(100, calculator.score(a, b, Map.of(1, 2)));
    }

    @Test
    void bugsPenalizedOnlyWhenNeitherCanHandleIt() {
        List<Integer> handlesAlone = idealBaseA();
        handlesAlone.set(16, 1); // 바로 잡음

        List<Integer> alsoHandlesAlone = idealBaseB();
        alsoHandlesAlone.set(16, 1); // 바로 잡음 (둘 다 처리 가능)

        List<Integer> cannotHandle = idealBaseB();
        cannotHandle.set(16, 5); // 혼자 처리 못함 (한쪽만 처리 가능, 반대 성향)

        List<Integer> partnerCannotHandleEither = idealBaseA();
        partnerCannotHandleEither.set(16, 4); // 부탁하는 편 (둘 다 사실상 처리 못함)
        List<Integer> otherCannotHandle = idealBaseB();
        otherCannotHandle.set(16, 5); // 혼자 처리 못함

        int bothCapableScore = calculator.score(handlesAlone, alsoHandlesAlone);
        int oneCapableScore = calculator.score(handlesAlone, cannotHandle);
        int neitherCapableScore = calculator.score(partnerCannotHandleEither, otherCannotHandle);

        assertEquals(100, bothCapableScore, "둘 다 처리 가능하면 페널티가 없어야 함");
        assertEquals(100, oneCapableScore, "한 명이라도 처리 가능하면 성향이 반대여도 페널티가 없어야 함");
        assertTrue(neitherCapableScore < bothCapableScore, "둘 다 처리 못하면 그때만 페널티가 있어야 함");
    }
}
