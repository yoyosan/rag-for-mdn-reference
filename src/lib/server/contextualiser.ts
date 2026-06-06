import { generateText } from "ai";
import { getAIModel } from "@/config/ai";

export async function generateContextForChunk(
	wholeDocument: string,
	chunkContent: string,
): Promise<string> {
	const prompt = `<document>
${wholeDocument}
</document>
<chunk>
${chunkContent}
</chunk>
Please give a short and succinct context to situate this chunk within the overall document
for the purposes of improving search retrieval of the chunk. Answer only with the succinct
context and nothing else.`;

	const { text } = await generateText({
		model: getAIModel(),
		prompt,
		temperature: 0.1,
	});

	return text.trim();
}
