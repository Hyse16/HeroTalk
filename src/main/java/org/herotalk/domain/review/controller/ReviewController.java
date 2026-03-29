package org.herotalk.domain.review.controller;

import lombok.RequiredArgsConstructor;
import org.herotalk.domain.review.dto.ReviewQuestionResponse;
import org.herotalk.domain.review.dto.ReviewSubmitRequest;
import org.herotalk.domain.review.dto.ReviewSubmitResponse;
import org.herotalk.domain.review.service.ReviewService;
import org.herotalk.global.response.ApiResponse;
import org.herotalk.security.CustomUserDetails;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/reviews")
@RequiredArgsConstructor
public class ReviewController {

    private final ReviewService reviewService;

    @GetMapping
    public ApiResponse<List<ReviewQuestionResponse>> getReviewList(
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        return ApiResponse.ok(reviewService.getReviewList(userDetails.getUserId()));
    }

    @PostMapping("/{id}/submit")
    public ApiResponse<ReviewSubmitResponse> submitReview(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable Long id,
            @RequestBody ReviewSubmitRequest request) {
        return ApiResponse.ok(reviewService.submitReview(
                userDetails.getUserId(), id, request.getTranscript()));
    }
}
