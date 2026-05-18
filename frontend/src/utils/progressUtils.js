export function computeStreak(sessions) {
  const dateSet = new Set(
    (sessions || [])
      .filter((s) => s.started_at)
      .map((s) => {
        const d = new Date(s.started_at);
        return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      })
  );

  if (dateSet.size === 0) return 0;

  const fmt = (d) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
  const today = new Date();
  let cursor = new Date(today);
  let streak = 0;

  if (!dateSet.has(fmt(cursor))) {
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (!dateSet.has(fmt(yesterday))) return 0;
    cursor = yesterday;
  }

  while (dateSet.has(fmt(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
}

export function getPersonalBests(sessions) {
  const bests = {};
  for (const s of sessions || []) {
    if (s.overall_score == null) continue;
    const id = s.scenario_id;
    if (!bests[id] || s.overall_score > bests[id].score) {
      bests[id] = {
        score: s.overall_score,
        title: s.scenario_title || id.replace(/_/g, " "),
      };
    }
  }
  return bests;
}

export function buildScoreTimeline(sessions) {
  return (sessions || [])
    .filter((s) => s.overall_score != null && s.started_at)
    .sort((a, b) => new Date(a.started_at) - new Date(b.started_at))
    .map((s, index) => ({
      index: index + 1,
      date: new Date(s.started_at).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
      }),
      score: s.overall_score,
      scenario: s.scenario_title || s.scenario_id,
      scenarioId: s.scenario_id,
    }));
}

export function buildScenarioSeries(timeline) {
  const byScenario = {};
  for (const point of timeline) {
    if (!byScenario[point.scenarioId]) {
      byScenario[point.scenarioId] = {
        id: point.scenarioId,
        title: point.scenario,
        data: [],
      };
    }
    byScenario[point.scenarioId].data.push(point);
  }
  return Object.values(byScenario);
}

export function buildChartPivot(timeline) {
  const pivot = {};
  for (const point of timeline) {
    if (!pivot[point.index]) {
      pivot[point.index] = {
        index: point.index,
        date: point.date,
        scenario: point.scenario,
      };
    }
    pivot[point.index][point.scenarioId] = point.score;
  }
  return Object.values(pivot);
}
