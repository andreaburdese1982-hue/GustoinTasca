import { GoogleGenerativeAI } from "@google/generative-ai";
// Force update for build resolution
// 1. IMPORTANTE: In Vite si usa import.meta.env invece di process.env
// Assicurati che su Vercel la variabile si chiami VITE_GEMINI_API_KEY
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

const genAI = new GoogleGenerativeAI(API_KEY);

/**
 * Converte un file in Base64 (utile se chiami questa funzione direttamente dal componente)
 */
export const fileToGenerativePart = async (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result;
      const base64Data = base64String.split(',')[1];
      resolve(base64Data);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

/**
 * Analizza il biglietto da visita
 */
export const analyzeBusinessCard = async (base64Image) => {
  if (!API_KEY) {
    throw new Error("Chiave API VITE_GEMINI_API_KEY non trovata. Controlla le impostazioni di Vercel.");
  }

  // Usiamo gemini-1.5-flash: è il più veloce e preciso per leggere immagini (OCR)
  const model = genAI.getGenerativeModel({ 
    model: "gemini-1.5-flash",
    generationConfig: {
      responseMimeType: "application/json",
    }
  });

  const prompt = `
    Analizza questa immagine di un biglietto da visita. 
    Estrai i dati in formato JSON seguendo questo schema:
    {
      "name": "Nome del locale o persona",
      "type": "Ristorante" | "Hotel" | "Esperienze",
      "address": "Indirizzo completo",
      "phone": "Numero di telefono",
      "website": "Sito web",
      "email": "Email",
      "suggestedTags": ["tag1", "tag2", "tag3"],
      "lat": numero,
      "lng": numero
    }
    Se non trovi un valore, usa una stringa vuota o null per i numeri.
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
    console.error("Errore durante l'analisi del biglietto:", error);
    throw error;
  }
};

/**
 * Concierge IA per chattare con i dati dei luoghi
 */
export const askAiConcierge = async (query, cards) => {
  if (!API_KEY) return "Configurazione IA incompleta.";

  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const contextData = cards.map(c => ({
    name: c.name,
    type: c.type,
    tags: c.tags?.join(', '),
    notes: c.notes
  }));

  const prompt = `
    Sei il Concierge di "Gusto in Tasca". 
    Dati dell'utente: ${JSON.stringify(contextData)}.
    Rispondi in modo amichevole a: ${query}
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("Concierge Error:", error);
    return "Ops! Non riesco a rispondere in questo momento.";
  }
};
