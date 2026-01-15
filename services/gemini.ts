import { GoogleGenAI, Type } from "@google/genai";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

export const fetchSubTopics = async (subject: string): Promise<string[]> => {
  if (!apiKey) {
    console.warn("No API Key found");
    // Fallback for demo purposes if key is missing in dev, though instructions say assume it's there.
    // We will simulate a delay and return mock data if purely strictly no key, but 
    // strictly adhering to instructions, we try to use the key.
    // If the key is invalid, the API call will fail and we handle it in the UI.
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `You are an expert taxonomist and knowledge graph generator. 
      Analyze the subject "${subject}". 
      Provide 4 to 6 distinct, interesting, and diverse sub-fields, related concepts, or branches of this subject.
      Keep the names short (1-3 words max). 
      Return ONLY a raw JSON array of strings. 
      Example: ["Subtopic 1", "Subtopic 2", "Subtopic 3"]`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.STRING
          }
        },
        temperature: 0.7,
      }
    });

    const text = response.text;
    if (!text) return [];
    
    const parsed = JSON.parse(text);
    if (Array.isArray(parsed)) {
      return parsed;
    }
    return [];

  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};