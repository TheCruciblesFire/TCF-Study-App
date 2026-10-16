import { test } from 'node:test';
import assert from 'node:assert/strict';
import { formatStudyNotes } from '../public/study-export.js';

test('copy notes preserves study movements and cited references without licensed text', () => {
  const answer = {
    sources: [{ id: 'S1', reference: 'John 15:1–8', role: 'Main passage',
      text: 'LICENSED SCRIPTURE TEXT MUST NOT BE COPIED', fumsToken: 'SECRET_FUMS' },
      { id: 'S2', reference: 'John 14:21', role: 'Supporting Scripture', text: 'OTHER COPYRIGHT TEXT' }],
    study: {
      title: 'Abiding in Christ',
      context: { text: 'The vine and branches set the context.', evidence: ['S1'] },
      observations: [{ text: 'Jesus is the true vine.', evidence: ['S1'] }],
      interpretation: [{ text: 'Abiding means remaining.', evidence: ['S1', 'S2'] }],
      theology: [], connections: [], application: [],
      furtherStudy: ['What does bearing fruit mean?'],
      caveat: 'This is a bounded explanation.'
    }
  };
  const notes = formatStudyNotes(answer);
  assert.match(notes, /Abiding in Christ/);
  assert.match(notes, /Jesus is the true vine\. \[John 15:1–8\]/);
  assert.match(notes, /Abiding means remaining\. \[John 15:1–8; John 14:21\]/);
  assert.match(notes, /What does bearing fruit mean\?/);
  assert.match(notes, /bounded explanation/);
  assert.doesNotMatch(notes, /LICENSED SCRIPTURE TEXT|OTHER COPYRIGHT TEXT|SECRET_FUMS/);
  assert.throws(() => formatStudyNotes({ study: {}, sources: [] }), /completed study/);
});
