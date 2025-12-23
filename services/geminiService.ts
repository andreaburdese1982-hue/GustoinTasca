import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(API_KEY);

// FUNZIONE MANCANTE RIPRISTINATA: Serve per caricare le immagini
export const fileToGenerativePart = async (file: File): Promise<{ inlineData: { data: string, mimeType: string } }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64Data = (reader.result as string).split(',')[1];
      resolve({
        inlineData: {
          data: base64Data,
          mimeType: file.type || "image/jpeg"
        }
      });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

export const analyzeBusinessCard = async (base64Data: string, mimeType: string = "image/jpeg") => {
  if (!API_KEY) throw new Error("API_KEY mancante.");

  const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: {
        type: SchemaType.OBJECT,
        properties: {
          name: { type: SchemaType.STRING },
          address: { type: SchemaType.STRING },
          phone: { type: SchemaType.STRING },
          website: { type: SchemaType.STRING },
          email: { type: SchemaType.STRING },
          suggestedTags: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
          lat: { type: SchemaType.NUMBER },
          lng: { type: SchemaType.NUMBER }
        },
        required: ["name"]
      }
    }
  });

  try {
    const result = await model.generateContent([
      "Analizza questo biglietto da visita ed estrai i dati in JSON.",
      { inlineData: { mimeType, data: base64Data } }
    ]);
    return JSON.parse(result.response.text());
  } catch (error) {
    console.error("Errore OCR:", error);
    throw error;
  }
};

export const askAiConcierge = async (query: string, cards: any[]) => {
  if (!API_KEY) return "Servizio IA non disponibile.";
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  const contextData = cards.map(c => ({ name: c.name, notes: c.notes || "" }));
  const prompt = `Sei il Concierge di Gusto in Tasca. Dati: ${JSON.stringify(contextData)}. Rispondi a: ${query}`;

  try {
    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (error) {
    return "Errore di connessione con l'IA.";
  }
};
