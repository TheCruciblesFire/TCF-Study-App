# Guided Observation Feedback — first increment

The optional **Get observation feedback** button appears only during **Observation**, and only on live studies. It sends 10–1,200 characters of the learner's observations and the exact controlling passage reference to `POST /api/study/observation-feedback`. The server uses the most recent study in that session as the authority for Scripture text; user-provided references cannot select arbitrary or historical sources. It passes that text and the notes to a short, structured OpenAI call. The response offers encouragement, one passage-grounded observation, one follow-up observation question, and any caution. It is **not a score or formal theological audit**.

The route requires a valid study session, established same-origin POST protections, shared rate limits, per-session concurrency, and the existing daily/monthly/per-turn reservation and token metering. It does not write learner notes to session history. It adds no new translations, MCP access, data stores, or required Render settings.

Known limits: model-produced feedback may still misinterpret the passage; users must compare it with the displayed Scripture. Observation feedback does not evaluate Interpretation or Application. Demo and offline preview continue to omit live feedback.

Acceptance: CI `npm run check`, `npm test`, `npm run preview:test`. Live QA: Guided Study → John 15:1–8 → enter observation → request feedback → review response; try fewer than 10 characters and mismatched/stale references; confirm normal chat and lexical tool are unaffected.
