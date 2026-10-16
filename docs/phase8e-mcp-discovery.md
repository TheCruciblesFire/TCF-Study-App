# Phase 8E — Authenticated MCP Discovery (limited rollout)

**Scope:** A disabled-by-default, stateless MCP HTTP discovery endpoint. No public remote study execution, external research, lexical lookup, specialist audits, prompt disclosure, or OAuth provider. This is an incremental transport proving step, not a full externally callable Study Engine.

## Activation

Set a strong randomly generated **server-side** Render environment secret `MCP_DISCOVERY_TOKEN` (at least 32 characters) to enable `POST /mcp`. Without this variable, `/mcp` remains unavailable. Keep this token out of client-side JavaScript, SnapPages, logs, documentation, repositories, and URLs. A rotating shared token only suits known controlled server-side clients; do not publish it as a public connector credential.

**No environment setting is necessary to continue operating the existing Bible Study Assistant.** The default is OFF.

## MCP contract

- Stateless Streamable HTTP-style JSON-RPC requests to `POST /mcp`; JSON responses.
- `initialize`: advertises server information and tool capability.
- `notifications/initialized`: accepts a client notification (202).
- `tools/list`: describes exactly one tool, `kv_engine_capabilities`.
- `tools/call` with `kv_engine_capabilities` and empty arguments: returns enabled engine modes and explicitly confirms that execution is not exposed.
- All other method names or tool calls rejected.
- `GET /mcp` and `DELETE /mcp` return 405. No SSE/resumable stream, server sessions or resource subscription.

## Security

- Bearer authentication required *before* parsing the request body; timing-safe comparison of SHA-256 digests.
- Denies requests containing an Origin header, avoiding a browser-accessible remote surface. Designed for trusted server-to-server discovery only.
- Existing repository rate limiting applies with an isolated MCP namespace. JSON bodies limited to 8 KB. API_Bible, STEPBible and OpenAI credentials stay server-side.
- No user-provided tool execution parameters, no LLM calls or source retrieval; discovery consumes no model tokens.
- Exposing to third-party consumer clients needs identity-based auth (typically OAuth 2.1 with discovery metadata), per-client quotas and audit trails; a single shared token is NOT a finished public MCP authorization design.
- The `createEngineInterface` internal capability is never sent to MCP clients.

## Verification

CI: `npm run check`, `npm test`, `npm run preview:test`, standard app smoke. New MCP tests verify missing/incorrect auth, blocked browser origins, protocol handshake, tool schema/call, disabled study execution, unknown methods and bad requests.

Deployment: merge with MCP disabled and confirm the existing app functions as before. For a **private test only**, set a strong `MCP_DISCOVERY_TOKEN` in Render and use a trusted HTTP client with `Authorization: Bearer <token>` against `https://<render-host>/mcp`. Do not share the token in screenshots or chat. Verify `tools/list` returns one discovery tool. Remove the secret to turn the surface off.

## Follow-up

External study execution remains prohibited until client identity, budgets, user isolation, licensed-text distribution, provenance, audit gates and prompt-injection boundaries have been designed and tested. The single in-process study workflow remains the production execution path.
