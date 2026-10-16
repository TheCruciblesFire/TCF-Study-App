# TCF Study App — Product Modes and System Mapping

**Status:** Current baseline + approved Phase 9 target. See [Phase 9 roadmap](phase9-roadmap.md) for build order.

| User-facing mode | Current production implementation | Phase 9 target | Engine/third party | Result |
|---|---|---|---|---|
| **Ask & Explore** | `public/app.js` chat form → `/api/chat` → `runRoutedStudy` | Integrate optional verified 2–4 original-language key words in first sourced passage study | KV shared study engine + API.Bible + STEPBible | Scripture-grounded conversational response |
| **Guided Study** | `public/inductive-guide.js` + existing /api/chat and stage feedback endpoints | Same enriched initial study; key words shown in Interpretation | KV engine + existing Observation/Interpretation/Application feedback | Three-step learner workflow |
| **Deep Dive with Blue Letter Bible** | **Not yet implemented as a third mode** | Styled BLB v1.0.1 GET search panel, separate from the study composer | Browser → `blueletterbible.org/search/preSearch.cfm` | BLB website results in a new tab |
| **Standalone Original-language lookup** | `public/index.html` lexical panel + `public/app.js` + `/api/strong/:id`, `/api/lexicon/search` | Remove public UI; preserve internal indexes; retire endpoints only after dependency audit | STEPBible lexical indexes | Replaced by inline, contextual key-word cards |
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
- User-supplied **TCF BLB Search Widget v1.0.1** (299-line attached HTML/CSS source); copy to repository and inspect before implementation.
