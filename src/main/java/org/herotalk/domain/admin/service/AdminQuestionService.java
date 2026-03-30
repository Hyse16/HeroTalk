package org.herotalk.domain.admin.service;

import lombok.RequiredArgsConstructor;
import org.herotalk.domain.admin.dto.AdminQuestionRequest;
import org.herotalk.domain.question.entity.Question;
import org.herotalk.domain.question.repository.QuestionRepository;
import org.herotalk.global.exception.ResourceNotFoundException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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
}
