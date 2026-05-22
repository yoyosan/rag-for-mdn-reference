# RAG Evaluation Suite

Automated evaluation of the RAG pipeline using [Promptfoo](https://promptfoo.dev).

## Prerequisites

- **Promptfoo** installed globally:
  ```bash
  brew install promptfoo
  ```
- **Embeddings generated** — Evaluations query the vector database. If embeddings are missing, tests will return empty results.
  ```bash
  bun db:embeddings
  ```

## Running Evaluations

> ⚠️ **Bun incompatibility**: Promptfoo depends on `better-sqlite3`, which uses native Node.js addons. Bun cannot load these ([upstream issue](https://github.com/oven-sh/bun/issues/4290)). Always run evaluations with `npm` or `npx`, not `bun`.

```bash
# Run all evaluations
npm run eval

# View detailed results in browser
npm run eval:view
```

## Evaluation Lessons

| Folder | Description |
|--------|-------------|
| `01-retrieval-eval-deterministic/` | Tests retrieval accuracy — does semantic search return the expected chunks for a given query? |

More evaluation lessons will be added as the course progresses.

## How It Works

Each evaluation folder contains:
- `promptfooconfig.yaml` — Test cases and assertions
- Custom provider (e.g., `retrieval-provider.ts`) — Calls your RAG pipeline code

The retrieval provider runs queries against your local PostgreSQL + pgvector database, so results depend on your actual data and embeddings.

## Adding New Test Cases

Edit `01-retrieval-eval-deterministic/promptfooconfig.yaml`:

```yaml
tests:
  - vars:
      query: "Your test query here"
    assert:
      - type: contains-all
        value:
          - expected-chunk-id-1
          - expected-chunk-id-2
```

## Security Note

Installing `promptfoo` transitively pulls in `@huggingface/transformers` → `onnxruntime-web` → `protobufjs`, which has multiple open security advisories. The project mitigates this via a `package.json` override forcing `protobufjs >= 7.5.0`. See [SECURITY.md](../SECURITY.md) for full details.
