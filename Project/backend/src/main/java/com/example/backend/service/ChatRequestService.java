package com.example.backend.service;

import com.example.backend.domain.ChatRequest;
import com.example.backend.domain.MatchedPair;
import com.example.backend.domain.User;
import com.example.backend.repository.ChatRequestRepository;
import com.example.backend.repository.MatchedPairRepository;
import com.example.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class ChatRequestService {

    private final ChatRequestRepository chatRequestRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;
    private final MatchedPairRepository matchedPairRepository;

    @Transactional
    public void sendRequest(Long requesterId, Long targetId) {
        if (targetId == null || requesterId.equals(targetId)) {
            throw new IllegalArgumentException("올바르지 않은 상대입니다.");
        }
        User requester = userRepository.findById(requesterId)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));
        if (!userRepository.existsById(targetId)) {
            throw new IllegalArgumentException("상대를 찾을 수 없습니다.");
        }
        // 이미 하우스가 확정된 사람은 (나든 상대든) 새 채팅 신청을 주고받을 수 없음
        if (matchedPairRepository.existsByUserIdAndStatus(requesterId, MatchedPair.STATUS_CONFIRMED)) {
            throw new IllegalArgumentException("이미 하우스가 확정되어 새로운 채팅을 신청할 수 없습니다.");
        }
        if (matchedPairRepository.existsByUserIdAndStatus(targetId, MatchedPair.STATUS_CONFIRMED)) {
            throw new IllegalArgumentException("이미 하우스가 확정된 상대예요.");
        }
        if (chatRequestRepository.existsAcceptedBetween(requesterId, targetId)) {
            throw new IllegalArgumentException("이미 채팅이 가능한 상대입니다.");
        }
        if (chatRequestRepository.existsByRequesterIdAndTargetIdAndStatus(requesterId, targetId, "PENDING")) {
            throw new IllegalArgumentException("이미 채팅 신청을 보냈습니다.");
        }

        ChatRequest saved = chatRequestRepository.save(new ChatRequest(requesterId, targetId));
        notificationService.createChatRequestNotification(
                targetId, requesterId, requester.getNickname() + "님이 채팅을 신청했습니다.", saved.getChatRequestId());
    }

    @Transactional
    public void respond(Long targetId, Long requestId, boolean accept) {
        ChatRequest request = chatRequestRepository.findById(requestId)
                .orElseThrow(() -> new IllegalArgumentException("신청을 찾을 수 없습니다."));
        if (!request.getTargetId().equals(targetId)) {
            throw new IllegalArgumentException("본인에게 온 신청만 응답할 수 있습니다.");
        }
        if (!"PENDING".equals(request.getStatus())) {
            throw new IllegalArgumentException("이미 처리된 신청입니다.");
        }

        if (accept) {
            request.accept();
            User target = userRepository.findById(targetId)
                    .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));
            notificationService.createChatAcceptedNotification(
                    request.getRequesterId(), targetId, target.getNickname() + "님이 채팅 신청을 수락했습니다.");
        } else {
            request.decline();
        }
    }
}
