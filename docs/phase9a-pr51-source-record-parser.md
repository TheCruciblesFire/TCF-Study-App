# Phase 9A / PR #51 — Source-record parser foundation

Introduces a **lossless, offline-only record reader** with distinct TAGNT and TAHOT heading gates. Requires pinned commit SHA and source SHA-256 metadata, rejects malformed 17-column candidate rows, retains all original cells (including trailing unnamed fields), reference/reading text, and line numbers. Emits a raw-record status so downstream consumers must not treat results as verified verse lexicon entries.

The first 13 TAGNT and 12 TAHOT fields are named from the inspection headings; all names and values require independent human verification before conversion into semantic normalized records. A matching heading is evidence of file layout, not proof that a given row correctly maps to a Bible verse or lexical entry. Raw morphology/Strong's strings and variant labels remain **opaque**. The reader must not be exposed to runtime routes, model responses or the Blue Letter Bible interface.

## Remaining gates
1. Inspect authentic sample rows and verify the meaning of every mapped source field, especially Hebrew reading variants and compound IDs.
2. Verify source checksums against exact bytes during offline ingestion (metadata required here but not recomputed from this decoded string).
3. Validate book names, chapter/verse numbering, positions and edition policies.
4. Add canonical verse-level golden fixtures and independently inspect textual-variant behavior.
5. Only then build a separate normalized index with full provenance and excluded-row reporting.

Source: STEPBible-Data, CC BY 4.0, STEP Bible / Tyndale House Cambridge; preserve notices and modifications.
