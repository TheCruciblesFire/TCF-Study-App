# TCF Study App — Release readiness, October 16, 2026

The existing service is available, but general-public release acceptance and Phase 9 lexical integration remain gated. This record distinguishes automated and public read-only checks from production operations that still need access or independent evidence.

## Merged changes

- [PR #67](https://github.com/TheCruciblesFire/TCF-Study-App/pull/67): persistent repository instructions and corrected Phase 9 status. Full GitHub App checks run #140 passed.
- [PR #68](https://github.com/TheCruciblesFire/TCF-Study-App/pull/68): offline preview bundling accepts Windows CRLF imports as well as LF. Full GitHub App checks run #142 passed. Both line-ending regression tests build the actual offline HTML and check its application script parses; the CRLF case failed before the fix.

## Local validation

Used the repository-pinned Node 24.19.0 from a temporary task directory, verified against the official release SHA-256 manifest. Installed locked dependencies with `npm ci --include=dev --no-audit --no-fund`; no package manifest or lockfile changed. The system Node installation remains unchanged.

| Check | Result | Scope |
|---|---|---|
| `npm run check` | Passed | JavaScript syntax |
| `npm test` | 127 passed, 0 failed after PR #68 | Unit, integration, contract, and LF/CRLF preview regression tests |
| `npm run test:browser` | Passed on the pre-fix baseline; also passed in PR #68 CI | Desktop/mobile, sources, follow-up, reset, dialog, text injection, cookie-free iframe |
| `npm run test:reporting` | Passed on the pre-fix baseline; also passed in PR #68 CI | Fixture-based reporting initialization, failure, reconnect, tokens, attribution |
| `npm run preview:test` | Passed after the CRLF fix | Actual offline bundle, mobile, sources, follow-up, reset, privacy, zero HTTP requests |

Generated HTML and screenshots remain ignored local outputs. Packaged ZIP previews were not rebuilt. No live smoke test or generated production study was run in this acceptance pass.

## Public deployment observations

Read-only requests established:

- `https://tcf-study-app.onrender.com/api/health` returned HTTP 200 with `status: ok` and `mode: live`.
- The landing page returned HTTP 200, contained exactly three study choices and the direct BLB `/search/search.cfm` gateway, and did not contain the retired standalone lookup UI.
- Deployed `app.js` matched the repository browser script after newline normalization. This checks that asset, not the full backend revision or Render deployment configuration.
- The response's framing policy permits `https://thecruciblesfire.org` and `https://www.thecruciblesfire.org`.
- The ministry homepage was available. Its `/study-tools` link returned 404; `/biblestudy` and `/blbstudy` returned 200, but their fetched HTML did not expose the assistant iframe. The exact SnapPages embed page and real browser behavior remain unverified.

No connected Render integration or usable browser session was available for authenticated service inspection. The deployed commit, actual persistent disk, secret configuration, logs, current costs, and successful automatic deployment of these merges have not been independently verified. Repository `render.yaml` describes intended settings; it is not proof of dashboard state.

## Scripture permission gate

An existing ministry-specific CSB app permission was located and examined outside this public repository. It does not explicitly address transmitting retrieved passages to a third-party LLM. Neither that document nor a successful API response is recorded here as approval of the runtime AI-processing arrangement. Keep private agreements and correspondence outside the public repository.

The [existing licensing hold](v1-deployment-acceptance.md#release-gating-scripture-licensing) remains. API.Bible's [Express Licensing FAQ](https://care.api.bible/article/405-express-licensing-faqs) distinguishes permitted public-domain runtime prompts from copyrighted prompt context. Obtain applicable written clarification from API.Bible and the rights holder, or select a specifically authorized runtime-LLM-permitted translation.

The clarification should identify the selected translation and source, permission to transmit passage text to OpenAI for inference, applicable retention and caching limits, visitor/commercial scope, verse and usage limits, and required display/attribution/reporting. No provider credentials or private contract text belong in a public PR.

## Phase 9A evidence prepared

Reused existing acquisition, audit, source-byte parsing, candidate collection, field inspection, and risk classification tools. No new validator or runtime lexical integration was added.

- Acquired all six source files at pinned STEPBible commit `bd09545c7a44b39ace20f16c0359915f2aa23a62`.
- Verified source hashes and structurally parsed the files using existing utilities. This does not establish semantic correctness.
- Produced the existing bounded candidate packet: 14 source rows, with original columns and file/row digests, explicitly unreviewed.
- Prepared additional source-reference candidates for `Jhn.15.4` (29 raw rows, 3 flagged by the existing classifier) and `Psa.23.1` (4 raw rows, 2 flagged). These are raw source labels, not independently verified occurrence mappings or an approved release subset.
- Sources and reports remain under gitignored `.local-stepbible/bd09545c7a44b39ace20f16c0359915f2aa23a62/`, outside the public web root. They are local preparation outputs, not committed release artifacts.

Every candidate remains unapproved. Independent witnesses, a qualified human reviewer, explicit edition/occurrence policies, approved lexical senses, documented exclusions, and all [Phase 9A hard exit criteria](phase9-consolidated-delivery-and-exit.md#hard-exit-criteria) are still required. No approvals were fabricated, and the administrative exit gate was not represented as independent review. Phase 9B packets and integrated Key Words cards remain unimplemented; original-language runtime support remains disabled.

## Remaining acceptance work

1. Resolve and retain the written Scripture/AI-processing permission evidence outside the public repository.
2. Connect Render and verify the actual deployed commit, disk, one-instance setup, configuration, logs, provider spending, and rollback path.
3. Once rights and service access are established, run authorized live passage, follow-up, different-passage, and question acceptance tests; verify attribution, FUMS reporting, limits, and provider costs. Health alone does not satisfy this step.
4. Identify the actual SnapPages page and verify desktop/mobile behavior of all three study choices in its iframe.
5. Have the bounded lexical candidates independently reviewed before completing 9A, then implement 9B and word cards in separately scoped changes.
