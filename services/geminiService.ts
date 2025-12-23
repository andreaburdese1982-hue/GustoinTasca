import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(API_KEY);

export const askAiConcierge = async (query, cards) => {
  if (!API_KEY) return "Configurazione incompleta.";

  try {
    // CAMBIO MODELLO: Usiamo gemini-pro per la massima stabilità
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    const context = JSON.stringify(cards.map(c => ({ name: c.name, notes: c.notes })));
    const prompt = `Sei l'assistente di Gusto in Tasca. Rispondi a: ${query} basandoti su questi dati: ${context}`;

    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (error) {
    console.error("Errore IA:", error);
    return "L'assistente sta arrivando, riprova tra un istante.";
  }
};

// Funzioni di supporto per le immagini (mantengono lo stesso schema)
export const fileToGenerativePart = async (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

export const analyzeBusinessCard = async (base64Image) => {
  // Anche qui usiamo gemini-pro (o gemini-1.0-pro-vision se disponibile)
  const model = genAI.getGenerativeModel({ model: "gemini-pro" });
  const prompt = "Estrai dati JSON: name, address, phone.";
  try {
    const result = await model.generateContent([prompt, { inlineData: { mimeType: "image/jpeg", data: base64Image } }]);
    return JSON.parse(result.response.text().replace(/```json|```/g, ""));
  } catch (e) { throw e; }
};
