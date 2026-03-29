package org.herotalk.domain.user.service;

import lombok.RequiredArgsConstructor;
import org.herotalk.domain.user.dto.StreakResponse;
import org.herotalk.domain.user.entity.User;
import org.herotalk.domain.user.entity.UserStreak;
import org.herotalk.domain.user.repository.UserRepository;
import org.herotalk.domain.user.repository.UserStreakRepository;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class StreakService {

    private final UserStreakRepository userStreakRepository;
    private final UserRepository userRepository;

    @Transactional
    public StreakResponse checkIn(Long userId) {
        UserStreak streak = userStreakRepository.findByUserId(userId)
                .orElseGet(() -> {
                    User user = userRepository.findById(userId)
                            .orElseThrow(() -> new UsernameNotFoundException("사용자를 찾을 수 없습니다: " + userId));
                    return userStreakRepository.save(
                            UserStreak.builder()
                                    .user(user)
                                    .build()
                    );
                });

        streak.checkIn();

        return toResponse(streak);
    }

    @Transactional(readOnly = true)
    public StreakResponse getStreak(Long userId) {
        UserStreak streak = userStreakRepository.findByUserId(userId)
                .orElseGet(() -> UserStreak.builder().build());

        return toResponse(streak);
    }

    private StreakResponse toResponse(UserStreak streak) {
        return StreakResponse.builder()
                .currentStreak(streak.getCurrentStreak())
                .maxStreak(streak.getMaxStreak())
                .lastLoginDate(streak.getLastLoginDate())
                .expMultiplier(streak.getExpMultiplier())
                .checkedInToday(streak.isCheckedInToday())
                .build();
    }
}
