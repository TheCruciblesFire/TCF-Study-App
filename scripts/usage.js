import { loadConfig } from '../server/config.js';
import { createStore } from '../server/store.js';
const store = createStore(loadConfig());
try { console.table(store.summary()); } finally { store.close(); }
