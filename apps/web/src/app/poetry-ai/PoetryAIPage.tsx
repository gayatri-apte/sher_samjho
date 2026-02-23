import { useState } from "react";
import { useParams, useLocation } from "react-router-dom";
import { api, API_BASE } from "../../config/api";

type Message = { role: "user" | "ai"; text: string; disclaimer?: string };

export default function PoetryAIPage() {
  const { textHash: paramHash } = useParams<{ textHash?: string }>();
  const { state } = useLocation() as { state?: { cacheHash?: string; textHash?: string } };
  const textHash = paramHash ?? state?.textHash ?? state?.cacheHash ?? "";

  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [level, setLevel] = useState<"beginner" | "intermediate" | "scholar">("beginner");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function ask() {
    if (!question.trim() || !textHash) {
      setError(textHash ? "Please enter a question." : "No sher selected. Open a sher from Reader or Search first.");
      return;
    }
    setError(null);
    setLoading(true);
    console.log("API BASE:", API_BASE);
    console.log("Calling poetry-chat...", api.poetryChat);
    try {
      const res = await fetch(api.poetryChat, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          textHash,
          question: question.trim(),
          level,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessages((prev) => [
          ...prev,
          { role: "user", text: question },
          { role: "ai", text: data?.error ?? "Request failed." },
        ]);
        setQuestion("");
        setLoading(false);
        return;
      }
      setMessages((prev) => [
        ...prev,
        { role: "user", text: question },
        {
          role: "ai",
          text: data.answer ?? "",
          disclaimer: data.disclaimer,
        },
      ]);
      setQuestion("");
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "user", text: question },
        { role: "ai", text: "Network error. Please try again." },
      ]);
      setQuestion("");
    } finally {
      setLoading(false);
    }
  }

  if (!textHash) {
    return (
      <div className="min-h-screen bg-black text-white p-6 flex flex-col items-center justify-center gap-4">
        <h1 className="text-2xl">Conversational Poetry AI</h1>
        <p className="text-neutral-400 text-center max-w-sm">
          Open a sher from <a href="/reader" className="text-indigo-400 hover:underline">Reader</a> or{" "}
          <a href="/search" className="text-indigo-400 hover:underline">Search</a>, then come here to ask questions about it.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <h1 className="text-2xl mb-2">Conversational Poetry AI</h1>
      <p className="text-sm text-neutral-400 mb-4">
        Ask about symbolism, metaphor, history. AI output is labeled; interpretations may vary.
      </p>

      <div className="flex flex-wrap items-center gap-4 mb-6">
        <label className="text-sm text-neutral-400">Level</label>
        <select
          value={level}
          onChange={(e) => setLevel(e.target.value as "beginner" | "intermediate" | "scholar")}
          className="bg-neutral-800 text-white p-2 rounded border border-neutral-700"
        >
          <option value="beginner">Beginner</option>
          <option value="intermediate">Intermediate</option>
          <option value="scholar">Scholar</option>
        </select>
      </div>

      {error && (
        <p className="text-amber-400 text-sm mb-4" role="alert">
          {error}
        </p>
      )}

      <div className="space-y-4 mb-6">
        {messages.map((m, i) => (
          <div
            key={i}
            className={`p-3 rounded border ${
              m.role === "ai"
                ? "bg-neutral-900 border-neutral-700"
                : "bg-neutral-800/50 border-neutral-700"
            }`}
          >
            <strong className="text-sm text-neutral-400">
              {m.role === "ai" ? "AI" : "You"}:
            </strong>
            <p className="mt-1 whitespace-pre-wrap">{m.text}</p>
            {m.role === "ai" && m.disclaimer && (
              <p className="mt-2 text-xs text-neutral-500 italic">{m.disclaimer}</p>
            )}
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            ask();
          }
        }}
          className="flex-1 p-3 bg-neutral-800 rounded border border-neutral-700 placeholder-neutral-500"
          placeholder="Ask about symbolism, metaphor, history..."
          disabled={loading}
        />
        <button
          type="button"
          onClick={ask}
          disabled={loading}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 rounded font-medium"
        >
          {loading ? "…" : "Ask"}
        </button>
      </div>
    </div>
  );
}
