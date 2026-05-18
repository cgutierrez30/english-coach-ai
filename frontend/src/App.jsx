import { useCallback, useEffect, useState } from "react";
import { api } from "./api/client";
import ConversationView from "./components/ConversationView";
import EvaluationReport from "./components/EvaluationReport";
import LandingPage from "./components/LandingPage";
import Navbar from "./components/Navbar";
import ProgressDashboard from "./components/ProgressDashboard";
import ScenarioSelector from "./components/ScenarioSelector";
import { ChatSkeleton, ScenarioGridSkeleton } from "./components/ui/LoadingSkeleton";
import { useSession } from "./hooks/useSession";
import { useVoiceInput } from "./hooks/useVoiceInput";

export default function App() {
  const [tab, setTab] = useState("home");
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
    if (!userId) {
      setProgress(null);
      return;
    }
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

  const handleNavigate = (nextTab) => {
    setTab(nextTab);
    if (nextTab !== "practice") {
      reset();
    }
  };

  const handleSelectScenario = async (scenarioId) => {
    await startSession(scenarioId);
  };

  const handleEnd = async () => {
    await endAndEvaluate();
    loadProgress();
  };

  const handleBack = () => {
    reset();
    setTab("practice");
    loadProgress();
  };

  const practiceView = evaluation
    ? "evaluation"
    : session
      ? "conversation"
      : "select";

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-slate-50 to-indigo-50/30">
      <Navbar activeTab={tab} onNavigate={handleNavigate} />

      <main className="max-w-5xl mx-auto px-4 py-6 sm:py-8 page-enter">
        {error && (
          <div
            role="alert"
            className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm"
          >
            {error}
          </div>
        )}

        {tab === "home" && (
          <LandingPage onStart={() => setTab("practice")} />
        )}

        {tab === "progress" && (
          <div key="progress">
            <h2 className="text-2xl font-bold text-slate-900 mb-6">Your Progress</h2>
            <ProgressDashboard progress={progress} loading={progressLoading} />
          </div>
        )}

        {tab === "practice" && (
          <div key="practice">
            {practiceView === "select" && (
              <div className="animate-fade-in">
                <div className="mb-6 text-center sm:text-left">
                  <h2 className="text-2xl font-bold text-slate-900">Choose a Scenario</h2>
                  <p className="text-slate-600 mt-1 text-sm sm:text-base">
                    Pick a real-life situation and start practicing.
                  </p>
                </div>
                {scenariosLoading ? (
                  <ScenarioGridSkeleton />
                ) : (
                  <ScenarioSelector
                    scenarios={scenarios}
                    onSelect={handleSelectScenario}
                    loading={loading}
                  />
                )}
              </div>
            )}

            {practiceView === "conversation" && (
              <div key="chat" className="animate-fade-in">
                {loading && conversation.length <= 1 ? (
                  <ChatSkeleton />
                ) : (
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
              </div>
            )}

            {practiceView === "evaluation" && (
              <EvaluationReport evaluation={evaluation} onBack={handleBack} />
            )}
          </div>
        )}
      </main>
    </div>
  );
}
