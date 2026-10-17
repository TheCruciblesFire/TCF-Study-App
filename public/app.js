import { formatStudyNotes } from './study-export.js';
const $ = selector => document.querySelector(selector);
const form = $('#chat-form'), input = $('#question'), sendButton = $('#send-button');
const conversation = $('#conversation'), welcome = $('#welcome'), status = $('#request-status');
let config, busy = false;
let nextTurnId = 0;
let studyMode = 'explore';
function setStudyMode(mode) {
  studyMode = mode === 'blb' ? 'blb' : 'explore';
  document.querySelectorAll('[data-study-mode]').forEach(button => { button.setAttribute('aria-pressed', String(button.dataset.studyMode === studyMode)); });
  $('#study-mode-description').textContent = studyMode === 'blb'
    ? 'Search Blue Letter Bible directly. Results open on blueletterbible.org in a new tab.'
    : 'Ask a biblical question or enter a passage below.';
  $('#blb-gateway').hidden = studyMode !== 'blb';
  document.querySelectorAll('.starter-heading, .starter-grid, .welcome-caption').forEach(node => { node.hidden = studyMode === 'blb'; });
  document.querySelector('.composer-wrap').hidden = studyMode === 'blb';
  input.placeholder = 'Enter a passage or ask a biblical question…';
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
function blbSearchUrl(criteria, translation = 'CSB') {
  const url = new URL('https://www.blueletterbible.org/search/search.cfm');
  url.searchParams.set('Criteria', criteria);
  url.searchParams.set('t', translation);
  return url.href;
}
function blbPassageUrl(value) {
  const url = new URL(value);
  if (url.protocol !== 'https:' || url.hostname !== 'www.blueletterbible.org' ||
      !/^\/(?:csb|kjv)\/[a-z0-9]+\/\d+\/\d+\/?$/i.test(url.pathname)) throw Error('Invalid Bible passage link');
  url.pathname = url.pathname.replace(/^\/kjv\//i, '/csb/');
  return url.href;
}
function blbVerseToolsUrl(value) {
  const url = new URL(blbPassageUrl(value));
  url.pathname = `/verse${url.pathname}`;
  return url.href;
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
    const link = el('a', 'source-link', 'Read this passage on Blue Letter Bible (CSB) ↗');
    link.href = blbPassageUrl(source.url); link.target = '_blank'; link.rel = 'noopener noreferrer'; content.append(link);
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
    window.fums('trackView', [...answer.sources.map(source => source.fumsToken), answer.csbPassage?.fumsToken].filter(Boolean));
  }
  card.append(el('p', 'answer-meta', `${answer.sources[0].reference} · ${answer.mode === 'demo' ? 'CURATED DEMO' : 'WEB-TEXT STUDY'}`), el('h2', '', answer.study.title));
  if (answer.csbPassage) {
    const passage = answer.csbPassage;
    const reading = el('section', 'csb-reading');
    reading.append(el('h3', '', `${passage.reference} · Christian Standard Bible`),
      el('p', 'scripture-text', passage.text), el('p', 'copyright', passage.copyright));
    const handoff = el('a', 'source-link', 'Study this passage further in Blue Letter Bible (CSB) ↗');
    try {
      handoff.href = blbPassageUrl(passage.url); handoff.target = '_blank'; handoff.rel = 'noopener noreferrer';
      reading.append(handoff);
    } catch { /* Keep the CSB reading available if the external URL is invalid. */ }
    reading.append(el('p', 'source-disclosure', 'CSB is displayed for reading. The AI study below uses the public-domain World English Bible (WEB).'));
    card.append(reading);
  }
  const sections = [['Passage & context', [answer.study.context]], ['Observe the text', answer.study.observations], ['Understand in context', answer.study.interpretation], ['Theological conclusions', answer.study.theology], ['Christ & the wider story', answer.study.connections], ['Put it into practice', answer.study.application]];
  for (const [heading, items] of sections) {
    if (!items.length) continue;
    const section = el('section', 'answer-section');
    const liveHeading = { 'Passage & context': 'Read the passage in context', 'Observe the text': 'What to look for', 'Understand in context': 'Interpretive questions', 'Theological conclusions': 'Theological questions', 'Christ & the wider story': 'Wider story to consider', 'Put it into practice': 'Consider a response' };
    section.append(el('h3', '', answer.grounding === 'reference_only' ? liveHeading[heading] : heading));
    for (const item of items) section.append(paragraphWithEvidence(item, answer.sources, turnId));
    card.append(section);
  }
  if (answer.commentaryPilot && answer.study.commentaryInsight?.noteId === answer.commentaryPilot.id) {
    const note = answer.commentaryPilot;
    const section = el('section', 'answer-section commentary-pilot');
    section.append(el('h3', '', 'A study note to consider'), el('p', '', answer.study.commentaryInsight.text));
    const credit = el('p', 'source-disclosure', 'AI summary adapted from ');
    const original = el('a', 'source-link', note.title);
    original.href = note.sourceViewUrl; original.target = '_blank'; original.rel = 'noopener noreferrer';
    original.textContent = `${note.title} for ${note.reference} ↗`;
    const license = el('a', 'source-link', note.license);
    license.href = note.licenseUrl; license.target = '_blank'; license.rel = 'noopener noreferrer';
    credit.append(original, document.createTextNode('. ' + note.copyright + ' · '), license);
    section.append(credit);
    const publisher = el('a', 'source-link', 'Publisher downloads ↗');
    publisher.href = note.sourceUrl; publisher.target = '_blank'; publisher.rel = 'noopener noreferrer';
    section.append(el('p', 'source-disclosure', 'Read the linked chapter notes on Bible Strong, which republishes Tyndale’s notes. '));
    section.lastElementChild.append(publisher);
    const noteDetails = el('details', 'commentary-source');
    noteDetails.append(el('summary', '', 'See the source summary sent to the assistant'), el('p', '', note.text));
    section.append(noteDetails);
    try {
      const url = new URL(note.blbUrl);
      if (url.protocol === 'https:' && url.hostname === 'www.blueletterbible.org' && Array.isArray(note.keywords)) {
        const deepDive = el('p', 'commentary-keywords', 'Explore in Blue Letter Bible: ');
        note.keywords.slice(0, 3).forEach((word, index) => {
          if (index) deepDive.append(document.createTextNode(' · '));
          const link = el('a', 'source-link', word);
          link.href = blbSearchUrl(word); link.target = '_blank'; link.rel = 'noopener noreferrer';
          link.setAttribute('aria-label', 'Explore ' + word + ' in ' + note.reference + ' on Blue Letter Bible');
          deepDive.append(link);
        });
        section.append(deepDive, el('p', 'source-disclosure', 'Each word opens a CSB word search on BLB. Select a matching verse and its Tools for language study; these English words are not verified Strong’s entries.'));
      }
    } catch { /* The attributed note remains available without the external link. */ }
    card.append(section);
  }
  try {
    const main = answer.sources[0];
    const commentary = el('section', 'answer-section blb-commentary-handoff');
    commentary.append(el('h3', '', 'Study this passage with BLB commentaries'));
    const link = el('a', 'source-link', `Explore commentaries for ${main.reference} ↗`);
    link.href = blbVerseToolsUrl(main.url); link.target = '_blank'; link.rel = 'noopener noreferrer';
    commentary.append(link, el('p', 'source-disclosure', 'This opens the first verse in Blue Letter Bible’s tools. Choose Commentaries to browse the available text resources. BLB commentaries were not used to generate this answer.'));
    card.append(commentary);
  } catch { /* The study remains available if the external handoff URL is invalid. */ }
  const further = el('section', 'answer-section'); further.append(el('h3', '', 'Keep exploring'));
  const list = el('ul'); for (const question of answer.study.furtherStudy) list.append(el('li', '', question)); further.append(list); card.append(further);
  if (answer.study.caveat) card.append(el('p', 'study-caveat', answer.study.caveat));
  const sources = el('div', 'source-list'); sources.append(el('h3', '', 'READ THE SCRIPTURE · VERIFIED SOURCE SET'));
  for (const source of answer.sources) sources.append(sourceCard(source, turnId));
  sources.append(el('p', 'source-disclosure', answer.mode === 'demo' ? 'Source base: curated KJV passages and prepared study notes. This is a demonstration, not a generated answer to every question.' : answer.csbPassage ? 'The CSB passage above is displayed from API.Bible but is not sent to OpenAI or copied into study notes. The public-domain WEB passage below is supplied to the AI. An attributed study-note summary informs the labeled insight. Blue Letter Bible was not consulted by the AI.' : 'The public-domain WEB passage is displayed from API.Bible and supplied to the AI for this study. Verify every explanation against the displayed passage. Linked resources were not consulted.'));
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
  'The first version supports passage studies and basic biblical questions. Christological and canonical connections belong only where the source passages support them. Original-language research and comprehensive commentary searches are not included. A small attributed study-note pilot may appear for selected passages.',
  'For the two-passage pilot, live mode displays CSB from API.Bible and sends only public-domain WEB Scripture text to OpenAI. Demo mode uses public-domain KJV examples. This app adapts the methodology; it does not run the ChatGPT plugin.',
]));
$('#privacy-button').addEventListener('click', () => openInfo('Study with care.', config?.preview ? [
  'This is a self-contained offline demo with three prepared studies. Questions and temporary conversation history stay in this page’s memory. No server, API calls, cookies, or local storage are used. Closing or reloading the file clears the conversation.',
  'Scripture and study notes are curated examples. Follow-up questions reopen the selected example; they are not live AI answers. External Blue Letter Bible links open only when you choose them.',
  'The hosted app requires a separate backend and authorized API credentials for live studies. Never put API keys in this demo or in SnapPages.',
] : [
  'No visitor account is required, and this app sets no cookies. A temporary session token stays in this page’s memory. Reloading starts a new conversation. Up to six study exchanges are held on the server for 24 hours after your last successful study, with expired conversations removed on the next request.',
  'In live mode, your question, recent questions and passage references, and the retrieved public-domain WEB text are sent to OpenAI. In the limited commentary pilot, an attributed public study-note summary is also sent for selected passages. The pilot CSB passage is displayed for reading only and is not sent to OpenAI or included in copied notes. Blue Letter Bible receives a chosen word or passage reference only when you open its link. API.Bible’s required FUMS script uses browser local/session storage for device and session identifiers and reports Scripture usage. Provider privacy and retention terms apply. Do not share sensitive personal information.',
  'New study clears the current server conversation. Cost records contain token counts and estimated costs, not conversation text. A keyed hash of your IP address is used temporarily to enforce usage limits.',
  'AI can make mistakes even when given the displayed WEB text. A real reference does not verify a suggested interpretation. Read the Scripture sources, consider context, and seek trusted pastoral guidance when needed. This assistant is not an emergency or professional counseling service.',
]));
dialog.querySelector('.dialog-close').addEventListener('click', () => dialog.close());
dialog.addEventListener('click', event => { if (event.target === dialog) { const r = dialog.getBoundingClientRect(); if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) dialog.close(); } });
setBusy(false); connect();
