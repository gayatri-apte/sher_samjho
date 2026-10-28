import { useNavigate } from "react-router-dom";
import { Mic2, Search, Swords, ScanLine, Sun, Sparkles, BookMarked, ArrowRight } from "lucide-react";
import type { ReactNode } from "react";

type Feature = {
  to: string;
  icon: ReactNode;
  title: string;
  urdu: string;
  body: string;
  image?: string;
};

const VOICE: Feature[] = [
  {
    to: "/ustad",
    icon: <Mic2 size={22} />,
    title: "Ustad",
    urdu: "उस्ताद",
    body: "Recite a sher out loud. Your AI ustad hears every word, catches qaaf/kaaf and izafat slips, and corrects you aloud.",
  },
  {
    to: "/find",
    icon: <Search size={22} />,
    title: "Ek sher tha…",
    urdu: "एक शेर था",
    body: "Remember only half a line? Say it in broken Hindi or Urdu and get the full sher, the poet and the meaning.",
  },
  {
    to: "/baitbazi",
    icon: <Swords size={22} />,
    title: "Bait-bazi",
    urdu: "बैत-बाज़ी",
    body: "The classic couplet duel. Your sher ends on a letter; the AI must answer with one that starts on it. Then it's your turn.",
  },
];

const CORE: Feature[] = [
  { to: "/scan", icon: <ScanLine size={18} />, title: "Tasveer", urdu: "तस्वीर", body: "Scan printed Urdu — read it, hear it, understand it.", image: "/images/home-tasveer.png" },
  { to: "/feed", icon: <Sun size={18} />, title: "Aaj ka sher", urdu: "आज का शेर", body: "One sher a day, explained and ready to recite.", image: "/images/home-suniye.png" },
  { to: "/search", icon: <Sparkles size={18} />, title: "Mutala", urdu: "मुताला", body: "Search by meaning, mood, era or poet — then ask the AI.", image: "/images/urdu-bg.png" },
  { to: "/vocabulary", icon: <BookMarked size={18} />, title: "Deck", urdu: "लफ़्ज़", body: "Spaced-repetition deck fed by your lookups and your recitation mistakes.", image: "/images/home-sher-o-shayari.png" },
];

export default function HomePage() {
  const navigate = useNavigate();

  return (
    <div
      className="min-h-[calc(100vh-4rem)] bg-[#f8eee3] bg-cover bg-center text-[#3b2419]"
      style={{ backgroundImage: "url('/images/background-pattern-soft.png')" }}
    >
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-14 pb-10 text-center">
        <p lang="ur" dir="rtl" className="font-urdu text-2xl text-[#b0794c]">شعر سمجھو</p>
        <h1 className="mt-2 text-5xl sm:text-7xl font-bold tracking-tight text-[#8b4513]">
          Sher <span className="text-[#c08a58]">Samjho</span>
        </h1>
        <p className="mt-5 max-w-2xl mx-auto text-lg text-[#6b5645]">
          Love shayari but can't read Nastaliq or say <em>qalb</em> with confidence?
          Scan it, hear it, understand it — and practise reciting it with an AI ustad that listens.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={() => navigate("/ustad")}
            className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-[#c26a3b] hover:bg-[#a9552a] text-white font-semibold shadow-lg shadow-[#c26a3b]/30"
          >
            <Mic2 size={18} /> Recite today's sher
          </button>
          <button
            type="button"
            onClick={() => navigate("/scan")}
            className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full border border-[#c26a3b] text-[#a9552a] font-semibold hover:bg-[#fff2e5]"
          >
            <ScanLine size={18} /> Scan a sher
          </button>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-12">
        <h2 className="text-xs uppercase tracking-[0.3em] text-[#b08a6a] mb-4">Speak & listen</h2>
        <div className="grid gap-5 md:grid-cols-3">
          {VOICE.map((f) => (
            <button
              key={f.to}
              type="button"
              onClick={() => navigate(f.to)}
              className="group text-left rounded-3xl bg-[#5a2e14] text-[#fff3e4] p-6 shadow-xl hover:-translate-y-0.5 transition-transform focus:outline-none focus-visible:ring-4 focus-visible:ring-[#c26a3b]/40"
            >
              <div className="flex items-center justify-between">
                <span className="p-2.5 rounded-2xl bg-[#c26a3b]">{f.icon}</span>
                <span className="font-deva text-[#e9c9a8]">{f.urdu}</span>
              </div>
              <h3 className="mt-5 text-2xl font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm text-[#f0d9c2] leading-relaxed">{f.body}</p>
              <span className="mt-4 inline-flex items-center gap-1 text-sm text-[#f3b98a] group-hover:gap-2 transition-all">
                Try it <ArrowRight size={14} />
              </span>
            </button>
          ))}
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-16">
        <h2 className="text-xs uppercase tracking-[0.3em] text-[#b08a6a] mb-4">Read & understand</h2>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {CORE.map((f) => (
            <button
              key={f.to}
              type="button"
              onClick={() => navigate(f.to)}
              className="text-left bg-white/90 rounded-3xl shadow-md overflow-hidden hover:shadow-xl transition-shadow focus:outline-none focus-visible:ring-4 focus-visible:ring-[#c26a3b]/40"
            >
              {f.image && (
                <div className="h-28 bg-[#f3eee9] flex items-center justify-center overflow-hidden">
                  <img src={f.image} alt="" className="max-h-full w-full object-contain" loading="lazy" />
                </div>
              )}
              <div className="p-4">
                <div className="flex items-center gap-2 text-[#8b4513]">
                  {f.icon}
                  <h3 className="text-lg font-semibold">{f.title}</h3>
                  <span className="ml-auto font-deva text-sm text-[#b0794c]">{f.urdu}</span>
                </div>
                <p className="mt-1 text-sm text-[#6b5645] leading-relaxed">{f.body}</p>
              </div>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
