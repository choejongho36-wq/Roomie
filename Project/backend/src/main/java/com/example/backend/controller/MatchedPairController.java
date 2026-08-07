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

    // 매칭 페어 화면에서 "하우스로 이동"을 누르면 호출 (SEARCHING -> CONFIRMED)
    @PutMapping("/{id}/confirm")
    public ResponseEntity<MatchedPairResponse> confirm(Authentication authentication, @PathVariable Long id) {
        User me = findUser(authentication);
        return ResponseEntity.ok(matchedPairService.confirm(id, me.getUserId()));
    }

    // 네비바 "하우스" 메뉴 클릭 시 내가 확정한 하우스를 찾을 때 사용
    // (확정된 하우스가 없으면 에러가 아니라 204로 응답 — 대부분의 사용자에게 정상 상태이기 때문)
    @GetMapping("/me/confirmed")
    public ResponseEntity<MatchedPairResponse> getMyConfirmed(Authentication authentication) {
        User me = findUser(authentication);
        return matchedPairService.getMyConfirmedHouse(me.getUserId())
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.noContent().build());
    }

    // 채팅방 진입 시, 이 상대와 이미 페어가 있는지(그리고 확정됐는지) 조회만 할 때 사용
    // (createOrGet과 달리 페어를 새로 만들지 않음 — 채팅방을 열기만 해도 페어가 생기면 안 되므로)
    @GetMapping("/by-partner/{partnerUserId}")
    public ResponseEntity<MatchedPairResponse> getByPartner(Authentication authentication, @PathVariable Long partnerUserId) {
        User me = findUser(authentication);
        return matchedPairService.getByPartner(me.getUserId(), partnerUserId)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.noContent().build());
    }

    // 하우스 화면의 "하우스 해산" 버튼을 누르면 호출. 매칭 페어를 삭제해 두 사람 모두 하우스에서 나가진다.
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> disband(Authentication authentication, @PathVariable Long id) {
        User me = findUser(authentication);
        matchedPairService.disband(id, me.getUserId());
        return ResponseEntity.noContent().build();
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
    if (authentication == null) {
        throw new IllegalArgumentException("로그인이 필요합니다.");
    }
    return userRepository.findByLoginId(authentication.getName())
            .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));
}
}