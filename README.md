# signal-grievance

Complaint-mining / startup-idea-generator side project — separate from Keel.
Mines real user complaints (Reddit, reviews, forums, SaaS communities) for a
given product category, surfaces market gaps (TAM/SAM), and generates ranked
startup ideas + MVP specs, all via Claude.

Consolidated here 2026-07-21 — previously scattered across a local
proxy-only folder (`signal-anthropic-proxy`) and two standalone tools living
in Google Drive. This repo is now the canonical source for the parts that
have one; see "Not yet consolidated" below for the piece that doesn't.

## What's here

- **`server.js` / `package.json`** — the Railway-deployed CORS proxy. No
  dependencies, Node 18+ built-in `fetch`, stateless (forwards `x-api-key`
  from the caller, never stores a key itself). POST `/v1/messages` relays to
  Anthropic with proper CORS headers; GET `/` is a health check. Deployed at
  **`https://signal-anthropic-proxy-production.up.railway.app`** under the
  `desertskyaz` Railway workspace, project `signal-anthropic-proxy` — the
  Railway project name is unchanged even though the local folder was
  renamed, so don't be surprised the two names no longer match.
- **`tools/SIGNAL — Complaint Intelligence Engine.html`** and
  **`tools/grievance_1.html`** — the two standalone browser tools (no
  backend of their own; user pastes their own Anthropic API key, stored in
  `localStorage` only). Both point their fetch calls at the proxy above, not
  at `api.anthropic.com` directly (browser calls to Anthropic are CORS-
  blocked from every origin — confirmed, not a config issue on our end).

**Copies of the two HTML files still live in Google Drive** at
`Claude html/Tools/` — that's where Bill actually opens them from day to
day, so they were copied here, not moved. If you edit either tool, update
both copies (or ask whether the Drive copy should just become a symlink/
sync target instead of a second copy that can drift).

## Not yet consolidated

A third implementation — a **Python CLI** ("Complaint-Mining Product
Builder") — lives at `github.com/iamprentice/Orchestrator`, branch
`claude/complaint-mining-product-builder-0uzz4` (not merged to `main`).
Not pulled into this repo since it's a genuinely separate, unfinished
implementation, not a variant of the same code as the two HTML tools —
folding it in felt like a decision for Bill rather than an automatic
"migrate everything" move. Worth doing in a follow-up if the Python CLI is
still wanted.

**Naming trap carried over from before:** the GitHub `Orchestrator` repo is
reused/overloaded — its `main` branch and a `claude/desert-sky-rebrand-...`
branch belong to unrelated earlier projects. The complaint-mining code only
lives on the branch named above.

## If something breaks

Check in this order: (1) is the model ID in both HTML files still current
— was bumped from a retired `claude-sonnet-4-20250514` snapshot to
`claude-sonnet-5` on 2026-07-19/20 and could drift again, (2) is the proxy
still up (`curl https://signal-anthropic-proxy-production.up.railway.app/`
should return `ok`), (3) did a new prompt/field reintroduce free-text JSON
parsing instead of Anthropic's tool-use structured output — both tools were
rewritten to use tool-use specifically to avoid `JSON.parse()` breaking on
unescaped quotes inside model-generated string values, so don't regress
back to a raw-text-then-regex approach.
