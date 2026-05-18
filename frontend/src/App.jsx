import { useCallback, useEffect, useState } from "react";
import { api } from "./api/client";
import ConversationView from "./components/ConversationView";
import EvaluationReport from "./components/EvaluationReport";
import ProgressDashboard from "./components/ProgressDashboard";
import ScenarioSelector from "./components/ScenarioSelector";
import { useSession } from "./hooks/useSession";
import { useVoiceInput } from "./hooks/useVoiceInput";

const TABS = ["practice", "progress"];

export default function App() {
  const [tab, setTab] = useState("practice");
  const [scenarios, setScenarios] = useState([]);
  const [scenariosLoading, setScenariosLoading] = useState(true);
  const [progress, setProgress] = useState(null);
  const [progressLoading, setProgressLoading] = useState(false);

  const {
    session,
    conversation,
    goalsCompleted,
    evaluation,
    loading,
    error,
    userId,
    startSession,
    sendMessage,
    endAndEvaluate,
    reset,
  } = useSession();

  const voice = useVoiceInput({
    onResult: (text) => {
      if (text) sendMessage(text);
    },
  });

  useEffect(() => {
    api
      .listScenarios()
      .then(setScenarios)
      .catch(console.error)
      .finally(() => setScenariosLoading(false));
  }, []);

  const loadProgress = useCallback(async () => {
    if (!userId) return;
    setProgressLoading(true);
    try {
      const data = await api.getProgress(userId);
      setProgress(data);
    } catch (e) {
      console.error(e);
    } finally {
      setProgressLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (tab === "progress") loadProgress();
  }, [tab, loadProgress]);

  const handleSelectScenario = async (scenarioId) => {
    await startSession(scenarioId);
  };

  const handleEnd = async () => {
    await endAndEvaluate();
    loadProgress();
  };

  const handleBack = () => {
    reset();
    loadProgress();
  };

  const view = evaluation
    ? "evaluation"
    : session
      ? "conversation"
      : "select";

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-brand-50">
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-brand-900">English Coach AI</h1>
          <nav className="flex gap-2">
            {TABS.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium capitalize ${
                  tab === t
                    ? "bg-brand-600 text-white"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                {t}
              </button>
            ))}
          </nav>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}

        {tab === "progress" ? (
          <ProgressDashboard progress={progress} loading={progressLoading} />
        ) : (
          <>
            {view === "select" && (
              <>
                <p className="text-slate-600 mb-6 text-center max-w-xl mx-auto">
                  Choose a real-life scenario and practice English through natural
                  conversation. Get rubric-based feedback when you finish.
                </p>
                <ScenarioSelector
                  scenarios={scenarios}
                  onSelect={handleSelectScenario}
                  loading={scenariosLoading || loading}
                />
              </>
            )}

            {view === "conversation" && (
              <ConversationView
                scenario={session.scenario}
                conversation={conversation}
                goalsCompleted={goalsCompleted}
                loading={loading}
                onSend={sendMessage}
                onEnd={handleEnd}
                voice={voice}
              />
            )}

            {view === "evaluation" && (
              <EvaluationReport evaluation={evaluation} onBack={handleBack} />
            )}
          </>
        )}
      </main>
    </div>
  );
}
