import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ProgressSkeleton } from "./ui/LoadingSkeleton";
import {
  buildChartPivot,
  buildScenarioSeries,
  buildScoreTimeline,
  computeStreak,
  getPersonalBests,
} from "../utils/progressUtils";

const LINE_COLORS = ["#4f46e5", "#0891b2", "#7c3aed", "#059669", "#d97706"];

function EmptyState() {
  return (
    <div className="text-center py-16 px-6 bg-white rounded-2xl border border-dashed border-slate-300">
      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-indigo-50 flex items-center justify-center">
        <ChartIcon className="w-8 h-8 text-indigo-400" />
      </div>
      <h3 className="text-lg font-semibold text-slate-800 mb-2">No progress yet</h3>
      <p className="text-slate-500 text-sm max-w-sm mx-auto">
        Complete a practice session and get evaluated to see your scores, streaks, and
        personal bests here.
      </p>
    </div>
  );
}

export default function ProgressDashboard({ progress, loading }) {
  if (loading) {
    return <ProgressSkeleton />;
  }

  if (!progress) {
    return <EmptyState />;
  }

  const sessions = progress.sessions || [];
  const timeline = buildScoreTimeline(sessions);
  const scenarioSeries = buildScenarioSeries(timeline);
  const chartData = buildChartPivot(timeline);
  const personalBests = getPersonalBests(sessions);
  const streak = computeStreak(sessions);
  const hasScores = timeline.length > 0;

  if (progress.total_sessions === 0) {
    return <EmptyState />;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid gap-4 grid-cols-2 sm:grid-cols-4">
        <StatCard label="Total Sessions" value={progress.total_sessions} />
        <StatCard label="Completed" value={progress.completed_sessions} />
        <StatCard
          label="Average Score"
          value={progress.average_score != null ? progress.average_score : "—"}
        />
        <StatCard
          label="Practice Streak"
          value={streak}
          suffix={streak === 1 ? " day" : " days"}
          highlight
        />
      </div>

      {hasScores && (
        <section className="p-4 sm:p-6 bg-white rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="font-semibold text-slate-900 mb-4">Score Over Time</h3>
          <div className="h-64 sm:h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={chartData}
                margin={{ top: 8, right: 8, left: -16, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis
                  dataKey="index"
                  tick={{ fontSize: 12, fill: "#64748b" }}
                  label={{
                    value: "Session #",
                    position: "insideBottom",
                    offset: -2,
                    fontSize: 11,
                    fill: "#94a3b8",
                  }}
                />
                <YAxis
                  domain={[1, 5]}
                  ticks={[1, 2, 3, 4, 5]}
                  tick={{ fontSize: 12, fill: "#64748b" }}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: "12px",
                    border: "1px solid #e2e8f0",
                    fontSize: "13px",
                  }}
                  formatter={(value) => [`${value}/5`, "Score"]}
                  labelFormatter={(label) => `Session ${label}`}
                />
                <Legend wrapperStyle={{ fontSize: "12px" }} />
                {scenarioSeries.map((series, i) => (
                  <Line
                    key={series.id}
                    name={series.title}
                    dataKey={series.id}
                    stroke={LINE_COLORS[i % LINE_COLORS.length]}
                    strokeWidth={2.5}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                    connectNulls
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>
      )}

      {Object.keys(personalBests).length > 0 && (
        <section className="p-5 bg-white rounded-2xl border border-slate-200">
          <h3 className="font-semibold text-slate-900 mb-3">Personal Bests</h3>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {Object.entries(personalBests).map(([id, best]) => (
              <div
                key={id}
                className="flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-indigo-50 to-white border border-indigo-100"
              >
                <span className="text-sm font-medium text-slate-800">{best.title}</span>
                <span className="text-lg font-bold text-indigo-700">{best.score}/5</span>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="p-5 bg-white rounded-2xl border border-slate-200">
        <h3 className="font-semibold text-slate-900 mb-3">Recent Sessions</h3>
        {sessions.length === 0 ? (
          <p className="text-sm text-slate-500">No sessions yet.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {sessions.map((s) => (
              <li
                key={s.session_id}
                className="py-3 flex justify-between items-start gap-4"
              >
                <div className="min-w-0">
                  <p className="font-medium text-slate-800 truncate">{s.scenario_title}</p>
                  <p className="text-xs text-slate-500">
                    {s.started_at ? new Date(s.started_at).toLocaleString() : ""}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm capitalize text-slate-600">{s.status}</p>
                  {s.overall_score != null && (
                    <p className="text-indigo-700 font-semibold">{s.overall_score}/5</p>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function StatCard({ label, value, suffix = "", highlight = false }) {
  return (
    <div
      className={`p-4 rounded-xl border text-center ${
        highlight
          ? "bg-indigo-600 border-indigo-600 text-white"
          : "bg-white border-slate-200"
      }`}
    >
      <p
        className={`text-2xl font-bold ${highlight ? "text-white" : "text-indigo-700"}`}
      >
        {value}
        {suffix && (
          <span className={`text-sm font-normal ${highlight ? "text-indigo-100" : "text-slate-500"}`}>
            {suffix}
          </span>
        )}
      </p>
      <p
        className={`text-xs sm:text-sm mt-1 ${highlight ? "text-indigo-100" : "text-slate-500"}`}
      >
        {label}
      </p>
    </div>
  );
}

function ChartIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 13.5l4-4 4 4 5-7 4 4M3 19h18"
      />
    </svg>
  );
}
