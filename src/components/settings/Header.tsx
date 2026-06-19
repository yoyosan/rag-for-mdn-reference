import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { HeaderTitle } from "@/components/HeaderTitle";

export function SettingsHeader() {
	return (
		<header className="border-b border-gray-800 p-4 flex items-center justify-between bg-[#1a1a2e]">
			<HeaderTitle />
			<Link href="/" className="flex items-center gap-1">
				<ArrowLeft className="w-5 h-5" />
				Back to Chat
			</Link>
		</header>
	);
}
