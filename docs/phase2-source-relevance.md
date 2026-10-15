# Phase 2 Step 4 — Source relevance, conservative slice

## Behavior
The router is instructed to choose passages that meaningfully address the controlling text, not a shared word or arbitrary theme. After Bible retrieval, the app removes supporting sources whose **normalized passage contents are identical** to a previously selected source, while keeping the controlling source S1. Source IDs are allocated after this screening, so evidence IDs remain contiguous. If a slot remains, the existing bounded immediate-context selector may use it.

The internal relevance classifier detects shared meaningful words but does **not** reject sources merely for lacking lexical overlap: this would incorrectly remove many legitimate canonical/theological connections. A lexical parallel is a research prompt, not proof of interpretive relevance. This screen intentionally avoids inventing a numerical theological-confidence score.

## Review and limitations
- No additional OpenAI calls, no extra API.Bible requests compared with existing maximum.
- No changes to WEB, FUMS attribution, session storage, source-evidence validation, or provider rate/budget limits.
- Regression tests verify identical content is not presented as independent corroboration, and legitimate connections without shared vocabulary are not automatically discarded.
- **Not yet implemented:** a vetted semantic source-ranking model, cited rationale per candidate, or an interpretive evidence verifier. Those require separate acceptance tests and review.
- QA: run `npm run check && npm test`, followed by a Render WEB smoke test and a browser review of Matthew 5:3, Romans 8, and John 15. Ensure the controlling passage remains first and all cited sources are actually displayed.
