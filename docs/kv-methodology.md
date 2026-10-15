# KV Study Engine adaptation

User-provided upstream: [TheCruciblesFire/kv-study-plugin](https://github.com/TheCruciblesFire/kv-study-plugin).

Inspected plugin: `plugins/kv-study-plugin`, version **3.0.1**, commit **709d036e3d5a36d03824f9bbb3021ac5b1bc2f92**. The repository root README currently discusses a devotional plugin; the specific Study Plugin manifests and skill files govern this adaptation.

Relevant source files, pinned for review:

- [Study Engine SKILL.md](https://github.com/TheCruciblesFire/kv-study-plugin/blob/709d036e3d5a36d03824f9bbb3021ac5b1bc2f92/plugins/kv-study-plugin/skills/kv-study-engine/SKILL.md)
- [Theology Framework](https://github.com/TheCruciblesFire/kv-study-plugin/blob/709d036e3d5a36d03824f9bbb3021ac5b1bc2f92/plugins/kv-study-plugin/skills/kv-study-engine/references/Theology_Framework_REVISED.md)
- [Tone and Style Guide](https://github.com/TheCruciblesFire/kv-study-plugin/blob/709d036e3d5a36d03824f9bbb3021ac5b1bc2f92/plugins/kv-study-plugin/skills/kv-study-engine/references/Tone_and_Style_Guide_REVISED.md)
- [Scripture Formatting Check](https://github.com/TheCruciblesFire/kv-study-plugin/blob/709d036e3d5a36d03824f9bbb3021ac5b1bc2f92/plugins/kv-study-plugin/skills/kv-scripture-formatting-check/SKILL.md), consulted for translation, attribution and BLB constraints.

The plugin is a collection of agent skills and references. Its manifests expose skills, not a remotely callable study service. An OpenAI API call cannot invoke the user’s installed ChatGPT plugin. This implementation adapts the relevant method in `server/methodology.js`; it does not claim to execute the plugin, run its dedicated audits, or reproduce its entire research suite.

## Implemented passage-study contract

1. Define the assignment and choose the smallest supported study mode.
2. Establish the controlling text; retrieve it before generating study content.
3. Describe observations before explaining their meaning.
4. Interpret in context; distinguish direct text, inference, theological synthesis and application.
5. Give meaningful tensions and uncertainty room; avoid background and lexical claims without sources.
6. Trace Christological/canonical connections only when the retrieved texts warrant them. Label thematic parallels honestly. Do not impose kingdom, covenant, divine-council, spiritual-conflict or other favored themes.
7. Draw grace-shaped, proportionate applications after interpretation. Avoid moralism, prosperity promises, fear and shame.
8. Stop at study. Do not silently generate a sermon, devotional, course or research package.
9. Identify the source base; do not invent bibliographic references, quotations, lexical data or historical research.

The upstream CSB preference is preserved as a documented preference, not a license assumption. The configured authorized translation controls live quotations. Exact provider wording is shown separately from generated summaries. The ministry-specific CSB permission file mentioned by the upstream skill was not available in the repository inspected; none is claimed here.

## Deliberately deferred

Full deep-dive, original-language, topical biblical-theology, worldview tracing, historical-source research and formal specialist audits remain outside V1. The upstream deep-dive procedure was inspected to understand this boundary, not folded into every basic answer. New modes should add verified sources, mode-specific validation, cost bounds and acceptance tests before being enabled.

## External API contract provenance

API.Bible adapter behavior was initially checked against the official [American Bible Society SDK](https://github.com/americanbible/api-bible-sdks), commit `144a1ef8fe310730f19364076a0bec1b784ecda9`: its README documents `rest.api.bible/v1`, `meta.fumsToken`, and both `Bible.copyright` and `Bible.info`. Once credentials and network access were configured, real CSB metadata and passage retrieval were verified. The current [official Fair Use documentation](https://docs.api.bible/resources/fair-use) establishes `https://pkg.api.bible/fumsV3.min.js`, `window.fumsData`, and `fums('trackView', tokens)`; reports use `https://fums.api.bible/f3`. This replaces the unverified legacy script URL used in the initial prototype. See [live verification notes](live-verification.md) for the checks performed and the remaining generation/deployment acceptance steps.
