import React, { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api, { API_ORIGIN } from "../utils/api";
import { Image as ImgIcon, Mic, Sticker, Smile, ThumbsUp, Send } from "lucide-react";
import { useSocket } from "../context/SocketContext";

export default function Chat() {
  const { id: routeId } = useParams();
  const navigate = useNavigate();
  const [conversations, setConversations] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState("all");
  const currentUser = JSON.parse(localStorage.getItem("user"));
  const [activeConvo, setActiveConvo] = useState(null);
  const [showOptions, setShowOptions] = useState(false);
  const [showSellerItems, setShowSellerItems] = useState(false);
  const [sellerItems, setSellerItems] = useState([]);
  const [showEmoji, setShowEmoji] = useState(false);
  const [showGifInput, setShowGifInput] = useState(false);
  const [gifUrl, setGifUrl] = useState("");
  const fileRef = useRef(null);
  const [productInfo, setProductInfo] = useState(null);
  const [recording, setRecording] = useState(false);
  const messagesEndRef = useRef(null);
  const recorderRef = useRef(null);
  const streamRef = useRef(null);
  const socket = useSocket();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "auto" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, activeId]);

  useEffect(() => {
    if (socket && activeId) {
      socket.emit("join_room", activeId);
    }
  }, [socket, activeId]);

  useEffect(() => {
    if (!socket) return;
    const onNewMessage = (msg) => {
      if (msg.conversation === activeId || msg.conversation?._id === activeId) {
        setMessages(prev => {
          if (prev.find(m => m._id === msg._id)) return prev;
          return [...prev, msg];
        });
      }
    };
    const onConvoUpdated = (convo) => {
      setConversations(prev => {
        const filtered = prev.filter(c => c._id !== convo._id);
        return [convo, ...filtered];
      });
    };
    socket.on("new_message", onNewMessage);
    socket.on("convo_updated", onConvoUpdated);
    return () => {
      socket.off("new_message", onNewMessage);
      socket.off("convo_updated", onConvoUpdated);
    };
  }, [socket, activeId]);
  useEffect(() => {
    let mounted = true;
    async function loadConversations() {
      try {
        const res = await api.get("/chat/conversations");
        if (!mounted) return;
        setConversations(res.data || []);
        if (routeId) {
          setActiveId(routeId);
        } else if (res.data?.length && !activeId) {
          setActiveId(res.data[0]._id);
        }
      } catch { }
    }
    loadConversations();
    return () => { mounted = false; };
  }, [routeId]);

  useEffect(() => {
    if (!activeId) return;
    let mounted = true;
    async function loadMessages() {
      try {
        setLoading(true);
        const res = await api.get(`/chat/conversations/${activeId}/messages`);
        if (!mounted) return;
        setMessages(res.data || []);
      } catch {
        if (mounted) setMessages([]);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    loadMessages();
    return () => { mounted = false; };
  }, [activeId]);

  useEffect(() => {
    let mounted = true;
    async function loadConvo() {
      if (!activeId) return;
      try {
        const res = await api.get(`/chat/conversations/${activeId}`);
        if (!mounted) return;
        setActiveConvo(res.data || null);
      } catch { }
    }
    loadConvo();
    return () => { mounted = false; };
  }, [activeId]);

  useEffect(() => {
    let mounted = true;
    async function loadProduct() {
      const id = activeConvo?.product?._id || activeConvo?.product;
      if (!id) { setProductInfo(null); return; }
      try {
        const res = await api.get(`/products/${id}`);
        if (!mounted) return;
        setProductInfo(res.data || null);
      } catch {
        if (mounted) setProductInfo(null);
      }
    }
    loadProduct();
    return () => { mounted = false; };
  }, [activeConvo]);

  useEffect(() => {
    async function markRead() {
      if (!activeId) return;
      try {
        await api.put(`/chat/conversations/${activeId}/read`);
        setConversations(prev => prev.map(c =>
          c._id === activeId ? {
            ...c,
            lastMessage: c.lastMessage ? {
              ...c.lastMessage,
              readBy: Array.from(new Set([...(c.lastMessage.readBy || []), currentUser?._id]))
            } : null
          } : c
        ));
      } catch { }
    }
    markRead();
  }, [activeId, currentUser?._id, messages.length]);

  async function sendMessage(e) {
    e?.preventDefault();
    if (!text.trim() || !activeId) return;
    const payload = { conversationId: activeId, text: text.trim() };
    try {
      const res = await api.post("/chat/messages", payload);
      setMessages([...messages, res.data]);
      setText("");
    } catch { }
  }
  async function uploadVoiceBlob(blob) {
    if (!activeId || !blob) return;
    try {
      const form = new FormData();
      const file = new File([blob], `voice-${Date.now()}.webm`, { type: blob.type || "audio/webm" });
      form.append("audio", file);
      form.append("conversationId", activeId);
      const res = await api.post("/chat/messages/audio", form, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      setMessages((prev) => [...prev, res.data]);
    } catch { }
  }
  async function sendThumbsUp() {
    if (!activeId) return;
    try {
      const res = await api.post("/chat/messages", { conversationId: activeId, text: "👍" });
      setMessages([...messages, res.data]);
    } catch { }
  }

  async function loadSellerItems() {
    try {
      const sellerId = activeConvo?.product?.seller;
      if (!sellerId) return;
      const res = await api.get(`/products/by-seller/${sellerId}`);
      setSellerItems(res.data || []);
      setShowSellerItems(true);
    } catch { }
  }

  async function leaveConversation() {
    if (!activeId) return;
    try {
      await api.delete(`/chat/conversations/${activeId}/leave`);
      setShowOptions(false);
      // Refresh list
      const res = await api.get("/chat/conversations");
      setConversations(res.data || []);
      // Reset selection
      setActiveId(null);
      setMessages([]);
    } catch { }
  }

  function isImageUrl(t) {
    if (!t) return false;
    const u = String(t).trim();
    return /\.(png|jpg|jpeg|gif|webp)$/i.test(u);
  }

  async function onPickImage() {
    fileRef.current?.click();
  }

  async function onFileChange(e) {
    const files = Array.from(e.target.files || []);
    if (!files.length || !activeId) return;
    try {
      const form = new FormData();
      files.forEach((f) => form.append("images", f));
      const res = await api.post("/upload", form, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      const urls = (res.data || []).map((p) => `${API_ORIGIN}${p}`);
      for (const url of urls) {
        const sent = await api.post("/chat/messages", { conversationId: activeId, text: url });
        setMessages((prev) => [...prev, sent.data]);
      }
    } catch { }
    e.target.value = "";
  }

  function addEmoji(e) {
    setText((t) => t + e);
    setShowEmoji(false);
  }

  async function sendGif() {
    const url = gifUrl.trim();
    if (!url || !activeId) return;
    try {
      const res = await api.post("/chat/messages", { conversationId: activeId, text: url });
      setMessages([...messages, res.data]);
      setGifUrl("");
      setShowGifInput(false);
    } catch { }
  }

  async function onMicClick() {
    if (recording) {
      try {
        recorderRef.current?.stop();
      } catch { }
      setRecording(false);
      // stream tracks closed in onstop
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const rec = new MediaRecorder(stream);
      const chunks = [];
      rec.ondataavailable = (ev) => {
        if (ev.data && ev.data.size > 0) chunks.push(ev.data);
      };
      rec.onstop = async () => {
        try {
          const blob = new Blob(chunks, { type: rec.mimeType || "audio/webm" });
          await uploadVoiceBlob(blob);
        } finally {
          stream.getTracks().forEach((t) => t.stop());
          streamRef.current = null;
          recorderRef.current = null;
        }
      };
      recorderRef.current = rec;
      setRecording(true);
      rec.start();
    } catch {
      setRecording(false);
    }
  }

  function getImageUrl(path) {
    if (!path) return "";
    const p = String(path).replace(/\\/g, "/");
    if (p.startsWith("http")) return p;
    const rel = p.startsWith("/") ? p : `/${p}`;
    return `${API_ORIGIN}${rel}`;
  }
  function headerTitle() {
    const productName = productInfo?.name || activeConvo?.title || otherNames(activeConvo || {});
    const seller = productInfo?.seller?.name;
    return seller ? `${seller} · ${productName}` : productName;
  }
  function gotoProduct() {
    const pid = activeConvo?.product?._id || activeConvo?.product || productInfo?._id;
    if (pid) navigate(`/product/${pid}`);
  }

  const filteredConversations = useMemo(() => {
    const base = conversations || [];
    const bySearch = search
      ? base.filter((c) => {
        const title = c.title || "";
        const names = (c.participants || []).map((p) => p.name).join(" ");
        const last = c.lastMessage?.text || "";
        const s = search.toLowerCase();
        return (
          title.toLowerCase().includes(s) ||
          names.toLowerCase().includes(s) ||
          last.toLowerCase().includes(s)
        );
      })
      : base;
    if (tab === "unread") {
      const me = currentUser?._id;
      return bySearch.filter((c) => {
        const sender = c.lastMessage?.sender;
        return sender && String(sender) !== String(me);
      });
    }
    return bySearch;
  }, [conversations, search, tab, currentUser]);

  function getOtherParticipant(c) {
    if (!c || !c.participants) return null;
    const me = currentUser?._id;
    return c.participants.find((p) => String(p._id || p) !== String(me));
  }

  function otherNames(c) {
    const other = getOtherParticipant(c);
    return other?.name || "User";
  }

  return (
    <div className="dm-chat-layout">
      <div className="dm-chat-sidebar">
        <div className="dm-chat-sidebar-top">
          <input
            className="dm-chat-search"
            placeholder="Search Messenger"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <div className="dm-chat-tabs">
            <button className={`dm-chat-tab ${tab === "all" ? "active" : ""}`} onClick={() => setTab("all")}>All</button>
            <button className={`dm-chat-tab ${tab === "unread" ? "active" : ""}`} onClick={() => setTab("unread")}>Unread</button>
          </div>
        </div>
        <div className="dm-chat-sidebar-list">
          {filteredConversations.length === 0 ? (
            <div className="dm-chat-empty">No conversations</div>
          ) : (
            filteredConversations.map((c) => {
              const name = c.title || otherNames(c) || "Conversation";
              const last = c.lastMessage?.text || "";
              const isActive = activeId === c._id;
              return (
                <div
                  key={c._id}
                  className={`dm-convo-item ${isActive ? "active" : ""}`}
                  onClick={() => {
                    setActiveId(c._id);
                    navigate(`/chat/${c._id}`);
                  }}
                >
                  {(() => {
                    const productThumb = (c.product?.images || [])[0];
                    const other = getOtherParticipant(c);
                    const userAvatar = other?.image ? getImageUrl(other.image) : null;
                    const thumb = productThumb ? getImageUrl(productThumb) : userAvatar;

                    return thumb ? (
                      <div className="dm-convo-avatar" style={{ backgroundImage: `url(${thumb})`, backgroundSize: 'cover', backgroundPosition: 'center', backgroundColor: '#4aa3a1' }} />
                    ) : (
                      <div className="dm-convo-avatar" style={{ backgroundColor: '#4aa3a1' }}>{String(name).charAt(0).toUpperCase()}</div>
                    );
                  })()}
                  <div className="dm-convo-body">
                    <div className="dm-convo-title">{name}</div>
                    <div className="dm-convo-last">{last}</div>
                  </div>
                  <div className="dm-convo-meta">
                    {c.lastMessage && !c.lastMessage.readBy?.includes(currentUser?._id) && String(c.lastMessage.sender) !== String(currentUser?._id) && (
                      <span className="dm-convo-dot"></span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
      <div className="dm-chat-main">
        <div className="dm-room-header">
          <div className="dm-room-title">
            {headerTitle() || "Conversation"}
          </div>
          <div className="dm-room-actions"></div>
        </div>
        {activeConvo?.product && (
          <>
            <div className="dm-product-bar">
              <div className="dm-product-left">
                {(() => {
                  const productThumb = (productInfo?.images || activeConvo?.product?.images || [])[0];
                  const other = getOtherParticipant(activeConvo);
                  const name = otherNames(activeConvo);
                  const userAvatar = other?.image ? getImageUrl(other.image) : null;
                  const thumb = productThumb ? getImageUrl(productThumb) : userAvatar;

                  const letter = String(name).charAt(0).toUpperCase();
                  return thumb ? (
                    <div className="dm-product-avatar" style={{ backgroundImage: `url(${thumb})`, backgroundSize: "cover", backgroundPosition: "center", backgroundColor: '#4aa3a1' }} />
                  ) : (
                    <div className="dm-product-avatar" style={{ backgroundColor: '#4aa3a1' }}>{letter}</div>
                  );
                })()}
                <div>
                  <div className="dm-product-title">
                    {productInfo?.seller?.name ? `${productInfo.seller.name} · ` : ""}
                    {productInfo?.name || activeConvo?.title || otherNames(activeConvo)}
                  </div>
                  <div className="dm-product-sub">
                    {productInfo?.price ? `Rs ${productInfo.price}` : "Marketplace"}
                    {productInfo?.status && productInfo.status !== "active" ? ` • ${String(productInfo.status).replace("_", " ")}` : ""}
                  </div>
                </div>
              </div>
              <div className="dm-product-actions">
                <button className="dm-pill-btn" onClick={gotoProduct}>See detail</button>
              </div>
            </div>
            <div className="dm-center-intro">
              <div className="dm-center-avatar">
                {(() => {
                  const other = getOtherParticipant(activeConvo);
                  const name = otherNames(activeConvo);
                  const avatar = other?.image ? getImageUrl(other.image) : null;
                  return avatar ? (
                    <div style={{ width: '100%', height: '100%', borderRadius: '50%', backgroundImage: `url(${avatar})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
                  ) : (
                    <div className="dm-seller-initial">{String(name).charAt(0).toUpperCase()}</div>
                  );
                })()}
              </div>
              <div className="dm-center-title">
                {productInfo?.seller?.name ? `${productInfo.seller.name} · ` : ""}
                {productInfo?.name || activeConvo?.title || otherNames(activeConvo)}
              </div>
              <div className="dm-center-sub">
                You started this chat. <span className="dm-center-link" onClick={gotoProduct}>See detail</span> • <span className="dm-center-link" onClick={() => {
                  const sid = productInfo?.seller?._id || activeConvo?.product?.seller || null;
                  if (sid) navigate(`/seller/${sid}`);
                }}>View seller profile</span>
              </div>
            </div>
          </>
        )}
        {showOptions && (
          <div className="dm-options-menu">
            <button className="dm-options-item" onClick={async () => { try { await api.put(`/chat/conversations/${activeId}/read`); } catch { } setShowOptions(false); }}>Mark as read</button>
            <button className="dm-options-item danger" onClick={leaveConversation}>Delete conversation</button>
          </div>
        )}
        {showSellerItems && (
          <div className="dm-seller-items">
            <div className="dm-items-header">
              <div>Seller's items</div>
              <button className="dm-room-btn" onClick={() => setShowSellerItems(false)}>Close</button>
            </div>
            <div className="dm-items-grid">
              {sellerItems.length === 0 ? (
                <div className="dm-chat-empty">No items</div>
              ) : (
                sellerItems.map((p) => (
                  <div key={p._id} className="dm-item-card" onClick={() => navigate(`/product/${p._id}`)}>
                    <div className="dm-item-thumb" style={{ backgroundImage: `url(${(p.images || [])[0] || ""})` }}></div>
                    <div className="dm-item-title">{p.name}</div>
                    <div className="dm-item-price">Rs {p.price}</div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
        <div className="dm-chat-messages">
          {loading ? (
            <div className="dm-chat-empty">Loading...</div>
          ) : messages.length === 0 ? (
            <div className="dm-chat-empty">No messages</div>
          ) : (
            messages.map((m) => {
              const mine = String(m.sender?._id || m.sender) === String(currentUser?._id);
              return (
                <div key={m._id} className={`dm-msg-row ${mine ? "outgoing" : "incoming"}`}>
                  <div className="dm-chat-msg">
                    <div className="dm-chat-msg-sender">{m.sender?.name || "You"}</div>
                    <div className={`dm-chat-msg-bubble ${mine ? "outgoing" : ""}`}>
                      {m.type === "audio" && m.audioUrl ? (
                        <audio controls src={getImageUrl(m.audioUrl)} style={{ width: 240 }} />
                      ) : m.text === "👍" ? (
                        <span style={{ fontSize: '32px' }}>👍</span>
                      ) : isImageUrl(m.text) ? (
                        <img src={m.text} alt="attachment" style={{ maxWidth: 220, borderRadius: 8 }} />
                      ) : (
                        m.text
                      )}
                    </div>
                    {m.createdAt && <div className="dm-msg-time">Sent {formatAgo(m.createdAt)}</div>}
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>
        <form onSubmit={sendMessage} className="dm-chat-inputbar">
          <div className="dm-compose-tools">
            <button type="button" className="icon-btn" title="Voice" onClick={onMicClick}>
              <Mic size={24} />
            </button>
            <button type="button" className="icon-btn" onClick={onPickImage} title="Image">
              <ImgIcon size={24} />
            </button>
            <button type="button" className="icon-btn" onClick={() => setShowEmoji((s) => !s)} title="Emoji">
              <Smile size={24} />
            </button>
          </div>
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type a message..."
            className="dm-chat-input"
          />
          {recording && (
            <div className="dm-recording-indicator">
              <span className="dm-recording-dot"></span>
              <span className="dm-recording-text">REC</span>
            </div>
          )}
          {text.trim() === "" ? (
            <button type="button" className="dm-like-btn" onClick={sendThumbsUp} title="Send Like">
              <ThumbsUp size={32} />
            </button>
          ) : (
            <button type="submit" className="dm-send-btn" title="Send Message">
              <Send size={32} />
            </button>
          )}
          <input ref={fileRef} type="file" accept="image/*" multiple className="hide" onChange={onFileChange} />
        </form>
        {showEmoji && (
          <div className="dm-emoji-popover">
            {["😀", "😁", "😂", "😊", "😍", "😘", "😎", "👍", "🙏", "🔥", "🎉", "💯", "🧡", "💡", "📦", "💵"].map((e) => (
              <button key={e} className="dm-emoji-btn" onClick={() => addEmoji(e)}>{e}</button>
            ))}
          </div>
        )}
        {showGifInput && (
          <div className="dm-gif-popover">
            <input
              className="dm-chat-input"
              placeholder="Paste GIF URL..."
              value={gifUrl}
              onChange={(e) => setGifUrl(e.target.value)}
            />
            <button className="dm-room-btn" onClick={sendGif}>Add</button>
          </div>
        )}
      </div>
    </div>
  );
}

function formatAgo(ts) {
  try {
    const d = new Date(ts);
    const diffMs = Date.now() - d.getTime();
    const mins = Math.floor(diffMs / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
  } catch {
    return "";
  }
}
