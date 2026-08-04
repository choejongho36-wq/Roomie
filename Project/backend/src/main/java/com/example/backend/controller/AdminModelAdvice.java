package com.example.backend.controller;

import com.example.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ModelAttribute;

// 관리자 페이지(Thymeleaf) 사이드바 하단 "Logged in as" 표시용. AdminController의 GET
// 메서드마다 model.addAttribute("adminNickname", ...)을 반복하지 않도록 여기서 한 번에 채워준다.
@ControllerAdvice(assignableTypes = AdminController.class)
@RequiredArgsConstructor
public class AdminModelAdvice {

    private final UserRepository userRepository;

    @ModelAttribute("adminNickname")
    public String adminNickname(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return "관리자";
        }
        return userRepository.findByLoginId(authentication.getName())
                .map(user -> user.getNickname())
                .orElse("관리자");
    }
}
