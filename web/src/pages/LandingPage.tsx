import { useNavigate } from "react-router-dom";

const FEATURES = [
  {
    icon: "🗺️",
    title: "AI-Powered Planning",
    desc: "Three specialist agents — attractions, accommodation, and transportation — collaborate to build your perfect itinerary.",
  },
  {
    icon: "💰",
    title: "Budget Tracking",
    desc: "Itemised cost breakdown with real-time overage alerts. Know exactly what your trip will cost before you go.",
  },
  {
    icon: "🧠",
    title: "Learns Your Style",
    desc: "Remembers your preferences across sessions. The more you plan, the better it gets at recommending what you'll love.",
  },
];

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 sm:px-12 py-5">
        <span className="text-xl font-bold text-gray-900 tracking-tight">Triplan</span>
        <button
          onClick={() => navigate("/chat")}
          className="text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors"
        >
          Open App &rarr;
        </button>
      </nav>

      {/* Hero */}
      <section className="flex flex-col items-center text-center px-6 pt-16 sm:pt-24 pb-20 animate-fade-in">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full mb-6">
          <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" />
          Powered by Google A2A Protocol
        </div>
        <h1 className="text-4xl sm:text-6xl font-bold text-gray-900 tracking-tight leading-tight max-w-3xl">
          Plan your next trip
          <br />
          <span className="text-blue-600">with AI agents</span>
        </h1>
        <p className="mt-6 text-lg sm:text-xl text-gray-500 max-w-xl leading-relaxed">
          Multiple AI specialists collaborate in real-time to craft your
          perfect itinerary, find the best hotels, and map out every route.
        </p>
        <button
          onClick={() => navigate("/chat")}
          className="mt-10 px-8 py-3.5 bg-blue-600 hover:bg-blue-700 text-white text-base font-medium rounded-xl shadow-lg shadow-blue-200 hover:shadow-blue-300 transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          Start Planning &rarr;
        </button>
        <p className="mt-4 text-xs text-gray-400">
          Free &middot; No sign-up required &middot; 3 plans per day
        </p>
      </section>

      {/* How it works */}
      <section className="px-6 sm:px-12 pb-24">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-center text-sm font-semibold text-gray-400 uppercase tracking-widest mb-10">
            How it works
          </h2>
          <div className="grid sm:grid-cols-3 gap-6">
            {FEATURES.map((f, i) => (
              <div
                key={f.title}
                className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md hover:border-gray-200 transition-all animate-fade-in-up"
                style={{ animationDelay: `${i * 120}ms` }}
              >
                <div className="text-3xl mb-4">{f.icon}</div>
                <h3 className="font-semibold text-gray-900 mb-2">{f.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Demo prompt */}
      <section className="px-6 sm:px-12 pb-24">
        <div className="max-w-2xl mx-auto text-center">
          <p className="text-sm text-gray-400 mb-4">Try something like</p>
          <button
            onClick={() => navigate("/chat")}
            className="inline-block bg-white border border-gray-200 rounded-xl px-6 py-4 text-left shadow-sm hover:shadow-md hover:border-gray-300 transition-all cursor-pointer w-full max-w-lg"
          >
            <p className="text-gray-800 font-medium">
              "Plan me a 4-day Tokyo trip, budget $1000, 2 people, interested
              in temples and local food"
            </p>
            <p className="text-xs text-gray-400 mt-2">
              Click to start planning &rarr;
            </p>
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-8 px-6 text-center">
        <p className="text-xs text-gray-400">
          Open source &middot;{" "}
          <a
            href="https://github.com/Pin-Han/triplan"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            GitHub
          </a>
          {" "}&middot; Apache 2.0
        </p>
      </footer>
    </div>
  );
}
