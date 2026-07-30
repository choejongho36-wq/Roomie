package com.example.backend.controller;

import com.example.backend.domain.User;
import com.example.backend.dto.MatchedPairConditionsRequest;
import com.example.backend.dto.MatchedPairCreateRequest;
import com.example.backend.dto.MatchedPairResponse;
import com.example.backend.repository.UserRepository;
import com.example.backend.service.MatchedPairService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/matched-pairs")
@RequiredArgsConstructor
public class MatchedPairController {

    private final MatchedPairService matchedPairService;
    private final UserRepository userRepository;

    // 채팅방에서 "룸메이트 확정" 버튼을 눌렀을 때 호출
    @PostMapping
    public ResponseEntity<MatchedPairResponse> create(
            Authentication authentication,
            @Valid @RequestBody MatchedPairCreateRequest request
    ) {
        User me = findUser(authentication);
        return ResponseEntity.ok(matchedPairService.createOrGet(me.getUserId(), request.partnerUserId()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<MatchedPairResponse> get(Authentication authentication, @PathVariable Long id) {
        User me = findUser(authentication);
        return ResponseEntity.ok(matchedPairService.getById(id, me.getUserId()));
    }

    // 공동 방 탐색 화면에서 희망지역/예산/입주희망일 같은 공통 조건을 저장할 때 사용
    @PutMapping("/{id}/conditions")
    public ResponseEntity<MatchedPairResponse> updateConditions(
            Authentication authentication,
            @PathVariable Long id,
            @RequestBody MatchedPairConditionsRequest request
    ) {
        User me = findUser(authentication);
        return ResponseEntity.ok(matchedPairService.updateConditions(id, me.getUserId(), request));
    }

    private User findUser(Authentication authentication) {
        return userRepository.findByLoginId(authentication.getName())
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));
    }
}