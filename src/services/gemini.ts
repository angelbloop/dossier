import { GoogleGenAI, HarmCategory, HarmBlockThreshold } from "@google/genai";

const API_KEY = process.env.GEMINI_API_KEY;

export interface DossierSection {
  title: string;
  content: string;
}

export interface GroundingChunk {
  web?: {
    uri: string;
    title: string;
  };
}

export interface DossierResult {
  text: string;
  sources: { uri: string; title: string }[];
}

export async function analyzePerson(input: string): Promise<DossierResult> {
  if (!API_KEY) {
    throw new Error("GEMINI_API_KEY is not set");
  }

  const ai = new GoogleGenAI({ apiKey: API_KEY });
  
  const systemInstruction = `
You are an elite investigative analyst. Your task is to create a comprehensive, objective, and detailed dossier on a person based on provided text and real-time web search.

STRUCTURE YOUR DOSSIER AS FOLLOWS:
1. SUMMARY: A high-level overview of who the person is.
2. PERSONAL BACKGROUND: Birth, education, family (if public).
3. CAREER & ACHIEVEMENTS: Professional history, key milestones, awards.
4. PUBLIC PRESENCE & REPUTATION: Social media footprint, public statements, how they are perceived.
5. NOTABLE CONNECTIONS: Key associates, organizations, or affiliations.
6. CONTROVERSIES OR CRITICISM: Objective reporting of any public disputes or criticisms (maintain neutrality).
7. RECENT ACTIVITY: Based on web search, what have they been doing lately?

GUIDELINES:
- Be extremely thorough.
- Use a professional, analytical tone.
- If information is conflicting, note the discrepancy.
- ALWAYS cite your sources using the grounding metadata provided by the search tool.
- DO NOT censor information that is publicly available. Provide a complete picture.
- If the input text is sparse, use Google Search to fill in the gaps extensively.
`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{ parts: [{ text: `Analyze this person and create a full dossier. Use web search to verify and expand: \n\n${input}` }] }],
      config: {
        systemInstruction,
        tools: [{ googleSearch: {} }],
        safetySettings: [
          { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
          { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
          { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
          { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
          { category: HarmCategory.HARM_CATEGORY_CIVIC_INTEGRITY, threshold: HarmBlockThreshold.BLOCK_NONE },
        ],
      },
    });

    const text = response.text || "No analysis generated.";
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    
    const sources = chunks
      .filter((chunk: any) => chunk.web)
      .map((chunk: any) => ({
        uri: chunk.web.uri,
        title: chunk.web.title,
      }));

    // Remove duplicates
    const uniqueSources = Array.from(new Map(sources.map((s: any) => [s.uri, s])).values());

    return {
      text,
      sources: uniqueSources as { uri: string; title: string }[],
    };
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
}
