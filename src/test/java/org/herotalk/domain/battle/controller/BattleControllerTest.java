package org.herotalk.domain.battle.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.herotalk.domain.battle.service.BattleService;
import org.herotalk.domain.battle.dto.BattleStartResponse;
import org.herotalk.domain.battle.dto.BattleTurnResponse;
import org.herotalk.domain.battle.entity.BattleTurn.TurnAction;
import org.herotalk.domain.user.entity.User;
import org.herotalk.security.CustomUserDetails;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Map;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.BDDMockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class BattleControllerTest {

    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper objectMapper;
    @MockBean BattleService battleService;

    @Test
    void POST_battles_start_성공() throws Exception {
        BattleStartResponse mockResp = BattleStartResponse.builder()
                .battleId(1L).monsterId(1L).monsterName("슬라임")
                .monsterMaxHp(200).monsterCurrentHp(200)
                .characterMaxHp(100).characterCurrentHp(100)
                .question(BattleStartResponse.QuestionDto.builder()
                        .id(1L).questionText("Describe.").prepTime(30).answerTime(45).build())
                .build();

        given(battleService.startBattle(anyLong(), anyLong())).willReturn(mockResp);

        mockMvc.perform(post("/api/battles/start")
                        .with(SecurityMockMvcRequestPostProcessors.user(
                                new CustomUserDetails(1L, "test@test.com", "", User.Role.USER, true)))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("monsterId", 1))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.battleId").value(1))
                .andExpect(jsonPath("$.data.monsterCurrentHp").value(200));
    }

    @Test
    void POST_battles_turn_성공() throws Exception {
        BattleTurnResponse mockResp = BattleTurnResponse.builder()
                .turnNumber(1).action(TurnAction.ATTACK).score(90)
                .damageDealt(16).damageTaken(8).isCritical(false)
                .monsterCurrentHp(184).characterCurrentHp(92)
                .battleEnded(false).build();

        given(battleService.processTurn(anyLong(), anyLong(), any())).willReturn(mockResp);

        mockMvc.perform(post("/api/battles/1/turn")
                        .with(SecurityMockMvcRequestPostProcessors.user(
                                new CustomUserDetails(1L, "test@test.com", "", User.Role.USER, true)))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("action", "ATTACK", "score", 90))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.damageDealt").value(16))
                .andExpect(jsonPath("$.data.battleEnded").value(false));
    }

    @Test
    void POST_battles_start_monsterId_없으면_400() throws Exception {
        mockMvc.perform(post("/api/battles/start")
                        .with(SecurityMockMvcRequestPostProcessors.user(
                                new CustomUserDetails(1L, "test@test.com", "", User.Role.USER, true)))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isBadRequest());
    }
}
