import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

interface FrontmatterData {
	title: string;
	slug: string;
	pageType: string;
	sidebar: string;
}

interface HeadingInfo {
	line: number;
	level: 2 | 3;
	text: string;
}

interface FilePayload {
	absolutePath: string;
	relativePath: string;
	content: string;
	body: string;
	bodyOffset: number;
	frontmatter: FrontmatterData;
}

interface ChunkLineRange {
	from: number;
	to: number;
}

export interface DocumentMetadata {
	source: string;
	title: string;
	slug: string;
	pageType: "guide";
	loc: {
		lines: {
			from: number;
			to: number;
		};
	};
}

function parseFrontmatter(
	content: string,
): { frontmatter: FrontmatterData; body: string; bodyOffset: number } | null {
	const text = normalizeText(content);
	const lines = text.split("\n");

	if (lines[0]?.trim() !== "---") {
		return null;
	}

	const closingIndex = lines.findIndex(
		(line, index) => index > 0 && line.trim() === "---",
	);
	if (closingIndex === -1) {
		return null;
	}

	const frontmatterLines = lines.slice(1, closingIndex);
	const bodyLines = lines.slice(closingIndex + 1);

	const parsed: Partial<FrontmatterData> = {};
	for (const line of frontmatterLines) {
		const trimmed = line.trim();
		if (!trimmed) {
			continue;
		}

		const colonIndex = trimmed.indexOf(":");
		if (colonIndex === -1) {
			continue;
		}

		const key = trimmed.slice(0, colonIndex).trim();
		const value = unquote(trimmed.slice(colonIndex + 1));

		if (key === "title") {
			parsed.title = value;
		} else if (key === "slug") {
			parsed.slug = value;
		} else if (key === "page-type") {
			parsed.pageType = value;
		} else if (key === "sidebar") {
			parsed.sidebar = value;
		}
	}

	if (!parsed.title || !parsed.slug || !parsed.pageType || !parsed.sidebar) {
		return null;
	}

	return {
		frontmatter: {
			title: parsed.title,
			slug: parsed.slug,
			pageType: parsed.pageType,
			sidebar: parsed.sidebar,
		},
		body: bodyLines.join("\n"),
		bodyOffset: closingIndex + 1,
	};
}

export function normalizeText(text: string): string {
	return text.replace(/\r\n/g, "\n");
}

function unquote(value: string): string {
	const trimmed = value.trim();
	if (
		(trimmed.startsWith('"') && trimmed.endsWith('"')) ||
		(trimmed.startsWith("'") && trimmed.endsWith("'"))
	) {
		return trimmed.slice(1, -1);
	}

	return trimmed;
}

export async function collectMarkdownFiles(dir: string): Promise<string[]> {
	const entries = await readdir(dir, { withFileTypes: true });
	const files: string[] = [];

	for (const entry of entries) {
		const fullPath = path.resolve(dir, entry.name);
		if (entry.isDirectory()) {
			files.push(...(await collectMarkdownFiles(fullPath)));
			continue;
		}

		if (entry.isFile() && entry.name.endsWith(".md")) {
			files.push(fullPath);
		}
	}

	return files.sort((left, right) => left.localeCompare(right));
}

export function findHeadings(content: string): HeadingInfo[] {
	const lines = normalizeText(content).split("\n");
	const headings: HeadingInfo[] = [];

	for (let index = 0; index < lines.length; index += 1) {
		const line = lines[index].trim();
		const match = /^(#{2,3})\s+(.*?)(?:\s+#+)?$/.exec(line);
		if (!match) {
			continue;
		}

		const level = match[1].length as 2 | 3;
		headings.push({
			line: index + 1,
			level,
			text: match[2].trim(),
		});
	}

	return headings;
}

export function findNearestHeading(
	headings: HeadingInfo[],
	startLine: number,
): HeadingInfo | null {
	let current: HeadingInfo | null = null;

	for (const heading of headings) {
		if (heading.line > startLine) {
			break;
		}

		current = heading;
	}

	return current;
}

export function getLineRange(
	metadata: DocumentMetadata,
): ChunkLineRange | null {
	return metadata.loc.lines;
}

export async function loadFilePayload(
	absolutePath: string,
	projectRoot: string,
): Promise<FilePayload | null> {
	const content = normalizeText(await readFile(absolutePath, "utf8"));
	if (content.trim().length === 0) {
		return null;
	}

	const parsed = parseFrontmatter(content);
	if (!parsed) {
		return null;
	}

	return {
		absolutePath,
		relativePath: path.relative(projectRoot, absolutePath),
		content,
		body: parsed.body,
		bodyOffset: parsed.bodyOffset,
		frontmatter: parsed.frontmatter,
	};
}
