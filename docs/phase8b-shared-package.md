# Phase 8B — Shared Engine Foundation

**Status:** Compatibility foundation, not full KV skill execution. No new public modes, calls, routes, prompts, service or MCP endpoints.

## Delivered

- `packages/kv-study-engine/methodology.js`: byte-for-byte substantive methodology prompt moved from `server/methodology.js` into a package; legacy module re-exports it.
- `packages/kv-study-engine/engine.js`: bounded mode descriptors and a source-ID contract to support later adapters, with unsupported modes explicitly disabled.
- `packages/kv-study-engine/provenance.json`: version, original plugin commit, enablement state, and source-parity/permission caveats.
- `test/kv-engine-contract.test.js`: regression coverage for compatibility, disabled modes, controlling source and evidence IDs.
- `scripts/check.js`: syntax-check the new package.

## What is deliberately *not* claimed

This version is an approved-methodology **adaptation**, not an export of the current private plugin's complete SKILL.md/reference bundle. An installed ChatGPT skill is not an API endpoint. The team must review a full authorized upstream snapshot, revision, and any third-party source rights before declaring parity or enabling a new workflow. Dedicated KV review skills are not silently executed. The existing app's citation checks do not equal full passage-faithfulness auditing.

## Migration gates

1. Run `npm run check`, `npm test`, `npm run preview:test`, and browser tests in CI. These must reproduce the current passage study behavior.
2. Confirm `server/providers.js` continues importing the identical `methodology` through the legacy re-export. Neither structured prompts nor API.Bible calls change.
3. Review provenance and secure approval for current skill/reference files before implementing any new modes or copying full instructions.
4. Next incremental PR can introduce an opt-in engine adapter/shadow route, with tests, then route live traffic only after evaluation and rollback coverage.

**Deployment:** No environment changes or STEPBible index rebuild. Merge and let Render deploy normally.
