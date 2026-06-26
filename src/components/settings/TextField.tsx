interface TextFieldProps {
	id: string;
	name: string;
	label: string;
	value: string;
	onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
	helper?: React.ReactNode;
}

export function TextField({
	id,
	name,
	label,
	value,
	onChange,
	helper,
}: TextFieldProps) {
	return (
		<div className="mb-4">
			<label htmlFor={id} className="block font-medium text-gray-300 text-lg">
				{label}
			</label>
			<input
				type="text"
				id={id}
				name={name}
				required
				value={value}
				className="mt-1 p-2 block w-full rounded-md border-gray-700 bg-[#1a1a2e] text-white"
				onChange={onChange}
			/>
			{helper}
		</div>
	);
}
