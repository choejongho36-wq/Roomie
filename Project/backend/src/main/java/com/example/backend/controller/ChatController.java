package com.example.backend.controller;

import com.example.backend.domain.User;
import com.example.backend.dto.ChatMessageResponse;
import com.example.backend.dto.ChatStatusResponse;
import com.example.backend.dto.ConversationResponse;
import com.example.backend.repository.UserRepository;
import com.example.backend.service.ChatService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/chat")
@RequiredArgsConstructor
public class ChatController {

    private final ChatService chatService;
    private final UserRepository userRepository;

    @GetMapping("/conversations")
    public List<ConversationResponse> getConversations(Authentication authentication) {
        return chatService.getConversations(currentUser(authentication).getUserId());
    }

    @GetMapping("/{otherUserId}/messages")
    public List<ChatMessageResponse> getMessages(Authentication authentication, @PathVariable Long otherUserId) {
        return chatService.getMessages(currentUser(authentication).getUserId(), otherUserId);
    }

    @GetMapping("/{otherUserId}/status")
    public ChatStatusResponse getStatus(Authentication authentication, @PathVariable Long otherUserId) {
        Long userId = currentUser(authentication).getUserId();
        return new ChatStatusResponse(chatService.isLeftByPartner(userId, otherUserId));
    }

    @PostMapping("/{otherUserId}/leave")
    public void leaveConversation(Authentication authentication, @PathVariable Long otherUserId) {
        chatService.leaveConversation(currentUser(authentication).getUserId(), otherUserId);
    }

    private User currentUser(Authentication authentication) {
        return userRepository.findByLoginId(authentication.getName())
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));
    }
}
