import { GoogleGenAI, Type, Schema } from "@google/genai";
import { AIAnalysisResult, Bookmark } from "../types";

const apiKey = process.env.API_KEY;
let aiClient: GoogleGenAI | null = null;

const getClient = () => {
  if (!apiKey) return null;
  if (!aiClient) {
    aiClient = new GoogleGenAI({ apiKey });
  }
  return aiClient;
};

export const analyzeBookmarkContent = async (
  url: string,
  userNotes: string
): Promise<AIAnalysisResult> => {
  const prompt = `
    Analyze the following website information to create a bookmark entry.
    URL: ${url}
    User Notes/Context: ${userNotes}

    Task:
    1. Generate a concise, professional title (max 60 chars).
    2. Write a brief executive summary (max 150 chars).
    3. Select ALL applicable categories from this list: [Design, Development, Marketing, Business, News, Tools, Inspiration, Research, Other]. Return at least 1, max 3.
    4. Generate 3-5 relevant, short tags (lowercase).

    Return JSON only.
  `;

  const responseSchema: Schema = {
    type: Type.OBJECT,
    properties: {
      title: { type: Type.STRING, description: "A concise title for the bookmark" },
      summary: { type: Type.STRING, description: "A short summary of what the link is about" },
      categories: { 
        type: Type.ARRAY, 
        items: { type: Type.STRING },
        description: "List of applicable categories (1-3 items)" 
      },
      tags: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
        description: "A list of relevant tags"
      }
    },
    required: ["title", "summary", "categories", "tags"]
  };

  try {
    const client = getClient();
    if (!client) throw new Error("Missing API key");

    const response = await client.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
      }
    });

    const jsonText = response.text;
    if (!jsonText) throw new Error("No response from AI");
    
    return JSON.parse(jsonText) as AIAnalysisResult;
  } catch (error) {
    console.error("Gemini Analysis Failed:", error);
    // Fallback if AI fails
    return {
      title: url,
      summary: "Could not generate summary.",
      categories: ["Other"],
      tags: ["uncategorized"]
    };
  }
};

export const askLibrary = async (query: string, bookmarks: Bookmark[]): Promise<string> => {
  // Optimize context: Take up to 60 bookmarks to fit in context window comfortably
  // In a real app, you would use embeddings/RAG here.
  const context = bookmarks.slice(0, 60).map(b => 
    `- Title: ${b.title}\n  Summary: ${b.summary}\n  Tags: ${b.tags.join(', ')}\n  URL: ${b.url}`
  ).join('\n\n');

  const prompt = `
    You are an intelligent knowledge assistant. The user is asking a question about their bookmark library.
    
    User Query: "${query}"

    Below is the content of the user's library (first 60 items):
    ${context}

    Instructions:
    1. Answer the user's question using ONLY the provided library content.
    2. If the answer is found, cite the specific bookmark titles.
    3. If the answer is not in the library, state that clearly.
    4. Keep the response concise, professional, and helpful (max 3-4 sentences).
    5. Do not use markdown formatting like bold or headers, just plain text with simple newlines.
  `;

  try {
    const client = getClient();
    if (!client) throw new Error("Missing API key");

    const response = await client.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
    });
    
    return response.text || "I couldn't find an answer in your library.";
  } catch (error) {
    console.error("Gemini Ask Library Failed:", error);
    return "Sorry, I encountered an error while analyzing your library.";
  }
};

export const generateBookmarkEmoji = async (
  payload: Pick<Bookmark, 'title' | 'summary' | 'tags' | 'url'>
): Promise<string> => {
  const prompt = `
    Choose a single emoji that best represents the bookmark.
    Title: ${payload.title}
    Summary: ${payload.summary}
    Tags: ${payload.tags.join(', ')}
    URL: ${payload.url}

    Requirements:
    - Return exactly one emoji.
    - No text, no punctuation, no extra characters.
  `;

  const responseSchema: Schema = {
    type: Type.OBJECT,
    properties: {
      emoji: { type: Type.STRING, description: "A single emoji character" },
    },
    required: ["emoji"]
  };

  try {
    const client = getClient();
    if (!client) throw new Error("Missing API key");

    const response = await client.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
      }
    });

    const jsonText = response.text;
    if (!jsonText) throw new Error("No response from AI");
    const parsed = JSON.parse(jsonText) as { emoji: string };
    const raw = parsed.emoji?.trim() || '';
    const first = Array.from(raw)[0] || '🔖';
    return first;
  } catch (error) {
    console.error("Gemini Emoji Failed:", error);
    return '🔖';
  }
};
