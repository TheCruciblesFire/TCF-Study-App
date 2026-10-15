import { parseReference } from './references.js';
import { AppError } from './errors.js';

const texts = {
  'John 15:1–8': '[1] I am the true vine, and my Father is the husbandman. [2] Every branch in me that beareth not fruit he taketh away: and every branch that beareth fruit, he purgeth it, that it may bring forth more fruit. [3] Now ye are clean through the word which I have spoken unto you. [4] Abide in me, and I in you. As the branch cannot bear fruit of itself, except it abide in the vine; no more can ye, except ye abide in me. [5] I am the vine, ye are the branches: He that abideth in me, and I in him, the same bringeth forth much fruit: for without me ye can do nothing. [6] If a man abide not in me, he is cast forth as a branch, and is withered; and men gather them, and cast them into the fire, and they are burned. [7] If ye abide in me, and my words abide in you, ye shall ask what ye will, and it shall be done unto you. [8] Herein is my Father glorified, that ye bear much fruit; so shall ye be my disciples.',
  'John 14:21': '[21] He that hath my commandments, and keepeth them, he it is that loveth me: and he that loveth me shall be loved of my Father, and I will love him, and will manifest myself to him.',
  'Galatians 5:22–23': '[22] But the fruit of the Spirit is love, joy, peace, longsuffering, gentleness, goodness, faith, [23] Meekness, temperance: against such there is no law.',
  'Psalms 23': '[1] The LORD is my shepherd; I shall not want. [2] He maketh me to lie down in green pastures: he leadeth me beside the still waters. [3] He restoreth my soul: he leadeth me in the paths of righteousness for his name’s sake. [4] Yea, though I walk through the valley of the shadow of death, I will fear no evil: for thou art with me; thy rod and thy staff they comfort me. [5] Thou preparest a table before me in the presence of mine enemies: thou anointest my head with oil; my cup runneth over. [6] Surely goodness and mercy shall follow me all the days of my life: and I will dwell in the house of the LORD for ever.',
  'John 10:11': '[11] I am the good shepherd: the good shepherd giveth his life for the sheep.',
  'Psalms 46:1': '[1] God is our refuge and strength, a very present help in trouble.',
  'Ephesians 2:8–10': '[8] For by grace are ye saved through faith; and that not of yourselves: it is the gift of God: [9] Not of works, lest any man should boast. [10] For we are his workmanship, created in Christ Jesus unto good works, which God hath before ordained that we should walk in them.',
  'Romans 3:23–24': '[23] For all have sinned, and come short of the glory of God; [24] Being justified freely by his grace through the redemption that is in Christ Jesus:',
  'Titus 3:5': '[5] Not by works of righteousness which we have done, but according to his mercy he saved us, by the washing of regeneration, and renewing of the Holy Ghost;',
};
const say = (text, ...evidence) => ({ text, evidence: evidence.length ? evidence : ['S1'] });
const studies = {
  vine: {
    main: 'John 15:1–8', supporting: ['John 14:21', 'Galatians 5:22–23'],
    study: {
      title: 'Abiding in Christ',
      context: say('Jesus uses the relationship between a vine and its branches to explain his disciples’ dependence on him. The movement is from the Father’s care, to remaining in Jesus, to fruit that glorifies the Father.'),
      observations: [say('Jesus identifies himself as the true vine, the Father as the gardener, and his disciples as branches (vv. 1, 5).'), say('The repeated language of abiding connects dependence on Jesus, his words, prayer, and fruitfulness (vv. 4–8).')],
      interpretation: [say('To abide is to remain in Jesus rather than seek spiritual life independently of him. The branch image stresses dependence before achievement.'), say('The prayer promise belongs within abiding in Jesus and his words. It should not be detached from that setting and treated as a promise of anything we desire.')],
      theology: [say('Fruitfulness expresses dependence on Christ and brings glory to the Father. It is not a reason for self-sufficiency or boasting.')],
      connections: [say('John 14:21 connects love for Jesus with keeping his commands. This nearby teaching helps keep abiding from becoming an abstract feeling.', 'S1', 'S2'), say('Galatians describes the Spirit’s fruit in terms of character. This is a thematic connection, not a claim that John is quoting Paul.', 'S1', 'S3')],
      application: [say('Consider one area in which you are relying only on your own strength. Bring it to Jesus in prayer and let his words shape a concrete act of obedience.')],
      furtherStudy: ['What does the branch contribute, and what does it receive?', 'How do Jesus’ words shape the request in verse 7?'],
      caveat: 'Christians differ over how to understand the removed branches in verse 6. The passage clearly warns against failing to remain in Jesus; these few verses alone do not settle every question about perseverance.',
    },
  },
  shepherd: {
    main: 'Psalms 23', supporting: ['John 10:11', 'Psalms 46:1'],
    study: {
      title: 'The Shepherd who stays near',
      context: say('The psalm speaks of the LORD’s care through the images of a shepherd and a welcoming host. Provision and danger both appear in the same song.'),
      observations: [say('The shepherd leads, restores, and guides. In the valley, the speaker addresses God directly: “thou art with me” (v. 4).'), say('The valley and enemies remain present. God’s care is described within difficulty, not only after it disappears.')],
      interpretation: [say('The psalm’s confidence rests on the LORD’s presence and faithfulness. It does not promise that a faithful person will never face loss, threat, or suffering.')],
      theology: [say('God’s care includes guidance in righteousness and comfort amid danger. His name, rather than the speaker’s achievement, grounds the guidance in verse 3.')],
      connections: [say('Jesus calls himself the good shepherd who gives his life for the sheep. This provides a canonical resonance with the shepherd image; Psalm 23 itself does not explicitly narrate Jesus’ death.', 'S1', 'S2'), say('Psalm 46:1 similarly describes God as help in trouble, rather than promising that trouble never comes.', 'S1', 'S3')],
      application: [say('Name a present difficulty in prayer. Consider how trusting God’s presence could shape your next faithful step without denying the difficulty.')],
      furtherStudy: ['What changes when the psalm moves from speaking about God to speaking to God?', 'Which parts of the psalm describe guidance, and which describe comfort?'],
      caveat: 'The images are poetic. They should not be turned into a guarantee of financial prosperity or freedom from suffering.',
    },
  },
  grace: {
    main: 'Ephesians 2:8–10', supporting: ['Romans 3:23–24', 'Titus 3:5'],
    study: {
      title: 'Grace: received, then lived',
      context: say('These verses place salvation by grace alongside a life of good works. The order matters: God’s gift comes before the good works prepared for his people.'),
      observations: [say('Salvation is described as a gift, not the result of works, so boasting is excluded (vv. 8–9).'), say('Verse 10 still gives good works a place: those created in Christ Jesus are to walk in them.')],
      interpretation: [say('Here grace is God’s unearned gift in saving people through faith. Good works are the purpose and result of life in Christ, not the price paid for salvation.')],
      theology: [say('Salvation gives the credit to God and joins those he saves to a changed way of life. Receiving grace and practicing obedience belong together without making obedience a purchase price.')],
      connections: [say('Romans 3:23–24 places universal sin alongside justification given freely through redemption in Christ.', 'S1', 'S2'), say('Titus 3:5 likewise contrasts salvation according to mercy with works of righteousness as its basis.', 'S1', 'S3')],
      application: [say('Reflect on where you are tempted either to earn God’s acceptance or to treat obedience as irrelevant. Choose one good work as a response of gratitude.')],
      furtherStudy: ['Why does Paul exclude boasting?', 'How does verse 10 keep grace from being confused with indifference?'],
      caveat: 'This is a brief explanation from three passages, not a complete treatment of every Christian discussion about grace, faith, and salvation.',
    },
  },
};
export function createDemoProviders() {
  return {
    async route(message, history) {
      let key;
      if (/john\s*15|abid|vine|branch/i.test(message)) key = 'vine';
      else if (/psalm(?:s)?\s*23|shepherd/i.test(message)) key = 'shepherd';
      else if (/grace|ephesians\s*2/i.test(message)) key = 'grace';
      else if (/\b(that|this|it|apply|application|explain|mean|more|why|how)\b/i.test(message) && history.length) key = history.at(-1).answer.demoKey;
      if (!key) throw new AppError(422, 'DEMO_SCOPE', 'This demo has three curated examples: John 15:1–8, Psalm 23, and “What is grace?” Live mode supports other passages and biblical questions.');
      const selected = studies[key];
      return { kind: /\?$/.test(message) ? 'question' : 'passage', question: message, key, main: selected.main, supporting: selected.supporting };
    },
    async bible(reference) {
      const parsed = parseReference(reference);
      return { reference: parsed.reference, text: texts[parsed.reference], url: parsed.url, translation: 'KJV', copyright: 'King James Version. Public domain in the United States. Demo text; not a live API retrieval.', verseCount: (texts[parsed.reference].match(/\[\d+\]/g) || []).length };
    },
    async study(route) {
      const result = structuredClone(studies[route.key].study);
      result.context.strength = 'contextual_inference';
      for (const [section, strength] of Object.entries({ observations: 'direct_text', interpretation: 'contextual_inference', theology: 'theological_synthesis', connections: 'theological_synthesis', application: 'pastoral_application' })) {
        for (const entry of result[section]) entry.strength = strength;
      }
      if (/\b(apply|application|today|practice)\b/i.test(route.question)) result.title = `${result.title}: putting it into practice`;
      return result;
    },
  };
}
