# Unlearn Dev RAG Course

A Next.js project demonstrating Retrieval-Augmented Generation (RAG) with vector search capabilities.

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

Create a `.env.local` file in the project root:

```bash
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/unlearn-rag-course
VOYAGE_API_KEY=your_voyage_api_key_here
GROQ_API_KEY=your_groq_api_key_here
```

**Where to get your API keys:**

- **Voyage AI** — Sign up at [voyageai.com](https://www.voyageai.com) and create an API key from the dashboard
- **Groq** — Sign up at [groq.com](https://groq.com) and generate an API key from your account settings

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

This populates the database with MDN JavaScript documentation chunks (33 documents, ~1,180 chunks). All inserts run inside a database transaction — if any step fails, the database rolls back to its previous state.

### 7. Generate embeddings

Add your Voyage AI API key to `.env.local`:

```bash
VOYAGE_API_KEY=your_key_here
```

Then generate embeddings for all chunks:

```bash
bun db:embeddings
```

This sends chunks to Voyage AI in batches of 128 and stores the resulting 1024-dimensional vectors in the `chunks.embedding` column. The script only processes chunks that don't already have embeddings, so it's safe to re-run.

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

This performs semantic search and queries the Groq LLM with retrieved context. Supports `--limit` and `--threshold` flags:

```bash
bun rag-query "your question" --limit=10 --threshold=0.6
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
| `chunks` | Document chunks with vector embeddings for similarity search |
| `conversations` | Chat conversations |
| `messages` | Chat messages (user and AI) |
| `message_sources` | Links between AI messages and source chunks (citations) |

### Database commands

```bash
# Generate migrations from schema changes
bun db:generate

# Apply pending migrations
bun db:migrate

# Seed the database with chunk data
bun db:seed

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
- **Server logic** (`src/lib/server/`) — Pure functions for embedding generation, semantic search, and RAG. Used by both CLI scripts and the Next.js API route.
- **Shared constants** (`src/lib/shared/`) — Configuration like default LLM model, shared between server and client.
- **API route** (`src/app/api/chat/`) — Next.js route handler that validates requests and orchestrates the RAG pipeline.
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
bun db:seed             # Seed database with chunk data
bun db:embeddings       # Generate Voyage AI embeddings for chunks
bun db:debug-migrations # Debug migration failures
bun db:sync-migrations  # Sync migration journal
bun db:rollback         # Rollback last migration
bun semantic-search "your question"  # Search chunks by semantic similarity
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
- **Vector Search**: [pgvector](https://github.com/pgvector/pgvector)
- **Embeddings**: [Voyage AI](https://www.voyageai.com)
- **AI/LLM**: [Vercel AI SDK](https://sdk.vercel.ai) + [Groq](https://groq.com)
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

This project uses free-tier APIs with rate limits:

| Service | Limit | Reset |
|---------|-------|-------|
| **Groq** (`llama-3.3-70b-versatile`) | 100,000 tokens/day | Daily |
| **Voyage AI** | Check your plan | Varies |

If you hit Groq's rate limit, the error message will show how long to wait. Consider upgrading to a paid tier for production use.
