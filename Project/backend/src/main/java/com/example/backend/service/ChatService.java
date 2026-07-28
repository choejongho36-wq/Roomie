package com.example.backend.service;

import com.example.backend.domain.ChatMessage;
import com.example.backend.domain.User;
import com.example.backend.dto.ChatMessageResponse;
import com.example.backend.dto.ConversationResponse;
import com.example.backend.repository.ChatMessageRepository;
import com.example.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ChatService {

    private static final int MAX_CONTENT_LENGTH = 1000;

    private final ChatMessageRepository chatMessageRepository;
    private final UserRepository userRepository;

    public List<ConversationResponse> getConversations(Long userId) {
        List<ChatMessage> messages =
                chatMessageRepository.findBySenderIdOrReceiverIdOrderByCreatedAtDesc(userId, userId);

        Map<Long, ChatMessage> lastMessageByPartner = new LinkedHashMap<>();
        for (ChatMessage message : messages) {
            Long partnerId = message.getSenderId().equals(userId) ? message.getReceiverId() : message.getSenderId();
            lastMessageByPartner.putIfAbsent(partnerId, message);
        }

        Map<Long, User> partners = userRepository.findAllById(lastMessageByPartner.keySet()).stream()
                .collect(Collectors.toMap(User::getUserId, user -> user));

        return lastMessageByPartner.entrySet().stream()
                .filter(entry -> partners.containsKey(entry.getKey()))
                .map(entry -> {
                    User partner = partners.get(entry.getKey());
                    ChatMessage lastMessage = entry.getValue();
                    return new ConversationResponse(
                            partner.getUserId(),
                            partner.getNickname(),
                            partner.getProfileImageUrl(),
                            lastMessage.getContent(),
                            lastMessage.getCreatedAt());
                })
                .toList();
    }

    public List<ChatMessageResponse> getMessages(Long userId, Long otherUserId) {
        return chatMessageRepository
                .findBySenderIdAndReceiverIdOrSenderIdAndReceiverIdOrderByCreatedAtAsc(
                        userId, otherUserId, otherUserId, userId)
                .stream()
                .map(ChatService::toResponse)
                .toList();
    }

    public ChatMessageResponse saveMessage(Long senderId, Long receiverId, String content) {
        if (receiverId == null || senderId.equals(receiverId)) {
            throw new IllegalArgumentException("올바르지 않은 대화 상대입니다.");
        }
        String trimmed = content == null ? "" : content.trim();
        if (trimmed.isEmpty()) {
            throw new IllegalArgumentException("메시지 내용을 입력해주세요.");
        }
        if (trimmed.length() > MAX_CONTENT_LENGTH) {
            throw new IllegalArgumentException("메시지는 " + MAX_CONTENT_LENGTH + "자를 넘을 수 없습니다.");
        }
        if (!userRepository.existsById(receiverId)) {
            throw new IllegalArgumentException("대화 상대를 찾을 수 없습니다.");
        }

        ChatMessage saved = chatMessageRepository.save(new ChatMessage(senderId, receiverId, trimmed));
        return toResponse(saved);
    }

    private static ChatMessageResponse toResponse(ChatMessage message) {
        return new ChatMessageResponse(
                message.getMessageId(),
                message.getSenderId(),
                message.getReceiverId(),
                message.getContent(),
                message.getCreatedAt());
    }
}
