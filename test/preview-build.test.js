import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { Script } from 'node:vm';

const repository = fileURLToPath(new URL('../', import.meta.url));
const bundledModules = [
  'server/errors.js', 'server/references.js', 'server/demo.js',
  'public/study-export.js', 'public/inductive-guide.js', 'public/app.js',
];

for (const [label, newline] of [['LF', '\n'], ['CRLF', '\r\n']]) {
  test(`offline preview emits executable JavaScript from ${label} source files`, t => {
    const directory = mkdtempSync(join(tmpdir(), 'tcf-preview-build-'));
    t.after(() => rmSync(directory, { recursive: true, force: true }));
    for (const folder of ['server', 'public']) {
      cpSync(join(repository, folder), join(directory, folder), { recursive: true });
    }
    mkdirSync(join(directory, 'scripts'));
    cpSync(join(repository, 'scripts/build-preview.js'), join(directory, 'scripts/build-preview.js'));
    for (const module of bundledModules) {
      const path = join(directory, module);
      const source = readFileSync(path, 'utf8').replace(/\r?\n/g, newline);
      writeFileSync(path, source);
    }

    const result = spawnSync(process.execPath, ['scripts/build-preview.js'], {
      cwd: directory, encoding: 'utf8', timeout: 15_000,
    });
    assert.ifError(result.error);
    assert.equal(result.status, 0, result.stderr);
    const html = readFileSync(join(directory, 'preview/tcf-study-demo.html'), 'utf8');
    const script = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].at(-1)?.[1];
    assert.ok(script, 'The offline HTML must contain its application script');
    assert.doesNotThrow(() => new Script(script));
  });
}
