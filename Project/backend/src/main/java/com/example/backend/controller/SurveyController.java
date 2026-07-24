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
import tools.jackson.databind.ObjectMapper;

import java.util.Arrays;
import java.util.List;

@RestController
@RequestMapping("/api/surveys")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:5174")
public class SurveyController {

    private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();

    private final SurveyResultRepository surveyResultRepository;
    private final UserRepository userRepository;

    @PostMapping
    public SurveyResultResponse submit(Authentication authentication, @RequestBody SurveyResultRequest request) {
        if (request.answers() == null || request.answers().isEmpty()) {
            throw new IllegalArgumentException("설문 응답이 비어있습니다.");
        }
        User user = findUser(authentication);
        String answersJson = toJson(request.answers());
        List<Double> vector = request.answers().stream()
                .map(answer -> (answer - 1) / 4.0)
                .toList();
        String vectorJson = toJson(vector);
        SurveyResult saved = surveyResultRepository.save(new SurveyResult(user.getUserId(), answersJson, vectorJson));
        return toResponse(saved);
    }

    @GetMapping("/me")
    public List<SurveyResultResponse> mySurveys(Authentication authentication) {
        User user = findUser(authentication);
        return surveyResultRepository.findByUserIdOrderByCompletedAtDesc(user.getUserId())
                .stream().map(this::toResponse).toList();
    }

    private User findUser(Authentication authentication) {
        return userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));
    }

    private SurveyResultResponse toResponse(SurveyResult r) {
        String answersJson = r.getAnswers();
        String trimmed = answersJson.trim();
        if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
            trimmed = trimmed.substring(1, trimmed.length() - 1);
        }
        List<Integer> answers = trimmed.isBlank() ? List.of() : Arrays.stream(trimmed.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .map(Integer::parseInt)
                .toList();
        return new SurveyResultResponse(r.getSurveyResultId(), answers, r.getCompletedAt());
    }

    private static String toJson(Object value) {
        try {
            return OBJECT_MAPPER.writeValueAsString(value);
        } catch (Exception e) {
            throw new IllegalStateException("JSON 변환에 실패했습니다.", e);
        }
    }
}
