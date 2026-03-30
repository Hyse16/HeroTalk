package org.herotalk.domain.admin.controller;

import lombok.RequiredArgsConstructor;
import org.herotalk.domain.admin.dto.AdminQuestionRequest;
import org.herotalk.domain.admin.service.AdminQuestionService;
import org.herotalk.domain.question.entity.Question;
import org.herotalk.global.response.ApiResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/questions")
@RequiredArgsConstructor
public class AdminQuestionController {

    private final AdminQuestionService adminQuestionService;

    @GetMapping
    public ResponseEntity<ApiResponse<Page<Question>>> getQuestions(
            @PageableDefault(size = 20) Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.ok(adminQuestionService.getQuestions(pageable)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<Question>> create(@RequestBody AdminQuestionRequest req) {
        return ResponseEntity.ok(ApiResponse.ok(adminQuestionService.create(req)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<Question>> update(
            @PathVariable Long id, @RequestBody AdminQuestionRequest req) {
        return ResponseEntity.ok(ApiResponse.ok(adminQuestionService.update(id, req)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        adminQuestionService.delete(id);
        return ResponseEntity.ok(ApiResponse.ok(null));
    }
}
