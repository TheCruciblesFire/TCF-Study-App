import { parseReference } from './references.js';
import { validateRouteSources } from './providers.js';

// A narrow, deterministic guardrail for explicit follow-ups. New subjects and
// explicit passages remain under the regular router. Never use stale history
// when a user has supplied a new Scripture reference.
export function continuingPassage(message, history) {
  if (typeof message !== 'string' || parseReference(message)) return null;
  const text = message.trim().toLowerCase();
  const refersBack = /\b(this|that|those|these|it|its|here|there|previous|earlier|same|above|passage|chapter|verse|verses)\b/.test(text) ||
    /^(how (can|do|does) (i|we) apply|explain (more|further)|go deeper|tell me more|what (does|do) (he|she|they) mean)\b/.test(text);
  if (!refersBack) return null;
  const latest = [...history].reverse().find(turn => turn.answer?.study && turn.answer?.sources?.[0]?.reference);
  const reference = latest?.answer?.sources?.[0]?.reference;
  return reference && parseReference(reference) ? reference : null;
}

export function preserveFollowupPassage(route, message, history) {
  if (route.kind === 'unsupported') return route;
  const main = continuingPassage(message, history);
  if (!main || !parseReference(route.main)) return route;
  const controlling = parseReference(main);
  const supporting = route.supporting.filter(ref => {
    const parsed = parseReference(ref);
    return parsed && !(parsed.book === controlling.book && parsed.chapter === controlling.chapter &&
      (controlling.start === null || parsed.start === null ||
       (controlling.start <= parsed.end && parsed.start <= controlling.end)));
  });
  return validateRouteSources({ ...route, main: controlling.reference, supporting });
}
