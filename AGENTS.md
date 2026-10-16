# Repository instructions

These rules apply repository-wide to future Codex work.

## Project purpose

- This application is a Scripture-centered Bible study assistant for The Crucible’s Fire.
- The governing study methodology is Scripture-first and must preserve biblical fidelity, source transparency, and interpretive restraint.
- Do not claim that the runtime is executing a private ChatGPT plugin. The repository implements compatible methodology through its own shared KV study engine.

## Architecture

- Backend: Node.js 24, Express 5, ES modules, Zod.
- Frontend: plain HTML/CSS/browser JavaScript served directly by Express.
- Shared study methodology and routing live under `packages/kv-study-engine/`.
- SQLite persistence supports conversations, limits, usage, and budget reservations.
- API.Bible is the authorized Scripture presentation source in live mode.
- OpenAI is the generation provider in live mode.
- Blue Letter Bible is an external user-initiated research destination, not a TCF data API.
- STEPBible is the intended machine-readable source for reviewed original-language data.

## Development rules

- Inspect existing architecture before introducing new abstractions.
- Prefer reuse of existing utilities and contracts over parallel implementations.
- Do not add another generic Phase 9A validator unless an existing validator cannot satisfy a documented requirement.
- Do not delete old lexical/source utilities until consumers and rollback requirements have been inventoried.
- Do not modify generated or packaged preview artifacts unless the task explicitly requires rebuilding them.
- Preserve Node 24 compatibility.
- Do not introduce a frontend build system unless explicitly approved.

## Git and PR workflow

- Never work directly on `main`.
- Start each implementation task from an up-to-date `main`.
- Create a narrowly scoped feature/fix/docs branch.
- Keep unrelated changes out of the branch.
- Run the checks appropriate to the changed surface before proposing a PR.
- Do not push, merge, rebase shared branches, or modify GitHub settings without explicit user authorization.
- Summarize changed files, validation performed, known limitations, and remaining work before requesting approval.

## Required validation

For normal code changes:

- `npm run check`
- `npm test`

For browser/UI changes when applicable:

- `npm run test:browser`

For reporting-related changes when applicable:

- `npm run test:reporting`

For offline preview changes when applicable:

- `npm run preview:test`

Do not run `npm run smoke` against live providers unless explicitly authorized because it can make metered provider calls.

## Phase 9 product contract

The application has exactly three top-level study choices:

1. Ask & Explore
2. Guided Study
3. Deep Dive with Blue Letter Bible

The standalone original-language lookup UI is retired.

The BLB mode is a branded external search gateway. It must not be presented as an AI-generated TCF study mode or as a BLB API integration.

Ask & Explore and Guided Study may eventually receive integrated Key Words material only from verified lexical evidence.

## Original-language and lexical safeguards

- Do not infer a Strong’s number from an English gloss.
- Do not assume one-to-one alignment between API.Bible English wording and Greek/Hebrew source tokens.
- Preserve source edition, verse occurrence, lemma, morphology, Strong ID, and provenance distinctions.
- Distinguish lexical potential from contextual meaning.
- Distinguish inflected forms from dictionary lemmas.
- Distinguish transliteration from grammatical parsing.
- Omit lexical material when evidence is insufficient rather than fabricate or overstate it.
- Do not introduce speculative morphology, etymological fallacies, or unsupported lexical conclusions.
- No production original-language integration is permitted until the Phase 9A hard exit criteria are satisfied.
- The administrative Phase 9A exit script verifies supplied attestations mechanically; it does not itself establish textual accuracy or independent review.

## Source boundaries

- API.Bible: preserve licensing, attribution, translation terms, and usage/FUMS reporting.
- STEPBible: preserve pinned-source provenance, edition distinctions, hashes, and reviewed semantic mappings.
- Blue Letter Bible: link/search gateway only unless explicit permission exists for other use. Do not scrape BLB or reproduce hosted licensed lexicon/commentary content.
- User-provided or reviewed study methodology must remain distinguishable from external source claims.

## Biblical interpretation safeguards

- Scripture governs the study.
- Do not force a theological framework onto a passage where the text does not responsibly support it.
- Avoid speculative canonical, Christological, cosmic, or original-language claims.
- Avoid prosperity framing and moralism.
- Gospel or canonical connections must be textually responsible and clearly distinguished from direct observation.
- State uncertainty or competing responsible interpretations when warranted.

## Phase 9 current-state warning

- Phase 9C’s three-mode interface and BLB gateway are implemented.
- Phase 9A has substantial offline infrastructure but has not completed its release criteria.
- Phase 9B initial-response lexical packets are not implemented.
- Integrated Key Words cards are not implemented.
- Original-language runtime support remains disabled.
- PRs #63, #64, and #65 fixed BLB navigation behavior; they did not complete the originally proposed 9A/9B/9D milestones.
- Do not infer milestone completion from PR numbering.

## Authoritative planning documents

Before Phase 9 work, read:

- `docs/phase9-roadmap.md`
- `docs/phase9-consolidated-delivery-and-exit.md`

When those documents conflict with observed implementation state, report the discrepancy rather than silently choosing one.
