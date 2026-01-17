
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const getPokemonAIAnalysis = async (pokemon: any) => {
  try {
    const statsStr = pokemon.stats.map((s: any) => `${s.stat.name}: ${s.base_stat}`).join(', ');
    const typesStr = pokemon.types.map((t: any) => t.type.name).join('/');
    
    const prompt = `Act as a world-class Pokémon Competitive Analyst. Analyze ${pokemon.name} (${typesStr}) with base stats: [${statsStr}]. 
    Assign a specific competitive role (e.g., Suicide Lead, Choice Scarf Revenge Killer, Bulky Pivot, Hazard Setter).
    Provide:
    1. A pro tactical strategy for Series 2/Smogon OU.
    2. 3 Key strengths in the current meta.
    3. Best synergistic partners.
    Format EXCLUSIVELY as JSON: { "role": "...", "strategy": "...", "strengths": ["...", "...", "..."], "partners": ["...", "..."], "funFact": "..." }`;

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
