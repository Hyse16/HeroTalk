package org.herotalk.domain.admin.service;

import lombok.RequiredArgsConstructor;
import org.apache.commons.csv.CSVFormat;
import org.apache.commons.csv.CSVParser;
import org.apache.commons.csv.CSVRecord;
import org.herotalk.domain.admin.dto.AdminQuestionRequest;
import org.herotalk.domain.dungeon.entity.Dungeon;
import org.herotalk.domain.question.entity.Question;
import org.herotalk.domain.question.repository.QuestionRepository;
import org.herotalk.global.exception.ResourceNotFoundException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.InputStreamReader;
import java.io.Reader;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class AdminQuestionService {

    private final QuestionRepository questionRepository;

    @Transactional(readOnly = true)
    public Page<Question> getQuestions(Pageable pageable) {
        return questionRepository.findAll(pageable);
    }

    @Transactional
    public Question create(AdminQuestionRequest req) {
        Question question = Question.builder()
                .toeicPart(req.getToeicPart())
                .difficulty(req.getDifficulty())
                .questionText(req.getQuestionText())
                .imageUrl(req.getImageUrl())
                .contextData(req.getContextData())
                .prepTime(req.getPrepTime())
                .answerTime(req.getAnswerTime())
                .sampleAnswer(req.getSampleAnswer())
                .hint(req.getHint())
                .build();
        return questionRepository.save(question);
    }

    @Transactional
    public Question update(Long id, AdminQuestionRequest req) {
        Question q = questionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Question", id));
        return q.update(req.getToeicPart(), req.getDifficulty(), req.getQuestionText(),
                req.getImageUrl(), req.getContextData(), req.getPrepTime(),
                req.getAnswerTime(), req.getSampleAnswer(), req.getHint());
    }

    @Transactional
    public void delete(Long id) {
        questionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Question", id));
        questionRepository.deleteById(id);
    }

    // Part별 기본 준비/답변 시간
    private static final Map<String, int[]> PART_DEFAULTS = Map.of(
            "PART1", new int[]{45, 45},
            "PART2", new int[]{30, 45},
            "PART3", new int[]{3, 15},
            "PART4", new int[]{30, 30},
            "PART5", new int[]{30, 60},
            "PART6", new int[]{15, 60}
    );

    @Transactional
    public int uploadCsv(MultipartFile file) {
        try (Reader reader = new InputStreamReader(file.getInputStream(), StandardCharsets.UTF_8);
             CSVParser parser = CSVFormat.DEFAULT
                     .builder()
                     .setHeader()
                     .setSkipHeaderRecord(true)
                     .setTrim(true)
                     .setIgnoreEmptyLines(true)
                     .build()
                     .parse(reader)) {

            List<Question> questions = new ArrayList<>();
            for (CSVRecord record : parser) {
                String partStr = record.get("toeicPart").toUpperCase();
                int[] defaults = PART_DEFAULTS.getOrDefault(partStr, new int[]{30, 45});

                String prepRaw = record.isMapped("prepTime") ? record.get("prepTime") : "";
                String answerRaw = record.isMapped("answerTime") ? record.get("answerTime") : "";
                int prepTime = (prepRaw == null || prepRaw.isBlank()) ? defaults[0] : Integer.parseInt(prepRaw.trim());
                int answerTime = (answerRaw == null || answerRaw.isBlank()) ? defaults[1] : Integer.parseInt(answerRaw.trim());

                String difficultyRaw = record.isMapped("difficulty") ? record.get("difficulty") : "1";
                int difficulty = (difficultyRaw == null || difficultyRaw.isBlank()) ? 1 : Integer.parseInt(difficultyRaw.trim());

                String contextData = record.isMapped("contextData") ? record.get("contextData") : null;
                String sampleAnswer = record.isMapped("sampleAnswer") ? record.get("sampleAnswer") : null;
                String hint = record.isMapped("hint") ? record.get("hint") : null;

                questions.add(Question.builder()
                        .toeicPart(Dungeon.ToeicPart.valueOf(partStr))
                        .difficulty(difficulty)
                        .questionText(record.get("questionText"))
                        .contextData((contextData != null && !contextData.isBlank()) ? contextData : null)
                        .prepTime(prepTime)
                        .answerTime(answerTime)
                        .sampleAnswer((sampleAnswer != null && !sampleAnswer.isBlank()) ? sampleAnswer : null)
                        .hint((hint != null && !hint.isBlank()) ? hint : null)
                        .build());
            }

            questionRepository.saveAll(questions);
            return questions.size();

        } catch (Exception e) {
            throw new IllegalArgumentException("CSV 파싱 실패: " + e.getMessage(), e);
        }
    }
}
