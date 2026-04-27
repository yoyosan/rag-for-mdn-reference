"use client";

import { ExternalLink } from "lucide-react";
import type { ComponentPropsWithoutRef } from "react";
import React from "react";
import type { Components, ExtraProps } from "react-markdown";
import type { Message } from "@/components/chat/ChatMessage.types";
import { CodeBlock } from "@/components/chat/markdown/CodeBlock";
import { processCitations } from "@/components/chat/markdown/processCitations";
import { StreamingText } from "@/components/chat/markdown/StreamingText";

type CodeProps = ComponentPropsWithoutRef<"code"> & ExtraProps;

/**
 * Returns a components object for ReactMarkdown that is tailored to the current message.
 * This allows dynamic behavior based on whether the message is still streaming.
 */
export function getMarkdownComponents(message: Message): Components {
	return {
		// Code blocks (inline or multi‑line)
		// code({ inline, className, children, ...props }: CodeProps) {
		// 	const content = String(children).replace(/\n$/, "");
		// 	if (message.isStreaming) {
		// 		return inline ? (
		// 			<StreamingText content={content} isStreaming={true} />
		// 		) : (
		// 			<div className="my-4">
		// 				<StreamingText content={content} isStreaming={true} />
		// 			</div>
		// 		);
		// 	}
		// 	return (
		// 		<CodeBlock inline={inline} className={className} {...props}>
		// 			{content}
		// 		</CodeBlock>
		// 	);
		// },
		code({ className, children, ...props }: CodeProps) {
			const content = String(children).replace(/\n$/, "");
			const isBlock = /language-/.test(className || "");

			if (message.isStreaming) {
				return isBlock ? (
					<div className="my-4">
						<StreamingText content={content} isStreaming />
					</div>
				) : (
					<StreamingText content={content} isStreaming />
				);
			}

			return isBlock ? (
				<CodeBlock className={className} {...props}>
					{content}
				</CodeBlock>
			) : (
				<code className={className} {...props}>
					{children}
				</code>
			);
		},

		// Paragraphs – process citations when not streaming, otherwise show streaming text
		p({ children }: { children?: React.ReactNode }) {
			if (message.isStreaming) {
				const rawContent =
					typeof children === "string"
						? children
						: React.Children.toArray(children).join("");
				return <StreamingText content={rawContent} isStreaming={true} />;
			}

			const processedChildren = React.Children.map(children, (child) => {
				if (typeof child === "string") {
					return processCitations(child, message.sources);
				}
				return child;
			});

			return <p className="mb-4 last:mb-0">{processedChildren}</p>;
		},

		// Headings
		h1: ({ children }: { children?: React.ReactNode }) => (
			<h1 className="text-2xl font-bold mb-4 text-white border-b border-gray-700 pb-2">
				{children}
			</h1>
		),
		h2: ({ children }: { children?: React.ReactNode }) => (
			<h2 className="text-xl font-semibold mb-3 text-white">{children}</h2>
		),
		h3: ({ children }: { children?: React.ReactNode }) => (
			<h3 className="text-lg font-semibold mb-2 text-white">{children}</h3>
		),

		// Lists
		ul: ({ children }: { children?: React.ReactNode }) => (
			<ul className="list-disc list-inside mb-4 space-y-1">{children}</ul>
		),
		ol: ({ children }: { children?: React.ReactNode }) => (
			<ol className="list-decimal list-inside mb-4 space-y-1">{children}</ol>
		),
		li: ({ children }: { children?: React.ReactNode }) => (
			<li className="text-gray-200">{children}</li>
		),

		// Links (external)
		a: ({ href, children }: { href?: string; children?: React.ReactNode }) => (
			<a
				href={href}
				target="_blank"
				rel="noopener noreferrer"
				className="text-blue-400 hover:text-blue-300 underline inline-flex items-center gap-1"
			>
				{children}
				<ExternalLink className="w-3 h-3" />
			</a>
		),

		// Blockquotes
		blockquote: ({ children }: { children?: React.ReactNode }) => (
			<blockquote className="border-l-4 border-purple-500 pl-4 italic text-gray-300 my-4">
				{children}
			</blockquote>
		),

		// Tables
		table: ({ children }: { children?: React.ReactNode }) => (
			<div className="overflow-x-auto my-4">
				<table className="min-w-full border border-gray-700 rounded-lg">
					{children}
				</table>
			</div>
		),
		thead: ({ children }: { children?: React.ReactNode }) => (
			<thead className="bg-gray-900">{children}</thead>
		),
		th: ({ children }: { children?: React.ReactNode }) => (
			<th className="border border-gray-700 px-4 py-2 text-left text-white font-semibold">
				{children}
			</th>
		),
		td: ({ children }: { children?: React.ReactNode }) => (
			<td className="border border-gray-700 px-4 py-2 text-gray-200">
				{children}
			</td>
		),
	};
}
