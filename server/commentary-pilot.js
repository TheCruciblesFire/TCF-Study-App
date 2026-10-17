import { parseReference } from './references.js';

// Bounded pilot. These short summaries are adaptations of the named Tyndale
// notes, not Scripture, a lexicon, or a source of verse-to-Strong alignment.
// Check the publisher's source archive before widening the corpus.
const notes = [
  {
    id: 'TOSN-JHN-15-4',
    reference: 'John 15:4',
    book: 'JHN',
    chapter: 15,
    verse: 4,
    text: 'The repeated call to remain in Christ describes a disciple’s continuing dependence on him, like a branch joined to a vine.',
    keywords: ['remain', 'vine'],
  },
  {
    id: 'TOSN-PSA-23-1',
    reference: 'Psalms 23:1',
    book: 'PSA',
    chapter: 23,
    verse: 1,
    text: 'The psalm uses shepherd imagery for the Lord’s personal care. In the ancient Near East, rulers were also described as shepherds.',
    keywords: ['shepherd', 'need'],
  },
];

export const COMMENTARY_PILOT_SOURCE = Object.freeze({
  title: 'Tyndale Open Study Notes',
  attribution: 'Adapted from Tyndale Open Study Notes. The original work by Tyndale House Publishers is available for free at tyndaleopenresources.com.',
  copyright: '© 2022 Tyndale House Publishers',
  license: 'CC BY-SA 4.0',
  licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0/',
  sourceUrl: 'https://tyndaleopenresources.com/',
});

export function getCommentaryPilot(reference) {
  const passage = parseReference(reference);
  if (!passage) return null;
  const note = notes.find(candidate => candidate.book === passage.book && candidate.chapter === passage.chapter &&
    (passage.start === null || (passage.start <= candidate.verse && candidate.verse <= passage.end)));
  if (!note) return null;
  const verse = parseReference(note.reference);
  return { id: note.id, reference: note.reference, text: note.text, keywords: [...note.keywords],
    blbUrl: verse.url.replace('/kjv/', '/csb/'), blbTranslation: 'CSB', ...COMMENTARY_PILOT_SOURCE };
}
