package com.example.backend.websocket;

import com.example.backend.dto.ChatMessageResponse;
import com.example.backend.service.ChatService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;
import tools.jackson.databind.ObjectMapper;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

// ponytail: 세션을 서버 프로세스 메모리에만 들고 있음 — 인스턴스를 여러 대로 늘리면
// (Redis pub/sub 같은) 공유 브로커가 필요해짐. 지금은 단일 인스턴스라 충분.
@Component
@RequiredArgsConstructor
public class ChatWebSocketHandler extends TextWebSocketHandler {

    private final ChatService chatService;
    private final ObjectMapper objectMapper;
    private final Map<Long, WebSocketSession> sessionsByUserId = new ConcurrentHashMap<>();

    @Override
    public void afterConnectionEstablished(WebSocketSession session) {
        Long userId = userIdOf(session);
        if (userId != null) {
            sessionsByUserId.put(userId, session);
        }
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) {
        Long userId = userIdOf(session);
        if (userId != null) {
            sessionsByUserId.remove(userId, session);
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
            WebSocketSession receiverSession = sessionsByUserId.get(saved.receiverId());
            if (receiverSession != null && receiverSession.isOpen()) {
                receiverSession.sendMessage(new TextMessage(json));
            }
        } catch (IllegalArgumentException e) {
            if (session.isOpen()) {
                session.sendMessage(new TextMessage(objectMapper.writeValueAsString(Map.of("error", e.getMessage()))));
            }
        }
    }

    private Long userIdOf(WebSocketSession session) {
        return (Long) session.getAttributes().get("userId");
    }

    private record IncomingMessage(Long toUserId, String content) {}
}
