export default function LandingPage({ onStart }) {
  return (
    <div className="animate-fade-in">
      <section className="text-center py-10 sm:py-16 px-4">
        <p className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-sm font-medium mb-6">
          Scenario-based English practice
        </p>
        <h1 className="text-3xl sm:text-5xl font-bold text-slate-900 tracking-tight max-w-2xl mx-auto leading-tight">
          Practice real conversations.{" "}
          <span className="text-indigo-600">Get expert feedback.</span>
        </h1>
        <p className="mt-5 text-slate-600 text-lg max-w-xl mx-auto leading-relaxed">
          Order food, call a school, or schedule a doctor&apos;s appointment — then
          receive rubric-based scores across fluency, vocabulary, and more.
        </p>
        <button
          type="button"
          onClick={onStart}
          className="mt-8 px-8 py-3.5 bg-indigo-600 text-white font-semibold rounded-xl shadow-lg shadow-indigo-200 hover:bg-indigo-700 hover:shadow-xl transition-all active:scale-[0.98]"
        >
          Start Practicing
        </button>
      </section>

      <section className="grid gap-4 sm:grid-cols-3 max-w-3xl mx-auto px-2 pb-8">
        <FeatureCard
          title="Real-life scenarios"
          description="Practice situations you'll actually face, with an AI partner that stays in character."
          icon="💬"
        />
        <FeatureCard
          title="Rubric evaluation"
          description="Get scored on 4 dimensions with clear feedback and next steps after each session."
          icon="📊"
        />
        <FeatureCard
          title="Track progress"
          description="See your scores over time, personal bests, and practice streaks."
          icon="📈"
        />
      </section>
    </div>
  );
}

function FeatureCard({ title, description, icon }) {
  return (
    <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm text-left hover:border-indigo-200 hover:shadow-md transition-all">
      <span className="text-2xl" role="img" aria-hidden>
        {icon}
      </span>
      <h3 className="font-semibold text-slate-900 mt-3">{title}</h3>
      <p className="text-sm text-slate-600 mt-1 leading-relaxed">{description}</p>
    </div>
  );
}
