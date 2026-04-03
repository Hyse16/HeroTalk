package org.herotalk.domain.admin.service;

import lombok.RequiredArgsConstructor;
import org.herotalk.domain.ranking.dto.RankingEntry;
import org.herotalk.domain.ranking.service.RankingService;
import org.springframework.context.annotation.Profile;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@Profile("!local")
@RequiredArgsConstructor
public class AdminRankingService {

    private static final String WEEKLY_KEY = "ranking:weekly";

    private final RankingService rankingService;
    private final RedisTemplate<String, String> redisTemplate;

    public List<RankingEntry> getGlobalRanking() {
        return rankingService.getGlobalRanking(100);
    }

    public List<RankingEntry> getWeeklyRanking() {
        return rankingService.getWeeklyRanking(100);
    }

    public void clearWeeklyRanking() {
        redisTemplate.delete(WEEKLY_KEY);
    }
}
