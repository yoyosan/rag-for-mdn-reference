# Security Policy

## Supported Versions

This is a learning/demo project. Security updates are applied on a best-effort basis.

| Version | Supported |
|---------|-----------|
| `main`  | Yes       |

## Known Vulnerabilities

### langsmith — GHSA-3644-q5cj-c5c7 (CVE-2026-45134)

**Status:** Accepted (not blocking)  
**Severity:** High  
**Affected package:** `langsmith < 0.6.0`  
**Current version in lockfile:** `0.5.26`

**Details:**
The LangSmith SDK's prompt pull methods (`pullPrompt`, `pullPromptCommit`) fetch and deserialize prompt manifests that may contain serialized LangChain objects. When pulling a *public* prompt by `owner/name`, the manifest is controlled by an external party. Prior to `0.6.0`, the SDK did not require explicit opt-in for this trust boundary.

**Why this is accepted:**
This codebase does not call `pullPrompt()` or `pullPromptCommit()`. The vulnerable codepaths are not exercised by the application. The vulnerability exists only as transitive dead code in `node_modules`.

**Remediation path:**
Add to `package.json`:

```json
"overrides": {
  "langsmith": ">=0.6.0"
}
```

Then run `bun install` and verify with:

```bash
grep 'langsmith@' bun.lock
```

Expected output should show `langsmith@0.6.x` or higher.

Note: Updating `langchain` or `@langchain/core` alone does **not** resolve this, because all current versions specify `"langsmith": ">=0.5.0 <1.0.0"`, which allows but does not require `>=0.6.0`.

### postcss — CVE-2026-41305

**Status:** Accepted (not blocking)  
**Severity:** Medium  
**Affected package:** `postcss` (via `next`)  
**Current version in lockfile:** Transitive via Next.js

**Details:**
PostCSS has an XSS vulnerability in its CSS stringify output when `</style>` is not properly escaped. An attacker could inject a closing `</style>` tag to break out of a CSS context and execute JavaScript.

**Why this is accepted:**
PostCSS is a build-time tool in this project. It processes CSS at build/compile time, not at runtime from user input. The application does not dynamically process untrusted CSS through PostCSS. The vulnerability is only relevant if you are running PostCSS against attacker-controlled CSS strings in a production server context.

**Remediation path:**
This will be resolved automatically when Next.js updates its PostCSS dependency. No direct action required unless you start processing user-submitted CSS at runtime.

### esbuild — GHSA-67mh-4wv8-2f99

**Status:** Accepted (not blocking)  
**Severity:** Medium  
**Affected package:** `esbuild` (via `drizzle-kit` → `tsx`)  
**Current version in lockfile:** Transitive via `drizzle-kit`

**Details:**
esbuild's development server did not properly validate the origin of incoming requests. Any website could send requests to the esbuild dev server and read the responses, potentially exposing source code or other build artifacts.

**Why this is accepted:**
esbuild is only used as a TypeScript transpiler when running `drizzle-kit` CLI commands (via `tsx`). It is not running as a persistent development server exposed to the web. The vulnerability requires an actively running esbuild dev server listening on a network interface, which does not happen in this project's usage pattern.

**Remediation path:**
This will be resolved when `drizzle-kit` or `tsx` updates its esbuild dependency. No direct action required.

## Reporting a Vulnerability

If you discover a security issue in this project, please open a GitHub issue with the prefix `[SECURITY]`. For sensitive disclosures, email the maintainer directly.

Response time: best effort (this is a personal learning project, not production software).
