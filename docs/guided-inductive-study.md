# Guided Inductive Study — Learner Interaction

This opt-in, client-side layer supports Observe → Interpret → Apply on an **already retrieved and validated** passage study. Its intent is to encourage readers to read Scripture and record observations before consulting interpretive summaries.

## Behavior

- The existing chat and formatted study remain the default: no user workflow changes until **Start guided study** is selected.
- The guide prompts the user for observation, interpretation and application in that order.
- On starting, the relevant generated study sections are hidden and progressively revealed as the learner moves forward. Passage context, Scripture source cards, citation links, attribution and other study elements remain available.
- Notes remain in the page's memory unless the learner chooses a live **Get feedback** button. That request sends the selected stage notes and the session's controlling, verified public-domain WEB passage to OpenAI. Notes are not saved in server conversation history; reload clears the page's copy.
- An empty note is allowed; progressing is not a claim of mastery. Learner reflections are not graded or labeled as verified.
- Feedback is a bounded AI suggestion, not a score, formal passage-faithfulness audit, or pastoral directive. Demo and offline preview make no feedback calls. API.Bible attribution and FUMS reporting remain in the live study.

## Verification

Run `npm run check`, `npm test`, `npm run preview:test` and browser smoke. Manually test live John 15:1–8; start the guide, enter notes, navigate backward, finish, and verify full study and sources remain readable. Test the offline demo also.

## Follow-up opportunities

Future verified key-verb lexical research depends on the independent Phase 9A review gate. The live feedback feature does not establish verse-level original-language alignment or a formal faithfulness check.
