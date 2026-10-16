# Phase 9A / PR #48 — Authentic parser evidence gate

This change adds **structural evidence collection**, not a validated TAGNT/TAHOT token parser. The existing source inspection already verifies six pinned upstream files. The next prerequisite is review of each original column's meaning and edition rules.

## Review sequence

1. Run `Inspect pinned STEPBible sources` on this branch, using the pinned upstream SHA from the workflow default.
2. Download `stepbible-source-inspection` and review each `*_mapping-evidence.json` report. Cross-check any `headerCandidates` against source documentation and actual rows from the same pinned commit.
3. Record a reviewed, dataset-specific, indexed column map, textual edition/reading policies and book/reference conventions. Do **not** infer that the first field is a normalized verse reference or any field is Strong's/morphology merely because a sample resembles one.
4. Add documented fixture rows for Greek textual variants and Hebrew ketiv/qere, affixes, Aramaic passages, versification differences, compound/extended Strong IDs and non-word rows. Respect attribution when incorporating examples.
5. Only then implement source-specific TAGNT and TAHOT parsers feeding an offline normalized token validator and independently check selected verse alignments. No runtime/API/live study response change until these pass.

The extractor emits limited candidate comment/header descriptions and only redacted data-row shapes (field count, column lengths and occupancy); it deliberately marks `mappingReviewed: false`. It is **not** evidence that words have been assigned valid Strong's IDs or morphology.

### Acceptance criteria for completing the later parsing stage
- Exact SHA-256 for all source files, upstream commit and CC BY 4.0 attribution retained.
- Header/field meanings and variant handling reviewed separately for Greek and Hebrew.
- Never silently collapse edition readings, ketiv/qere variants or ambiguous identifiers.
- Reject unknown structures; report exclusions transparently.
- Tests with authentic reviewed fixtures and independent canonical verse/token verification.
- No impact on the production study response, BLB deep-dive gateway or WEB English-text alignment.
