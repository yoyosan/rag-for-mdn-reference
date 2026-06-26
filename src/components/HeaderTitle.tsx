export function HeaderTitle() {
	return (
		<div className="flex items-center gap-3">
			<h1 className="text-sm sm:text-xl font-semibold text-white whitespace-nowrap">
				MDN Developer Chat
			</h1>
			<span className="hidden sm:inline text-sm text-gray-400">
				AI-powered documentation assistant
			</span>
		</div>
	);
}
