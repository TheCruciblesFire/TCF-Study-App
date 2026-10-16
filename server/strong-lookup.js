import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parseStrongId, validateLexiconEntry } from './lexicon.js';

// Optional deployment-time data; never download source files at request time.
export function loadLexicalIndexes(directory) {
  if (!directory) return null;
  const databases = {};
  for (const language of ['G', 'H']) {
    const data = JSON.parse(readFileSync(join(directory, language + '.json'), 'utf8'));
    const audit = JSON.parse(readFileSync(join(directory, language + '.audit.json'), 'utf8'));
    if (!data?.entries || !data?.metadata || !audit?.reconciled ||
        audit.language !== language || audit.imported !== Object.keys(data.entries).length ||
        audit.sourceRecords !== audit.imported + audit.excludedSourceRecords ||
        data.metadata.license !== 'CC BY 4.0' ||
        !/^https:\/\/github\.com\/STEPBible\/STEPBible-Data\//.test(data.metadata.sourceUrl)) {
      throw Error('Lexical database failed deployment integrity checks: ' + language);
    }
    for (const [id, entry] of Object.entries(data.entries)) {
      if (!id.startsWith(language) || !validateLexiconEntry(entry, id)) {
        throw Error('Invalid deployed lexical record: ' + id);
      }
    }
    databases[language] = data;
  }
  return databases;
}

export function lookupStrong(databases, input) {
  // Accept display-style zero padding at the HTTP boundary, while keeping
  // canonical database keys and parseStrongId() strict.
  const text = typeof input === 'string' ? input.trim() : '';
  const padded = /^([GH])0*([1-9][0-9]{0,4})$/i.exec(text);
  const id = parseStrongId(padded ? padded[1] + padded[2] : text);
  if (!id) return { error: 'INVALID_STRONG' };
  if (!databases) return { error: 'LEXICON_UNAVAILABLE' };
  const db = databases[id[0]];
  const record = validateLexiconEntry(db?.entries?.[id], id);
  if (!record) return { id, available: false, message: 'No reviewed base-Strong entry is available for this identifier. It may have multiple or excluded senses.' };
  return { id, available: true, lemma: record.lemma, gloss: record.gloss,
    attribution: db.metadata.attribution, source: record.source, license: record.license,
    note: 'A lexical gloss is not a translation of a particular verse or a complete meaning in context.' };
}

/**
 * English gloss discovery, NOT a reverse Bible translation alignment.
 * Exact whole-word matches only; bounded and sorted for predictable results.
 */
export function searchEnglishGloss(databases, input, { limit = 20 } = {}) {
  const query = typeof input === 'string' ? input.trim().toLowerCase() : '';
  if (!/^[a-z][a-z -]{1,39}$/.test(query) || query.includes('  ')) return { error: 'INVALID_SEARCH' };
  if (!databases) return { error: 'LEXICON_UNAVAILABLE' };
  const matches = [];
  let total = 0;
  const words = query.split(/[ -]+/);
  for (const lang of ['G', 'H']) {
    for (const entry of Object.values(databases[lang]?.entries ?? {})) {
      const gloss = entry.gloss.toLowerCase();
      const tokens = gloss.match(/[a-z]+/g) ?? [];
      if (!words.every(word => tokens.includes(word))) continue;
      total++;
      if (matches.length < 100) matches.push({ id: entry.id, lemma: entry.lemma, gloss: entry.gloss,
        language: lang === 'G' ? 'Greek' : 'Hebrew' });
    }
  }
  matches.sort((a,b) => a.gloss.length - b.gloss.length ||
    a.id.localeCompare(b.id, 'en', { numeric: true }));
  return { query, matches: matches.slice(0, Math.max(1, Math.min(limit, 20))), total,
    capped: total > 100, attribution: 'STEP Bible', license: 'CC BY 4.0',
    note: 'Matches are based on English words in STEPBible glosses. They do not identify which original-language word appears in a particular Bible verse.' };
}
