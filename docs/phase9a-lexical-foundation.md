# Phase 9A — Verse-linked lexical foundation (first incremental implementation)

This initial deliverable establishes a **fail-closed, provenance-checked normalized verse/token index** without changing the production study output, static assets or Render settings.

## Included
- `server/verse-lexicon.js`: validates book/verse tokens, canonical basic Strong ID, original surface, lemma, romanized transliteration, morphology code, textual edition and token position; rejects duplicate verse+edition+position and invalid source metadata.
- `scripts/normalize-verse-tokens.js`: accepts *reviewed eight-column UTF-8 TSV*, exports JSON keyed by verse, with pinned 40-hex source commit and CC BY 4.0 attribution.
- `test/verse-lexicon.test.js`: Greek/Hebrew cases, provenance, edition separation, duplicate rejection, invalid fields and non-aligned lookup.

## Critical limitation: normalized import only

**This is not yet a raw TAGNT/TAHOT importer, a complete dataset, or a deployed language study.** The upstream files have complex textual-edition and Hebrew affix/ketiv-qere conventions; blindly parsing these from an assumed column layout risks silently incorrect word-study claims. Build a separately validated adapter against a pinned snapshot of actual STEPBible TAGNT, TAHOT, TBESG, TBESH, and morphology metadata before production deployment. Review and test actual source header variants, alignment, versification, textual-edition flags, duplicate positions, Strong suffix variants, affixes, and Hebrew/Aramaic distinctions. The basic Strong parser does not represent all Extended Strong disambiguation. Excluded/ambiguous forms must be disclosed, never silently mapped.

Input TSV headers exactly:

```text
reference	position	strong	surface	lemma	transliteration	morphology	edition
```

Reference is a STEPBible three-character UBS-style canonical abbreviation, e.g. `Jhn.15.4`, `Gen.1.1`. The `edition` field is mandatory and records the selected original-language textual tradition. Input is already reconciled; no translation-token alignment is implied. Positions must be positive within a verse and unique within an edition.

## Next substep before accepting 9A as fully complete

1. Pin a real upstream STEPBible commit and inspect raw file columns and edition semantics, not just README.
2. Add tested raw `TAGNT`/`TAHOT` parsing into the reviewed normalization contract with rejected/skipped counts.
3. Import TBESG/TBESH richer senses, verify transliteration and morphology labels against their tagged token sources.
4. Produce reproducible vetted JSON/audit outputs and deploy as optional read-only data.
5. Verify representative hard cases and documented mismatches before proceeding to Phase 9B.

CI: `npm run check`, `npm test`, `npm run preview:test`.

STEPBible credits: https://github.com/STEPBible/STEPBible-Data (CC BY 4.0). No BLB content was copied.
