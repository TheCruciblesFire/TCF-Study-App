# PR #57 — Pinned authentic STEPBible structural assertions

This PR checks a small, **literal** set of first-token fields from six source files against the original SHA-256-pinned review artifact. These comparisons include original reference labels, Greek lexical/morphological raw strings and Hebrew compound identifiers **as source text only**. The inspection workflow runs this check against freshly downloaded pinned originals and uploads a machine-readable validation report. Any divergence fails inspection.

Coverage: Matthew 1:1, Romans 5:1, Genesis 1:1, 1 Samuel 1:1, Job 1:1, Isaiah 53:1. A full semantic Strong's mapping or morphological interpretation has **not** been independently reviewed. The verdict deliberately remains `AUTHENTIC_SOURCE_SHAPES_CHECKED_SEMANTICS_UNREVIEWED`.

The assertions are anchored in the artifact from successful inspection run 38936283868 for upstream commit `bd09545c7a44b39ace20f16c0359915f2aa23a62`. Full source bytes remain uncommitted. These checks are structurally valuable but should not be called **approved golden lexical mappings**.

## Remaining review gate
1. Independently check source documentation and all 17 semantic column definitions for TAGNT and TAHOT.
2. Establish independently approved Strong's, Greek edition, and Hebrew ketiv/qere interpretation using textual witnesses and source notes.
3. Document representative edge cases for alternate Hebrew versification and morphology, including exclusions.
4. Only after that introduce verified normalized verse-level indexes. No live application behavior changes in this PR.
