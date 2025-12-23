import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(API_KEY);

// Funzione per la chat (Concierge)
export const askAiConcierge = async (query: string, cards: any[]) => {
  if (!API_KEY) return "Configurazione mancante.";
  
  try {
    // USIAMO IL MODELLO 2.0 FLASH (che vedi nella tua lista)
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    
    const context = JSON.stringify(cards.map(c => ({ name: c.name, notes: c.notes || "" })));
    const prompt = `Sei l'assistente di Gusto in Tasca. Dati: ${context}. Rispondi a: ${query}`;

    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (error) {
    console.error("Errore Gemini 2.0:", error);
    return "L'assistente sta aggiornando i menù, riprova tra un istante.";
  }
};

// Funzione per l'analisi dei biglietti da visita
export const analyzeBusinessCard = async (base64Data: string, mimeType: string = "image/jpeg") => {
  if (!API_KEY) throw new Error("API_KEY mancante.");

  const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash", // Allineato al modello disponibile
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: {
        type: SchemaType.OBJECT,
        properties: {
          name: { type: SchemaType.STRING },
          address: { type: SchemaType.STRING },
          phone: { type: SchemaType.STRING }
        },
        required: ["name"]
      }
    }
  });

  try {
    const result = await model.generateContent([
      "Estrai dati JSON: name, address, phone.",
      { inlineData: { mimeType, data: base64Data } }
    ]);
    return JSON.parse(result.response.text());
  } catch (error) {
    throw error;
  }
};

// Esportazione necessaria per AddCard.tsx (evita l'errore di build visto prima)
export const fileToGenerativePart = async (file: File) => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve({
      inlineData: { data: (reader.result as string).split(',')[1], mimeType: file.type }
    });
    reader.readAsDataURL(file);
  });
};
