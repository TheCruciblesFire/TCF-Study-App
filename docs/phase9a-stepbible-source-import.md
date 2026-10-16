# Phase 9A — STEPBible source staging and evidence gate

## Upstream source discovery

The public STEPBible repository documents TAGNT and TAHOT as UTF-8 tab-separated resources and licenses the repository's own data under CC BY 4.0. TAGNT contains multiple Greek textual editions/meaning variants; TAHOT includes affixes, ketiv/qere, and versification complications. These distinctions must be preserved before assigning word-level meanings to verses.

Confirmed raw source filenames in upstream **Translators Amalgamated OT+NT**:
- TAGNT Mat-Jhn - Translators Amalgamated Greek NT - STEPBible.org CC-BY.txt
- TAGNT Act-Rev - Translators Amalgamated Greek NT - STEPBible.org CC-BY.txt
- TAHOT Gen-Deu - Translators Amalgamated Hebrew OT - STEPBible.org CC BY.txt
- TAHOT Jos-Est - Translators Amalgamated Hebrew OT - STEPBible.org CC BY.txt
- TAHOT Job-Sng - Translators Amalgamated Hebrew OT - STEPBible.org CC BY.txt
- TAHOT Isa-Mal - Translators Amalgamated Hebrew OT - STEPBible.org CC BY.txt

Reference: https://github.com/STEPBible/STEPBible-Data/tree/master/Translators%20Amalgamated%20OT%2BNT

## Reproducible staging procedure

1. Choose and review a specific **40-hex upstream Git commit**. Do not use moving `master` as a version.
2. Download all six files from their paths at that exact commit; store them outside the public web root and **do not commit large sources** to this app.
3. Calculate SHA-256 for each file; write a local `manifest.json` with `sourceCommit`, `license` (`CC BY 4.0`) and six `files` with `name`, `localPath`, and `sha256`.
4. Run `node scripts/stepbible-source-audit.js manifest.json report.json`. It fails on missing files, moved checksums, invalid UTF-8 replacement characters and structural absence of tabs.
5. Review the structural report and then **manually inspect representative source rows and headers**. Only after a reviewed mapping should a raw TAGNT/TAHOT adapter feed `scripts/normalize-verse-tokens.js`.
6. Preserve source SHA, checksums, documented exclusions and edition flags with each released index. Validate Hebrew affixes, Strong suffixes, Aramaic portions, chapter-versification and Greek variant tags before release.

**Current stage limitation:** This PR stages and audits the actual file *names and user-supplied bytes*, but **does not download them, import raw rows or create a complete lexicon**. Large upstream file contents were not available for reliable direct inspection in the authoring environment; pretending to parse them would create false confidence. Richer TBESG/TBESH definitions still require separate reviewed import mappings and integrity tests. This PR is a safe continuation, not the completed Phase 9A milestone.

The production runtime, public API, source citations and current word lookup remain unchanged.
