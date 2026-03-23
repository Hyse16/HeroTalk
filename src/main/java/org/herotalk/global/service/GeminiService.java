package org.herotalk.global.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class GeminiService {

    @Value("${gemini.api-key}")
    private String apiKey;

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    private static final String GEMINI_URL =
            "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=%s";

    public GeminiScoreResult score(String questionText, String transcript) {
        String prompt = buildPrompt(questionText, transcript);

        Map<String, Object> requestBody = Map.of(
                "contents", List.of(
                        Map.of("parts", List.of(Map.of("text", prompt)))
                ),
                "generationConfig", Map.of(
                        "temperature", 0.3,
                        "maxOutputTokens", 512
                )
        );

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        try {
            ResponseEntity<String> response = restTemplate.postForEntity(
                    String.format(GEMINI_URL, apiKey),
                    new HttpEntity<>(requestBody, headers),
                    String.class
            );
            return parseResponse(response.getBody());
        } catch (Exception e) {
            log.error("Gemini API 호출 실패: {}", e.getMessage());
            return GeminiScoreResult.fallback();
        }
    }

    private String buildPrompt(String questionText, String transcript) {
        return """
                당신은 토익스피킹 시험 채점관입니다.
                아래 문제에 대한 영어 답변을 4가지 기준으로 각 25점씩, 합산 100점으로 채점하세요.

                채점 기준:
                1. 발음/억양 (Pronunciation): 발음의 명확성과 억양의 자연스러움
                2. 문법 (Grammar): 문법 정확성
                3. 어휘 (Vocabulary): 적절하고 다양한 어휘 사용
                4. 내용완성도 (Content): 문제에 대한 답변의 완성도와 논리성

                문제: %s
                답변: %s

                반드시 아래 JSON 형식으로만 응답하세요 (다른 텍스트 없이):
                {"score": 85, "feedback_good": "잘한 점 한국어로 1~2문장", "feedback_bad": "개선할 점 한국어로 1~2문장", "sample_answer": "Better English sample answer here"}
                """.formatted(questionText, transcript != null && !transcript.isBlank() ? transcript : "(답변 없음)");
    }

    private GeminiScoreResult parseResponse(String responseBody) throws Exception {
        JsonNode root = objectMapper.readTree(responseBody);
        String text = root.path("candidates")
                .path(0).path("content").path("parts").path(0).path("text").asText();

        // 마크다운 코드 블록 제거
        String json = text.trim()
                .replaceAll("(?s)```json\\s*", "")
                .replaceAll("(?s)```\\s*", "")
                .trim();

        JsonNode result = objectMapper.readTree(json);
        return new GeminiScoreResult(
                Math.max(0, Math.min(100, result.path("score").asInt(50))),
                result.path("feedback_good").asText(""),
                result.path("feedback_bad").asText(""),
                result.path("sample_answer").asText("")
        );
    }

    public record GeminiScoreResult(int score, String feedbackGood, String feedbackBad, String sampleAnswer) {
        public static GeminiScoreResult fallback() {
            return new GeminiScoreResult(50, "채점 중 오류가 발생했습니다", "잠시 후 다시 시도해주세요", "");
        }
    }
}
