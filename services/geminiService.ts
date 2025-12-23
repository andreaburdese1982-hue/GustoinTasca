import { GoogleGenerativeAI } from "@google/generative-ai";

// Recupero la chiave dalle variabili d'ambiente di Vite
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(API_KEY);

/**
 * Converte un file immagine in Base64 per l'invio all'IA
 */
export const fileToGenerativePart = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      const base64Data = base64String.split(',')[1];
      resolve(base64Data);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

/**
 * Analizza il biglietto da visita usando Gemini 1.5 Flash
 */
export const analyzeBusinessCard = async (base64Image: string) => {
  if (!API_KEY) throw new Error("Chiave API VITE_GEMINI_API_KEY mancante su Vercel.");

  // Utilizziamo il nome modello standard che supporta l'OCR
  const model = genAI.getGenerativeModel({ 
    model: "gemini-1.5-flash",
    generationConfig: {
      responseMimeType: "application/json",
    }
  });

  const prompt = `
    Analizza questa immagine di un biglietto da visita. 
    Estrai i dati in formato JSON seguendo esattamente questo schema:
    {
      "name": "Nome del locale o persona",
      "type": "Ristorante" | "Hotel" | "Esperienze",
      "address": "Indirizzo completo",
      "phone": "Numero di telefono",
      "website": "Sito web",
      "email": "Email",
      "suggestedTags": ["tag1", "tag2", "tag3"],
      "lat": null,
      "lng": null
    }
    Se non trovi un valore, usa una stringa vuota.
  `;

  try {
    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          mimeType: "image/jpeg",
          data: base64Image
        }
      }
    ]);

    const response = await result.response;
    const text = response.text();
    return JSON.parse(text);
  } catch (error) {
    console.error("Errore analisi immagine:", error);
    throw error;
  }
};

/**
 * Concierge IA per rispondere alle domande basandosi sui dati salvati
 */
export const askAiConcierge = async (query: string, cards: any[]) => {
  if (!API_KEY) return "Configurazione IA incompleta (API Key mancante).";

  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const contextData = cards.map(c => ({
    name: c.name,
    type: c.type,
    notes: c.notes || ""
  }));

  const prompt = `
    Sei il Concierge ufficiale di "Gusto in Tasca", un assistente esperto di ospitalità. 
    Basandoti su questi dati: ${JSON.stringify(contextData)}, 
    rispondi in modo cordiale e sintetico alla seguente domanda dell'utente: ${query}
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("Errore Concierge:", error);
    if (error.message?.includes("404")) {
      return "Spiacente, il servizio IA (Gemini) non risponde. Verifica la validità della Chiave API su Vercel.";
    }
    return "Ops! Non riesco a rispondere in questo momento. Riprova tra poco.";
  }
};
