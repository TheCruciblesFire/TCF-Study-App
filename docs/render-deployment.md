# Deploy the live TCF Study Assistant on Render

The repository includes a [Render Blueprint](../render.yaml) for one Node web service with a 1 GB persistent disk. It runs live mode, keeps credentials on the server, and preserves conversation/rate-limit/cost records across restarts.

[Deploy to Render](https://render.com/deploy?repo=https%3A%2F%2Fgithub.com%2FTheCruciblesFire%2FTCF-Study-App)

This configuration uses Render's **paid Starter service and persistent storage**. Review current Render pricing and the proposed resources before creating the service. This repository does not create a paid service automatically.

## Create the service

1. Sign in to the Render account that should own the ministry application.
2. Open the deployment link above, or choose **New → Blueprint** and select `TheCruciblesFire/TCF-Study-App`, branch `main`.
3. If the repository is private, authorize Render's GitHub App for this repository. The Codex GitHub connection is separate from Render's connection.
4. Review the one web service and 1 GB disk. During Blueprint creation, Render requests the three values marked `sync: false`:

| Name | Secure value to supply |
| --- | --- |
| `TCF_OPENAI_API_KEY` | A real OpenAI project API key with funded API billing and access to the selected model. |
| `TCF_BIBLE_API_KEY` | Your API.Bible key with access to the selected WEB edition. |
| `BIBLE_ID` | Current interim edition: `9879dbb7cfe39e4d-01` (World English Bible, WEB). Do not restore CSB without explicit AI-processing authorization. |

Enter keys only in Render's secret/environment fields. Never put them in GitHub, SnapPages, a ZIP, or chat. Codex's network-proxy secret bindings are specific to Codex; do not copy a proxy placeholder into Render. A ChatGPT Business subscription does not supply OpenAI API credits. Check the API project/organization that owns the key, independently of the ChatGPT workspace used to develop the app.

5. Create the Blueprint. Render installs production dependencies and runs `npm start`.
6. Use the actual HTTPS URL shown by Render after deployment. The app automatically derives its public origin from `RENDER_EXTERNAL_URL`; no guessed hostname is hardcoded.

The Blueprint pins Node 24.19.0, sets `APP_MODE=live`, uses `/var/data/tcf` for the persistent database/key, and sets estimated OpenAI limits of USD 2/day, USD 20/month and USD 0.03/turn. These exclude hosting and Bible API charges. `TRUST_PROXY_HOPS=1` assumes Render's reverse proxy is the nearest trusted hop; revisit it if adding another proxy/CDN.

## Verified production configuration (2026-10-15)

- Live service: `https://tcf-study-app.onrender.com/`, embedded via SnapPages (operator confirmed functionality before the WEB switch).
- `APP_MODE=live`; `BIBLE_ID=9879dbb7cfe39e4d-01` (standard WEB); `DATA_DIR=/var/data/tcf`.
- An actual Render persistent disk is mounted at `/var/data/tcf`. An earlier service had `DATA_DIR=/app/.data` and no disk; this was corrected manually in Render Environment. **Verify the actual environment settings; a value in `render.yaml` alone does not prove the running service uses it.**
- `npm run smoke` passed after switching WEB. `npm run usage` displayed one completed study and the same row survived a subsequent service restart while using the persistent disk.
- CSB licensing for LLM prompt processing was requested and remains unapproved. WEB is the interim public-domain Scripture source; retain the correct WEB translation label and provider attribution.
- Before declaring the WEB transition fully browser-verified, inspect the WEB source card and complete a follow-up on the published SnapPages embed.

## Verify the service

`/api/health` reports process health and mode. It does not prove external generation works. Check the service logs, then use Render's Shell to run:

```sh
npm run smoke
npm run usage
```

The smoke test makes a real, metered John 15 passage study and clears its test conversation. A failed smoke test must be investigated before treating the app as live. The usage command reports aggregate token estimates without exposing conversation text or keys.

In the deployed browser, verify:

- John 15:1–8 produces a WEB study and displays the retrieved text, attribution, source links, and explanation/application separately.
- A follow-up such as “How can I apply this today?” stays with the same passage.
- A different passage and a basic biblical question work.
- API.Bible's script loads from `https://pkg.api.bible/fumsV3.min.js`, and Scripture usage requests reach `https://fums.api.bible/f3` successfully. These contain opaque usage tokens; do not paste the URLs into chat or issue logs.
- The interface visibly credits API.Bible. Provider copyright and information text accompany each source.

The reporting client uses browser local/session storage for anonymous device/session identifiers. Blocking its script or storage prevents live chat from initializing; the app offers a reconnect action. No visitor account is required.

## If generation fails

| App code | Next action |
| --- | --- |
| `AI_BILLING_REQUIRED` | OpenAI rejected the request for insufficient API quota/credits. Fund the key's API account/project or replace it with an appropriately funded project key. Retry after billing is active. |
| `PROVIDER_LIMIT` | The upstream provider is rate limiting requests. Check its account limits and retry later. |
| `PROVIDER_ERROR` | Inspect the server's sanitized provider status/code. Verify key access, model and translation ID; do not log provider response bodies or credentials. |
| `BUDGET_LIMIT` | The app's configured estimated daily/monthly budget is reached. Inspect aggregate usage and intentionally adjust settings if appropriate. |
| Reporting initialization failure | Allow the documented first-party script, its reporting destination and browser storage. Do not disable TLS verification or remove source-reporting requirements. |

Known HTTP rejections do not settle as generated token usage. Network/server failures with unknown outcomes retain a conservative estimate. Pending reservations also survive process restarts.

## Embed in SnapPages

After browser and API checks pass, replace the example address below with Render's actual service URL and add this to a SnapPages HTML/code block:

```html
<iframe
  src="https://YOUR-ACTUAL-SERVICE.onrender.com/"
  title="The Crucible’s Fire Bible Study Assistant"
  width="100%"
  height="900"
  style="border:0; border-radius:8px; display:block; margin:0 auto; max-width:1200px;"
  loading="lazy"
  referrerpolicy="no-referrer"
></iframe>
```

The default `EMBED_ORIGINS` permits the user-supplied ministry domain and its `www` variant. Add the exact origin of any SnapPages editor/preview domain only if needed; do not replace the allowlist with a wildcard. On a custom application domain, set `PUBLIC_ORIGIN` to its exact HTTPS origin after configuring DNS/TLS. Leave it unset when using only Render's generated URL.

The hosted app and a ZIP preview serve different purposes. The ZIP is a deliberately offline, prepared demonstration. Real API keys belong in the hosted backend, never in the ZIP or the SnapPages parent page.

## Updates and ownership

GitHub Actions checks run without live credentials or paid calls. Render's `checksPass` setting permits subsequent automatic deploys after those checks pass. Keep one replica because active conversation locks are process-local. Persistent disks require the current instance to stop during deployment, so brief downtime is possible. The shutdown window allows in-flight requests to finish before termination.

Render's dashboard validates and creates the Blueprint. The service is now live, has passed operator-run smoke tests, and has been embedded in SnapPages. This guide distinguishes those operator-confirmed results from unverified browser checks. The Blueprint and instructions were checked against Render deployment documentation.
