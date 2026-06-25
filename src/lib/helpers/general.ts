import slug from "slug";

function headingToSlug(headingText: string): string {
	if (!headingText) {
		return "";
	}

	return slug(headingText, {
		replacement: "_",
		remove: /[.]/g,
		lower: true,
	});
}

export function generateMDNUrl(
	slug: string | null,
	headingContext: string | null = null,
): string {
	const baseUrl = slug
		? `https://developer.mozilla.org/en-US/docs/${slug}`
		: "https://developer.mozilla.org/en-US/docs/";

	if (headingContext) {
		return `${baseUrl}#${headingToSlug(headingContext)}`;
	}

	return baseUrl;
}

export const getErrorDisplay = (error: Error | undefined) => {
	if (!error) return null;

	const message = error.message;

	if (
		message.includes("Too many requests") ||
		message.includes("Rate limit reached")
	) {
		const timeMatch = message.match(/try again in ([\dms.]+)/i);
		return {
			title: "Rate limit reached",
			description: `Too many requests.${timeMatch ? ` Try again in ${timeMatch[1]}.` : " Please wait a moment."}`,
			action: "wait",
		};
	}

	if (
		message.includes("Invalid AI_PROVIDER") ||
		message.includes("Invalid request body")
	) {
		return {
			title: "Configuration error",
			description:
				"Your settings are invalid. Please check your configuration.",
			action: "config",
		};
	}

	if (message.includes("Missing required API keys")) {
		return {
			title: "Configuration error",
			description: "The API keys are not configured properly.",
			action: "config",
		};
	}

	return {
		title: "Something went wrong",
		description: "The AI service encountered an error. Please try again.",
		action: "retry",
	};
};
