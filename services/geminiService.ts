import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

// FORZIAMO L'USO DI V1 PER EVITARE L'ERRORE 404 V1BETA
const genAI = new GoogleGenerativeAI(API_KEY);

export const askAiConcierge = async (query, cards) => {
  if (!API_KEY) return "Configurazione incompleta.";

  try {
    // Forza la versione v1 esplicitamente
    const model = genAI.getGenerativeModel(
      { model: "gemini-1.5-flash" },
      { apiVersion: "v1" } // <-- QUESTA È LA CHIAVE PER RISOLVERE IL 404
    );

    const context = JSON.stringify(cards.map(c => ({ name: c.name, notes: c.notes })));
    const prompt = `Sei l'assistente di Gusto in Tasca. Rispondi a: ${query} basandoti su: ${context}`;

    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (error) {
    console.error("Errore critico:", error);
    return "L'IA è quasi pronta. Riprova tra 10 secondi.";
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
  try {
    const model = genAI.getGenerativeModel(
      { model: "gemini-1.5-flash" },
      { apiVersion: "v1" }
    );
    const prompt = "Estrai JSON: name, address, phone.";
    const result = await model.generateContent([
      prompt, 
      { inlineData: { mimeType: "image/jpeg", data: base64Image } }
    ]);
    return JSON.parse(result.response.text().replace(/```json|```/g, ""));
  } catch (e) {
    throw e;
  }
};
