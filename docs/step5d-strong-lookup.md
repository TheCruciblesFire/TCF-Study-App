# Step 5d — bundled Strong's lookup deployment

The Docker image now builds the reviewed STEPBible indexes from immutable, pinned
upstream source blobs and packages all four output files. **No Render Shell upload,
persistent-disk copy, or GitHub artifact download is necessary.**

## Deployment

1. Merge the PR after CI review; Render must deploy from the resulting `main` commit.
2. In Render Environment, remove any previously configured `LEXICON_DIR` override,
   or set it explicitly to `/app/lexicon`. Do **not** use
   `/var/data/tcf/lexicon` for the bundled deployment.
3. Rebuild/redeploy the Docker service. Its builder checks the exact reviewed
   upstream Git blob hashes, regenerates indexes with audit reconciliation, and
   fails the build if a blob or audited record changes unexpectedly.
4. Verify `GET /api/config` contains `lexicalLookupEnabled: true`.
5. Use the form for `G26` (Greek love), `H10` (Hebrew destruction), and
   `G2199` (expected unavailable due to incomplete/ambiguous senses).
6. Verify the ordinary Scripture chat flow still works.

`GET /api/strong/:id` is a read-only, rate-limited lookup. Entries carry
the original STEPBible source URL and **STEP Bible CC BY 4.0** attribution.
No OpenAI call is required for Strong's-number lookups.

The container image holds the indexes under `/app/lexicon`; the existing
Render persistent disk at `/var/data/tcf` is unrelated and remains unchanged.
A future upstream database revision must first update the reviewed blob pins
and pass the import/audit pipeline before a new image can be built.

**Scope:** These are lexical lemmas and glosses, not verse-specific word
alignment, contextual exegesis, or guaranteed translations in a passage.
