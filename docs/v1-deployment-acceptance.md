# TCF Study App — V1 deployment and acceptance record
Date: 2026-10-15. Evidence: operator-reported live tests and repository configuration; not an independent production penetration test or full theological audit.

For the subsequent independent read-only availability checks and automated release validation, see the [October 16 release-readiness record](release-readiness-2026-10-16.md). The historical observations below do not replace its outstanding release gates.

## Running system
- Repository: https://github.com/TheCruciblesFire/TCF-Study-App
- Live URL: https://tcf-study-app.onrender.com/
- Host: Render single Node.js web service; SQLite persistent disk at `/var/data/tcf`.
- Website: embedded in SnapPages at thecruciblesfire.org (specific page URL has not been independently confirmed).
- Configuration: `APP_MODE=live`; `TCF_OPENAI_API_KEY`, `TCF_BIBLE_API_KEY`, `BIBLE_ID` are server-side secrets. Do not paste secrets into documentation.
- Model: `gpt-4.1-mini` unless overridden in production.
- API.Bible/FUMS: licensed translation metadata and passage requests; browser reporting with FUMS token.
- Readiness: operator saw `Readiness passed: live passage study, source text, citations, and reset`. User confirmed follow-up and SnapPages integration functional.
- Limitations: smoke test covers a single passage and limited citation IDs; public browser behavior and full theological correctness were not independently audited.

## Known regressions (October 15)
1. Initial follow-up failed with `INVALID_CITATION` when generated text named a passage outside retrieved ranges.
2. First mitigation constrained generated references; second added bounded retry against same sources.
3. Production `citationDiagnostic` showed unmatched chapter labels `Romans 8` and `Hebrews 6` with available passages `Hebrews 6:4-8`, `John 10:27-29`, `Romans 8:38-39`.
4. Validator now allows a bare chapter *label* when an excerpt from that chapter was retrieved. This does NOT authorize claims about unprovided verses.
5. Operator confirmed the subsequent follow-up passed. This is a targeted success, not universal guarantee.

## Release gating: Scripture licensing
**HOLD ON GENERAL-PUBLIC CSB/AI USE UNTIL RIGHTS ARE DOCUMENTED.**
The code currently sends retrieved Scripture text to OpenAI as study prompt context. API.Bible Express Licensing FAQ says sending copyrighted text as LLM prompt context is prohibited under standard terms, distinct from training rules. Access to a CSB Bible ID or a successful FUMS report does not establish permission for this use.
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
- Written applicable license terms filed securely outside the public repository.
- Authorized Scripture translation and AI processing approach documented.
- CI syntax and unit tests green; deterministic citation tests green.
- Live smoke and conversational regression passed after deployment; source/translation attribution verified.
- Actual expense checked against provider dashboards; service spending controls reviewed.
- Human sample QA for Matthew 5, Romans 8, Hebrews 6 with direct text/inference/application separation.
