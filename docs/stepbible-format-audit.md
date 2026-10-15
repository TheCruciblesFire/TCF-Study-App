# Step 5b follow-on — Authentic STEPBible format discovery and conservative normalization

Inspected actual upstream blob contents (2026-10-15):
- TBESG Greek original Git blob `efe271a1dbb73fa01f8fa6e0f164c6687757a9ae`
- TBESH Hebrew original Git blob `a64990a674d13245ae1e9ed426bc69197c2fbad5`
- Both files contain tab-separated eight-column lexical rows (extended Strong, disambiguated Strong, unified Strong, lemma, transliteration, morphology, gloss, definition).
- Crucially, a *single original Strong ID can have multiple distinct extended records*: e.g., G0001, H0001, H7225. We must not collapse these into one sense.

`scripts/normalize-step-brief.js` converts only unambiguous original Strong IDs into the existing strict normalized import format. It reports excluded ambiguous identifiers with counts for human review, rather than choosing an arbitrary gloss. Import of all extended disambiguated identifiers belongs in a later schema update. The conversion deliberately retains only source gloss and lemma; it does not parse lexical HTML definitions, infer contextual senses, or align WEB English words to tagged originals.

The existing `scripts/import-step-lexicon.js` requires a SHA-256 of the normalized output and a pinned upstream commit. This PR includes unit tests modeled on actual source rows, **not** a complete bulk import run or prebuilt database. The raw upstream source files are large and were not copied into this repository. For a reproducible full conversion:
1. Resolve and record the upstream Git commit, then fetch both original files at that exact commit (not floating `master`).
2. Verify both files' blob SHA values against the inspected originals above.
3. Run the normalizer on full datasets; capture exported rows and all excluded IDs.
4. Hash each normalized TSV, write source manifests, and run the existing offline importer.
5. Independently review representative Greek/Hebrew rows, dataset headers, attribution, and exclusions.
6. No runtime lookup UI or GPT lexical claims until the full dataset import and schema extension pass.

Data source: https://github.com/STEPBible/STEPBible-Data. Credit **STEP Bible** and link to https://www.stepbible.org/ under CC BY 4.0; preserve notices and indicate changes. The WEB production app and licensing state are unchanged.
