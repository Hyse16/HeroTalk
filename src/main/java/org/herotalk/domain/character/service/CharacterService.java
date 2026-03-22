package org.herotalk.domain.character.service;

import lombok.RequiredArgsConstructor;
import org.herotalk.domain.character.dto.CharacterCreateRequest;
import org.herotalk.domain.character.dto.CharacterResponse;
import org.herotalk.domain.character.entity.Character;
import org.herotalk.domain.character.entity.CharacterStats;
import org.herotalk.domain.character.repository.CharacterRepository;
import org.herotalk.domain.character.repository.CharacterStatsRepository;
import org.herotalk.domain.user.entity.User;
import org.herotalk.domain.user.repository.UserRepository;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class CharacterService {

    private final CharacterRepository characterRepository;
    private final CharacterStatsRepository characterStatsRepository;
    private final UserRepository userRepository;

    @Transactional
    public CharacterResponse createCharacter(Long userId, CharacterCreateRequest request) {
        if (characterRepository.findByUserId(userId).isPresent()) {
            throw new IllegalStateException("이미 캐릭터가 존재합니다");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UsernameNotFoundException("사용자를 찾을 수 없습니다: " + userId));

        Character character = Character.builder()
                .user(user)
                .name(request.getName())
                .job(request.getJob())
                .gender(request.getGender())
                .build();
        Character savedCharacter = characterRepository.save(character);

        CharacterStats stats = CharacterStats.initByJob(savedCharacter, request.getJob());
        CharacterStats savedStats = characterStatsRepository.save(stats);

        return CharacterResponse.from(savedCharacter, savedStats);
    }

    @Transactional(readOnly = true)
    public CharacterResponse getCharacter(Long userId) {
        Character character = characterRepository.findByUserId(userId)
                .orElseThrow(() -> new IllegalStateException("캐릭터를 찾을 수 없습니다"));

        CharacterStats stats = characterStatsRepository.findByCharacterId(character.getId())
                .orElseThrow(() -> new IllegalStateException("캐릭터 스탯을 찾을 수 없습니다"));

        return CharacterResponse.from(character, stats);
    }
}
