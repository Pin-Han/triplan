import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import MapPanel, { MapData } from "../components/MapPanel";
import ExportMenu from "../components/ExportMenu";

interface Message {
  id: string;
  role: "user" | "agent" | "error";
  text: string;
  timestamp: string;
  tokenUsage?: { input: number; output: number };
  durationMs?: number;
  mapData?: MapData | null;
}

export interface LogEntry {
  id: string;
  timestamp: string;
  userInput: string;
  durationMs: number;
  steps: { text: string; timestamp: string }[];
  tokenUsage?: { input: number; output: number };
}

const STORAGE_KEY = "chat-history";
const LOGS_KEY = "agent-logs";
const MAX_MESSAGES = 100;
const MAX_LOGS = 50;

function loadHistory(): Message[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {}
  return [];
}

function saveLogEntry(entry: LogEntry) {
  try {
    const raw = localStorage.getItem(LOGS_KEY);
    const logs: LogEntry[] = raw ? JSON.parse(raw) : [];
    const updated = [entry, ...logs].slice(0, MAX_LOGS);
    localStorage.setItem(LOGS_KEY, JSON.stringify(updated));
  } catch {}
}

/* ── Suggested prompts for empty state ─────────────────────────────── */

const SUGGESTIONS = [
  { icon: "🏯", text: "4-day Tokyo trip, temples and street food, $1000 budget" },
  { icon: "🏖️", text: "5-day Bali getaway, 2 people, beaches and culture" },
  { icon: "🗼", text: "3-day Paris weekend, art museums and cafés, solo traveler" },
  { icon: "🌸", text: "Week-long Kyoto trip, cherry blossom season, budget-friendly" },
];

/* ── Sub-components ────────────────────────────────────────────────── */

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  }

  return (
    <button
      onClick={handleCopy}
      className="text-[11px] text-slate-400 hover:text-slate-600 transition-colors flex items-center gap-1 px-1.5 py-0.5 rounded hover:bg-slate-100"
    >
      {copied ? (
        <>
          <svg className="w-3 h-3 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <span className="text-emerald-500">Copied</span>
        </>
      ) : (
        <>
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
          Copy
        </>
      )}
    </button>
  );
}

function ProgressIndicator({ status }: { status: string }) {
  return (
    <div className="flex justify-start animate-fade-in">
      <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white text-xs font-bold flex items-center justify-center mr-3 mt-0.5 shrink-0 shadow-sm">
        ✈
      </div>
      <div className="bg-white/80 backdrop-blur-sm border border-slate-200/60 rounded-2xl rounded-tl-md px-5 py-3.5 shadow-sm max-w-md">
        <div className="flex items-center gap-3">
          <div className="flex gap-1">
            <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
            <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
            <span className="w-1.5 h-1.5 bg-blue-300 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
          </div>
          <span className="text-sm text-slate-600">{status || "Planning your trip..."}</span>
        </div>
      </div>
    </div>
  );
}

function EmptyState({ onSuggestionClick }: { onSuggestionClick: (text: string) => void }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 animate-fade-in">
      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-2xl shadow-lg shadow-blue-200/50 mb-6">
        ✈️
      </div>
      <h2 className="text-xl font-semibold text-slate-800 mb-2">Where to next?</h2>
      <p className="text-sm text-slate-400 mb-8 max-w-sm text-center">
        Tell me your destination, dates, and interests — I'll coordinate three AI specialists to plan your perfect trip.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full max-w-lg">
        {SUGGESTIONS.map((s) => (
          <button
            key={s.text}
            onClick={() => onSuggestionClick(s.text)}
            className="flex items-start gap-3 text-left px-4 py-3 bg-white border border-slate-200/80 rounded-xl text-sm text-slate-600 hover:border-blue-300 hover:bg-blue-50/50 hover:text-slate-800 transition-all group"
          >
            <span className="text-lg mt-0.5 group-hover:scale-110 transition-transform">{s.icon}</span>
            <span className="leading-snug">{s.text}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ── Constants ─────────────────────────────────────────────────────── */

const CONTEXT_KEY = "conversation-context-id";

function loadContextId(): string {
  try {
    const stored = localStorage.getItem(CONTEXT_KEY);
    if (stored) return stored;
  } catch {}
  const id = crypto.randomUUID();
  try { localStorage.setItem(CONTEXT_KEY, id); } catch {}
  return id;
}

/* ── Main component ────────────────────────────────────────────────── */

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>(loadHistory);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [currentStatus, setCurrentStatus] = useState("");
  const [sessionTokens, setSessionTokens] = useState(0);
  const [contextId, setContextId] = useState<string>(loadContextId);
  const [activeMapData, setActiveMapData] = useState<MapData | null>(null);
  const [activeStructuredData, setActiveStructuredData] = useState<any>(null);
  const [activePlanText, setActivePlanText] = useState("");
  const [mobileView, setMobileView] = useState<"chat" | "map">("chat");
  const [remainingPlans, setRemainingPlans] = useState<number | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(messages.slice(-MAX_MESSAGES)));
  }, [messages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading, currentStatus]);

  useEffect(() => {
    fetch(`/api/rate-limit?contextId=${encodeURIComponent(contextId)}`)
      .then((r) => r.json())
      .then((data) => setRemainingPlans(data.remaining))
      .catch(() => {});
  }, [contextId, messages.length]);

  function clearConversation() {
    const newId = crypto.randomUUID();
    setContextId(newId);
    try { localStorage.setItem(CONTEXT_KEY, newId); } catch {}
    setMessages([]);
    setSessionTokens(0);
    setCurrentStatus("");
    localStorage.removeItem(STORAGE_KEY);
    setActiveMapData(null);
    setActiveStructuredData(null);
    setActivePlanText("");
    setMobileView("chat");
  }

  function handleSuggestionClick(text: string) {
    setInput(text);
    setTimeout(() => inputRef.current?.focus(), 0);
  }

  async function send() {
    const text = input.trim();
    if (!text || loading) return;

    setInput("");
    setLoading(true);
    setCurrentStatus("");

    const startTime = Date.now();
    const logSteps: { text: string; timestamp: string }[] = [];

    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: "user",
      text,
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);

    try {
      const storedPrompts = localStorage.getItem("agent-prompts");
      const promptOverrides = storedPrompts ? JSON.parse(storedPrompts) : undefined;

      const storedConfig = localStorage.getItem("llm-config");
      const llmConfig = storedConfig ? JSON.parse(storedConfig) : null;
      const provider = llmConfig?.provider || undefined;

      const metadata: Record<string, any> = {};
      if (promptOverrides) metadata.prompts = promptOverrides;
      if (provider) metadata.provider = provider;

      // A2A SDK handles JSON-RPC at POST /
      // In dev: Vite proxy rewrites /message/stream → /
      // In prod: same origin, post directly to /
      const streamUrl = import.meta.env.DEV ? "/message/stream" : "/";

      const res = await fetch(streamUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          method: "message/stream",
          id: `msg-${Date.now()}`,
          params: {
            message: {
              messageId: `msg-${Date.now()}`,
              role: "user",
              parts: [{ kind: "text", text }],
              kind: "message",
              contextId,
              metadata: Object.keys(metadata).length > 0 ? metadata : undefined,
            },
          },
        }),
      });

      if (!res.ok) {
        throw new Error("The server couldn't process your request. Please try again.");
      }

      const contentType = res.headers.get("content-type") || "";

      // ── SSE streaming path ──────────────────────────────────────────────────
      if (contentType.includes("text/event-stream")) {
        const reader = res.body!.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let finalText = "";
        let tokenUsage: Message["tokenUsage"] | undefined;
        let receivedMapData: MapData | null = null;

        outer: while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            let parsed: any;
            try {
              parsed = JSON.parse(line.slice(6));
            } catch {
              continue;
            }

            const event = parsed?.result;
            if (!event) continue;

            const kind: string = event.kind;

            if (kind === "status-update") {
              const msg: string | undefined = event.status?.message?.parts?.[0]?.text;
              if (msg) {
                setCurrentStatus(msg);
                logSteps.push({ text: msg, timestamp: new Date().toISOString() });
              }
              if (event.final) break outer;
            } else if (kind === "artifact-update") {
              const txt: string | undefined = event.artifact?.parts?.[0]?.text;
              if (txt) finalText = txt;
              const meta = event.artifact?.metadata;
              if (meta?.tokenUsage) {
                tokenUsage = { input: meta.tokenUsage.inputTokens, output: meta.tokenUsage.outputTokens };
                setSessionTokens((prev) => prev + meta.tokenUsage.inputTokens + meta.tokenUsage.outputTokens);
              }
              if (meta?.mapData) {
                receivedMapData = meta.mapData as MapData;
              }
            }
          }
        }

        const durationMs = Date.now() - startTime;

        if (receivedMapData) {
          setActiveMapData(receivedMapData);
          setActivePlanText(finalText);
        }

        // Save to log
        saveLogEntry({
          id: crypto.randomUUID(),
          timestamp: userMsg.timestamp,
          userInput: text,
          durationMs,
          steps: logSteps,
          tokenUsage,
        });

        setMessages((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            role: "agent",
            text: finalText || "(No response received)",
            timestamp: new Date().toISOString(),
            tokenUsage,
            durationMs,
            mapData: receivedMapData,
          },
        ]);
        return;
      }

      // ── Fallback: plain JSON (non-streaming) ────────────────────────────────
      const data = await res.json();
      const task = data.result;
      const reply =
        task?.artifacts?.[0]?.parts?.[0]?.text ||
        task?.status?.message?.parts?.[0]?.text ||
        "(No response received)";

      const durationMs = Date.now() - startTime;
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "agent",
          text: reply,
          timestamp: new Date().toISOString(),
          durationMs,
        },
      ]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "error",
          text: err.message || "Something went wrong. Please try again.",
          timestamp: new Date().toISOString(),
        },
      ]);
    } finally {
      setLoading(false);
      setCurrentStatus("");
    }
  }

  const hasMessages = messages.length > 0;

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-slate-50 to-slate-100/50">
      {/* ── Header ──────────────────────────────────────────────── */}
      <div className="px-5 sm:px-6 py-3 border-b border-slate-200/60 bg-white/70 backdrop-blur-md flex items-center justify-between">
        <div>
          <h2 className="font-semibold text-slate-800 text-[15px]">Travel Planner</h2>
          <p className="text-[11px] text-slate-400 hidden sm:block">
            Attractions + Accommodation + Transportation
          </p>
        </div>
        <div className="flex items-center gap-4">
          {remainingPlans !== null && (
            <span className="text-[11px] text-slate-400 hidden sm:inline tabular-nums">
              {remainingPlans} plans left today
            </span>
          )}
          {sessionTokens > 0 && (
            <span className="text-[11px] text-slate-400 hidden sm:inline tabular-nums">
              {sessionTokens.toLocaleString()} tokens
            </span>
          )}
          {hasMessages && (
            <button
              onClick={clearConversation}
              disabled={loading}
              className="text-[11px] text-slate-400 hover:text-red-500 disabled:opacity-40 transition-colors px-2 py-1 rounded-md hover:bg-red-50"
            >
              New chat
            </button>
          )}
        </div>
      </div>

      {/* ── Mobile tab toggle ───────────────────────────────────── */}
      {activeMapData && (
        <div className="md:hidden flex border-b border-slate-200/60 bg-white/70 backdrop-blur-md">
          <button
            onClick={() => setMobileView("chat")}
            className={`flex-1 py-2.5 text-xs font-medium text-center transition-colors ${mobileView === "chat" ? "text-blue-600 border-b-2 border-blue-600" : "text-slate-400"}`}
          >
            Chat
          </button>
          <button
            onClick={() => setMobileView("map")}
            className={`flex-1 py-2.5 text-xs font-medium text-center transition-colors ${mobileView === "map" ? "text-blue-600 border-b-2 border-blue-600" : "text-slate-400"}`}
          >
            Map
          </button>
        </div>
      )}

      {/* ── Main content area ───────────────────────────────────── */}
      <div className="flex-1 flex overflow-hidden">
        {/* Chat column */}
        <div className={`flex flex-col ${activeMapData ? "md:w-[60%]" : "w-full"} ${activeMapData && mobileView === "map" ? "hidden md:flex" : "flex"} w-full`}>

          {/* Empty state OR Messages */}
          {!hasMessages && !loading ? (
            <EmptyState onSuggestionClick={handleSuggestionClick} />
          ) : (
            <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-5 space-y-5">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} animate-fade-in`}
                >
                  {/* Agent / Error avatar */}
                  {(msg.role === "agent" || msg.role === "error") && (
                    <div className={`w-8 h-8 rounded-xl text-white text-xs font-bold flex items-center justify-center mr-3 mt-0.5 shrink-0 shadow-sm ${
                      msg.role === "error"
                        ? "bg-gradient-to-br from-red-400 to-red-600"
                        : "bg-gradient-to-br from-blue-500 to-indigo-600"
                    }`}>
                      {msg.role === "error" ? "!" : "✈"}
                    </div>
                  )}

                  <div className="flex flex-col max-w-[85%] sm:max-w-[70%]">
                    {/* Bubble */}
                    <div
                      className={`rounded-2xl px-4 py-3 text-[14px] leading-relaxed ${
                        msg.role === "user"
                          ? "bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-tr-md shadow-sm shadow-blue-200/50"
                          : msg.role === "error"
                          ? "bg-red-50 border border-red-200/80 text-red-700 rounded-tl-md"
                          : "bg-white border border-slate-200/60 text-slate-700 rounded-tl-md shadow-sm"
                      }`}
                    >
                      {msg.role === "agent" ? (
                        <div className="prose prose-sm prose-slate max-w-none prose-headings:text-slate-800 prose-headings:font-semibold prose-h2:text-base prose-h3:text-sm prose-p:text-slate-600 prose-strong:text-slate-800 prose-a:text-blue-600 prose-table:text-sm prose-td:py-1.5">
                          <ReactMarkdown>{msg.text}</ReactMarkdown>
                        </div>
                      ) : msg.role === "error" ? (
                        <div className="flex items-start gap-2.5">
                          <svg className="w-4 h-4 text-red-400 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                          </svg>
                          <span>{msg.text}</span>
                        </div>
                      ) : (
                        msg.text
                      )}
                    </div>

                    {/* Meta info */}
                    {msg.role === "agent" && (
                      <div className="flex items-center gap-2 mt-1.5 ml-1 flex-wrap">
                        <span className="text-[11px] text-slate-400 tabular-nums">
                          {msg.durationMs != null && `${(msg.durationMs / 1000).toFixed(1)}s`}
                          {msg.durationMs != null && msg.tokenUsage && " · "}
                          {msg.tokenUsage && `${(msg.tokenUsage.input + msg.tokenUsage.output).toLocaleString()} tokens`}
                        </span>
                        <CopyButton text={msg.text} />
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {loading && <ProgressIndicator status={currentStatus} />}
              <div ref={bottomRef} />
            </div>
          )}

          {/* ── Input area ────────────────────────────────────────── */}
          <div className="px-4 sm:px-6 py-4 bg-white/70 backdrop-blur-md border-t border-slate-200/60">
            <div className="flex gap-2.5 max-w-3xl mx-auto">
              <div className="flex-1 relative">
                <input
                  ref={inputRef}
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-700 placeholder:text-slate-400 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-400 transition-all"
                  placeholder="Where do you want to go?"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && send()}
                  disabled={loading}
                />
              </div>
              <button
                onClick={send}
                disabled={loading || !input.trim()}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-all shrink-0 shadow-sm hover:shadow-md disabled:shadow-none active:scale-[0.97]"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14m-7-7l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* ── Map panel ────────────────────────────────────────────── */}
        {activeMapData && (
          <div className={`${mobileView === "chat" ? "hidden md:flex" : "flex"} md:w-[40%] w-full flex-col border-l border-slate-200/60 bg-slate-50`}>
            <div className="px-4 py-2.5 border-b border-slate-200/60 bg-white/70 backdrop-blur-md flex items-center justify-between">
              <span className="text-sm font-medium text-slate-700">Trip Map</span>
              <ExportMenu structuredData={activeStructuredData} planText={activePlanText} />
            </div>
            <div className="flex-1 p-2">
              <MapPanel mapData={activeMapData} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
