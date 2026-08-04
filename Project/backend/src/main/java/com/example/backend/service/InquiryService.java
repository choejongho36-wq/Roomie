package com.example.backend.service;

import com.example.backend.domain.Inquiry;
import com.example.backend.domain.User;
import com.example.backend.dto.InquiryRequest;
import com.example.backend.dto.InquiryResponse;
import com.example.backend.repository.InquiryRepository;
import com.example.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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

    public List<InquiryResponse> getInquiries(Long viewerUserId, boolean viewerIsAdmin) {
        List<Inquiry> inquiries = inquiryRepository.findAllByOrderByCreatedAtDesc();
        Map<Long, User> authors = authorsOf(inquiries.stream().map(Inquiry::getUserId).toList());
        return inquiries.stream()
                .map(i -> toResponse(i, authors.get(i.getUserId()), viewerUserId, viewerIsAdmin))
                .toList();
    }

    public InquiryResponse getInquiry(Long inquiryId, Long viewerUserId, boolean viewerIsAdmin) {
        Inquiry inquiry = findInquiry(inquiryId);
        return toResponse(inquiry, authorOf(inquiry.getUserId()), viewerUserId, viewerIsAdmin);
    }

    public InquiryResponse create(Long userId, InquiryRequest request) {
        validate(request);
        Inquiry inquiry = inquiryRepository.save(
                new Inquiry(userId, request.title(), request.category(), request.content(), request.secret()));
        return toResponse(inquiry, authorOf(userId), userId, false);
    }

    public InquiryResponse update(Long userId, Long inquiryId, InquiryRequest request) {
        validate(request);
        Inquiry inquiry = findInquiry(inquiryId);
        if (!inquiry.getUserId().equals(userId)) {
            throw new IllegalArgumentException("본인이 작성한 문의만 수정할 수 있습니다.");
        }
        inquiry.update(request.title(), request.category(), request.content(), request.secret());
        return toResponse(inquiry, authorOf(userId), userId, false);
    }

    public void delete(Long userId, Long inquiryId) {
        Inquiry inquiry = findInquiry(inquiryId);
        if (!inquiry.getUserId().equals(userId)) {
            throw new IllegalArgumentException("본인이 작성한 문의만 삭제할 수 있습니다.");
        }
        inquiryRepository.delete(inquiry);
    }

    // 관리자 전용. 공개 사이트(문의 게시판)와 관리자 페이지(/admin/inquiries) 양쪽에서 공용으로 쓴다.
    public InquiryResponse answer(Long inquiryId, String answer) {
        if (answer == null || answer.isBlank()) {
            throw new IllegalArgumentException("답변 내용을 입력해주세요.");
        }
        Inquiry inquiry = findInquiry(inquiryId);
        inquiry.answer(answer);
        // 관리자만 호출 가능한 엔드포인트라 viewerIsAdmin=true로 항상 전체 내용을 반환한다.
        return toResponse(inquiry, authorOf(inquiry.getUserId()), null, true);
    }

    // 관리자 전용 수정. 작성자 본인 여부를 따지지 않는다는 점만 update()와 다르다.
    // 엔티티 수정 내용이 트랜잭션 커밋 시점에 반영되도록 @Transactional 필수.
    @Transactional
    public InquiryResponse adminUpdate(Long inquiryId, InquiryRequest request) {
        validate(request);
        Inquiry inquiry = findInquiry(inquiryId);
        inquiry.update(request.title(), request.category(), request.content());
        return toResponse(inquiry, authorOf(inquiry.getUserId()), null, true);
    }

    // 관리자 전용 삭제. 작성자 본인 여부를 따지지 않는다는 점만 delete()와 다르다.
    @Transactional
    public void adminDelete(Long inquiryId) {
        Inquiry inquiry = findInquiry(inquiryId);
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

    private User authorOf(Long userId) {
        return userRepository.findById(userId).orElse(null);
    }

    private Map<Long, User> authorsOf(List<Long> userIds) {
        return userRepository.findAllById(userIds).stream()
                .collect(Collectors.toMap(User::getUserId, u -> u));
    }

    // 비밀글이면 작성자 본인과 관리자 외에는 content/answer를 감춘다.
    private InquiryResponse toResponse(Inquiry i, User author, Long viewerUserId, boolean viewerIsAdmin) {
        String nickname = author != null ? author.getNickname() : "알 수 없음";
        String profileImageUrl = author != null ? author.getProfileImageUrl() : null;
        boolean canView = viewerIsAdmin || i.getUserId().equals(viewerUserId);
        boolean hidden = i.isSecret() && !canView;
        return new InquiryResponse(
                i.getInquiryId(), i.getUserId(), nickname, profileImageUrl, i.getTitle(), i.getCategory(),
                hidden ? null : i.getContent(),
                i.getStatus(),
                hidden ? null : i.getAnswer(),
                i.getCreatedAt(), i.getAnsweredAt(), i.isSecret()
        );
    }
}
