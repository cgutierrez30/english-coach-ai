const DIMENSION_ACCENTS = {
  task_completion: {
    border: "border-l-indigo-500",
    bg: "bg-indigo-50",
    label: "text-indigo-900",
  },
  communicative_appropriateness: {
    border: "border-l-violet-500",
    bg: "bg-violet-50",
    label: "text-violet-900",
  },
  fluency: {
    border: "border-l-sky-500",
    bg: "bg-sky-50",
    label: "text-sky-900",
  },
  vocabulary_range: {
    border: "border-l-teal-500",
    bg: "bg-teal-50",
    label: "text-teal-900",
  },
};

export function getScoreStyle(score, maxScore = 5) {
  const s = Number(score);
  if (s >= 4) {
    return {
      badge: "bg-emerald-500 text-white",
      bar: "bg-emerald-500",
      ring: "ring-emerald-200",
    };
  }
  if (s >= 3) {
    return {
      badge: "bg-amber-500 text-white",
      bar: "bg-amber-500",
      ring: "ring-amber-200",
    };
  }
  return {
    badge: "bg-rose-500 text-white",
    bar: "bg-rose-500",
    ring: "ring-rose-200",
  };
}

export function getDimensionAccent(name) {
  return (
    DIMENSION_ACCENTS[name] || {
      border: "border-l-slate-400",
      bg: "bg-slate-50",
      label: "text-slate-900",
    }
  );
}

export function formatJustification(text) {
  if (!text) return "Based on your conversation.";
  if (/heuristic score \(no api key\)/i.test(text)) {
    return "Based on your conversation.";
  }
  return text;
}

export function getOverallScoreStyle(score) {
  return getScoreStyle(score);
}
