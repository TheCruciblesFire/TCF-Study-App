import { readdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
function files(root) {
  return readdirSync(root, { withFileTypes: true }).flatMap(file => file.isDirectory() ? files(`${root}/${file.name}`) : file.name.endsWith('.js') ? [`${root}/${file.name}`] : []);
}
for (const file of [...files('server'), ...files('public'), ...files('scripts'), ...files('test')]) {
  const result = spawnSync(process.execPath, ['--check', file], { stdio: 'inherit' });
  if (result.status !== 0) process.exit(result.status || 1);
}
console.log('JavaScript syntax checks passed.');
