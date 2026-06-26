import { ExternalLink } from "lucide-react";

interface SignUpLinkProps {
	href: string;
	label: string;
}

export function SignUpLink({ href, label }: SignUpLinkProps) {
	return (
		<a
			href={href}
			target="_blank"
			rel="noopener noreferrer"
			className="text-blue-400 hover:text-blue-300 inline-flex items-center gap-1"
		>
			{label}
			<ExternalLink className="w-3 h-3" />
		</a>
	);
}
