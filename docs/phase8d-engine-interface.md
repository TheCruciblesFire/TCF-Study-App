# Phase 8D — Engine interface and API readiness

**Scope:** Internal contract only. No new HTTP routes, external access, secrets, MCP tools, or changes to the live study output.

## Contract

The trusted host may create a `createEngineInterface(dependencies)` instance. Each instance exposes:

- `describe()`: internal interface metadata, version and supported modes.
- `invoke({version:'1.0', operation:'study.execute', message, history, meter}, capability)`: calls the existing verified routing pipeline using trusted, dependency-injected providers, normalizer, retrieval and verifier.
- `invoke({version:'1.0', operation:'engine.describe'}, capability)`: internal metadata.

Operations are allowlisted and rejected on mismatch. Study messages are 1–1500 characters, conversation history length is capped, and trusted adapters remain responsible for session/rate/cost authorization before invocation. The instance-local capability is **not** an HTTP credential, distributed token, persistence mechanism or cross-process security boundary. Do not serialize or expose it to clients. This interface must **not** be imported by browser code.

## Security separation

- Browser `/api/chat` continues enforcing existing origin, session, rate, concurrency and cost constraints.
- Internal call rights are granted only by the Node host wiring; no caller-supplied retrieval or model functions are accepted through the request.
- No plugin credentials are exposed and no private ChatGPT plugin is invoked.
- A future HTTP/MCP adapter must add its **own** external authentication, identity, quotas, least privilege, audit logs, transport protections, and input/tool-output injection evaluation. Internal capability alone is insufficient.
- Enabled modes remain only `passage` and `question`.

## Merge ordering

This 8D branch was created from `feat/phase8c-kv-routing` because, at authoring time, **GitHub main did not include** `packages/kv-study-engine/router.js` even though 8C had been reported verified. Merge PR #32 into main before merging this change, and confirm the 8D PR base/diff includes only intended files.

## Acceptance

`npm run check`, `npm test`, `npm run preview:test`, browser smoke; existing passage, follow-up, and unsupported routing tests. The new interface tests cover version, unknown operation, access check, request bounds, and the delegation order. No new Render variables or STEPBible rebuild are needed.
