import { generateText } from "ai";
import type { ApiProvider, ProviderResponse } from "promptfoo";
import { getAIModel } from "@/config/ai";

export default class OllamaGradingProvider implements ApiProvider {
	id(): string {
		return "ai-model-grader";
	}

	async callApi(prompt: string): Promise<ProviderResponse> {
		const { text } = await generateText({
			model: getAIModel(),
			prompt,
		});
		return { output: text };
	}
}
