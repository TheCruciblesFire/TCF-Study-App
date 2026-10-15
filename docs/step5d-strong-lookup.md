# Step 5d — optional Strong's lookup deployment

This read-only feature is **disabled by default**. The successful manual
STEPBible workflow produces four files in its artifact ZIP: `G.json`, `H.json`,
`G.audit.json`, and `H.audit.json`.

1. Download the artifact from a successful run **after PR #22** and inspect its audit.
2. Put all four files into a persistent, private directory available inside the
   application container (for example, a securely provisioned Render persistent
   disk mounted at `/app/.data/lexicon`). Do not use a directory under `public/`.
3. Set the server environment variable `LEXICON_DIR` to that directory and
   restart the service. This is a **manual operator step**, not automatic GitHub
   Actions deployment. No API keys are included in the files.
4. On startup, the application checks both index shapes, CC BY 4.0 metadata,
   entry validation, and corresponding reconciled audit counts. A missing
   file or failed check prevents startup when enabled.
5. Verify `/api/config` returns `lexicalLookupEnabled: true` and look up
   G26, H10, and an unavailable identifier through the displayed lookup form.
   The production chat study flow is unchanged.

The endpoint `GET /api/strong/:id` uses existing origin and IP request controls.
It returns a lexical **lemma and gloss**, not verse-by-verse word alignment,
original-language exegesis, or a theological claim. No AI request is involved.
If no reviewed data has been deployed, it returns a 503 response rather than
inventing lexical content.

Retain attribution **STEP Bible (https://www.stepbible.org/), CC BY 4.0** and
the original source links with all redistributed data. Each artifact is retained
on GitHub Actions only for the configured workflow period; maintain a secure
backup before it expires.
