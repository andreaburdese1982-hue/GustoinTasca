import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";

// Recupera la chiave correttamente dall'ambiente Vite/Vercel
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(API_KEY);

export const analyzeBusinessCard = async (base64Image: string) => {
  if (!API_KEY) throw new Error("Chiave API non configurata su Vercel.");

  // Usiamo gemini-1.5-flash: è il più veloce per l'estrazione dati
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
      { inlineData: { mimeType: "image/jpeg", data: base64Image } }
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

  const contextData = cards.map(c => ({
    name: c.name,
    notes: c.notes || "",
    rating: c.rating
  }));

  const prompt = `Sei il Concierge di Gusto in Tasca. Basandoti su questi locali: ${JSON.stringify(contextData)}, rispondi in modo amichevole a: ${query}`;

  try {
    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (error) {
    console.error("Errore Concierge:", error);
    return "L'assistente ha avuto un problema di connessione. Riprova.";
  }
};
