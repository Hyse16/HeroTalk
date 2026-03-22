package org.herotalk.domain.dungeon.service;

import lombok.RequiredArgsConstructor;
import org.herotalk.domain.dungeon.dto.DungeonResponse;
import org.herotalk.domain.dungeon.dto.MonsterResponse;
import org.herotalk.domain.dungeon.entity.Dungeon;
import org.herotalk.domain.dungeon.repository.DungeonRepository;
import org.herotalk.domain.dungeon.repository.MonsterRepository;
import org.herotalk.global.exception.ResourceNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class DungeonService {
    private final DungeonRepository dungeonRepository;
    private final MonsterRepository monsterRepository;

    @Transactional(readOnly = true)
    public List<DungeonResponse> getAllDungeons() {
        return dungeonRepository.findAll().stream()
                .map(DungeonResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<MonsterResponse> getMonstersByDungeon(Long dungeonId) {
        Dungeon dungeon = dungeonRepository.findById(dungeonId)
                .orElseThrow(() -> new ResourceNotFoundException("던전을 찾을 수 없습니다"));
        return monsterRepository.findByDungeon(dungeon).stream()
                .map(MonsterResponse::from)
                .toList();
    }
}
