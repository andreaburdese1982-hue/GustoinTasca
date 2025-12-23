import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";

// Recupera la chiave API dalle variabili d'ambiente di Vite/Vercel
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(API_KEY);

/**
 * Funzione per la Chat (Gusto Assistant)
 */
export const askAiConcierge = async (query: string, cards: any[]) => {
  if (!API_KEY) return "Configurazione mancante.";
  
  try {
    // Usiamo il modello più recente disponibile nella tua lista
    const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });
    
    const context = JSON.stringify(cards.map(c => ({ 
      name: c.name, 
      notes: c.notes || "" 
    })));
    
    const prompt = `Sei l'assistente di Gusto in Tasca. Basandoti su questi locali: ${context}, rispondi in modo amichevole e sintetico a: ${query}`;

    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (error: any) {
    console.error("Errore Gemini 3:", error);
    // Se l'errore è il 429 (quota superata), avvisiamo l'utente
    if (error.status === 429) {
      return "L'IA ha troppe richieste al momento. Riprova tra un minuto.";
    }
    return "L'assistente è momentaneamente offline.";
  }
};

/**
 * Funzione per l'analisi dei biglietti da visita (OCR)
 */
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
          phone: { type: SchemaType.STRING }
        },
        required: ["name"]
      }
    }
  });

  try {
    const result = await model.generateContent([
      "Analizza l'immagine ed estrai i dati in formato JSON.",
      { inlineData: { mimeType, data: base64Data } }
    ]);
    return JSON.parse(result.response.text());
  } catch (error) {
    console.error("Errore OCR:", error);
    throw error;
  }
};

/**
 * Helper per convertire i file immagine in un formato leggibile dall'IA
 * Necessario per evitare errori di esportazione in AddCard.tsx
 */
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
