# Phase 2 Step 5 — Original-language research: source and data contract
Status: foundation only. **No original-language answers or UI controls are enabled** by this PR.

## Evaluated sources (2026-10-15)
1. **STEPBible Data** — https://github.com/STEPBible/STEPBible-Data — openly published under **CC BY 4.0**. Includes tagged Hebrew and Greek texts, Strong-compatible lexical IDs, morphology and lexical resources. Its README requires credit linked to STEPBible.org and recording modified data. Before importing, review notices for each specific dataset and attribution requirements.
2. **World English Bible** — https://ebible.org/web/ — public-domain English translation, with a protected translation name/trademark. WEB **is not itself proof of one-to-one English-to-Hebrew/Greek alignment**.
3. **Blue Letter Bible** — a useful reader-facing reference gateway, but this PR does not assume BLB's web pages or lexicons can be copied, scraped, or republished as a backend database. Obtain permissions for any such use separately.

## Required integrity contract
A Strong ID is a vocabulary index, **not** a grammatical parse, meaning in a specific verse, an interlinear alignment, or an argument about theology. `parseStrongId` normalizes bounded `H<number>` / `G<number>` identifiers, and `validateLexiconEntry` rejects records with missing lemma, gloss, source or license provenance. Neither function establishes the truth of the lexical content. No AI may fabricate a lexical entry when data is missing.

## Staged integration
- Slice 5a (this PR): strict identifiers, data provenance checks, tests, documented provider selection.
- Slice 5b (future): pin a reviewed STEPBible dataset version and create an offline build pipeline to import a limited licensed lookup table; include dataset commit, notices, validation of duplicates, and attribution displayed alongside results.
- Slice 5c (future): optional explicit user-requested Strong-ID lookup, isolated from Bible-passage routing; never automatically map WEB English words to Greek/Hebrew lemmas. Require a verified tagged original-language verse for context-specific morphology or sense claims.
- Slice 5d (future): compare translations or morphology only from separately verified and attributed alignments, with a human-reviewed regression suite.

## Safety gates
- No additional API spend or runtime network access in slice 5a.
- No changes to public chat, WEB, CSB authorization status, citation validation, session storage or Render environment.
- No lexical interpretation from dictionary glosses alone; the governing passage must remain primary.
- Run `npm run check` and `npm test`; future live-enabled features require independent API, attribution and theological QA.
