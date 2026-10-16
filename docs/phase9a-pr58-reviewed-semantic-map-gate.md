# Phase 9A — PR #58: Reviewed semantic field mapping gate

The project now preserves and checks original, pinned STEPBible source rows, but this does **not** authorize inferring word senses, Strong's meaning, Greek edition membership, Hebrew ketiv/qere, or morphology. This PR introduces an offline validator that accepts only explicit source-specific, reviewer-supplied field assertions.

For each TAGNT or TAHOT record, a reviewer must supply: the pinned source commit and SHA-256, dataset, reviewer name, source documentation reference, field name, 1-based column index, exact raw value, and field-specific evidence. Inexact, duplicate, missing or unreviewed mappings fail closed. The return value retains original values and explicitly states `verifiedLexicalSemantics:false` and `verifiedVerseAlignment:false`.

**What remains:** independently inspect upstream column notes and authenticated examples, build a signed-off reviewed map that accounts for all textual variants, define approved policies for composite Strong's expressions and Hebrew affixes, and independently verify canonical verse/word positions. No production response, public API, BLB gateway or lexical index is changed.

Unit tests exercise this validation gate using illustrative fixtures; they do not substitute for independent scholarly sign-off or prove source semantics.
