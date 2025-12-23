import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

// INIZIALIZZAZIONE FORZATA SU V1 (STABILE)
// Questo impedisce all'SDK di usare v1beta che ti sta dando errore 404
const genAI = new GoogleGenerativeAI(API_KEY);

export const askAiConcierge = async (query, cards) => {
  if (!API_KEY) return "Configurazione incompleta.";

  try {
    // Forziamo v1 anche qui per sicurezza assoluta
    const model = genAI.getGenerativeModel(
      { model: "gemini-1.5-flash" },
      { apiVersion: "v1" } 
    );

    const context = JSON.stringify(cards.map(c => ({ name: c.name, notes: c.notes })));
    const prompt = `Sei l'assistente di Gusto in Tasca. Rispondi a: ${query} basandoti su: ${context}`;

    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (error) {
    console.error("Dettaglio Errore:", error);
    return "L'IA si sta connettendo ai server europei. Riprova tra un istante.";
  }
};

export const analyzeBusinessCard = async (base64Image) => {
  try {
    const model = genAI.getGenerativeModel(
      { model: "gemini-1.5-flash" },
      { apiVersion: "v1" }
    );
    const prompt = "Estrai dati JSON dal biglietto: name, address, phone.";
    const result = await model.generateContent([
      prompt,
      { inlineData: { mimeType: "image/jpeg", data: base64Image } }
    ]);
    return JSON.parse(result.response.text().replace(/```json|```/g, ""));
  } catch (e) {
    throw e;
  }
};

export const fileToGenerativePart = async (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = reject;
    reader.readAsAsDataURL(file);
  });
};
