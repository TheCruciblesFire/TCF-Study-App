# PR #40 — Guided Application Feedback

Adds an optional **Get application feedback** control to Step 3 of Guided Study. On click, the learner sends 10–1,200 characters of application notes for AI review. The server independently selects the controlling Scripture text from the latest completed, eligible study in the current authenticated visitor session, instead of trusting user-supplied text. The response supplies a textual anchor, an appropriately bounded response, a caution about unsupported applications, and one specific next step.

This is pastoral study guidance rather than a formal passage-faithfulness check, doctrine grade, or personal directive. Prompts explicitly distinguish commands from chosen applications, prohibit prosperity claims and guaranteed outcomes, and avoid imposed Christological connections.

The existing same-origin session protections, rate limits, concurrency guard, daily/monthly budgets, per-call reservation and token metering apply. The notes are not retained in server conversation history. No additional Scripture retrieval, model/translation configuration or MCP feature is introduced. Demo and offline preview omit paid feedback.

Acceptance: run `npm run check`, `npm test`, `npm run preview:test` and browser smoke. Live QA: Guided Study → John 15:1–8 → Observation → Interpretation → Application → enter at least 10 characters → Get application feedback. Check mismatched passage, malformed notes and denied access; confirm prior stages are unaffected.
