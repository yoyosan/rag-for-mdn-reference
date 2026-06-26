import {
	Download,
	PanelLeftClose,
	PanelLeftOpen,
	RotateCcw,
	Settings,
} from "lucide-react";
import Link from "next/link";
import { HeaderTitle } from "@/components/HeaderTitle";
import { GitHubIcon } from "@/components/icons/GitHub";

type ChatHeaderProps = {
	hasMessages: boolean;
	hasAPIKeysConf: boolean;
	clearChat: () => void;
	isContextPanelOpen: boolean;
	toggleContextPanel: () => void;
	enableExportDialog: () => void;
};

export function ChatHeader({
	hasMessages,
	hasAPIKeysConf,
	clearChat,
	isContextPanelOpen,
	toggleContextPanel,
	enableExportDialog,
}: ChatHeaderProps) {
	return (
		<header className="border-b border-gray-800 p-4 flex items-center justify-between bg-[#1a1a2e]">
			<HeaderTitle />

			<div className="flex items-center gap-2">
				<button
					type="button"
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
					type="button"
					onClick={enableExportDialog}
					className="p-2 rounded-lg hover:bg-gray-700 transition-colors text-gray-300 hover:text-white disabled:text-gray-700 disabled:cursor-not-allowed disabled:hover:bg-transparent"
					aria-label="Export conversation"
					disabled={!hasAPIKeysConf || !hasMessages}
				>
					<Download className="w-5 h-5" />
				</button>

				<button
					type="button"
					onClick={clearChat}
					className="p-2 rounded-lg hover:bg-gray-700 transition-colors text-gray-300 hover:text-white disabled:text-gray-700 disabled:cursor-not-allowed disabled:hover:bg-transparent"
					aria-label="Clear conversation"
					disabled={!hasAPIKeysConf || !hasMessages}
				>
					<RotateCcw className="w-5 h-5" />
				</button>

				<Link
					className="p-2 rounded-lg hover:bg-gray-700 transition-colors text-gray-300 hover:text-white"
					aria-label="Settings"
					href="/settings"
				>
					<Settings className="w-5 h-5" />
				</Link>

				<a
					href="https://github.com/yoyosan/rag-for-mdn-reference"
					target="_blank"
					rel="noopener noreferrer"
					className="p-2 rounded-lg hover:bg-gray-700 transition-colors text-gray-300 hover:text-white"
					aria-label="GitHub repository"
				>
					<GitHubIcon className="w-5 h-5" />
				</a>
			</div>
		</header>
	);
}
