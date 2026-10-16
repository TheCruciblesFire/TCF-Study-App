# Phase 9A / PR #52 — Source-byte integrity gate

The offline source-record reader previously accepted the SHA-256 digest as caller-provided metadata. This PR introduces a strict pre-parser gate that hashes the **original bytes**, compares them with the pinned manifest and uses fatal UTF-8 decoding. It also validates all six approved source filenames and prevents missing or duplicate inventory members.

`parseVerifiedSourceBytes(bytes, file, sourceCommit)` retains the existing `RAW_RECORDS_ONLY` status; `validateSourceManifest(manifest)` produces a count-only report, not a releasable lexical index. The raw source values must remain outside production APIs and study responses. Existing unit tests use synthetic format-shaped rows and **are not** authentic verse-level golden fixtures.

## Still required for authentic lexical alignment
- Extract narrowly scoped, attributed authentic samples at the pinned commit under a documented review process.
- Verify actual 17-column header semantics separately for TAGNT and TAHOT. The record parser currently assigns friendly field names to partial columns: this is not approved semantic mapping.
- Interpret verse/word positions, original Strong variants, Hebrew ketiv/qere and Greek edition tags without conflation.
- Cross-check known verses independently and test rejection of unexpected rows before generating normalized indexes.
- Preserve source license, full SHA-256 digest, commit and exclusion statistics.

**No runtime routes, public API or production study response are altered.**
