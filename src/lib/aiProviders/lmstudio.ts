import { createOpenAI } from "@ai-sdk/openai";

// createOpenAI() defaults to the Responses API (/v1/responses)
// which LM Studio  does not support.
export const lmstudio = createOpenAI({
	baseURL: "http://localhost:1234/v1",
	apiKey: "",
});

// We use .chat to force the Chat Completions API (/v1/chat/completions).
export const lmstudioChat = lmstudio.chat;
