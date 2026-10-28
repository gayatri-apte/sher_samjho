import type { ReactNode } from "react";

type Props = {
  title?: string;
  subtitle?: ReactNode;
  children: ReactNode;
  width?: "md" | "lg" | "xl";
  bg?: "pattern" | "lanterns" | "plain";
};

/** Common page frame: warm background, centered column, heading. */
export default function Page({
  title,
  subtitle,
  children,
  width = "lg",
  bg = "pattern",
}: Props) {
  const max = width === "md" ? "max-w-2xl" : width === "lg" ? "max-w-4xl" : "max-w-6xl";
  const image =
    bg === "pattern"
      ? "url('/images/background-pattern-soft.png')"
      : bg === "lanterns"
        ? "url('/images/background-lanterns.png')"
        : undefined;
  return (
    <div
      className="min-h-[calc(100vh-4rem)] bg-[#f8eee3] bg-cover bg-top bg-no-repeat text-[#3b2419]"
      style={image ? { backgroundImage: image } : undefined}
    >
      <main className={`${max} mx-auto px-4 sm:px-6 py-8 sm:py-10`}>
        {title && (
          <header className="mb-6">
            <h1 className="text-3xl sm:text-4xl font-semibold text-[#5a2e14] tracking-tight">
              {title}
            </h1>
            {subtitle && <p className="mt-2 text-[#7d5b44] max-w-2xl">{subtitle}</p>}
          </header>
        )}
        {children}
      </main>
    </div>
  );
}

export function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-3xl bg-[#fff8f0]/95 border border-[#ecd6bd] shadow-[0_12px_40px_rgba(90,46,20,0.08)] p-5 sm:p-7 ${className}`}
    >
      {children}
    </section>
  );
}

export function ErrorNote({ children }: { children: ReactNode }) {
  return (
    <p
      role="alert"
      className="mt-3 rounded-xl border border-[#e9b4a4] bg-[#fdecea] px-4 py-3 text-sm text-[#8a2a1a]"
    >
      {children}
    </p>
  );
}
