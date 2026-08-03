package com.example.backend.service;

import com.example.backend.domain.Notification;
import com.example.backend.domain.User;
import com.example.backend.dto.NotificationResponse;
import com.example.backend.repository.NotificationRepository;
import com.example.backend.repository.UserRepository;
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

    public void createChatNotification(Long recipientId, Long senderId, String content) {
        notificationRepository.save(new Notification(recipientId, senderId, preview(content), "CHAT", null));
    }

    public void createCommentReplyNotification(Long recipientId, Long senderId, String content, Long postId) {
        notificationRepository.save(new Notification(recipientId, senderId, preview(content), "COMMENT_REPLY", postId));
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
