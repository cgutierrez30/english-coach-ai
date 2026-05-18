const DIMENSION_LABELS = {
  task_completion: "Task Completion",
  communicative_appropriateness: "Communicative Appropriateness",
  fluency: "Fluency",
  vocabulary_range: "Vocabulary Range",
};

export default function EvaluationReport({ evaluation, onBack }) {
  if (!evaluation) return null;

  const { rubric, feedback, overall_score } = evaluation;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-900">Session Evaluation</h2>
        <button
          type="button"
          onClick={onBack}
          className="text-sm text-brand-600 hover:underline"
        >
          Practice another scenario
        </button>
      </div>

      <div className="p-6 bg-white rounded-xl border border-slate-200 shadow-sm text-center">
        <p className="text-sm text-slate-500 uppercase tracking-wide">Overall Score</p>
        <p className="text-5xl font-bold text-brand-700 mt-1">{overall_score}</p>
        <p className="text-slate-500 text-sm">out of 5</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {rubric?.dimensions?.map((dim) => (
          <div
            key={dim.name}
            className="p-4 bg-white rounded-lg border border-slate-200"
          >
            <div className="flex justify-between items-center mb-1">
              <span className="font-medium text-slate-800">
                {DIMENSION_LABELS[dim.name] || dim.name}
              </span>
              <span className="text-brand-700 font-semibold">
                {dim.score}/{dim.max_score}
              </span>
            </div>
            <p className="text-sm text-slate-600">{dim.justification}</p>
          </div>
        ))}
      </div>

      {feedback && (
        <>
          <section className="p-5 bg-white rounded-xl border border-slate-200">
            <h3 className="font-semibold text-slate-900 mb-2">Summary</h3>
            <p className="text-slate-700">{feedback.summary}</p>
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
                  <blockquote key={i} className="border-l-4 border-brand-300 pl-4">
                    <p className="text-slate-700 italic">&ldquo;{ex.quote}&rdquo;</p>
                    <p className="text-sm text-slate-600 mt-1">{ex.comment}</p>
                  </blockquote>
                ))}
              </div>
            </section>
          )}

          <section className="p-5 bg-brand-50 rounded-xl border border-brand-100">
            <h3 className="font-semibold text-brand-900 mb-2">Next Steps</h3>
            <ol className="list-decimal list-inside text-sm text-brand-800 space-y-1">
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
