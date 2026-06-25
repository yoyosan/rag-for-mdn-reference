import { Check, Copy } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import SyntaxHighlighter from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";

interface CodeBlockProps {
	children: string;
	className?: string;
	inline?: boolean;
}

export function CodeBlock({ children, className, inline }: CodeBlockProps) {
	const [copied, setCopied] = useState(false);
	const language = className?.replace("language-", "") || "text";
	const copyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	useEffect(() => {
		return () => {
			if (copyTimeoutRef.current) {
				clearTimeout(copyTimeoutRef.current);
			}
		};
	}, []);

	const copyToClipboard = async () => {
		await navigator.clipboard.writeText(children);
		setCopied(true);
		copyTimeoutRef.current = setTimeout(() => setCopied(false), 2000);
	};

	if (inline) {
		return (
			<code className="bg-gray-800 text-purple-300 px-1.5 py-0.5 rounded text-sm font-mono">
				{children}
			</code>
		);
	}

	return (
		<div className="relative group my-4">
			<div className="flex items-center justify-between bg-gray-900 px-4 py-2 rounded-t-lg border-b border-gray-700">
				<span className="text-sm text-gray-400 font-mono">{language}</span>
				<button
					type="button"
					onClick={copyToClipboard}
					className="flex items-center gap-2 px-2 py-1 text-xs text-gray-400 hover:text-white bg-gray-800 hover:bg-gray-700 rounded transition-colors"
					aria-label="Copy code"
				>
					{copied ? (
						<>
							<Check className="w-3 h-3" />
							Copied
						</>
					) : (
						<>
							<Copy className="w-3 h-3" />
							Copy
						</>
					)}
				</button>
			</div>
			<SyntaxHighlighter
				language={language}
				style={vscDarkPlus}
				customStyle={{
					margin: 0,
					borderTopLeftRadius: 0,
					borderTopRightRadius: 0,
					background: "#1e1e2e",
				}}
				wrapLongLines={true}
			>
				{children}
			</SyntaxHighlighter>
		</div>
	);
}
