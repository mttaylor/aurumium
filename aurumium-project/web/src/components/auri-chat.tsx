"use client";

/**
 * AURI — in-product AI assistant for Aurumium.
 * Chat interface that calls /api/assistant/chat with streaming responses.
 * Handles tool calls (get_partner_metrics, get_book_metrics, get_stale_pipeline).
 */

import React, { useState, useRef, useEffect } from "react";
import { X, Send, Loader2 } from "lucide-react";

const C = {
  bg: "#0A0A0C",
  panel: "#121215",
  panelUp: "#17171B",
  line: "#232329",
  text: "#ECEAE3",
  dim: "#8E8F97",
  faint: "#5C5D66",
  gold: "#D4B876",
  goldDeep: "#8E7440",
  goldHi: "#F0E2B6",
  red: "#B05C5C",
  green: "#7FA98B",
};

type MessageRole = "user" | "assistant" | "tool";

interface Message {
  id: string;
  role: MessageRole;
  content: string;
  toolName?: string;
}

export function AuriChat({ onClose }: { onClose: () => void }) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "Hi! I'm Auri, your Aurumium assistant. Ask me about partner metrics, pipeline, or how to use the dashboard.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage: Message = {
      id: `msg-${Date.now()}`,
      role: "user",
      content: input,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const response = await fetch("/api/assistant/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenant_id: "sample", // in real app, this would come from auth context
          messages: [
            ...messages.filter((m) => m.role !== "tool"), // exclude tool messages from context
            userMessage,
          ].map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();

      // Extract text content from Anthropic response blocks
      let responseText = "";
      if (Array.isArray(data.content)) {
        for (const block of data.content) {
          if (block.type === "text") {
            responseText += block.text;
          }
        }
      } else if (typeof data.content === "string") {
        responseText = data.content;
      }

      if (responseText) {
        const assistantMessage: Message = {
          id: `msg-${Date.now()}-assistant`,
          role: "assistant",
          content: responseText,
        };
        setMessages((prev) => [...prev, assistantMessage]);
      }
    } catch (error) {
      const errorMsg: Message = {
        id: `msg-${Date.now()}-error`,
        role: "assistant",
        content: `Error: ${error instanceof Error ? error.message : "Failed to connect"}`,
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        right: 0,
        top: 0,
        width: "min(100vw, 420px)",
        height: "100vh",
        background: C.panel,
        borderLeft: `1px solid ${C.line}`,
        display: "flex",
        flexDirection: "column",
        zIndex: 1000,
        boxShadow: "-8px 0 32px rgba(0,0,0,.6)",
        animation: "slideIn .3s ease-out",
      }}
    >
      <style>{`
        @keyframes slideIn {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
      `}</style>

      {/* Header */}
      <div
        style={{
          padding: "16px 20px",
          borderBottom: `1px solid ${C.line}`,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div>
          <div style={{ fontSize: 14, fontWeight: 600, color: C.goldHi }}>Auri</div>
          <div style={{ fontSize: 11, color: C.faint, marginTop: 2 }}>Assistant</div>
        </div>
        <button
          onClick={onClose}
          aria-label="Close chat"
          style={{
            background: "none",
            border: "none",
            color: C.dim,
            cursor: "pointer",
            padding: 4,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "color .15s ease",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = C.goldDeep)}
          onMouseLeave={(e) => (e.currentTarget.style.color = C.dim)}
        >
          <X size={18} />
        </button>
      </div>

      {/* Messages */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "16px 20px",
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}
      >
        {messages.map((msg) => (
          <div
            key={msg.id}
            style={{
              display: "flex",
              justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
              gap: 8,
            }}
          >
            <div
              style={{
                maxWidth: "85%",
                padding: "10px 14px",
                borderRadius: 10,
                fontSize: 13,
                lineHeight: 1.5,
                backgroundColor:
                  msg.role === "user"
                    ? "rgba(212,184,118,.15)"
                    : msg.role === "tool"
                      ? "rgba(127,169,139,.08)"
                      : C.panelUp,
                color: msg.role === "tool" ? C.green : C.text,
                borderLeft:
                  msg.role === "tool" ? `3px solid ${C.green}` : "none",
                wordBreak: "break-word",
              }}
            >
              {msg.toolName && (
                <div
                  style={{
                    fontSize: 10,
                    color: C.faint,
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    marginBottom: 6,
                    fontWeight: 600,
                  }}
                >
                  {msg.toolName}
                </div>
              )}
              {msg.content}
            </div>
          </div>
        ))}
        {loading && (
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <div
              style={{
                padding: "10px 14px",
                borderRadius: 10,
                backgroundColor: C.panelUp,
                color: C.dim,
                fontSize: 13,
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <Loader2 size={14} style={{ animation: "spin .8s linear infinite" }} />
              Thinking...
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div
        style={{
          padding: "14px 20px",
          borderTop: `1px solid ${C.line}`,
        }}
      >
        <form
          onSubmit={sendMessage}
          style={{
            display: "flex",
            gap: 8,
            alignItems: "flex-end",
          }}
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about partners, metrics..."
            disabled={loading}
            style={{
              flex: 1,
              background: C.panelUp,
              border: `1px solid ${C.line}`,
              borderRadius: 8,
              color: C.text,
              padding: "10px 12px",
              fontSize: 13,
              fontFamily: "var(--font-body), sans-serif",
              outline: "none",
              transition: "border-color .15s ease",
              cursor: loading ? "not-allowed" : "text",
              opacity: loading ? 0.6 : 1,
            }}
            onFocus={(e) => (e.currentTarget.style.borderColor = C.goldDeep)}
            onBlur={(e) => (e.currentTarget.style.borderColor = C.line)}
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            aria-label="Send message"
            style={{
              background:
                loading || !input.trim()
                  ? `rgba(212,184,118,.3)`
                  : `linear-gradient(135deg, ${C.goldDeep} 0%, ${C.gold} 100%)`,
              border: "none",
              borderRadius: 8,
              color: C.bg,
              width: 36,
              height: 36,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: loading || !input.trim() ? "not-allowed" : "pointer",
              transition: "all .15s ease",
              flexShrink: 0,
            }}
          >
            <Send size={16} />
          </button>
        </form>
      </div>

      <style>{`
        div::-webkit-scrollbar { width: 6px; }
        div::-webkit-scrollbar-track { background: transparent; }
        div::-webkit-scrollbar-thumb { background: ${C.line}; border-radius: 3px; }
        div::-webkit-scrollbar-thumb:hover { background: ${C.faint}; }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
