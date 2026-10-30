import { useNavigate } from "react-router-dom";
import Page from "../../components/ui/Page";
import { POETS } from "../../data/poets";


export default function PoetExplorer() {
  const navigate = useNavigate();
  return (
    <Page title="Poets" subtitle="The masters of the ghazal. Open a poet to read, hear and recite their shers.">
      <div className="grid gap-4 sm:grid-cols-2">
        {POETS.map((p) => (
          <button
            key={p.name}
            type="button"
            onClick={() => navigate(`/explorer/poets/${encodeURIComponent(p.name)}`)}
            className="text-left rounded-2xl border border-[#ecd6bd] bg-[#fff8f0] p-5 hover:shadow-md transition-shadow"
          >
            <div className="flex items-baseline justify-between gap-3">
              <h2 className="text-lg font-semibold text-[#5a2e14]">{p.name}</h2>
              <span lang="ur" dir="rtl" className="font-urdu text-[#b0794c]">{p.urdu}</span>
            </div>
            <p className="text-xs text-[#94725a] mt-0.5">{p.years} · {p.era}</p>
            <p className="mt-3 text-sm text-[#5a3a28]">{p.note}</p>
          </button>
        ))}
      </div>
    </Page>
  );
}
