import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { MarkdownTextSplitter } from "@langchain/textsplitters";
import { runScript } from "@/lib/scripts/utils";
import {
	ChunkOutput,
	collectMarkdownFiles,
	DocumentMetadata,
	findHeadings,
	findNearestHeading,
	getLineRange,
	loadFilePayload,
	normalizeText,
} from "@/lib/server/chunking";

const projectRoot = path.resolve(import.meta.dir, "..");
const docsRoot = path.resolve(projectRoot, "mdn-js-docs");
const outputPath = path.resolve(projectRoot, "chunks.json");

const splitter = new MarkdownTextSplitter({
	chunkSize: 1000,
	chunkOverlap: 100,
});

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

		const payload = await loadFilePayload(absolutePath, projectRoot);
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
				headingLineNumber: heading?.line ?? null,
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

if (import.meta.main) {
	await runScript(main);
}
