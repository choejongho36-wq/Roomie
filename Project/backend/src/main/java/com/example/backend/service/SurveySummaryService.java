package com.example.backend.service;

import com.example.backend.domain.SurveyResult;
import com.example.backend.dto.SurveyComparisonHighlightResponse;
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
import java.util.stream.Collectors;

@Service
public class SurveySummaryService {

    private static final String GEMINI_GENERATE_CONTENT_URI_TEMPLATE =
            "https://generativelanguage.googleapis.com/v1beta/models/%s:generateContent";
    private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();
    // 2026-07-31: 프론트 설문 문항이 주제별로 재배열되면서 순서/문구가 바뀜에 따라 함께 갱신.
    private static final List<SurveyQuestionPrompt> QUESTIONS = List.of(
            new SurveyQuestionPrompt("취침 시간", List.of("새벽 3시 이후", "새벽 1~3시", "밤 11시~1시", "밤 10~11시", "밤 10시 이전")),
            new SurveyQuestionPrompt("화장실 사용", List.of("6시 이전에 써.", "6~7시 사이에 써.", "7~8시 사이에 써.", "8~9시 사이에 써.", "9시 이후에 쓰거나 정해진 시간이 없어.")),
            new SurveyQuestionPrompt("코골이", List.of("심하게 골아.", "비교적 조용히 고는거같아.", "피곤할때 가끔 골아.", "골지 않아.", "나도 코를 고는지 안 고는지 몰라.")),
            new SurveyQuestionPrompt("야간 생활", List.of("평소와 똑같아.", "조금 조심해.", "상황에 따라 다른거 같아.", "최대한 조용히 행동하지.", "소음이 발생하는 행동자체를 안해.")),
            new SurveyQuestionPrompt("청결", List.of("거의 정리하지 않아.", "하루에 한 번 정도 정리하는 편이야.", "어느 정도 정리하지만 완벽하게 유지하려고는 않아.", "사용한 물건은 바로 정리하는 편이야.", "항상 완벽하게 정리된 상태야")),
            new SurveyQuestionPrompt("청소 방식", List.of("사람을 고용해서 청소해.", "정해진 당번표 없이 그때그때 필요할 때 치워.", "상황에 따라 다른게 좋아.", "어느 정도 정해진 기준(요일, 담당)이 있어야 해.", "명확한 당번표나 규칙을 정해서 지키는 게 좋아.")),
            new SurveyQuestionPrompt("생활 소음", List.of("거의 신경 쓰지 않는 편이야.", "큰 소음만 아니면 괜찮아.", "평범한거 같은데?", "작은 소음도 신경 쓰일때가 있어.", "아주 작은 소음도 예민해서 신경쓰여.")),
            new SurveyQuestionPrompt("전화 통화", List.of("거의 매일 통화해!", "주 3~5회 정도 통화해.", "주 1~2회 정도 통화해.", "필요한 경우에만 짧게 통화해.", "거의 통화하지 않아.")),
            new SurveyQuestionPrompt("이어폰 사용", List.of("블루투스 스피커로 빵빵하게 틀어놔.", "핸드폰 스피커를 틀어놔.", "상황에 따라 스피커나 이어폰을 모두 사용해.", "대부분 이어폰을 사용하거나 작게 틀어.", "항상 이어폰만 사용해.")),
            new SurveyQuestionPrompt("실내 취식", List.of("거의 모든 식사를 집에서 해.", "자주 집에서 먹어.", "가끔 먹어.", "거의 먹지 않아.", "집에서는 절대 먹지 않아.")),
            new SurveyQuestionPrompt("야식", List.of("거의 매일 먹어.", "주 3~5회 먹어.", "주 1~2회 먹어.", "한 달에 몇 번?", "거의 안 먹어.")),
            new SurveyQuestionPrompt("흡연", List.of("흡연해.", "흡연하지 않아.")),
            new SurveyQuestionPrompt("음주", List.of("일주일에 4회 이상", "일주일에 1~2회", "한 달에 1~2회", "가끔 마셔.", "마시지 않아.")),
            new SurveyQuestionPrompt("음주 후 행동", List.of("엄청 시끄러워져.", "평소보단 시끄러워져.", "평소와 비슷한듯?", "평소보다 조용해져.", "술을 안 마셔.")),
            new SurveyQuestionPrompt("친구 초대", List.of("허락없이 언제든 상관없어.", "말만 해주면 언제든 상관없어.", "허락을 구한 뒤에 초대하는거면 언제든 상관없어.", "허락을 구해도 자주는 부담스러워.", "집에 다른 사람을 초대하지 않는게 좋아.")),
            new SurveyQuestionPrompt("갈등 해결", List.of("바로 이야기로 해결하려고 해.", "하루 이내에 대화를 시도해보는거 같아.", "몇일은 지난 후 이야기할거 같아.", "일주일은 지난 후 이야기할거 같아.", "먼저 이야기하지 않는 편이야.")),
            new SurveyQuestionPrompt("벌레", List.of("바로 잡아.", "대부분 직접 처리해.", "상황에 따라 다른거 같아.", "다른 사람이 있으면 부탁하는 편이야.", "벌레는 절대 혼자 처리못해.")),
            new SurveyQuestionPrompt("공용 비품", List.of("공용으로 쓸 수 있는건 함께 사용하는게 좋아.", "몇가지 빼고는 함께 사용하는게 좋아.", "상황에 따라 다른것 같아", "몇가지 빼고는 따로 사용하는게 좋아.", "모든 물건을 개인용으로 사용할래.")),
            new SurveyQuestionPrompt("월 생활비", List.of("100만 원 이상", "70~100만 원", "50~70만 원", "30~50만 원", "30만 원 미만")),
            new SurveyQuestionPrompt("방 크기", List.of("20평 이상이어야 해.", "15~19평", "10~14평", "7~9평", "6평 이하도 좋아."))
    );

    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(8))
            .build();

    @Value("${gemini.api-key:}")
    private String geminiApiKey;

    @Value("${gemini.model:gemini-2.0-flash}")
    private String geminiModel;

    public String summarize(SurveyResult surveyResult) {
        String apiKey = resolveGeminiApiKey();
        if (apiKey.isBlank()) {
            throw new IllegalStateException("Gemini API 키가 설정되지 않았습니다.");
        }

        List<Integer> answers = parseAnswers(surveyResult.getAnswers());
        if (answers.isEmpty()) {
            return "설문 답변이 아직 충분하지 않아 요약을 만들 수 없어요.";
        }

        String systemPrompt = "너는 룸메이트 매칭 앱의 설문 요약가입니다. 개인정보를 추측하지 말고, 한국어 한 문장으로만 답하세요. 결과는 45자 이내로 자연스럽고 다정하게 작성하세요.";
        String userPrompt = "아래 설문 답변을 바탕으로 룸메이트 생활 성향을 한 문장으로 요약해주세요. 접두사 없이 요약 문장만 출력하세요.\n\n" + buildAnswerPrompt(answers);

        return callGemini(apiKey, systemPrompt, userPrompt, 100, "설문 요약 생성에 실패했습니다.");
    }

    public String explainComparison(
            String nickname,
            int compatibilityScore,
            List<SurveyComparisonHighlightResponse> topReasons,
            List<SurveyComparisonHighlightResponse> differences
    ) {
        String apiKey = resolveGeminiApiKey();
        if (apiKey.isBlank()) {
            throw new IllegalStateException("Gemini API 키가 설정되지 않았습니다.");
        }

        String topReasonsText = topReasons.isEmpty()
                ? "특별히 두드러지는 항목 없음"
                : topReasons.stream().map(SurveyComparisonHighlightResponse::category).collect(Collectors.joining(", "));
        String differencesText = differences.isEmpty()
                ? "특별히 차이 나는 항목 없음"
                : differences.stream().map(SurveyComparisonHighlightResponse::category).collect(Collectors.joining(", "));

        String systemPrompt = "너는 룸메이트 매칭 앱의 궁합 설명가입니다. 두 사람의 설문 비교 결과(궁합 점수, 잘 맞는 항목, 다른 항목)를 보고 "
                + "왜 그런 점수가 나왔는지 이유를 설명하고, 다른 항목에 대해서는 어떻게 하면 좋을지 짧은 조언을 함께 제시하세요. "
                + "한국어 존댓말로 2~3문장, 공백 포함 150자 이내로 자연스럽고 다정하게 작성하세요. 접두사 없이 설명 문장만 출력하세요.";
        String userPrompt = "닉네임: " + nickname
                + "\n궁합 점수: " + compatibilityScore + "점"
                + "\n잘 맞는 항목: " + topReasonsText
                + "\n다른 항목: " + differencesText
                + "\n\n위 정보를 바탕으로 두 사람의 궁합을 설명해주세요.";

        return callGemini(apiKey, systemPrompt, userPrompt, 300, "궁합 설명 생성에 실패했습니다.");
    }

    private String callGemini(String apiKey, String systemPrompt, String userPrompt, int maxOutputTokens, String failureMessage) {
        try {
            URI uri = URI.create(GEMINI_GENERATE_CONTENT_URI_TEMPLATE.formatted(resolveGeminiModel()));
            HttpRequest request = HttpRequest.newBuilder(uri)
                    .timeout(Duration.ofSeconds(15))
                    .header("x-goog-api-key", apiKey)
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(toJson(buildGeminiRequestBody(systemPrompt, userPrompt, maxOutputTokens))))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                // Gemini는 실패 사유(권한 없음/모델 없음/한도 초과 등)를 body에 담아 보내므로 그대로 노출한다.
                throw new IllegalStateException(failureMessage + " (Gemini 응답 " + response.statusCode() + "): " + response.body());
            }
            return extractSummary(response.body());
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new IllegalStateException("Gemini API 호출이 중단되었습니다.", e);
        } catch (IllegalStateException e) {
            throw e;
        } catch (Exception e) {
            throw new IllegalStateException(failureMessage, e);
        }
    }

    private Map<String, Object> buildGeminiRequestBody(String systemPrompt, String userPrompt, int maxOutputTokens) {
        return Map.of(
                "system_instruction", Map.of("parts", List.of(Map.of("text", systemPrompt))),
                "contents", List.of(Map.of("parts", List.of(Map.of("text", userPrompt)))),
                "generationConfig", Map.of(
                        "temperature", 0.3,
                        "maxOutputTokens", maxOutputTokens
                )
        );
    }

    private String resolveGeminiApiKey() {
        if (geminiApiKey != null && !geminiApiKey.isBlank()) {
            return stripWrappingQuotes(geminiApiKey);
        }
        return readDotEnvValue("GEMINI_API_KEY");
    }

    private String resolveGeminiModel() {
        String envModel = System.getenv("GEMINI_MODEL");
        if (envModel != null && !envModel.isBlank()) {
            return stripWrappingQuotes(geminiModel);
        }

        String dotEnvModel = readDotEnvValue("GEMINI_MODEL");
        if (!dotEnvModel.isBlank()) {
            return dotEnvModel;
        }

        if (geminiModel == null || geminiModel.isBlank()) {
            return "gemini-2.0-flash";
        }
        return stripWrappingQuotes(geminiModel);
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
        Object candidatesObject = root.get("candidates");
        if (!(candidatesObject instanceof List<?> candidates) || candidates.isEmpty()) {
            throw new IllegalStateException("Gemini 응답에 candidates가 없습니다: " + responseBody);
        }

        Object firstCandidate = candidates.get(0);
        if (!(firstCandidate instanceof Map<?, ?> candidate)) {
            throw new IllegalStateException("Gemini 응답 형식이 올바르지 않습니다.");
        }

        Object contentObject = candidate.get("content");
        if (!(contentObject instanceof Map<?, ?> content)) {
            throw new IllegalStateException("Gemini 응답에 content가 없습니다.");
        }

        Object partsObject = content.get("parts");
        if (!(partsObject instanceof List<?> parts) || parts.isEmpty()) {
            throw new IllegalStateException("Gemini 응답에 parts가 없습니다.");
        }

        Object firstPart = parts.get(0);
        if (!(firstPart instanceof Map<?, ?> part) || !(part.get("text") instanceof String text) || text.isBlank()) {
            throw new IllegalStateException("Gemini 응답에 text가 없습니다.");
        }

        return text.trim().replaceAll("\\s+", " ");
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
