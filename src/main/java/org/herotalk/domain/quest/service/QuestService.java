package org.herotalk.domain.quest.service;

import lombok.RequiredArgsConstructor;
import org.herotalk.domain.character.dto.CharacterResponse;
import org.herotalk.domain.character.entity.Character;
import org.herotalk.domain.character.entity.CharacterStats;
import org.herotalk.domain.character.repository.CharacterRepository;
import org.herotalk.domain.character.repository.CharacterStatsRepository;
import org.herotalk.domain.quest.dto.QuestResponse;
import org.herotalk.domain.quest.entity.DailyQuest;
import org.herotalk.domain.quest.entity.UserDailyQuest;
import org.herotalk.domain.quest.repository.DailyQuestRepository;
import org.herotalk.domain.quest.repository.UserDailyQuestRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class QuestService {

    private final DailyQuestRepository dailyQuestRepository;
    private final UserDailyQuestRepository userDailyQuestRepository;
    private final CharacterRepository characterRepository;
    private final CharacterStatsRepository characterStatsRepository;

    @Transactional
    public List<QuestResponse> getTodayQuests(Long userId) {
        Character character = characterRepository.findByUserId(userId)
                .orElseThrow(() -> new IllegalStateException("캐릭터를 찾을 수 없습니다"));

        LocalDate today = LocalDate.now();
        List<UserDailyQuest> todayQuests =
                userDailyQuestRepository.findByCharacterIdAndQuestDate(character.getId(), today);

        if (todayQuests.isEmpty()) {
            List<DailyQuest> allQuests = dailyQuestRepository.findAll();
            todayQuests = allQuests.stream()
                    .map(quest -> UserDailyQuest.builder()
                            .character(character)
                            .dailyQuest(quest)
                            .questDate(today)
                            .build())
                    .map(userDailyQuestRepository::save)
                    .collect(Collectors.toList());
        }

        return todayQuests.stream()
                .map(this::toQuestResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public CharacterResponse claimReward(Long userId, Long userQuestId) {
        Character character = characterRepository.findByUserId(userId)
                .orElseThrow(() -> new IllegalStateException("캐릭터를 찾을 수 없습니다"));

        UserDailyQuest userQuest = userDailyQuestRepository.findById(userQuestId)
                .orElseThrow(() -> new IllegalStateException("퀘스트를 찾을 수 없습니다"));

        if (!userQuest.getCharacter().getId().equals(character.getId())) {
            throw new IllegalStateException("해당 퀘스트에 접근 권한이 없습니다");
        }

        if (!userQuest.isCompleted()) {
            throw new IllegalStateException("아직 완료되지 않은 퀘스트입니다");
        }

        DailyQuest dailyQuest = userQuest.getDailyQuest();
        character.addExp(dailyQuest.getExpReward());
        character.addGold(dailyQuest.getGoldReward());

        CharacterStats stats = characterStatsRepository.findByCharacterId(character.getId())
                .orElseThrow(() -> new IllegalStateException("캐릭터 스탯을 찾을 수 없습니다"));

        return CharacterResponse.from(character, stats);
    }

    private QuestResponse toQuestResponse(UserDailyQuest userQuest) {
        DailyQuest quest = userQuest.getDailyQuest();
        return QuestResponse.builder()
                .userQuestId(userQuest.getId())
                .questId(quest.getId())
                .name(quest.getName())
                .description(quest.getDescription())
                .questType(quest.getQuestType().name())
                .targetValue(quest.getTargetValue())
                .currentValue(userQuest.getCurrentValue())
                .expReward(quest.getExpReward())
                .goldReward(quest.getGoldReward())
                .completed(userQuest.isCompleted())
                .questDate(userQuest.getQuestDate())
                .build();
    }
}
