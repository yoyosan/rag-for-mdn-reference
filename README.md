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

### 8. Query with RAG

```bash
bun rag-query "What is a closure in JavaScript?"
```

This performs semantic search and queries the Groq LLM with retrieved context. Supports `--limit` and `--threshold` flags:

```bash
bun rag-query "your question" --limit=10 --threshold=0.6
```

### 9. Start the development server

```bash
bun dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Database

This project uses [Drizzle ORM](https://orm.drizzle.team) with PostgreSQL.

### Schema

The database uses **branded types** for type-safe IDs. Each table uses UUID primary keys with semantic brand tags to prevent mixing up different ID types at compile time.

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
```

Configuration is in [`drizzle.config.ts`](./drizzle.config.ts).

## Project Structure

```
├── src/
│   ├── app/                 # Next.js App Router
│   ├── components/          # React components
│   │   ├── chat/           # Chat interface
│   │   └── ...
│   ├── db/
│   │   ├── index.ts        # Database connection
│   │   └── schema/         # Drizzle schema modules
│   │       ├── documents.ts
│   │       ├── chunks.ts
│   │       ├── conversations.ts
│   │       ├── messages.ts
│   │       └── messageSources.ts
│   ├── types/
│   │   ├── brands.ts       # Branded type definitions
│   │   ├── bun.d.ts        # Bun runtime type declarations
│   │   └── entities/       # Entity type exports
│   └── lib/
│       └── branded.ts      # Branded type helper
├── drizzle/                # Migration files
├── scripts/
│   ├── chunk-docs.ts       # Document chunking script
│   ├── seed-db.ts          # Database seeding script
│   ├── generate-embeddings.ts # Generate Voyage AI embeddings
│   ├── semantic-search.ts  # Semantic search CLI
│   └── rag-query.ts        # RAG query with Groq LLM
├── chunks.json             # Generated chunk data (gitignored)
├── drizzle.config.ts       # Drizzle Kit configuration
├── bunfig.toml             # Bun configuration (supply chain security)
└── .env.local              # Environment variables (not committed)
```

## Development

### Available Scripts

```bash
bun dev          # Start development server
bun build        # Production build
bun type-check   # TypeScript type checking
bun lint         # Run Biome linter
bun lint:fix     # Fix linting issues
bun check-all    # Run type-check + lint
bun chunk-docs   # Process and chunk documents
bun db:generate   # Generate Drizzle migrations
bun db:migrate    # Apply database migrations
bun db:seed       # Seed database with chunk data
bun db:embeddings # Generate Voyage AI embeddings for chunks
bun semantic-search "your question"  # Search chunks by semantic similarity
bun rag-query "your question"        # RAG query with LLM response
```

## Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org) (App Router)
- **Styling**: [Tailwind CSS](https://tailwindcss.com)
- **Database**: PostgreSQL + [Drizzle ORM](https://orm.drizzle.team)
- **Vector Search**: [pgvector](https://github.com/pgvector/pgvector)
- **Embeddings**: [Voyage AI](https://www.voyageai.com)
- **AI/LLM**: [LangChain](https://js.langchain.com)
- **Runtime**: [Bun](https://bun.sh)
- **Linting**: [Biome](https://biomejs.dev)

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Drizzle ORM Documentation](https://orm.drizzle.team/docs)
- [pgvector Documentation](https://github.com/pgvector/pgvector)
