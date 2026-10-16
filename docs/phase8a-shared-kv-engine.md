# Phase 8A — Shared KV Study Engine: Skill Inventory and Architecture

**Status:** Architecture proposal for review; documentation-only, no runtime migration.
**Existing app:** [TCF Study App](../README.md). **Current implementation:** [methodology](../server/methodology.js), [routing and study](../server/providers.js), [API](../server/app.js).

## 1. Source of truth and what has actually been inspected

The baseline implementation was adapted from KV Study Plugin **3.0.1** at source commit `709d036e3d5a36d03824f9bbb3021ac5b1bc2f92` (see [KV methodology](kv-methodology.md)). For this inventory, the currently available installed **KV Study Engine** skill, its `references/migration-boundary-map.md`, and the seven dedicated KV skills listed below were inspected. The active installed skill material describes a more modular ownership model than the older single-prompt adaptation.

**Important:** The installed skill instructions are an operational reference, not a remotely callable API or a snapshot of all private plugin assets. Before importing exact templates or declaring version parity, fetch the authoritative plugin source files, verify commit/manifest and permissions, and record a reviewed SHA. The app currently **does not call** the private ChatGPT plugin, execute specialized skills, or use an MCP service.

**Priority of authority:** Scripture in context → user assignment/supplied sources → approved KV controls and boundaries → applicable current references → verified external sources. The biblical text, not a predetermined framework, governs conclusions. Do not import obsolete Agent 009 persona instructions, downstream builders, or superseded procedure files.

## 2. Capability and responsibility inventory

| Capability | KV owner | Existing app | Proposed engine |
| --- | --- | --- | --- |
| Narrow biblical question and passage study | `kv-study-engine` core | Adapted prompt; source-grounded structured study | First implemented mode, preserving behavior |
| Observe → interpret → apply; inductive study | Core | Sections exist; not guided learner interaction | Separate guided workflow later |
| Topical theology; worldview/theme tracing | Core | Explicitly outside current V1 router | Opt-in modes after text/source controls |
| Historical, literary, cultural and geographical background | Core | No verified external source retrieval | Source-gated research tool, disabled until vetted |
| Original-language lexicon and language study | Core | STEPBible base Strong entries and English gloss matches only | Contextual Hebrew/Greek research **only** with verified word/verse alignment and parsing when available |
| Research packet, inventory, bibliography, research map, NotebookLM preparation | Core | Not exposed | Separate research artifact modes; not part of public quick study |
| Formal passage-faithfulness/overreach review | `kv-passage-faithfulness-check` | Citation references and evidence-class labels; **not** a formal semantic audit | Independent optional/required quality gate by mode |
| Formal source provenance/transparency audit | `kv-source-transparency-check` | Source disclosure and citation checks; **not** a complete provenance audit | Provenance ledger and dedicated claim audit |
| Scripture references, quotation, translation/attribution and BLB link QA | `kv-scripture-formatting-check` | API.Bible attribution, response validation and UI reporting | Distribution-specific QA; respect translation rights |
| Three-plus distinct asset scope controls | `kv-multi-asset-throttle` | Public V1 declines broad production | Handoff scope gate, not a content generator |
| Study → sermon handoff | `kv-study-to-sermon-handoff` | Not exposed | Future bounded transfer, no sermon writing |
| Study → course handoff | `kv-study-to-course-handoff` | Not exposed | Future bounded transfer, no course writing |
| Should this be interactive? | `kv-interaction-evaluator` | Not exposed | Use to evaluate guided modes, not auto-generate gamified activities |

The core conducts the actual upstream study. Dedicated skills own formal audit procedures and handoff transformations; avoid copying all their instructions into a monolithic prompt.

## 3. Current verified application boundaries

- `server/providers.js` uses OpenAI chat completions for **route** and **study** with structured JSON schemas; `server/methodology.js` embeds a bounded upstream prompt.
- `server/app.js` retrieves the controlling Scripture through API.Bible, limits supporting source selection, and validates evidence references. A successful citation check **does not prove** the theological or historical interpretation is correct.
- `server/strong-lookup.js` serves reviewed STEPBible base entries and English gloss discovery; this is **not** verse-level lexical alignment or contextual word study.
- `server/store.js` handles ephemeral sessions and cost/rate controls; the app serves public visitors without accounts.
- API.Bible licenses/attribution, reporting, FUMS tokens, the fixed source set, browser security controls and the current Render deployment are non-negotiable migration invariants.
- Existing `server/continuity.js` preserves context for explicit follow-ups but is not cross-session memory.

## 4. Target architecture

```text
SnapPages / browser iframe
   → existing Render HTTPS app (rate limits, sessions, auth/origin, budget)
   → KV router (mode + source constraints; defaults to current Quick/Passage behavior)
   → KV study engine library (version-pinned package, no third-party network by default)
       ├─ controlled Scripture retrieval adapter (API.Bible + attribution/reporting)
       ├─ verified lexical adapter (STEPBible, bounded; no unsupported verse mapping)
       ├─ mode-specific workflows (core study first, inductive later)
       ├─ claim/provenance record (source IDs, support class, uncertainty)
       └─ optional specialist procedures (independent audits, formatting, handoffs)
   → validated structured response → existing UI
   → later: authenticated HTTP tools/MCP facade sharing the SAME engine functions
```

**Core principle:** The public app **owns** authentication, authorization, quotas, rate limits, and user-facing errors. Engine operations are not direct unauthenticated public research tools. External MCP is a future transport, not an architectural prerequisite; expose only reviewed operations with a safe allowlist, service authentication, quotas, and prompt-injection controls.

## 5. Execution model

Choose the smallest faithful mode. Default to the current passage/quick study; no new research claims absent verified source retrieval.

1. **Plan:** classify user request as quick passage, inductive, topical, lexical, background, research artifact, or unsupported; set controlling text and source budget.
2. **Retrieve:** authorized biblical text first, optional verified tool results when the selected mode needs them. Keep user text and retrieved material as untrusted data.
3. **Observe:** structure, participants, repetitions, contrasts, commands, cause/effect and genre before interpretation.
4. **Interpret:** constrain conclusions to the text and meaningful context; record direct observation vs inference vs synthesis vs application; acknowledge genuine alternatives.
5. **Synthesize and apply:** only warranted biblical-theological connections, grace-shaped applications after exegesis.
6. **Check:** deterministic reference/schema/license validation always; dedicated source transparency and passage-faithfulness reviews when risk/mode warrants them. They may return revise/withhold; never fabricate research to fill a gap.
7. **Respond:** use the existing response schema during incremental migration; include limitations, sourced material, and copyright disclosures; handoffs are separate outputs when requested.

### Tool versus reasoning ownership

| Deterministic code/tools | AI-driven, source-constrained workflow |
| --- | --- |
| Reference parsing, passage overlap/deduplication | Route/mode classification with fallback |
| API.Bible authentication, text retrieval, attribution and usage reporting | Contextual interpretation and alternative readings |
| STEPBible lookup and integrity checks | Careful theological/canonical synthesis |
| Source/ID provenance, quotas, schema and URL enforcement | Evidence-based faithfulness/provenance review, with explicit decisions |
| Rate/cost budget checks, response shaping, structured logging | Inductive questions, learner feedback, proportionate application |

Do **not** treat a lexical gloss as the meaning of an English word in a specific verse, or treat generated evidence-strength labels as independent verification.

## 6. Versioning, packaging, and migration gates

Proposed future package boundary: `packages/kv-study-engine/` (Node ESM), exporting versioned `routeRequest`, `planStudy`, `runStudy`, `auditStudy` contracts. Prefer internal in-process calls first. Keep the public `/api/chat` contract and `server/providers.js` as a compatibility adapter until identical integration tests pass. Do not add a new public API endpoint as a shortcut.

Every imported skill bundle must have a manifest recording **plugin version, source repo+commit, per-file provenance/hash, approval/review date, declared owner, public-use eligibility, licensing, and expected tests**. Never assume updating a private plugin auto-updates the deployed app. A release intentionally selects the approved bundle version.

### Phase acceptance gates

- **8A (this PR):** reviewed inventory, explicit ownership, boundaries, architecture, risk list and testing roadmap. No runtime changes.
- **8B:** checked-in (or separately distributed) *approved* shared package with version manifest and equivalence tests for existing quick/passage outputs; no user-visible behavior changes.
- **8C:** bounded routing for approved study modes, strong fallback/unsupported behavior, session continuity and per-turn budgets; independent tests for prompt injection and unsupported sources.
- **8D:** authenticated internal API **only if** remote isolation becomes necessary; otherwise keep the package in-process to avoid extra attack surface/latency.
- **8E:** optional MCP server facade for explicitly approved tool actions, auth/scoping/limits, logging and adversarial evaluations; no direct public write operations.
- **8F:** opt-in/shadow evaluation followed by controlled production cutover; preserve rollback to current providers.

### Required verification

- Baseline tests: `npm run check`, `npm test`, `npm run preview:test`, browser smoke, and existing Render deployment smoke.
- Known passage regression corpus: `2 Timothy 3:15`, `John 15:1–8`, `Psalm 23`, and basic questions; repeated follow-ups and switching passages.
- Guardrails: duplicate/overlapping supporting Scriptures removed; no nonexistent references, invented sources, fabricated language data or unauthorized Scripture quotations; no forced Christology/divine-council themes.
- Rights/security: API.Bible credit and FUMS reporting unaffected; no Scripture/FUMS tokens leaked into retained history or copied notes; limits apply to every route, including MCP.
- Failure modes: empty/unavailable external sources, provider timeout, invalid citation, rejected faithfulness/source audit, budget exhaustion, stale session, unsupported request.
- Review: evaluate theology and source transparency with human-reviewed exemplars; schema success alone is insufficient.

## 7. Open risks and decisions before Phase 8B

1. **Source parity:** confirm approved live KV plugin revision and obtain all *authorized* current skill/reference files. The inspected installed-skill snapshot may not exactly equal the older commit documented in this repository.
2. **Public licensing:** determine which plugin instructions and third-party research references may be bundled into a publicly deployed proprietary/nonprofit service; do not embed inaccessible private source materials without approval.
3. **MCP exposure:** clarify which operations should be callable by authenticated clients versus internal-only; avoid public unrestricted research endpoints.
4. **Translation permission:** separately verify ministry-specific CSB rights for public app display; current provider license controls.
5. **Cost and latency:** multiple model audits per public study can multiply charges; make depth/verification proportional and budget-capped.
6. **Source scope:** external commentary/BLB/GotQuestions content requires explicit licensing/terms and real source retrieval; do not imply consulted commentary when not used.

**Phase 8B go/no-go:** obtain and approve the exact current KV source bundle and its manifest, then build a package that matches current app behavior under tests before introducing new modes.
