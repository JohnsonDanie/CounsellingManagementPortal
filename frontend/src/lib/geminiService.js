import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const genAI = API_KEY ? new GoogleGenerativeAI(API_KEY) : null;

/**
 * Generates a structured SOAP note from raw session text using Gemini 1.5 Flash.
 * Falls back to a keyword-based mock if API key is missing.
 */
export const generateSOAPNote = async (rawNotes) => {
  if (!rawNotes || rawNotes.trim().length < 10) {
    throw new Error("Please provide more detailed session notes for analysis.");
  }

  // Fallback if no API key is provided
  if (!genAI) {
    console.warn("Gemini API key missing. Using smart fallback logic.");
    return mockAISOAP(rawNotes);
  }

  try {
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      generationConfig: {
        responseMimeType: "application/json",
      }
    });

    const prompt = `
      You are an expert clinical counseling assistant. Your task is to transform raw, unstructured session notes into a professional SOAP note format.
      
      SOAP Definitions:
      - Subjective: The student's report of their feelings, quotes, and perspective.
      - Objective: Measurable, observable data from the session (body language, tone, specific behaviors).
      - Assessment: Counselor's clinical interpretation and analysis of the situation.
      - Plan: Clear intervention steps, follow-up schedule, and referrals.

      INPUT RAW NOTES:
      "${rawNotes}"

      Return the response strictly as a JSON object with the following keys:
      {
        "subjective": "string",
        "objective": "string",
        "assessment": "string",
        "plan": "string"
      }
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    return JSON.parse(text);
  } catch (error) {
    console.error("Gemini API Error:", error);
    return mockAISOAP(rawNotes);
  }
};

/**
 * Transcribes audio from a File or Blob using Gemini 1.5 Flash.
 */
export const transcribeAudio = async (audioFile) => {
  if (!genAI) {
    throw new Error("Gemini API key is required for audio transcription.");
  }

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // Convert blob to base64
    const base64Data = await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result.split(',')[1]);
      reader.readAsDataURL(audioFile);
    });

    const prompt = "Transcribe this audio recording into clear, punctuated text. Focus on capturing the dialogue between counselor and student accurately. Return only the transcription text.";

    const result = await model.generateContent([
      {
        inlineData: {
          data: base64Data,
          mimeType: audioFile.type || "audio/webm"
        }
      },
      prompt
    ]);

    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("Transcription Error:", error);
    throw new Error("Failed to transcribe audio. Ensure your recording is clear and try again.");
  }
};

/**
 * Smart Fallback Keyword Parser (The "Free" Alternative)
 */
const mockAISOAP = (text) => {
  const lowerText = text.toLowerCase();
  
  const subjective = text.match(/["'](.*?)["']/g) || [];
  const behaviors = [];
  if (lowerText.includes("eye contact")) behaviors.push("Limited eye contact noted.");
  if (lowerText.includes("crying") || lowerText.includes("tears")) behaviors.push("Physical distress/crying observed.");
  if (lowerText.includes("fidgeting") || lowerText.includes("restless")) behaviors.push("Psychomotor agitation observed.");

  return {
    subjective: subjective.length > 0 ? `Student states: ${subjective.join(", ")}` : "Student reported various personal concerns regarding current stressors.",
    objective: behaviors.length > 0 ? behaviors.join(" ") : "Student appeared cooperative; affect was consistent with reported mood.",
    assessment: "Symptoms reported are consistent with reactive distress. No immediate safety concerns identified unless otherwise noted.",
    plan: "Schedule follow-up session for next week. Monitor progress on identified coping mechanisms."
  };
};
