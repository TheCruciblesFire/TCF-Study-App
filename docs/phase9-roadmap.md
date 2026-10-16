# Phase 9 — Integrated Language Study and Three-Path Study Experience

**Status:** The three-mode selector and BLB gateway are implemented, and the standalone lexical lookup UI is removed. Phase 9A foundation remains in progress; see [incremental 9A implementation](phase9a-lexical-foundation.md) and [consolidated delivery plan and exit criteria](phase9-consolidated-delivery-and-exit.md). Production verified verse-linked datasets, initial-response lexical packets, and integrated Key Words cards are not implemented; original-language runtime support remains disabled. **Scope:** TCF Bible Study Assistant, after PR #40. **MCP:** Deferred; no MCP work in Phase 9.

## Product decision

The landing screen presents exactly **three top-level study choices**:

1. **Ask & Explore** — existing conversational Bible study. Planned enrichment will include relevant key-word research in the initial *passage* response only when verified lexical evidence is available.
2. **Guided Study** — existing Observe → Interpret → Apply experience, including optional AI feedback at each stage. Planned enrichment will share the same verified original-language packet and reveal word studies in the interpretation stage.
3. **Deep Dive with Blue Letter Bible** — opens a dedicated, branded BLB search panel based on the provided **TCF Blue Letter Bible Search Widget v1.0.1 — SnapPages-safe, no JavaScript**. This is a **search gateway to blueletterbible.org**, not a new TCF AI model mode and not a BLB data API. Search results open BLB in a new tab.

**The standalone Original-language word lookup panel is retired** from the TCF interface, including its English-gloss/Strong's user-input form and associated navigation. Keep the vetted backend lexical indexes and internal functions: those will support the initial research packet. Deprecate public `/api/strong/:id` and `/api/lexicon/search` only after callers, tests, external embeds and rollback have been inventoried; remove public routes in a separately reviewed change. Do not delete the data or Docker packaging.

## Research architecture

The following lexical enrichment flow is the planned target, not the current runtime.

```text
User selects Ask & Explore or Guided Study + Scripture passage
  -> normalize governing passage and bounded context
  -> in parallel:
       API.Bible authorized text (existing usage reporting + attribution)
       STEPBible tagged original-language source records (verse / token / lemma / morphology)
  -> align by canonical book/chapter/verse, not assumed English token equivalence
  -> select at most 2–4 important lexical items from verified verse-linked candidates
  -> build provenance-carrying study packet (token, lemma, Strong ID, transliteration,
     grammatical features as verified, lexical senses, reference and textual edition)
  -> KV study generation using Scripture first and supplied lexical packet
  -> deterministic validation of emitted lexical IDs, verse occurrences, sense boundaries
  -> initial response: normal structured study + accessible integrated Key Words cards
```

Do not guess a Strong's entry from an English gloss. Distinguish *lexical potential* from *contextual usage*; separate inflected forms from dictionary lemmas, transliteration from parsing and tagged source edition from the licensed English translation. A lack of high-confidence mapping is grounds to omit an item rather than fabricate it. The initial response must remain useful if a language record is unavailable.

## Data rights and source separation

- **STEPBible**: primary machine-readable research data, subject to verifying the actual downloaded dataset, edition, source/license conditions, provenance, and attribution. Expand current base-Strong lexicon to reviewed tagged verse/token coverage and richer Greek/Hebrew senses.
- **API.Bible**: existing authorized Scripture presentation. Maintain translation terms, visible copyright, and FUMS usage reporting.
- **Blue Letter Bible**: research destination via links and user-initiated GET search. **Do not scrape** BLB or reproduce its hosted Thayer/BDB/other licensed text without explicit permission and terms review. BLB external pages supply their own content and attribution.
- **KV Study Engine**: governing Scripture-first methodology; no claim of running the private ChatGPT plugin. Do not introduce forced canonical/Christological conclusions, speculative morphology or unsupported etymologies.

## Original-language presentation contract

**Key Words in the Original Language**, expandable in initial completed study, normally **two to four** entries, only where useful:

- Prominent romanized transliteration (e.g., *menō*), Strong ID (e.g., G3306), brief pronounceable guide if verified
- Original script optional/collapsible; no requirement that readers know Greek/Hebrew alphabets
- Two levels of meaning: (a) broader reviewed lexical senses, (b) constrained meaning in *this* passage
- Identified passage occurrence and source edition; concise morphology only if supported
- Why the lexical feature matters to reading this text; interpretive caution/ambiguity when warranted
- External **Explore in Blue Letter Bible** link to vetted Strong-lexicon destination
- Data source attribution (STEPBible) and independent explanation disclosure
- Never assert that a tagged Greek/Hebrew source maps one-for-one to the configured API.Bible translation's precise English words.

For narrow questions, only supply language work when textual focus or interpretation warrants it. More is not automatically better.

## Deep Dive with Blue Letter Bible — widget integration specification

The third-mode panel is implemented. The original widget reference is preserved at [references/tcf-blb-search-widget-v1.0.1.html](references/tcf-blb-search-widget-v1.0.1.html); subsequent navigation fixes use the direct search endpoint and explicit user-triggered JavaScript navigation described below.

Preserve styling, semantic form fields and mobile behavior from supplied **v1.0.1** widget:

- Root CSS namespace: `.tcf-blb-widget`; dark panel and gold emphasis (`#aba346`, `#d8ce69`, `#111210`).
- Search `GET https://www.blueletterbible.org/search/search.cfm`, `target="_blank"`, parameter **`Criteria`**; translation selector parameter **`t`**, currently defaults to **CSB**. The submit handler constructs this URL and opens it in a new tab on explicit user submission.
- Optional advanced custom Bible range input `cscs`; collapsible `details`.
- Examples for John 3:16, kingdom of God, G26, faith/grace.
- BLB attribution and clear disclosure: search results and any further tools are on **Blue Letter Bible**, not generated by TCF.
- Responsive field stacking below 760 px, labels and keyboard focus indicators; the original reference form needs no JavaScript, while the app uses the user-triggered navigation handler above.
- Rendered inside the app as its own third mode/panel. Do not implement an iframe of BLB results.
- On the third mode, replace/hide the Ask & Explore composer and starter cards while the BLB panel is active, to prevent implying BLB searches call the KV engine. Switching back restores the original app; New Study resets to default.
- Review fixed external endpoint and currently supported translation values at implementation time; keep user-chosen BLB translation independent of API.Bible `BIBLE_ID`.

**Source reference:** user-supplied 299-line “TCF Blue Letter Bible Search Widget v1.0.1 — SnapPages-safe, no JavaScript”, preserved in the repository asset linked above. The app integration includes subsequent navigation fixes; the reference remains the original widget.

## Delivery order and acceptance gates

| Milestone | Implementation | Acceptance |
|---|---|---|
| **9A — Verse-linked lexical foundation** | Import and audit tagged Greek/Hebrew verse occurrence data, lexicon senses, transliteration and morphology, with licenses and edition provenance. | Cross-check a diverse corpus; reject wrong occurrence/Strong IDs, unsupported morphology, mixed editions; maintain existing indexes. |
| **9B — Initial-response research packet** | Enrich sourced passage study with max 2–4 verified, relevant key words *before* study generation. Extend structured schema with source-bound lexical fields; support graceful absence. | One initial request includes lexical insight without manual lookup; budget and hallucinated-lexeme tests pass. |
| **9C — Three-mode UI and BLB gateway** | Three-mode selector and branded BLB panel implemented; standalone word-lookup UI retired, with backend data retained. Integrated accessible language cards in Ask & Explore and Guided Study remain pending. | Responsive/mobile/a11y test; BLB form fields/parameters and external navigation work; other two flows unchanged. |
| **9D — QA and staged endpoint cleanup** | Evaluate NT/OT narrative, epistle, poetry, prophecy and difficult texts; run theological, grammatical, licensing, usage/cost and prompt-injection checks. Remove obsolete public lookup routes only after consumers are verified. | Source attribution, FUMS, citation provenance, user consent, rollback and API cost benchmark all pass. |

Use focused PRs with CI (`npm run check`, `npm test`, `npm run preview:test`) and live Render verification after each merge. The offline preview must include the three-mode selector and BLB gateway without making external requests until a user explicitly submits the BLB form. Avoid raising quotas without measurement.

## Out of scope

No BLB scraping/API proxy; no remote MCP execution; no blanket lexical coverage for every verse; no speculative Greek roots or semantic fallacies; no new sermon/course/devotional creation; no replacement of API.Bible; no automatic third-party navigation on study load.

## Decision history

- Prior roadmap: 9A lexical alignment → 9B study enrichment → 9C UI → 9D QA.
- **2026-10-15 updated decision:** remove redundant standalone lookup UI; move meaningful original-language work into initial study; add third **Deep Dive with Blue Letter Bible** mode using the supplied styled search widget; maintain MCP deferral.


### PR #44 — source staging gate (in progress)

[Source-integrity audit and raw-import gate](phase9a-stepbible-source-import.md) verifies downloaded TAGNT/TAHOT source files and SHA-256 evidence before parsing. Raw edition-aware parsing and TBESG/TBESH semantic import remain explicitly pending; do **not** mark Phase 9A as delivered or enable word cards on this basis alone.


### PR #46 — Reviewed row-mapping adapter

[Phase 9A reviewed mapping contract](phase9a-reviewed-raw-mapping.md) adds fail-closed exact-header and explicit textual-edition row reconciliation. Actual raw TAGNT/TAHOT headers, variants and extended Strong identifiers remain to be mapped against pinned upstream source files; this does not complete 9A or enable language cards.
