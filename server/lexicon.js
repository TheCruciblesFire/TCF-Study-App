// Lexical identifiers are references, not definitions or theological claims.
// Keep this parser independent of Scripture translation word alignment.
export function parseStrongId(input) {
  if (typeof input !== 'string') return null;
  const match = /^(H|G)([1-9][0-9]{0,4})$/i.exec(input.trim());
  if (!match) return null;
  const number = Number(match[2]);
  const max = match[1].toUpperCase() === 'H' ? 8674 : 5624;
  if (number > max) return null;
  return `${match[1].toUpperCase()}${number}`;
}

export function validateLexiconEntry(entry, requestedId) {
  if (!entry || typeof entry !== 'object' || parseStrongId(entry.id) !== requestedId ||
      typeof entry.lemma !== 'string' || !entry.lemma.trim() ||
      typeof entry.gloss !== 'string' || !entry.gloss.trim() ||
      typeof entry.source !== 'string' || !entry.source.trim() ||
      typeof entry.license !== 'string' || !entry.license.trim()) return null;
  return { id: requestedId, lemma: entry.lemma, gloss: entry.gloss, source: entry.source, license: entry.license };
}
