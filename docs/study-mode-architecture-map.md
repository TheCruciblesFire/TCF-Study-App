# TCF Study App — Product Modes and System Mapping

**Status:** The three-mode selector and BLB gateway are implemented; standalone lookup UI is retired. Verified lexical integration remains pending. See the [Phase 9 roadmap](phase9-roadmap.md) for build order and [current release status](release-status-2026-10-16-web.md) for deployment, operator acceptance, and remaining gates.

| User-facing mode | Current production implementation | Phase 9 target | Engine/third party | Result |
|---|---|---|---|---|
| **Ask & Explore** | `public/app.js` chat form → `/api/chat` → `runRoutedStudy` | Integrate optional verified 2–4 original-language key words in first sourced passage study | KV shared study engine + API.Bible + STEPBible | WEB-text-grounded conversational response |
| **Guided Study** | `public/inductive-guide.js` + existing /api/chat and stage feedback endpoints | Same enriched initial study; key words shown in Interpretation | KV engine + optional WEB-text-aware Observation/Interpretation/Application feedback | Three-step learner workflow |
| **Deep Dive with Blue Letter Bible** | Third-mode branded search panel in `public/index.html`; `public/app.js` constructs direct navigation on user submission | Preserve external search gateway, independent of study generation | Browser → `blueletterbible.org/search/search.cfm` | BLB website results in a new tab |
| **Standalone Original-language lookup** | Public lookup UI removed; `/api/strong/:id` and `/api/lexicon/search` retained | Preserve internal indexes; retire endpoints only after dependency audit; integrated Key Words cards remain pending | STEPBible lexical indexes | No standalone public lookup panel; no integrated word cards yet |
| **MCP discovery** | `/mcp`, enabled only with configured secret | **Deferred** | Optional read-only discovery service | No remote study execution |

## UI wiring decisions

Three mutually exclusive **top-level** choices, exactly: **Ask & Explore**, **Guided Study**, **Deep Dive with Blue Letter Bible**. The third is not an AI deep-research mode; its button must accurately disclose external BLB search and new-tab navigation.

Do **not** remove existing Scripture source cards, reporting, or free-form follow-ups when enriching studies. Guided Study must keep user reflections local except when the learner chooses to submit them for feedback. On mode switches, do not lose unsubmitted guided notes without warning; design the transition explicitly.

## Engine and evidence mapping

- `server/app.js`: public session, origin, metering, controlled study routes.
- `packages/kv-study-engine/`: adapted KV methodology, routing and engine contracts.
- `server/providers.js`: source-bound study generation and validated structured schema; Phase 9 adds explicit lexical evidence contract.
- `server/strong-lookup.js`: currently *base Strong IDs/English gloss candidates*, not verified verse alignment.
- Expanded STEPBible tagged words → deterministic verse join → verified lexical packet → AI explanation → checked initial response.
- BLB is an **external link/search reference**, not currently a programmatic lexical provider; respect permissions.

## Implementation references

- [Phase 8A mapping](phase8a-shared-kv-engine.md) — historical original skill/architecture inventory, superseded for target UI by this map.
- [Phase 9 build and acceptance](phase9-roadmap.md).
- [Guided Study interaction](guided-inductive-study.md) and stage-feedback documents.
- [Original TCF BLB Search Widget v1.0.1](references/tcf-blb-search-widget-v1.0.1.html) — preserved user-supplied HTML/CSS reference; review and adapt for app integration. No live UI change in this PR.
