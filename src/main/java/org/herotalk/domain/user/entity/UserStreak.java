package org.herotalk.domain.user.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "user_streaks")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Builder
@AllArgsConstructor
public class UserStreak {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "current_streak", nullable = false)
    @Builder.Default
    private int currentStreak = 0;

    @Column(name = "max_streak", nullable = false)
    @Builder.Default
    private int maxStreak = 0;

    @Column(name = "last_login_date")
    private LocalDate lastLoginDate;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    // ── 도메인 메서드 ──

    /** 오늘 체크인 여부 */
    public boolean isCheckedInToday() {
        return lastLoginDate != null && lastLoginDate.equals(LocalDate.now());
    }

    /** 체크인 (스트릭 업데이트) */
    public void checkIn() {
        LocalDate today = LocalDate.now();
        if (isCheckedInToday()) return;
        if (lastLoginDate != null && lastLoginDate.equals(today.minusDays(1))) {
            this.currentStreak++;
        } else {
            this.currentStreak = 1;
        }
        this.maxStreak = Math.max(this.maxStreak, this.currentStreak);
        this.lastLoginDate = today;
        this.updatedAt = LocalDateTime.now();
    }

    /** XP 배율 반환 (1일→1.1, 3일→1.3, 7일→1.5) */
    public double getExpMultiplier() {
        if (currentStreak >= 7)  return 1.5;
        if (currentStreak >= 3)  return 1.3;
        if (currentStreak >= 1)  return 1.1;
        return 1.0;
    }
}
