import { useCallback, useState } from "react";
import { api } from "../api/client";

const USER_ID_KEY = "english_coach_user_id";

function getStoredUserId() {
  return localStorage.getItem(USER_ID_KEY);
}

function storeUserId(id) {
  localStorage.setItem(USER_ID_KEY, id);
}

export function useSession() {
  const [session, setSession] = useState(null);
  const [conversation, setConversation] = useState([]);
  const [goalsCompleted, setGoalsCompleted] = useState(false);
  const [evaluation, setEvaluation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [userId, setUserId] = useState(getStoredUserId);

  const startSession = useCallback(async (scenarioId) => {
    setLoading(true);
    setError(null);
    setEvaluation(null);
    try {
      const data = await api.startSession({
        scenario_id: scenarioId,
        user_id: userId || undefined,
      });
      storeUserId(data.user_id);
      setUserId(data.user_id);
      setSession(data);
      setConversation(data.conversation || []);
      setGoalsCompleted(false);
      return data;
    } catch (e) {
      setError(e.message);
      throw e;
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const sendMessage = useCallback(
    async (message) => {
      if (!session?.session_id) return;
      setLoading(true);
      setError(null);
      try {
        const data = await api.sendMessage(session.session_id, message);
        setConversation(data.conversation);
        setGoalsCompleted(data.goals_completed);
        return data;
      } catch (e) {
        setError(e.message);
        throw e;
      } finally {
        setLoading(false);
      }
    },
    [session]
  );

  const endAndEvaluate = useCallback(async () => {
    if (!session?.session_id) return;
    setLoading(true);
    setError(null);
    try {
      await api.endSession(session.session_id);
      const evalData = await api.evaluateSession(session.session_id);
      setEvaluation(evalData);
      return evalData;
    } catch (e) {
      setError(e.message);
      throw e;
    } finally {
      setLoading(false);
    }
  }, [session]);

  const reset = useCallback(() => {
    setSession(null);
    setConversation([]);
    setGoalsCompleted(false);
    setEvaluation(null);
    setError(null);
  }, []);

  return {
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
  };
}
