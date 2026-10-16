# PR #39 — Guided Interpretation Feedback

Adds an optional **Get interpretation feedback** action to step two of Guided Study. The request sends 10–1,200 characters of the learner's interpretation to the server only when clicked, using the current session and the most recent controlling Scripture already retrieved through the licensed provider. The AI returns concise observations about textual support, contextual inferences, uncertainty and a question for further study. This is guidance, **not** a formal faithfulness audit or doctrinal grade.

Existing same-origin controls, session checks, rate limiting, concurrency protections and daily/monthly/per-turn reservation accounting apply. Notes are not saved to the study history. Observation and Application stages are otherwise unchanged. Demo mode and offline preview do not call this endpoint.

Acceptance: run `npm run check`, `npm test`, and `npm run preview:test`; verify the live sequence Guided Study → John 15:1–8 → Observation → Interpretation → enter at least 10 characters → Get interpretation feedback; verify mismatched passage and unsupported operations are rejected. Confirm the display does not suggest the AI independently audited the interpretation.
