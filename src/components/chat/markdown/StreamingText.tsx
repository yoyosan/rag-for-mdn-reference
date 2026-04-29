import { useEffect, useState } from "react";

export function StreamingText({
	content,
	isStreaming,
}: {
	content: string;
	isStreaming: boolean;
}) {
	const [displayedContent, setDisplayedContent] = useState("");

	useEffect(() => {
		// No streaming -> no animation
		if (!isStreaming) {
			return;
		}

		let index = 0;
		const interval = setInterval(() => {
			index++;
			setDisplayedContent(content.slice(0, index));
			if (index >= content.length) {
				clearInterval(interval);
			}
		}, 20);

		// Clear the interval on unmount or when streaming stops
		return () => clearInterval(interval);
	}, [content, isStreaming]);

	if (!isStreaming) {
		return <div>{content}</div>;
	}

	return (
		<div className="relative">
			{displayedContent}
			{displayedContent.length < content.length && (
				<span className="animate-pulse text-purple-400">|</span>
			)}
		</div>
	);
}
