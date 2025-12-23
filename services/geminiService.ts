import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(API_KEY);

export const analyzeBusinessCard = async (base64Data: string, mimeType: string = "image/jpeg") => {
  if (!API_KEY) throw new Error("API_KEY mancante.");

  const model = genAI.getGenerativeModel({
    model: "gemini-3-flash-preview",
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: {
        type: SchemaType.OBJECT,
        properties: {
          name: { type: SchemaType.STRING },
          address: { type: SchemaType.STRING },
          phone: { type: SchemaType.STRING },
          website: { type: SchemaType.STRING },
          email: { type: SchemaType.STRING }
        },
        required: ["name"]
      }
    }
  });

  try {
    // STRUTTURA SEMPLIFICATA: Un singolo oggetto content con testo e immagine insieme
    const result = await model.generateContent({
      contents: [{
        role: "user",
        parts: [
          { text: "Estrai dati dal biglietto da visita in JSON: name, address, phone, website, email." },
          { inlineData: { mimeType, data: base64Data } }
        ]
      }]
    });

    const response = await result.response;
    return JSON.parse(response.text());
  } catch (error) {
    console.error("Errore analisi:", error);
    throw error;
  }
};

export const askAiConcierge = async (query: string, cards: any[]) => {
  if (!API_KEY) return "Servizio non configurato.";
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });
    const context = JSON.stringify(cards.map(c => ({ name: c.name, notes: c.notes || "" })));
    const prompt = `Sei l'assistente di Gusto in Tasca. Locali: ${context}. Rispondi a: ${query}`;
    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (error) {
    return "L'assistente ha avuto un problema. Riprova.";
  }
};

export const fileToGenerativePart = async (file: File): Promise<{ data: string, mimeType: string }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64Data = (reader.result as string).split(',')[1];
      resolve({ data: base64Data, mimeType: file.type || "image/jpeg" });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};
