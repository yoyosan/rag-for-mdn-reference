export interface ChatSource {
	id: string;
	title: string;
	snippet: string;
	url: string;
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
