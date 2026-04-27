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

export interface ChatMessageProps {
	message: Message;
}

export interface CodeBlockProps {
	children: string;
	className?: string;
	inline?: boolean;
}
