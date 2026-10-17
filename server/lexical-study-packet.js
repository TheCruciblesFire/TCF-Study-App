// Opt-in, bounded occurrence-level study packet. Missing approval yields no lexical claim.
import {parseReference} from './references.js';
import {validateVerseToken} from './verse-lexicon.js';
import {lookupStrong} from './strong-lookup.js';
const HEX=/^[0-9a-f]{64}$/;
export function buildLexicalStudyPacket(reference, dataset, approvals, dictionaries, {limit=4}={}) {
 const passage=parseReference(reference);
 if(!passage || !passage.start || !dataset?.metadata?.sourceCommit || !Array.isArray(approvals) ||
   !Number.isInteger(limit) || limit<1 || limit>4) return [];
 const book=passage.book[0]+passage.book.slice(1).toLowerCase();
 const approved=new Map();
 for(const item of approvals){
   if(!item || item.reviewed!==true || item.verseAlignmentVerified!==true ||
     item.lexicalMappingVerified!==true || !item.independentSource || !item.reviewer ||
     !HEX.test(item.sourceRowSha256??'') || item.sourceCommit!==dataset.metadata.sourceCommit) continue;
   approved.set(item.tokenId,item);
 }
 const words=[];
 for(let v=passage.start;v<=passage.end;v++){
   const ref=book+'.'+passage.chapter+'.'+v;
   for(const raw of dataset.entries?.[ref]??[]){
     const token=validateVerseToken(raw);if(!token || token.reference!==ref)continue;
     const approval=approved.get(ref+':'+token.position+':'+token.edition);
     if(!approval || approval.strong!==token.strong || approval.lemma!==token.lemma)continue;
     const dictionary=lookupStrong(dictionaries,token.strong);
     if(!dictionary.available || !dictionary.lemma || !dictionary.gloss)continue;
     // A dictionary gloss is only lexical potential, never a contextual translation.
     words.push({reference:ref,position:token.position,edition:token.edition,
       surface:token.surface,transliteration:token.transliteration,
       lemma:token.lemma,strong:token.strong,morphologyCode:token.morphology,
       lexicalGloss:dictionary.gloss,sourceRowSha256:approval.sourceRowSha256,
       sourceCommit:dataset.metadata.sourceCommit,attribution:dictionary.attribution,
       note:'Reviewed occurrence and general lexical gloss; not a verified English word alignment or interpretation in context.'});
     if(words.length===limit)return words;
   }
 }
 return words;
}
