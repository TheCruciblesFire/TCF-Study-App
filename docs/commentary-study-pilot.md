# Bounded commentary study pilot

**Status:** Draft pilot behind `COMMENTARY_PILOT_ENABLED=true`. The default is false. This work does not complete Phase 9A, publish original-language cards, change Render, or replace the three study choices.

## User experience

For a governing passage containing John 15:4 or Psalm 23:1, Ask & Explore receives one short, labeled commentary insight in addition to the existing WEB-grounded study. The source is Tyndale Open Study Notes. The user sees the source, copyright, license, and two English word links that open the relevant verse in Blue Letter Bible's KJV view. From there the reader chooses BLB's Tools for original-language work. The links are passage links, not asserted Strong's entries. Other passages follow the existing study path without a commentary note.

Guided Study's initial passage response can show the same pilot insight. Its observation, interpretation, and application feedback remain Scripture-only. The Deep Dive with BLB gateway remains user-initiated.

## Data and rights

The two short, manually adapted summaries are stored in `server/commentary-pilot.js`. Source: [Tyndale Open Study Notes](https://tyndaleopenresources.com/), © 2022 Tyndale House Publishers, [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/). Attribution and change notices accompany the displayed and copied insight. The pilot does not import the full commentary or Bible translation text from Tyndale. **Before enabling the flag publicly, compare both adapted records against the publisher's downloadable source archive, retain the archive version and checksum, and review the final attribution and ShareAlike handling.**

The app continues to display API.Bible's public-domain World English Bible and report its usage. Only the bounded, named note summary is added to the OpenAI study-generation prompt. The note is secondary to Scripture, is not a source of lexical mapping, and is never used for Guided Study feedback. An AI response must return the matching note ID, pass the existing Scripture-citation validation, and pass the commentary-specific restrictions. Failed validation fails the request; there is no unsourced fallback insight.

## Trial and acceptance

1. With the flag off, confirm John 15:4, Psalm 23:1, and an unrelated passage behave as before.
2. With the flag on in a non-production live environment, run John 15:1–8, Psalms 23, and an unrelated passage. Review both generated insights for fidelity to the WEB passage and Tyndale source. Confirm unsupported claims do not appear in the Scripture-only sections.
3. Check the BLB links on desktop and mobile. BLB's `WEB` selection names Webster's Bible, so the pilot links explicitly use KJV and disclose that translation change.
4. Copy notes and check that the adapted insight, Tyndale attribution, original URL, and CC BY-SA link travel with it. Verify no full Bible passage is exported.
5. Measure prompt size, costs, accessibility, and reader comprehension before considering wider coverage or enabling the flag on Render.

This pilot is deliberately small. Expanding it calls for an ingestion pipeline with pinned source data, passage-range matching, per-note provenance, source/license review, and quality evaluation. The pending Phase 9A review is still required for any in-app original-language or Strong's cards.
