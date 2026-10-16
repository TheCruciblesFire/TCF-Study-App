# Guided Inductive Study — Initial Learner Interaction

This opt-in, client-side layer supports Observe → Interpret → Apply on an **already retrieved and validated** passage study. Its intent is to encourage readers to read Scripture and record observations before consulting interpretive summaries.

## Behavior

- The existing chat and formatted study remain the default: no user workflow changes until **Start guided study** is selected.
- The guide prompts the user for observation, interpretation and application in that order.
- On starting, the relevant generated study sections are hidden and progressively revealed as the learner moves forward. Passage context, Scripture source cards, citation links, attribution and other study elements remain available.
- Notes remain **only in the page's memory**, visible at completion and optionally copyable through a user-initiated clipboard action. They are not assessed, transmitted or stored in the server conversation; reload clears them.
- An empty note is allowed; progressing is not a claim of mastery. Learner reflections are not graded or labeled as verified.
- Existing authorized Bible text and copyright/reporting behavior are unchanged. This mode does not fabricate lexical work, commentary research, or specialized audits.

## Verification

Run `npm run check`, `npm test`, `npm run preview:test` and browser smoke. Manually test live John 15:1–8; start the guide, enter notes, navigate backward, finish, and verify full study and sources remain readable. Test the offline demo also.

## Follow-up opportunities

Future enhancements may provide server-reviewed observation feedback and full inductive key-verb lexical research, but only after a bounded API contract, verified verse-level word alignment and separate evidence-based faithfulness checks. These are **not** part of this PR.
