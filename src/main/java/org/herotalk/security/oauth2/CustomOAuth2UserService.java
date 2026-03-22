package org.herotalk.security.oauth2;

import lombok.RequiredArgsConstructor;
import org.herotalk.domain.user.entity.User;
import org.herotalk.domain.user.repository.UserRepository;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.user.DefaultOAuth2User;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class CustomOAuth2UserService extends DefaultOAuth2UserService {

    private final UserRepository userRepository;

    @Override
    @Transactional
    public OAuth2User loadUser(OAuth2UserRequest userRequest) throws OAuth2AuthenticationException {
        OAuth2User oAuth2User = super.loadUser(userRequest);

        String registrationId = userRequest.getClientRegistration().getRegistrationId();
        OAuth2UserInfo userInfo = resolveUserInfo(registrationId, oAuth2User.getAttributes());

        User user = saveOrUpdate(userInfo);

        Map<String, Object> attributes = new HashMap<>(oAuth2User.getAttributes());
        attributes.put("userId", user.getId());

        String userNameAttributeName = userRequest.getClientRegistration()
                .getProviderDetails()
                .getUserInfoEndpoint()
                .getUserNameAttributeName();

        return new DefaultOAuth2User(
                oAuth2User.getAuthorities(),
                attributes,
                userNameAttributeName
        );
    }

    private OAuth2UserInfo resolveUserInfo(String registrationId, Map<String, Object> attributes) {
        return switch (registrationId.toLowerCase()) {
            case "kakao" -> new KakaoOAuth2UserInfo(attributes);
            case "google" -> new GoogleOAuth2UserInfo(attributes);
            default -> throw new OAuth2AuthenticationException("Unsupported provider: " + registrationId);
        };
    }

    private User saveOrUpdate(OAuth2UserInfo userInfo) {
        User.Provider provider = User.Provider.valueOf(userInfo.getProvider());
        String providerId = userInfo.getId();

        // 1. providerId로 먼저 찾기 (이메일 동의 여부 무관하게 항상 식별 가능)
        Optional<User> existingUser = userRepository.findByProviderIdAndProvider(providerId, provider);
        if (existingUser.isPresent()) {
            return existingUser.get();
        }

        // 2. 이메일이 있으면 이메일로도 중복 확인
        String email = userInfo.getEmail();
        if (email != null) {
            Optional<User> userByEmail = userRepository.findByEmail(email);
            if (userByEmail.isPresent()) {
                return userByEmail.get();
            }
        }

        // 3. 신규 유저 생성 (이메일 없으면 플레이스홀더 사용)
        String resolvedEmail = email != null ? email : provider.name().toLowerCase() + "_" + providerId + "@herotalk.local";
        String nickname = userInfo.getName() != null ? userInfo.getName() : "User_" + providerId.substring(0, 6);

        User newUser = User.createSocial(resolvedEmail, provider, providerId, nickname);
        return userRepository.save(newUser);
    }
}
