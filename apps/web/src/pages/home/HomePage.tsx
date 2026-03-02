import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import {
  Home,
  Rss,
  BookOpen,
  Scan,
  History,
  BookMarked,
  Compass,
  Search,
  Sparkles,
} from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { logout } from "../../services/auth.service";

type SidebarItemProps = {
  icon: ReactNode;
  label: string;
  active?: boolean;
  onClick?: () => void;
};

type FeatureCardProps = {
  image: string;
  title: string;
  description: string;
};

export default function HomePage() {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();

  async function handleLogout() {
    await logout();
    navigate("/login");
  }

  return (
    <div
      className="relative flex min-h-screen text-[#5b4636] bg-cover bg-no-repeat bg-center"
      style={{backgroundImage: "url('/images/background-pattern-soft.png')"}}
    >
      {!isAuthenticated ? (
        <button
          type="button"
          onClick={() => navigate("/login")}
          className="absolute top-6 right-6 z-10 inline-flex items-center gap-2 px-5 py-2 rounded-full bg-[#d39a69] text-[#5a321c] text-sm font-semibold shadow-sm hover:bg-[#c78956] transition-colors"
        >
          Login
        </button>
      ) : (
        <button
          type="button"
          onClick={handleLogout}
          className="absolute top-6 right-6 z-10 inline-flex items-center gap-2 px-5 py-2 rounded-full bg-[#fff7ef] text-[#8b4513] text-sm font-semibold shadow-sm border border-[#e2c9ad] hover:bg-[#f6e2cf] transition-colors"
        >
          Logout
        </button>
      )}
      {/* SIDEBAR */}
      <aside className="w-64 flex-shrink-0 flex flex-col justify-between bg-[#efe7df] border-r border-[#e2d7cc]">
        <div>
          <div className="flex items-center gap-3 px-6 py-5 border-b border-[#e2d7cc]">
            <div className="bg-orange-500 p-2 rounded-lg text-white flex-shrink-0">
              <BookOpen size={18} />
            </div>
            <h1 className="text-lg font-semibold text-[#5b4636]">Sher Samjho</h1>
          </div>

          {/* Nav Items — in middle zone so they don’t overlap arch/lantern */}
          <nav className="mt-4 flex flex-col gap-2 px-3">
            <SidebarItem
              icon={<Home size={18} />}
              label="Home"
              active
              onClick={() => navigate("/")}
            />
            <SidebarItem
              icon={<Rss size={18} />}
              label="Daily Feed"
              onClick={() => navigate("/feed")}
            />
            <SidebarItem
              icon={<BookOpen size={18} />}
              label="Reader"
              onClick={() => navigate("/reader")}
            />
            <SidebarItem
              icon={<Scan size={18} />}
              label="Scan"
              onClick={() => navigate("/scan")}
            />
            <SidebarItem
              icon={<History size={18} />}
              label="History"
              onClick={() => navigate("/history")}
            />
            <SidebarItem
              icon={<BookMarked size={18} />}
              label="Vocabulary"
              onClick={() => navigate("/vocabulary")}
            />
            <SidebarItem
              icon={<Compass size={18} />}
              label="Discover"
              onClick={() => navigate("/discover")}
            />
            <SidebarItem
              icon={<Search size={18} />}
              label="Search"
              onClick={() => navigate("/search")}
            />
            <SidebarItem
              icon={<Sparkles size={18} />}
              label="Poetry AI"
              onClick={() => navigate("/poetry-ai")}
            />
          </nav>
        </div>

        <button
          type="button"
          onClick={() => navigate("/admin")}
          className="p-4 border-t border-[#e2d7cc] w-full text-left hover:bg-[#e8dfd5] transition"
        >
          <div className="flex items-center gap-3">
            <div className="bg-orange-500 text-white w-9 h-9 flex items-center justify-center rounded-full">
              {(user?.email?.[0] || user?.displayName?.[0] || "U").toUpperCase()}
            </div>
            <div>
              <p className="text-sm font-medium">
                {user?.displayName || "User Profile"}
              </p>
              <p className="text-xs text-gray-500">
                {user?.email || "View settings"}
              </p>
            </div>
          </div>
        </button>
      </aside>

      {/* MAIN */}
      <div className="flex flex-1 overflow-hidden">
        {/* MAIN CONTENT */}
        <main className="flex-1 p-12 pl-44 pr-0 overflow-auto">
          <div className="max-w-4xl">
            {/* Hero Section */}
            <div className="text-center mb-14">
              <h1 className="text-6xl font-bold text-[#8b4513]">
                Sher <span className="text-[#c08a58]">Samjho</span>
              </h1>
            </div>

            {/* Cards — 2x2 grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
              <FeatureCard
                image="/images/urdu-bg.png"
                title="मुताला"
                description="Deep analysis and interpretation of classical poetry with contextual meanings"
              />
              <FeatureCard
                image="/images/home-tasveer.png"
                title="तस्वीर"
                description="Upload images of poetry and get instant translations and explanations"
              />
              <FeatureCard
                image="/images/home-suniye.png"
                title="सुनिए"
                description="Listen to beautiful recitations with rhythm and pronunciation guidance"
              />
              <FeatureCard
                image="/images/home-sher-o-shayari.png"
                title="शेर-ओ-शायरी"
                description="AI-powered assistant to help you understand complex literary devices"
              />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

function SidebarItem({ icon, label, active, onClick }: SidebarItemProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-3 px-4 py-3 rounded-lg cursor-pointer transition w-full text-left
        ${
          active
            ? "bg-[#e8dfd5]/95 text-[#8b4513] font-medium"
            : "bg-[#efe7df]/70 hover:bg-[#e8dfd5]/90 text-[#6b5645]"
        }`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

function FeatureCard({ image, title, description }: FeatureCardProps) {
  return (
    <div className="bg-white rounded-2xl shadow-md overflow-hidden hover:shadow-xl transition">
      <div className="h-32 bg-[#f3eee9] flex items-center justify-center overflow-hidden">
        <img
          src={image}
          alt={title}
          className="max-h-full w-full object-contain"
        />
      </div>

      <div className="p-4">
        <h3 className="text-xl font-semibold mb-2 text-[#8b4513]">{title}</h3>
        <p className="text-sm text-[#6b5645] leading-relaxed">{description}</p>
      </div>
    </div>
  );
}
