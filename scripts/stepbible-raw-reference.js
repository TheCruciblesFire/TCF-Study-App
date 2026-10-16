// Structural interpretation only: does not certify canonical verse numbering or lexical meaning.
const BOOKS='Gen Exo Lev Num Deu Jos Jdg Rut 1Sa 2Sa 1Ki 2Ki 1Ch 2Ch Ezr Neh Est Job Psa Pro Ecc Sng Isa Jer Lam Ezk Dan Hos Jol Amo Oba Jon Mic Nam Hab Zep Hag Zec Mal Mat Mrk Luk Jhn Act Rom 1Co 2Co Gal Eph Php Col 1Th 2Th 1Ti 2Ti Tit Phm Heb Jas 1Pe 2Pe 1Jn 2Jn 3Jn Jud Rev'.split(' ');
const BOOK_SET=new Set(BOOKS);
const SHAPE=/^([1-3]?[A-Za-z]{2,3})\.([1-9]\d{0,2})\.([1-9]\d{0,2})(?:\(([^()\t=]+)\))?#(\d{2,3})=([^\s\t=]{1,32})$/;
export function parseStepReference(value) {
 if(typeof value!=='string') return null;
 const m=SHAPE.exec(value);
 if(!m || !BOOK_SET.has(m[1])) return null;
 const chapter=Number(m[2]),verse=Number(m[3]),position=Number(m[5]);
 if(position<1||position>300) return null;
 return {raw:value,book:m[1],chapter,verse,position,
   alternateVerseText:m[4]??null,readingMarker:m[6],canonicalAlignmentVerified:false};
}
// Preserve compound, extended and affix-bearing identifiers exactly.
// Normalizing H9003/{H7225G} into base Strong H7225 would be data loss.
export function preserveStepLexicalExpression(value) {
 if(typeof value!=='string'||!value||value.length>300||/[<>\u0000-\u001f]/.test(value))
   throw Error('Unsafe or missing raw lexical expression');
 return {raw:value,interpreted:false,components:null};
}
