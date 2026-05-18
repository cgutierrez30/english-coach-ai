export default function ProgressDashboard({ progress, loading }) {
  if (loading) {
    return <p className="text-slate-500 text-center py-8">Loading progress...</p>;
  }

  if (!progress) {
    return (
      <p className="text-slate-500 text-center py-8">
        Complete a session to see your progress here.
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Total Sessions" value={progress.total_sessions} />
        <StatCard label="Completed" value={progress.completed_sessions} />
        <StatCard
          label="Average Score"
          value={progress.average_score != null ? progress.average_score : "—"}
        />
      </div>

      {Object.keys(progress.scenarios_practiced || {}).length > 0 && (
        <section className="p-5 bg-white rounded-xl border border-slate-200">
          <h3 className="font-semibold text-slate-900 mb-3">Scenarios Practiced</h3>
          <ul className="space-y-2">
            {Object.entries(progress.scenarios_practiced).map(([id, count]) => (
              <li key={id} className="flex justify-between text-sm">
                <span className="text-slate-700">{id.replace(/_/g, " ")}</span>
                <span className="text-slate-500">{count} session{count !== 1 ? "s" : ""}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="p-5 bg-white rounded-xl border border-slate-200">
        <h3 className="font-semibold text-slate-900 mb-3">Recent Sessions</h3>
        {progress.sessions?.length === 0 ? (
          <p className="text-sm text-slate-500">No sessions yet.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {progress.sessions.map((s) => (
              <li key={s.session_id} className="py-3 flex justify-between items-start gap-4">
                <div>
                  <p className="font-medium text-slate-800">{s.scenario_title}</p>
                  <p className="text-xs text-slate-500">
                    {s.started_at ? new Date(s.started_at).toLocaleString() : ""}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm capitalize text-slate-600">{s.status}</p>
                  {s.overall_score != null && (
                    <p className="text-brand-700 font-semibold">{s.overall_score}/5</p>
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

function StatCard({ label, value }) {
  return (
    <div className="p-4 bg-white rounded-xl border border-slate-200 text-center">
      <p className="text-2xl font-bold text-brand-700">{value}</p>
      <p className="text-sm text-slate-500 mt-1">{label}</p>
    </div>
  );
}
