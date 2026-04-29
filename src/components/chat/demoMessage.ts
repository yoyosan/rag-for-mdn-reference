import { Message } from "@/components/chat/Message.types";

export function demoMessage(prompt: string): Message {
	return {
		id: (Date.now() + 1).toString(),
		type: "ai",
		content: `# Understanding ${prompt}

Here's what you need to know about **${prompt}**:

## Overview
This is a comprehensive explanation that demonstrates \`inline code\` and other formatting features.

\`\`\`javascript
// Example code block
function example() {
 console.log("Hello from MDN documentation!");
 return true;
}
\`\`\`

## Key Points
1. First important point with [citation](1)
2. Second point that references [MDN docs](2)
3. Third point about best practices

The information above is sourced from official MDN documentation [3].`,
		timestamp: new Date(),
		isStreaming: true,
		sources: [
			{
				id: "1",
				title: "JavaScript Fundamentals - MDN",
				snippet:
					"JavaScript is a programming language that allows you to implement complex features on web pages.",
				url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript",
			},
			{
				id: "2",
				title: "Web APIs - MDN",
				snippet:
					"Web APIs provide functionality for developing Web applications.",
				url: "https://developer.mozilla.org/en-US/docs/Web/API",
			},
			{
				id: "3",
				title: "Best Practices - MDN",
				snippet: "Learn about best practices for web development.",
				url: "https://developer.mozilla.org/en-US/docs/Learn",
			},
		],
	};
}
