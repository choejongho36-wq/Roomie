package com.example.backend.websocket;

import com.example.backend.dto.ChatMessageResponse;
import com.example.backend.service.ChatService;
import com.example.backend.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;
import tools.jackson.databind.ObjectMapper;

import java.util.Map;

@Component
@RequiredArgsConstructor
public class ChatWebSocketHandler extends TextWebSocketHandler {

    private final ChatService chatService;
    private final NotificationService notificationService;
    private final WebSocketSessionRegistry sessionRegistry;
    private final ObjectMapper objectMapper;

    @Override
    public void afterConnectionEstablished(WebSocketSession session) {
        Long userId = userIdOf(session);
        if (userId != null) {
            sessionRegistry.register(userId, session);
        }
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) {
        Long userId = userIdOf(session);
        if (userId != null) {
            sessionRegistry.unregister(userId, session);
        }
    }

    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) throws Exception {
        Long senderId = userIdOf(session);
        if (senderId == null) return;

        try {
            IncomingMessage incoming = objectMapper.readValue(message.getPayload(), IncomingMessage.class);
            ChatMessageResponse saved = chatService.saveMessage(senderId, incoming.toUserId(), incoming.content());
            String json = objectMapper.writeValueAsString(saved);

            if (session.isOpen()) {
                session.sendMessage(new TextMessage(json));
            }
            sessionRegistry.send(saved.receiverId(), saved);

            // 알림 생성은 부가 기능이라, 여기서 실패해도 이미 보낸 메시지나 소켓 연결에는
            // 영향을 주면 안 된다 (실패 시 커넥션이 통째로 끊기던 문제의 원인이었음).
            try {
                notificationService.createChatNotification(saved.receiverId(), saved.senderId(), saved.content());
            } catch (Exception ignored) {
            }
        } catch (IllegalArgumentException e) {
            if (session.isOpen()) {
                session.sendMessage(new TextMessage(objectMapper.writeValueAsString(Map.of("error", e.getMessage()))));
            }
        } catch (Exception e) {
            // 여기서 뭐가 터지든 세션 자체는 살려둔다 — 메시지 하나 처리 실패로
            // 소켓 연결이 통째로 끊기면 사용자가 대화를 아예 이어갈 수 없다.
            if (session.isOpen()) {
                session.sendMessage(new TextMessage(
                        objectMapper.writeValueAsString(Map.of("error", "메시지 전송에 실패했습니다. 다시 시도해주세요."))));
            }
        }
    }

    private Long userIdOf(WebSocketSession session) {
        return (Long) session.getAttributes().get("userId");
    }

    private record IncomingMessage(Long toUserId, String content) {}
}
