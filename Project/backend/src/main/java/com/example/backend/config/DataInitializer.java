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
                    Map.ofEntries(
                            Map.entry("loginId", "dummy1"),
                            Map.entry("email", "dummy1@roomie.test"),
                            Map.entry("password", "DummyPass1!"),
                            Map.entry("nickname", "한결"),
                            Map.entry("gender", "M"),
                            Map.entry("birthDate", LocalDate.of(1996, 3, 12)),
                            Map.entry("phone", "01000000001"),
                            Map.entry("job", "직장인"),
                            Map.entry("region", "대치동"),
                            Map.entry("tags", "책읽기,요리,야외활동"),
                            Map.entry("bio", "조용하고 깔끔한 룸메이트를 찾고 있어요."),
                            Map.entry("answers", List.of(5, 4, 4, 3, 2, 5, 3, 4, 2, 1, 3, 4, 5, 4, 3, 2, 4, 3, 4, 2))
                    ),
                    Map.ofEntries(
                            Map.entry("loginId", "dummy2"),
                            Map.entry("email", "dummy2@roomie.test"),
                            Map.entry("password", "DummyPass2!"),
                            Map.entry("nickname", "지은"),
                            Map.entry("gender", "F"),
                            Map.entry("birthDate", LocalDate.of(1998, 7, 20)),
                            Map.entry("phone", "01000000002"),
                            Map.entry("job", "직장인"),
                            Map.entry("region", "대치동"),
                            Map.entry("tags", "카페,영화,반려동물"),
                            Map.entry("bio", "활동적이고 밝은 성격이에요."),
                            Map.entry("answers", List.of(3, 2, 5, 4, 5, 2, 4, 3, 5, 4, 3, 4, 2, 5, 4, 3, 5, 4, 5, 3))
                    ),
                    Map.ofEntries(
                            Map.entry("loginId", "dummy3"),
                            Map.entry("email", "dummy3@roomie.test"),
                            Map.entry("password", "DummyPass3!"),
                            Map.entry("nickname", "민수"),
                            Map.entry("gender", "M"),
                            Map.entry("birthDate", LocalDate.of(1994, 11, 5)),
                            Map.entry("phone", "01000000003"),
                            Map.entry("job", "직장인"),
                            Map.entry("region", "대치동"),
                            Map.entry("tags", "운동,게임,음악"),
                            Map.entry("bio", "규칙적이고 책임감 있는 룸메이트입니다."),
                            Map.entry("answers", List.of(2, 2, 3, 3, 4, 1, 2, 3, 4, 2, 2, 3, 2, 4, 3, 2, 2, 3, 3, 2))
                    ),
                    Map.ofEntries(
                            Map.entry("loginId", "dummy4"),
                            Map.entry("email", "dummy4@roomie.test"),
                            Map.entry("password", "DummyPass4!"),
                            Map.entry("nickname", "수빈"),
                            Map.entry("gender", "F"),
                            Map.entry("birthDate", LocalDate.of(2000, 1, 28)),
                            Map.entry("phone", "01000000004"),
                            Map.entry("job", "직장인"),
                            Map.entry("region", "대치동"),
                            Map.entry("tags", "여행,요가,디저트"),
                            Map.entry("bio", "여유롭고 배려심 많은 사람을 좋아해요."),
                            Map.entry("answers", List.of(4, 5, 3, 4, 4, 3, 5, 4, 3, 5, 4, 5, 3, 4, 4, 5, 4, 4, 3, 5))
                    ),
                    Map.ofEntries(
                            Map.entry("loginId", "dummy5"),
                            Map.entry("email", "dummy5@roomie.test"),
                            Map.entry("password", "DummyPass5!"),
                            Map.entry("nickname", "다현"),
                            Map.entry("gender", "F"),
                            Map.entry("birthDate", LocalDate.of(1999, 5, 16)),
                            Map.entry("phone", "01000000005"),
                            Map.entry("job", "직장인"),
                            Map.entry("region", "대치동"),
                            Map.entry("tags", "영화감상,산책,요리"),
                            Map.entry("bio", "평온한 환경에서 함께 지내는 걸 선호해요."),
                            Map.entry("answers", List.of(1, 1, 2, 2, 3, 1, 2, 1, 2, 1, 1, 2, 1, 2, 3, 1, 2, 1, 2, 1))
                    ),
                    Map.ofEntries(
                            Map.entry("loginId", "dummy6"),
                            Map.entry("email", "dummy6@roomie.test"),
                            Map.entry("password", "DummyPass6!"),
                            Map.entry("nickname", "서윤"),
                            Map.entry("gender", "F"),
                            Map.entry("birthDate", LocalDate.of(1997, 9, 8)),
                            Map.entry("phone", "01000000006"),
                            Map.entry("job", "직장인"),
                            Map.entry("region", "대치동"),
                            Map.entry("tags", "독서,카페,요리"),
                            Map.entry("bio", "차분한 분위기에서 서로를 배려하는 룸메이트를 원해요."),
                            Map.entry("answers", List.of(4, 4, 4, 3, 3, 4, 4, 3, 4, 3, 4, 4, 3, 4, 3, 4, 3, 4, 3, 4))
                    ),
                    Map.ofEntries(
                            Map.entry("loginId", "dummy7"),
                            Map.entry("email", "dummy7@roomie.test"),
                            Map.entry("password", "DummyPass7!"),
                            Map.entry("nickname", "민지"),
                            Map.entry("gender", "F"),
                            Map.entry("birthDate", LocalDate.of(1995, 12, 2)),
                            Map.entry("phone", "01000000007"),
                            Map.entry("job", "직장인"),
                            Map.entry("region", "대치동"),
                            Map.entry("tags", "산책,체험,반려동물"),
                            Map.entry("bio", "편안하고 서로 배려하는 룸메이트를 찾고 있어요."),
                            Map.entry("answers", List.of(5, 4, 4, 4, 4, 5, 3, 4, 4, 5, 4, 3, 4, 4, 5, 3, 4, 4, 3, 5))
                    )
            );

            for (var dummy : dummyUsers) {
                String email = (String) dummy.get("email");
                @SuppressWarnings("unchecked")
                List<Integer> answers = (List<Integer>) dummy.get("answers");
                if (userRepository.existsByEmail(email)) {
                    User existingUser = userRepository.findByEmail(email).orElseThrow();
                    existingUser.updateRegionAndJob((String) dummy.get("region"), (String) dummy.get("job"));
                    userRepository.save(existingUser);
                    normalizeExistingUserSurveyResults(existingUser.getUserId(), answers);
                    continue;
                }

                User user = new User(
                        (String) dummy.get("loginId"),
                        email,
                        passwordEncoder.encode((String) dummy.get("password")),
                        (String) dummy.get("nickname"),
                        (String) dummy.get("gender"),
                        (LocalDate) dummy.get("birthDate"),
                        (String) dummy.get("phone"),
                        (String) dummy.get("region"),
                        (String) dummy.get("job")
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
