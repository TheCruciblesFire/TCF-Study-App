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
  const id = parseStrongId(input);
  if (!id) return { error: 'INVALID_STRONG' };
  if (!databases) return { error: 'LEXICON_UNAVAILABLE' };
  const db = databases[id[0]];
  const record = validateLexiconEntry(db?.entries?.[id], id);
  if (!record) return { id, available: false, message: 'No reviewed base-Strong entry is available for this identifier. It may have multiple or excluded senses.' };
  return { id, available: true, lemma: record.lemma, gloss: record.gloss,
    attribution: db.metadata.attribution, source: record.source, license: record.license,
    note: 'A lexical gloss is not a translation of a particular verse or a complete meaning in context.' };
}
