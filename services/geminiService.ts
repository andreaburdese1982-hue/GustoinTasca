import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";

// Recupera la chiave API dalle variabili d'ambiente di Vite/Vercel
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(API_KEY);

/**
 * 1. ANALISI BIGLIETTI DA VISITA (OCR)
 * Corretta per evitare l'errore "Starting an object on a scalar field"
 */
export const analyzeBusinessCard = async (base64Data: string, mimeType: string = "image/jpeg") => {
  if (!API_KEY) throw new Error("API_KEY mancante.");

  const model = genAI.getGenerativeModel({
    model: "gemini-3-flash-preview", // Modello verificato come attivo nel tuo account
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
    // La struttura corretta richiede che inlineData e text siano oggetti separati nell'array
    const result = await model.generateContent([
      {
        inlineData: {
          mimeType: mimeType,
          data: base64Data
        }
      },
      { text: "Analizza questo biglietto da visita ed estrai i dati in formato JSON: nome del locale, indirizzo, telefono, sito web e email." }
    ]);

    const responseText = result.response.text();
    return JSON.parse(responseText);
  } catch (error) {
    console.error("Errore durante l'analisi dell'immagine:", error);
    throw error;
  }
};

/**
 * 2. GUSTO ASSISTANT (CONCIERGE)
 * La funzione che abbiamo visto funzionare correttamente nella chat
 */
export const askAiConcierge = async (query: string, cards: any[]) => {
  if (!API_KEY) return "Servizio non configurato correttamente.";
  
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });
    
    const context = JSON.stringify(cards.map(c => ({ 
      name: c.name, 
      notes: c.notes || "",
      type: c.type 
    })));
    
    const prompt = `Sei l'assistente di Gusto in Tasca. Basandoti su questi locali salvati: ${context}, rispondi in modo amichevole, sintetico e in italiano a questa domanda: ${query}`;

    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (error: any) {
    console.error("Errore Assistente:", error);
    if (error.status === 429) {
      return "Troppe richieste. Riprova tra un minuto.";
    }
    return "L'assistente è momentaneamente offline.";
  }
};

/**
 * 3. HELPER PER I FILE
 * Necessario per la pagina AddCard.tsx per processare l'immagine prima dell'invio
 */
export const fileToGenerativePart = async (file: File): Promise<{ data: string, mimeType: string }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      // Estraiamo solo la parte base64 rimuovendo il prefisso "data:image/..."
      const base64String = reader.result as string;
      const base64Data = base64String.split(',')[1];
      resolve({
        data: base64Data,
        mimeType: file.type || "image/jpeg"
      });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};
