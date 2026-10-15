import { DatabaseSync } from 'node:sqlite';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { randomBytes, createHash, createHmac } from 'node:crypto';
import { join } from 'node:path';
import { AppError } from './errors.js';

export function createStore(config) {
  mkdirSync(config.dataDir, { recursive: true, mode: 0o700 });
  const secretFile = join(config.dataDir, 'visitor-key');
  let secret;
  try { secret = readFileSync(secretFile); } catch (error) {
    if (error.code !== 'ENOENT') throw error;
    secret = randomBytes(32); writeFileSync(secretFile, secret, { mode: 0o600, flag: 'wx' });
  }
  const db = new DatabaseSync(join(config.dataDir, 'study.sqlite'));
  db.exec(`PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000;
    CREATE TABLE IF NOT EXISTS sessions (id TEXT PRIMARY KEY, expires INTEGER NOT NULL, history TEXT NOT NULL DEFAULT '[]');
    CREATE TABLE IF NOT EXISTS limits (key TEXT NOT NULL, bucket TEXT NOT NULL, count INTEGER NOT NULL, PRIMARY KEY(key,bucket));
    CREATE TABLE IF NOT EXISTS usage (id TEXT PRIMARY KEY, created TEXT NOT NULL, model TEXT NOT NULL, cost REAL NOT NULL, status TEXT NOT NULL, input_tokens INTEGER NOT NULL DEFAULT 0, output_tokens INTEGER NOT NULL DEFAULT 0);
    CREATE INDEX IF NOT EXISTS usage_created ON usage(created);`);
  const active = new Set();
  const hash = value => createHash('sha256').update(value).digest('hex');
  let nextPrune = 0;
  function session(raw, create = true) {
    const now = Date.now();
    if (now > nextPrune) {
      db.prepare('DELETE FROM sessions WHERE expires < ?').run(now);
      db.prepare('DELETE FROM limits WHERE bucket < ?').run(new Date(now - 2 * 86400000).toISOString().slice(0, 10));
      nextPrune = now + 60_000;
    }
    if (/^[a-f0-9]{64}$/.test(raw || '')) {
      const id = hash(raw), row = db.prepare('SELECT * FROM sessions WHERE id = ? AND expires > ?').get(id, now);
      if (row) return { id, history: JSON.parse(row.history), fresh: false };
    }
    if (!create) return null;
    raw = randomBytes(32).toString('hex');
    const id = hash(raw);
    db.prepare('INSERT INTO sessions (id, expires) VALUES (?, ?)').run(id, now + 86400000);
    return { id, raw, history: [], fresh: true };
  }
  function rateLimit(ip, sessionId) {
    const key = createHmac('sha256', secret).update(ip).digest('hex');
    const date = new Date().toISOString();
    const buckets = [[key, date.slice(0, 16), config.REQUESTS_PER_MINUTE], [key, date.slice(0, 10), config.REQUESTS_PER_DAY], [sessionId, date.slice(0, 10), config.REQUESTS_PER_DAY]];
    db.exec('BEGIN IMMEDIATE');
    try {
      for (const [subject, bucket, max] of buckets) {
        const row = db.prepare('SELECT count FROM limits WHERE key=? AND bucket=?').get(subject, bucket);
        if ((row?.count || 0) >= max) throw new AppError(429, 'RATE_LIMIT', 'You’ve reached the study limit. Please try again later.');
      }
      for (const [subject, bucket] of buckets) db.prepare('INSERT INTO limits VALUES(?,?,1) ON CONFLICT(key,bucket) DO UPDATE SET count=count+1').run(subject, bucket);
      db.exec('COMMIT');
    } catch (error) { db.exec('ROLLBACK'); throw error; }
  }
  function reserve() {
    const now = new Date().toISOString();
    db.exec('BEGIN IMMEDIATE');
    try {
      const daily = db.prepare('SELECT COALESCE(SUM(cost),0) AS total FROM usage WHERE created >= ?').get(now.slice(0,10));
      const monthly = db.prepare('SELECT COALESCE(SUM(cost),0) AS total FROM usage WHERE created >= ?').get(now.slice(0,7));
      if (daily.total + config.MAX_TURN_USD > config.DAILY_BUDGET_USD + 1e-9 || monthly.total + config.MAX_TURN_USD > config.MONTHLY_BUDGET_USD + 1e-9)
        throw new AppError(503, 'BUDGET_LIMIT', 'The study assistant has reached its usage budget. Please return later.');
      const id = randomBytes(16).toString('hex');
      db.prepare('INSERT INTO usage(id,created,model,cost,status) VALUES(?,?,?,?,?)').run(id, now, config.OPENAI_MODEL, config.MAX_TURN_USD, 'reserved');
      db.exec('COMMIT'); return id;
    } catch (error) { db.exec('ROLLBACK'); throw error; }
  }
  return {
    session, rateLimit, reserve,
    begin(id) {
      if (active.has(id)) throw new AppError(409, 'BUSY', 'Please wait for your current study to finish.');
      if (active.size >= 6) throw new AppError(503, 'BUSY', 'The study assistant is busy. Please try again shortly.');
      active.add(id);
    },
    end(id) { active.delete(id); },
    save(id, history) { db.prepare('UPDATE sessions SET history=?, expires=? WHERE id=?').run(JSON.stringify(history.slice(-6)), Date.now() + 86400000, id); },
    reset(id) {
      if (active.has(id)) throw new AppError(409, 'BUSY', 'Please wait for your current study to finish.');
      db.prepare("UPDATE sessions SET history='[]' WHERE id=?").run(id);
    },
    settle(id, meter, failed) {
      db.prepare('UPDATE usage SET cost=?,status=?,input_tokens=?,output_tokens=? WHERE id=?')
        .run(meter.cost, failed ? 'failed' : 'completed', meter.input, meter.output, id);
    },
    summary() {
      return db.prepare('SELECT substr(created,1,10) AS day,model,status,COUNT(*) AS requests,SUM(input_tokens) AS input_tokens,SUM(output_tokens) AS output_tokens,SUM(cost) AS estimated_usd FROM usage GROUP BY day,model,status ORDER BY day DESC').all();
    },
    close() { db.close(); },
  };
}
