export interface ChatSource {
	id: string;
	title: string;
	snippet: string;
	url: string;
}

export interface Message {
	id: string;
	type: "user" | "ai";
	content: string;
	timestamp: Date;
	sources?: ChatSource[];
	isStreaming?: boolean;
}
