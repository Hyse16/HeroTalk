package org.herotalk.domain.user.controller;

import lombok.RequiredArgsConstructor;
import org.herotalk.domain.user.dto.StreakResponse;
import org.herotalk.domain.user.service.StreakService;
import org.herotalk.global.response.ApiResponse;
import org.herotalk.security.CustomUserDetails;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/streak")
@RequiredArgsConstructor
public class StreakController {

    private final StreakService streakService;

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<StreakResponse>> getStreak(
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        StreakResponse response = streakService.getStreak(userDetails.getUserId());
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping("/checkin")
    public ResponseEntity<ApiResponse<StreakResponse>> checkIn(
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        StreakResponse response = streakService.checkIn(userDetails.getUserId());
        return ResponseEntity.ok(ApiResponse.ok(response));
    }
}
