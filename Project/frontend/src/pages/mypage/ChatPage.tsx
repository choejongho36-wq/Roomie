import { useEffect, useMemo, useRef, useState } from "react";
import type { FormEvent } from "react";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useChat } from "../../context/ChatContext";
import { API_ORIGIN, getChatMessages, getConversations, searchUsers } from "../../api";
import type { ChatMessage, Conversation, UserSearchResult } from "../../types/chat";
import defaultAvatar from "../../assets/Roomie_logo.png";
import "./MyPageContent.css";
import "./ChatPage.css";

const getAvatarSrc = (url: string | null) => (url ? `${API_ORIGIN}${url}` : defaultAvatar);

const formatTime = (iso: string) =>
  new Date(iso).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" });

interface ActivePartner {
  userId: number;
  nickname: string;
  profileImageUrl: string | null;
}

function ChatPage() {
  const { token, user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const { lastMessage, sendMessage } = useChat();

  const [conversations, setConversations] = useState<Conversation[] | null>(null);
  const [activePartner, setActivePartner] = useState<ActivePartner | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<UserSearchResult[]>([]);
  const [error, setError] = useState("");
  const messageListRef = useRef<HTMLDivElement>(null);

  const myUserId = user?.userId ?? null;

  const loadConversations = () => {
    if (!token) return;
    getConversations(token)
      .then(setConversations)
      .catch(() => setError("대화 목록을 불러오지 못했습니다."));
  };

  useEffect(loadConversations, [token]);

  useEffect(() => {
    const userIdParam = searchParams.get("userId");
    if (!userIdParam || !conversations) return;
    const target = conversations.find((c) => c.partnerId === Number(userIdParam));
    if (target) {
      setActivePartner({
        userId: target.partnerId,
        nickname: target.partnerNickname,
        profileImageUrl: target.partnerProfileImageUrl,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversations]);

  useEffect(() => {
    if (!token || !activePartner) {
      setMessages([]);
      return;
    }
    getChatMessages(token, activePartner.userId)
      .then(setMessages)
      .catch(() => setError("대화 내용을 불러오지 못했습니다."));
  }, [token, activePartner]);

  useEffect(() => {
    if (!lastMessage || !myUserId) return;
    const partnerId = lastMessage.senderId === myUserId ? lastMessage.receiverId : lastMessage.senderId;
    if (activePartner && partnerId === activePartner.userId) {
      setMessages((prev) => [...prev, lastMessage]);
    }
    loadConversations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastMessage]);

  useEffect(() => {
    messageListRef.current?.scrollTo({ top: messageListRef.current.scrollHeight });
  }, [messages]);

  useEffect(() => {
    if (!token || searchQuery.trim().length === 0) {
      setSearchResults([]);
      return;
    }
    const timeout = setTimeout(() => {
      searchUsers(token, searchQuery.trim())
        .then(setSearchResults)
        .catch(() => setSearchResults([]));
    }, 300);
    return () => clearTimeout(timeout);
  }, [token, searchQuery]);

  const openConversation = (partner: ActivePartner) => {
    setActivePartner(partner);
    setSearchQuery("");
    setSearchResults([]);
    setSearchParams({ userId: String(partner.userId) });
  };

  const handleSend = (event: FormEvent) => {
    event.preventDefault();
    if (!activePartner || draft.trim().length === 0) return;
    const sent = sendMessage(activePartner.userId, draft.trim());
    if (sent) setDraft("");
    else setError("연결이 끊겨 메시지를 보낼 수 없어요. 잠시 후 다시 시도해주세요.");
  };

  const sortedConversations = useMemo(
    () => conversations ?? [],
    [conversations]
  );

  return (
    <div className="mypage-panel">
      <h1 className="mypage-panel-title">채팅</h1>
      <p className="mypage-panel-desc">닉네임으로 상대를 찾아 대화를 시작해보세요.</p>

      {error && <p className="mypage-error">{error}</p>}

      <div className="chat-layout">
        <aside className="chat-sidebar">
          <div className="chat-search">
            <input
              type="text"
              placeholder="닉네임으로 새 대화 시작"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
            />
            {searchResults.length > 0 && (
              <div className="chat-search-results">
                {searchResults.map((result) => (
                  <button
                    key={result.userId}
                    type="button"
                    className="chat-search-result"
                    onClick={() =>
                      openConversation({
                        userId: result.userId,
                        nickname: result.nickname,
                        profileImageUrl: result.profileImageUrl,
                      })
                    }
                  >
                    <img src={getAvatarSrc(result.profileImageUrl)} alt="" className="chat-avatar" />
                    <span>{result.nickname}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="chat-conversation-list">
            {conversations === null && <p className="chat-empty-hint">불러오는 중...</p>}
            {conversations !== null && sortedConversations.length === 0 && (
              <p className="chat-empty-hint">아직 대화가 없어요.</p>
            )}
            {sortedConversations.map((conversation) => (
              <button
                key={conversation.partnerId}
                type="button"
                className={`chat-conversation-item${
                  activePartner?.userId === conversation.partnerId ? " is-active" : ""
                }`}
                onClick={() =>
                  openConversation({
                    userId: conversation.partnerId,
                    nickname: conversation.partnerNickname,
                    profileImageUrl: conversation.partnerProfileImageUrl,
                  })
                }
              >
                <img
                  src={getAvatarSrc(conversation.partnerProfileImageUrl)}
                  alt=""
                  className="chat-avatar"
                />
                <span className="chat-conversation-info">
                  <span className="chat-conversation-name">{conversation.partnerNickname}</span>
                  <span className="chat-conversation-preview">{conversation.lastMessage}</span>
                </span>
              </button>
            ))}
          </div>
        </aside>

        <section className="chat-thread">
          {!activePartner ? (
            <div className="chat-empty-hint chat-thread-empty">
              왼쪽에서 대화를 선택하거나 닉네임으로 새 대화를 시작해보세요.
            </div>
          ) : (
            <>
              <div className="chat-thread-header">
                <img src={getAvatarSrc(activePartner.profileImageUrl)} alt="" className="chat-avatar" />
                <strong>{activePartner.nickname}</strong>
              </div>

              <div className="chat-message-list" ref={messageListRef}>
                {messages.map((message) => (
                  <div
                    key={message.messageId}
                    className={`chat-message${message.senderId === myUserId ? " is-mine" : ""}`}
                  >
                    <span className="chat-message-bubble">{message.content}</span>
                    <span className="chat-message-time">{formatTime(message.createdAt)}</span>
                  </div>
                ))}
              </div>

              <form className="chat-composer" onSubmit={handleSend}>
                <input
                  type="text"
                  placeholder="메시지를 입력하세요"
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                />
                <button type="submit" className="btn btn-primary">
                  전송
                </button>
              </form>
            </>
          )}
        </section>
      </div>
    </div>
  );
}

export default ChatPage;
