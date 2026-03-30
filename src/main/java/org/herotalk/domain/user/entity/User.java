package org.herotalk.domain.user.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;
import org.herotalk.global.entity.BaseTimeEntity;

import java.time.LocalDateTime;

@Entity
@Table(name = "users")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Builder
@AllArgsConstructor
public class User extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "email", length = 100, unique = true, nullable = false)
    private String email;

    @JsonIgnore
    @Column(name = "password", length = 255)
    private String password;

    @Enumerated(EnumType.STRING)
    @Column(name = "provider", nullable = false)
    @Builder.Default
    private Provider provider = Provider.LOCAL;

    @Column(name = "provider_id", length = 100)
    private String providerId;

    @Column(name = "nickname", length = 50, nullable = false)
    private String nickname;

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private boolean isActive = true;

    @Column(name = "last_login_at")
    private LocalDateTime lastLoginAt;

    public enum Provider {
        LOCAL, KAKAO, GOOGLE
    }

    public enum Role { USER, ADMIN }

    @Enumerated(EnumType.STRING)
    @Column(name = "role", nullable = false)
    @Builder.Default
    private Role role = Role.USER;

    public static User createLocal(String email, String password, String nickname) {
        return User.builder()
                .email(email)
                .password(password)
                .provider(Provider.LOCAL)
                .nickname(nickname)
                .isActive(true)
                .build();
    }

    public static User createSocial(String email, Provider provider, String providerId, String nickname) {
        return User.builder()
                .email(email)
                .provider(provider)
                .providerId(providerId)
                .nickname(nickname)
                .isActive(true)
                .build();
    }

    public void updateLastLogin() {
        this.lastLoginAt = LocalDateTime.now();
    }

    public void activate()   { this.isActive = true; }
    public void deactivate() { this.isActive = false; }
}
