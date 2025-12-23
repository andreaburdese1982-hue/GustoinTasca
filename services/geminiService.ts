import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(API_KEY);

export const fileToGenerativePart = async (file) => {
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

export const analyzeBusinessCard = async (base64Image) => {
  if (!API_KEY) throw new Error("API Key mancante");

  // Versione ultra-semplificata per evitare errori 404
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const prompt = `
    Analizza questa immagine di un biglietto da visita e restituisci SOLO un oggetto JSON con:
    name, type (Ristorante, Hotel o Esperienze), address, phone, website, email, suggestedTags (array), lat, lng.
  `;

  try {
    const result = await model.generateContent([
      prompt,
      { inlineData: { mimeType: "image/jpeg", data: base64Image } }
    ]);
    const text = result.response.text();
    // Pulizia del testo da eventuali blocchi markdown ```json
    const cleanText = text.replace(/```json/g, "").replace(/```/g, "").trim();
    return JSON.parse(cleanText);
  } catch (error) {
    console.error("Errore analisi:", error);
    throw error;
  }
};

export const askAiConcierge = async (query, cards) => {
  if (!API_KEY) return "Configurazione IA incompleta.";

  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  const context = JSON.stringify(cards.map(c => ({ name: c.name, type: c.type, notes: c.notes })));

  const prompt = `Sei il Concierge di "Gusto in Tasca". Dati: ${context}. Rispondi a: ${query}`;

  try {
    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (error) {
    console.error("Errore Concierge:", error);
    return "Ops! Non riesco a rispondere ora.";
  }
};
