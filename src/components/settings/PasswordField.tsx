import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";

interface PasswordFieldProps {
	id: string;
	name: string;
	label: string;
	value: string;
	onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
	helper?: React.ReactNode;
}

export function PasswordField({
	id,
	name,
	label,
	value,
	onChange,
	helper,
}: PasswordFieldProps) {
	const [showPassword, setShowPassword] = useState(false);

	return (
		<div className="mb-4">
			<label htmlFor={id} className="block font-medium text-gray-300 text-lg">
				{label}
			</label>
			<div className="relative">
				<input
					type={showPassword ? "text" : "password"}
					id={id}
					name={name}
					required
					value={value}
					className="mt-1 p-2 pr-10 block w-full rounded-md border-gray-700 bg-[#1a1a2e] text-white"
					onChange={onChange}
				/>
				<button
					type="button"
					onClick={() => setShowPassword(!showPassword)}
					className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
					aria-label={showPassword ? "Hide password" : "Show password"}
				>
					{showPassword ? (
						<EyeOff className="w-5 h-5" />
					) : (
						<Eye className="w-5 h-5" />
					)}
				</button>
			</div>
			{helper}
		</div>
	);
}
