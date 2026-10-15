# TCF study app branding

The supplied **TCF Updated Style and Brand Sheet 04252026.md** and logo reference control this visual update. The user selected the existing ministry color scheme and supplied the tagline **Learn. Teach. Repeat.** The document's generic instruction to stop and request a palette is source material, not an additional user request; the supplied logo and explicit Classic Gold default establish the palette here.

- Foundation: black `#000000`, white `#FFFFFF`, charcoal reading panels.
- Accent: Classic Gold `#ABA346`, with lighter gold for readable small text. No competing accent family or large gold panel fills.
- Artwork: the uploaded `Flame.tif` was converted losslessly to `public/brand/flame.png`, preserving the supplied artwork and transparency. The former placeholder flame is no longer used.
- Wordmark: the logo image embedded in the chat is a visual reference. The app uses the downloadable flame and a typeset lockup based on that reference. The exact full-logo image was not available as a downloadable file. Replace the lockup with the original PNG/SVG when that file is supplied; this is not claimed as the original logo image.
- Type: the CSS prefers the brand sheet's Proxima Nova / Extra Condensed Thin and Dax Condensed names when available. Licensed webfont files were not supplied, so Barlow Condensed and Source Sans 3 are bundled as open-source fallbacks. Their SIL Open Font Licenses are in `public/fonts/` and embedded in the standalone preview.
- Layout: larger readable study text, a restrained gold hierarchy, black navigation, charcoal source panels, and stacked starter options on mobile. The supplied flame appears in the navigation lockup rather than repeating with each generated answer. Slide-specific 3D/photography rules are not treated as a requirement to generate decorative images for the chat interface.

The linked `https://thecruciblesfire.org/blbstudy` page could not be inspected: both normal HTTPS retrieval and the browser were blocked by the cloud egress proxy. No page-specific colors, fonts or layout are claimed to have been sampled from that page. A screenshot of the page or network access would allow an exact visual comparison.

`npm run preview:build` regenerates the standalone file with all fonts and artwork embedded. `CHROMIUM_PATH=/usr/bin/chromium npm run preview:test` checks its colors, tagline, artwork, mobile layout and interactive examples without external requests.
