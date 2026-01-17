
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const getPokemonAIAnalysis = async (pokemon: any) => {
  try {
    const prompt = `Act as a world-class Pokémon Professor. Analyze this Pokémon: ${pokemon.name}. 
    Provide a concise strategy for competitive play including its strengths, potential roles, and one fun fact.
    Format as JSON: { "strategy": "...", "strengths": ["...", "..."], "funFact": "..." }`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      }
    });

    return JSON.parse(response.text || '{}');
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    return null;
  }
};
