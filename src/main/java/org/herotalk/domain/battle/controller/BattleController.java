package org.herotalk.domain.battle.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.herotalk.domain.battle.dto.BattleStartRequest;
import org.herotalk.domain.battle.dto.BattleStartResponse;
import org.herotalk.domain.battle.dto.BattleTurnRequest;
import org.herotalk.domain.battle.dto.BattleTurnResponse;
import org.herotalk.domain.battle.service.BattleService;
import org.herotalk.global.response.ApiResponse;
import org.herotalk.security.CustomUserDetails;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/battles")
@RequiredArgsConstructor
public class BattleController {

    private final BattleService battleService;

    @PostMapping("/start")
    public ResponseEntity<ApiResponse<BattleStartResponse>> startBattle(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @Valid @RequestBody BattleStartRequest request) {
        BattleStartResponse response = battleService.startBattle(
                userDetails.getUserId(), request.getMonsterId());
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(response));
    }

    @PostMapping("/{battleId}/turn")
    public ResponseEntity<ApiResponse<BattleTurnResponse>> processTurn(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable Long battleId,
            @Valid @RequestBody BattleTurnRequest request) {
        BattleTurnResponse response = battleService.processTurn(
                userDetails.getUserId(), battleId, request);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }
}
