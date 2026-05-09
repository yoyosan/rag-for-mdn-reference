"use client";

import { clsx } from "clsx";
import { Bot, ExternalLink, User } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { type ChatMessage } from "@/components/chat/Message.types";
import { getMarkdownComponents } from "@/components/chat/markdown/MarkdownComponents";

interface ChatMessageProps {
	message: ChatMessage;
}

export function ChatMessage({ message }: ChatMessageProps) {
	const isUser = message.type === "user";

	return (
		<div
			className={clsx("flex gap-4", isUser ? "justify-end" : "justify-start")}
		>
			{!isUser && (
				<div className="shrink-0 w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center">
					<Bot className="w-4 h-4 text-white" />
				</div>
			)}

			<div
				className={clsx(
					"max-w-4xl rounded-lg p-4",
					isUser
						? "bg-blue-600 text-white ml-auto"
						: "bg-gray-800 text-gray-100",
				)}
			>
				{isUser ? (
					<div className="whitespace-pre-wrap">{message.content}</div>
				) : (
					<div className="prose prose-invert prose-purple max-w-none">
						<ReactMarkdown
							remarkPlugins={[remarkGfm]}
							components={getMarkdownComponents(message)}
						>
							{message.content}
						</ReactMarkdown>
					</div>
				)}

				{/* Sources */}
				{!isUser &&
					message.sources &&
					message.sources.length > 0 &&
					!message.isStreaming && (
						<div className="mt-4 pt-4 border-t border-gray-700">
							<h4 className="text-sm font-semibold text-gray-300 mb-2">
								Sources:
							</h4>
							<div className="grid gap-2">
								{message.sources.map((source, index) => (
									<a
										key={source.id}
										href={source.url}
										target="_blank"
										rel="noopener noreferrer"
										className="block p-2 bg-gray-900 rounded border border-gray-700 hover:border-purple-500 transition-colors group"
									>
										<div className="flex items-start justify-between gap-2">
											<div className="flex-1 min-w-0">
												<div className="flex items-center gap-2">
													<span className="text-xs bg-purple-600 text-white px-1.5 py-0.5 rounded font-mono">
														{index + 1}
													</span>
													<h5 className="font-medium text-sm text-white truncate group-hover:text-purple-300">
														{source.title}
													</h5>
												</div>
												<p className="text-xs text-gray-400 mt-1 line-clamp-2">
													{source.snippet}
												</p>
											</div>
											<ExternalLink className="w-3 h-3 text-gray-500 group-hover:text-purple-400 shrink-0 mt-0.5" />
										</div>
									</a>
								))}
							</div>
						</div>
					)}

				{/* Timestamp */}
				<div className="mt-3 text-xs text-gray-500">
					{message.timestamp.toLocaleTimeString()}
				</div>
			</div>

			{isUser && (
				<div className="shrink-0 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
					<User className="w-4 h-4 text-white" />
				</div>
			)}
		</div>
	);
}
