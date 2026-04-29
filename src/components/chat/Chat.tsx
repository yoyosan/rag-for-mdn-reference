"use client";

import { clsx } from "clsx";
import { Send } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { ContextPanel } from "@/components/ContextPanel";
import { demoMessage } from "@/components/chat/demoMessage";
import { ChatHeader } from "@/components/chat/Header";
import { ChatMessage } from "@/components/chat/Message";
import { Message } from "@/components/chat/Message.types";
import { ExportDialog } from "@/components/ExportDialog";

const initialPrompts = [
	"What is the difference between let and var in JavaScript?",
	"How do CSS Grid and Flexbox differ?",
	"What are Web Components and how do I use them?",
];

export function Chat() {
	const [messages, setMessages] = useState<Message[]>([]);
	const [input, setInput] = useState("");
	const [isContextPanelOpen, setIsContextPanelOpen] = useState(false);
	const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const messagesEndRef = useRef<HTMLDivElement>(null);
	const responseTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const streamingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
		null,
	);

	useEffect(() => {
		if (messages.length > 0) {
			messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
		}
	}, [messages.length]);

	const clearPendingTimeouts = useCallback(() => {
		if (responseTimeoutRef.current) {
			clearTimeout(responseTimeoutRef.current);
			responseTimeoutRef.current = null;
		}
		if (streamingTimeoutRef.current) {
			clearTimeout(streamingTimeoutRef.current);
			streamingTimeoutRef.current = null;
		}
	}, []);

	useEffect(() => () => clearPendingTimeouts(), [clearPendingTimeouts]);

	const submitMessage = async () => {
		const prompt = input.trim();

		if (!prompt || isLoading) {
			return;
		}

		const userMessage: Message = {
			id: Date.now().toString(),
			type: "user",
			content: prompt,
			timestamp: new Date(),
		};

		setMessages((prev) => [...prev, userMessage]);
		setInput("");
		setIsLoading(true);

		// Simulate AI response with streaming
		responseTimeoutRef.current = setTimeout(() => {
			const aiMessage: Message = demoMessage(prompt);

			setMessages((prev) => [...prev, aiMessage]);
			setIsLoading(false);

			// Simulate streaming completion
			streamingTimeoutRef.current = setTimeout(() => {
				setMessages((prev) =>
					prev.map((msg) =>
						msg.id === aiMessage.id ? { ...msg, isStreaming: false } : msg,
					),
				);
			}, 2000);
		}, 1000);
	};

	const handleSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
		e.preventDefault();
		await submitMessage();
	};

	const handleKeyDown = async (e: React.KeyboardEvent) => {
		if (e.key === "Enter" && !e.shiftKey) {
			e.preventDefault();
			await submitMessage();
		}
	};

	const clearChat = () => {
		// clear timeouts first before clearing messages
		clearPendingTimeouts();
		setMessages([]);
		setIsLoading(false);
	};

	const toggleContextPanel = () => {
		setIsContextPanelOpen((prev) => !prev);
	};

	const enableExportDialog = () => {
		setIsExportDialogOpen(true);
	};

	return (
		<div className="flex h-screen bg-[#0f0f23] text-white">
			{/* Main Chat Area */}
			<div
				className={clsx(
					"flex flex-col transition-all duration-300",
					isContextPanelOpen ? "flex-1" : "w-full",
				)}
			>
				{/* Header */}
				<ChatHeader
					hasMessages={messages.length > 0}
					clearChat={clearChat}
					isContextPanelOpen={isContextPanelOpen}
					toggleContextPanel={toggleContextPanel}
					enableExportDialog={enableExportDialog}
				/>

				{/* Messages Area */}
				<div className="flex-1 overflow-y-auto p-4 space-y-4">
					{messages.length === 0 ? (
						<div className="flex items-center justify-center h-full text-center">
							<div className="max-w-md">
								<h2 className="text-2xl font-semibold mb-4 text-gray-200">
									Welcome to MDN Developer Chat
								</h2>
								<p className="text-gray-400 mb-6">
									Ask me anything about web development, JavaScript, CSS, HTML,
									or any other topics covered in MDN documentation.
								</p>
								<div className="grid grid-cols-1 gap-2 text-sm">
									{initialPrompts.map((prompt) => (
										<button
											key={prompt}
											onClick={() => setInput(prompt)}
											className="p-3 text-left rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors text-gray-200"
										>
											{prompt}
										</button>
									))}
								</div>
							</div>
						</div>
					) : (
						messages.map((message) => (
							<ChatMessage key={message.id} message={message} />
						))
					)}

					{isLoading && (
						<div
							className="flex justify-start"
							role="status"
							aria-live="polite"
						>
							<div className="bg-gray-800 rounded-lg p-4 max-w-4xl">
								<div className="flex items-center gap-2 text-gray-400">
									<div className="flex gap-1">
										<div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
										<div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse [animation-delay:0.2s]"></div>
										<div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse [animation-delay:0.4s]"></div>
									</div>
									<span className="text-sm">AI is thinking...</span>
								</div>
							</div>
						</div>
					)}

					<div ref={messagesEndRef} />
				</div>

				{/* Input Area */}
				<div className="border-t border-gray-800 p-4 bg-[#1a1a2e]">
					<form onSubmit={handleSubmit} className="flex gap-3">
						<div className="flex-1 relative">
							<textarea
								aria-label="Ask me about web development, JavaScript, CSS, HTML..."
								value={input}
								onChange={(e) => setInput(e.target.value)}
								onKeyDown={handleKeyDown}
								placeholder="Ask me about web development, JavaScript, CSS, HTML..."
								className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 pr-12 text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 resize-none min-h-12.5 max-h-32"
								rows={1}
								disabled={isLoading}
							/>
							<button
								type="submit"
								disabled={!input.trim() || isLoading}
								className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-lg bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
								aria-label="Send message"
							>
								<Send className="w-4 h-4 text-white" />
							</button>
						</div>
					</form>

					<div className="mt-2 text-xs text-gray-500 text-center">
						Press Enter to send, Shift+Enter for new line
					</div>
				</div>
			</div>

			{isContextPanelOpen && (
				<ContextPanel
					sources={messages
						.filter((m) => m.type === "ai" && m.sources)
						.flatMap((m) => m.sources || [])}
				/>
			)}

			{isExportDialogOpen && (
				<ExportDialog
					messages={messages}
					onClose={() => setIsExportDialogOpen(false)}
				/>
			)}
		</div>
	);
}
