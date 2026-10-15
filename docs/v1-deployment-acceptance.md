# TCF Study App — V1 deployment and acceptance record
Date: 2026-10-15. Evidence: operator-reported live tests and repository configuration; not an independent production penetration test or full theological audit.

## Running system
- Repository: https://github.com/TheCruciblesFire/TCF-Study-App
- Live URL: https://tcf-study-app.onrender.com/
- Host: Render single Node.js web service; SQLite persistent disk at `/var/data/tcf`.
- Website: embedded in SnapPages at thecruciblesfire.org (specific page URL has not been independently confirmed).
- Configuration: `APP_MODE=live`, `DATA_DIR=/var/data/tcf`, `BIBLE_ID=9879dbb7cfe39e4d-01` (World English Bible, WEB). `TCF_OPENAI_API_KEY` and `TCF_BIBLE_API_KEY` remain server-side secrets. Do not paste secrets into documentation.
- Model: `gpt-4.1-mini` unless overridden in production.
- API.Bible/FUMS: WEB translation metadata and passage requests; browser reporting with FUMS token. The standard WEB is the temporary public-domain translation while CSB AI-processing permission is pending.
- Readiness: operator saw `Readiness passed: live passage study, source text, citations, and reset` after changing to WEB. User previously confirmed follow-up and SnapPages integration functional; a post-switch browser confirmation of visible WEB attribution and follow-up remains pending.
- Disk recovery: Render disk mounted at `/var/data/tcf`, production `DATA_DIR` corrected from `/app/.data` to `/var/data/tcf`; the same SQLite usage row survived a Render service restart (2026-10-15, 1 completed request, 1753 input tokens, 879 output tokens, estimated $0.0021076). Earlier ephemeral database records are not assumed preserved.
- Limitations: smoke test covers a single passage and limited citation IDs; public browser behavior and full theological correctness were not independently audited.

## Known regressions (October 15)
1. Initial follow-up failed with `INVALID_CITATION` when generated text named a passage outside retrieved ranges.
2. First mitigation constrained generated references; second added bounded retry against same sources.
3. Production `citationDiagnostic` showed unmatched chapter labels `Romans 8` and `Hebrews 6` with available passages `Hebrews 6:4-8`, `John 10:27-29`, `Romans 8:38-39`.
4. Validator now allows a bare chapter *label* when an excerpt from that chapter was retrieved. This does NOT authorize claims about unprovided verses.
5. Operator confirmed the subsequent follow-up passed. This is a targeted success, not universal guarantee.

## Release gating: Scripture licensing
**WEB INTERIM CONFIGURATION ACTIVE. HOLD CSB/AI USE UNTIL RIGHTS ARE DOCUMENTED.**
The code sends retrieved Scripture text to OpenAI as study prompt context. The active Bible ID is WEB (`9879dbb7cfe39e4d-01`), not CSB. The operator has requested CSB licensing authorization; approval has not yet been reported. API.Bible Express Licensing FAQ says sending copyrighted text as LLM prompt context is prohibited under standard terms, distinct from training rules. Access to a CSB Bible ID or a successful FUMS report does not establish permission for this use.
- https://care.api.bible/article/405-express-licensing-faqs
- https://api.bible/terms-and-conditions
- https://docs.api.bible/resources/fair-use/
Required written answer from API.Bible and CSB rights holder: is runtime transmission of CSB text to OpenAI for inference permitted, on what terms, with what retention, verse/count, cache, display, and attribution limits?
If not, use a separately authorized runtime-LLM-permitted translation. Do not assert that all public domain Bibles are globally unencumbered; verify the selected source and territory.
Also confirm commercial/noncommercial classification based on the actual app and ministry use.

## Operating verification
From the deployed service Shell:
```sh
printenv APP_MODE
npm run smoke
npm run usage
```
Never print or store API secrets in diagnostics. `/api/health` proves process/mode, not upstream readiness. Inspect FUMS submissions in a real browser, copyright display, mobile iframe, rate limits, and Render logs.

## Exit criteria
- Standard WEB edition and its applicable public-domain terms documented; written CSB AI-processing authorization remains a separate gate before switching back.
- Authorized Scripture translation and AI processing approach documented.
- CI syntax and unit tests green; deterministic citation tests green.
- WEB live smoke passed after deployment; verify WEB attribution and follow-up in SnapPages before closing browser acceptance.
- Actual expense checked against provider dashboards; service spending controls reviewed.
- Human sample QA for Matthew 5, Romans 8, Hebrews 6 with direct text/inference/application separation.
