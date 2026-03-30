package org.herotalk.domain.admin.service;

import lombok.RequiredArgsConstructor;
import org.herotalk.domain.admin.dto.AdminMonsterRequest;
import org.herotalk.domain.dungeon.entity.Dungeon;
import org.herotalk.domain.dungeon.entity.Monster;
import org.herotalk.domain.dungeon.repository.DungeonRepository;
import org.herotalk.domain.dungeon.repository.MonsterRepository;
import org.herotalk.global.exception.ResourceNotFoundException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AdminMonsterService {

    private final MonsterRepository monsterRepository;
    private final DungeonRepository dungeonRepository;

    @Transactional(readOnly = true)
    public Page<Monster> getMonsters(Pageable pageable) {
        return monsterRepository.findAll(pageable);
    }

    @Transactional
    public Monster create(AdminMonsterRequest req) {
        Dungeon dungeon = dungeonRepository.findById(req.getDungeonId())
                .orElseThrow(() -> new ResourceNotFoundException("Dungeon", req.getDungeonId()));
        Monster monster = Monster.builder()
                .dungeon(dungeon)
                .name(req.getName())
                .monsterType(req.getMonsterType())
                .hp(req.getHp())
                .attackPower(req.getAttackPower())
                .expReward(req.getExpReward())
                .goldReward(req.getGoldReward())
                .toeicPart(req.getToeicPart())
                .difficulty(req.getDifficulty())
                .build();
        return monsterRepository.save(monster);
    }

    @Transactional
    public Monster update(Long id, AdminMonsterRequest req) {
        Monster m = monsterRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Monster", id));
        return m.update(req.getName(), req.getMonsterType(), req.getHp(),
                req.getAttackPower(), req.getExpReward(), req.getGoldReward(),
                req.getToeicPart(), req.getDifficulty());
    }

    @Transactional
    public void delete(Long id) {
        monsterRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Monster", id));
        monsterRepository.deleteById(id);
    }
}
