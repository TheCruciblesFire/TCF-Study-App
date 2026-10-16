# Phase 9A — PR #49 token-row evidence correction

The first mapping-evidence run inspected all six pinned sources, but mixed introduction prose and repeated variant markers into sampled source rows. The source-layout reports reveal common first-column reference shapes including `Mat.1.001=NKO`, `Mat.1.001=N(k)O`, `Gen.1.001=L`, and OT references with parenthesized Hebrew numbering.

This change identifies **candidate token rows** using an explicit reference-pattern gate, counts repeated `Word & Type` / `Eng (Heb) Ref & Type` heading lines separately, counts `#_Significant variant` markers separately, and emits representative column occupancy and length patterns without exposing source word text.

Run the **Inspect pinned STEPBible sources** workflow after merge. Review the six `*_mapping-evidence.json` reports, especially `counts`, `columnHeadingCandidates`, `tokenRowShapes`, and `rejectedRowShapes`.

**Not a parser:** A candidate reference shape is not proof of verse validity or field semantics. The extractor cannot resolve Greek editions, Hebrew affixes, ketiv/qere, versification, original-language Strong identifiers or morphological tags. Full parser work stays blocked until a human-reviewed column map and actual test fixtures establish those meanings. Unknown patterns are reported rather than silently imported. No production endpoints, runtime data or study responses are changed.
