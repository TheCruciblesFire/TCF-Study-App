// Study-note export deliberately omits licensed Scripture text, FUMS tokens,
// session identifiers and links. This is an outline for personal review.
export function formatStudyNotes(answer) {
  if (!answer?.study || !Array.isArray(answer.sources) || !answer.sources.length) {
    throw Error('A completed study is required');
  }
  const study = answer.study;
  const refs = new Map(answer.sources.map(source => [source.id, source.reference]));
  const referenceOnly = answer.grounding === 'reference_only';
  const sections = [
    [referenceOnly ? 'Read the passage in context' : 'Passage & context', [study.context]],
    [referenceOnly ? 'What to look for' : 'Observe the text', study.observations],
    [referenceOnly ? 'Interpretive questions' : 'Understand in context', study.interpretation],
    [referenceOnly ? 'Theological questions' : 'Theological conclusions', study.theology],
    [referenceOnly ? 'Wider story to consider' : 'Christ & the wider story', study.connections],
    [referenceOnly ? 'Consider a response' : 'Put it into practice', study.application],
  ];
  const lines = ['TCF BIBLE STUDY ASSISTANT', study.title, 'Main passage: ' + answer.sources[0].reference,
    ...(referenceOnly ? ['AI received references and the question, not the Scripture text. Check every prompt against the passage.'] : []), ''];
  for (const [heading, items] of sections) {
    if (!items?.length) continue;
    lines.push(heading);
    for (const item of items) {
      const references = [...new Set((item.evidence ?? []).map(id => refs.get(id)).filter(Boolean))];
      lines.push('- ' + item.text + (references.length ? ' [' + references.join('; ') + ']' : ''));
    }
    lines.push('');
  }
  lines.push('Keep exploring');
  for (const question of study.furtherStudy ?? []) lines.push('- ' + question);
  if (study.caveat) lines.push('', 'Interpretive caution', study.caveat);
  lines.push('', 'Scripture references (consult the passage text in an authorized Bible):');
  for (const source of answer.sources) lines.push('- ' + source.reference + ' — ' + source.role);
  lines.push('', referenceOnly
    ? 'AI generated reading prompts, not Scripture or verified interpretation. Check them against the cited passages.'
    : 'Study explanations are generated or curated notes, not Scripture. Verify interpretations against the cited passages.',
    'The Crucible’s Fire · Learn. Teach. Repeat.');
  return lines.join('\n');
}
