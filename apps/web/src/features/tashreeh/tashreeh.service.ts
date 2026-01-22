export async function fetchTashreeh(text: string): Promise<string> {
    const res = await fetch(
      "https://us-central1-internship-8cf33.cloudfunctions.net/api/tashreeh",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      }
    );
  
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      const errorMessage = errorData.error || errorData.message || `HTTP ${res.status}: ${res.statusText}`;
      throw new Error(`Explanation failed: ${errorMessage}`);
    }
  
    const data = await res.json();
    if (!data.explanation) {
      throw new Error("No explanation received from server");
    }
    return data.explanation;
  }
  