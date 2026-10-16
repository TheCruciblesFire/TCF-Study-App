import { ENGINE_VERSION } from './engine.js';
import { runRoutedStudy } from './router.js';

// This is an in-process interface, NOT an HTTP authentication boundary.
// Only the host application can supply the private dependencies/capability.
export const INTERFACE_VERSION = '1.0';
const OPERATIONS = Object.freeze(['study.execute', 'engine.describe']);

export function createEngineInterface(dependencies) {
  if (!dependencies || typeof dependencies.normalizeRoute !== 'function' ||
      typeof dependencies.retrieveSources !== 'function' || typeof dependencies.verifyStudy !== 'function' ||
      typeof dependencies.providers?.route !== 'function' || typeof dependencies.providers?.study !== 'function') {
    throw new TypeError('Trusted engine dependencies are required');
  }
  const capability = Object.freeze({ execute: true });
  const describe = () => Object.freeze({
    interfaceVersion: INTERFACE_VERSION, engineVersion: ENGINE_VERSION,
    operations: OPERATIONS, enabledModes: Object.freeze(['passage', 'question']),
    transport: 'in-process', remoteAccess: false,
  });
  async function invoke(request, token) {
    if (token !== capability) throw new Error('ENGINE_ACCESS_DENIED');
    if (!request || typeof request !== 'object' || Array.isArray(request) ||
        request.version !== INTERFACE_VERSION || !OPERATIONS.includes(request.operation))
      throw new TypeError('Unsupported engine operation or interface version');
    if (request.operation === 'engine.describe') return describe();
    if (typeof request.message !== 'string' || !request.message.trim() ||
        request.message.length > 1500 || !Array.isArray(request.history) ||
        request.history.length > 20 || !request.meter || typeof request.meter !== 'object')
      throw new TypeError('Invalid bounded study execution request');
    return runRoutedStudy({
      message: request.message, history: request.history, meter: request.meter,
      ...dependencies,
    });
  }
  return Object.freeze({ capability, invoke, describe });
}
