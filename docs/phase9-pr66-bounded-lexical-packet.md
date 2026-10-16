# Phase 9 — PR #66 bounded lexical study packet

This delivers a real, fail-closed **server-side packet lookup** and wires it into the initial `/api/chat` response **only when reviewed occurrence data are explicitly supplied**. It does not invent a Greek/Hebrew source index or mark synthetic fixtures as independently approved.

### Current integration
- `server/lexical-study-packet.js`: resolves a bounded verse range through the existing Scripture reference parser; scans only its actual indexed verse/token records; requires reviewed per-token evidence for the **exact** positioned record, text edition, source commit, Strong ID and lemma; requires a deployed reviewed dictionary entry; returns up to four lexical candidates with original surface, transliteration, morphology code, dictionary gloss and provenance. A gloss is explicitly **not** a contextual interpretation or English text alignment.
- `server/app.js`: adds `lexicalPacket` to an initial response only if `overrides.reviewedVerseIndex`, `overrides.verseApprovals` and the existing lexical databases are all supplied. Without them, response behavior is unchanged.
- No additional OpenAI prompts or Bible API requests, and no new manual language lookup UI.

### Release blocker and honest scope
**No authenticated independent reviewer-approved Greek/Hebrew verse corpus is committed in this PR.** Existing structural fixtures are not lexical truth. Deploying this code without reviewed data supplies **no key-word cards**, and that is intentional. A separate corpus approval and deployment contract are mandatory before promising lexical content. This PR also does **not** inject findings into model generation or select importance by exegesis; its output is an evidence-carrying candidate packet for subsequent ranking and presentation.

### Follow-on concrete work
1. Approve and package a small authentic OT/NT occurrence corpus, with actual row hashes and independent reference/Strong/lemma checks.
2. Supply audited index/approval data at application startup, not from user/model input; verify license and edition-policy consistency.
3. Pass the reviewed packet into the study-generation stage with bounded instructions and source-bound checks; select only 2–4 contextually relevant terms where appropriate.
4. Add reader-facing Key Words cards and end-to-end CI/browser checks. Unsupported passages must still work without lexical insights.

The BLB direct search gateway and original Ask & Explore / Guided Study flows remain unchanged.
