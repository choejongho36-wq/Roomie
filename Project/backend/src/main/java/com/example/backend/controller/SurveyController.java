package com.example.backend.controller;

import com.example.backend.domain.SurveyResult;
import com.example.backend.domain.User;
import com.example.backend.dto.SurveyResultRequest;
import com.example.backend.dto.SurveyResultResponse;
import com.example.backend.repository.SurveyResultRepository;
import com.example.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/surveys")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:5174")
public class SurveyController {

    private final SurveyResultRepository surveyResultRepository;
    private final UserRepository userRepository;

    @PostMapping
    public SurveyResultResponse submit(Authentication authentication, @RequestBody SurveyResultRequest request) {
        if (request.answers() == null || request.answers().isEmpty()) {
            throw new IllegalArgumentException("설문 응답이 비어있습니다.");
        }
        User user = findUser(authentication);
        String answersCsv = request.answers().stream().map(String::valueOf).collect(Collectors.joining(","));
        int total = request.answers().stream().mapToInt(Integer::intValue).sum();
        SurveyResult saved = surveyResultRepository.save(new SurveyResult(user.getUserId(), answersCsv, total));
        return toResponse(saved);
    }

    @GetMapping("/me")
    public List<SurveyResultResponse> mySurveys(Authentication authentication) {
        User user = findUser(authentication);
        return surveyResultRepository.findByUserIdOrderByCompletedAtDesc(user.getUserId())
                .stream().map(this::toResponse).toList();
    }

    private User findUser(Authentication authentication) {
        return userRepository.findByLoginId(authentication.getName())
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));
    }

    private SurveyResultResponse toResponse(SurveyResult r) {
        List<Integer> answers = Arrays.stream(r.getAnswers().split(","))
                .map(Integer::parseInt)
                .toList();
        return new SurveyResultResponse(r.getSurveyResultId(), answers, r.getTotalScore(), r.getCompletedAt());
    }
}
