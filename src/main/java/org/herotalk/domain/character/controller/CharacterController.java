package org.herotalk.domain.character.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.herotalk.domain.character.dto.CharacterCreateRequest;
import org.herotalk.domain.character.dto.CharacterResponse;
import org.herotalk.domain.character.dto.StatAllocateRequest;
import org.herotalk.domain.character.service.CharacterService;
import org.herotalk.global.response.ApiResponse;
import org.herotalk.security.CustomUserDetails;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/characters")
@RequiredArgsConstructor
public class CharacterController {

    private final CharacterService characterService;

    @PostMapping
    public ResponseEntity<ApiResponse<CharacterResponse>> createCharacter(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @Valid @RequestBody CharacterCreateRequest request) {
        CharacterResponse response = characterService.createCharacter(userDetails.getUserId(), request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(response));
    }

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<CharacterResponse>> getCharacter(
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        CharacterResponse response = characterService.getCharacter(userDetails.getUserId());
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PatchMapping("/me/stats")
    public ResponseEntity<ApiResponse<CharacterResponse>> allocateStat(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @Valid @RequestBody StatAllocateRequest request) {
        CharacterResponse response = characterService.allocateStat(
                userDetails.getUserId(), request.getStatName(), request.getAmount());
        return ResponseEntity.ok(ApiResponse.ok(response));
    }
}
