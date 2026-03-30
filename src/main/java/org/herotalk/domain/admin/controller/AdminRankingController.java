package org.herotalk.domain.admin.controller;

import lombok.RequiredArgsConstructor;
import org.herotalk.domain.admin.service.AdminRankingService;
import org.herotalk.domain.ranking.dto.RankingEntry;
import org.herotalk.global.response.ApiResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/rankings")
@RequiredArgsConstructor
public class AdminRankingController {

    private final AdminRankingService adminRankingService;

    @GetMapping("/global")
    public ResponseEntity<ApiResponse<List<RankingEntry>>> getGlobal() {
        return ResponseEntity.ok(ApiResponse.ok(adminRankingService.getGlobalRanking()));
    }

    @GetMapping("/weekly")
    public ResponseEntity<ApiResponse<List<RankingEntry>>> getWeekly() {
        return ResponseEntity.ok(ApiResponse.ok(adminRankingService.getWeeklyRanking()));
    }

    @DeleteMapping("/weekly")
    public ResponseEntity<ApiResponse<Void>> clearWeekly() {
        adminRankingService.clearWeeklyRanking();
        return ResponseEntity.ok(ApiResponse.ok(null));
    }
}
