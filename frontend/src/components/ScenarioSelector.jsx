export default function ScenarioSelector({ scenarios, onSelect, loading }) {
  if (!scenarios?.length) {
    return (
      <p className="text-slate-500 text-center py-8">Loading scenarios...</p>
    );
  }

  const difficultyColor = {
    beginner: "bg-emerald-100 text-emerald-800",
    intermediate: "bg-amber-100 text-amber-800",
    advanced: "bg-rose-100 text-rose-800",
  };

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {scenarios.map((scenario) => (
        <button
          key={scenario.id}
          type="button"
          disabled={loading}
          onClick={() => onSelect(scenario.id)}
          className="text-left p-5 rounded-xl border border-slate-200 bg-white shadow-sm
            hover:border-brand-500 hover:shadow-md transition-all disabled:opacity-50"
        >
          <div className="flex items-start justify-between gap-2 mb-2">
            <h3 className="font-semibold text-slate-900">{scenario.title}</h3>
            <span
              className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${
                difficultyColor[scenario.difficulty] || "bg-slate-100 text-slate-700"
              }`}
            >
              {scenario.difficulty}
            </span>
          </div>
          <p className="text-sm text-slate-600 line-clamp-3">{scenario.description}</p>
        </button>
      ))}
    </div>
  );
}
