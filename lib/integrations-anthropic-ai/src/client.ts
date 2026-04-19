import { GoogleGenerativeAI } from "@google/generative-ai";

if (!process.env.GEMINI_API_KEY) {
  throw new Error(
    "GEMINI_API_KEY must be set. Did you forget to provision the Gemini API?",
  );
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export const anthropic = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
