# Phase 9A — PR #53: independently reviewed source fixtures

This change creates a strict **fixture-verification mechanism** rather than asserting that synthetic examples prove authentic biblical alignment.

- Source byte integrity must pass the pinned manifest check.
- A reviewer must supply exact original file name, digest, record line number, row SHA-256, raw reference, and explicitly checked one-based source columns.
- Verification fails closed on altered source bytes, wrong row digests, incorrect reference values, duplicate fixtures, or mismatched columns.
- The raw 17 source columns are preserved intact for manual verification, even where partial semantic field labels remain tentative.

## Creating authentic fixtures (required follow-up)
1. Stage the six pinned real files using the existing verified source workflow.
2. Select representative original Greek and Hebrew rows covering ordinary records, edition differences, ketiv/qere, morphology, affixes and differing versification.
3. Have a reviewer inspect and approve **actual** original row values, column positions, digest and license attribution independently of the parser.
4. Record the approved expectations in fixture JSON files and test against staged source bytes (do not embed unreviewed source text).
5. Only after full source semantics and verse alignments are independently checked implement normalization.

Current tests deliberately use **synthetic rows to test the verifier**. They are not genuine golden biblical fixtures; no authentic verse-level accuracy is claimed. The new verifier does not feed production API routes, AI responses, or the BLB gateway.
