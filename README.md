# Unlearn Dev RAG Course

A Next.js project demonstrating Retrieval-Augmented Generation (RAG) with vector search capabilities.

## Prerequisites

- [Bun](https://bun.sh) (v1.3.13+)
- PostgreSQL 17+ with [pgvector](https://github.com/pgvector/pgvector) extension

## Setup

### 1. Install dependencies

```bash
bun install
```

### 2. Set up PostgreSQL

Install PostgreSQL and the pgvector extension:

```bash
# macOS with Homebrew
brew install postgresql@17
brew install pgvector

# Start PostgreSQL
brew services start postgresql@17

# Create the database
createdb unlearn-rag-course

# Enable the pgvector extension
psql -d unlearn-rag-course -c "CREATE EXTENSION IF NOT EXISTS vector;"
```

### 3. Configure environment variables

Create a `.env` file in the project root:

```bash
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/unlearn-rag-course
```

Adjust the connection string to match your PostgreSQL credentials.

### 4. Run database migrations

```bash
bun run db:migrate
```

This creates the `documents` table with vector embedding support.

### 5. Start the development server

```bash
bun run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Database

This project uses [Drizzle ORM](https://orm.drizzle.team) with PostgreSQL.

### Schema

The `documents` table stores content with vector embeddings for similarity search:

| Column | Type | Description |
|--------|------|-------------|
| `id` | serial (PK) | Auto-incrementing ID |
| `content` | text | Document content |
| `embedding` | vector(1536) | Vector embedding for semantic search |
| `metadata` | text | Optional JSON metadata |
| `created_at` | timestamp | Creation timestamp |

### Database commands

```bash
# Generate migrations from schema changes
bun run db:generate

# Apply pending migrations
bun run db:migrate
```

Configuration is in [`drizzle.config.ts`](./drizzle.config.ts).

## Project Structure

```
├── src/
│   ├── app/                 # Next.js App Router
│   ├── components/          # React components
│   │   ├── chat/           # Chat interface
│   │   └── ...
│   └── db/
│       ├── index.ts        # Database connection
│       └── schema.ts       # Drizzle schema definitions
├── drizzle/                # Migration files
├── scripts/
│   └── chunk-docs.ts       # Document chunking script
├── drizzle.config.ts       # Drizzle Kit configuration
└── .env                    # Environment variables
```

## Development

### Available Scripts

```bash
bun run dev          # Start development server
bun run build        # Production build
bun run type-check   # TypeScript type checking
bun run lint         # Run Biome linter
bun run lint:fix     # Fix linting issues
bun run check-all    # Run type-check + lint
bun run chunk-docs   # Process and chunk documents
```

## Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org) (App Router)
- **Styling**: [Tailwind CSS](https://tailwindcss.com)
- **Database**: PostgreSQL + [Drizzle ORM](https://orm.drizzle.team)
- **Vector Search**: [pgvector](https://github.com/pgvector/pgvector)
- **AI/LLM**: [LangChain](https://js.langchain.com)
- **Runtime**: [Bun](https://bun.sh)
- **Linting**: [Biome](https://biomejs.dev)

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Drizzle ORM Documentation](https://orm.drizzle.team/docs)
- [pgvector Documentation](https://github.com/pgvector/pgvector)
