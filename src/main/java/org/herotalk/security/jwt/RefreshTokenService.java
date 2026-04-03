package org.herotalk.security.jwt;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.TimeUnit;

@Service
public class RefreshTokenService {

    private static final String PREFIX = "refresh:";

    @Autowired(required = false)
    private RedisTemplate<String, String> redisTemplate;

    // Redis 없는 로컬 환경용 인메모리 폴백
    private final ConcurrentHashMap<String, String> localStore = new ConcurrentHashMap<>();

    @Value("${jwt.refresh-token-expiry}")
    private long refreshTokenExpiry;

    public void save(Long userId, String refreshToken) {
        if (redisTemplate != null) {
            redisTemplate.opsForValue().set(
                    PREFIX + userId, refreshToken,
                    refreshTokenExpiry, TimeUnit.MILLISECONDS
            );
        } else {
            localStore.put(PREFIX + userId, refreshToken);
        }
    }

    public boolean validate(Long userId, String refreshToken) {
        if (redisTemplate != null) {
            String stored = redisTemplate.opsForValue().get(PREFIX + userId);
            return refreshToken.equals(stored);
        } else {
            return refreshToken.equals(localStore.get(PREFIX + userId));
        }
    }

    public void delete(Long userId) {
        if (redisTemplate != null) {
            redisTemplate.delete(PREFIX + userId);
        } else {
            localStore.remove(PREFIX + userId);
        }
    }
}
