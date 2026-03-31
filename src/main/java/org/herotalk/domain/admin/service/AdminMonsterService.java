package org.herotalk.domain.admin.service;

import lombok.RequiredArgsConstructor;
import org.apache.commons.csv.CSVFormat;
import org.apache.commons.csv.CSVParser;
import org.apache.commons.csv.CSVRecord;
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
import org.springframework.web.multipart.MultipartFile;

import java.io.InputStreamReader;
import java.io.Reader;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;

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

    @Transactional
    public int uploadCsv(MultipartFile file) {
        try (Reader reader = new InputStreamReader(file.getInputStream(), StandardCharsets.UTF_8);
             CSVParser parser = CSVFormat.DEFAULT
                     .builder()
                     .setHeader()
                     .setSkipHeaderRecord(true)
                     .setTrim(true)
                     .setIgnoreEmptyLines(true)
                     .build()
                     .parse(reader)) {

            List<Monster> monsters = new ArrayList<>();
            for (CSVRecord record : parser) {
                long dungeonId = Long.parseLong(record.get("dungeonId"));
                Dungeon dungeon = dungeonRepository.findById(dungeonId)
                        .orElseThrow(() -> new ResourceNotFoundException("Dungeon", dungeonId));

                String diffRaw = record.isMapped("difficulty") ? record.get("difficulty") : "";
                int difficulty = (diffRaw == null || diffRaw.isBlank()) ? 1 : Integer.parseInt(diffRaw.trim());

                monsters.add(Monster.builder()
                        .dungeon(dungeon)
                        .name(record.get("name"))
                        .monsterType(Monster.MonsterType.valueOf(record.get("monsterType").toUpperCase()))
                        .hp(Integer.parseInt(record.get("hp")))
                        .attackPower(Integer.parseInt(record.get("attackPower")))
                        .expReward(Integer.parseInt(record.get("expReward")))
                        .goldReward(Integer.parseInt(record.get("goldReward")))
                        .toeicPart(Dungeon.ToeicPart.valueOf(record.get("toeicPart").toUpperCase()))
                        .difficulty(difficulty)
                        .build());
            }

            monsterRepository.saveAll(monsters);
            return monsters.size();

        } catch (Exception e) {
            throw new IllegalArgumentException("CSV 파싱 실패: " + e.getMessage(), e);
        }
    }
}
