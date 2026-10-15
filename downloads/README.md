# Packaged TCF previews

| Package | Contents |
| --- | --- |
| [TCF-Branded-Study-Preview.zip](TCF-Branded-Study-Preview.zip) | Self-contained `index.html`, desktop screenshot, opening instructions and font licenses. |
| [TCF-HTML-Testing-Folder-Pack.zip](TCF-HTML-Testing-Folder-Pack.zip) | Organized release ZIPs, extracted HTML, flame/brand notes, screenshots, test checklist and archive folder. |

Open either ZIP on GitHub and select **Download raw file**. Extract the download on your computer. Open the extracted `index.html` in Chrome, Edge, Safari or Firefox.

The preview uses black, white and Classic Gold, the supplied flame, and the tagline **Learn. Teach. Repeat.** The wordmark is typeset from the provided visual reference. All required assets are embedded. The three prepared studies work without internet access, accounts or API keys; this preview does not generate live AI answers.

Google Drive is suitable for storing and sharing these packages. Its HTML viewer does not run the interactive study app. Neither package contains API credentials, environment files, visitor databases or installed dependencies.

The build source is in `scripts/build-preview.js`; run `npm run preview:build` to regenerate the standalone HTML. Browser verification is available with `CHROMIUM_PATH=/usr/bin/chromium npm run preview:test` on the prepared cloud machine.
