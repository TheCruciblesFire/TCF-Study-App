# Phase 2 Step 3 — Bounded immediate-context retrieval

## First implementation
- Retain the user-selected controlling reference unchanged as source S1.
- In live mode, when fewer than three Scripture sources have been selected, optionally retrieve **up to two immediately preceding verses** within the *same chapter* as a distinct source, labeled "Immediate context".
- Only add preceding context for a short explicit verse range (at most 16 verses) whose first verse is at least 3. Do not guess the chapter's last verse, cross chapter boundaries, or fetch full surrounding chapters.
- Skip context if it overlaps the main passage or selected supporting passages. Maximum remains **three** provider sources, with no added model calls.
- An unavailable context excerpt with a provider content/format failure is skipped rather than blocking the primary study; upstream authentication/rate/provider availability failures still surface.
- Demo content is unchanged. Live output includes the additional passage and its API.Bible attribution/FUMS usage token when retrieved; the assistant can cite the excerpt using its evidence ID.

## Limitations
This intentionally implements a **small, deterministic context window**, not an AI-directed research agent or a general discovery system. If the router selects two supporting texts, there is no context slot. Passages beginning at verse 1 have no preceding same-chapter context. Following verses and surrounding chapters are deliberately excluded to avoid invalid verse bounds and unexpected volume. The model must still avoid claims outside the retrieved Scripture.

## Acceptance
- Unit tests check chapter-only references, short/long ranges, beginning-of-chapter boundaries, duplication, overlap, and third-source cap.
- GitHub CI: `npm run check` and `npm test`.
- After merging, run `npm run smoke` on Render, then study John 15:4–8 in the SnapPages app. With fewer than three originally selected sources, a "John 15:2–3 · Immediate context" card should appear; if two supporting sources were selected, no extra card should appear.
- Inspect interpretation for fidelity to the controlling passage and verify that each newly displayed source reports its FUMS token.
- `BIBLE_ID` remains the authorized WEB edition, currently `9879dbb7cfe39e4d-01`. No environment or database migrations.
