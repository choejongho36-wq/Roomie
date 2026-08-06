package com.example.backend.controller;

import com.example.backend.domain.SurveyResult;
import com.example.backend.domain.User;
import com.example.backend.dto.SurveyAnswerUpdateRequest;
import com.example.backend.dto.SurveyResultRequest;
import com.example.backend.dto.SurveyResultResponse;
import com.example.backend.dto.SurveySummaryResponse;
import com.example.backend.repository.SurveyResultRepository;
import com.example.backend.repository.UserRepository;
import com.example.backend.service.SurveySummaryService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import tools.jackson.databind.ObjectMapper;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

@RestController
@RequestMapping("/api/surveys")
@RequiredArgsConstructor
public class SurveyController {

    private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();

    private final SurveyResultRepository surveyResultRepository;
    private final UserRepository userRepository;
    private final SurveySummaryService surveySummaryService;

    @PostMapping
    @Transactional
    public SurveyResultResponse submit(Authentication authentication, @RequestBody SurveyResultRequest request) {
        if (request.answers() == null || request.answers().isEmpty()) {
            throw new IllegalArgumentException("설문 응답이 비어있습니다.");
        }
        User user = findUser(authentication);
        String answersJson = toJson(request.answers());
        surveyResultRepository.deleteByUserId(user.getUserId());
        SurveyResult saved = surveyResultRepository.save(new SurveyResult(user.getUserId(), answersJson));
        return toResponse(saved);
    }

    @GetMapping("/me")
    public List<SurveyResultResponse> mySurveys(Authentication authentication) {
        User user = findUser(authentication);
        return surveyResultRepository.findByUserIdOrderByCompletedAtDesc(user.getUserId())
                .stream().map(this::toResponse).toList();
    }

    // 설문 전체를 다시 하지 않고, 문항 하나의 답만 바꾸고 싶을 때 쓰는 엔드포인트.
    // (예: 내 활동 > 설문 기록 페이지에서 카드 하나만 "다시 고르기")
    @PatchMapping("/me/answers/{index}")
    @Transactional
    public SurveyResultResponse updateAnswer(
            Authentication authentication,
            @PathVariable int index,
            @RequestBody SurveyAnswerUpdateRequest request
    ) {
        if (request.score() == null) {
            throw new IllegalArgumentException("선택한 답이 없습니다.");
        }
        User user = findUser(authentication);
        List<SurveyResult> surveys = surveyResultRepository.findByUserIdOrderByCompletedAtDesc(user.getUserId());
        if (surveys.isEmpty()) {
            throw new IllegalArgumentException("완료한 설문이 없습니다.");
        }
        SurveyResult latest = surveys.get(0);
        List<Integer> answers = new ArrayList<>(parseAnswers(latest.getAnswers()));
        if (index < 0 || index >= answers.size()) {
            throw new IllegalArgumentException("잘못된 문항 번호입니다.");
        }
        answers.set(index, request.score());
        latest.setAnswers(toJson(answers));
        SurveyResult saved = surveyResultRepository.save(latest);
        return toResponse(saved);
    }

    @GetMapping("/me/summary")
    public SurveySummaryResponse mySurveySummary(Authentication authentication) {
        User user = findUser(authentication);
        List<SurveyResult> surveys = surveyResultRepository.findByUserIdOrderByCompletedAtDesc(user.getUserId());
        if (surveys.isEmpty()) {
            return new SurveySummaryResponse("설문을 완료하면 AI가 생활 성향을 한 줄로 요약해드려요.");
        }
        return new SurveySummaryResponse(surveySummaryService.summarize(surveys.get(0)));
    }

    private User findUser(Authentication authentication) {
    if (authentication == null) {
        throw new IllegalArgumentException("로그인이 필요합니다.");
    }
    return userRepository.findByLoginId(authentication.getName())
            .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));
}

    private SurveyResultResponse toResponse(SurveyResult r) {
        return new SurveyResultResponse(r.getSurveyResultId(), parseAnswers(r.getAnswers()), r.getCompletedAt());
    }

    private static List<Integer> parseAnswers(String answersJson) {
        String trimmed = answersJson.trim();
        if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
            trimmed = trimmed.substring(1, trimmed.length() - 1);
        }
        return trimmed.isBlank() ? List.of() : Arrays.stream(trimmed.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .map(Integer::parseInt)
                .toList();
    }

    private static String toJson(Object value) {
        try {
            return OBJECT_MAPPER.writeValueAsString(value);
        } catch (Exception e) {
            throw new IllegalStateException("JSON 변환에 실패했습니다.", e);
        }
    }
}
