import React, { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { MessageCircle, Send, X } from "lucide-react";
import api from "../../utils/api";
import "../../styles/components.css";

const FAQ_ITEMS = [
  { key: "post_product", label: "How to post a product" },
  { key: "search_filters", label: "How to search or use filters" },
  { key: "boost_product", label: "How to boost product" },
  { key: "edit_delete", label: "How to edit or delete a listing" },
  { key: "safety_guidelines", label: "Guidelines for safe transactions" },
  { key: "contact_support", label: "Contact Support" }
];

export default function FloatingChatbot() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [activeFaq, setActiveFaq] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesRef = useRef(null);

  const toggleOpen = () => {
    setOpen(!open);
  };

  const appendMessage = (msg) => {
    setMessages((prev) => [...prev, msg]);
  };

  useEffect(() => {
    if (open && messagesRef.current) {
      const el = messagesRef.current;
      el.scrollTop = el.scrollHeight;
    }
  }, [messages, loading, open]);

  const handleFaqClick = async (item) => {
    if (item.key === "contact_support") {
      navigate("/support");
      setOpen(false);
      return;
    }
    setActiveFaq(item.key);
    const userText = `Help with ${item.label.toLowerCase()}`;
    appendMessage({ id: Date.now() + "-user-faq", from: "user", type: "text", text: userText });
    setLoading(true);
    try {
      const res = await api.post("/ai/chatbot", {
        mode: "faq",
        faqKey: item.key,
        message: userText
      });
      const data = res.data || {};
      const answerText = data.answer || "I could not find information for this question right now.";
      appendMessage({
        id: Date.now() + "-bot-faq",
        from: "bot",
        type: "text",
        text: answerText,
        title: data.title || item.label
      });
    } catch {
      appendMessage({
        id: Date.now() + "-bot-faq-error",
        from: "bot",
        type: "text",
        text: "Something went wrong while loading this FAQ. Please try again."
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;
    const text = input.trim();
    appendMessage({ id: Date.now() + "-user", from: "user", type: "text", text });
    setInput("");

    // Record Chatbot signal as a search intent
    api.post("/activity/search", {
      raw: text,
      source: "chatbot",
      filters: null
    }).catch(() => { });

    setLoading(true);
    try {
      const res = await api.post("/ai/chatbot", {
        mode: "free",
        message: text
      });
      const data = res.data || {};
      if (data.type === "faq") {
        appendMessage({
          id: Date.now() + "-bot-faq-free",
          from: "bot",
          type: "text",
          text: data.answer || "Here is some help based on your question.",
          title: data.title || "Help"
        });
        return;
      }
      if (data.type === "product_search") {
        const products = Array.isArray(data.products) ? data.products : [];
        if (products.length === 0) {
          appendMessage({
            id: Date.now() + "-bot-empty",
            from: "bot",
            type: "text",
            text: data.message || "No matching products were found. Try changing your budget or brand."
          });
          return;
        }
        appendMessage({
          id: Date.now() + "-bot-products",
          from: "bot",
          type: "products",
          products
        });
        return;
      }
      appendMessage({
        id: Date.now() + "-bot-generic",
        from: "bot",
        type: "text",
        text: "I could not understand this request completely. Please try asking again in a different way."
      });
    } catch {
      appendMessage({
        id: Date.now() + "-bot-error",
        from: "bot",
        type: "text",
        text: "Something went wrong while contacting the assistant. Please try again."
      });
    } finally {
      setLoading(false);
    }
  };

  const renderMessage = (msg) => {
    if (msg.type === "products") {
      return (
        <div className="chatbot-msg chatbot-msg-bot">
          <div className="chatbot-msg-title">Recommended products</div>
          <div className="chatbot-product-list">
            {msg.products.slice(0, 5).map((p) => (
              <Link
                key={p._id}
                to={`/product/${p._id}`}
                className="chatbot-product-item"
                style={{ textDecoration: "none", color: "inherit", display: "block", textAlign: "left", width: "100%", background: "none", border: "none", padding: 0 }}
                onClick={() => {
                  api
                    .post("/activity/search-click", {
                      productId: p._id,
                      context: {
                        from: "chatbot",
                        matchScore: p.matchScore ?? null
                      }
                    })
                    .catch(() => { });
                }}
              >
                <div className="chatbot-product-main">
                  <div className="chatbot-product-name">{p.name}</div>
                  {p.brand && <div className="chatbot-product-brand">{p.brand}</div>}
                </div>
                <div className="chatbot-product-meta">
                  {typeof p.price === "number" && (
                    <span className="chatbot-product-price">Rs. {p.price}</span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </div>
      );
    }
    const cls = msg.from === "user" ? "chatbot-msg chatbot-msg-user" : "chatbot-msg chatbot-msg-bot";
    return (
      <div className={cls}>
        {msg.title && <div className="chatbot-msg-title">{msg.title}</div>}
        <div className="chatbot-msg-text">{msg.text}</div>
      </div>
    );
  };

  return (
    <div className="chatbot-floating-root">
      <button
        type="button"
        className="chatbot-floating-button"
        onClick={toggleOpen}
        aria-label="DealMate assistant"
      >
        <MessageCircle size={22} />
      </button>
      {open && (
        <div className="chatbot-panel">
          <div className="chatbot-header">
            <div className="chatbot-header-title">DealMate Assistant</div>
            <button
              type="button"
              className="chatbot-header-close"
              onClick={toggleOpen}
              aria-label="Close assistant"
            >
              <X size={16} />
            </button>
          </div>
          <div className="chatbot-faq-row">
            {FAQ_ITEMS.map((item) => (
              <button
                key={item.key}
                type="button"
                className={
                  "chatbot-faq-pill" + (activeFaq === item.key ? " chatbot-faq-pill-active" : "")
                }
                onClick={() => handleFaqClick(item)}
                disabled={loading}
              >
                {item.label}
              </button>
            ))}
          </div>
          <div className="chatbot-messages" ref={messagesRef}>
            {messages.length === 0 && (
              <div className="chatbot-empty">
                Ask how to post, search, boost listings, stay safe, or anything about DealMate.
              </div>
            )}
            {messages.map((m) => (
              <div key={m.id}>{renderMessage(m)}</div>
            ))}
            {loading && (
              <div className="chatbot-loading">
                Thinking...
              </div>
            )}
          </div>
          <form className="chatbot-input-row" onSubmit={handleSubmit}>
            <input
              className="chatbot-input"
              placeholder="Ask about posting, searching, boosting, safety, or general help..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={loading}
            />
            <button type="submit" className="chatbot-send-btn" disabled={loading || !input.trim()}>
              <Send size={16} />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
