import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

// Inizializzazione pulita
const genAI = new GoogleGenerativeAI(API_KEY);

export const askAiConcierge = async (query, cards) => {
  if (!API_KEY) return "Configurazione incompleta.";

  try {
    // Puntiamo al modello base senza versioni beta nel nome
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const context = JSON.stringify(cards.map(c => ({ name: c.name, notes: c.notes })));
    const prompt = `Sei l'assistente di Gusto in Tasca. Basandoti su questi dati: ${context}, rispondi a: ${query}`;

    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (error) {
    console.error("Dettaglio Errore:", error);
    return "L'IA è in manutenzione, riprova tra un istante.";
  }
};

export const fileToGenerativePart = async (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

export const analyzeBusinessCard = async (base64Image) => {
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  const prompt = "Estrai dati dal biglietto da visita in formato JSON: name, address, phone.";
  try {
    const result = await model.generateContent([prompt, { inlineData: { mimeType: "image/jpeg", data: base64Image } }]);
    const text = result.response.text().replace(/```json|```/g, "").trim();
    return JSON.parse(text);
  } catch (e) {
    throw e;
  }
};
