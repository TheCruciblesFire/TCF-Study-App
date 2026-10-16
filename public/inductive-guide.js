// A voluntary, local-only guided reflection on an existing sourced study.
// This is not automated grading or a new AI study mode.
export const INDUCTIVE_STAGES = Object.freeze([
  Object.freeze({ title: 'Observation', prompt: 'Read the controlling passage. What repeated words, contrasts, commands, people, or changes do you notice? Describe what is there before explaining it.' }),
  Object.freeze({ title: 'Interpretation', prompt: 'What does the passage mean in its literary context? Which observations support your reading? Note uncertainty rather than assuming a preferred framework.' }),
  Object.freeze({ title: 'Application', prompt: 'In light of what the passage actually teaches, what faithful response may follow? Keep the response specific, gracious, and proportionate.' }),
]);
export function createInductiveGuide({ sections, reference, onStatus = () => {} }) {
  if (!Array.isArray(sections) || sections.length !== 3 || sections.some(group => !Array.isArray(group)))
    throw new TypeError('Expected the three existing study-section groups');
  const el = (tag, cls, text) => {
    const node = document.createElement(tag);
    if (cls) node.className = cls;
    if (text !== undefined) node.textContent = text;
    return node;
  };
  const root = el('section', 'inductive-guide');
  root.setAttribute('aria-label', 'Guided inductive Bible study');
  const intro = el('p', 'inductive-guide-intro', 'Want to work through the text yourself? Use a guided Observe → Interpret → Apply sequence. Your responses stay in this browser tab and are not sent to the server.');
  const start = el('button', 'inductive-guide-start', 'Start guided study');
  start.type = 'button';
  root.append(el('h3', '', 'Study the passage step by step'), intro, start);
  const working = el('div', 'inductive-guide-work'); working.hidden = true; root.append(working);
  const notes = ['', '', ''];
  let stage = 0;
  const allSections = sections.flat();
  const reveal = n => {
    sections.forEach((group, i) => group.forEach(section => { section.hidden = i > n; }));
  };
  function renderStage() {
    working.replaceChildren();
    if (stage === 3) {
      allSections.forEach(section => { section.hidden = false; });
      working.append(el('h4', '', 'Guided study complete'), el('p', '', 'Your observations, interpretation, and application are your own reflections. Compare them with the sourced study below; they have not been evaluated or verified.'));
      const copy = el('button', 'inductive-guide-next', 'Copy my reflection notes'); copy.type = 'button';
      copy.addEventListener('click', async () => {
        const output = [reference, ...INDUCTIVE_STAGES.map((item,i) => item.title + '\n' + (notes[i] || '(No notes recorded)'))].join('\n\n');
        try { await navigator.clipboard.writeText(output); onStatus('Your reflection notes were copied.'); }
        catch { onStatus('Copy was blocked by your browser. Select and copy your notes from the fields before finishing.'); }
      });
      working.append(copy);
      working.append(el('pre', 'inductive-guide-notes', INDUCTIVE_STAGES.map((item,i) => item.title + '\\n' + (notes[i] || '(No notes recorded)')).join('\\n\\n')));
      return;
    }
    const current = INDUCTIVE_STAGES[stage];
    const step = el('p', 'inductive-guide-step', 'STEP ' + (stage + 1) + ' OF 3 · ' + current.title.toUpperCase());
    const prompt = el('p', 'inductive-guide-prompt', current.prompt);
    const label = el('label', 'inductive-guide-label', 'Your ' + current.title.toLowerCase() + ' notes');
    const field = el('textarea', 'inductive-guide-field'); field.rows = 4; field.maxLength = 3000;
    field.value = notes[stage]; field.id = 'inductive-note-' + reference.replace(/[^a-z0-9]/gi, '-') + '-' + stage;
    label.htmlFor = field.id;
    field.addEventListener('input', () => { notes[stage] = field.value; });
    const actions = el('div', 'inductive-guide-actions');
    if (stage > 0) {
      const back = el('button', 'inductive-guide-back', 'Previous step'); back.type = 'button';
      back.addEventListener('click', () => { stage--; reveal(stage); renderStage(); });
      actions.append(back);
    }
    const next = el('button', 'inductive-guide-next', stage === 2 ? 'Finish and show full study' : 'Review this step and continue');
    next.type = 'button';
    next.addEventListener('click', () => {
      notes[stage] = field.value;
      // Show the matching existing explanations, without claiming to grade notes.
      reveal(stage);
      stage++;
      renderStage();
      onStatus('Study step updated. Read the supporting study sections to compare your observations.');
    });
    actions.append(next);
    working.append(step, prompt, label, field, actions);
  }
  start.addEventListener('click', () => {
    start.hidden = true; intro.hidden = true;
    stage = 0; working.hidden = false; reveal(-1); renderStage();
    onStatus('Guided study started. Read the Scripture source before recording your observations.');
  });
  return root;
}
