import { createOpenAI } from "@ai-sdk/openai";

export const ollama = createOpenAI({
	baseURL: "http://localhost:11434/v1",
	apiKey: "",
});
