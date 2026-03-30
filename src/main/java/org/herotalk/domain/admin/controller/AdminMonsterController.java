package org.herotalk.domain.admin.controller;

import lombok.RequiredArgsConstructor;
import org.herotalk.domain.admin.dto.AdminMonsterRequest;
import org.herotalk.domain.admin.service.AdminMonsterService;
import org.herotalk.domain.dungeon.entity.Monster;
import org.herotalk.global.response.ApiResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/monsters")
@RequiredArgsConstructor
public class AdminMonsterController {

    private final AdminMonsterService adminMonsterService;

    @GetMapping
    public ResponseEntity<ApiResponse<Page<Monster>>> getMonsters(
            @PageableDefault(size = 20) Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.ok(adminMonsterService.getMonsters(pageable)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<Monster>> create(@RequestBody AdminMonsterRequest req) {
        return ResponseEntity.ok(ApiResponse.ok(adminMonsterService.create(req)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<Monster>> update(
            @PathVariable Long id, @RequestBody AdminMonsterRequest req) {
        return ResponseEntity.ok(ApiResponse.ok(adminMonsterService.update(id, req)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        adminMonsterService.delete(id);
        return ResponseEntity.ok(ApiResponse.ok(null));
    }
}
