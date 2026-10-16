import { describeStudyMode, createStudyContract } from './engine.js';

// The application owns the existing model router, Bible retrieval and limits.
// This adapter permits only reviewed engine modes; no additional model calls.
export function selectStudyWorkflow(route) {
  if (!route || typeof route !== 'object' || !['question', 'passage', 'unsupported'].includes(route.kind))
    return Object.freeze({ kind: 'unsupported', supported: false, reason: 'unrecognized_mode' });
  const mode = describeStudyMode(route.kind);
  return Object.freeze({ kind: mode.kind, supported: mode.supported,
    reason: mode.supported ? 'approved_mode' : 'unsupported_mode' });
}

export async function runRoutedStudy({ message, history = [], meter, providers, normalizeRoute, retrieveSources, verifyStudy }) {
  if (typeof message !== 'string' || !Array.isArray(history) || !providers ||
      typeof providers.route !== 'function' || typeof providers.study !== 'function' ||
      typeof normalizeRoute !== 'function' || typeof retrieveSources !== 'function' ||
      typeof verifyStudy !== 'function') throw new TypeError('An approved study workflow and dependencies are required');
  const route = normalizeRoute(await providers.route(message, history, meter), message, history);
  const workflow = selectStudyWorkflow(route);
  if (!workflow.supported) return { route, workflow, sources: [], study: null };
  const sources = await retrieveSources(route);
  const contract = createStudyContract({ route, sources });
  const study = verifyStudy(await providers.study(route, sources, meter), sources);
  return { route, workflow, sources, study, contract };
}
