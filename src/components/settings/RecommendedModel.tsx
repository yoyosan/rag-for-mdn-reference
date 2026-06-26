interface RecommendedModelProps {
	model: string;
	onSelect: (model: string) => void;
}

export function RecommendedModel({ model, onSelect }: RecommendedModelProps) {
	return (
		<p className="mt-1 text-xs text-gray-500">
			Recommended:{" "}
			<button
				type="button"
				onClick={() => onSelect(model)}
				className="text-blue-400 hover:text-blue-300"
			>
				{model}
			</button>
		</p>
	);
}
