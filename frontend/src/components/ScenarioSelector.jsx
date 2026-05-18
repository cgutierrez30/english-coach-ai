const DIFFICULTY_ORDER = ["beginner", "intermediate", "advanced"];

const DIFFICULTY_STYLES = {
  beginner: {
    badge: "bg-emerald-100 text-emerald-800 border-emerald-200",
    dot: "bg-emerald-500",
    label: "Beginner",
  },
  intermediate: {
    badge: "bg-amber-100 text-amber-800 border-amber-200",
    dot: "bg-amber-500",
    label: "Intermediate",
  },
  advanced: {
    badge: "bg-rose-100 text-rose-800 border-rose-200",
    dot: "bg-rose-500",
    label: "Advanced",
  },
};

const ESTIMATED_MINUTES = {
  beginner: "~5 min",
  intermediate: "~8 min",
  advanced: "~12 min",
};

function groupByDifficulty(scenarios) {
  const groups = {};
  for (const s of scenarios) {
    const key = s.difficulty || "beginner";
    if (!groups[key]) groups[key] = [];
    groups[key].push(s);
  }
  return DIFFICULTY_ORDER.filter((d) => groups[d]?.length).map((d) => ({
    difficulty: d,
    scenarios: groups[d],
  }));
}

export default function ScenarioSelector({ scenarios, onSelect, loading }) {
  if (!scenarios?.length) {
    return null;
  }

  const groups = groupByDifficulty(scenarios);

  return (
    <div className="space-y-8 animate-fade-in">
      {groups.map(({ difficulty, scenarios: items }) => {
        const style = DIFFICULTY_STYLES[difficulty] || DIFFICULTY_STYLES.beginner;
        return (
          <section key={difficulty}>
            <div className="flex items-center gap-2 mb-4">
              <span className={`w-2.5 h-2.5 rounded-full ${style.dot}`} />
              <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                {style.label}
              </h3>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((scenario) => (
                <button
                  key={scenario.id}
                  type="button"
                  disabled={loading}
                  onClick={() => onSelect(scenario.id)}
                  className="group text-left p-5 rounded-2xl border border-slate-200 bg-white shadow-sm
                    hover:border-indigo-300 hover:shadow-lg hover:-translate-y-1
                    transition-all duration-200 disabled:opacity-50 disabled:hover:translate-y-0"
                >
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <h4 className="font-semibold text-slate-900 group-hover:text-indigo-700 transition-colors">
                      {scenario.title}
                    </h4>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full border shrink-0 font-medium ${style.badge}`}
                    >
                      {scenario.difficulty}
                    </span>
                  </div>
                  <p className="text-sm text-slate-600 line-clamp-3 mb-4 leading-relaxed">
                    {scenario.description}
                  </p>
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <ClockIcon />
                      {ESTIMATED_MINUTES[scenario.difficulty] || "~5 min"}
                    </span>
                    <span className="text-indigo-600 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                      Start →
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}

function ClockIcon() {
  return (
    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <circle cx="12" cy="12" r="9" />
      <path strokeLinecap="round" d="M12 7v5l3 2" />
    </svg>
  );
}
