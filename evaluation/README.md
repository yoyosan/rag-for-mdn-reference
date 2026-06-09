# RAG Evaluation Suite

Automated evaluation of the RAG pipeline using [Promptfoo](https://promptfoo.dev).

## Prerequisites

- **Promptfoo** installed globally:
  ```bash
  brew install promptfoo
  ```
- **Embeddings generated** — Evaluations query the vector database. If embeddings are missing, tests will return empty results.
  ```bash
  bun db:seed
  ```

## Running Evaluations

> ⚠️ **Bun incompatibility**: Promptfoo depends on `better-sqlite3`, which uses native Node.js addons. Bun cannot load these ([upstream issue](https://github.com/oven-sh/bun/issues/4290)). Always run evaluations with `npm` or `npx`, not `bun`.

```bash
# Run all evaluations
npm run eval

# Run individual evaluations
npm run eval:01  # Retrieval accuracy
npm run eval:02  # Context adherence

# View detailed results in browser
npm run eval:view
npm run eval:view:01
npm run eval:view:02
```

## Evaluation Lessons

| Folder | Description |
|--------|-------------|
| `01-retrieval-eval-deterministic/` | Tests retrieval accuracy — does semantic search return the expected chunks for a given query? |
| `02-context-adherence/` | Tests answer faithfulness — does the LLM response stay grounded in the retrieved context? |

More evaluation lessons will be added as the course progresses.

## How It Works

Each evaluation folder is a self-contained Promptfoo suite with:
- `promptfooconfig.yaml` — Test cases and assertions
- Custom provider (`provider.ts`) — Calls your RAG pipeline code

Providers run queries against your local PostgreSQL + pgvector database, so results depend on your actual data and embeddings.

### Retrieval Provider (01)
Returns chunk objects. Tests use `contains-all` assertions to verify expected chunks are retrieved.

### Generation Provider (02)
Returns an object with `answer` and `context`. Tests use `context-faithfulness` assertions to verify the LLM stays grounded in retrieved context.

## Adding New Test Cases

Edit the `promptfooconfig.yaml` in the relevant folder:

**For retrieval tests (01):**
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

**For context adherence tests (02):**
```yaml
tests:
  - vars:
      query: "Your test query here"
    assert:
      - type: context-faithfulness
        transform: "output.answer"
        contextTransform: "output.context"
        value: |
          - Expected claim 1
          - Expected claim 2
        threshold: 0.9
```

## Known Issues

### Model-Specific Results

Context adherence tests (02) use `context-faithfulness` assertions where **the grading model is the same as the RAG model** (both use `getAIModel()`). This is intentional — the eval should reflect what users actually experience in the interface and CLI.

However, this means eval results are tied to a specific provider/model combination. When you switch providers (e.g., Ollama → LM Studio):
- Different models format output differently (markdown links, list structure, etc.)
- The system prompt in `rag.ts` instructs models to "Always include a link to referenced context document" — different models follow this differently
- The same model both generates answers and grades faithfulness, so its judgment varies

**After switching providers:** Re-run evaluations to establish new baselines for that model. The current evals are tuned for **LM Studio** with **qwen2.5-14b-instruct-mlx** — if you use a different provider or model, expect to adjust assertions. Clear the cache first:
```bash
rm -rf node_modules/.cache/promptfoo
npm run eval
```

If a previously passing test now fails, compare the actual output — the answer may be correct but formatted differently. Adjust assertions or thresholds in `promptfooconfig.yaml` to match the new model's behavior.

## Security Note

Installing `promptfoo` transitively pulls in `@huggingface/transformers` → `onnxruntime-web` → `protobufjs`, which has multiple open security advisories. The project mitigates this via a `package.json` override forcing `protobufjs >= 7.5.0`. See [SECURITY.md](../SECURITY.md) for full details.
