import { parseStrongId } from '../server/lexicon.js';

// Source format verified against STEPBible TBESG/TBESH original TSV records:
// eStrong | dStrong | uStrong | Hebrew/Greek | Transliteration | Morph | Gloss | Meaning.
// STEPBible extends Strong IDs with distinct suffix meanings. This converter
// does NOT collapse multiple senses to a single misleading dictionary gloss.
export function normalizeStepBriefLexicon(raw, language) {
  if (!['G', 'H'].includes(language)) throw Error('Expected G or H');
  const header = language === 'G' ? /^eStrong\tdStrong\tuStrong\tGreek\tTransliteration\tMorph\tGloss\t/ : /^eStrong#\tdStrong\tuStrong\tHebrew\tTransliteration\tMorph\tGloss\t/;
  const lines = raw.replace(/^\uFEFF/, '').split(/\r?\n/);
  if (!lines.some(line => header.test(line))) throw Error('STEPBible header missing or changed');
  const grouped = new Map();
  let parsed = 0;
  const incomplete = [];
  for (const line of lines) {
    if (line[0] !== language || !/^[GH][0-9]{4}\t/.test(line)) continue;
    const parts = line.split('\t');
    if (parts.length < 8) throw Error('Malformed source record');
    const [strong, disambiguated, , lemma, , , gloss] = parts;
    // Source has G0001, G0001G, and out-of-range G6000 extensions.
    // Validate the column shape before applying our narrower Strong ID limit.
    if (strong.length !== 5 || strong[0] !== language ||
        !/^[0-9]{4}$/.test(strong.slice(1)) ||
        !disambiguated.startsWith(strong) ||
        ![' ', '='].includes(disambiguated[strong.length] ?? '')) {
      throw Error('Malformed STEP source identifier');
    }
    parsed++;
    const id = parseStrongId(language + String(Number(strong.slice(1))));
    if (!id || !lemma.trim() || !gloss.trim()) {
      incomplete.push({ id: id ?? strong, disambiguated: disambiguated.trim(),
        reason: !id ? 'extended ID outside supported Strong range' : !lemma.trim() ? 'missing lemma' : 'missing gloss' });
      continue;
    }
    const list = grouped.get(id) ?? [];
    list.push({ id, lemma: lemma.trim(), gloss: gloss.trim().replace(/\s+/g, ' '), disambiguated: disambiguated.trim() });
    grouped.set(id, list);
  }
  if (parsed === 0) throw Error('No real lexicon entries found');
  const rows = [], excluded = [...incomplete];
  for (const [id, entries] of grouped) {
    // Include only IDs with ONE documented source row. Multiple extended
    // Strong distinctions require the future disambiguated-identifier schema.
    if (entries.length > 1) { excluded.push({ id, reason: 'multiple extended Strong entries', count: entries.length }); continue; }
    const entry = entries[0];
    if (entry.lemma.includes('\t') || entry.gloss.includes('\t') || entry.gloss.includes('\n')) throw Error('Unsafe TSV content');
    rows.push(entry);
  }
  rows.sort((a,b) => a.id.localeCompare(b.id, 'en', {numeric:true}));
  const normalized = 'id\tlemma\tgloss\n' + rows.map(({id,lemma,gloss}) => [id,lemma,gloss].join('\t')).join('\n') + '\n';
  return { normalized, audit: { language, sourceRecords: parsed, uniqueIds: grouped.size, imported: rows.length, excluded: excluded.length, exclusions: excluded } };
}
