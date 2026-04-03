package org.herotalk.domain.ranking.service;

import lombok.RequiredArgsConstructor;
import org.herotalk.domain.character.repository.CharacterRepository;
import org.herotalk.domain.ranking.dto.RankingEntry;
import org.springframework.context.annotation.Profile;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.core.ZSetOperations;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Set;

@Service
@Profile("!local")
@RequiredArgsConstructor
public class RankingService {

    private static final String GLOBAL_KEY = "ranking:global";
    private static final String WEEKLY_KEY = "ranking:weekly";

    private final RedisTemplate<String, String> redisTemplate;
    private final CharacterRepository characterRepository;

    /**
     * 배틀 승리 시 호출 — 글로벌 + 주간 점수 증가
     */
    public void addScore(Long userId, long expGained) {
        String member = String.valueOf(userId);
        redisTemplate.opsForZSet().incrementScore(GLOBAL_KEY, member, expGained);
        redisTemplate.opsForZSet().incrementScore(WEEKLY_KEY, member, expGained);
    }

    /**
     * 글로벌 랭킹 TOP N 조회
     */
    public List<RankingEntry> getGlobalRanking(int limit) {
        return buildRanking(GLOBAL_KEY, limit);
    }

    /**
     * 주간 랭킹 TOP N 조회
     */
    public List<RankingEntry> getWeeklyRanking(int limit) {
        return buildRanking(WEEKLY_KEY, limit);
    }

    private List<RankingEntry> buildRanking(String key, int limit) {
        Set<ZSetOperations.TypedTuple<String>> tuples =
                redisTemplate.opsForZSet().reverseRangeWithScores(key, 0, limit - 1);

        if (tuples == null) return List.of();

        List<RankingEntry> result = new ArrayList<>();
        int[] rankArr = {1};

        for (ZSetOperations.TypedTuple<String> tuple : tuples) {
            Long userId = Long.parseLong(tuple.getValue());
            characterRepository.findByUserId(userId).ifPresent(c -> {
                result.add(RankingEntry.builder()
                        .rank(rankArr[0])
                        .userId(userId)
                        .characterName(c.getName())
                        .job(c.getJob().name())
                        .level(c.getLevel())
                        .score(tuple.getScore().longValue())
                        .build());
            });
            rankArr[0]++;
        }

        return result;
    }
}
