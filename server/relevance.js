// Conservative, explainable screening of supporting Scripture candidates.
// Lexical similarity does NOT establish exegetical relevance. Never discard a
// valid theological connection solely because it uses different vocabulary.
const stop = new Set('about after again also among and are but can did does for from had has have him his how into its let not our out she than that the their them then there these they this those through unto was were what when where which while who whom will with would you your god lord jesus christ'.split(' '));
const terms = s => new Set(String(s).toLowerCase().replace(/<[^>]*>/g, ' ').match(/[a-z]{4,}/g)?.filter(w => !stop.has(w)) ?? []);
export function assessSupportingSource(main, candidate) {
  const primary = terms(main.text), secondary = terms(candidate.text);
  const common = [...secondary].filter(word => primary.has(word));
  const exactDuplicate = String(main.text).replace(/\s+/g, ' ').trim() === String(candidate.text).replace(/\s+/g, ' ').trim();
  return {
    status: exactDuplicate ? 'duplicate_text' : common.length ? 'lexical_parallel' : 'requires_interpretive_review',
    commonTerms: common.slice(0, 5),
  };
}
export function selectSupportingSources(main, supporting) {
  const seen = new Set([String(main.text).replace(/\s+/g, ' ').trim()]);
  return supporting.filter(source => {
    const normalized = String(source.text).replace(/\s+/g, ' ').trim();
    if (seen.has(normalized)) return false;
    seen.add(normalized);
    return true;
  });
}
