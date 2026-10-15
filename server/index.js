import { loadConfig } from './config.js';
import { createApp } from './app.js';

try {
  const config = loadConfig();
  const { app, store } = createApp(config);
  const server = app.listen(config.PORT, config.HOST, () => {
    console.log(`TCF Study Assistant listening on port ${config.PORT} (${config.APP_MODE} mode)`);
  });
  server.requestTimeout = 180_000;
  for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => {
    server.close(() => { store.close(); process.exit(0); });
    setTimeout(() => process.exit(1), 10_000).unref();
  });
} catch (error) { console.error(error.message); process.exitCode = 1; }
