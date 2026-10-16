# TCF Bible Study Assistant

A Scripture-centered, embeddable study companion for The Crucible’s Fire. The first workflow covers a passage or basic biblical question, retrieved Scripture, structured study, and follow-up conversation. No visitor account is required.

**Current status:** the live request path and Render deployment configuration are implemented. Real CSB retrieval and the current Scripture reporting client have been checked; full generated-study acceptance remains required once OpenAI API billing is active. Automated tests use fixtures, and ZIP previews remain prepared examples rather than live AI responses.

## Deploy the API version

[Deploy to Render](https://render.com/deploy?repo=https%3A%2F%2Fgithub.com%2FTheCruciblesFire%2FTCF-Study-App)

See the [Render deployment guide](docs/render-deployment.md) for the paid service/disk configuration, secure credentials, API billing, readiness checks and SnapPages embedding. Keys must be entered securely in the host; they are not included in this repository or the preview packages.

## Download the packaged preview

The [downloads folder](downloads/README.md) contains two ready-to-download ZIPs:

- [Branded study preview](downloads/TCF-Branded-Study-Preview.zip): extract the ZIP and open `index.html` in a browser. Styling, fonts, artwork and three interactive sample studies are embedded; no server or keys are needed.
- [HTML testing folder pack](downloads/TCF-HTML-Testing-Folder-Pack.zip): the preview plus organized folders for releases, extracted HTML, brand assets, screenshots, test notes and archives.

On GitHub, open a ZIP file and choose **Download raw file**. The ZIPs can then be uploaded to Google Drive. Drive stores the packages; testing the interactive HTML requires opening the downloaded file in a browser.

## Run locally

Use Node **24.19.0** (Node 24.5+ is required for built-in SQLite and proxy support).

```sh
npm ci
npm start
```

The server listens on port 3000. `npm run dev` restarts the backend on edits. Browser assets are served directly; there is no frontend compilation step. Demo mode supports John 15:1–8, Psalm 23, and “What is grace?”, plus simple follow-ups to the selected example. It makes no external provider calls. It does not attempt to answer arbitrary questions.

With the server running, `npm run smoke` verifies the complete passage-study request and clears that test conversation. In live mode this makes real, metered provider calls.

For a file preview without a running server, run `npm run preview:build` and open `preview/tcf-study-demo.html`. This bundles the styling, images, UI, and three curated examples into one offline HTML file. It makes no provider calls and requires no credentials. Opening `public/index.html` directly does not provide the server’s asset routes or API. A private ChatGPT local-preview address cannot be inspected from this workspace; the standalone file can also be downloaded and opened in a browser if that renderer blocks scripts.

```sh
npm run check
npm test
# Use an installed Chromium, or install Playwright's browser once:
npx playwright install chromium
npm run test:browser
# On this cloud machine, Chromium is already available:
CHROMIUM_PATH=/usr/bin/chromium npm run test:browser
```

The browser smoke test exercises desktop and mobile layouts, source expansion, follow-ups, reset, privacy dialog, text injection handling, and a third-party iframe with no cookies. Screenshots are written to ignored `test-results/`. Unit/integration tests use a temporary database; the live-provider contract test uses fake HTTP responses, not real credentials.

## Enable live mode

Copy `.env.example` to `.env` locally, or use your host’s secret manager. Never commit keys. The app deliberately uses `TCF_` credential names so cloud proxy secret bindings can supply them.

| Setting | Purpose |
| --- | --- |
| `APP_MODE=live` | Enables OpenAI and API.Bible; fails startup if credentials or Bible ID are absent. |
| `TCF_OPENAI_API_KEY` | Server-only OpenAI project key for `api.openai.com`. |
| `TCF_BIBLE_API_KEY` | Server-only API.Bible key for `rest.api.bible`. |
| `BIBLE_ID` | Translation ID authorized by your API.Bible account for this public web application. Find it through the authenticated `/v1/bibles` endpoint/account. |
| `PUBLIC_ORIGIN` | Exact public HTTPS origin of this application, e.g. `https://study.your-domain.org`; no trailing slash. Browser requests originate in the iframe, not on the SnapPages parent. |
| `EMBED_ORIGINS` | Space-separated exact HTTPS origins of the SnapPages website allowed to frame it. Use your actual domains. Defaults are examples, not verified TCF domain ownership. |
| `DATA_DIR` | Persistent writable directory for SQLite and the visitor-hashing key; defaults to `.data`. |
| `TRUST_PROXY_HOPS` | Defaults to `0`. Change only to match your host’s exact trusted proxy topology; do not trust arbitrary forwarded IPs. |

The model defaults to `gpt-4.1-mini` with structured JSON output. `OPENAI_MODEL` must support Chat Completions, `max_completion_tokens`, and strict `json_schema`. Model pricing is separately configurable; confirm current provider prices when choosing a model. Do not select a more expensive model without updating both price settings.

API.Bible text comes from `https://rest.api.bible/v1`. Content requests include their required usage-reporting tokens. The browser loads the current first-party client from `https://pkg.api.bible/fumsV3.min.js` and calls `fums('trackView', tokens)` for displayed study sources. Reports go to `https://fums.api.bible/f3`. The app blocks live chat if that client fails to initialize and rejects content without its usage token. No scripts returned in Bible content are executed. The [verification notes](docs/live-verification.md) distinguish real reporting checks from fixture-based tests and generated-study checks that remain pending.

**Translation permission is a launch prerequisite.** The KV upstream prefers CSB, but this app uses only the explicitly configured authorized translation. It does not assume API access grants CSB/public-web or AI-processing rights. Confirm your API.Bible plan permits this public chatbot, transmission of passage text to OpenAI, applicable verse/usage limits, and required attribution/reporting. If TCF has ministry-specific Holman/CSB permission, check its exact conditions and required wording before using CSB. The app displays the provider’s translation abbreviation, copyright, and information text with each source. It does not invent permission wording. Demo fixtures use KJV with a US public-domain notice; review territorial rights before public distribution.

Backend egress: `api.openai.com` and `rest.api.bible`. Visitor browsers also need `pkg.api.bible` and `fums.api.bible` in live mode. The reporting client uses local/session storage for device/session identifiers; conversation tokens remain in memory. Blue Letter Bible links explicitly open the KJV; this does not change the app’s configured translation. Linked resources are not represented as research sources consulted by the AI. On Render, the app uses `RENDER_EXTERNAL_URL` automatically if no explicit `PUBLIC_ORIGIN` is supplied.

## Workflow and source controls

1. A bounded router identifies a passage study, basic biblical question, or unsupported request. It resolves follow-ups using up to six recent exchanges.
2. The backend parses canonical Bible references, fetches the main passage and up to two supporting passages, and verifies IDs, translation, content, attribution, and usage metadata. Whole chapters use the chapter endpoint; same-chapter ranges use the passage endpoint. Each source is limited to 60 verses.
3. OpenAI receives only the retrieved passages and the self-contained question. The [KV adaptation](docs/kv-methodology.md) separates observation, interpretation, theological conclusions, warranted canonical connections, and application.
4. The backend validates structured output, requires source IDs on study claims, rejects unknown citations, checks named passage references against the retrieved coverage, and rejects generated web URLs. Bible text, attribution and source links come from code/provider data, never from model-generated HTML.
5. The UI renders all question and answer text as text. Source buttons open the actual retrieved passages. New study clears server-side conversation history.

These controls establish provenance and reference coverage, **not automated theological correctness**. An AI may still misinterpret a real passage or cite one weakly. The interface asks readers to verify the text. Pastoral review of representative live outputs remains necessary.

Unsupported in V1: full topical surveys, deep dives, Strong’s/lexical analysis, comprehensive commentary search, accounts, saved libraries, PDFs, subscriptions, and multi-agent research. `route`, `bible`, and `study` are separate provider interfaces so future research modes can be added without replacing the chat or cost controls.

## Cost and abuse controls

Default limits: 8 requests/minute and 40/day per IP and session, 6 concurrent studies per process, 1,500 characters/message, estimated USD 0.03/turn, USD 2/day and USD 20/month. Bootstrap and reset requests also consume the IP rate allowance. Limits apply to demo mode too; demo makes no billable calls.

Before any live routing call, a SQLite transaction reserves the maximum turn estimate against both daily and monthly budgets (UTC). Each model call must fit a conservative UTF-8-byte input estimate and output-token bound within that reservation. Confirmed token usage settles the estimate; unknown outcomes retain the conservative call allowance. Interrupted requests retain their full reservation across restarts. This favors rejecting a request over silently overspending.

These are limits on **configured estimated OpenAI token cost**, not a guarantee about the provider’s invoice. They exclude Bible API plan charges, hosting, taxes and price changes. Set appropriate project-level billing/usage controls in the provider accounts too. Inspect aggregate usage locally:

```sh
npm run usage
```

Usage reporting is intentionally a local CLI, not an unauthenticated admin endpoint. SQLite records model, request status, token totals and estimated cost. No prompt or answer appears in cost logs. Provider error bodies and secrets are never logged. A 24-hour conversation window is stored separately in SQLite; expired conversations and old rate-limit buckets are removed lazily on subsequent requests. The API uses high-entropy in-memory browser session tokens, not cookies or local storage, so it works inside iframes with third-party cookies blocked. Reloading begins a fresh conversation; the old one expires. Rate-limiting IP addresses are stored as keyed hashes, not raw IPs.

## Host and embed

Run **one Node process/replica** behind HTTPS with persistent storage mounted at `DATA_DIR`. Multi-process budget reservations can share SQLite on the same local disk, but per-session in-flight locks are process-local; multi-replica deployment requires shared locking/rate/conversation storage first. Do not deploy this SQLite service as ephemeral serverless functions.

Set environment variables/secrets on the host and run `npm ci --omit=dev` followed by `npm start`. `/api/health` returns process health and mode, not a guarantee that external credentials work. The [Dockerfile](Dockerfile) provides an alternative container entry point; it has not been built as part of this cloud setup. Back up and protect the data directory; it contains visitor conversations. Set access controls on host logs and backups. A reverse proxy/CDN should enforce request size, connection and broader bot/DDoS limits. Application IP limits are a baseline, not complete distributed-abuse protection.

In a SnapPages HTML/code block, use this markup after replacing the example app domain:

```html
<iframe
  src="https://YOUR-DEPLOYED-APP-DOMAIN/"
  title="The Crucible’s Fire Bible Study Assistant"
  width="100%"
  height="900"
  style="border:0; border-radius:12px; max-width:1200px; display:block; margin:0 auto;"
  loading="lazy"
  referrerpolicy="no-referrer"
></iframe>
```

Add the exact parent website origin to `EMBED_ORIGINS`. The app’s CSP frame allowlist prevents unauthorized framing. Keep `PUBLIC_ORIGIN` equal to the **app’s** origin. No API key belongs in SnapPages. Test the actual SnapPages page on desktop and mobile; this task tests iframe behavior in a browser but does not publish or edit the website.

The API also accepts browser-confirmed same-origin requests through an HTTPS reverse proxy, so an alternate app address can submit chat without relying on untrusted host/forwarded headers. Browsers lacking Fetch Metadata and command-line clients must use the configured `PUBLIC_ORIGIN`. Cross-site and same-site cross-origin browser requests remain blocked; no cross-origin API access is enabled. The browser regression test covers an HTTPS app origin that differs from the backend’s configured local origin.

## Live acceptance before public launch

After supplying credentials and publishing/hosting configuration, run an actual John 15:1–8 study, a different passage, a basic biblical question, and a pronoun-only follow-up. Check the selected passage/translation, context, every citation, copyright and translation information, FUMS network reporting, aggregate token usage and estimated price, error handling, and actual SnapPages framing. Verify that your OpenAI and Bible plan allow the intended use. Live-provider receipt and public deployment are not established by the fake-provider tests.

## Phase 9 status and remaining work

The three-mode selector is implemented: **Ask & Explore**, **Guided Study**, and **Deep Dive with Blue Letter Bible**. The BLB mode is a branded external search gateway, and the standalone lexical lookup UI has been removed. Integrated verified Greek/Hebrew Key Words and original-language material in initial studies remain unfinished; Phase 9A has not met its release criteria, and original-language runtime support remains disabled. See the [Phase 9 roadmap](docs/phase9-roadmap.md) and [consolidated delivery plan and exit criteria](docs/phase9-consolidated-delivery-and-exit.md). The limited MCP discovery remains deferred and disabled by default.
