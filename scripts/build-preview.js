import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';

// Produce an offline demo from the actual UI and curated fixtures, without
// server dependencies, provider credentials, or external asset requests.
const read = path => readFileSync(path, 'utf8');
const standaloneModule = path => read(path).replace(/^import .*;\r?\n/gm, '').replace(/^export /gm, '');
const flame = `data:image/png;base64,${readFileSync('public/brand/flame.png').toString('base64')}`;
const css = read('public/styles.css').replace(/url\(['"]?(\/fonts\/[^)'"\s]+)['"]?\)/g, (_match, path) =>
  `url("data:font/ttf;base64,${readFileSync(`public${path}`).toString('base64')}")`);
const fontLicenses = ['public/fonts/Barlow-Condensed-OFL.txt', 'public/fonts/Source-Sans-3-OFL.txt'].map(read).join('\n\n');
const bridge = `
const previewProvider = createDemoProviders();
let previewHistory = [];
async function fetch(path, options = {}) {
  try {
    if (path === '/api/config') return Response.json({ mode: 'demo', preview: true, sessionToken: 'offline-demo', maxMessageLength: 1500 });
    if (path === '/api/session/reset') { previewHistory = []; return Response.json({ok: true}); }
    if (path !== '/api/chat') return Response.json({error:{message:'This offline demo cannot make network requests.'}}, {status:404});
    const {message} = JSON.parse(options.body);
    if (typeof message !== 'string' || !message.trim() || message.length > 1500) throw new AppError(400, 'INVALID_MESSAGE', 'Enter a question of 1–1,500 characters.');
    const route = await previewProvider.route(message, previewHistory);
    const sources = [];
    for (const reference of [route.main, ...route.supporting]) sources.push({...await previewProvider.bible(reference), id:'S'+(sources.length+1), role:sources.length?'Supporting Scripture':'Main passage'});
    const answer = {mode:'demo',kind:route.kind,demoKey:route.key,sources,study:await previewProvider.study(route)};
    previewHistory = [...previewHistory, {question:message,answer}].slice(-6);
    return Response.json(answer);
  } catch(error) { return Response.json({error:{message:error.message}}, {status:error.status || 500}); }
}
`;
const javascript = [standaloneModule('server/errors.js'), standaloneModule('server/references.js'), standaloneModule('server/demo.js'), standaloneModule('public/study-export.js'), standaloneModule('public/inductive-guide.js'), bridge,
  standaloneModule('public/app.js')].join('\n');
let html = read('public/index.html')
  .replace('<title>Bible Study Assistant · The Crucible’s Fire</title>', '<title>TCF Bible Study Assistant · Offline Demo</title>')
  .replace('<link rel="stylesheet" href="/styles.css">', () => `<style>${css}</style>`)
  .replace('<script type="module" src="/app.js"></script>', '')
  .replaceAll('href="/brand/flame.png"', `href="${flame}"`)
  .replaceAll('src="/brand/flame.png"', `src="${flame}"`)
  .replace('class="brand" href="/"', 'class="brand" href="#main"')
  .replace('Connecting to your study space…', 'OFFLINE DEMO · Three curated studies. No API keys, server, or live AI.')
  .replace('</body>', () => `<noscript><p>This is the styled demo. Interactive studies require JavaScript enabled in the preview or your browser.</p></noscript><script type="text/plain" id="font-licenses">${fontLicenses.replace(/<\/script/gi, '<\\/script')}</script><script>(() => {\n${javascript.replace(/<\/script/gi, '<\\/script')}\n})();</script></body>`);
mkdirSync('preview', {recursive:true});
writeFileSync('preview/tcf-study-demo.html', html);
console.log('Created preview/tcf-study-demo.html — a self-contained, offline demo.');
