package com.example.backend.config;

import com.example.backend.domain.SurveyResult;
import com.example.backend.domain.User;
import com.example.backend.repository.SurveyResultRepository;
import com.example.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;
import tools.jackson.databind.ObjectMapper;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@Configuration
@RequiredArgsConstructor
public class DataInitializer {

    private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();

    private final UserRepository userRepository;
    private final SurveyResultRepository surveyResultRepository;
    private final PasswordEncoder passwordEncoder;

    @Bean
    public CommandLineRunner seedDummyData() {
        return args -> {
            var dummyUsers = List.of(
                    Map.of(
                            "email", "dummy1@roomie.test",
                            "password", "DummyPass1!",
                            "nickname", "한결",
                            "gender", "M",
                            "birthDate", LocalDate.of(1996, 3, 12),
                            "tags", "책읽기,요리,야외활동",
                            "bio", "조용하고 깔끔한 룸메이트를 찾고 있어요.",
                            "answers", List.of(5, 4, 4, 3, 2, 5, 3, 4, 2, 1, 3, 4, 5, 4, 3, 2, 4, 3, 4, 2)
                    ),
                    Map.of(
                            "email", "dummy2@roomie.test",
                            "password", "DummyPass2!",
                            "nickname", "지은",
                            "gender", "F",
                            "birthDate", LocalDate.of(1998, 7, 20),
                            "tags", "카페,영화,반려동물",
                            "bio", "활동적이고 밝은 성격이에요.",
                            "answers", List.of(3, 2, 5, 4, 5, 2, 4, 3, 5, 4, 3, 4, 2, 5, 4, 3, 5, 4, 5, 3)
                    ),
                    Map.of(
                            "email", "dummy3@roomie.test",
                            "password", "DummyPass3!",
                            "nickname", "민수",
                            "gender", "M",
                            "birthDate", LocalDate.of(1994, 11, 5),
                            "tags", "운동,게임,음악",
                            "bio", "규칙적이고 책임감 있는 룸메이트입니다.",
                            "answers", List.of(2, 2, 3, 3, 4, 1, 2, 3, 4, 2, 2, 3, 2, 4, 3, 2, 2, 3, 3, 2)
                    ),
                    Map.of(
                            "email", "dummy4@roomie.test",
                            "password", "DummyPass4!",
                            "nickname", "수빈",
                            "gender", "F",
                            "birthDate", LocalDate.of(2000, 1, 28),
                            "tags", "여행,요가,디저트",
                            "bio", "여유롭고 배려심 많은 사람을 좋아해요.",
                            "answers", List.of(4, 5, 3, 4, 4, 3, 5, 4, 3, 5, 4, 5, 3, 4, 4, 5, 4, 4, 3, 5)
                    ),
                    Map.of(
                            "email", "dummy5@roomie.test",
                            "password", "DummyPass5!",
                            "nickname", "다현",
                            "gender", "F",
                            "birthDate", LocalDate.of(1999, 5, 16),
                            "tags", "영화감상,산책,요리",
                            "bio", "평온한 환경에서 함께 지내는 걸 선호해요.",
                            "answers", List.of(1, 1, 2, 2, 3, 1, 2, 1, 2, 1, 1, 2, 1, 2, 3, 1, 2, 1, 2, 1)
                    ),
                    Map.of(
                            "email", "dummy6@roomie.test",
                            "password", "DummyPass6!",
                            "nickname", "서윤",
                            "gender", "F",
                            "birthDate", LocalDate.of(1997, 9, 8),
                            "tags", "독서,카페,요리",
                            "bio", "차분한 분위기에서 서로를 배려하는 룸메이트를 원해요.",
                            "answers", List.of(4, 4, 4, 3, 3, 4, 4, 3, 4, 3, 4, 4, 3, 4, 3, 4, 3, 4, 3, 4)
                    ),
                    Map.of(
                            "email", "dummy7@roomie.test",
                            "password", "DummyPass7!",
                            "nickname", "민지",
                            "gender", "F",
                            "birthDate", LocalDate.of(1995, 12, 2),
                            "tags", "산책,체험,반려동물",
                            "bio", "편안하고 서로 배려하는 룸메이트를 찾고 있어요.",
                            "answers", List.of(5, 4, 4, 4, 4, 5, 3, 4, 4, 5, 4, 3, 4, 4, 5, 3, 4, 4, 3, 5)
                    )
            );

            for (var dummy : dummyUsers) {
                String email = (String) dummy.get("email");
                @SuppressWarnings("unchecked")
                List<Integer> answers = (List<Integer>) dummy.get("answers");
                if (userRepository.existsByEmail(email)) {
                    User existingUser = userRepository.findByEmail(email).orElseThrow();
                    normalizeExistingUserSurveyResults(existingUser.getUserId(), answers);
                    continue;
                }

                User user = new User(
                        email,
                        passwordEncoder.encode((String) dummy.get("password")),
                        (String) dummy.get("nickname"),
                        (String) dummy.get("gender"),
                        (LocalDate) dummy.get("birthDate")
                );
                user.updateTags((String) dummy.get("tags"));
                user.updateBio((String) dummy.get("bio"));
                User savedUser = userRepository.save(user);

                List<Double> vector = answers.stream()
                        .map(answer -> (answer - 1) / 4.0)
                        .toList();

                String answersJson = OBJECT_MAPPER.writeValueAsString(answers);
                String vectorJson = OBJECT_MAPPER.writeValueAsString(vector);
                SurveyResult surveyResult = new SurveyResult(savedUser.getUserId(), answersJson, vectorJson);
                surveyResultRepository.save(surveyResult);
            }

            normalizeExistingSurveyResults();
        };
    }

    private void normalizeExistingSurveyResults() {
        for (SurveyResult surveyResult : surveyResultRepository.findAll()) {
            boolean updated = false;
            String normalizedAnswers = normalizeJson(surveyResult.getAnswers());
            if (!normalizedAnswers.equals(surveyResult.getAnswers())) {
                surveyResult.setAnswers(normalizedAnswers);
                updated = true;
            }

            String normalizedVector = normalizeJson(surveyResult.getVector());
            if (!normalizedVector.equals(surveyResult.getVector())) {
                surveyResult.setVector(normalizedVector);
                updated = true;
            }

            if (updated) {
                surveyResultRepository.save(surveyResult);
            }
        }
    }

    private void normalizeExistingUserSurveyResults(Long userId, List<Integer> answers) {
        List<SurveyResult> existing = surveyResultRepository.findByUserIdOrderByCompletedAtDesc(userId);
        if (existing.isEmpty()) {
            return;
        }
        SurveyResult latest = existing.get(0);
        String normalizedAnswers = OBJECT_MAPPER.writeValueAsString(answers);
        if (!normalizedAnswers.equals(latest.getAnswers())) {
            latest.setAnswers(normalizedAnswers);
            latest.setVector(OBJECT_MAPPER.writeValueAsString(
                    answers.stream().map(answer -> (answer - 1) / 4.0).toList()
            ));
            surveyResultRepository.save(latest);
        }
    }

    private static String normalizeJson(String value) {
        if (value == null || value.isBlank()) {
            return value;
        }
        try {
            Object parsed = OBJECT_MAPPER.readValue(value, Object.class);
            return OBJECT_MAPPER.writeValueAsString(parsed);
        } catch (Exception e) {
            return value;
        }
    }
}
