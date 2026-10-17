# Bounded commentary study pilot

**Status:** Draft pilot behind `COMMENTARY_PILOT_ENABLED=true`. The default is false for ordinary services. On a Render PR preview, the pilot enables itself and uses the preview URL and temporary local data. This work does not complete Phase 9A, publish original-language cards, or publish original-language mappings. The draft preview shows two choices: Ask & Learn and Deep Dive with Blue Letter Bible.

## User experience

For a governing passage containing John 15:4 or Psalm 23:1, Ask & Learn receives one short, labeled commentary insight in addition to the existing WEB-grounded study. The source is Tyndale Open Study Notes. The user sees the source, copyright, license, and two English word links that open individual CSB word searches in Blue Letter Bible. From there the reader chooses BLB's Tools for original-language work. The links are search links, not asserted Strong's entries. Other passages follow the existing study path without a commentary note.

The preview removes the in-app Guided Study choice. The existing inductive study harness on another page remains separate. The Deep Dive with BLB gateway and passage handoff remain user-initiated.

## Data and rights

The two short, manually adapted summaries are stored in `server/commentary-pilot.js`. Source: [Tyndale Open Study Notes](https://tyndaleopenresources.com/), © 2022 Tyndale House Publishers, [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/). Attribution and change notices accompany the displayed and copied insight. The pilot does not import the full commentary or Bible translation text from Tyndale. **Before enabling the flag publicly, compare both adapted records against the publisher's downloadable source archive, retain the archive version and checksum, and review the final attribution and ShareAlike handling.**

For the two pilot passages, the app displays the API.Bible-served CSB for reading with its copyright and FUMS usage reporting. The separate public-domain World English Bible (WEB) passage remains the only Scripture text passed to OpenAI. The CSB response is not saved to conversation history or copied into notes. Only the bounded, named note summary is added to the OpenAI study-generation prompt. The note is secondary to Scripture, is not a source of lexical mapping, and does not provide lexical mappings. An AI response must return the matching note ID, pass the existing Scripture-citation validation, and pass the commentary-specific restrictions. Failed validation fails the request; there is no unsourced fallback insight.

## Trial and acceptance

1. With the flag off, confirm John 15:4, Psalm 23:1, and an unrelated passage behave as before.
2. With the flag on in a non-production live environment, run John 15:1–8, Psalms 23, and an unrelated passage. Review both generated insights for fidelity to the WEB passage and Tyndale source. Confirm unsupported claims do not appear in the Scripture-only sections.
3. Check the CSB passage handoff and each CSB word search on desktop and mobile. Confirm the word searches differ by keyword. BLB's `WEB` selection names Webster's Bible, so all pilot BLB links explicitly use CSB.
4. Copy notes and check that the adapted insight, Tyndale attribution, original URL, and CC BY-SA link travel with it. Verify no full CSB or WEB passage is exported. Inspect the OpenAI request and retained conversation data to confirm CSB text and FUMS tokens are absent.
5. Confirm the preview's API.Bible key can access CSB and the FUMS script reports its view. Measure prompt size, costs, accessibility, and reader comprehension before considering wider coverage or enabling the flag on production Render.

This pilot is deliberately small. Expanding it calls for an ingestion pipeline with pinned source data, passage-range matching, per-note provenance, source/license review, and quality evaluation. The pending Phase 9A review is still required for any in-app original-language or Strong's cards.

## Live PR preview

For PR #75, enable **Manual** Pull Request Previews in the existing Render service's **Previews** tab, then add the GitHub label `render-preview` to the PR. Render creates a separate temporary instance and URL. Render copies the base service's settings, including API credentials, when it creates the preview. The branch overrides the copied public origin with `RENDER_EXTERNAL_URL`, uses `/tmp/tcf-commentary-preview` rather than the production disk, enables this bounded pilot, and sets preview AI budgets to $1 daily and $2 monthly. The preview's temporary database and usage records disappear when its instance is removed or restarted.

The preview is publicly reachable by URL and can make metered API.Bible/OpenAI calls. Share the URL only with testers and do not enter sensitive personal information. Render bills the preview at the base service's compute rate until the PR is closed or the preview is removed. Closing or merging the PR removes the preview automatically.
