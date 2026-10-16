// Phase 9A exit gate: deterministic audit of a bounded, reviewed verse index.
// This does not approve source mappings: independent approval is an input.
import { validateVerseToken } from '../server/verse-lexicon.js';

export function assessPhase9AExit(index, approvals, { maxTokens = 500 } = {}) {
 if (!Number.isInteger(maxTokens) || maxTokens < 1 || maxTokens > 5000)
   throw Error('Bounded sample limit required');
 const blockers=[];
 if (!index || !index.metadata || !['TAGNT','TAHOT'].includes(index.metadata.dataset) ||
     !/^[a-f0-9]{40}$/.test(index.metadata.sourceCommit ?? '') ||
     index.metadata.license!=='CC BY 4.0' || !index.entries || typeof index.entries!=='object')
   return {ready:false,blockers:['INVALID_SOURCE_INDEX'],checked:0};
 if (!Array.isArray(approvals) || !approvals.length)
   return {ready:false,blockers:['NO_INDEPENDENT_APPROVALS'],checked:0};
 const ids=new Set(),seen=new Set();let checked=0;
 for (const [reference,rows] of Object.entries(index.entries)) {
   if (!Array.isArray(rows)) {blockers.push('INVALID_VERSE_ROWS');continue;}
   for (const row of rows) {
     checked++;
     if(checked>maxTokens){blockers.push('EXCEEDS_BOUNDED_RELEASE');break;}
     const token=validateVerseToken(row);
     if(!token || token.reference!==reference){blockers.push('INVALID_TOKEN');continue;}
     const id=[reference,token.position,token.edition].join(':');
     if(seen.has(id))blockers.push('DUPLICATE_EDITION_POSITION');
     seen.add(id);ids.add(id);
   }
   if(checked>maxTokens)break;
 }
 for(const approval of approvals) {
   if(!approval || approval.reviewed!==true || !approval.independentSource ||
      !approval.reviewer || !approval.sourceRowSha256 ||
      !/^[a-f0-9]{64}$/.test(approval.sourceRowSha256) ||
      approval.sourceCommit!==index.metadata.sourceCommit ||
      !ids.has(approval.tokenId) || approval.verseAlignmentVerified!==true ||
      approval.lexicalMappingVerified!==true)
     blockers.push('UNAPPROVED_OR_UNMATCHED_TOKEN');
 }
 if(checked!==approvals.length)blockers.push('TOKENS_WITHOUT_APPROVAL');
 return {ready:blockers.length===0,blockers:[...new Set(blockers)],checked};
}
