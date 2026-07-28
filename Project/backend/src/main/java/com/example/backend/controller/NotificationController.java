package com.example.backend.controller;

import com.example.backend.domain.User;
import com.example.backend.dto.NotificationResponse;
import com.example.backend.repository.UserRepository;
import com.example.backend.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:5174")
public class NotificationController {

    private final NotificationService notificationService;
    private final UserRepository userRepository;

    @GetMapping
    public List<NotificationResponse> getNotifications(Authentication authentication) {
        return notificationService.getNotifications(currentUser(authentication).getUserId());
    }

    @PatchMapping("/{notificationId}/read")
    public void markAsRead(Authentication authentication, @PathVariable Long notificationId) {
        notificationService.markAsRead(currentUser(authentication).getUserId(), notificationId);
    }

    private User currentUser(Authentication authentication) {
        return userRepository.findByLoginId(authentication.getName())
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));
    }
}
