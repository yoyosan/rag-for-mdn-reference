# Unlearn Dev RAG Course

A Next.js course project demonstrating hybrid RAG (vector search + BM25) with multiple AI/embedding providers, PostgreSQL + pgvector, and Promptfoo evaluations — using MDN JavaScript docs as the knowledge base.


## Prerequisites

- [Bun](https://bun.sh) (v1.3.13+)
- PostgreSQL 17+ with [pgvector](https://github.com/pgvector/pgvector) extension

## Setup

### 1. Install dependencies

```bash
bun i
```

### 2. Set up PostgreSQL

Install PostgreSQL and the pgvector extension:

```bash
# macOS with Homebrew
brew install postgresql@18
brew install pgvector

# Start PostgreSQL
brew services start postgresql@18

# Create the database
createdb unlearn-rag-course

# Enable the pgvector extension
psql -d unlearn-rag-course -c "CREATE EXTENSION IF NOT EXISTS vector;"
```

### 3. Configure environment variables

Copy the example environment file and update it with your configuration:

```bash
cp .env.example .env.local
```

Then edit `.env.local` with your settings:

```bash
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/unlearn-rag-course
AI_PROVIDER=ollama
AI_MODEL=qwen2.5:14b
EMBEDDING_PROVIDER=voyage
EMBEDDING_MODEL=voyage-4-large
```

**Available AI Providers:**

| Provider | Models | API Key Required |
|----------|--------|------------------|
| **Ollama** (default) | Any local model (e.g., `qwen2.5:14b`) | No — runs locally |
| **Groq** | `llama-3.3-70b-versatile` | Yes — [groq.com](https://groq.com) |
| **DeepSeek** | `deepseek-v4-flash` | Yes — [deepseek.com](https://deepseek.com) |

**Available Embedding Providers:**

| Provider | Model | API Key Required |
|----------|-------|------------------|
| **Voyage AI** (default) | `voyage-4-large` | Yes — [voyageai.com](https://www.voyageai.com) |
| **Ollama** | Any local embedding model | No — runs locally |

**Ollama Model Recommendations (≤32GB RAM):**

**For RAG (answering queries):**

| Model | Size | RAM | Quality | Notes |
|-------|------|-----|---------|-------|
| `qwen2.5:32b` | 32B | ~20GB | Best | Slowest, best reasoning |
| `qwen2.5:14b` | 14B | ~10GB | Good | Default, good balance |
| `llama3.1:8b` | 8B | ~5GB | Good | Alternative, strong instruction following |
| `qwen2.5:7b` | 7B | ~5GB | Decent | Faster, good for testing |
| `mistral:7b` | 7B | ~5GB | Decent | Fast alternative |

**For seeding (generating context during db:seed):**

| Model | Size | RAM | Speed | Notes |
|-------|------|-----|-------|-------|
| `qwen2.5:7b` | 7B | ~5GB | ~20 min | Minimum for quality context |
| `qwen2.5:14b` | 14B | ~10GB | ~51 min | Default, best context quality |
| `qwen2.5:32b` | 32B | ~20GB | Slowest | Overkill for context generation |

**For vector search (embeddings):**

| Model | Dimensions | RAM | Notes |
|-------|------------|-----|-------|
| `mxbai-embed-large` | 1024 | ~2GB | Recommended, matches pgvector config |
| `nomic-embed-text` | 768 | ~1GB | Lighter, good alternative |

**Tip:** Use 7b for seeding (~20 min vs ~51 min), then switch to 14b or 32b for queries. Context quality matters — 2b/3b models produce poor context labels that hurt search quality.

```bash
# Fast seeding setup (7b is minimum for quality context)
ollama pull qwen2.5:7b
ollama pull mxbai-embed-large

# Configure .env.local for seeding
AI_PROVIDER=ollama
AI_MODEL=qwen2.5:7b
EMBEDDING_PROVIDER=ollama
EMBEDDING_MODEL=mxbai-embed-large

# After seeding, switch to quality model for queries
# Edit .env.local:
AI_MODEL=qwen2.5:14b
```

### 4. Run database migrations

```bash
bun db:migrate
```

This creates all tables: `documents`, `chunks`, `conversations`, `messages`, and `message_sources`.

### 5. Generate chunk data

Process the MDN documentation into chunks:

```bash
bun chunk-docs
```

This creates `chunks.json` from the markdown files in `mdn-js-docs/`.

### 6. Seed the database

```bash
bun db:seed
```

This loads chunks from `chunks.json`, inserts documents and chunks into the database, and automatically generates embeddings for all chunks. The script uses batch processing with context generation for better search quality. It uses upsert operations — safe to re-run without duplicating data.

### 7. Generate embeddings

If you used `bun db:seed`, embeddings are already generated. Otherwise, generate embeddings for existing chunks:

```bash
bun db:embeddings
```

This sends chunks to your configured embedding provider (Voyage AI or Ollama) in batches and stores the resulting vectors in the `chunks.embedding` column. The script only processes chunks that don't already have embeddings, so it's safe to re-run.

### 8. Evaluate RAG Pipeline

Run automated evaluations of the RAG system:

```bash
npm run eval        # Run all evaluations
npm run eval:01     # Retrieval accuracy only
npm run eval:02     # Context adherence only
```

View detailed results:

```bash
npm run eval:view      # View all results
npm run eval:view:01   # View retrieval results
npm run eval:view:02   # View context adherence results
```

See [`evaluation/README.md`](./evaluation/README.md) for setup details.

### 9. Query with RAG

```bash
bun rag-query "What is a closure in JavaScript?"
```

This performs hybrid search and queries the configured AI LLM with retrieved context. Supports `--limit` flag:

```bash
bun rag-query "your question" --limit=10
```

### 10. Start the development server

```bash
bun dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Database

This project uses [Drizzle ORM](https://orm.drizzle.team) with PostgreSQL.

### Schema

The database uses **branded types** for type-safe IDs. Primary keys use either UUID or text with semantic brand tags to prevent mixing up different ID types at compile time.

#### Tables

| Table | Purpose |
|-------|---------|
| `documents` | Source documents (MDN guides) |
| `chunks` | Document chunks with vector embeddings and BM25 search vectors for hybrid search |
| `conversations` | Chat conversations |
| `messages` | Chat messages (user and AI) |
| `message_sources` | Links between AI messages and source chunks (citations) |

### Database commands

```bash
# Generate migrations from schema changes
bun db:generate

# Apply pending migrations
bun db:migrate

# Seed the database with chunks and generate embeddings
bun db:seed

# Generate embeddings for existing chunks
bun db:embeddings

# Debug migration failures
bun db:debug-migrations

# Sync migration journal after manual fixes
bun db:sync-migrations

# Rollback the last migration
bun db:rollback
```

Database scripts live in `scripts/db/`. Configuration is in [`drizzle.config.ts`](./drizzle.config.ts).

## Development

### Architecture Note
- **AI configuration** (`src/config/`) — Centralized AI provider and model configuration with support for multiple providers (Ollama, Groq, DeepSeek) and embedding providers (Voyage AI, Ollama).
- **AI providers** (`src/lib/aiProviders/`) — Provider-specific implementations (e.g., Ollama via OpenAI-compatible API).
- **Server logic** (`src/lib/server/`) — Pure functions for embedding generation, hybrid search (vector + BM25), context generation, and RAG. Used by both CLI scripts and the Next.js API route.
- **Shared constants** (`src/lib/shared/`) — Configuration like batch sizes and default models, shared between server and client.
- **API route** (`src/app/api/chat/`) — Next.js route handler that validates requests and orchestrates the RAG pipeline with tool-based knowledge base access.
- **CLI scripts** (`scripts/`, `scripts/db/`) — Thin wrappers around `src/lib/server/` functions for command-line usage. General scripts in `scripts/`, database-specific scripts in `scripts/db/`.

### Available Scripts

```bash
bun dev          # Start development server
bun build        # Production build
bun type-check   # TypeScript type checking
bun lint         # Run Biome linter
bun lint:fix     # Fix linting issues
bun check-all    # Run type-check + lint
bun chunk-docs   # Process and chunk documents
bun db:generate         # Generate Drizzle migrations
bun db:migrate          # Apply database migrations
bun db:seed             # Seed database and generate embeddings
bun db:embeddings       # Generate embeddings for existing chunks
bun db:debug-migrations # Debug migration failures
bun db:sync-migrations  # Sync migration journal
bun db:rollback         # Rollback last migration
bun semantic-search "your question"  # Search chunks by hybrid search
bun rag-query "your question"        # RAG query with LLM response
npm run eval                         # Run all Promptfoo evaluations
npm run eval:01                      # Run retrieval evaluation only
npm run eval:02                      # Run context adherence evaluation only
npm run eval:view                    # View all evaluation results
npm run eval:view:01                 # View retrieval results
npm run eval:view:02                 # View context adherence results
```

For detailed usage, options, and prerequisites for each script, see [`scripts/README.md`](./scripts/README.md).

## Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org) (App Router)
- **Styling**: [Tailwind CSS](https://tailwindcss.com)
- **Database**: PostgreSQL + [Drizzle ORM](https://orm.drizzle.team)
- **Vector Search**: [pgvector](https://github.com/pgvector/pgvector) + BM25 full-text search (hybrid search)
- **Embeddings**: [Voyage AI](https://www.voyageai.com) or local [Ollama](https://ollama.com)
- **AI/LLM**: [Vercel AI SDK](https://sdk.vercel.ai) with [Groq](https://groq.com), [DeepSeek](https://deepseek.com), or local [Ollama](https://ollama.com)
- **Runtime**: [Bun](https://bun.sh)
- **Linting**: [Biome](https://biomejs.dev)

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Drizzle ORM Documentation](https://orm.drizzle.team/docs)
- [pgvector Documentation](https://github.com/pgvector/pgvector)

## Known Issues

- **`voyageai` ESM build**: The `voyageai` npm package has a known ESM import bug ([upstream issue](https://github.com/voyage-ai/typescript-sdk/issues/26)). The project uses `serverExternalPackages` in `next.config.ts` as a workaround.
- **Dependency advisories**: See [SECURITY.md](./SECURITY.md) for current dependency vulnerability status.

## Rate Limits

This project supports multiple AI providers with different rate limits:

| Provider | Model | RPM | TPM | TPD | Notes |
|----------|-------|-----|-----|-----|-------|
| **Groq** | `llama-3.3-70b-versatile` | 30 | 12,000 | 100,000 | Free tier — `db:seed` may hit TPM limit |
| **DeepSeek** | `deepseek-v4-flash` | Check your plan | Check your plan | Check your plan | Higher limits than Groq free tier |
| **Voyage AI** | `voyage-4-large` | Check your plan | Check your plan | Check your plan | — |
| **Ollama** | Any local model | Unlimited | Unlimited | N/A | Runs locally, no rate limits |

**Groq free tier limitation:** The 12,000 tokens/minute limit can be hit during `db:seed` or `db:generate-contexts` since these process many chunks in sequence. If you hit a `429` error, either:
- Wait a minute and retry
- Switch to DeepSeek or Ollama for setup, then use Groq for queries
- Upgrade to a Groq Developer plan for higher limits

If you hit API rate limits, consider switching to a local Ollama model or upgrading to a paid tier.
