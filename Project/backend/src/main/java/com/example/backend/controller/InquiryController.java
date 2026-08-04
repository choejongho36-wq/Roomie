package com.example.backend.controller;

import com.example.backend.domain.User;
import com.example.backend.dto.InquiryAnswerRequest;
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

    // 공개 사이트(문의 게시판)에서 관리자 계정으로 직접 답변을 등록/수정할 수 있게 하는 엔드포인트.
    // 관리자 페이지(/admin/inquiries)의 답변 기능과 동일한 InquiryService.answer()를 공유한다.
    @PostMapping("/{inquiryId}/answer")
    public InquiryResponse answerInquiry(Authentication authentication, @PathVariable Long inquiryId,
            @RequestBody InquiryAnswerRequest request) {
        User user = findUser(authentication);
        if (!user.isAdmin()) {
            throw new IllegalArgumentException("관리자만 답변을 작성할 수 있습니다.");
        }
        return inquiryService.answer(inquiryId, request.answer());
    }

    @DeleteMapping("/{inquiryId}/answer")
    public InquiryResponse deleteAnswer(Authentication authentication, @PathVariable Long inquiryId) {
        User user = findUser(authentication);
        if (!user.isAdmin()) {
            throw new IllegalArgumentException("관리자만 답변을 삭제할 수 있습니다.");
        }
        return inquiryService.deleteAnswer(inquiryId);
    }

    private User findUser(Authentication authentication) {
        return userRepository.findByLoginId(authentication.getName())
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));
    }
}
