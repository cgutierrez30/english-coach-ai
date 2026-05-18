export function CardSkeleton() {
  return (
    <div className="p-5 rounded-2xl border border-slate-200 bg-white animate-pulse">
      <div className="h-4 bg-slate-200 rounded w-1/3 mb-3" />
      <div className="h-3 bg-slate-100 rounded w-full mb-2" />
      <div className="h-3 bg-slate-100 rounded w-2/3" />
    </div>
  );
}

export function ScenarioGridSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {[1, 2, 3].map((i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  );
}

export function ProgressSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="grid gap-4 sm:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 bg-slate-200 rounded-xl" />
        ))}
      </div>
      <div className="h-64 bg-slate-200 rounded-xl" />
      <div className="h-40 bg-slate-200 rounded-xl" />
    </div>
  );
}

export function ChatSkeleton() {
  return (
    <div className="space-y-4 animate-pulse max-w-2xl mx-auto">
      <div className="h-6 bg-slate-200 rounded w-1/2" />
      <div className="h-12 bg-slate-100 rounded-2xl w-3/4" />
      <div className="h-12 bg-slate-200 rounded-2xl w-2/3 ml-auto" />
      <div className="h-12 bg-slate-100 rounded-2xl w-4/5" />
    </div>
  );
}
