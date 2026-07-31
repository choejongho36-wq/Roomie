import { useEffect, useMemo, useRef, useState } from "react";
import type { FormEvent } from "react";
import { useLocation, useSearchParams, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useChat } from "../../context/ChatContext";
import {
  API_ORIGIN,
  getChatMessages,
  getConversations,
  createOrGetMatchedPair,
  getChatStatus,
  leaveChat,
} from "../../api";
import type { ChatMessage, Conversation } from "../../types/chat";
import { Icon } from "../../components/mypage/MyPageSidebar";
import defaultAvatar from "../../assets/Roomie_logo.png";
import "./MyPageContent.css";
import "./ChatPage.css";

const getAvatarSrc = (url: string | null) => (url ? `${API_ORIGIN}${url}` : defaultAvatar);

const formatTime = (iso: string) =>
  new Date(iso).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" });

const CHAT_NOTICE_STORAGE_KEY = "roomie_chat_notice_seen_partners";

const loadAcknowledgedPartners = (): Set<number> => {
  try {
    const raw = localStorage.getItem(CHAT_NOTICE_STORAGE_KEY);
    return new Set(raw ? (JSON.parse(raw) as number[]) : []);
  } catch {
    return new Set();
  }
};

const EMOJI_OPTIONS = [
  "😀", "😂", "😍", "😊", "😉", "😢", "😭", "😡", "😱", "😴",
  "👍", "👎", "🙏", "👏", "🙌", "💪", "🤝", "✌️",
  "❤️", "💛", "🔥", "✨", "🎉", "😅", "🤔", "😎",
];

const CHAT_NOTICE_ITEMS = [
  "상대방을 존중하는 매너 있는 대화를 부탁드려요.",
  "계좌번호, 주민등록번호 같은 민감한 개인정보는 채팅으로 주고받지 않는 게 안전해요.",
  "직접 만나기 전에는 화상통화나 전화로 먼저 확인해보는 걸 추천해요.",
  "불쾌한 언행이나 사기가 의심되면 즉시 신고해주세요.",
];

interface ActivePartner {
  userId: number;
  nickname: string;
  profileImageUrl: string | null;
  isVerified: boolean;
}

function ChatPage() {
  const { token, user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { lastMessage, sendMessage } = useChat();

  const [conversations, setConversations] = useState<Conversation[] | null>(null);
  const [activePartner, setActivePartner] = useState<ActivePartner | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [leftByPartner, setLeftByPartner] = useState(false);
  const [infoModal, setInfoModal] = useState<string | null>(null);
  const [confirmModal, setConfirmModal] = useState<{
    message: string;
    confirmLabel?: string;
    onConfirm: () => Promise<void> | void;
  } | null>(null);
  const [acknowledgedPartners, setAcknowledgedPartners] = useState<Set<number>>(loadAcknowledgedPartners);
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
    const partnerId = Number(userIdParam);
    const target = conversations.find((c) => c.partnerId === partnerId);
    if (target) {
      setActivePartner({
        userId: target.partnerId,
        nickname: target.partnerNickname,
        profileImageUrl: target.partnerProfileImageUrl,
        isVerified: target.partnerVerified,
      });
      return;
    }

    // 아직 대화한 적 없는 상대(예: 추천 페이지의 "첫 메시지 보내기")는
    // 대화 목록에 없으므로, 이동할 때 넘겨준 닉네임으로 새 대화를 시작한다.
    const newContactNickname = (location.state as { nickname?: string } | null)?.nickname;
    if (newContactNickname) {
      setActivePartner({ userId: partnerId, nickname: newContactNickname, profileImageUrl: null, isVerified: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversations]);

  useEffect(() => {
    if (!token || !activePartner) {
      setMessages([]);
      setLeftByPartner(false);
      return;
    }
    getChatMessages(token, activePartner.userId)
      .then(setMessages)
      .catch(() => setError("대화 내용을 불러오지 못했습니다."));
    getChatStatus(token, activePartner.userId)
      .then((status) => setLeftByPartner(status.leftByPartner))
      .catch(() => setLeftByPartner(false));
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

  const openConversation = (partner: ActivePartner) => {
    setActivePartner(partner);
    setSearchParams({ userId: String(partner.userId) });
    setShowEmojiPicker(false);
  };

  const acknowledgeNotice = () => {
    if (!activePartner) return;
    const next = new Set(acknowledgedPartners).add(activePartner.userId);
    setAcknowledgedPartners(next);
    localStorage.setItem(CHAT_NOTICE_STORAGE_KEY, JSON.stringify([...next]));
  };

  const needsNotice = Boolean(activePartner) && !acknowledgedPartners.has(activePartner?.userId ?? -1);

  const handleSend = (event: FormEvent) => {
    event.preventDefault();
    if (!activePartner || draft.trim().length === 0) return;
    const sent = sendMessage(activePartner.userId, draft.trim());
    if (sent) setDraft("");
    else setError("연결이 끊겨 메시지를 보낼 수 없어요. 잠시 후 다시 시도해주세요.");
  };

  const handleEmojiSelect = (emoji: string) => {
    setDraft((prev) => prev + emoji);
    setShowEmojiPicker(false);
  };

  const doConfirmRoommate = async () => {
    if (!token || !activePartner) return;
    setConfirming(true);
    setError("");
    try {
      const pair = await createOrGetMatchedPair(token, activePartner.userId);
      navigate(`/matched/${pair.id}`);
    } catch {
      setError("룸메이트 확정에 실패했습니다. 잠시 후 다시 시도해주세요.");
    } finally {
      setConfirming(false);
    }
  };

  const handleConfirmRoommateClick = () => {
    if (!activePartner) return;
    setConfirmModal({
      message: `${activePartner.nickname}님과 룸메이트로 확정할까요?`,
      confirmLabel: "확정",
      onConfirm: doConfirmRoommate,
    });
  };

  const handleReportUser = () => {
    if (!activePartner) return;
    setConfirmModal({
      message: `${activePartner.nickname}님을 신고할까요?`,
      confirmLabel: "신고",
      onConfirm: () => {
        setInfoModal("신고가 접수됐어요. 운영팀이 확인 후 조치할게요.");
      },
    });
  };

  const handleLeaveChat = () => {
    if (!activePartner) return;
    const partner = activePartner;
    setConfirmModal({
      message: "채팅방을 나가시겠어요? 대화 상대에게는 연결이 끊겼다고 표시돼요.",
      confirmLabel: "나가기",
      onConfirm: async () => {
        if (!token) return;
        try {
          await leaveChat(token, partner.userId);
          setConversations((prev) => prev?.filter((c) => c.partnerId !== partner.userId) ?? prev);
          setActivePartner(null);
          setSearchParams({});
        } catch {
          setError("채팅방을 나가지 못했습니다. 잠시 후 다시 시도해주세요.");
        }
      },
    });
  };

  const sortedConversations = useMemo(
    () => conversations ?? [],
    [conversations]
  );

  return (
    <div className="mypage-panel">
      
      {error && <p className="mypage-error">{error}</p>}

      <div className="chat-layout">
        <aside className="chat-sidebar">
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
                    isVerified: conversation.partnerVerified,
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
              왼쪽에서 대화를 선택해보세요.
            </div>
          ) : needsNotice ? (
            <div className="chat-notice">
              <h2>채팅을 시작하기 전에 확인해주세요</h2>
              <ul>
                {CHAT_NOTICE_ITEMS.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
              <button type="button" className="btn btn-primary" onClick={acknowledgeNotice}>
                확인했습니다
              </button>
            </div>
          ) : (
            <>
              <div className="chat-thread-header">
                <img src={getAvatarSrc(activePartner.profileImageUrl)} alt="" className="chat-avatar" />
                <strong>{activePartner.nickname}</strong>
                {activePartner.isVerified && <span className="chat-verified-badge">✓ 인증</span>}
                {!leftByPartner && (
                  <button
                    type="button"
                    className="btn btn-outline chat-confirm-roommate-btn"
                    onClick={handleConfirmRoommateClick}
                    disabled={confirming}
                  >
                    {confirming ? "처리 중..." : "룸메이트 확정"}
                  </button>
                )}
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
                <div className="chat-emoji-wrapper">
                  <button
                    type="button"
                    className="chat-emoji-btn"
                    aria-label="이모지 선택"
                    onClick={() => setShowEmojiPicker((prev) => !prev)}
                    disabled={leftByPartner}
                  >
                    <Icon name="smile" />
                  </button>
                  {showEmojiPicker && (
                    <div className="chat-emoji-picker">
                      {EMOJI_OPTIONS.map((emoji) => (
                        <button
                          key={emoji}
                          type="button"
                          className="chat-emoji-option"
                          onClick={() => handleEmojiSelect(emoji)}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <input
                  type="text"
                  placeholder={leftByPartner ? "상대방과의 연결이 끊겼습니다." : "메시지를 입력하세요"}
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  disabled={leftByPartner}
                />
                <button type="submit" className="btn btn-primary" disabled={leftByPartner}>
                  전송
                </button>
              </form>

              <div className="chat-thread-footer">
                <button
                  type="button"
                  className="btn btn-outline chat-header-action-btn chat-report-btn"
                  onClick={handleReportUser}
                >
                  신고
                </button>
                <button type="button" className="chat-leave-btn" onClick={handleLeaveChat}>
                  채팅방 나가기
                </button>
              </div>
            </>
          )}
        </section>
      </div>

      {infoModal && (
        <div className="info-modal-backdrop" onClick={() => setInfoModal(null)}>
          <div className="info-modal" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
            <p>{infoModal}</p>
            <button type="button" className="btn btn-primary" onClick={() => setInfoModal(null)}>
              확인
            </button>
          </div>
        </div>
      )}

      {confirmModal && (
        <div className="info-modal-backdrop" onClick={() => setConfirmModal(null)}>
          <div className="info-modal" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
            <p>{confirmModal.message}</p>
            <div className="info-modal-actions">
              <button type="button" className="btn btn-outline" onClick={() => setConfirmModal(null)}>
                취소
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={async () => {
                  const action = confirmModal.onConfirm;
                  setConfirmModal(null);
                  await action();
                }}
              >
                {confirmModal.confirmLabel ?? "확인"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ChatPage;