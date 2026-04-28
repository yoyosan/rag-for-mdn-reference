import {
	Download,
	PanelLeftClose,
	PanelLeftOpen,
	RotateCcw,
} from "lucide-react";

type ChatHeaderProps = {
	hasMessages: boolean;
	clearChat: () => void;
	isContextPanelOpen: boolean;
	toggleContextPanel: () => void;
	enableExportDialog: () => void;
};

export function ChatHeader({
	hasMessages,
	clearChat,
	isContextPanelOpen,
	toggleContextPanel,
	enableExportDialog,
}: ChatHeaderProps) {
	return (
		<header className="border-b border-gray-800 p-4 flex items-center justify-between bg-[#1a1a2e]">
			<div className="flex items-center gap-3">
				<h1 className="text-xl font-semibold text-white">MDN Developer Chat</h1>
				<span className="text-sm text-gray-400">
					AI-powered documentation assistant
				</span>
			</div>

			<div className="flex items-center gap-2">
				<button
					onClick={toggleContextPanel}
					className="p-2 rounded-lg hover:bg-gray-700 transition-colors text-gray-300 hover:text-white"
					aria-label={
						isContextPanelOpen ? "Close context panel" : "Open context panel"
					}
				>
					{isContextPanelOpen ? (
						<PanelLeftClose className="w-5 h-5" />
					) : (
						<PanelLeftOpen className="w-5 h-5" />
					)}
				</button>

				<button
					onClick={enableExportDialog}
					className="p-2 rounded-lg hover:bg-gray-700 transition-colors text-gray-300 hover:text-white"
					aria-label="Export conversation"
					disabled={!hasMessages}
				>
					<Download className="w-5 h-5" />
				</button>

				<button
					onClick={clearChat}
					className="p-2 rounded-lg hover:bg-gray-700 transition-colors text-gray-300 hover:text-white"
					aria-label="Clear conversation"
					disabled={!hasMessages}
				>
					<RotateCcw className="w-5 h-5" />
				</button>
			</div>
		</header>
	);
}
