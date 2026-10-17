import { formatStudyNotes } from './study-export.js';
import { createInductiveGuide } from './inductive-guide.js';
const $ = selector => document.querySelector(selector);
const form = $('#chat-form'), input = $('#question'), sendButton = $('#send-button');
const conversation = $('#conversation'), welcome = $('#welcome'), status = $('#request-status');
let config, busy = false;
let nextTurnId = 0;
let studyMode = 'explore';
function setStudyMode(mode) {
  studyMode = ['guided', 'blb'].includes(mode) ? mode : 'explore';
  document.querySelectorAll('[data-study-mode]').forEach(button => { button.setAttribute('aria-pressed', String(button.dataset.studyMode === studyMode)); });
  $('#study-mode-description').textContent = studyMode === 'blb'
    ? 'Search Blue Letter Bible directly. Results open on blueletterbible.org in a new tab.'
    : studyMode === 'guided'
      ? 'Enter a Scripture passage to begin guided Observation → Interpretation → Application. Your reflections remain in this browser tab.'
      : 'Ask a biblical question or enter a passage below.';
  $('#blb-gateway').hidden = studyMode !== 'blb';
  document.querySelectorAll('.starter-heading, .starter-grid, .welcome-caption').forEach(node => { node.hidden = studyMode === 'blb'; });
  document.querySelector('.composer-wrap').hidden = studyMode === 'blb';
  input.placeholder = studyMode === 'guided' ? 'Enter a passage, e.g. John 15:1–8…' : 'Enter a passage or ask a biblical question…';
}

const el = (tag, className, text) => {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
};
function setBusy(value) {
  busy = value; sendButton.disabled = value || !config; input.disabled = value || !config;
  document.querySelectorAll('[data-question], [data-new-study], .followup-chips button').forEach(button => { button.disabled = value || !config; });
  form.setAttribute('aria-busy', String(value));
}
function announce(message, error = false) { status.textContent = message; status.classList.toggle('error', error); }
function scrollToElement(element) { element.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'start' }); }
async function request(path, body) {
  let response;
  try {
    response = await fetch(path, { method: body ? 'POST' : 'GET', headers: { ...(body ? { 'Content-Type': 'application/json' } : {}), ...(config ? { 'X-TCF-Session': config.sessionToken } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}), signal: AbortSignal.timeout(160_000) });
  } catch { throw new Error('We couldn’t connect. Check your connection and try again.'); }
  let data;
  try { data = await response.json(); } catch { throw new Error('The server returned an unreadable response. Please try again.'); }
  if (!response.ok) throw new Error(data.error?.message || 'The request could not be completed.');
  return data;
}
async function connect() {
  try {
    const nextConfig = await request('/api/config');
    if (nextConfig.mode === 'live') await loadBibleReporting();
    config = nextConfig;
    const notice = $('#mode-notice');
    notice.textContent = config.preview ? 'OFFLINE DEMO · Three curated studies. Everything stays in this page. No server or live AI.' : config.mode === 'demo' ? 'DEMO EXPERIENCE · Three curated studies. No live AI or Bible API calls. Try an example below.' : 'LIVE STUDY · Responses use retrieved Scripture and AI. Read the sources and verify the explanation.';
    notice.classList.toggle('live', config.mode === 'live');
    setBusy(false);
  } catch (error) {
    $('#mode-notice').textContent = 'Your study space could not connect.';
    announce(error.message, true);
    const retry = el('button', 'reconnect', 'Reconnect'); retry.type = 'button';
    retry.addEventListener('click', () => { announce('Connecting…'); connect(); }); status.append(retry);
  }
}
let reportingReady = false;
let reportingPromise;
function loadBibleReporting() {
  if (reportingReady) return Promise.resolve();
  if (reportingPromise) return reportingPromise;
  // Current API.Bible documentation: https://docs.api.bible/resources/fair-use
  // Only load the fixed first-party client, never a script from Bible content.
  window.fumsData = window.fumsData || [];
  window.fums = window.fums || function () { window.fumsData.push(arguments); };
  const queuedReporter = window.fums;
  reportingPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://pkg.api.bible/fumsV3.min.js'; script.async = true;
    let finished = false;
    const finish = error => {
      if (finished) return;
      finished = true; clearTimeout(timer);
      if (error) { script.remove(); reject(error); }
      else { reportingReady = true; resolve(); }
    };
    const failure = () => new Error('Required Bible usage reporting could not initialize. Allow the Bible provider’s script and browser storage, then reconnect.');
    const timer = setTimeout(() => finish(failure()), 15_000);
    script.onload = () => finish(typeof window.fums === 'function' && window.fums !== queuedReporter ? null : failure());
    script.onerror = () => finish(failure());
    document.head.append(script);
  }).catch(error => {
    reportingPromise = undefined;
    throw error;
  });
  return reportingPromise;
}
function sourceCard(source, turnId) {
  const details = el('details', 'source-card'); details.id = `${turnId}-${source.id}`;
  const summary = el('summary'); summary.append(el('strong', '', `${source.reference} · ${source.translation}`), el('span', 'source-tag', source.role.toUpperCase()));
  const content = el('div', 'source-content');
  content.append(el('p', 'scripture-text', source.text), el('p', 'copyright', source.copyright));
  if (source.info) content.append(el('p', 'copyright', source.info));
  if (source.selectionReason) content.append(el('p', 'source-disclosure', `Why this source: ${source.selectionReason}`));
  // Only server-constructed, allowlisted links. Model output never becomes a URL or HTML.
  try {
    const url = new URL(source.url);
    if (url.protocol === 'https:' && url.hostname === 'www.blueletterbible.org') {
      const link = el('a', 'source-link', 'Continue on Blue Letter Bible (KJV) ↗');
      link.href = url.href; link.target = '_blank'; link.rel = 'noopener noreferrer'; content.append(link);
    }
  } catch { /* Source text remains available if its external link is invalid. */ }
  details.append(summary, content); return details;
}
function paragraphWithEvidence(item, sources, turnId) {
  const p = el('p', '', item.text);
  const strengthLabels = { direct_text: 'Direct text', contextual_inference: 'Contextual interpretation', theological_synthesis: 'Theological synthesis', pastoral_application: 'Pastoral application', reading_prompt: 'Reading prompt' };
  if (strengthLabels[item.strength]) {
    const strength = el('span', 'evidence-strength', strengthLabels[item.strength]);
    strength.setAttribute('title', 'Classification of the reasoning step, not a confidence rating or independent verification.');
    p.append(strength, document.createTextNode(' '));
  }
  for (const id of item.evidence) {
    const source = sources.find(s => s.id === id);
    if (!source) continue;
    const button = el('button', 'evidence-link', source.reference); button.type = 'button';
    button.setAttribute('aria-label', `Read source: ${source.reference}`);
    button.addEventListener('click', () => {
      const details = document.getElementById(`${turnId}-${id}`); details.open = true;
      details.querySelector('summary').focus(); scrollToElement(details);
    });
    p.append(button);
  }
  return p;
}
function renderAnswer(answer, mount, turnId) {
  const label = el('div', 'assistant-label');
  label.append(document.createTextNode('TCF STUDY ASSISTANT'));
  const card = el('div', 'answer-card'); mount.append(label, card);
  if (!answer.study) { card.append(el('p', 'answer-message', answer.message)); return; }
  if (answer.mode === 'live' && reportingReady) {
    window.fums('trackView', answer.sources.map(source => source.fumsToken).filter(Boolean));
  }
  card.append(el('p', 'answer-meta', `${answer.sources[0].reference} · ${answer.mode === 'demo' ? 'CURATED DEMO' : 'WEB-TEXT STUDY'}`), el('h2', '', answer.study.title));
  const sections = [['Passage & context', [answer.study.context]], ['Observe the text', answer.study.observations], ['Understand in context', answer.study.interpretation], ['Theological conclusions', answer.study.theology], ['Christ & the wider story', answer.study.connections], ['Put it into practice', answer.study.application]];
  const guidedSections = [[], [], []];
  for (const [heading, items] of sections) {
    if (!items.length) continue;
    const section = el('section', 'answer-section');
    const liveHeading = { 'Passage & context': 'Read the passage in context', 'Observe the text': 'What to look for', 'Understand in context': 'Interpretive questions', 'Theological conclusions': 'Theological questions', 'Christ & the wider story': 'Wider story to consider', 'Put it into practice': 'Consider a response' };
    section.append(el('h3', '', answer.grounding === 'reference_only' ? liveHeading[heading] : heading));
    for (const item of items) section.append(paragraphWithEvidence(item, answer.sources, turnId));
    card.append(section);
    const group = heading === 'Observe the text' ? 0 :
      ['Understand in context', 'Theological conclusions', 'Christ & the wider story'].includes(heading) ? 1 :
      heading === 'Put it into practice' ? 2 : -1;
    if (group >= 0) guidedSections[group].push(section);
  }
  const guide = createInductiveGuide({ sections: guidedSections, reference: answer.sources[0].reference, onStatus: announce, autoStart: studyMode === 'guided',
    requestFeedback: answer.mode === 'live' ? (reference, notes) => request('/api/study/observation-feedback', { reference, notes }) : null,
    requestInterpretationFeedback: answer.mode === 'live' ? (reference, notes) => request('/api/study/interpretation-feedback', { reference, notes }) : null,
    requestApplicationFeedback: answer.mode === 'live' ? (reference, notes) => request('/api/study/application-feedback', { reference, notes }) : null });
  const contextSection = card.querySelector('.answer-section');
  card.insertBefore(guide, contextSection);
  const further = el('section', 'answer-section'); further.append(el('h3', '', 'Keep exploring'));
  const list = el('ul'); for (const question of answer.study.furtherStudy) list.append(el('li', '', question)); further.append(list); card.append(further);
  if (answer.study.caveat) card.append(el('p', 'study-caveat', answer.study.caveat));
  const sources = el('div', 'source-list'); sources.append(el('h3', '', 'READ THE SCRIPTURE · VERIFIED SOURCE SET'));
  for (const source of answer.sources) sources.append(sourceCard(source, turnId));
  sources.append(el('p', 'source-disclosure', answer.mode === 'demo' ? 'Source base: curated KJV passages and prepared study notes. This is a demonstration, not a generated answer to every question.' : 'The public-domain WEB passage is displayed from API.Bible and supplied to the AI for this study. Verify every explanation against the displayed passage. Linked resources were not consulted.'));
  if (answer.mode === 'live') {
    const attribution = el('p', 'source-disclosure', 'Scripture provided by ');
    const link = el('a', 'source-link', 'API.Bible');
    link.href = 'https://api.bible'; link.target = '_blank'; link.rel = 'noopener noreferrer';
    attribution.append(link); sources.append(attribution);
  }
  card.append(sources);
  const tools = el('div', 'study-actions');
  const copy = el('button', 'study-copy-button', 'Copy study notes');
  copy.type = 'button';
  copy.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(formatStudyNotes(answer));
      copy.textContent = 'Notes copied';
      announce('Study notes copied without full Scripture text.');
    } catch {
      announce('Copy was blocked by your browser. You can still review the study on this page.', true);
    }
  });
  tools.append(copy, el('p', 'study-copy-caption', 'Copies the outline and Scripture references, not the full Bible passage.'));
  card.append(tools);
  const followups = el('div', 'followup-chips');
  for (const text of ['How can I apply this today?', 'Explain the main idea']) {
    const button = el('button', '', text); button.type = 'button'; button.addEventListener('click', () => submitMessage(text)); followups.append(button);
  }
  card.append(followups);
}
async function submitMessage(message) {
  if (busy || !config || !message.trim()) return;
  if (message.trim().length > config.maxMessageLength) { announce('Please keep your question within 1,500 characters.', true); return; }
  setBusy(true); announce('Reading your question and preparing a study…');
  welcome.hidden = true; conversation.hidden = false;
  const turn = el('article', 'turn'); const turnId = `turn-${++nextTurnId}`; turn.id = turnId;
  turn.append(el('p', 'question-bubble', message));
  const pending = el('div', 'loading'); pending.setAttribute('aria-hidden', 'true');
  pending.append(el('span'), el('span'), el('span'), el('p', '', config.mode === 'demo' ? 'Opening a curated example…' : 'Following the text…'));
  turn.append(pending); conversation.append(turn); input.value = ''; input.style.height = '';
  scrollToElement(turn);
  try {
    const answer = await request('/api/chat', { message });
    pending.remove(); renderAnswer(answer, turn, turnId);
    announce(config.mode === 'demo' ? 'Curated example ready. Live mode is needed for open-ended answers.' : 'Study ready. Open the Scripture sources to read and verify.');
  } catch (error) {
    pending.remove(); turn.append(el('p', 'answer-message', error.message)); announce(error.message, true);
    const retry = el('button', 'retry-button', 'Try this question again'); retry.type = 'button';
    retry.addEventListener('click', () => { if (!busy) { turn.remove(); submitMessage(message); } }); turn.append(retry);
  } finally { setBusy(false); input.focus({ preventScroll: true }); }
}
// Omit an unused custom-range query parameter; BLB treats absent and empty differently.
const blbRange = $('#tcf-blb-range');
const blbForm = document.querySelector('.tcf-blb-form');
function syncBlbRange() { blbRange.disabled = !blbRange.value.trim(); }
blbRange.addEventListener('input', syncBlbRange);
blbForm.addEventListener('submit', event => {
  event.preventDefault();
  syncBlbRange();
  const criteria = $('#tcf-blb-criteria').value.trim();
  if (!criteria) { $('#tcf-blb-criteria').focus(); return; }
  const url = new URL('https://www.blueletterbible.org/search/search.cfm');
  url.searchParams.set('Criteria', criteria);
  url.searchParams.set('t', $('#tcf-blb-translation').value);
  if (!blbRange.disabled) url.searchParams.set('cscs', blbRange.value.trim());
  // A synchronous, user-initiated browser navigation; no hidden form POST or refresh.
  window.open(url.href, '_blank', 'noopener,noreferrer');
});
syncBlbRange();
document.querySelectorAll('[data-study-mode]').forEach(button => button.addEventListener('click', () => setStudyMode(button.dataset.studyMode)));
setStudyMode('explore');
form.addEventListener('submit', event => { event.preventDefault(); submitMessage(input.value.trim()); });
input.addEventListener('keydown', event => { if (event.key === 'Enter' && !event.shiftKey && !event.isComposing) { event.preventDefault(); submitMessage(input.value.trim()); } });
input.addEventListener('input', () => { input.style.height = 'auto'; input.style.height = `${Math.min(input.scrollHeight, 140)}px`; });
document.querySelectorAll('[data-question]').forEach(button => button.addEventListener('click', () => submitMessage(button.dataset.question)));
document.querySelectorAll('[data-new-study]').forEach(button => button.addEventListener('click', async () => {
  if (busy || !config) return;
  setBusy(true);
  try {
    await request('/api/session/reset', {});
    conversation.replaceChildren(); conversation.hidden = true; welcome.hidden = false; setStudyMode('explore'); input.value = ''; input.style.height = ''; announce('A fresh study. Where would you like to begin?');
    window.scrollTo({ top: 0, behavior: 'instant' });
    $('#study-body').scrollTo({ top: 0, behavior: 'instant' });
  } catch (error) { announce(error.message, true); }
  finally { setBusy(false); input.focus({ preventScroll: true }); }
}));
const dialog = $('#info-dialog');
function openInfo(title, paragraphs) {
  $('#dialog-title').textContent = title;
  $('#dialog-content').replaceChildren(...paragraphs.map(text => el('p', '', text)));
  dialog.showModal();
}
$('#about-button').addEventListener('click', () => openInfo('The text leads.', [
  'Our study approach adapts the KV Study Engine 3.0.1: observe the passage, interpret in context, distinguish theological synthesis, and then consider faithful application.',
  'The first version supports passage studies and basic biblical questions. Christological and canonical connections belong only where the source passages support them. Original-language and comprehensive commentary research are not included.',
  'Live mode uses public-domain World English Bible (WEB) passages from API.Bible. Demo mode uses public-domain KJV examples. This app adapts the methodology; it does not run the ChatGPT plugin.',
]));
$('#privacy-button').addEventListener('click', () => openInfo('Study with care.', config?.preview ? [
  'This is a self-contained offline demo with three prepared studies. Questions and temporary conversation history stay in this page’s memory. No server, API calls, cookies, or local storage are used. Closing or reloading the file clears the conversation.',
  'Scripture and study notes are curated examples. Follow-up questions reopen the selected example; they are not live AI answers. External Blue Letter Bible links open only when you choose them.',
  'The hosted app requires a separate backend and authorized API credentials for live studies. Never put API keys in this demo or in SnapPages.',
] : [
  'No visitor account is required, and this app sets no cookies. A temporary session token stays in this page’s memory. Reloading starts a new conversation. Up to six study exchanges are held on the server for 24 hours after your last successful study, with expired conversations removed on the next request.',
  'In live mode, your question, recent questions and passage references, and the retrieved public-domain WEB text are sent to OpenAI. Guided Study notes stay in this browser tab unless you choose an AI feedback button; then those notes and the controlling WEB passage are sent to OpenAI. API.Bible’s required FUMS script uses browser local/session storage for device and session identifiers and reports Scripture usage. Provider privacy and retention terms apply. Do not share sensitive personal information.',
  'New study clears the current server conversation. Cost records contain token counts and estimated costs, not conversation text. A keyed hash of your IP address is used temporarily to enforce usage limits.',
  'AI can make mistakes even when given the displayed WEB text. A real reference does not verify a suggested interpretation. Read the Scripture sources, consider context, and seek trusted pastoral guidance when needed. This assistant is not an emergency or professional counseling service.',
]));
dialog.querySelector('.dialog-close').addEventListener('click', () => dialog.close());
dialog.addEventListener('click', event => { if (event.target === dialog) { const r = dialog.getBoundingClientRect(); if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) dialog.close(); } });
setBusy(false); connect();
