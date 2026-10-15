# Step 5c — Full STEPBible dataset verification

This PR adds an **opt-in GitHub Actions build** for both full Greek and Hebrew TBESG/TBESH files. The workflow downloads the upstream repository, captures the precise HEAD commit, then verifies the exact Git blob SHA of each source file against the previously reviewed blobs:

| Language | Expected immutable Git blob |
|---|---|
| Greek TBESG | `efe271a1dbb73fa01f8fa6e0f164c6687757a9ae` |
| Hebrew TBESH | `a64990a674d13245ae1e9ed426bc69197c2fbad5` |

If either upstream file changes, the workflow **fails closed**, rather than silently importing a changed revision. This enables reproducible re-runs as long as the source blobs remain unchanged, even if the repository HEAD changes. The exact commit is embedded in both indexes and audits, alongside normalized SHA-256, source URLs, credit to STEP Bible, CC BY 4.0 and transformation notices.

`scripts/build-full-step.js` runs full conservative normalization, validates the indexed export and produces a JSON index and an exclusion audit for each language. Extended Strong suffix entries sharing a base ID are **not merged**: ambiguous base IDs are excluded from this interim index, with each collision item enumerated in the audit. This is an intentionally **partial base-ID index**, not the complete extended lexical inventory. In particular, commonly researched Hebrew entries with multiple senses can be absent; omitted items must never be guessed or represented as complete coverage.

## How to run (after merge)
1. GitHub repository → **Actions** → **Build STEPBible Lexical Index (manual)** → **Run workflow**.
2. Inspect run success and the counts printed for each language.
3. Download the `stepbible-verified-offline-indexes` artifact. It contains `G.json`, `H.json`, `G.audit.json`, `H.audit.json`.
4. Check representative data and exclusion lists, retaining credit/notice files when publishing. Do not deploy generated indexes until independently reviewed.
5. If the workflow fails because blob SHA changed, review the new upstream files before changing expected checksums. **Never bypass the integrity check** to make the build succeed.

The workflow is intentionally manual to avoid network downloads on production deployments or regular CI. No chatbot API route, WEB translation, runtime data fetch, UI or application cost change.

### Current scope
The code, tests and manual build workflow are prepared. A real full-dataset run must be confirmed from the GitHub Actions workflow output and downloaded audits. The contents of those artifacts have not yet been independently inspected as part of this PR.
