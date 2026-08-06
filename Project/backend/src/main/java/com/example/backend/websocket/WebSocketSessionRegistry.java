package com.example.backend.websocket;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import tools.jackson.databind.ObjectMapper;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

// 로그인한 유저의 현재 웹소켓 세션을 붙잡아뒀다가, 채팅 메시지뿐 아니라 알림도 실시간으로
// 바로 그 세션에 밀어넣을 수 있게 하는 공용 레지스트리.
// ponytail: 세션을 서버 프로세스 메모리에만 들고 있음 — 인스턴스를 여러 대로 늘리면
// (Redis pub/sub 같은) 공유 브로커가 필요해짐. 지금은 단일 인스턴스라 충분.
@Component
@RequiredArgsConstructor
public class WebSocketSessionRegistry {

    private final ObjectMapper objectMapper;
    private final Map<Long, WebSocketSession> sessionsByUserId = new ConcurrentHashMap<>();

    public void register(Long userId, WebSocketSession session) {
        sessionsByUserId.put(userId, session);
    }

    public void unregister(Long userId, WebSocketSession session) {
        sessionsByUserId.remove(userId, session);
    }

    public void send(Long userId, Object payload) {
        WebSocketSession session = sessionsByUserId.get(userId);
        if (session == null || !session.isOpen()) return;
        try {
            session.sendMessage(new TextMessage(objectMapper.writeValueAsString(payload)));
        } catch (Exception ignored) {
            // 알림/메시지 실시간 전송은 부가 기능이라 실패해도 연결을 끊지 않는다.
        }
    }
}
