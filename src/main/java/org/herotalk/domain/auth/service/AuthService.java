package org.herotalk.domain.auth.service;

import lombok.RequiredArgsConstructor;
import org.herotalk.domain.auth.dto.AuthResponse;
import org.herotalk.domain.auth.dto.LoginRequest;
import org.herotalk.domain.auth.dto.SignupRequest;
import org.herotalk.domain.auth.dto.TokenRefreshRequest;
import org.herotalk.domain.user.entity.User;
import org.herotalk.domain.user.entity.UserStreak;
import org.herotalk.domain.user.repository.UserRepository;
import org.herotalk.domain.user.repository.UserStreakRepository;
import org.herotalk.security.jwt.JwtProvider;
import org.herotalk.security.jwt.RefreshTokenService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final UserStreakRepository userStreakRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtProvider jwtProvider;
    private final RefreshTokenService refreshTokenService;

    @Transactional
    public AuthResponse signup(SignupRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("이미 사용 중인 이메일입니다: " + request.getEmail());
        }

        String encodedPassword = passwordEncoder.encode(request.getPassword());
        User user = User.createLocal(request.getEmail(), encodedPassword, request.getNickname());
        User savedUser = userRepository.save(user);

        UserStreak userStreak = UserStreak.builder()
                .user(savedUser)
                .build();
        userStreakRepository.save(userStreak);

        String accessToken = jwtProvider.generateAccessToken(savedUser.getId(), savedUser.getEmail());
        String refreshToken = jwtProvider.generateRefreshToken(savedUser.getId());
        refreshTokenService.save(savedUser.getId(), refreshToken);

        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .userId(savedUser.getId())
                .nickname(savedUser.getNickname())
                .newUser(true)
                .build();
    }

    @Transactional
    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new UsernameNotFoundException("사용자를 찾을 수 없습니다: " + request.getEmail()));

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new IllegalArgumentException("비밀번호가 일치하지 않습니다");
        }

        user.updateLastLogin();

        String accessToken = jwtProvider.generateAccessToken(user.getId(), user.getEmail());
        String refreshToken = jwtProvider.generateRefreshToken(user.getId());
        refreshTokenService.save(user.getId(), refreshToken);

        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .userId(user.getId())
                .nickname(user.getNickname())
                .newUser(false)
                .build();
    }

    @Transactional
    public AuthResponse refresh(TokenRefreshRequest request) {
        String refreshToken = request.getRefreshToken();

        if (!jwtProvider.validateToken(refreshToken)) {
            throw new IllegalArgumentException("유효하지 않은 refresh token입니다");
        }

        Long userId = jwtProvider.getUserIdFromToken(refreshToken);

        if (!refreshTokenService.validate(userId, refreshToken)) {
            throw new IllegalArgumentException("만료되거나 이미 사용된 refresh token입니다");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UsernameNotFoundException("사용자를 찾을 수 없습니다"));

        String newAccessToken  = jwtProvider.generateAccessToken(user.getId(), user.getEmail());
        String newRefreshToken = jwtProvider.generateRefreshToken(user.getId());
        refreshTokenService.save(user.getId(), newRefreshToken);

        return AuthResponse.builder()
                .accessToken(newAccessToken)
                .refreshToken(newRefreshToken)
                .userId(user.getId())
                .nickname(user.getNickname())
                .newUser(false)
                .build();
    }

    public void logout(Long userId) {
        refreshTokenService.delete(userId);
    }
}
