# Phase 2 — Verified cross-reference workflow
Status: **Slice 1 proposed** (2026-10-15); review and test before merge.

## Goal
Deepen the Scripture-centered study while retaining the passage-first KV Study Engine methodology. The controlling passage must drive the study; a cross-reference cannot become a shortcut for assuming a doctrinal framework or an unearned Christological connection.

## Slice 1: bounded selection and disciplined explanation
- Continue routing to one controlling passage and **at most two** supporting passages, which are then retrieved through API.Bible in the configured authorized translation (currently WEB).
- Reject supporting selections that overlap the controlling passage or each other (including whole-chapter versus partial-chapter overlap). The router may choose disjoint excerpts in the same chapter.
- In the connections section, distinguish **explicit textual connections** from **thematic comparison**. Never present a thematic similarity as a direct quotation, promise-fulfillment, authorial intent, or prophecy without text support.
- Use the existing evidence IDs; do not expose unverified quotations, URLs, scholarship or absent biblical passages.
- Keep the existing strict citation checking, per-turn cost reservations, API.Bible translation/FUMS reporting, and maximum three-source request. No new external research endpoints in this slice.

## Acceptance tests
1. John 15:1–8 with John 14:21 and Galatians 5:22–23: accepted as three distinct retrieved texts.
2. John 15:1–8 repeated or shortened to John 15:5 as supporting text: rejected.
3. John 15 as supporting chapter against John 15:1–8: rejected.
4. Romans 8:38–39 and Romans 8:39 supplied together: rejected.
5. Same chapter, disjoint excerpt (John 15:9–12): allowed.
6. An invalid supporting reference: rejected before Bible retrieval.
7. Browser review: generated connections accurately distinguish explicitly stated claims from thematic parallels without invented citations. These qualitative expectations require human inspection, not just CI.

## Next slices (not implemented here)
1. Evidence-strength labels (direct textual support / contextual inference / canonical or thematic synthesis) with schema and UI support.
2. Bounded context retrieval and cross-reference ranking, with deterministic input constraints and transparent non-selection reasons.
3. Optional authorized lexicon/linguistic tools after provider terms and technical contracts are established.
4. Theological review suite for Matthew 5:3, Romans 8:18–30, Hebrews 6:4–8, plus source-retrieval and cost metrics.

## Deployment and licensing
WEB Bible ID: `9879dbb7cfe39e4d-01` (Render environment). CSB license for model prompt context remains pending; do **not** restore CSB until express authorization. Phase 2 is additive and does not change Render configuration.
