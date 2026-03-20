package org.herotalk.security.oauth2;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.herotalk.domain.character.repository.CharacterRepository;
import org.herotalk.domain.user.repository.UserRepository;
import org.herotalk.security.jwt.JwtProvider;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;

@Slf4j
@Component
@RequiredArgsConstructor
public class OAuth2SuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

    private final JwtProvider jwtProvider;
    private final UserRepository userRepository;
    private final CharacterRepository characterRepository;

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request,
                                        HttpServletResponse response,
                                        Authentication authentication) throws IOException {
        OAuth2User oAuth2User = (OAuth2User) authentication.getPrincipal();
        Long userId = (Long) oAuth2User.getAttributes().get("userId");

        String email = userRepository.findById(userId)
                .map(user -> user.getEmail())
                .orElse(null);

        String accessToken = jwtProvider.generateAccessToken(userId, email);
        String refreshToken = jwtProvider.generateRefreshToken(userId);

        boolean hasCharacter = characterRepository.findByUserId(userId).isPresent();

        String redirectUrl;
        if (!hasCharacter) {
            redirectUrl = "http://localhost:3000/character/create?token=" + accessToken;
        } else {
            redirectUrl = "http://localhost:3000/game?token=" + accessToken + "&refresh=" + refreshToken;
        }

        getRedirectStrategy().sendRedirect(request, response, redirectUrl);
    }
}
