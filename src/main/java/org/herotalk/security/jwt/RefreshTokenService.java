package org.herotalk.security.jwt;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.util.concurrent.TimeUnit;

@Service
@RequiredArgsConstructor
public class RefreshTokenService {

    private static final String PREFIX = "refresh:";

    private final RedisTemplate<String, String> redisTemplate;

    @Value("${jwt.refresh-token-expiry}")
    private long refreshTokenExpiry;

    public void save(Long userId, String refreshToken) {
        redisTemplate.opsForValue().set(
                PREFIX + userId, refreshToken,
                refreshTokenExpiry, TimeUnit.MILLISECONDS
        );
    }

    public boolean validate(Long userId, String refreshToken) {
        String stored = redisTemplate.opsForValue().get(PREFIX + userId);
        return refreshToken.equals(stored);
    }

    public void delete(Long userId) {
        redisTemplate.delete(PREFIX + userId);
    }
}
