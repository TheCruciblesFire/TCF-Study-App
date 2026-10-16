# Resume work on another machine

Handoff recorded October 16, 2026. Code baseline: `6f2f67c6c06aa2c9c0b3faef8b19188d64b68de6` (merged PR #69). Fetch current `main` before starting: this is a dated checkpoint, not a promise that the repository or deployed service is unchanged.

## Start here

Read these files in order:

1. [Repository instructions](../AGENTS.md).
2. [Release-readiness evidence and remaining gates](release-readiness-2026-10-16.md).
3. [Phase 9 roadmap](phase9-roadmap.md).
4. [Consolidated plan and Phase 9A hard exit criteria](phase9-consolidated-delivery-and-exit.md).

The next work is release acceptance and obtaining missing access/review evidence. Do not restart the architecture, add another generic Phase 9A validator, or assume lexical integration is ready.

## What is already on GitHub

| PR | Completed work |
|---|---|
| [#67](https://github.com/TheCruciblesFire/TCF-Study-App/pull/67) | Root `AGENTS.md`, Phase 9 status corrections, and clarification that PR #63–65 fixed BLB navigation rather than completing lexical milestones. |
| [#68](https://github.com/TheCruciblesFire/TCF-Study-App/pull/68) | Windows CRLF offline-preview bundling fix and LF/CRLF regression tests. |
| [#69](https://github.com/TheCruciblesFire/TCF-Study-App/pull/69) | Release-readiness record, corrected architecture map, and links from older acceptance records. |

All three PRs are merged and passed full GitHub App checks. The baseline had 127 passing tests; syntax, browser, reporting, and offline-preview checks passed. The earlier missing-dependency failures and Windows preview defect were resolved. No uncommitted application work needs transferring from the old machine.

The three study choices and BLB gateway are implemented; standalone lexical lookup UI is removed. Backend lexical lookup routes remain. Phase 9A is incomplete, Phase 9B packets and integrated Key Words cards are absent, and original-language runtime support is disabled.

## Set up a fresh checkout

Install the repository-pinned Node **24.19.0** and Git through your normal trusted setup. The old machine used temporary Node/Chromium downloads; its system Node was still 22.18.0. Those temporary paths and tools will not follow a Git clone.

```sh
git clone https://github.com/TheCruciblesFire/TCF-Study-App.git
cd TCF-Study-App
git fetch origin main
git status --short --branch
node --version
npm ci --include=dev
npm run check
npm test
npx playwright install chromium
npm run test:browser
npm run test:reporting
npm run preview:test
```

On Windows, if PowerShell blocks `npm.ps1` or `npx.ps1`, use `npm.cmd` and `npx.cmd`; no execution-policy change is needed. Linux CI installs Chromium with `npx playwright install --with-deps chromium`.

For implementation, create a narrowly scoped branch from refreshed `origin/main`, for example `git switch -c docs/next-release-check origin/main`. Inspect an existing checkout for local changes before switching branches. Never implement directly on `main`.

Demo mode works without credentials. `npm start` defaults to demo when no live configuration is supplied. Do not copy production credentials into repository files or chat. Existing production secrets and SQLite data belong to the Render service, not the old development machine. Reconnect GitHub, Render, and Google Drive as needed; connection availability must be verified in the new session.

## Pick up the unfinished work

| Gate | Last known state | Next action |
|---|---|---|
| Render service | Public health and landing page returned HTTP 200; health reported live mode. Dashboard access was unavailable. | Connect Render; verify deployed commit, persistent disk, one instance, environment configuration, logs, spending, and rollback. Repository YAML is intended configuration, not proof of dashboard state. |
| Scripture/AI processing | A ministry-specific CSB app grant was located in private Drive records. It did not explicitly address third-party LLM prompt processing. | Obtain applicable written clarification from API.Bible and the rights holder, or agree on an expressly permitted alternative translation. Keep agreements outside the public repo. |
| Live generation acceptance | Previous operator success is documented, but no live study or metered smoke call was made during this release-readiness pass. | After rights/access are established and live calls are authorized, verify passage study, follow-up, different passage, basic question, citations, attribution/FUMS, limits, and real costs. |
| SnapPages embed | Exact assistant embed page was not located. `/study-tools` returned 404; `/biblestudy` and `/blbstudy` returned 200 without the assistant iframe in fetched HTML. | Ask for the exact containing page and verify all three choices on desktop/mobile in its iframe. |
| Phase 9A | Pinned raw sources and unreviewed candidate packets were prepared locally. No independent human approval was supplied. | Obtain a qualified independent reviewer and occurrence/edition witnesses; retain evidence and satisfy every hard exit criterion before production integration. |
| Phase 9B / Key Words | Unimplemented and gated by 9A. | Build only after the preceding lexical gate passes, in separately scoped changes. |

The public app was `https://tcf-study-app.onrender.com/`; `/api/health` is read-only and does not prove generation readiness. Refresh observations rather than treating this date's checks as current. No new service, secret change, or paid resource is needed merely to move development machines. A merged PR does not establish that Render deployed it successfully.

## Local evidence does not travel with Git

`node_modules/`, `preview/`, `test-results/`, and `.local-stepbible/` are ignored. Packaged preview ZIPs were not rebuilt. Do not commit the raw tagged sources or upload private permission evidence to preserve this checkpoint.

The old machine's staged sources and reports were under:

```text
.local-stepbible/bd09545c7a44b39ace20f16c0359915f2aa23a62/
  manifest.json
  source-audit.json
  source-byte-validation.json
  fixture-review-candidates.json
  authentic-candidate-validation.json
  bounded-passage-review.json
  REVIEW-README.md
  [six original source files]
```

The standard candidate sampler produced 14 rows. Additional raw source-reference candidates were `Jhn.15.4` (29 rows, 3 risk-flagged) and `Psa.23.1` (4 rows, 2 risk-flagged). All were unreviewed; those source labels are not approved verse alignment or a published release subset.

To regenerate the JSON evidence on a new machine, create the ignored `.local-stepbible/` directory, save the following as `.local-stepbible/rebuild-review.mjs`, and run it from the repository root with `node --use-env-proxy .local-stepbible/rebuild-review.mjs`. It reuses existing utilities and downloads only if a complete manifest is absent. If a previous acquisition stopped partway through, inspect and recover that local staging directory before retrying: the downloader deliberately refuses to overwrite source files.

```js
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { stagePinnedSources } from '../scripts/fetch-stepbible-sources.js';
import { auditSources } from '../scripts/stepbible-source-audit.js';
import { parseVerifiedSourceBytes, validateSourceManifest } from '../scripts/validate-stepbible-source-bytes.js';
import { collectFixtureCandidates } from '../scripts/collect-stepbible-fixture-candidates.js';
import { validatePinnedReviewCandidates } from '../scripts/validate-stepbible-authentic-candidates.js';
import { inspectDocumentedStepFields } from '../scripts/inspect-stepbible-documented-fields.js';
import { classifyStepLexicalRecord } from '../scripts/classify-stepbible-lexical-risks.js';

const commit = 'bd09545c7a44b39ace20f16c0359915f2aa23a62';
const dir = `.local-stepbible/${commit}`;
if (!existsSync(`${dir}/manifest.json`)) await stagePinnedSources(commit, dir);
const manifest = JSON.parse(readFileSync(`${dir}/manifest.json`, 'utf8'));
if (manifest.sourceCommit !== commit) throw Error('Unexpected source commit');
const save = (name, data) => writeFileSync(`${dir}/${name}`, JSON.stringify(data, null, 2) + '\n');
save('source-audit.json', auditSources(manifest));
save('source-byte-validation.json', validateSourceManifest(manifest));
const packet = {
  status: 'UNREVIEWED_SOURCE_FIXTURE_CANDIDATES', sourceCommit: commit,
  files: manifest.files.map(file => collectFixtureCandidates(
    readFileSync(file.localPath), { ...file, sourceCommit: commit })),
};
save('fixture-review-candidates.json', packet);
save('authentic-candidate-validation.json', validatePinnedReviewCandidates(packet, { sourceCommit: commit }));
const samples = [];
for (const file of manifest.files.filter(file =>
  file.name.startsWith('TAGNT Mat-Jhn') || file.name.startsWith('TAHOT Job-Sng'))) {
  const parsed = parseVerifiedSourceBytes(readFileSync(file.localPath), file, commit);
  const reference = file.name.startsWith('TAGNT') ? 'Jhn.15.4' : 'Psa.23.1';
  const rows = parsed.rows.filter(row => {
    const part = row.referenceParts;
    return `${part.book}.${part.chapter}.${part.verse}` === reference;
  }).map(row => ({
    sourceLine: row.line,
    sourceRowSha256: createHash('sha256').update(row.rawColumns.join('\t')).digest('hex'),
    rawReference: row.rawReference, rawColumns: row.rawColumns,
    fieldInspection: inspectDocumentedStepFields(row),
    lexicalRisks: classifyStepLexicalRecord(row), reviewed: false,
  }));
  samples.push({ reference, sourceFile: file.name, sourceCommit: commit,
    sourceSha256: file.sha256, license: manifest.license,
    attribution: parsed.metadata.attribution, reviewed: false,
    status: 'HUMAN_REVIEW_REQUIRED', rows });
}
save('bounded-passage-review.json', {
  status: 'BOUNDED_PASSAGE_CANDIDATES_NOT_APPROVED', sourceCommit: commit,
  productionReady: false, samples,
});
console.log('Review evidence regenerated. Human review and semantic approval remain pending.');
```

This reproduces preparation outputs, not reviewer approval. Original pinned source bytes are reacquired; do not reuse a transferred manifest whose absolute paths point to the old machine. A reviewer must independently document occurrence/edition witnesses, field meanings, lexical senses, exclusions, and authority. Use the existing reviewed-fixture and exit tools only with genuine supplied review evidence.

## Suggested first message to Codex

> Read AGENTS.md and docs/machine-handoff.md, then inspect current git and release-readiness state. Resume the remaining Render, permission, SnapPages, and independent lexical-review gates. Recheck access and evidence before changing deployment settings or enabling original-language features. Follow repository branch/PR rules and ask only for genuinely missing access, decisions, or approvals.
