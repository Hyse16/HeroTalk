package org.herotalk.domain.dungeon.controller;

import lombok.RequiredArgsConstructor;
import org.herotalk.domain.dungeon.dto.DungeonResponse;
import org.herotalk.domain.dungeon.dto.MonsterResponse;
import org.herotalk.domain.dungeon.service.DungeonService;
import org.herotalk.global.response.ApiResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/dungeons")
@RequiredArgsConstructor
public class DungeonController {
    private final DungeonService dungeonService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<DungeonResponse>>> getDungeons() {
        return ResponseEntity.ok(ApiResponse.ok(dungeonService.getAllDungeons()));
    }

    @GetMapping("/{dungeonId}/monsters")
    public ResponseEntity<ApiResponse<List<MonsterResponse>>> getMonsters(@PathVariable Long dungeonId) {
        return ResponseEntity.ok(ApiResponse.ok(dungeonService.getMonstersByDungeon(dungeonId)));
    }
}
