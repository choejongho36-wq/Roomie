package com.example.backend.service;

import com.example.backend.domain.SurveyResult;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import tools.jackson.databind.ObjectMapper;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Duration;
import java.util.Arrays;
import java.util.List;
import java.util.Map;

@Service
public class SurveySummaryService {

    private static final URI GROQ_CHAT_COMPLETIONS_URI = URI.create("https://api.groq.com/openai/v1/chat/completions");
    private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();
    private static final List<SurveyQuestionPrompt> QUESTIONS = List.of(
            new SurveyQuestionPrompt("청결", List.of("물건을 사용한 뒤 거의 정리하지 않는다.", "방이 자주 어질러지며 하루에 한 번 정도 정리한다.", "어느 정도 정리하지만 완벽하게 유지하지는 않는다.", "사용한 물건은 바로 정리하는 편이다.", "항상 완벽하게 정리된 상태를 유지한다.")),
            new SurveyQuestionPrompt("취침 시간", List.of("새벽 3시 이후", "새벽 1~3시", "밤 11시~1시", "밤 10~11시", "밤 10시 이전")),
            new SurveyQuestionPrompt("요리", List.of("거의 매일 요리한다.", "주 3~5회 정도 요리한다.", "주 1~2회 정도 요리한다.", "한 달에 몇 번 정도만 요리한다.", "거의 요리하지 않는다.")),
            new SurveyQuestionPrompt("전화 통화", List.of("거의 매일 오래 통화한다.", "자주 통화한다.", "가끔 통화한다.", "필요한 경우에만 짧게 통화한다.", "거의 통화하지 않는다.")),
            new SurveyQuestionPrompt("생활 소음", List.of("웬만한 소음은 거의 신경 쓰지 않는다.", "큰 소음만 신경 쓰인다.", "보통 수준이다.", "작은 소음도 신경 쓰이는 편이다.", "아주 작은 소음도 잠이나 생활에 영향을 준다.")),
            new SurveyQuestionPrompt("공용 비품", List.of("대부분 함께 구매하고 함께 사용한다.", "가능한 함께 사용하는 편이다.", "상황에 따라 다르다.", "웬만하면 따로 구매해서 사용한다.", "모든 물건을 개인용으로 사용하는 것을 선호한다.")),
            new SurveyQuestionPrompt("친구 초대", List.of("거의 매주 초대한다.", "한 달에 2~3번 정도 초대한다.", "한 달에 1번 정도 초대한다.", "거의 초대하지 않는다.", "집에는 다른 사람을 초대하지 않는다.")),
            new SurveyQuestionPrompt("이어폰 사용", List.of("대부분 스피커를 사용한다.", "스피커를 자주 사용한다.", "상황에 따라 이어폰과 스피커를 모두 사용한다.", "대부분 이어폰을 사용한다.", "항상 이어폰을 사용한다.")),
            new SurveyQuestionPrompt("야간 생활", List.of("평소와 똑같이 생활한다.", "조금만 조심한다.", "상황에 따라 다르다.", "최대한 조용히 생활한다.", "소음이 발생하는 행동은 하지 않는다.")),
            new SurveyQuestionPrompt("갈등 해결", List.of("바로 이야기하며 해결하려고 한다.", "하루 이내에 대화를 시도한다.", "상황을 보고 판단한다.", "시간이 지난 후 이야기한다.", "먼저 이야기하지 않는 편이다.")),
            new SurveyQuestionPrompt("벌레", List.of("직접 바로 잡는다.", "대부분 직접 처리한다.", "상황에 따라 다르다.", "다른 사람에게 부탁하는 편이다.", "벌레를 전혀 처리하지 못한다.")),
            new SurveyQuestionPrompt("코골이", List.of("거의 매일 심하게 곤다.", "자주 곤다.", "가끔 곤다.", "거의 골지 않는다.", "전혀 골지 않는다.")),
            new SurveyQuestionPrompt("흡연", List.of("실내 흡연을 한다.", "흡연을 자주 한다.", "가끔 흡연한다.", "전자담배만 사용한다.", "흡연하지 않는다.")),
            new SurveyQuestionPrompt("음주", List.of("일주일에 4회 이상", "일주일에 2~3회", "일주일에 1회", "한 달에 1~2회", "거의 마시지 않는다.")),
            new SurveyQuestionPrompt("음주 후 행동", List.of("매우 시끄러워진다.", "다소 시끄러워지는 편이다.", "평소와 비슷하다.", "조용한 편이다.", "거의 술을 마시지 않는다.")),
            new SurveyQuestionPrompt("야식", List.of("거의 매일 먹는다.", "주 3~5회", "주 1~2회", "한 달에 몇 번", "거의 먹지 않는다.")),
            new SurveyQuestionPrompt("실내 취식", List.of("거의 모든 식사를 방에서 한다.", "자주 방에서 먹는다.", "가끔 먹는다.", "거의 먹지 않는다.", "방에서는 절대 먹지 않는다.")),
            new SurveyQuestionPrompt("실내 온도", List.of("매우 따뜻한 환경", "따뜻한 편", "보통", "시원한 편", "매우 시원한 환경")),
            new SurveyQuestionPrompt("월 생활비", List.of("100만 원 이상", "70~100만 원", "50~70만 원", "30~50만 원", "30만 원 미만")),
            new SurveyQuestionPrompt("방 크기", List.of("12평 이상", "10~12평", "7~10평", "5~7평", "5평 이하도 괜찮다."))
    );

    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(8))
            .build();

    @Value("${groq.api-key:}")
    private String groqApiKey;

    @Value("${groq.model:openai/gpt-oss-20b}")
    private String groqModel;

    public String summarize(SurveyResult surveyResult) {
        String apiKey = resolveGroqApiKey();
        if (apiKey.isBlank()) {
            throw new IllegalStateException("Groq API 키가 설정되지 않았습니다.");
        }

        List<Integer> answers = parseAnswers(surveyResult.getAnswers());
        if (answers.isEmpty()) {
            return "설문 답변이 아직 충분하지 않아 요약을 만들 수 없어요.";
        }

        try {
            HttpRequest request = HttpRequest.newBuilder(GROQ_CHAT_COMPLETIONS_URI)
                    .timeout(Duration.ofSeconds(15))
                    .header("Authorization", "Bearer " + apiKey)
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(toJson(buildRequestBody(answers, resolveGroqModel()))))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                throw new IllegalStateException("Groq API 호출에 실패했습니다.");
            }
            return extractSummary(response.body());
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new IllegalStateException("Groq API 호출이 중단되었습니다.", e);
        } catch (Exception e) {
            throw new IllegalStateException("설문 요약 생성에 실패했습니다.", e);
        }
    }

    private String resolveGroqApiKey() {
        if (groqApiKey != null && !groqApiKey.isBlank()) {
            return stripWrappingQuotes(groqApiKey);
        }
        return readDotEnvValue("GROQ_API_KEY");
    }

    private String resolveGroqModel() {
        String envModel = System.getenv("GROQ_MODEL");
        if (envModel != null && !envModel.isBlank()) {
            return stripWrappingQuotes(groqModel);
        }

        String dotEnvModel = readDotEnvValue("GROQ_MODEL");
        if (!dotEnvModel.isBlank()) {
            return dotEnvModel;
        }

        if (groqModel == null || groqModel.isBlank()) {
            return "openai/gpt-oss-20b";
        }
        return stripWrappingQuotes(groqModel);
    }

    private Map<String, Object> buildRequestBody(List<Integer> answers, String model) {
        return Map.of(
                "model", model,
                "temperature", 0.2,
                "max_tokens", 90,
                "messages", List.of(
                        Map.of(
                                "role", "system",
                                "content", "너는 룸메이트 매칭 앱의 설문 요약가입니다. 개인정보를 추측하지 말고, 한국어 한 문장으로만 답하세요. 결과는 45자 이내로 자연스럽고 다정하게 작성하세요."
                        ),
                        Map.of(
                                "role", "user",
                                "content", "아래 설문 답변을 바탕으로 룸메이트 생활 성향을 한 문장으로 요약해주세요. 접두사 없이 요약 문장만 출력하세요.\n\n" + buildAnswerPrompt(answers)
                        )
                )
        );
    }

    private String readDotEnvValue(String key) {
        List<Path> candidates = List.of(
                Path.of(".env"),
                Path.of("backend/.env"),
                Path.of("Project/backend/.env")
        );

        for (Path candidate : candidates) {
            if (!Files.isRegularFile(candidate)) {
                continue;
            }

            try {
                for (String line : Files.readAllLines(candidate)) {
                    String trimmed = line.trim();
                    if (trimmed.isEmpty() || trimmed.startsWith("#")) {
                        continue;
                    }

                    if (trimmed.startsWith("export ")) {
                        trimmed = trimmed.substring("export ".length()).trim();
                    }

                    int separatorIndex = trimmed.indexOf('=');
                    if (separatorIndex <= 0) {
                        continue;
                    }

                    String envKey = trimmed.substring(0, separatorIndex).trim();
                    if (!key.equals(envKey)) {
                        continue;
                    }

                    return stripWrappingQuotes(trimmed.substring(separatorIndex + 1).trim());
                }
            } catch (Exception ignored) {
                return "";
            }
        }

        return "";
    }

    private String stripWrappingQuotes(String value) {
        if (value == null) {
            return "";
        }
        String trimmed = value.trim();
        if (trimmed.length() >= 2) {
            char first = trimmed.charAt(0);
            char last = trimmed.charAt(trimmed.length() - 1);
            if ((first == '"' && last == '"') || (first == '\'' && last == '\'')) {
                return trimmed.substring(1, trimmed.length() - 1);
            }
        }
        return trimmed;
    }

    private String buildAnswerPrompt(List<Integer> answers) {
        StringBuilder builder = new StringBuilder();
        int count = Math.min(answers.size(), QUESTIONS.size());
        for (int i = 0; i < count; i++) {
            SurveyQuestionPrompt question = QUESTIONS.get(i);
            int score = answers.get(i);
            String answer = score >= 1 && score <= question.options().size()
                    ? question.options().get(score - 1)
                    : score + "점";
            builder.append("- ")
                    .append(question.category())
                    .append(": ")
                    .append(answer)
                    .append("\n");
        }
        return builder.toString();
    }

    @SuppressWarnings("unchecked")
    private String extractSummary(String responseBody) throws Exception {
        Map<String, Object> root = OBJECT_MAPPER.readValue(responseBody, Map.class);
        Object choicesObject = root.get("choices");
        if (!(choicesObject instanceof List<?> choices) || choices.isEmpty()) {
            throw new IllegalStateException("Groq 응답에 choices가 없습니다.");
        }

        Object firstChoice = choices.get(0);
        if (!(firstChoice instanceof Map<?, ?> choice)) {
            throw new IllegalStateException("Groq 응답 형식이 올바르지 않습니다.");
        }

        Object messageObject = choice.get("message");
        if (!(messageObject instanceof Map<?, ?> message)) {
            throw new IllegalStateException("Groq 응답에 message가 없습니다.");
        }

        Object contentObject = message.get("content");
        if (!(contentObject instanceof String content) || content.isBlank()) {
            throw new IllegalStateException("Groq 응답에 content가 없습니다.");
        }

        return content.trim().replaceAll("\\s+", " ");
    }

    private List<Integer> parseAnswers(String answersJson) {
        if (answersJson == null || answersJson.isBlank()) {
            return List.of();
        }
        String trimmed = answersJson.trim();
        if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
            trimmed = trimmed.substring(1, trimmed.length() - 1);
        }
        if (trimmed.isBlank()) {
            return List.of();
        }
        return Arrays.stream(trimmed.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .map(Integer::parseInt)
                .toList();
    }

    private static String toJson(Object value) throws Exception {
        return OBJECT_MAPPER.writeValueAsString(value);
    }

    private record SurveyQuestionPrompt(String category, List<String> options) {}
}
