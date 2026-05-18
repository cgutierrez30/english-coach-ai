import { useEffect, useRef, useState } from "react";

const MAX_CHARS = 500;

function TypingIndicator() {
  return (
    <div className="flex justify-start">
      <div className="bg-slate-200 rounded-2xl rounded-bl-md px-4 py-3 flex gap-1 items-center">
        <span className="w-2 h-2 bg-slate-500 rounded-full animate-bounce [animation-delay:0ms]" />
        <span className="w-2 h-2 bg-slate-500 rounded-full animate-bounce [animation-delay:150ms]" />
        <span className="w-2 h-2 bg-slate-500 rounded-full animate-bounce [animation-delay:300ms]" />
      </div>
    </div>
  );
}

function formatTime(date) {
  return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

export default function ConversationView({
  scenario,
  conversation,
  goalsCompleted,
  loading,
  onSend,
  onEnd,
  voice,
}) {
  const [input, setInput] = useState("");
  const [sendPulse, setSendPulse] = useState(false);
  const bottomRef = useRef(null);
  const lastSpokenRef = useRef("");
  const messageTimesRef = useRef([]);

  useEffect(() => {
    while (messageTimesRef.current.length < conversation.length) {
      messageTimesRef.current.push(new Date());
    }
  }, [conversation.length]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversation, loading]);

  useEffect(() => {
    if (voice?.transcript) {
      setInput(voice.transcript);
    }
  }, [voice?.transcript]);

  const lastAssistant = [...conversation]
    .reverse()
    .find((m) => m.role === "assistant");

  useEffect(() => {
    const text = lastAssistant?.content;
    if (text && text !== lastSpokenRef.current) {
      lastSpokenRef.current = text;
      voice?.speak?.(text);
    }
  }, [lastAssistant?.content, voice]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || loading) return;
    setInput("");
    voice?.setTranscript?.("");
    setSendPulse(true);
    setTimeout(() => setSendPulse(false), 200);
    onSend(text);
  };

  const charCount = input.length;
  const nearLimit = charCount > MAX_CHARS * 0.85;

  return (
    <div className="flex flex-col h-[calc(100dvh-8rem)] sm:h-[calc(100dvh-9rem)] max-w-2xl mx-auto animate-fade-in">
      <header className="shrink-0 pb-3 border-b border-slate-200 mb-3">
        <h2 className="text-lg sm:text-xl font-semibold text-slate-900">{scenario?.title}</h2>
        {goalsCompleted && (
          <p className="text-sm text-emerald-600 mt-1 font-medium flex items-center gap-1">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" />
            Goals completed — wrap up when you&apos;re ready
          </p>
        )}
      </header>

      <div className="flex-1 overflow-y-auto space-y-4 px-1 py-2 min-h-0">
        {conversation.map((msg, i) => {
          const isUser = msg.role === "user";
          const time = messageTimesRef.current[i];
          return (
            <div
              key={`${i}-${msg.content.slice(0, 20)}`}
              className={`flex flex-col ${isUser ? "items-end" : "items-start"}`}
            >
              <div
                className={`max-w-[88%] sm:max-w-[80%] px-4 py-2.5 shadow-sm ${
                  isUser
                    ? "bg-indigo-600 text-white rounded-[1.25rem] rounded-br-md"
                    : "bg-slate-200 text-slate-900 rounded-[1.25rem] rounded-bl-md"
                }`}
              >
                <p className="text-[15px] leading-relaxed whitespace-pre-wrap">{msg.content}</p>
              </div>
              {time && (
                <span className="text-[10px] text-slate-400 mt-1 px-1">
                  {formatTime(time)}
                </span>
              )}
            </div>
          );
        })}
        {loading && <TypingIndicator />}
        <div ref={bottomRef} />
      </div>

      <footer className="shrink-0 sticky bottom-0 pt-3 bg-gradient-to-t from-slate-50 via-slate-50 to-transparent">
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-200 shadow-lg p-2">
          <div className="flex gap-2 items-end">
            <div className="flex-1 min-w-0">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value.slice(0, MAX_CHARS))}
                placeholder="Message..."
                disabled={loading}
                className="w-full px-3 py-2.5 rounded-xl border-0 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-[15px] disabled:opacity-60"
              />
              <div className="flex justify-between px-1 mt-0.5">
                <span className={`text-[10px] ${nearLimit ? "text-amber-600" : "text-slate-400"}`}>
                  {charCount}/{MAX_CHARS}
                </span>
              </div>
            </div>
            {voice?.supported && (
              <button
                type="button"
                onClick={voice.isListening ? voice.stopListening : voice.startListening}
                className={`shrink-0 p-2.5 rounded-xl border transition-colors ${
                  voice.isListening
                    ? "bg-red-50 border-red-200 text-red-600"
                    : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                }`}
                title="Voice input"
                aria-label="Voice input"
              >
                <MicIcon listening={voice.isListening} />
              </button>
            )}
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className={`shrink-0 p-2.5 rounded-xl bg-indigo-600 text-white transition-all disabled:opacity-40 disabled:scale-100 hover:bg-indigo-700 active:scale-95 ${
                sendPulse ? "scale-90" : "scale-100"
              }`}
              aria-label="Send message"
            >
              <SendIcon />
            </button>
            <button
              type="button"
              onClick={onEnd}
              disabled={loading}
              className="shrink-0 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-600 border border-slate-200 hover:bg-slate-50 disabled:opacity-40"
            >
              Finish
            </button>
          </div>
        </form>
      </footer>
    </div>
  );
}

function MicIcon({ listening }) {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      {listening ? (
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
      ) : (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 14a3 3 0 003-3V5a3 3 0 10-6 0v6a3 3 0 003 3zm5 0a5 5 0 01-10 0M12 18v2"
        />
      )}
    </svg>
  );
}

function SendIcon() {
  return (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
      <path d="M3.4 20.6l17.2-8.6L3.4 3.4l2.9 6.3 7.6 2-7.6 2-2.9 6.3z" />
    </svg>
  );
}
