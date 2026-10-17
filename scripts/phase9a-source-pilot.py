#!/usr/bin/env python3
"""Offline Phase 9A source-format pilot. No production index or approvals."""
from __future__ import annotations

from collections import Counter, defaultdict
from hashlib import sha1, sha256
from pathlib import Path
from urllib.parse import quote
from urllib.request import Request, urlopen
import json
import re
import sys
import xml.etree.ElementTree as ET

SOURCES = {
    "macula_john": (
        "Clear-Bible/macula-greek",
        "8423afe47b9e8f24b7772e808af45c7159a6fe7e",
        "SBLGNT/lowfat/04-john.xml",
        "60df471741d7ba3b61ab1dbaf17159af85d9c1ce",
        12354789,
    ),
    "oshb_psalms": (
        "openscriptures/morphhb",
        "3d15126fb1ef74867fc1434be1942e837932691f",
        "wlc/Ps.xml",
        "2da40d4bfc7d1772eccb6f49cf027f460b8be4f4",
        1925086,
    ),
    "step_john": (
        "STEPBible/STEPBible-Data",
        "bd09545c7a44b39ace20f16c0359915f2aa23a62",
        "Translators Amalgamated OT+NT/TAGNT Mat-Jhn - Translators Amalgamated Greek NT - STEPBible.org CC-BY.txt",
        "705c1bc1cf752e013efcef99b8d9a3b7853bf843",
        14189032,
    ),
    "step_psalms": (
        "STEPBible/STEPBible-Data",
        "bd09545c7a44b39ace20f16c0359915f2aa23a62",
        "Translators Amalgamated OT+NT/TAHOT Job-Sng - Translators Amalgamated Hebrew OT - STEPBible.org CC BY.txt",
        "2eee6774c609eb1313ace03d202e85556d4e4f15",
        9540623,
    ),
    "step_greek_lexicon": (
        "STEPBible/STEPBible-Data",
        "bd09545c7a44b39ace20f16c0359915f2aa23a62",
        "Lexicons/TBESG - Translators Brief lexicon of Extended Strongs for Greek - STEPBible.org CC BY.txt",
        "efe271a1dbb73fa01f8fa6e0f164c6687757a9ae",
        4736912,
    ),
    "step_hebrew_lexicon": (
        "STEPBible/STEPBible-Data",
        "bd09545c7a44b39ace20f16c0359915f2aa23a62",
        "Lexicons/TBESH - Translators Brief lexicon of Extended Strongs for Hebrew - STEPBible.org CC BY.txt",
        "a64990a674d13245ae1e9ed426bc69197c2fbad5",
        3288045,
    ),
}


def download(name: str) -> tuple[bytes, dict]:
    owner_repo, commit, path, expected_blob, expected_size = SOURCES[name]
    url = f"https://raw.githubusercontent.com/{owner_repo}/{commit}/{quote(path)}"
    request = Request(url, headers={"User-Agent": "TCF-Study-App-phase9a-offline-pilot"})
    with urlopen(request, timeout=90) as response:
        data = response.read(expected_size + 1)
    if len(data) != expected_size:
        raise ValueError(f"{name}: source byte length changed")
    blob = sha1(f"blob {len(data)}\0".encode() + data).hexdigest()
    if blob != expected_blob:
        raise ValueError(f"{name}: pinned Git blob mismatch")
    return data, {
        "url": f"https://github.com/{owner_repo}/blob/{commit}/{quote(path)}",
        "commit": commit,
        "gitBlob": blob,
        "sha256": sha256(data).hexdigest(),
        "bytes": len(data),
    }


def local_tag(element: ET.Element) -> str:
    return element.tag.rsplit("}", 1)[-1]


def basic_id(raw: str, language: str) -> str | None:
    if not re.fullmatch(r"[1-9][0-9]{0,4}", raw):
        return None
    number = int(raw)
    if number > (5624 if language == "G" else 8674):
        return None
    return f"{language}{number}"


def macula_candidates(data: bytes) -> tuple[set[str], dict]:
    root = ET.fromstring(data)
    words = [node for node in root.iter()
             if local_tag(node) == "w" and
             re.fullmatch(r"JHN 15:4![1-9][0-9]*", node.get("ref", ""))]
    if not words:
        raise ValueError("MACULA: no JHN 15:4 word records found")
    reasons = Counter()
    ids: set[str] = set()
    positions: set[int] = set()
    for word in words:
        position = int(word.get("ref", "").split("!")[-1])
        if position in positions:
            reasons["duplicate_position"] += 1
            continue
        positions.add(position)
        if word.get("status"):
            reasons["variant_or_unmapped_status"] += 1
            continue
        strong = basic_id(word.get("strong", ""), "G")
        if not strong:
            reasons["nonbasic_or_missing_strong"] += 1
            continue
        if not word.get("lemma") or not word.get("morph") or not (word.text or "").strip():
            reasons["missing_word_field"] += 1
            continue
        ids.add(strong)
    return ids, {
        "reference": "Jhn.15.4",
        "edition": "SBLGNT",
        "sourceWordRecords": len(words),
        "basicCandidateRows": len(words) - sum(reasons.values()),
        "uniqueBasicStrongIds": len(ids),
        "excludedRowsByReason": dict(sorted(reasons.items())),
    }


def oshb_candidates(data: bytes) -> tuple[set[str], dict]:
    root = ET.fromstring(data)
    verses = [node for node in root.iter()
              if local_tag(node) == "verse" and node.get("osisID") == "Ps.23.1"]
    if len(verses) != 1:
        raise ValueError(f"OSHB: expected one Ps.23.1 verse, found {len(verses)}")
    words = [node for node in verses[0].iter() if local_tag(node) == "w"]
    if not words:
        raise ValueError("OSHB: no Ps.23.1 word records found")
    reasons = Counter()
    ids: set[str] = set()
    suffix_morph = 0
    for word in words:
        if word.get("type"):
            reasons["variant_or_special_type"] += 1
            continue
        strong = basic_id(word.get("lemma", ""), "H")
        if not strong:
            reasons["compound_or_extended_lemma"] += 1
            continue
        if not word.get("morph") or not (word.text or "").strip():
            reasons["missing_word_field"] += 1
            continue
        if "/" in word.get("morph", ""):
            suffix_morph += 1
        ids.add(strong)
    return ids, {
        "reference": "Psa.23.1",
        "edition": "Westminster Leningrad Codex / OSHB",
        "sourceWordRecords": len(words),
        "basicCandidateRows": len(words) - sum(reasons.values()),
        "uniqueBasicStrongIds": len(ids),
        "candidateRowsWithCompositeMorphologyRequiringReview": suffix_morph,
        "excludedRowsByReason": dict(sorted(reasons.items())),
    }


def step_candidates(data: bytes, reference: str, language: str, strong_column: int) -> tuple[set[str], dict]:
    prefix = re.compile(r"^" + re.escape(reference) + r"(?=[^0-9]|$)")
    pattern = re.compile(r"(?<![A-Za-z0-9])" + language + r"0*([1-9][0-9]{0,4})(?![A-Za-z0-9])")
    rows = 0
    single = 0
    ids: set[str] = set()
    reasons = Counter()
    for line in data.decode("utf-8-sig").splitlines():
        columns = line.split("\t")
        if not columns or not prefix.match(columns[0]):
            continue
        rows += 1
        if len(columns) <= strong_column:
            reasons["short_source_row"] += 1
            continue
        matches = [basic_id(number, language) for number in pattern.findall(columns[strong_column])]
        matches = [value for value in matches if value]
        if len(matches) != 1:
            reasons["not_one_plain_basic_strong"] += 1
            continue
        single += 1
        ids.add(matches[0])
    if rows == 0:
        raise ValueError(f"STEPBible: no {reference} source rows found")
    return ids, {
        "reference": reference,
        "sourceRows": rows,
        "rowsWithOnePlainBasicStrong": single,
        "uniquePlainBasicStrongIds": len(ids),
        "excludedRowsByReason": dict(sorted(reasons.items())),
        "note": "Raw-field comparison only; Greek edition membership and Hebrew affixes are not approved.",
    }


def lexicon_ids(data: bytes, language: str) -> tuple[set[str], set[str]]:
    grouped: dict[str, list[bool]] = defaultdict(list)
    blocked: set[str] = set()
    for line in data.decode("utf-8-sig").splitlines():
        if not re.match(r"^" + language + r"[0-9]{4}\t", line):
            continue
        fields = line.split("\t")
        if len(fields) < 8:
            raise ValueError("STEPBible lexicon record has fewer than eight fields")
        source_id, disambiguated, _, lemma, _, _, gloss, meaning = fields[:8]
        strong = basic_id(source_id[1:].lstrip("0"), language)
        if not strong:
            continue
        alias = not disambiguated.startswith(source_id) or (
            len(disambiguated) > len(source_id) and bool(re.fullmatch(r"[a-z]", disambiguated[len(source_id)]))
        )
        if alias or not lemma.strip() or not gloss.strip():
            blocked.add(strong)
            continue
        grouped[strong].append(bool(meaning.strip()))
    eligible = {key for key, values in grouped.items() if key not in blocked and len(values) == 1}
    meaning_present = {key for key in eligible if grouped[key][0]}
    return eligible, meaning_present


def coverage(primary: set[str], witness: set[str], lexicon: set[str], meaning: set[str]) -> dict:
    return {
        "sourceCandidatesWithStepSameVerseId": len(primary & witness),
        "sourceCandidatesAbsentFromStepRawFieldSet": len(primary - witness),
        "stepRawFieldIdsAbsentFromSourceCandidates": len(witness - primary),
        "sourceCandidatesWithCurrentBaseLexiconEntry": len(primary & lexicon),
        "sourceCandidatesWithLexiconMeaningField": len(primary & meaning),
        "sourceCandidatesWithBothStepIdAndLexiconEntry": len(primary & witness & lexicon),
    }



def review_examples(raw: dict[str, bytes], step_g_ids: set[str],
                    step_h_ids: set[str]) -> dict:
    """Small occurrence/lexicon sample for human review, never runtime approval."""
    greek_target = {"G3306", "G2814", "G2590"}
    hebrew_target = {"H3068", "H7462", "H3808", "H2637"}
    greek = []
    for node in ET.fromstring(raw["macula_john"]).iter():
        if local_tag(node) != "w" or not re.fullmatch(r"JHN 15:4![1-9][0-9]*", node.get("ref", "")):
            continue
        strong = basic_id(node.get("strong", ""), "G")
        if strong in greek_target:
            greek.append({"ref": node.get("ref"), "surface": (node.text or "").strip(),
                          "lemma": node.get("lemma"), "morph": node.get("morph"),
                          "strong": strong, "stepIdOverlap": strong in step_g_ids})
    hebrew = []
    for node in ET.fromstring(raw["oshb_psalms"]).iter():
        if local_tag(node) != "verse" or node.get("osisID") != "Ps.23.1":
            continue
        for word in node.iter():
            if local_tag(word) != "w":
                continue
            lemma = word.get("lemma", "")
            strong = basic_id(lemma, "H")
            hebrew.append({"surface": (word.text or "").strip(), "lemmaField": lemma,
                           "morph": word.get("morph"), "strong": strong,
                           "stepIdOverlap": strong in step_h_ids if strong else False,
                           "plainBaseId": strong is not None})
    lexicons = {}
    for language, key, targets in [("G", "step_greek_lexicon", greek_target),
                                   ("H", "step_hebrew_lexicon", hebrew_target)]:
        for line in raw[key].decode("utf-8-sig").splitlines():
            fields = line.split("\t")
            if len(fields) < 8 or not (re.fullmatch(language + r"[0-9]{4}", fields[0]) or (language == "H" and fields[0].startswith("H7462"))):
                continue
            strong = basic_id(fields[0][1:].lstrip("0"), language)
            if strong in targets or (language == "H" and fields[0].startswith("H7462")):
                lexicons.setdefault(strong or fields[0], []).append({
                    "disambiguated": fields[1], "lemma": fields[3],
                    "gloss": fields[6], "meaning": fields[7]})
    step_hebrew_raw_fields = []
    for line in raw["step_psalms"].decode("utf-8-sig").splitlines():
        columns = line.split("\t")
        if columns and re.match(r"^Psa\\.23\\.1(?=[^0-9]|$)", columns[0]) and len(columns) > 4:
            step_hebrew_raw_fields.append({"ref": columns[0], "strongField": columns[4]})
    return {"greek": greek, "hebrew": hebrew,
            "stepHebrewRawFields": step_hebrew_raw_fields,
            "lexiconRows": lexicons}


def main() -> None:
    output = Path(sys.argv[1] if len(sys.argv) > 1 else "phase9a-pilot-report.json")
    downloaded = {name: download(name) for name in SOURCES}
    raw = {name: value[0] for name, value in downloaded.items()}
    provenance = {name: value[1] for name, value in downloaded.items()}
    greek_ids, greek = macula_candidates(raw["macula_john"])
    hebrew_ids, hebrew = oshb_candidates(raw["oshb_psalms"])
    step_g_ids, step_g = step_candidates(raw["step_john"], "Jhn.15.4", "G", 3)
    step_h_ids, step_h = step_candidates(raw["step_psalms"], "Psa.23.1", "H", 4)
    lex_g, meaning_g = lexicon_ids(raw["step_greek_lexicon"], "G")
    lex_h, meaning_h = lexicon_ids(raw["step_hebrew_lexicon"], "H")
    report = {
        "status": "STRUCTURAL_PILOT_NOT_REVIEWED_OR_DEPLOYABLE",
        "provenance": provenance,
        "greek": {**greek, "stepRawField": step_g,
                  "coverage": coverage(greek_ids, step_g_ids, lex_g, meaning_g)},
        "hebrew": {**hebrew, "stepRawField": step_h,
                   "coverage": coverage(hebrew_ids, step_h_ids, lex_h, meaning_h)},
        "limits": [
            "No Scripture text or raw token rows are published by this report.",
            "STEPBible raw fields are compared by candidate Strong ID only; shared or divergent editions, readings, and positions remain unverified.",
            "OSHB and STEPBible Hebrew sources share textual ancestry; agreement is not independent scholarly approval.",
            "No candidate is marked reviewed or authorized for production display.",
            "The deployed lexicon currently retains glosses but not the source Meaning field.",
        ],
    }
    output.write_text(json.dumps(report, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(json.dumps({
        "status": report["status"],
        "greek": report["greek"],
        "hebrew": report["hebrew"],
        "reviewExamples": review_examples(raw, step_g_ids, step_h_ids),
    }, indent=2))


if __name__ == "__main__":
    main()
