package org.herotalk.domain.dungeon.controller;

import org.herotalk.domain.dungeon.entity.Dungeon;
import org.herotalk.domain.dungeon.entity.Monster;
import org.herotalk.domain.dungeon.repository.DungeonRepository;
import org.herotalk.domain.dungeon.repository.MonsterRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class DungeonControllerTest {

    @Autowired MockMvc mockMvc;
    @Autowired DungeonRepository dungeonRepository;
    @Autowired MonsterRepository monsterRepository;

    private Dungeon savedDungeon;

    @BeforeEach
    void setUp() {
        savedDungeon = dungeonRepository.save(Dungeon.builder()
                .name("초보자 숲")
                .toeicPart(Dungeon.ToeicPart.PART2)
                .requiredLevel(1)
                .region("초보자 숲")
                .build());

        monsterRepository.save(Monster.builder()
                .dungeon(savedDungeon)
                .name("슬라임")
                .monsterType(Monster.MonsterType.NORMAL)
                .hp(200)
                .attackPower(10)
                .expReward(100)
                .goldReward(15)
                .toeicPart(Dungeon.ToeicPart.PART2)
                .difficulty(1)
                .build());
    }

    @Test
    void getDungeons_returnsList() throws Exception {
        mockMvc.perform(get("/api/dungeons"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data").isArray());
    }

    @Test
    void getMonsters_returnsMonsterList() throws Exception {
        mockMvc.perform(get("/api/dungeons/{id}/monsters", savedDungeon.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data").isArray())
                .andExpect(jsonPath("$.data[0].name").value("슬라임"));
    }

    @Test
    void getMonsters_notFound_returns404() throws Exception {
        mockMvc.perform(get("/api/dungeons/99999/monsters"))
                .andExpect(status().isNotFound());
    }
}
