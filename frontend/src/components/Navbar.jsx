const NAV_ITEMS = [
  { id: "home", label: "Home" },
  { id: "practice", label: "Practice" },
  { id: "progress", label: "Progress" },
];

export default function Navbar({ activeTab, onNavigate }) {
  return (
    <header className="border-b border-slate-200 bg-white/90 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={() => onNavigate("home")}
          className="flex items-center gap-2.5 group"
        >
          <span className="flex items-center justify-center w-9 h-9 rounded-xl bg-indigo-600 text-white font-bold text-sm shadow-md group-hover:bg-indigo-700 transition-colors">
            EC
          </span>
          <span className="font-bold text-slate-900 hidden sm:block group-hover:text-indigo-700 transition-colors">
            English Coach AI
          </span>
        </button>

        <nav className="flex gap-1 p-1 bg-slate-100 rounded-xl">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => onNavigate(item.id)}
              className={`px-3 sm:px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === item.id
                  ? "bg-white text-indigo-700 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {item.label}
            </button>
          ))}
        </nav>
      </div>
    </header>
  );
}
