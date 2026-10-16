import { parseStrongId } from './lexicon.js';

const BOOKS = new Set(('Gen Exo Lev Num Deu Jos Jdg Rut 1Sa 2Sa 1Ki 2Ki 1Ch 2Ch Ezr Neh Est Job Psa Pro Ecc Sng Isa Jer Lam Ezk Dan Hos Jol Amo Oba Jon Mic Nam Hab Zep Hag Zec Mal Mat Mrk Luk Jhn Act Rom 1Co 2Co Gal Eph Php Col 1Th 2Th 1Ti 2Ti Tit Phm Heb Jas 1Pe 2Pe 1Jn 2Jn 3Jn Jud Rev').split(' '));
const HEBREW_BOOKS = new Set(('Gen Exo Lev Num Deu Jos Jdg Rut 1Sa 2Sa 1Ki 2Ki 1Ch 2Ch Ezr Neh Est Job Psa Pro Ecc Sng Isa Jer Lam Ezk Dan Hos Jol Amo Oba Jon Mic Nam Hab Zep Hag Zec Mal').split(' '));
const REF = /^([1-3]?[A-Za-z]{2,3})\.([1-9][0-9]{0,2})\.([1-9][0-9]{0,2})$/;
const CLEAN = value => typeof value === 'string' && value.length > 0 && value.length <= 300 && !/[<>\u0000-\u001f]/.test(value);
const REQUIRED = ['reference','position','strong','surface','lemma','transliteration','morphology','edition'];

export function validateVerseToken(row) {
  if (!row || typeof row !== 'object' || Array.isArray(row)) return null;
  const match = REF.exec(row.reference);
  if (!match || !BOOKS.has(match[1])) return null;
  const strong = parseStrongId(row.strong);
  if (!strong || (HEBREW_BOOKS.has(match[1]) ? strong[0] !== 'H' : strong[0] !== 'G')) return null;
  if (!Number.isSafeInteger(row.position) || row.position < 1 || row.position > 300) return null;
  if (!CLEAN(row.surface) || !CLEAN(row.lemma) || !CLEAN(row.transliteration) || !CLEAN(row.morphology) || !CLEAN(row.edition)) return null;
  if (row.edition.length > 80 || row.morphology.length > 80) return null;
  return { reference: row.reference, position: row.position, strong, surface: row.surface, lemma: row.lemma, transliteration: row.transliteration, morphology: row.morphology, edition: row.edition };
}

export function buildVerseLexicon(rows, metadata) {
  if (!Array.isArray(rows) || !rows.length || rows.length > 500000 || !metadata || metadata.license !== 'CC BY 4.0' ||
      !/^https:\/\/github\.com\/STEPBible\/STEPBible-Data(?:\/|$)/.test(metadata.sourceUrl ?? '') ||
      !/^[a-f0-9]{40}$/.test(metadata.sourceCommit ?? '') ||
      !['TAGNT','TAHOT'].includes(metadata.dataset)) throw Error('Invalid tagged lexical source metadata');
  const entries = Object.create(null),seen = new Set();
  for (const input of rows) {
    const row = validateVerseToken(input);
    if (!row) throw Error('Invalid verse token record');
    if ((metadata.dataset === 'TAGNT') !== (row.strong[0] === 'G')) throw Error('Wrong dataset language');
    const key = row.reference + ':' + row.edition + ':' + row.position;
    if (seen.has(key)) throw Error('Duplicate verse edition position');
    seen.add(key);
    (entries[row.reference] ??= []).push(row);
  }
  for (const verse of Object.values(entries)) verse.sort((a,b) => a.position-b.position || a.edition.localeCompare(b.edition));
  return { metadata: { dataset: metadata.dataset, sourceUrl: metadata.sourceUrl, sourceCommit: metadata.sourceCommit, license: metadata.license, attribution: 'STEPBible.org / Tyndale House Cambridge' }, count: rows.length, entries };
}

export function getVerseTokens(index, reference, edition, { limit = 250 } = {}) {
  if (!index || !REF.test(reference) || typeof edition !== 'string' || !edition) return [];
  return (index.entries?.[reference] ?? []).filter(row => row.edition === edition).slice(0, Math.max(0, Math.min(250, limit)));
}
