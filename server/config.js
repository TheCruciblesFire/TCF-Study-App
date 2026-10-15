import { z } from 'zod';
import { resolve } from 'node:path';

const money = z.coerce.number().positive().finite();
const schema = z.object({
  APP_MODE: z.enum(['demo', 'live']).default('demo'),
  PORT: z.coerce.number().int().min(1).max(65535).default(3000),
  HOST: z.string().default('0.0.0.0'),
  PUBLIC_ORIGIN: z.url().default('http://localhost:3000'),
  EMBED_ORIGINS: z.string().default('https://thecruciblesfire.org https://www.thecruciblesfire.org'),
  TCF_OPENAI_API_KEY: z.string().default(''),
  TCF_BIBLE_API_KEY: z.string().default(''),
  BIBLE_ID: z.string().regex(/^[\w-]*$/).default(''),
  OPENAI_MODEL: z.string().regex(/^[\w.:-]+$/).default('gpt-4.1-mini'),
  INPUT_USD_PER_MILLION: money.default(0.4),
  OUTPUT_USD_PER_MILLION: money.default(1.6),
  DAILY_BUDGET_USD: money.default(2),
  MONTHLY_BUDGET_USD: money.default(20),
  MAX_TURN_USD: money.default(0.03),
  REQUESTS_PER_MINUTE: z.coerce.number().int().min(1).max(100).default(8),
  REQUESTS_PER_DAY: z.coerce.number().int().min(1).max(1000).default(40),
  TRUST_PROXY_HOPS: z.coerce.number().int().min(0).max(10).default(0),
  DATA_DIR: z.string().default('.data'),
});
export function loadConfig(env = process.env) {
  const parsed = schema.safeParse(env);
  if (!parsed.success) throw new Error(`Invalid configuration: ${parsed.error.issues.map(i => i.path.join('.')).join(', ')}`);
  const config = parsed.data;
  for (const value of [config.PUBLIC_ORIGIN, ...config.EMBED_ORIGINS.split(/\s+/).filter(Boolean)]) {
    const url = new URL(value);
    if (!['http:', 'https:'].includes(url.protocol) || url.origin !== value || url.hostname.includes('*')) throw new Error('Origins must be exact HTTP(S) origins without paths, wildcards, or trailing slashes.');
  }
  config.secureCookies = new URL(config.PUBLIC_ORIGIN).protocol === 'https:';
  config.dataDir = resolve(config.DATA_DIR);
  if (config.APP_MODE === 'live') {
    const missing = ['TCF_OPENAI_API_KEY', 'TCF_BIBLE_API_KEY', 'BIBLE_ID'].filter(k => !config[k]);
    if (missing.length) throw new Error(`Live mode requires: ${missing.join(', ')}`);
  }
  return config;
}
