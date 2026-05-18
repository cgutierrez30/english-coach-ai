const API_BASE = "/api";

async function request(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json", ...options.headers },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || "Request failed");
  }
  return res.json();
}

export const api = {
  listScenarios: () => request("/scenarios"),
  startSession: (body) =>
    request("/sessions", { method: "POST", body: JSON.stringify(body) }),
  sendMessage: (sessionId, message) =>
    request(`/sessions/${sessionId}/message`, {
      method: "POST",
      body: JSON.stringify({ message }),
    }),
  endSession: (sessionId) =>
    request(`/sessions/${sessionId}/end`, { method: "POST" }),
  evaluateSession: (sessionId) =>
    request(`/sessions/${sessionId}/evaluate`, { method: "POST" }),
  getProgress: (userId) => request(`/progress/${userId}`),
  transcribeAudio: async (audioBlob) => {
    const form = new FormData();
    form.append("file", audioBlob, "audio.webm");
    const res = await fetch(`${API_BASE}/transcribe`, {
      method: "POST",
      body: form,
    });
    if (!res.ok) throw new Error("Transcription failed");
    return res.json();
  },
};
