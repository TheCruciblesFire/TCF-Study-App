# Current release and Phase 9 handoff — October 16, 2026

This record updates the [October 16 release-readiness baseline](release-readiness-2026-10-16.md) after PRs [#71](https://github.com/TheCruciblesFire/TCF-Study-App/pull/71) and [#72](https://github.com/TheCruciblesFire/TCF-Study-App/pull/72). Earlier dated reports remain historical evidence; their statements about the then-current CSB flow, Render access, and unknown SnapPages URL are superseded here.

## Verified deployment state

- GitHub main commit `84a7508c92950d8f3c8a557d882d20b4fbdf1e0f` (PR #72) passed [App checks run #158](https://github.com/TheCruciblesFire/TCF-Study-App/actions/runs/38986125067): syntax, unit/integration, browser, reporting, and offline preview.
- Connected Render service `TCF-Study-App` (`srv-db8f2rqj9qps73cmeik0`) reported deploy `dep-db9c07942hec73cit9e0` of that commit **live**. Its application log showed startup in live mode. No post-deploy warning/error log was returned in the inspected interval.
- Render reports Docker from `./Dockerfile`, one `0.5c-512mb` instance in Ohio, a 10 GB persistent disk at `/var/data/tcf`, `main` with `checksPass` auto-deploy, and health-check path `/api/health`. `DATA_DIR=/var/data/tcf` was confirmed by the operator.
- Render accepted the `BIBLE_ID=9879dbb7cfe39e4d-01` update and deployed it before PR #72. The connected tools do not expose other secret environment values. A live Render status and health check establish startup, not provider-level answer quality.
- The public service is `https://tcf-study-app.onrender.com/`; the operator identified the SnapPages study page as `https://thecruciblesfire.org/study`.

## Live acceptance and Scripture boundary

On October 16 the operator confirmed that the previously listed **live acceptance item passes**. This is operator-reported acceptance of the WEB study and embedded experience; this repository does not contain per-passage transcripts, provider invoices, browser network captures, or a separately run metered smoke test. Keep private visitor content, credentials, and contract correspondence out of the repository.

The live app displays API.Bible's [World English Bible (WEB), Bible ID `9879dbb7cfe39e4d-01`](https://demo.api.bible/bibles/9879dbb7cfe39e4d-01). API.Bible lists this edition as public domain and its [Express Licensing FAQ](https://care.api.bible/article/405-express-licensing-faqs) permits public-domain text in runtime LLM prompts. PR #72 requires the exact Bible ID and verified WEB/public-domain metadata before sending retrieved Scripture to OpenAI. The user-provided API.Bible reply did **not** authorize sending API.Bible-served CSB text to an outside model or reproducing it in downloadable packets. Preserve API.Bible attribution and FUMS usage reporting. The app's study-note export still omits full Bible text.

The original CSB correspondence and publisher permission remain private. Any future return to CSB text in AI prompts or downloadable packets needs its own documented source and terms review.

## Configuration and recovery

The earlier `render.yaml` and deployment guide described a Node runtime and 1 GB disk; they did not match the connected service. The Blueprint in this repository is now a **new-service template** reflecting Docker, the current compute class, Ohio region, 10 GB disk, and WEB ID. Its service name remains `tcf-study-assistant` and it is not evidence that the existing `TCF-Study-App` service is Blueprint-managed. Do not deploy the template in the current workspace merely to document the running service; that could create another paid service. To adopt Blueprint management for the existing service, first generate/review its configuration in Render and confirm linkage and the proposed sync diff.

For rollback, identify the last healthy deploy in Render and inspect database compatibility and the current `BIBLE_ID` before redeploying an older commit. A pre-WEB code revision may expect CSB or reference-only behavior. Keep the persistent disk attached; do not replace secrets or data as part of a code rollback without a separate reason.

## Next roadmap gate

Phase 9A remains incomplete. The local candidate packet described in [the machine handoff](machine-handoff.md) contains unreviewed Greek `Jhn.15.4` and Hebrew `Psa.23.1` source rows. Recreate the pinned raw-source evidence if needed, secure a qualified independent reviewer and verse/edition witnesses, document exclusions, then satisfy every [hard exit criterion](phase9-consolidated-delivery-and-exit.md#hard-exit-criteria). The administrative script checks supplied approvals mechanically; it cannot establish textual accuracy or reviewer independence. Do not enable Phase 9B packets or Key Words cards before this gate passes.
