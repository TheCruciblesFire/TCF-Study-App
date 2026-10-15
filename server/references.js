// Canonical IDs used by API.Bible. Provider URLs are constructed here, never by a model.
const books = [
  ['GEN','Genesis','Gen'],['EXO','Exodus','Exod Ex'],['LEV','Leviticus','Lev'],['NUM','Numbers','Num'],['DEU','Deuteronomy','Deut'],
  ['JOS','Joshua','Josh'],['JDG','Judges','Judg'],['RUT','Ruth',''],['1SA','1 Samuel','1 Sam'],['2SA','2 Samuel','2 Sam'],
  ['1KI','1 Kings','1 Kgs'],['2KI','2 Kings','2 Kgs'],['1CH','1 Chronicles','1 Chron'],['2CH','2 Chronicles','2 Chron'],
  ['EZR','Ezra',''],['NEH','Nehemiah','Neh'],['EST','Esther','Esth'],['JOB','Job',''],['PSA','Psalms','Psalm Ps'],['PRO','Proverbs','Prov'],
  ['ECC','Ecclesiastes','Eccl'],['SNG','Song of Songs','Song'],['ISA','Isaiah','Isa'],['JER','Jeremiah','Jer'],
  ['LAM','Lamentations','Lam'],['EZK','Ezekiel','Ezek'],['DAN','Daniel','Dan'],['HOS','Hosea','Hos'],['JOL','Joel',''],['AMO','Amos',''],
  ['OBA','Obadiah','Obad'],['JON','Jonah',''],['MIC','Micah','Mic'],['NAM','Nahum','Nah'],['HAB','Habakkuk','Hab'],
  ['ZEP','Zephaniah','Zeph'],['HAG','Haggai','Hag'],['ZEC','Zechariah','Zech'],['MAL','Malachi','Mal'],
  ['MAT','Matthew','Matt Mt'],['MRK','Mark','Mk'],['LUK','Luke','Lk'],['JHN','John','Jn'],['ACT','Acts',''],['ROM','Romans','Rom'],
  ['1CO','1 Corinthians','1 Cor'],['2CO','2 Corinthians','2 Cor'],['GAL','Galatians','Gal'],['EPH','Ephesians','Eph'],
  ['PHP','Philippians','Phil'],['COL','Colossians','Col'],['1TH','1 Thessalonians','1 Thess'],['2TH','2 Thessalonians','2 Thess'],
  ['1TI','1 Timothy','1 Tim'],['2TI','2 Timothy','2 Tim'],['TIT','Titus',''],['PHM','Philemon','Philem'],['HEB','Hebrews','Heb'],
  ['JAS','James','Jas'],['1PE','1 Peter','1 Pet'],['2PE','2 Peter','2 Pet'],['1JN','1 John','1 Jn'],['2JN','2 John','2 Jn'],
  ['3JN','3 John','3 Jn'],['JUD','Jude',''],['REV','Revelation','Rev'],
];
const normalize = s => s.toLowerCase().replace(/[.\s]/g, '');
const aliases = new Map();
for (const [id, name, extra] of books) {
  aliases.set(normalize(id), { id, name }); aliases.set(normalize(name), { id, name });
  // Additional abbreviations split by the numeric book prefix, if present.
  const prefix = name.match(/^\d /)?.[0] || '';
  for (const alias of extra.replace(/^\d /, '').split(' ').filter(Boolean)) aliases.set(normalize(prefix + alias), { id, name });
}
aliases.set(normalize('Song of Solomon'), { id: 'SNG', name: 'Song of Songs' });
export function parseReference(input) {
  if (typeof input !== 'string') return null;
  const match = input.trim().replace(/[–—]/g, '-').match(/^((?:[1-3]\s*)?[A-Za-z][A-Za-z .]*?)\s*(\d{1,3})(?::(\d{1,3})(?:-(\d{1,3}))?)?$/);
  if (!match) return null;
  const book = aliases.get(normalize(match[1]));
  const chapter = Number(match[2]), start = match[3] ? Number(match[3]) : null, end = match[4] ? Number(match[4]) : start;
  if (!book || chapter < 1 || chapter > 150 || (start !== null && (start < 1 || end < start || end > 176 || end - start >= 60))) return null;
  const suffix = start ? `:${start}${end !== start ? `–${end}` : ''}` : '';
  const id = `${book.id}.${chapter}${start ? `.${start}${end !== start ? `-${book.id}.${chapter}.${end}` : ''}` : ''}`;
  const blbBook = ({ EZK: 'eze', JOL: 'joe', NAM: 'nah', MRK: 'mar', PHP: 'phl', '1JN': '1jo', '2JN': '2jo', '3JN': '3jo' })[book.id] || book.id.toLowerCase();
  return { id, reference: `${book.name} ${chapter}${suffix}`, book: book.id, chapter, start, end,
    url: `https://www.blueletterbible.org/kjv/${blbBook}/${chapter}/${start || 1}/` };
}
const names = books.flatMap(([, name, extra]) => {
  const prefix = name.match(/^\d /)?.[0] || '';
  return [name, ...extra.replace(/^\d /, '').split(' ').filter(Boolean).map(a => prefix + a)];
}).concat('Song of Solomon').sort((a, b) => b.length - a.length);
const namedReference = new RegExp(`\\b(${names.map(name => name.replace(/ /g, '\\s+')).join('|')})\\s+(\\d{1,3})(?::(\\d{1,3})(?:[–—-](\\d{1,3}))?)?`, 'gi');
export function findReferences(text) { return [...text.matchAll(namedReference)].map(match => match[0]); }
export function referenceCovered(reference, sources) {
  const requested = parseReference(reference);
  if (!requested) return false;
  return sources.some(source => {
    const available = parseReference(source.reference);
    return available && available.book === requested.book && available.chapter === requested.chapter &&
      (!available.start || (requested.start && requested.start >= available.start && requested.end <= available.end));
  });
}
