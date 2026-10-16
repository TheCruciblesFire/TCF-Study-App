# Phase 9A — PR #54: Authentic candidate fixture capture

This PR adds an **offline review packet generator** that runs on the pinned six-file STEPBible snapshot. Each candidate contains its original 17 columns, source line number, raw line SHA-256, full file SHA-256, commit and CC BY 4.0 attribution. It selects at most two rows per explicitly listed reference prefix and file, so no full source dataset is checked into the app.

The output artifact is `source-audit/fixture-review-candidates.json` in the **Inspect pinned STEPBible sources** workflow. It has `reviewed:false` and `HUMAN_REVIEW_REQUIRED` on every sampled source file. Do not trust sampled original words as approved mappings.

## Required independent review
1. Rerun the workflow after merging PR #54 and download the new inspection artifact.
2. Inspect each candidate against STEPBible's original pinned source documentation. Confirm actual field meanings, book/verse/word markers and Greek/Hebrew reading conventions.
3. Choose additional samples for Greek editions, Hebrew ketiv/qere, affixes, Aramaic portions, and versification edge cases (ordinary-verse sampling will not cover all cases).
4. After human approval, transfer reviewed expectations to the PR #53 fixture verifier, and verify every line/reference/field against original bytes.
5. Only after verified authentic golden tests create a semantic normalized verse lexicon. Never expose this candidate artifact through the live study API.

**Scope limit:** Candidate capture is not an approved golden fixture suite or independent validation of Strong's, morphology or verse positions. This PR changes no runtime behavior.
