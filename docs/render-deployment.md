# Deploy the live TCF Study Assistant on Render

The repository includes a [Render Blueprint template](../render.yaml) for a new Docker web service with a 10 GB persistent disk. The connected production service is named `TCF-Study-App`; it is not known to be Blueprint-managed. The template name `tcf-study-assistant` is intentionally different. Do not deploy this template in the current workspace to document the existing service, because doing so may create a second paid service. See the [current release status](release-status-2026-10-16-web.md) for observed production settings.

[Deploy to Render](https://render.com/deploy?repo=https%3A%2F%2Fgithub.com%2FTheCruciblesFire%2FTCF-Study-App)

The observed service runs Docker on Render's `0.5c-512mb` plan in Ohio with one instance, a 10 GB disk mounted at `/var/data/tcf`, and `/api/health` as its health check. It deploys `main` after checks pass. The Blueprint models these visible settings for recovery or a separate installation; it does not read or replace the existing service's secrets, disk data, or Blueprint linkage. Review current Render pricing and the proposed resources before creating another service.

## Create the service

1. Sign in to the Render account that should own the ministry application.
2. For a **new installation only**, open the deployment link above, or choose **New → Blueprint** and select `TheCruciblesFire/TCF-Study-App`, branch `main`. To adopt Blueprint management for the existing `TCF-Study-App` service, first generate its Blueprint from the Render dashboard and review the proposed sync diff; do not create a duplicate.
3. If the repository is private, authorize Render's GitHub App for this repository. The Codex GitHub connection is separate from Render's connection.
4. Review the proposed Docker web service and 10 GB disk. During Blueprint creation, Render requests the two credentials marked `sync: false`:

| Name | Secure value to supply |
| --- | --- |
| `TCF_OPENAI_API_KEY` | A real OpenAI project API key with funded API billing and access to the selected model. |
| `TCF_BIBLE_API_KEY` | Your API.Bible key with access to the public-domain WEB edition used by this application. |

The template sets public `BIBLE_ID=9879dbb7cfe39e4d-01`. Confirm the API.Bible key can access that edition; live AI study rejects other IDs. Enter keys only in Render's secret/environment fields. Never put them in GitHub, SnapPages, a ZIP, or chat. Codex's network-proxy secret bindings are specific to Codex; do not copy a proxy placeholder into Render. A ChatGPT Business subscription does not supply OpenAI API credits. Check the API project/organization that owns the key, independently of the ChatGPT workspace used to develop the app.

5. Create the Blueprint only after checking its name and cost. Render builds the repository `Dockerfile`, which installs production dependencies and runs `npm start`.
6. Use the actual HTTPS URL shown by Render after deployment. The app automatically derives its public origin from `RENDER_EXTERNAL_URL`; no guessed hostname is hardcoded.

The `Dockerfile` pins Node 24.19.0. The template sets `APP_MODE=live`, WEB `BIBLE_ID`, `/var/data/tcf` for the persistent database/key, and estimated OpenAI limits of USD 2/day, USD 20/month and USD 0.03/turn. These exclude hosting and Bible API charges. `TRUST_PROXY_HOPS=1` is a template assumption about the nearest trusted proxy; its production value is not exposed by the connected Render tool. Revisit it if adding another proxy/CDN.

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

The connected service and merged WEB release are described in the [current release status](release-status-2026-10-16-web.md). Render's live deploy status does not independently prove provider calls, FUMS submissions, or visitor browser acceptance. The operator reported that the live acceptance item passes. Preserve the last healthy deploy and persistent disk when rolling back; review the deployed code's expected Bible ID before selecting an older commit.
