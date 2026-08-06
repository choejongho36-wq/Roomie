package com.example.backend.controller;

import com.example.backend.domain.User;
import com.example.backend.dto.ChatRequestCreateRequest;
import com.example.backend.repository.UserRepository;
import com.example.backend.service.ChatRequestService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/chat-requests")
@RequiredArgsConstructor
public class ChatRequestController {

    private final ChatRequestService chatRequestService;
    private final UserRepository userRepository;

    @PostMapping
    public void sendRequest(Authentication authentication, @RequestBody ChatRequestCreateRequest body) {
        chatRequestService.sendRequest(currentUser(authentication).getUserId(), body.targetUserId());
    }

    @PostMapping("/{requestId}/accept")
    public void accept(Authentication authentication, @PathVariable Long requestId) {
        chatRequestService.respond(currentUser(authentication).getUserId(), requestId, true);
    }

    @PostMapping("/{requestId}/decline")
    public void decline(Authentication authentication, @PathVariable Long requestId) {
        chatRequestService.respond(currentUser(authentication).getUserId(), requestId, false);
    }

    private User currentUser(Authentication authentication) {
        return userRepository.findByLoginId(authentication.getName())
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));
    }
}
