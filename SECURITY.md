# Security Policy

## Supported Versions

This is a learning/demo project. Security updates are applied on a best-effort basis.

| Version | Supported |
|---------|-----------|
| `main`  | Yes       |

## Override Summary

All known transitive vulnerabilities are mitigated via `package.json` overrides:

```json
"overrides": {
  "postcss": "^8.5.10",
  "uuid": "^14.0.0",
  "hono": ">=4.12.25",
  "axios": "^1.8.0",
  "langsmith": ">=0.6.0",
  "protobufjs": ">=8.4.1",
  "qs": "^6.15.2",
  "esbuild": ">=0.28.1",
  "ws": ">=8.21.0",
  "form-data": ">=4.0.6"
}
```

Run `bun install` to apply all overrides.

## Known Vulnerabilities

### axios — GHSA-fvcv-3m26-pcqx (and related CVEs)

**Status:** Mitigated (override applied)  
**Severity:** High  
**Affected package:** `axios < 1.8.0` (via `promptfoo` → `@slack/web-api`)  
**Current version in lockfile:** Forced to `>=1.8.0` by override

**Details:**
Multiple CVEs affect older axios versions: MitM via prototype pollution, proxy-authorization credential leaks, ReDoS via cookie injection, and NO_PROXY bypass. All are transitive via promptfoo's Slack integration.

**Why this is accepted:**
`promptfoo` is a development-only evaluation tool. The `@slack/web-api` dependency is not exercised by this project. The vulnerable codepaths are dead code in `node_modules`.

**Remediation path:**
Override forces `axios >= 1.8.0`:

```json
"overrides": {
  "axios": "^1.8.0"
}
```

### hono — CVE-2026-47673 (and related CVEs)

**Status:** Mitigated (override applied)  
**Severity:** Medium  
**Affected package:** `hono < 4.12.25` (via `promptfoo`)  
**Current version in lockfile:** Forced to `>=4.12.25` by override

**Details:**
Multiple CVEs: JWT middleware accepts any Authorization scheme, cookie helper doesn't sanitize sameSite/priority, app.mount() strips prefix using undecoded path, IP restriction bypasses for non-canonical IPv6.

**Why this is accepted:**
`promptfoo` is development-only. Hono is not used as a runtime server in this project.

**Remediation path:**
Override forces `hono >= 4.12.25`:

```json
"overrides": {
  "hono": ">=4.12.25"
}
```

### langsmith — GHSA-3644-q5cj-c5c7 (CVE-2026-45134)

**Status:** Mitigated (override applied)  
**Severity:** High  
**Affected package:** `langsmith < 0.6.0`  
**Current version in lockfile:** Forced to `>=0.6.0` by override

**Details:**
The LangSmith SDK's prompt pull methods (`pullPrompt`, `pullPromptCommit`) fetch and deserialize prompt manifests that may contain serialized LangChain objects. Prior to `0.6.0`, the SDK did not require explicit opt-in for this trust boundary.

**Why this is accepted:**
This codebase does not call `pullPrompt()` or `pullPromptCommit()`. The vulnerable codepaths are not exercised by the application.

**Remediation path:**
Override forces `langsmith >= 0.6.0`:

```json
"overrides": {
  "langsmith": ">=0.6.0"
}
```

Note: Updating `langchain` or `@langchain/core` alone does **not** resolve this, because all current versions specify `"langsmith": ">=0.5.0 <1.0.0"`, which allows but does not require `>=0.6.0`.

### postcss — CVE-2026-41305

**Status:** Mitigated (override applied)  
**Severity:** Medium  
**Affected package:** `postcss < 8.5.10` (via `next`)  
**Current version in lockfile:** Forced to `>=8.5.10` by override

**Details:**
PostCSS has an XSS vulnerability in its CSS stringify output when `</style>` is not properly escaped.

**Why this is accepted:**
PostCSS is a build-time tool. It processes CSS at build/compile time, not at runtime from user input. The application does not dynamically process untrusted CSS through PostCSS.

**Remediation path:**
Override forces `postcss >= 8.5.10`:

```json
"overrides": {
  "postcss": "^8.5.10"
}
```

### esbuild — GHSA-67mh-4wv8-2f99

**Status:** Mitigated (override applied)  
**Severity:** Medium  
**Affected package:** `esbuild < 0.28.1` (via `drizzle-kit` → `tsx`)  
**Current version in lockfile:** Forced to `>=0.28.1` by override

**Details:**
esbuild's development server did not properly validate the origin of incoming requests. Any website could send requests to the esbuild dev server and read the responses.

**Why this is accepted:**
esbuild is only used as a TypeScript transpiler when running `drizzle-kit` CLI commands. It is not running as a persistent development server exposed to the web.

**Remediation path:**
Override forces `esbuild >= 0.28.1`:

```json
"overrides": {
  "esbuild": ">=0.28.1"
}
```

### protobufjs — GHSA-66ff-xgx4-vchm (and related CVEs)

**Status:** Mitigated (override applied)  
**Severity:** High  
**Affected package:** `protobufjs < 8.4.1` (via `promptfoo` → `@huggingface/transformers` → `onnxruntime-web`)  
**Current version in lockfile:** Forced to `>=8.4.1` by override

**Details:**
Multiple CVEs affect `protobufjs` versions below 8.4.1, including code injection, denial of service, and prototype pollution.

**Why this is accepted:**
`promptfoo` is a development-only dependency. The vulnerability only exists in the local development environment when running evaluations.

**Remediation path:**
Override forces `protobufjs >= 8.4.1`:

```json
"overrides": {
  "protobufjs": ">=8.4.1"
}
```

### qs — CVE-2026-8723

**Status:** Mitigated (override applied)  
**Severity:** Medium  
**Affected package:** `qs < 6.15.2` (via `promptfoo` → `express`)  
**Current version in lockfile:** Forced to `>=6.15.2` by override

**Details:**
`qs.stringify` crashes with TypeError on null/undefined entries in comma-format arrays when `encodeValuesOnly` is set, causing a remotely triggerable DoS.

**Why this is accepted:**
`express` is a transitive dependency of `promptfoo`, which is development-only. The vulnerable codepath requires specific `stringify` options unlikely to be triggered.

**Remediation path:**
Override forces `qs >= 6.15.2`:

```json
"overrides": {
  "qs": "^6.15.2"
}
```

### uuid — CVE-2026-41907

**Status:** Mitigated (override applied)  
**Severity:** Medium  
**Affected package:** `uuid < 14.0.0` (via `langchain` → `@langchain/langgraph`)  
**Current version in lockfile:** Forced to `>=14.0.0` by override

**Details:**
Missing buffer bounds check in v3/v5/v6 when `buf` is provided.

**Why this is accepted:**
The vulnerable codepath requires passing a custom buffer to uuid v3/v5/v6 functions, which this project does not do.

**Remediation path:**
Override forces `uuid >= 14.0.0`:

```json
"overrides": {
  "uuid": "^14.0.0"
}
```

### ws — CVE-2026-45736

**Status:** Mitigated (override applied)  
**Severity:** Medium  
**Affected package:** `ws < 8.21.0` (via `promptfoo`)  
**Current version in lockfile:** Forced to `>=8.21.0` by override

**Details:**
`websocket.close()` is vulnerable to uninitialized memory disclosure when a `TypedArray` is passed as the reason argument.

**Why this is accepted:**
`promptfoo` is development-only. The vulnerable codepath requires passing a `TypedArray` to `ws.close()`, which is not a standard usage pattern.

**Remediation path:**
Override forces `ws >= 8.21.0`:

```json
"overrides": {
  "ws": ">=8.21.0"
}
```

### form-data — CVE-2026-XXXXX

**Status:** Mitigated (override applied)  
**Severity:** Medium  
**Affected package:** `form-data < 4.0.6`  
**Current version in lockfile:** Forced to `>=4.0.6` by override

**Details:**
Older versions of form-data have potential security issues with how form data is serialized and boundary handling.

**Why this is accepted:**
This is a transitive dependency. The override ensures a secure version is used.

**Remediation path:**
Override forces `form-data >= 4.0.6`:

```json
"overrides": {
  "form-data": ">=4.0.6"
}
```

## Reporting a Vulnerability

If you discover a security issue in this project, please open a GitHub issue with the prefix `[SECURITY]`. For sensitive disclosures, email the maintainer directly.

Response time: best effort (this is a personal learning project, not production software).
