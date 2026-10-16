# Phase 9A — PR #56: Authentic positioned references

Source inspection from pinned STEPBible files demonstrates references of the form `Mat.1.1#01=NKO` and `Gen.1.1#01=L`. The earlier offline parser mistook this syntax for a simpler `Mat.1.001=NKO` form, meaning it skipped genuine word rows.

This PR parses original strings into **book, chapter, verse, token position and reading-marker text** without asserting that the reference has been independently aligned to a canonical verse or that the reading label has been interpreted. Original strings remain intact. Lexical expressions such as `H9003/{H7225G}` remain opaque and uncollapsed. The source-row parser keeps all 17 columns and its RAW_RECORDS_ONLY status.

The candidate sampler now includes Job 1 to cover the previously empty Job–Song corpus. The next pinned source-inspection workflow run should verify its result against authentic rows.

## Remaining verification
- Independently review original source rows and determine whether alternate-versification source reference shapes are represented fully.
- Establish explicit TAGNT and TAHOT field mappings from source documentation; current source column labels are **not** independently certified.
- Preserve textual edition and ketiv/qere identity without a guessed selection policy.
- Convert selected authentic candidates to independently reviewed golden fixtures with source hashes and attribution.
- Only after verse-level golden checks pass consider normalization.

No runtime lexical lookup, study response, BLB interface or production data is changed.
