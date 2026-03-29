package org.herotalk.domain.quest.controller;

import lombok.RequiredArgsConstructor;
import org.herotalk.domain.character.dto.CharacterResponse;
import org.herotalk.domain.quest.dto.QuestResponse;
import org.herotalk.domain.quest.service.QuestService;
import org.herotalk.global.response.ApiResponse;
import org.herotalk.security.CustomUserDetails;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/quests")
@RequiredArgsConstructor
public class QuestController {

    private final QuestService questService;

    @GetMapping("/today")
    public ResponseEntity<ApiResponse<List<QuestResponse>>> getTodayQuests(
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        List<QuestResponse> quests = questService.getTodayQuests(userDetails.getUserId());
        return ResponseEntity.ok(ApiResponse.ok(quests));
    }

    @PostMapping("/{id}/claim")
    public ResponseEntity<ApiResponse<CharacterResponse>> claimReward(
            @PathVariable Long id,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        CharacterResponse response = questService.claimReward(userDetails.getUserId(), id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }
}
