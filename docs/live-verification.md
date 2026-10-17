# Live integration verification

Checks performed on October 15, 2026. No keys, usage tokens, provider response bodies or visitor conversations are included in this report.

This is a historical verification record. See the [October 16 release-readiness record](release-readiness-2026-10-16.md) for subsequent availability checks and the [current release status](release-status-2026-10-16-web.md) for the deployed WEB flow and operator-reported acceptance.

| Check | Outcome | Practical limit |
| --- | --- | --- |
| OpenAI model access | The configured project key can read the `gpt-4.1-mini` model endpoint (HTTP 200). | Model access alone does not establish generation or billing readiness. |
| Bible metadata | CSB metadata, attribution and information are available (HTTP 200). | Account access is not a substitute for the ministry's applicable license conditions. |
| Controlling passage | Real John 15:1–8 retrieved as CSB, eight verses, with expected passage/translation IDs and a FUMS token. | Scripture retrieval is separate from AI study generation. |
| Supporting Scripture | Three real sources were fetched and displayed in a browser reporting test. | Study prose for this reporting test was explicitly prepared fixture text, not AI output. |
| FUMS client | Current documented `pkg.api.bible/fumsV3.min.js` returns HTTP 200 and initializes the documented `fums` function. | The initial prototype's guessed legacy script path returned 404 and has been replaced. |
| FUMS submission | Real `/f3` reporting returned HTTP 200 for all three real source tokens. | This confirms HTTP acceptance, not the provider's internal analytics/dashboard processing. |
| AI generation | **Blocked:** OpenAI rejected generation with an API billing/quota response. | A complete generated study, natural follow-up and new-passage acceptance test remain pending after the intended API project has active billing. |
| Render hosting | Blueprint and setup instructions prepared. | No Render account connection, paid service creation, live public URL, or SnapPages publication has been completed from this session. |

## Browser transport used for the real reporting check

The cloud machine's supplied proxy CA is trusted by Node but not by this instance of managed Chromium. Direct Chromium access to the reporting script failed certificate validation. For the reporting acceptance test only, requests to the two exact public hosts `pkg.api.bible` and `fums.api.bible` were fetched by Node with TLS verification and the supplied CA, then delivered to the browser via its test routing interface. Certificate verification was never disabled. This transport is not part of the production app. Normal visitors must be able to load the HTTPS provider resources directly.

## Automated checks

The backend tests verify provider request structure, response/citation validation, translation IDs, missing reporting metadata, origin/session protection, spending reservations, restart persistence, proxy origin handling, and safe errors for an exhausted-credit response. Confirmed HTTP rejections are not charged as generated token usage; unknown network failures retain their allowance.

`npm run test:reporting` uses fixture providers and a fixture reporting script to verify current CSP/script integration, failed initialization, reconnect behavior, source-token submission and visible API.Bible attribution. It makes no paid calls. The desktop/mobile/iframe and offline-preview suites remain separate checks.

## Required completion after billing and deployment

Use a key belonging to the intended business API project with active API billing. A ChatGPT Business workspace/subscription does not itself fund API usage. Start live mode, run `npm run smoke`, and verify an actual generated passage study, a pronoun-only follow-up, a different passage and a basic biblical question. Check source support and attribution in the deployed browser, confirm live usage totals, then verify the actual SnapPages embed. Until these pass, call the deployment prepared or under test, rather than operational for visitors.
