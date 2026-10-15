# Phase 2 — Evidence-strength classification (Slice 2)

This slice introduces a *reasoning-type label* on each structured study item. It is **not** a claim-level automated proof, a confidence score, or an assertion that the citations entail the conclusion.

## Response contract
Each study section item retains `text` and `evidence` and adds a required `strength`:
- `direct_text` — observation of the wording, repetitions, sequence or contrasts in the retrieved text.
- `contextual_inference` — interpretation from literary/contextual features of retrieved text.
- `theological_synthesis` — broader theological/canonical synthesis requiring careful qualification.
- `pastoral_application` — reader-facing implications following interpretation.

Section constraints: observations = direct_text; interpretation = contextual_inference; theology and connections = theological_synthesis; application = pastoral_application. Context can be direct_text or contextual_inference. This policy intentionally prevents studies from misrepresenting application as direct biblical quotation.

## Verification
CI: `npm run check && npm test`. Regressions check accepted demos, missing labels, unsupported classifications, wrong-section classifications and invalid evidence IDs. Browser QA: ensure labels appear and remain readable on mobile/desktop, and that citations still expand the correct WEB passage.

## Rollout
This alters the structured OpenAI study response contract. Deploy only after CI and a live smoke test. Old study objects retained in conversation history may lack labels; the frontend tolerates missing labels by omitting the badge. Existing provider licensing and API budgets are unchanged.

## Limitations
Labels are selected by the model and section. Humans must still examine whether a specific assertion is actually supported by the cited text. Future slices can add claim-level evidence rationale and a separate verifier, but do not treat these labels as automated truth certification.
