import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="border-t border-[#ecd6bd] bg-[#fdf4ea]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 flex flex-col sm:flex-row gap-4 sm:items-center justify-between text-sm text-[#7d5b44]">
        <div>
          <p className="font-semibold text-[#5a2e14]">Sher Samjho · <span lang="ur" className="font-urdu">شعر سمجھو</span></p>
          <p className="mt-1 text-xs text-[#94725a]">
            AI explanations and feedback can be wrong — Ustad is an AI coach, not a real poet.
          </p>
        </div>
        <nav className="flex flex-wrap gap-x-5 gap-y-2" aria-label="Footer">
          <Link to="/ustad" className="hover:text-[#a9552a]">Ustad</Link>
          <Link to="/scan" className="hover:text-[#a9552a]">Scan</Link>
          <Link to="/feed" className="hover:text-[#a9552a]">Aaj ka sher</Link>
          <Link to="/search" className="hover:text-[#a9552a]">Search</Link>
          <Link to="/vocabulary" className="hover:text-[#a9552a]">Deck</Link>
          <Link to="/admin" className="hover:text-[#a9552a]">Admin</Link>
        </nav>
      </div>
    </footer>
  );
}
