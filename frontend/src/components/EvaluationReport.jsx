import {
  formatJustification,
  getDimensionAccent,
  getOverallScoreStyle,
  getScoreStyle,
} from "../utils/scoreUtils";

const DIMENSION_LABELS = {
  task_completion: "Task Completion",
  communicative_appropriateness: "Communicative Appropriateness",
  fluency: "Fluency",
  vocabulary_range: "Vocabulary Range",
};

function ScoreBar({ score, maxScore, barClass }) {
  const pct = Math.min(100, Math.max(0, (score / maxScore) * 100));
  return (
    <div className="h-2 w-full rounded-full bg-slate-200 overflow-hidden">
      <div
        className={`h-full rounded-full transition-all duration-700 ease-out ${barClass}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

function ScoreBreakdown({ dimensions }) {
  if (!dimensions?.length) return null;
  const sorted = [...dimensions].sort((a, b) => b.score - a.score);
  const best = sorted[0];
  const focus = sorted[sorted.length - 1];
  const spread =
    Math.max(...sorted.map((d) => d.score)) - Math.min(...sorted.map((d) => d.score));

  return (
    <section className="p-4 sm:p-5 bg-white rounded-2xl border border-slate-200 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
        <h3 className="font-semibold text-slate-900">Score Breakdown</h3>
        {spread > 0 && (
          <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded-full w-fit">
            Spread: {spread.toFixed(1)} pts across dimensions
          </span>
        )}
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        {dimensions.map((dim) => {
          const style = getScoreStyle(dim.score, dim.max_score);
          return (
            <div key={dim.name} className="text-center">
              <div
                className={`mx-auto w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold ${style.badge}`}
              >
                {dim.score}
              </div>
              <p className="text-[10px] sm:text-xs text-slate-600 mt-1.5 leading-tight">
                {(DIMENSION_LABELS[dim.name] || dim.name).split(" ")[0]}
              </p>
            </div>
          );
        })}
      </div>
      <div className="flex flex-wrap gap-2 text-xs">
        <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-100">
          Strongest: {DIMENSION_LABELS[best.name]} ({best.score}/5)
        </span>
        {focus.name !== best.name && (
          <span className="px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-100">
            Focus next: {DIMENSION_LABELS[focus.name]} ({focus.score}/5)
          </span>
        )}
      </div>
    </section>
  );
}

function DimensionCard({ dim, highlight }) {
  const style = getScoreStyle(dim.score, dim.max_score);
  const accent = getDimensionAccent(dim.name);
  const justification = formatJustification(dim.justification);

  return (
    <div
      className={`p-4 rounded-xl border shadow-sm transition-shadow ${
        highlight === "best"
          ? "border-emerald-300 ring-2 ring-emerald-100 bg-emerald-50/40"
          : highlight === "focus"
            ? "border-amber-300 ring-2 ring-amber-100"
            : `border-slate-200 border-l-4 ${accent.border} ${accent.bg}`
      }`}
    >
      <div className="flex justify-between items-start gap-3">
        <div>
          <h4 className={`font-semibold text-sm sm:text-base ${accent.label}`}>
            {DIMENSION_LABELS[dim.name] || dim.name}
          </h4>
          {highlight === "best" && (
            <span className="text-[10px] font-semibold uppercase text-emerald-600 tracking-wide">
              Top score
            </span>
          )}
          {highlight === "focus" && (
            <span className="text-[10px] font-semibold uppercase text-amber-600 tracking-wide">
              Room to grow
            </span>
          )}
        </div>
        <span
          className={`shrink-0 px-2.5 py-1 rounded-full text-xs font-bold shadow-sm ${style.badge}`}
        >
          {dim.score}/{dim.max_score}
        </span>
      </div>
      <ScoreBar score={dim.score} maxScore={dim.max_score} barClass={style.bar} />
      <p className="text-sm text-slate-600 mt-3 leading-relaxed">{justification}</p>
    </div>
  );
}

export default function EvaluationReport({ evaluation, onBack }) {
  if (!evaluation) return null;

  const { rubric, feedback, overall_score } = evaluation;
  const overallStyle = getOverallScoreStyle(overall_score);
  const dimensions = rubric?.dimensions || [];
  const sorted = [...dimensions].sort((a, b) => b.score - a.score);
  const bestName = sorted[0]?.name;
  const focusName = sorted[sorted.length - 1]?.name;

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h2 className="text-2xl font-bold text-slate-900">Session Evaluation</h2>
        <button
          type="button"
          onClick={onBack}
          className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
        >
          Practice another scenario →
        </button>
      </div>

      <div
        className={`p-6 bg-white rounded-2xl border border-slate-200 shadow-sm text-center ring-4 ${overallStyle.ring}`}
      >
        <p className="text-sm text-slate-500 uppercase tracking-wide font-medium">
          Overall Score
        </p>
        <p className="text-5xl font-bold text-indigo-700 mt-1">{overall_score}</p>
        <p className="text-slate-500 text-sm">out of 5 · weighted rubric</p>
        <div className="max-w-xs mx-auto mt-4">
          <ScoreBar score={overall_score} maxScore={5} barClass={overallStyle.bar} />
        </div>
      </div>

      <ScoreBreakdown dimensions={dimensions} />

      <div className="grid gap-4 sm:grid-cols-2">
        {dimensions.map((dim) => (
          <DimensionCard
            key={dim.name}
            dim={dim}
            highlight={
              dim.name === bestName && dim.name === focusName
                ? null
                : dim.name === bestName
                  ? "best"
                  : dim.name === focusName
                    ? "focus"
                    : null
            }
          />
        ))}
      </div>

      {feedback && (
        <>
          <section className="p-5 bg-white rounded-xl border border-slate-200 shadow-sm">
            <h3 className="font-semibold text-slate-900 mb-2">Summary</h3>
            <p className="text-slate-700 leading-relaxed">{feedback.summary}</p>
          </section>

          <div className="grid gap-4 sm:grid-cols-2">
            <section className="p-5 bg-emerald-50 rounded-xl border border-emerald-100">
              <h3 className="font-semibold text-emerald-900 mb-2">Strengths</h3>
              <ul className="list-disc list-inside text-sm text-emerald-800 space-y-1">
                {feedback.strengths?.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            </section>

            <section className="p-5 bg-amber-50 rounded-xl border border-amber-100">
              <h3 className="font-semibold text-amber-900 mb-2">Areas to Improve</h3>
              <ul className="list-disc list-inside text-sm text-amber-800 space-y-1">
                {feedback.areas_for_improvement?.map((a, i) => (
                  <li key={i}>{a}</li>
                ))}
              </ul>
            </section>
          </div>

          {feedback.specific_examples?.length > 0 && (
            <section className="p-5 bg-white rounded-xl border border-slate-200">
              <h3 className="font-semibold text-slate-900 mb-3">Examples</h3>
              <div className="space-y-3">
                {feedback.specific_examples.map((ex, i) => (
                  <blockquote key={i} className="border-l-4 border-indigo-300 pl-4">
                    <p className="text-slate-700 italic">&ldquo;{ex.quote}&rdquo;</p>
                    <p className="text-sm text-slate-600 mt-1">{ex.comment}</p>
                  </blockquote>
                ))}
              </div>
            </section>
          )}

          <section className="p-5 bg-indigo-50 rounded-xl border border-indigo-100">
            <h3 className="font-semibold text-indigo-900 mb-2">Next Steps</h3>
            <ol className="list-decimal list-inside text-sm text-indigo-800 space-y-1">
              {feedback.next_steps?.map((step, i) => (
                <li key={i}>{step}</li>
              ))}
            </ol>
          </section>
        </>
      )}
    </div>
  );
}
