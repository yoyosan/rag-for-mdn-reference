# Scripts

This directory contains utility scripts for the RAG pipeline. Each script can be run directly with Bun.

All scripts load environment variables from `.env.local` automatically.

## Available Scripts

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

### `seed-db.ts`

Seeds the database with documents and chunks from `chunks.json`.

**Usage:**

```bash
bun db:seed
```

**What it does:**

- Loads `chunks.json`
- Groups chunks by document (slug)
- Inserts documents into the `documents` table
- Inserts all chunks into the `chunks` table with foreign key references
- Runs inside a transaction — all-or-nothing insertion

**Prerequisites:**

- Database must be created and migrations applied (`bun db:migrate`)
- `chunks.json` must exist (run `bun chunk-docs` first)

---

### `generate-embeddings.ts`

Generates vector embeddings for chunks using Voyage AI.

**Usage:**

```bash
bun db:embeddings
```

**What it does:**

- Fetches chunks without embeddings from the database
- Sends batches of 128 chunks to Voyage AI (`voyage-4-large` model)
- Stores 1024-dimensional vectors in the `chunks.embedding` column
- Only processes chunks missing embeddings — safe to re-run

**Prerequisites:**

- `VOYAGE_API_KEY` must be set in `.env.local`
- Database must be seeded with chunks (`bun db:seed`)

---

### `semantic-search.ts`

Performs semantic search over chunks using pgvector cosine distance.

**Usage:**

```bash
# Interactive mode
bun semantic-search

# Direct query
bun semantic-search "your question here"

# With options
bun semantic-search "your question" --limit=10 --threshold=0.6
```

**What it does:**

- Generates an embedding for the question via Voyage AI
- Queries PostgreSQL with pgvector's `<=>` operator (cosine distance)
- Filters results by similarity threshold
- Displays ranked results with document titles, similarity scores, and content previews

**Options:**

| Flag | Description | Default |
|------|-------------|---------|
| `--limit=N` | Maximum number of results | 5 |
| `--threshold=N` | Minimum similarity (0-1) | 0.5 |

---

### `rag-query.ts`

Full RAG pipeline: semantic search + LLM response via Groq.

**Usage:**

```bash
# Interactive mode
bun rag-query

# Direct query
bun rag-query "your question here"

# With options
bun rag-query "your question" --limit=5 --threshold=0.5
```

**What it does:**

1. Retrieves relevant chunks via semantic search
2. Formats chunks as structured context (JSON with metadata, content, and source URLs)
3. Sends augmented prompt to Groq LLM (`llama-3.3-70b-versatile`)
4. Displays the AI answer with cited sources and token usage

**Options:**

| Flag | Description | Default |
|------|-------------|---------|
| `--limit=N` | Maximum chunks to retrieve | 5 |
| `--threshold=N` | Minimum similarity (0-1) | 0.5 |

**Prerequisites:**

- `GROQ_API_KEY` must be set in `.env.local`
- Embeddings must be generated (`bun db:embeddings`)

---

## Script Order

For a complete setup, run scripts in this order:

```bash
# 1. Generate chunks from MDN docs
bun chunk-docs

# 2. Seed database
bun db:migrate
bun db:seed

# 3. Generate embeddings
bun db:embeddings

# 4. Query
bun semantic-search "What is a closure?"
bun rag-query "What is a closure?"
```
