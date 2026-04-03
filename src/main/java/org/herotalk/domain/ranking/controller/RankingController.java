package org.herotalk.domain.ranking.controller;

import lombok.RequiredArgsConstructor;
import org.herotalk.domain.ranking.dto.RankingEntry;
import org.herotalk.domain.ranking.service.RankingService;
import org.herotalk.global.response.ApiResponse;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.context.annotation.Profile;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@Profile("!local")
@RequestMapping("/api/rankings")
@RequiredArgsConstructor
public class RankingController {

    private final RankingService rankingService;

    /**
     * GET /api/rankings/global?limit=10
     * 글로벌 랭킹 TOP N 조회
     */
    @GetMapping("/global")
    public ApiResponse<List<RankingEntry>> getGlobalRanking(
            @RequestParam(defaultValue = "10") int limit) {
        return ApiResponse.ok(rankingService.getGlobalRanking(limit));
    }

    /**
     * GET /api/rankings/weekly?limit=10
     * 주간 랭킹 TOP N 조회
     */
    @GetMapping("/weekly")
    public ApiResponse<List<RankingEntry>> getWeeklyRanking(
            @RequestParam(defaultValue = "10") int limit) {
        return ApiResponse.ok(rankingService.getWeeklyRanking(limit));
    }
}
