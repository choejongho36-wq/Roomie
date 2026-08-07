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
  getMatchedPairByPartner,
  confirmMatchedPair,
  updateMatchedPairConditions,
  getChatStatus,
  leaveChat,
} from "../../api";
import type { ChatMessage, Conversation } from "../../types/chat";
import type { MatchedPair } from "../../types/matchedPair";
import { Icon } from "../../components/mypage/MyPageSidebar";
import RegionPicker, { type RegionToken, parseRegionToken } from "../../components/RegionPicker";
import defaultAvatar from "../../assets/Roomie_logo.png";
import "./MyPageContent.css";
import "./ChatPage.css";
import "../MatchedPairPage.css";

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
  const { lastMessage, lastMatchedPairUpdate, sendMessage, refreshChatUnreadCount } = useChat();

  const [conversations, setConversations] = useState<Conversation[] | null>(null);
  const [activePartner, setActivePartner] = useState<ActivePartner | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [matchedPairStatus, setMatchedPairStatus] = useState<MatchedPair | null>(null);
  const [confirmRoommateModalOpen, setConfirmRoommateModalOpen] = useState(false);
  const [confirmingHouse, setConfirmingHouse] = useState(false);
  const [findRoomPanelOpen, setFindRoomPanelOpen] = useState(false);
  const [findRoomRegionTokens, setFindRoomRegionTokens] = useState<RegionToken[]>([]);
  const [findRoomDepositMax, setFindRoomDepositMax] = useState("");
  const [findRoomMonthlyRentMax, setFindRoomMonthlyRentMax] = useState("");
  const [conditionsSaving, setConditionsSaving] = useState(false);
  const [conditionsSaveMessage, setConditionsSaveMessage] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [leftByPartner, setLeftByPartner] = useState(false);
  const [infoModal, setInfoModal] = useState<string | null>(null);
  const [confirmModal, setConfirmModal] = useState<{
    message: string;
    confirmLabel?: string;
    onConfirm: () => Promise<void> | void;
  } | null>(null);
  const [acknowledgedPartners, setAcknowledgedPartners] = useState<Set<number>>(loadAcknowledgedPartners);
  const [isListMenuOpen, setIsListMenuOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedPartnerIds, setSelectedPartnerIds] = useState<Set<number>>(new Set());
  const [leavingSelected, setLeavingSelected] = useState(false);
  const messageListRef = useRef<HTMLDivElement>(null);

  const myUserId = user?.userId ?? null;

  const loadConversations = () => {
    if (!token) return;
    getConversations(token)
      .then(setConversations)
      .catch(() => setError("대화 목록을 불러오지 못했습니다."));
  };

  useEffect(loadConversations, [token]);

  // 사이드바 클릭뿐 아니라 다른 화면(하우스 해산, 확정 취소, 알림 클릭 등)에서 navigate로
  // ?userId=만 바꿔서 들어오는 경우도 있어서, URL의 userId 값 자체를 의존성으로 잡아야 한다.
  // searchParams 객체 자체는 리렌더마다 참조가 바뀌어 무한루프를 유발할 수 있어 문자열 값만 사용.
  const userIdParam = searchParams.get("userId");

  // 값이 실제로 안 바뀌었으면 기존 객체 참조를 그대로 유지한다 — 그래야 아래쪽의
  // "activePartner가 바뀔 때만" 실행되는 이펙트들(메시지/방찾기 패널 등)이 대화 목록이
  // 새로고침될 때마다(메시지를 주고받을 때마다) 불필요하게 재실행되며 방찾기 패널을 닫아버리는 걸 막는다.
  const setActivePartnerIfChanged = (next: ActivePartner) => {
    setActivePartner((prev) =>
      prev &&
      prev.userId === next.userId &&
      prev.nickname === next.nickname &&
      prev.profileImageUrl === next.profileImageUrl &&
      prev.isVerified === next.isVerified
        ? prev
        : next
    );
  };

  useEffect(() => {
    if (!userIdParam || !conversations) return;
    const partnerId = Number(userIdParam);
    const target = conversations.find((c) => c.partnerId === partnerId);
    if (target) {
      setActivePartnerIfChanged({
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
      setActivePartnerIfChanged({ userId: partnerId, nickname: newContactNickname, profileImageUrl: null, isVerified: false });
    }
  }, [conversations, userIdParam, location.state]);

  useEffect(() => {
    // 대화 상대를 바꾸면 이전 상대의 방찾기 패널이 그대로 떠 있으면 안 되니 같이 닫는다
    setFindRoomPanelOpen(false);
    if (!token || !activePartner) {
      setMessages([]);
      setLeftByPartner(false);
      setMatchedPairStatus(null);
      return;
    }
    getChatMessages(token, activePartner.userId)
      .then((data) => {
        setMessages(data);
        refreshChatUnreadCount();
        loadConversations();
      })
      .catch(() => setError("대화 내용을 불러오지 못했습니다."));
    getChatStatus(token, activePartner.userId)
      .then((status) => setLeftByPartner(status.leftByPartner))
      .catch(() => setLeftByPartner(false));
    // 이 상대와 이미 룸메이트 확정된 페어가 있으면, 확정 버튼을 다시 노출하지 않기 위해 조회
    getMatchedPairByPartner(token, activePartner.userId)
      .then(setMatchedPairStatus)
      .catch(() => setMatchedPairStatus(null));
  }, [token, activePartner, refreshChatUnreadCount]);

  // 채팅방을 열어둔 채로 상대방이 확정하면(또는 내가 다른 탭에서 확정하면) 실시간으로 버튼을 숨김
  useEffect(() => {
    if (!lastMatchedPairUpdate || !activePartner) return;
    if (lastMatchedPairUpdate.partner.userId === activePartner.userId) {
      setMatchedPairStatus(lastMatchedPairUpdate);
    }
  }, [lastMatchedPairUpdate, activePartner]);

  // 두 사람 다 확정되면(내가 방금 확정했든, 웹소켓으로 상대방 확정 소식을 받았든) 3초 뒤 하우스로 이동
  useEffect(() => {
    if (!matchedPairStatus || matchedPairStatus.status !== "CONFIRMED") return;
    const timer = setTimeout(() => navigate(`/house/${matchedPairStatus.id}`), 3000);
    return () => clearTimeout(timer);
  }, [matchedPairStatus?.status, matchedPairStatus?.id, navigate]);

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
    // activePartner는 여기서 직접 정하지 않고 URL만 바꾼다 — 위 이펙트가 userId 값을 보고
    // activePartner를 채워주므로, 다른 화면에서 URL만 바꿔서 들어오는 경우와 동작이 하나로 통일된다.
    setSearchParams({ userId: String(partner.userId) });
    setShowEmojiPicker(false);
    setShowAttachMenu(false);
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

  const handleAttachImage = () => {
    setShowAttachMenu(false);
    setInfoModal("현재 미구현 기능입니다.");
  };

  const doConfirmRoommate = async () => {
    if (!token || !activePartner) return;
    setConfirming(true);
    setError("");
    try {
      const pair = await createOrGetMatchedPair(token, activePartner.userId);
      setMatchedPairStatus(pair);
      setConfirmRoommateModalOpen(true);
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

  // 확정 현황 모달의 "하우스로 이동" 버튼 — 내 몫만 확정 처리(상대방도 확정해야 실제로 CONFIRMED가 됨)
  const handleConfirmHouse = async () => {
    if (!token || !matchedPairStatus) return;
    setConfirmingHouse(true);
    try {
      const updated = await confirmMatchedPair(token, matchedPairStatus.id);
      setMatchedPairStatus(updated);
    } finally {
      setConfirmingHouse(false);
    }
  };

  // "방찾기" 버튼 — 채팅 옆 패널을 열고/닫음. 처음 열 때, 아직 페어가 없으면
  // (룸메이트 확정을 한 번도 안 누른 상태) 조용히 만들어서 연다
  const handleToggleFindRoomPanel = async () => {
    if (findRoomPanelOpen) {
      setFindRoomPanelOpen(false);
      return;
    }
    if (!token || !activePartner) return;
    let pair = matchedPairStatus;
    if (!pair) {
      try {
        pair = await createOrGetMatchedPair(token, activePartner.userId);
        setMatchedPairStatus(pair);
      } catch {
        setError("정보를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.");
        return;
      }
    }
    const parsed = parseRegionToken(pair.region);
    setFindRoomRegionTokens(parsed ? [parsed] : []);
    setFindRoomDepositMax(pair.depositMax != null ? String(pair.depositMax) : "");
    setFindRoomMonthlyRentMax(pair.monthlyRentMax != null ? String(pair.monthlyRentMax) : "");
    setConditionsSaveMessage("");
    setFindRoomPanelOpen(true);
  };

  const handleSaveConditions = async () => {
    if (!token || !matchedPairStatus) return;
    setConditionsSaving(true);
    setConditionsSaveMessage("");
    try {
      const updated = await updateMatchedPairConditions(token, matchedPairStatus.id, {
        region: findRoomRegionTokens[0]?.label ?? null,
        depositMax: findRoomDepositMax ? Number(findRoomDepositMax) : null,
        monthlyRentMax: findRoomMonthlyRentMax ? Number(findRoomMonthlyRentMax) : null,
      });
      setMatchedPairStatus(updated);
      setConditionsSaveMessage("조건이 저장됐어요. 아래 검색 링크도 새 조건으로 갱신됐어요.");
    } catch {
      setConditionsSaveMessage("저장에 실패했어요. 잠시 후 다시 시도해주세요.");
    } finally {
      setConditionsSaving(false);
    }
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

  const enterEditMode = () => {
    setIsEditMode(true);
    setIsListMenuOpen(false);
    setSelectedPartnerIds(new Set());
  };

  const cancelEditMode = () => {
    setIsEditMode(false);
    setSelectedPartnerIds(new Set());
  };

  const toggleSelectPartner = (partnerId: number) => {
    setSelectedPartnerIds((prev) => {
      const next = new Set(prev);
      if (next.has(partnerId)) next.delete(partnerId);
      else next.add(partnerId);
      return next;
    });
  };

  const handleLeaveSelected = () => {
    if (selectedPartnerIds.size === 0) return;
    const targetIds = selectedPartnerIds;
    setConfirmModal({
      message: `선택한 채팅방 ${targetIds.size}개를 나가시겠어요? 대화 상대에게는 연결이 끊겼다고 표시돼요.`,
      confirmLabel: "나가기",
      onConfirm: async () => {
        if (!token) return;
        setLeavingSelected(true);
        try {
          await Promise.all([...targetIds].map((partnerId) => leaveChat(token, partnerId)));
          setConversations((prev) => prev?.filter((c) => !targetIds.has(c.partnerId)) ?? prev);
          if (activePartner && targetIds.has(activePartner.userId)) {
            setActivePartner(null);
            setSearchParams({});
          }
          cancelEditMode();
        } catch {
          setError("채팅방을 나가지 못했습니다. 잠시 후 다시 시도해주세요.");
        } finally {
          setLeavingSelected(false);
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

      <div className={`chat-layout${findRoomPanelOpen ? " has-room-finder" : ""}`}>
        <aside className="chat-sidebar">
          <div className="chat-sidebar-header">
            <span className="chat-sidebar-title">채팅</span>
            <div className="chat-list-menu-wrapper">
              <button
                type="button"
                className="chat-list-menu-btn"
                aria-label="채팅 목록 메뉴"
                onClick={() => setIsListMenuOpen((prev) => !prev)}
              >
                <svg width="4" height="18" viewBox="0 0 4 18" fill="currentColor" aria-hidden="true">
                  <circle cx="2" cy="2" r="2" />
                  <circle cx="2" cy="9" r="2" />
                  <circle cx="2" cy="16" r="2" />
                </svg>
              </button>
              {isListMenuOpen && (
                <div className="chat-list-menu">
                  <button type="button" className="chat-list-menu-item" onClick={enterEditMode}>
                    편집
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="chat-conversation-list">
            {conversations === null && <p className="chat-empty-hint">불러오는 중...</p>}
            {conversations !== null && sortedConversations.length === 0 && (
              <p className="chat-empty-hint">아직 대화가 없어요.</p>
            )}
            {sortedConversations.map((conversation) => {
              const isSelected = selectedPartnerIds.has(conversation.partnerId);
              return (
                <button
                  key={conversation.partnerId}
                  type="button"
                  className={`chat-conversation-item${
                    activePartner?.userId === conversation.partnerId ? " is-active" : ""
                  }`}
                  onClick={() =>
                    isEditMode
                      ? toggleSelectPartner(conversation.partnerId)
                      : openConversation({
                          userId: conversation.partnerId,
                          nickname: conversation.partnerNickname,
                          profileImageUrl: conversation.partnerProfileImageUrl,
                          isVerified: conversation.partnerVerified,
                        })
                  }
                >
                  {isEditMode && (
                    <span className={`chat-conversation-checkbox${isSelected ? " is-checked" : ""}`} aria-hidden="true">
                      {isSelected && (
                        <svg width="12" height="10" viewBox="0 0 12 10" fill="none">
                          <path d="M1 5l3.5 3.5L11 1" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </span>
                  )}
                  <img
                    src={getAvatarSrc(conversation.partnerProfileImageUrl)}
                    alt=""
                    className="chat-avatar"
                  />
                  <span className="chat-conversation-info">
                    <span className="chat-conversation-name">{conversation.partnerNickname}</span>
                    <span className="chat-conversation-preview">{conversation.lastMessage}</span>
                  </span>
                  {conversation.unreadCount > 0 && (
                    <span className="chat-conversation-badge">
                      {conversation.unreadCount > 99 ? "99+" : conversation.unreadCount}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {isEditMode && (
            <div className="chat-edit-actions">
              <button type="button" className="btn btn-outline chat-edit-cancel-btn" onClick={cancelEditMode}>
                취소
              </button>
              <button
                type="button"
                className="chat-edit-leave-btn"
                onClick={handleLeaveSelected}
                disabled={selectedPartnerIds.size === 0 || leavingSelected}
              >
                {leavingSelected
                  ? "나가는 중..."
                  : `채팅방 나가기${selectedPartnerIds.size > 0 ? ` (${selectedPartnerIds.size})` : ""}`}
              </button>
            </div>
          )}
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
                {activePartner.isVerified && (
                  <span className="chat-verified-badge" title="이메일 인증 완료" aria-label="이메일 인증 완료">
                    <svg width="16" height="18" viewBox="0 0 18 20" fill="none" aria-hidden="true">
                      <path d="M9 1l7 2.6v5.2c0 5-3 8.4-7 10.2-4-1.8-7-5.2-7-10.2V3.6L9 1z" fill="currentColor" />
                      <path
                        d="M5.8 9.6l2.3 2.3L12.4 7"
                        stroke="#fff"
                        strokeWidth="1.6"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </span>
                )}
                <button
                  type="button"
                  className="btn btn-outline chat-header-action-btn chat-report-btn"
                  onClick={handleReportUser}
                >
                  신고
                </button>
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
                <div className="chat-attach-wrapper">
                  <button
                    type="button"
                    className="chat-attach-btn"
                    aria-label="파일 첨부"
                    onClick={() => setShowAttachMenu((prev) => !prev)}
                    disabled={leftByPartner}
                  >
                    <Icon name="plus" />
                  </button>
                  {showAttachMenu && (
                    <div className="chat-attach-menu">
                      <button type="button" className="chat-attach-menu-item" onClick={handleAttachImage}>
                        <Icon name="image" />
                        이미지 전송
                      </button>
                    </div>
                  )}
                </div>
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
                <div className="chat-footer-actions">
                  {!leftByPartner && matchedPairStatus?.status !== "CONFIRMED" && (
                    <button
                      type="button"
                      className="btn btn-outline chat-confirm-roommate-btn"
                      onClick={handleConfirmRoommateClick}
                      disabled={confirming}
                    >
                      {confirming ? "처리 중..." : "룸메이트 확정"}
                    </button>
                  )}
                  {!leftByPartner && (
                    <button
                      type="button"
                      className={`btn btn-outline${findRoomPanelOpen ? " is-active" : ""}`}
                      onClick={handleToggleFindRoomPanel}
                    >
                      방찾기
                    </button>
                  )}
                </div>
                <button type="button" className="chat-leave-btn" onClick={handleLeaveChat}>
                  채팅방 나가기
                </button>
              </div>
            </>
          )}
        </section>

        {findRoomPanelOpen && matchedPairStatus && (
          <aside className="chat-room-finder-panel">
            <div className="chat-room-finder-panel-header">
              <h2>함께 살 방 찾기</h2>
              <button
                type="button"
                className="chat-room-finder-panel-close"
                onClick={() => setFindRoomPanelOpen(false)}
                aria-label="닫기"
              >
                ✕
              </button>
            </div>
            <div className="matched-pair-reference">
              <span>{matchedPairStatus.me.nickname}: {matchedPairStatus.me.region ?? "설정 안 함"}</span>
              <span>{matchedPairStatus.partner.nickname}: {matchedPairStatus.partner.region ?? "설정 안 함"}</span>
            </div>
            <div className="matched-pair-form">
              <label>
                희망 지역
                <RegionPicker
                  selected={findRoomRegionTokens}
                  onChange={setFindRoomRegionTokens}
                  multiple={false}
                  variant="inline"
                  triggerLabel="지역 선택"
                  emptyHint="지역을 선택해주세요."
                />
              </label>
              <div className="matched-pair-form-row">
                <label>
                  보증금 최대 (만원)
                  <input
                    type="number"
                    value={findRoomDepositMax}
                    onChange={(event) => setFindRoomDepositMax(event.target.value)}
                    placeholder="예) 1000"
                  />
                </label>
                <label>
                  월세 최대 (만원)
                  <input
                    type="number"
                    value={findRoomMonthlyRentMax}
                    onChange={(event) => setFindRoomMonthlyRentMax(event.target.value)}
                    placeholder="예) 58"
                  />
                </label>
              </div>
              <button className="btn btn-primary" onClick={handleSaveConditions} disabled={conditionsSaving}>
                {conditionsSaving ? "저장 중..." : "조건 저장"}
              </button>
              {conditionsSaveMessage && <p className="matched-pair-save-message">{conditionsSaveMessage}</p>}
            </div>
            <div className="matched-pair-links">
              <a
                href={matchedPairStatus.dabangMapUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-outline"
              >
                다방 지도에서 매물 보기
              </a>
            </div>
          </aside>
        )}
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

      {confirmRoommateModalOpen && matchedPairStatus && (
        <div className="info-modal-backdrop" onClick={() => setConfirmRoommateModalOpen(false)}>
          <div
            className="info-modal chat-feature-modal"
            role="dialog"
            aria-modal="true"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              className="chat-feature-modal-close"
              onClick={() => setConfirmRoommateModalOpen(false)}
              aria-label="닫기"
            >
              ✕
            </button>
            <h2>방을 구하셨나요?</h2>
            <p className="matched-pair-hint">
              함께 살 방이 정해졌다면, 하우스 공간으로 넘어가서 정산/청소 관리를 시작해보세요.
              <br />
              두 분 모두 확정해야 하우스가 열려요.
            </p>
            <div className="matched-pair-confirm-status">
              <span className={matchedPairStatus.myConfirmed ? "matched-pair-confirm-done" : ""}>
                {matchedPairStatus.me.nickname}: {matchedPairStatus.myConfirmed ? "확정함 ✓" : "미확정"}
              </span>
              <span className={matchedPairStatus.partnerConfirmed ? "matched-pair-confirm-done" : ""}>
                {matchedPairStatus.partner.nickname}: {matchedPairStatus.partnerConfirmed ? "확정함 ✓" : "미확정"}
              </span>
            </div>
            {matchedPairStatus.status === "CONFIRMED" ? (
              <p className="matched-pair-hint">확정됐어요! 잠시 후 하우스로 이동할게요.</p>
            ) : matchedPairStatus.myConfirmed ? (
              <p className="matched-pair-hint">상대방이 확정하면 자동으로 하우스로 이동해요. 잠시만 기다려주세요.</p>
            ) : (
              <div className="matched-pair-confirm-actions">
                <button className="btn btn-primary" onClick={handleConfirmHouse} disabled={confirmingHouse}>
                  {confirmingHouse ? "처리 중..." : "하우스로 이동"}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}

export default ChatPage;