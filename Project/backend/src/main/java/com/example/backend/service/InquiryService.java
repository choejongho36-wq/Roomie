package com.example.backend.service;

import com.example.backend.domain.Inquiry;
import com.example.backend.domain.User;
import com.example.backend.dto.InquiryRequest;
import com.example.backend.dto.InquiryResponse;
import com.example.backend.repository.InquiryRepository;
import com.example.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class InquiryService {

    private static final Set<String> VALID_CATEGORIES = Set.of("버그", "신고", "문의", "제안");

    private final InquiryRepository inquiryRepository;
    private final UserRepository userRepository;

    public List<InquiryResponse> getInquiries() {
        List<Inquiry> inquiries = inquiryRepository.findAllByOrderByCreatedAtDesc();
        Map<Long, String> nicknames = nicknamesOf(inquiries.stream().map(Inquiry::getUserId).toList());
        return inquiries.stream().map(i -> toResponse(i, nicknames.get(i.getUserId()))).toList();
    }

    public InquiryResponse getInquiry(Long inquiryId) {
        Inquiry inquiry = findInquiry(inquiryId);
        return toResponse(inquiry, nicknameOf(inquiry.getUserId()));
    }

    public InquiryResponse create(Long userId, InquiryRequest request) {
        validate(request);
        Inquiry inquiry = inquiryRepository.save(
                new Inquiry(userId, request.title(), request.category(), request.content()));
        return toResponse(inquiry, nicknameOf(userId));
    }

    public InquiryResponse update(Long userId, Long inquiryId, InquiryRequest request) {
        validate(request);
        Inquiry inquiry = findInquiry(inquiryId);
        if (!inquiry.getUserId().equals(userId)) {
            throw new IllegalArgumentException("본인이 작성한 문의만 수정할 수 있습니다.");
        }
        inquiry.update(request.title(), request.category(), request.content());
        return toResponse(inquiry, nicknameOf(userId));
    }

    public void delete(Long userId, Long inquiryId) {
        Inquiry inquiry = findInquiry(inquiryId);
        if (!inquiry.getUserId().equals(userId)) {
            throw new IllegalArgumentException("본인이 작성한 문의만 삭제할 수 있습니다.");
        }
        inquiryRepository.delete(inquiry);
    }

    private Inquiry findInquiry(Long inquiryId) {
        return inquiryRepository.findById(inquiryId)
                .orElseThrow(() -> new IllegalArgumentException("문의를 찾을 수 없습니다."));
    }

    private void validate(InquiryRequest request) {
        if (request.title() == null || request.title().isBlank()) {
            throw new IllegalArgumentException("제목을 입력해주세요.");
        }
        if (request.content() == null || request.content().isBlank()) {
            throw new IllegalArgumentException("문의 내용을 입력해주세요.");
        }
        if (request.category() == null || !VALID_CATEGORIES.contains(request.category())) {
            throw new IllegalArgumentException("분류를 선택해주세요.");
        }
    }

    private String nicknameOf(Long userId) {
        return userRepository.findById(userId).map(User::getNickname).orElse("알 수 없음");
    }

    private Map<Long, String> nicknamesOf(List<Long> userIds) {
        return userRepository.findAllById(userIds).stream()
                .collect(Collectors.toMap(User::getUserId, User::getNickname));
    }

    private InquiryResponse toResponse(Inquiry i, String nickname) {
        return new InquiryResponse(
                i.getInquiryId(), i.getUserId(), nickname, i.getTitle(), i.getCategory(), i.getContent(),
                i.getStatus(), i.getAnswer(), i.getCreatedAt(), i.getAnsweredAt()
        );
    }
}
