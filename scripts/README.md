# Scripts

This directory contains utility scripts for the RAG pipeline. Each script can be run directly with Bun.

All scripts load environment variables from `.env.local` automatically.

## General Scripts

Located in `scripts/`:

### `chunk-docs.ts`

Processes MDN markdown documentation into chunks for embedding.

**Usage:**

```bash
bun chunk-docs
```

**What it does:**

- Reads markdown files from `mdn-js-docs/`
- Parses frontmatter (title, slug, page-type, sidebar)
- Splits content into chunks using LangChain's MarkdownTextSplitter
- Tracks line numbers and heading context for each chunk
- Writes output to `chunks.json`

**Output:** `chunks.json` — an array of chunk objects with metadata including line ranges, heading context, and document references.

---

### `semantic-search.ts`

Performs hybrid search over chunks using vector similarity, BM25 full-text search, reciprocal rank fusion, and Voyage reranking.

**Usage:**

```bash
# Interactive mode
bun semantic-search

# Direct query
bun semantic-search "your question here"

# With options
bun semantic-search "your question" --limit=10
```

**What it does:**

- Generates an embedding for the question via the configured embedding provider
- Performs parallel vector search (pgvector cosine distance) and BM25 full-text search
- Combines results using reciprocal rank fusion for better relevance
- Displays ranked results with document titles, similarity scores, and content previews

**Options:**

| Flag | Description | Default |
|------|-------------|---------|
| `--limit=N` | Maximum number of results | 5 |

---

### `rag-query.ts`

Full RAG pipeline: hybrid search + LLM response via the configured AI provider.

**Usage:**

```bash
# Interactive mode
bun rag-query

# Direct query
bun rag-query "your question here"

# With options
bun rag-query "your question" --limit=10
```

**What it does:**

1. Retrieves relevant chunks via hybrid search (vector + BM25)
2. Formats chunks as structured context (JSON with metadata, content, and source URLs)
3. Sends augmented prompt to the configured AI provider (Ollama, LM Studio, Groq, or DeepSeek)
4. Displays the AI answer with cited sources and token usage

**Options:**

| Flag | Description | Default |
|------|-------------|---------|
| `--limit=N` | Maximum chunks to retrieve | 5 |

**Prerequisites:**

- AI provider configured in `.env.local` (`AI_PROVIDER` and provider-specific API keys)
- Embeddings must be generated (`bun db:seed` or `bun db:embeddings`)

---

## Database Scripts

Located in `scripts/db/`:

### `seed.ts`

Seeds the database with documents and chunks from `chunks.json`, then generates embeddings.

**Usage:**

```bash
bun db:seed
```

**What it does:**

- Loads `chunks.json`
- Analyzes existing documents and chunks in the database
- Inserts new documents into the `documents` table
- Inserts new chunks into the `chunks` table with foreign key references
- Generates context prefixes for chunks using the configured AI provider
- Generates embeddings for all chunks using the configured embedding provider
- Uses batch processing with configurable batch sizes
- Uses upsert operations — safe to re-run without duplicating data

**Prerequisites:**

- Database must be created and migrations applied (`bun db:migrate`)
- `chunks.json` must exist (run `bun chunk-docs` first)
- AI provider configured in `.env.local` (for context generation)

---

### `generate-embeddings.ts`

Generates vector embeddings for chunks using the configured embedding provider.

**Usage:**

```bash
bun db:embeddings
```

**What it does:**

- Fetches chunks without embeddings from the database
- Sends batches to the configured embedding provider (Voyage AI or Ollama)
- Stores vectors in the `chunks.embedding` column
- Only processes chunks missing embeddings — safe to re-run

**Prerequisites:**

- Embedding provider configured in `.env.local` (`VOYAGE_API_KEY` for Voyage AI, or Ollama running locally)
- Database must be seeded with chunks (`bun db:seed`)

---

### `debug-migrations.ts`

Debug migration failures by running SQL directly with detailed error output. Uses transactions — dry run by default, requires `--force` to apply.

**Usage:**

```bash
# Dry run (default)
bun db:debug-migrations

# Apply pending migrations
bun db:debug-migrations --force
```

---

### `sync-migrations.ts`

Sync the drizzle migration journal when migrations were applied outside of `drizzle-kit` (e.g., manually or via the debug script). Dry run by default.

**Usage:**

```bash
# Check what needs syncing
bun db:sync-migrations

# Actually sync
bun db:sync-migrations --force
```

---

### `rollback-migration.ts`

Rollback the last applied migration. Reverses schema changes, updates journals, and deletes migration files. Dry run by default.

**Usage:**

```bash
# Preview rollback
bun db:rollback

# Execute rollback
bun db:rollback --force
```

---

## Script Order

For a complete setup, run scripts in this order:

```bash
# 1. Generate chunks from MDN docs
bun chunk-docs

# 2. Set up database and generate embeddings
bun db:migrate
bun db:seed

# 3. Query
bun semantic-search "What is a closure?"
bun rag-query "What is a closure?"
```
