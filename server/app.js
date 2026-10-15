import { selectSupportingSources } from './relevance.js';
import { chooseContextReference } from './context.js';
import express from 'express';
import { randomUUID, createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';
import { createStore } from './store.js';
import { createDemoProviders } from './demo.js';
import { createLiveProviders, validateStudy, explainSources } from './providers.js';
import { parseReference } from './references.js';
import { AppError } from './errors.js';

export function createApp(config, overrides = {}) {
  const app = express();
  const store = overrides.store || createStore(config);
  const providers = overrides.providers || (config.APP_MODE === 'demo' ? createDemoProviders() : createLiveProviders(config));
  app.disable('x-powered-by');
  app.set('trust proxy', config.TRUST_PROXY_HOPS);
  const allowedFrames = config.EMBED_ORIGINS.split(/\s+/).filter(Boolean).join(' ');
  app.use((req, res, next) => {
    res.set({
      'Content-Security-Policy': `default-src 'self'; script-src 'self'${config.APP_MODE === 'live' ? ' https://pkg.api.bible' : ''}; style-src 'self'; img-src 'self' data:; connect-src 'self'${config.APP_MODE === 'live' ? ' https://fums.api.bible' : ''}; font-src 'self'; object-src 'none'; base-uri 'none'; form-action 'none'; frame-ancestors 'self' ${allowedFrames}`,
      'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'no-referrer',
      'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
    });
    if (config.secureCookies) res.set('Strict-Transport-Security', 'max-age=31536000');
    next();
  });
  app.use('/api', (req, res, next) => {
    res.set('Cache-Control', 'no-store');
    const origin = req.get('origin');
    const fetchSite = req.get('sec-fetch-site');
    // Browsers set this forbidden header themselves. It remains accurate when
    // an HTTPS reverse proxy gives the app a different public origin. Keep the
    // configured origin as the fallback for clients without Fetch Metadata;
    // never infer trust from Host or forwarded headers.
    let validOrigin = false;
    try { const url = new URL(origin); validOrigin = ['https:', 'http:'].includes(url.protocol) && url.origin === origin; } catch { /* Missing/opaque origins are not accepted for writes. */ }
    const sameOrigin = validOrigin && (origin === config.PUBLIC_ORIGIN || fetchSite === 'same-origin');
    if ((origin && !sameOrigin) || (fetchSite && !['same-origin', 'none'].includes(fetchSite)))
      return next(new AppError(403, 'ORIGIN_DENIED', 'Open the study assistant from its configured website.'));
    if (req.method === 'POST' && !sameOrigin)
      return next(new AppError(403, 'ORIGIN_REQUIRED', 'This request requires the study assistant’s origin.'));
    next();
  });
  app.get('/api/health', (_req, res) => res.json({ status: 'ok', mode: config.APP_MODE }));
  app.get('/api/config', (req, res) => {
    store.rateLimit(req.ip, createHash('sha256').update(`bootstrap:${req.ip}`).digest('hex'));
    const session = store.session();
    res.json({ mode: config.APP_MODE, sessionToken: session.raw, maxMessageLength: 1500,
      methodology: 'KV Study Engine 3.0.1 · passage-study adaptation',
      examples: ['Study John 15:1–8', 'Walk through Psalm 23', 'What is grace?'] });
  });
  app.use('/api', express.json({ limit: '8kb', type: 'application/json' }));
  const sessionMiddleware = (req, _res, next) => {
    const session = store.session(req.get('x-tcf-session'), false);
    if (!session) return next(new AppError(401, 'SESSION_EXPIRED', 'This conversation has expired. Reload the page to begin a new study.'));
    req.studySession = session; next();
  };
  app.post('/api/session/reset', sessionMiddleware, (req, res) => {
    store.rateLimit(req.ip, req.studySession.id);
    store.reset(req.studySession.id); res.json({ ok: true });
  });
  app.post('/api/chat', sessionMiddleware, async (req, res, next) => {
    let began = false, reservation;
    const meter = { cost: 0, input: 0, output: 0 };
    try {
      store.rateLimit(req.ip, req.studySession.id);
      const body = z.object({ message: z.string().trim().min(1).max(1500) }).strict().safeParse(req.body);
      if (!body.success) throw new AppError(400, 'INVALID_MESSAGE', 'Enter a biblical question or passage, using 1–1,500 characters.');
      store.begin(req.studySession.id); began = true;
      if (config.APP_MODE === 'live') reservation = store.reserve();
      const route = await providers.route(body.data.message, req.studySession.history, meter);
      let answer;
      if (route.kind === 'unsupported') {
        answer = { mode: config.APP_MODE, kind: route.kind, sources: [], study: null,
          message: 'I can help with a passage study or a basic biblical question. Full topical surveys, original-language research, commentary searches, and deep dives are not available in this version. Try a specific passage or a narrower question.' };
      } else {
        const main = parseReference(route.main);
        if (!main) throw new AppError(422, 'INVALID_REFERENCE', 'Please specify a single chapter or verse range.');
        const references = [main.reference];
        for (const value of route.supporting) {
          const supporting = parseReference(value);
          if (!supporting) throw new AppError(502, 'INVALID_REFERENCE', 'A supporting Scripture reference could not be verified. Please try again.');
          if (!references.includes(supporting.reference)) references.push(supporting.reference);
        }
        const sources = [{ ...await providers.bible(references[0]), id: 'S1', role: 'Main passage' }];
        // The provider might return identical text for two differently named
        // references; don't present duplicate content as corroboration.
        const retrievedSupport = [];
        for (const reference of references.slice(1)) retrievedSupport.push({ ...await providers.bible(reference), role: 'Supporting Scripture' });
        for (const source of selectSupportingSources(sources[0], retrievedSupport)) sources.push({ ...source, id: `S${sources.length + 1}` });
        const contextReference = config.APP_MODE === 'live' ? chooseContextReference(main.reference, sources.map(s => s.reference)) : null;
        if (contextReference) {
          // Context is helpful but never permitted to block an otherwise valid
          // study when the provider cannot retrieve the excerpt.
          try { sources.push({ ...await providers.bible(contextReference), id: `S${sources.length + 1}`, role: 'Immediate context' }); }
          catch (error) { if (!['INVALID_REFERENCE', 'BIBLE_CONTENT', 'PROVIDER_ERROR'].includes(error.code)) throw error; }
        }
        const study = validateStudy(await providers.study(route, sources, meter), sources);
        answer = { mode: config.APP_MODE, kind: route.kind, sources: explainSources(study, sources), study, ...(route.key ? { demoKey: route.key } : {}) };
      }
      // Analytics tokens belong only in the immediate response, never stored in history.
      const retained = structuredClone(answer);
      for (const source of retained.sources) delete source.fumsToken;
      store.save(req.studySession.id, [...req.studySession.history, { question: body.data.message, answer: retained }]);
      if (reservation) { store.settle(reservation, meter, false); reservation = undefined; }
      res.json(answer);
    } catch (error) {
      if (reservation) store.settle(reservation, meter, true);
      next(error);
    } finally { if (began) store.end(req.studySession.id); }
  });
  app.use(express.static(fileURLToPath(new URL('../public', import.meta.url)), { dotfiles: 'deny', maxAge: 0 }));
  app.use((_req, res) => res.status(404).json({ error: { code: 'NOT_FOUND', message: 'This page was not found.' } }));
  app.use((error, _req, res, _next) => {
    const requestId = randomUUID();
    const status = error instanceof AppError ? error.status : error.status === 413 ? 413 : error.type === 'entity.parse.failed' ? 400 : 500;
    if (status === 429) res.set('Retry-After', '60');
    // Never log messages, prompts, provider bodies, authorization, or session tokens.
    if (status >= 500) console.error(JSON.stringify({ requestId, status, code: error.code || 'INTERNAL_ERROR', ...(error.upstream ? { upstream: error.upstream } : {}), ...(error.citationDiagnostic ? { citationDiagnostic: error.citationDiagnostic } : {}) }));
    res.status(status).json({ error: { code: error.code || (status === 413 ? 'MESSAGE_TOO_LARGE' : 'REQUEST_ERROR'),
      message: error instanceof AppError ? error.message : status === 413 ? 'Your message is too large.' : status === 400 ? 'Send a valid JSON message.' : 'The study assistant encountered a problem. Please try again.', requestId } });
  });
  return { app, store };
}
