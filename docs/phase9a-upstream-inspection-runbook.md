# Phase 9A — PR #47: Real-source inspection via GitHub Actions

## Why this gate exists

The earlier data tools accept only reviewed mappings. Authentic multi-megabyte TAGNT/TAHOT source rows are not accessible within the ChatGPT execution environment. Rather than invent a parser for unknown upstream layout, this PR introduces a manual **GitHub Actions** workflow that inspects pinned GitHub source names, downloads their bytes, computes integrity audits and publishes **structural reports**.

## Run after merge

In repository **Actions → Inspect pinned STEPBible sources → Run workflow**, leave the pinned 40-character source SHA or replace it only with a verified upstream commit. Download the `stepbible-source-inspection` artifact. Share its JSON reports here or paste the findings into the next PR.

The workflow is *manual* (`workflow_dispatch`), has no credentials except read-only GitHub access, never commits downloaded raw sources, and never changes Render, the website, existing lexicons, or API.Bible.

The job fails deliberately if the previously documented six raw filenames do not match upstream. That failure is an actual source discovery result, not a reason to fabricate a mapping. The artifact `upstream-inventory.json` lists the true names so the downloader can be corrected in a subsequent PR. If acquisition succeeds, inspect the other structural JSON reports; an authorized reviewer must still examine representative raw rows privately to establish actual column meaning, textual-variant syntax, Hebrew affixes and Extended Strong suffixes. Numeric field counts alone do not constitute verification.

## Limitations

This workflow **does not implement** a verified raw-row importer or extended Greek/Hebrew lexicon. No first-study language cards are enabled. It is an evidence-gathering step needed to build the correct parser in a follow-on PR, not completion of Phase 9A.
