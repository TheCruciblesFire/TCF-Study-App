# TCF Study App — Cost controls and operating review
Reviewed 2026-10-15. This is a historical configuration/pricing analysis, not access to real provider invoices or balances. The connected service now has a 10 GB disk and runs Docker; the 1 GB hosting estimate below does not represent its current invoice. See the [current release status](release-status-2026-10-16-web.md).

## Current configuration
`OPENAI_MODEL=gpt-4.1-mini`; `INPUT_USD_PER_MILLION=0.40`, `OUTPUT_USD_PER_MILLION=1.60`.
`MAX_TURN_USD=0.03`, `DAILY_BUDGET_USD=2`, `MONTHLY_BUDGET_USD=20`.
`REQUESTS_PER_MINUTE=8`, `REQUESTS_PER_DAY=40` per IP/session. A citation retry makes a second model call if the first output fails validation; it remains bounded by the per-turn estimate and can generate a `TURN_TOO_LARGE` response.
Provider pricing: https://developers.openai.com/api/docs/models/gpt-4.1-mini
Render pricing: https://render.com/pricing

## Illustrative estimate
If one answer uses 3,000 input tokens and 1,500 output tokens, estimated model cost is `(3000*0.40 + 1500*1.60)/1,000,000 = $0.0036`, before router calls and retries.
At the configured monthly $20 model allowance, plus roughly $7/mo for a Starter-equivalent Render service and $0.25/mo for a 1 GB persistent disk, provisional maximum budget allocation is about $27.25/mo before API.Bible licensing/usage, bandwidth, other services and tax. These application budgets are not provider-side hard caps, and configured cost settlement does not necessarily equal invoice charges.

## To establish actual spend
1. Run `npm run usage` in Render Shell; save non-sensitive aggregate totals (requests, tokens, estimated USD, failures).
2. Compare those totals with the OpenAI project Usage and Costs dashboards for the same dates and model.
3. Review Render Billing for compute, disk and transfer.
4. Review API.Bible plan and any per-translation license fees, including unique monthly user tiers.
5. Check whether citation retries increase input/output tokens and failure counts.
6. Reconfirm provider model prices before changes, and update environment cost factors together with model changes.
7. Keep provider-side project budgets/alerts and cloud infrastructure budgets in addition to app limits.

## Release caution
Do not increase paid traffic before documenting the right to send the chosen Scripture translation into LLM prompts. The current `gpt-4.1-mini` price listing labels the model as deprecated; plan model migration only after verifying structured-output compatibility and updating cost/test baselines.
