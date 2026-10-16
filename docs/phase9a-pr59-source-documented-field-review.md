# Phase 9A / PR #59 — Source-documented lexical field review

## Source base
Official upstream documentation: https://github.com/STEPBible/STEPBible-Data/blob/master/README.md . Pinned source commit: `bd09545c7a44b39ace20f16c0359915f2aa23a62`. The six real source documents were inspected in earlier workflows. The README says TAGNT combines major Greek textual editions with positional/meaning variants; TAHOT uses a Leningrad/Westminster-derived base, affix tags and ketiv/qere-specific morphology.

## Preliminary confirmed structural fields (1-based)
| Dataset | Fields |
|---|---|
| TAGNT | 1 positioned source reference; 2 Greek surface with transliteration; 3 English; 4 disambiguated Strong's plus grammar; 5 dictionary form/gloss; 6 listed editions |
| TAHOT | 1 positioned source reference; 2 Hebrew surface; 3 transliteration; 4 English; 5 Strong's/compound expression; 6 morphology |

These are **documented raw field locations**, not approved interpretations of their values. Keep positions 7–17 intact and unclassified until independently supported. The new offline inspector retains literal values, raises review flags for composite Hebrew identifiers and unfamiliar source syntax, and explicitly marks verse alignment and lexical semantics unverified.

## Open questions requiring qualified independent review
- Suffix/extension semantics and affix composition in the Hebrew Strong's field
- Formal Greek morphology grammar and disambiguated Strong's conventions
- Greek edition inclusion and variant-position policies
- Ketiv/qere and alternate versification mapping
- Independent canonical reference/position witnesses and attribution

No fixture is marked `reviewed:true` by this PR. No production original-language index or public AI study response is modified. Follow-on work must tie reviewed expectations to the exact pinned file and row digest and document the reviewing authority.
