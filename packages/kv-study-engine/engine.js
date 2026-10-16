import { methodology } from './methodology.js';

export const ENGINE_VERSION = '0.1.0';
export const SUPPORTED_MODES = Object.freeze(['passage', 'question']);

// Fail closed: this is a bounded compatibility package, NOT the entire KV plugin.
export function describeStudyMode(kind) {
  if (!SUPPORTED_MODES.includes(kind)) return Object.freeze({ supported: false, kind: 'unsupported' });
  return Object.freeze({ supported: true, kind, methodology, review: 'source-grounded',
    limits: Object.freeze({ originalLanguage: false, externalResearch: false, specialistAudits: false }) });
}

// Model response is never treated as fully audited. The engine currently
// delegates existing live retrieval and model execution to server/providers.js.
export function createStudyContract({ route, sources } = {}) {
  if (!route || !Array.isArray(sources)) throw new TypeError('A route and retrieved sources are required');
  const mode = describeStudyMode(route.kind);
  if (!mode.supported) return Object.freeze({ ...mode, controllingReference: null, sourceIds: [] });
  if (!sources.length || !sources[0].reference) throw new TypeError('A verified controlling source is required');
  const sourceIds = sources.map(s => s.id);
  if (sourceIds.some(id => typeof id !== 'string' || !/^S[1-9][0-9]*$/.test(id)) || new Set(sourceIds).size !== sourceIds.length)
    throw new TypeError('Valid unique source IDs are required');
  return Object.freeze({ ...mode, controllingReference: sources[0].reference, sourceIds: Object.freeze(sourceIds) });
}
