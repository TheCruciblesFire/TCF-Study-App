# Phase 2 Step 5b — Offline lexicon import contract

This PR builds a **fail-closed offline importer and indexed JSON output**, not an already populated production lexical database. The STEPBible original TBESG/TBESH files are not normalized 3-column TSV. Their header layout and sub-entries require a separately reviewed conversion. No claims are made that authentic STEPBible records have already been imported.

## Source and license
- STEPBible dataset repository: https://github.com/STEPBible/STEPBible-Data
- Greek source: `Lexicons/TBESG - Translators Brief lexicon of Extended Strongs for Greek - STEPBible.org CC BY.txt`
- Hebrew source: `Lexicons/TBESH - Translators Brief lexicon of Extended Strongs for Hebrew - STEPBible.org CC BY.txt`
- License: CC BY 4.0. Credit **STEP Bible** linking to https://www.stepbible.org/; preserve original notices and document changes to original data.
- Do **not** use moving `master` as an import pin. The manifest requires an exact 40-character upstream commit hash and an exact SHA-256 digest of the **reviewed normalized TSV bytes**.
- During normalization, verify the original raw files against the upstream commit; record precise conversion rules, which entries were omitted/merged, and source-header notices. No unverified guessed glosses or lemma-to-WEB alignment.

## Reviewed interchange format
UTF-8 tab-separated file, header exactly `id<TAB>lemma<TAB>gloss`. Only one canonical G/H Strong index per row. Preserve Greek/Hebrew Unicode in lemma and minimal original-source gloss in gloss; expanded Strong subkeys must be explicitly mapped in the review. Repeated IDs, missing fields, malformed IDs and mismatched SHA-256 are fatal. A minimal manifest:

```json
{
  "sourceUrl": "https://github.com/STEPBible/STEPBible-Data/blob/<COMMIT>/Lexicons/<FILE>",
  "commit": "<40-character verified upstream Git commit>",
  "normalizedSha256": "<sha256 of reviewed normalized TSV>",
  "license": "CC BY 4.0"
}
```

Run `node scripts/import-step-lexicon.js reviewed.tsv manifest.json output/lexicon.json`. The importer creates a JSON map keyed by Strong ID, with source/provenance/attribution metadata. Import is an **offline operator action**, not an automatic build-time download and not a runtime API call. Review and distribute CC BY notices alongside any eventual public output.

## Gates before Step 5c
- Acquire real tagged STEPBible data and select a verified commit SHA.
- Review/implement TBESG and TBESH to normalized TSV conversion against their *actual* layouts.
- Save normalized SHA-256 and reviewed change log.
- Run test suite, import both language indexes with real data, inspect samples and license notices.
- Add an opt-in lookup route and explicit attribution in UI only after authentic data ingestion passes.

Existing WEB/API.Bible flow and OpenAI costs remain unchanged.
