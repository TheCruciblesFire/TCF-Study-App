# Phase 8C — Shared KV Study routing

## Scope

The existing public `/api/chat` endpoint now executes approved requests through `packages/kv-study-engine/router.js` using dependency injection. The workflow invokes the existing router **once**, applies the existing conversational continuity function, retrieves existing authorized Scripture, enforces the shared source-ID contract, generates a study **once**, then calls the existing verifier. Existing provider-level citation retry behavior remains unchanged.

Only `passage` and `question` are enabled. Unknown, unsupported, topical, original-language, and specialist audit modes do not trigger Scripture retrieval or AI study synthesis in this orchestrator. The existing lexical search endpoint remains separate and unchanged. This is orchestration of the adapted KV methodology, not execution of the installed ChatGPT plugin.

## Invariants

- API.Bible provider, attribution and usage reporting unchanged; no cached unlicensed passage text.
- Existing cost reservation, request/session quotas, origin protections and 1500-character message limit unchanged.
- The existing `preserveFollowupPassage` policy runs before Scripture retrieval; invalid or overlapping supporting references continue to be handled by the existing provider's route validator.
- Engine cannot generate with duplicate or missing controlling source IDs.
- No new public endpoints, environment variables or model requests.
- Demo mode and offline preview retain their existing browser and fixture behavior.

## Verification

Run `npm run check`, `npm test`, `npm run preview:test`, `npm run test:browser` in CI. Live smoke after deployment: initial `2 Timothy 3:15`; follow-up `Explain this passage further`; switch to `John 15:1–8`; confirm unsupported research request retains an honest response. Keep a rollback path by reverting the isolated app adapter change if user-facing behavior diverges.

## Next phase

Only after CI and live acceptance: consider new opt-in modes with approved KV source parity, bounded source adapters, independent QA procedures, and measurable per-mode costs. MCP and separate internal API remain deferred.
