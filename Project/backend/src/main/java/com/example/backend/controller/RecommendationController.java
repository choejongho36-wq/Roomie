package com.example.backend.controller;

import com.example.backend.domain.User;
import com.example.backend.dto.RecommendationResponse;
import com.example.backend.repository.UserRepository;
import com.example.backend.service.CompatibilityService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/recommendations")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:5174")
public class RecommendationController {

    private final CompatibilityService compatibilityService;
    private final UserRepository userRepository;

    @GetMapping
    public List<RecommendationResponse> getRecommendations(Authentication authentication) {
        User user = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));
        return compatibilityService.recommendForUser(user.getUserId());
    }
}
