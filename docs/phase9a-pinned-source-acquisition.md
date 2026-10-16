# PR #45 — Pinned STEPBible acquisition and column-layout inspection

This PR adds actual **source acquisition** against a pinned 40-character upstream commit. It does **not** claim that the full Greek/Hebrew lexicon has been imported or that raw TAGNT/TAHOT field parsing has been verified.

## Procedure

1. Select a real upstream STEPBible commit and verify its files and license; use the full commit SHA rather than `main` or `master`.
2. Run `node scripts/fetch-stepbible-sources.js <SHA> .local-stepbible/<SHA>` in an environment with GitHub network access.
3. Run `node scripts/stepbible-source-audit.js .local-stepbible/<SHA>/manifest.json .local-stepbible/<SHA>/report.json`.
4. Run `node scripts/inspect-stepbible-layout.js ".local-stepbible/<SHA>/TAGNT Mat-Jhn - Translators Amalgamated Greek NT - STEPBible.org CC-BY.txt" .local-stepbible/<SHA>/tagnt-layout.json`, repeating for all six datasets.
5. Review actual upstream header and representative variant/ketiv-qere rows **outside** this report, document mapping decisions, then write and test a raw adapter. The inspection intentionally does not infer semantics from TSV positions.
6. Later: integrate the review-gated TBESG/TBESH lexicons and morphology tables.

## Safeguards

Downloaded files and manifests stay in the local directory, not in `public/`. They must never be committed with API credentials or unrelated user data. Hash manifests preserve attribution and evidence. No automated runtime fetches, no new Render settings, no changed Bible API usage. GitHub may rate-limit raw downloads; abort rather than silently falling back to another commit or guessed content.

The first network retrieval is performed **by a developer or CI environment with access to raw.githubusercontent.com**. The authoring environment could see upstream repository metadata but could not reliably retrieve the multi-megabyte raw files. Therefore source staging and raw row inspection have not yet been executed against authentic files.

Only source-integrity checks and format-discovery scaffolding are finished in this PR. The full Phase 9A dataset and 9B in-response language features remain pending.
