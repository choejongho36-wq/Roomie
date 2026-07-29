package com.example.backend.controller;

import com.example.backend.domain.User;
import com.example.backend.dto.InquiryRequest;
import com.example.backend.dto.InquiryResponse;
import com.example.backend.repository.UserRepository;
import com.example.backend.service.InquiryService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/inquiries")
@RequiredArgsConstructor
public class InquiryController {

    private final InquiryService inquiryService;
    private final UserRepository userRepository;

    @GetMapping
    public List<InquiryResponse> getInquiries() {
        return inquiryService.getInquiries();
    }

    @GetMapping("/{inquiryId}")
    public InquiryResponse getInquiry(@PathVariable Long inquiryId) {
        return inquiryService.getInquiry(inquiryId);
    }

    @PostMapping
    public InquiryResponse createInquiry(Authentication authentication, @RequestBody InquiryRequest request) {
        return inquiryService.create(findUser(authentication).getUserId(), request);
    }

    @PutMapping("/{inquiryId}")
    public InquiryResponse updateInquiry(Authentication authentication, @PathVariable Long inquiryId,
            @RequestBody InquiryRequest request) {
        return inquiryService.update(findUser(authentication).getUserId(), inquiryId, request);
    }

    @DeleteMapping("/{inquiryId}")
    public void deleteInquiry(Authentication authentication, @PathVariable Long inquiryId) {
        inquiryService.delete(findUser(authentication).getUserId(), inquiryId);
    }

    private User findUser(Authentication authentication) {
        return userRepository.findByLoginId(authentication.getName())
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));
    }
}
