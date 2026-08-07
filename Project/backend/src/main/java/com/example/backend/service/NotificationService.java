package com.example.backend.service;

import com.example.backend.domain.Notification;
import com.example.backend.domain.User;
import com.example.backend.dto.NotificationResponse;
import com.example.backend.repository.NotificationRepository;
import com.example.backend.repository.UserRepository;
import com.example.backend.websocket.WebSocketSessionRegistry;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private static final int PREVIEW_LENGTH = 50;

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;
    private final WebSocketSessionRegistry sessionRegistry;

    public void createChatNotification(Long recipientId, Long senderId, String content) {
        saveAndPush(recipientId, senderId, content, "CHAT", null);
    }

    public void createCommentReplyNotification(Long recipientId, Long senderId, String content, Long postId) {
        saveAndPush(recipientId, senderId, content, "COMMENT_REPLY", postId);
    }

    public void createChatRequestNotification(Long recipientId, Long senderId, String content, Long requestId) {
        saveAndPush(recipientId, senderId, content, "CHAT_REQUEST", requestId);
    }

    public void createChatAcceptedNotification(Long recipientId, Long senderId, String content) {
        saveAndPush(recipientId, senderId, content, "CHAT_ACCEPTED", null);
    }

    public void createHouseDisbandedNotification(Long recipientId, Long senderId, String content) {
        saveAndPush(recipientId, senderId, content, "HOUSE_DISBANDED", null);
    }

    // 저장 직후, 받는 사람이 지금 웹소켓에 연결돼 있으면 바로 알림 프레임을 밀어넣는다
    // (연결이 안 돼 있으면 조용히 무시 — 다음 로그인/새로고침 때 REST로 받아간다).
    private void saveAndPush(Long recipientId, Long senderId, String content, String type, Long targetId) {
        Notification saved = notificationRepository.save(new Notification(recipientId, senderId, preview(content), type, targetId));
        userRepository.findById(senderId).ifPresent(sender -> sessionRegistry.send(recipientId, new NotificationResponse(
                saved.getNotificationId(),
                sender.getUserId(),
                sender.getNickname(),
                sender.getProfileImageUrl(),
                saved.getContent(),
                saved.getType(),
                saved.getTargetId(),
                saved.isRead(),
                saved.getCreatedAt())));
    }

    private String preview(String content) {
        return content.length() > PREVIEW_LENGTH ? content.substring(0, PREVIEW_LENGTH) + "..." : content;
    }

    public List<NotificationResponse> getNotifications(Long userId) {
        List<Notification> notifications = notificationRepository.findByRecipientIdOrderByCreatedAtDesc(userId);

        Map<Long, User> senders = userRepository.findAllById(
                notifications.stream().map(Notification::getSenderId).distinct().toList()
        ).stream().collect(Collectors.toMap(User::getUserId, user -> user));

        return notifications.stream()
                .filter(notification -> senders.containsKey(notification.getSenderId()))
                .map(notification -> {
                    User sender = senders.get(notification.getSenderId());
                    return new NotificationResponse(
                            notification.getNotificationId(),
                            sender.getUserId(),
                            sender.getNickname(),
                            sender.getProfileImageUrl(),
                            notification.getContent(),
                            notification.getType(),
                            notification.getTargetId(),
                            notification.isRead(),
                            notification.getCreatedAt());
                })
                .toList();
    }

    public void markAsRead(Long userId, Long notificationId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new IllegalArgumentException("알림을 찾을 수 없습니다."));
        if (!notification.getRecipientId().equals(userId)) {
            throw new IllegalArgumentException("본인의 알림만 읽음 처리할 수 있습니다.");
        }
        notification.markAsRead();
        notificationRepository.save(notification);
    }

    public void deleteNotification(Long userId, Long notificationId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new IllegalArgumentException("알림을 찾을 수 없습니다."));
        if (!notification.getRecipientId().equals(userId)) {
            throw new IllegalArgumentException("본인의 알림만 삭제할 수 있습니다.");
        }
        notificationRepository.delete(notification);
    }

    @Transactional
    public void deleteAllNotifications(Long userId) {
        notificationRepository.deleteByRecipientId(userId);
    }
}
