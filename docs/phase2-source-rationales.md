# Phase 2 Step 4b — Explain why a source appears

The study response now gives each source a short disclosure in its expandable Scripture card.

The controlling text is labeled as the requested passage. An optional immediate-context excerpt is identified as preceding context. For other supporting sources, the server scans verified study connection items and reports whether the source is **actually discussed alongside S1** using both evidence IDs. If it is not discussed, the UI explicitly says the study did not establish a specific connection.

These are conservative provenance explanations, not model-generated explanations of the router's private reasoning, not independent fact checks, and not theological relevance scores. They avoid claiming the system established a relationship when the structured study does not cite both sources.

## Acceptance
Run `npm run check` and `npm test` in CI. After deployment, run `npm run smoke`, study John 15:1–8 through SnapPages, expand each source, and confirm the reason text matches actual connections. The WEB translation, FUMS reporting, cost controls, and citation checks remain unchanged.
