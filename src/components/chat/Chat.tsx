"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { clsx } from "clsx";
import { Send } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { ContextPanel } from "@/components/ContextPanel";
import { ChatHeader } from "@/components/chat/Header";
import { ChatMessage as ChatMessageComponent } from "@/components/chat/Message";
import { ChatMessageLoading } from "@/components/chat/MessageLoading";
import { ExportDialog } from "@/components/ExportDialog";
import { getErrorDisplay } from "@/lib/helpers/general";
import { AppUIMessage } from "@/types/api/aiMessage";
import { ChatMessage } from "@/types/web/message";

const initialPrompts = [
	"What is the difference between let and var in JavaScript?",
	"What is a closure in JavaScript?",
	"JS array declaration",
];

export function Chat() {
	const [input, setInput] = useState("");
	const [isContextPanelOpen, setIsContextPanelOpen] = useState(false);
	const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
	const messagesEndRef = useRef<HTMLDivElement>(null);
	const scrollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	const { messages, sendMessage, status, setMessages, error } =
		useChat<AppUIMessage>({
			transport: new DefaultChatTransport({
				api: "/api/chat",
			}),
		});
	const isReady = status === "ready";
	const isLoading = status === "submitted" || status === "streaming";
	const isError = status === "error";

	const chatMessages = useMemo<ChatMessage[]>(() => {
		return messages.map((msg) => {
			const isDone = msg?.parts?.some(
				(part) => part.type === "text" && part.state === "done",
			);

			return {
				id: msg.id,
				type: msg.role === "user" ? "user" : "ai",
				content:
					msg.parts
						?.filter((part) => part.type === "text")
						.map((part) => ("text" in part ? part.text : ""))
						.join("") || "",
				timestamp: msg.metadata?.createdAt
					? new Date(msg.metadata.createdAt)
					: null,
				sources: isDone
					? msg.parts?.find((part) => {
							return (
								part?.type === "tool-queryKnowledgeBase" &&
								part?.state === "output-available"
							);
						})?.output || []
					: [],
			};
		});
	}, [messages]);

	useEffect(() => {
		if (messages.length === 0) {
			return;
		}

		if (!scrollTimerRef.current) {
			scrollTimerRef.current = setTimeout(() => {
				messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
				scrollTimerRef.current = null;
			}, 20);
		}

		return () => {
			if (scrollTimerRef.current) {
				clearTimeout(scrollTimerRef.current);
				scrollTimerRef.current = null;
			}
		};
	}, [messages]);

	useEffect(() => {
		if (error) {
			console.error("Chat error:", error);
			setInput("");
		}
	}, [error]);

	const submitMessage = async () => {
		const prompt = input.trim();

		if (!prompt || !isReady) {
			return;
		}

		sendMessage({ text: prompt, metadata: { createdAt: Date.now() } });
		setInput("");
	};

	const handleSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
		e.preventDefault();
		await submitMessage();
	};

	const handleKeyDown = async (e: React.KeyboardEvent) => {
		if (
			e.key === "Enter" &&
			!e.shiftKey &&
			// fix accessibility/i18n bug for CJK users
			!e.nativeEvent.isComposing
		) {
			e.preventDefault();
			await submitMessage();
		}
	};

	const clearChat = () => {
		setMessages([]);
		setInput("");
	};

	const toggleContextPanel = () => {
		setIsContextPanelOpen((prev) => !prev);
	};

	const enableExportDialog = () => {
		setIsExportDialogOpen(true);
	};

	return (
		<div className="flex h-screen bg-gray-950 text-white">
			{/* Main Chat Area */}
			<div
				className={clsx(
					"flex flex-col transition-all duration-300",
					isContextPanelOpen ? "flex-1" : "w-full",
				)}
			>
				{/* Header */}
				<ChatHeader
					hasMessages={chatMessages.length > 0}
					clearChat={clearChat}
					isContextPanelOpen={isContextPanelOpen}
					toggleContextPanel={toggleContextPanel}
					enableExportDialog={enableExportDialog}
				/>

				{/* Messages Area */}
				<div className="flex-1 overflow-y-auto p-4 space-y-4">
					{chatMessages.length === 0 ? (
						<div className="flex items-center justify-center h-full text-center">
							<div className="max-w-md">
								<h2 className="text-2xl font-semibold mb-4 text-gray-200">
									Welcome to MDN Developer Chat
								</h2>
								<p className="text-gray-400 mb-6">
									Ask me anything about web development, JavaScript on MDN.
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
						chatMessages.map((message) => (
							<ChatMessageComponent key={message.id} message={message} />
						))
					)}
					<div
						className={clsx(
							"transition-opacity duration-200",
							isLoading ? "opacity-100" : "opacity-0 h-0 overflow-hidden",
						)}
					>
						<ChatMessageLoading />
					</div>

					{isError && error && (
						<div className="bg-red-900/30 border border-red-800 rounded-lg p-4 my-2">
							<h4 className="text-red-400 font-semibold text-sm">
								{getErrorDisplay(error)?.title}
							</h4>
							<p className="text-red-300 text-sm mt-1">
								{getErrorDisplay(error)?.description}
							</p>
						</div>
					)}
					<div ref={messagesEndRef} />
				</div>

				{/* Input Area */}
				<div className="border-t border-gray-800 p-4 bg-[#1a1a2e]">
					<form onSubmit={handleSubmit} className="flex gap-3">
						<div className="flex-1 relative">
							<textarea
								aria-label="Ask me anything about MDN JavaScript ..."
								value={input}
								onChange={(e) => setInput(e.target.value)}
								onKeyDown={handleKeyDown}
								placeholder="Ask me anything about MDN JavaScript ..."
								className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 pr-12 text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 resize-none min-h-12.5 max-h-32"
								rows={1}
								disabled={!isReady}
							/>
							<button
								type="submit"
								disabled={!input.trim() || !isReady}
								className="absolute right-2 top-6.25 -translate-y-1/2 p-2 rounded-lg bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
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
					sources={chatMessages
						.filter((m) => m.type === "ai" && m.sources)
						.flatMap((m) => m.sources || [])}
				/>
			)}

			{isExportDialogOpen && (
				<ExportDialog
					messages={chatMessages}
					onClose={() => setIsExportDialogOpen(false)}
				/>
			)}
		</div>
	);
}
