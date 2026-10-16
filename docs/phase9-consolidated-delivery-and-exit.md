# Phase 9 — Consolidated delivery plan and Phase 9A exit gate

**Governing user experience** (from `docs/phase9-roadmap.md`): Ask & Explore, Guided Study, Deep Dive with Blue Letter Bible. Verified key-word insights belong in the *initial* passage response, not a standalone language-lookup experience. Preserve API.Bible licensing and usage reporting; BLB is a user-initiated external gateway.

## Audit of the existing implementation
- **Reuse**: `scripts/fetch-stepbible-sources.js`, `scripts/stepbible-source-audit.js` (pin and verify); `scripts/parse-stepbible-source-records.js` and `scripts/stepbible-raw-reference.js` (opaque source representation); `server/verse-lexicon.js` (existing narrow normalized contract); TBESG/TBESH work in `scripts/build-full-step.js`.
- **Inspect, not chain automatically**: `extract-stepbible-mapping-evidence.js`, `collect-stepbible-fixture-candidates.js`, `validate-stepbible-authentic-candidates.js`, `verify-stepbible-golden-fixtures.js` (inspection and fixtures); `validate-stepbible-semantic-map.js`, `inspect-stepbible-documented-fields.js`, `classify-stepbible-lexical-risks.js` (overlapping review aids, not independently verified mappings). **Do not add another generic validator**.
- **Existing limitation**: no released verified verse-token index, independent full lexical/edition review, or initial-response integration. 9A is NOT complete merely because the file integrity/CI checks pass.
- Do not delete old utilities before downstream consumers and rollback are inventoried.

## Bounded Phase 9A release candidate
Choose representative uncomplicated NT and OT passages and an explicit source edition per token. Review each token with the original row SHA, pinned upstream file hash, source documentation, an independent witness for verse + token occurrence and edition, and reviewed Strong/lemma/morphology interpretation. Exclude ambiguous compounds, unresolved variant readings, unsupported affixes and unverified alignment. **No fixed number of entries is required**; only approved entries ship. Reuse existing lexical indexes where they demonstrably match the tagged occurrence; never infer occurrence from Strong lexicon membership.

`scripts/assess-phase9a-exit.js` is an **administrative mechanical gate**: it checks bounded records, strict source metadata, an approval per entry, and matching verse/edition/position keys. Approval flags are attestations supplied by reviewers, not independent verification performed by the script. The gate cannot prove textual accuracy, sources, licenses, or human authority. Keep it offline until provenance and independent witnesses have actually been reviewed.

### Hard exit criteria
1. At least one authentic Greek and one authentic Hebrew passage with independent human-reviewed occurrence-level fixtures; published subset and omissions documented.
2. Single edition/reading per published token; exclusions and variant notes are explicit.
3. Pinned source/row digests and reproducible build/audit evidence.
4. TBESG/TBESH source senses checked where used; no fabricated contextual meaning.
5. Mechanical exit check passes and independent review evidence is retained.
6. No production integration until all five are complete.

## Originally proposed delivery order after PR #61

**Historical note:** The proposed PR numbers below were superseded by implementation history. PR #62 implemented the three-mode UI and BLB gateway and removed the standalone lexical lookup UI. PRs #63–65 addressed BLB navigation reliability; those merges do not establish completion of 9A, 9B, or 9D. Initial-response lexical packets and integrated Key Words cards remain unimplemented. Do not infer milestone completion from PR numbering.

- **#62 — 9C early:** Three-mode UI and the existing branded BLB search gateway. Keep the live study mechanism unchanged; retire UI-only standalone lookup after consumer inventory.
- **#63 — 9A completion + 9B:** Bounded reviewed verse index and initial-response research packet; graceful omission without source evidence. Split if necessary for meaningful review.
- **#64 — 9B/9C:** Key Words cards in Ask & Explore and Guided Study; end-to-end Scripture/edition/source/UX/licensing/usage QA.
- **#65 — 9D:** Staged release with feature flag, rollback and documented route cleanup after consumers are verified.

**Stop condition:** If independent lexical review blocks 9A completion, retain the shipped BLB gateway without fabricated original-language summaries. Do not generate more indefinite 9A inspection PRs.
