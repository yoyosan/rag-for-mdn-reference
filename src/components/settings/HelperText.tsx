interface HelperTextProps {
	children: React.ReactNode;
}

export function HelperText({ children }: HelperTextProps) {
	return <p className="mt-1 text-xs text-gray-500">{children}</p>;
}
