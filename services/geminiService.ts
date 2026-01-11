import { GoogleGenAI, Type } from "@google/genai";

// Initialize the API client
// Note: In a real environment, verify process.env.API_KEY is available.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export interface SafetyAnalysisResult {
  isSafe: boolean;
  reason: string;
  riskLevel: 'Low' | 'Medium' | 'High';
  recommendedAction: string;
}

export const analyzeFolderSafety = async (folderName: string, path: string): Promise<SafetyAnalysisResult> => {
  try {
    const prompt = `
      I am developing a Windows utility to move AppData folders to a different drive and create a Symbolic Link (Junction) back to the original location.
      
      Analyze if it is safe to move the following folder:
      Name: ${folderName}
      Path: ${path}
      
      Consider:
      1. Does this application rely on hardcoded paths?
      2. Does it run as a system service that might load before drives are mounted?
      3. Are there known issues with junction points for this specific software?

      Return the result as a JSON object.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            isSafe: { type: Type.BOOLEAN },
            reason: { type: Type.STRING },
            riskLevel: { type: Type.STRING, enum: ['Low', 'Medium', 'High'] },
            recommendedAction: { type: Type.STRING }
          },
          required: ['isSafe', 'reason', 'riskLevel', 'recommendedAction']
        }
      }
    });

    const text = response.text;
    if (!text) {
      throw new Error("No response from AI");
    }

    return JSON.parse(text) as SafetyAnalysisResult;

  } catch (error) {
    console.error("Gemini Analysis Failed:", error);
    // Fallback if API fails or key is missing
    return {
      isSafe: true,
      reason: "Could not contact AI for verification. Proceed with caution. Generally, roaming profiles are safe to move.",
      riskLevel: "Medium",
      recommendedAction: "Ensure the application is closed before moving."
    };
  }
};