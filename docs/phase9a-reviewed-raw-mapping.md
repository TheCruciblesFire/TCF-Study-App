# PR #46 — Review-gated TAGNT/TAHOT row reconciliation

**Status: partial PR #46 deliverable — not a full raw STEPBible import.**

The importer `scripts/reconcile-stepbible-rows.js` provides a **schema-pinned transformation for explicitly reviewed TSV field maps**, followed by the PR #43 verse-index validator. It intentionally cannot infer the upstream columns or flatten mixed textual-variant expressions.

## Required review contract

A JSON mapping document (maintained locally until authenticated against an upstream snapshot) must have:

- `reviewed: true` after *actual* upstream file inspection
- `dataset: TAGNT|TAHOT`, `sourceCommit` full 40-hex SHA, `sourceSha256` actual raw file hash
- `columns`: all expected TSV headers, **exact order**
- `fieldColumns`: reviewed source-column names for each of `reference, position, strong, surface, lemma, transliteration, morphology, edition`
- `allowedEditions`: explicitly normalized SINGLE-edition identifiers
- `variantPolicy: explicit-single-edition-per-row`

Do not mark a raw STEPBible mapping as reviewed merely because it passes code validation. The test fixture uses fabricated *column names* to test the interface, not STEPBible's real TAGNT/TAHOT format.

## Known limitations / follow-up

- Actual TAGNT/TAHOT source files and raw headers could not be reliably retrieved in the authoring environment; no authentic row was parsed.
- STEPBible raw files may embed multi-edition flags, concatenated morphology, Hebrew word parts, and Extended Strong suffixes. These need source-aware transformations and **dedicated fixtures from authentic rows** before deployment.
- The existing base-Strong validator deliberately rejects extended, suffixed and ambiguous lexeme IDs until an explicit semantics-preserving mapping is approved; never truncate them automatically.
- Import of TBESG/TBESH lexicon senses, robust transliteration and morphology interpretation remains pending.
- The supplied `stepbible-verified-offline-indexes.zip` contains the already-existing basic G/H Strong indexes and reconciliation audit files, **not** TAGNT/TAHOT raw source tokens.
- No new runtime routes, UI, API.Bible calls, Render variables, study generation changes or MCP capabilities.

**Release gate:** a pinned, hash-verified authentic source sample and an approved edition/variant parser must be tested before calling Phase 9A data import complete.

Run `npm run check`, `npm test`, `npm run preview:test` and ensure no generated lexical artifacts are committed by mistake.
