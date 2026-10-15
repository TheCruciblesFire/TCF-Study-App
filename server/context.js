import { parseReference } from './references.js';

// A deterministic, conservative context window. Preserve the user-requested
// passage and spend at most one otherwise-unused source slot. Only retrieve
// verses that precede a short verse-range passage within the same chapter.
// Never guess a chapter's final verse or fetch an entire surrounding chapter.
export function chooseContextReference(mainReference, existingReferences) {
  const main = parseReference(mainReference);
  if (!main || existingReferences.length >= 3 || main.start === null) return null;
  if (main.start < 3 || main.end - main.start + 1 > 16) return null;
  const start = Math.max(1, main.start - 2);
  const context = parseReference(`${main.reference.replace(/ [0-9]+:.+$/, '')} ${main.chapter}:${start}–${main.start - 1}`);
  if (!context) return null;
  for (const value of existingReferences) {
    const other = parseReference(value);
    if (other?.book !== context.book || other.chapter !== context.chapter) continue;
    if (other.start === null || (other.start <= context.end && context.start <= other.end)) return null;
  }
  return context.reference;
}
