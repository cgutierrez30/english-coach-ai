import { useEffect, useRef, useState } from "react";

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
  const bottomRef = useRef(null);
  const lastSpokenRef = useRef("");

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversation]);

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
    onSend(text);
  };

  return (
    <div className="flex flex-col h-full max-h-[70vh]">
      <div className="mb-4">
        <h2 className="text-xl font-semibold text-slate-900">{scenario?.title}</h2>
        {goalsCompleted && (
          <p className="text-sm text-emerald-600 mt-1 font-medium">
            Goals completed — you can wrap up or keep practicing.
          </p>
        )}
      </div>

      <div className="flex-1 overflow-y-auto space-y-3 p-4 bg-white rounded-xl border border-slate-200 mb-4">
        {conversation.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[85%] px-4 py-2 rounded-2xl text-sm ${
                msg.role === "user"
                  ? "bg-brand-600 text-white rounded-br-md"
                  : "bg-slate-100 text-slate-800 rounded-bl-md"
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2 flex-wrap">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your response..."
          disabled={loading}
          className="flex-1 min-w-[200px] px-4 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
        {voice?.supported && (
          <button
            type="button"
            onClick={voice.isListening ? voice.stopListening : voice.startListening}
            className={`px-3 py-2 rounded-lg border ${
              voice.isListening
                ? "bg-red-100 border-red-300 text-red-700"
                : "bg-white border-slate-300 text-slate-700"
            }`}
            title="Voice input"
          >
            {voice.isListening ? "Stop" : "Mic"}
          </button>
        )}
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 disabled:opacity-50"
        >
          Send
        </button>
        <button
          type="button"
          onClick={onEnd}
          disabled={loading}
          className="px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-800 disabled:opacity-50"
        >
          Finish
        </button>
      </form>
    </div>
  );
}
