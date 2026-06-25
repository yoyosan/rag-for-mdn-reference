export interface ChatSource {
	id: string;
	citationNumber: number;
	title: string;
	snippet: string;
	url: string;
	similarity: number;
	sourceFilePath: string;
	chunkId: string;
	content: string;
}

export interface ChatMessage {
	id: string;
	type: "user" | "ai";
	content: string;
	timestamp: Date | null;
	sources?: ChatSource[];
	isStreaming?: boolean;
	sourceError?: string;
}
