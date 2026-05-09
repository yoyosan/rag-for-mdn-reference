import React from "react";
import { CitationTooltip } from "@/components/CitationTooltip";
import { ChatSource } from "@/components/chat/Message.types";

export function processCitations(
	content: string,
	sources?: ChatSource[],
): React.ReactNode[] {
	if (!sources || sources.length === 0) {
		return [content];
	}

	const parts: React.ReactNode[] = [];
	let lastIndex = 0;

	// Find citation patterns like [1], [2], etc.
	const citationRegex = /\[(\d+)\]/g;
	let match;

	while ((match = citationRegex.exec(content)) !== null) {
		const fullMatch = match[0];
		const citationNumber = parseInt(match[1]);
		const source = sources.find((s) => s.id === citationNumber.toString());

		// Add text before citation
		if (match.index > lastIndex) {
			parts.push(content.slice(lastIndex, match.index));
		}

		// Add citation component
		if (source) {
			parts.push(
				<CitationTooltip
					key={`citation-${citationNumber}-${match.index}`}
					source={source}
					citationNumber={citationNumber}
				/>,
			);
		} else {
			parts.push(fullMatch);
		}

		lastIndex = match.index + fullMatch.length;
	}

	// Add remaining text
	if (lastIndex < content.length) {
		parts.push(content.slice(lastIndex));
	}

	return parts;
}
