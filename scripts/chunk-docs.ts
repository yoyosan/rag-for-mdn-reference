import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import { MarkdownTextSplitter } from "@langchain/textsplitters";

declare global {
	interface ImportMeta {
		dir: string;
	}
}

interface FrontmatterData {
	title: string;
	slug: string;
	pageType: string;
	sidebar: string;
}

interface ChunkOutput {
	id: string;
	text: string;
	source: string;
	title: string;
	slug: string;
	pageType: string;
	heading: string | null;
	headingLevel: number | null;
	startLine: number;
	endLine: number;
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

interface DocumentMetadata {
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

const projectRoot = path.resolve(import.meta.dir, "..");
const docsRoot = path.resolve(projectRoot, "mdn-js-docs");
const outputPath = path.resolve(projectRoot, "chunks.json");

const splitter = new MarkdownTextSplitter({
	chunkSize: 1000,
	chunkOverlap: 100,
});

function normalizeText(text: string): string {
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

async function collectMarkdownFiles(dir: string): Promise<string[]> {
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

function findHeadings(content: string): HeadingInfo[] {
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

function findNearestHeading(
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

function getLineRange(metadata: DocumentMetadata): ChunkLineRange | null {
	if (typeof metadata !== "object" || metadata === null) {
		return null;
	}

	const loc = metadata.loc;
	if (typeof loc !== "object" || loc === null) {
		return null;
	}

	const lines = loc.lines;
	if (typeof lines !== "object" || lines === null) {
		return null;
	}

	const from = lines.from;
	const to = lines.to;
	if (typeof from !== "number" || typeof to !== "number") {
		return null;
	}

	return { from, to };
}

async function loadFilePayload(
	absolutePath: string,
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

async function main(): Promise<void> {
	await mkdir(projectRoot, { recursive: true });

	const markdownFiles = await collectMarkdownFiles(docsRoot);
	const chunks: ChunkOutput[] = [];
	let skippedEmpty = 0;
	let skippedFrontmatter = 0;
	let processedFiles = 0;

	for (let index = 0; index < markdownFiles.length; index += 1) {
		const absolutePath = markdownFiles[index];
		const relativePath = path.relative(projectRoot, absolutePath);
		console.log(
			`Processing ${index + 1}/${markdownFiles.length}: ${relativePath}`,
		);

		const payload = await loadFilePayload(absolutePath);
		if (!payload) {
			const content = normalizeText(await readFile(absolutePath, "utf8"));
			if (content.trim().length === 0) {
				skippedEmpty += 1;
			} else {
				skippedFrontmatter += 1;
			}
			continue;
		}

		processedFiles += 1;
		const headings = findHeadings(payload.content);
		const documents = await splitter.createDocuments(
			[payload.body],
			[
				{
					source: payload.relativePath,
					title: payload.frontmatter.title,
					slug: payload.frontmatter.slug,
					pageType: payload.frontmatter.pageType,
				},
			],
		);

		for (const [chunkIndex, document] of documents.entries()) {
			const range = getLineRange(document.metadata as DocumentMetadata);
			if (!range) {
				continue;
			}

			const startLine = range.from + payload.bodyOffset;
			const endLine = range.to + payload.bodyOffset;
			const heading = findNearestHeading(headings, startLine);

			chunks.push({
				id: `${payload.frontmatter.slug}-${chunkIndex}`,
				text: document.pageContent,
				source: payload.relativePath,
				title: payload.frontmatter.title,
				slug: payload.frontmatter.slug,
				pageType: payload.frontmatter.pageType,
				heading: heading?.text ?? null,
				headingLevel: heading?.level ?? null,
				startLine,
				endLine,
			});
		}
	}

	await writeFile(outputPath, `${JSON.stringify(chunks, null, 2)}\n`, "utf8");

	console.log(
		`Done. Processed ${processedFiles}/${markdownFiles.length} markdown files, wrote ${chunks.length} chunks to ${path.relative(projectRoot, outputPath)}. Skipped ${skippedEmpty} empty files and ${skippedFrontmatter} files without frontmatter.`,
	);
}

void main().catch((error) => {
	console.error("Failed to chunk markdown docs:", error);
	process.exitCode = 1;
});
