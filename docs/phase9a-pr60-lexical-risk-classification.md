# Phase 9A — PR #60: Offline lexical risk gate

This incremental PR classifies raw TAGNT and TAHOT records conservatively, retaining original Strong/grammar and morphology strings. It flags unexpected Greek source syntax, missing edition metadata, Hebrew compound/extended identifiers, ketiv/qere indicators, and alternate-versification markers. Flagged records receive `EXCLUDED_PENDING_REVIEW`; other records remain `RAW_STRUCTURE_ONLY` and **are not authenticated lexical interpretations**.

## Important limits
- Greek grammar suffixes and Hebrew morphological codes are **not decoded** into scholarly semantic claims.
- Greek edition markers are not equated or combined; Hebrew ketiv/qere forms remain separate.
- Even a zero-flag record does **not** pass independent verse-level alignment.
- Fixture tests are illustrative source-shaped cases, not independent canonical witnesses.
- No production database, runtime endpoint, study response or BLB gateway changes.

## Further evidence for actual semantic approval
Compare pinned STEPBible source documentation and independent canonical verse/token witnesses; record approved field meanings, edition rules, Hebrew affix and compound-ID policies, reviewed exclusions and row hashes in signed-off golden fixtures. Only after these gates pass implement semantic normalization.
