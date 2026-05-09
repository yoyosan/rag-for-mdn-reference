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

		const interval = setInterval(() => {
			setDisplayedContent((prev) => {
				const isAppend = content.startsWith(prev);
				const nextIndex = isAppend ? prev.length + 1 : 1;
				const next = content.slice(0, nextIndex);

				if (nextIndex >= content.length) {
					clearInterval(interval);
				}

				return next;
			});
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
