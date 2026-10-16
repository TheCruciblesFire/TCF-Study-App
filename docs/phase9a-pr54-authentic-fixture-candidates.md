# Phase 9A — PR #54: Authentic pinned-source fixture candidates

The source acquisition workflow already downloads and hash-audits six STEPBible TAGNT/TAHOT files privately. The new **offline** exporter reads a manifest containing those same six files, recomputes each SHA-256, decodes UTF-8 strictly and selects candidate 17-column source rows from each file.

Run locally after staging a pinned source snapshot:

```bash
node scripts/export-stepbible-fixture-candidates.js .local-stepbible/COMMIT/manifest.json /tmp/stepbible-candidates.json
```

The output contains source row line numbers, unmodified reference strings, raw-row digests and all 17 original source columns. It is a **review worklist** rather than a mapping authority. It is not automatically committed or uploaded to workflow artifacts; review and license attribution are required before selecting any examples for repository fixtures. Candidate sampling is intentionally small and not comprehensive, and first-column structural matching is not verse validation.

## Independent review instructions
1. Verify the fixture's source filename, upstream commit and SHA-256 against the pinned original bytes.
2. Confirm the row number, raw row digest and each copied column against the original row.
3. Compare the source's column documentation and the corresponding Scripture reference manually.
4. Record independently verified Greek edition markers, Hebrew ketiv/qere and morphology *only if demonstrably supported*. Do not fill unknown fields by inference.
5. Approved raw rows may then be submitted to `verifyReviewedFixture` with explicit reviewer identity and `reviewed:true`. **Never set this flag automatically.**
6. Add golden tests for independent canonical verse mapping only after cross-checking with authoritative reference data.

The exporter does not change runtime endpoints, translation alignment, study responses, or Blue Letter Bible integration. Existing unit tests for it use synthetic examples; the source records themselves are read at runtime from authentic staged bytes.
