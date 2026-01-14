export async function sendImageForOCR(file: File): Promise<string> {
    const base64 = await fileToBase64(file);
  
    const res = await fetch(
      "https://us-central1-internship-8cf33.cloudfunctions.net/api/ocr",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: base64 }),
      }
    );

    if (!res.ok) {
      throw new Error(`OCR request failed: ${res.status} ${res.statusText}`);
    }
  
    const data = await res.json();
    return data.text;
  }
  
  function fileToBase64(file: File): Promise<string> {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () =>
        resolve((reader.result as string).split(",")[1]);
      reader.readAsDataURL(file);
    });
  }
  