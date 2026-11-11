# Model Arena

A local benchmark for comparing AI models on **visual, interactive web apps**. Every model gets
the same seven demanding core prompts and builds a single-file `index.html` for each. The **v2
suite** adds three more tasks: two that lean hard on tool calling (with data shipped in the
agent's workspace) and one hard-but-fast simulation task. The arena scores each app two ways:

1. **Auto score (0–100 per task).** A headless Chrome drives every page with real mouse and
   keyboard input. It measures correctness, frame rate and audio timing, and awards partial
   credit per check. It also records a showcase video and screenshots.
2. **Preference.** Blind side-by-side judging in the dashboard. You use two live apps, pick
   the better one, and votes are fitted with Bradley–Terry (order-independent Elo).

| Task | What the model builds | What separates good from great |
|---|---|---|
| `spreadsheet`, Gridcalc | 26×100 spreadsheet with a formula engine | parser precedence, dependency graph, cycles, copy/paste ref shifting, recalc speed |
| `vector-editor`, Vectorly | SVG design tool | precise drag/resize math, undo history, zoom-around-cursor, export |
| `step-sequencer`, Pulse | 8×16 drum machine, synthesized voices | lookahead scheduling (sub-ms timing), swing, live tempo, sound design |
| `cloth-sim`, Silk | tearable Verlet cloth | stability, grab/cut physics, wind, 60 FPS, shaded fabric |
| `terrain-flyover`, Horizon | infinite terrain in raw WebGL | determinism, chunk streaming, day/night lighting, atmosphere |
| `command-palette`, Commander | ⌘K palette in a notes app | fuzzy ranking, ARIA combobox, focus trap, motion and reduced motion |
| `skills-settings`, Harbor | settings app built by following three attached Claude skills | keeping theme-factory, ux-copy and accessibility-review applied on every panel, not just the first, and reconciling them where they conflict |

**v2 suite** (counted in the v2 scores only):

| Task | What the model builds | What separates good from great |
|---|---|---|
| `expense-ledger`, Tally | finance ledger from a workspace CSV + budgets JSON | tool use: reading and embedding the exact data; totals, budgets, filter/search/sort |
| `packet-decoder`, Relay | binary protocol decoder + capture explorer | tool use: recovering a gzipped capture split into base64 parts; varints, zigzag, CRC-16 |
| `enigma`, Enigma | faithful Enigma M3 simulator | the double-stepping anomaly, ring settings, plugboard — letter-exact against a reference |

The two tool-heavy tasks are graded so that **weak tool callers still earn partial credit**:
roughly half the points come from spec-only checks (UI, decoder logic) that need no workspace
files, and the rest from data fidelity that requires actually reading/decoding the files.
Tally needs simple file reads; Relay needs a multi-step decode-and-verify workflow — different
difficulty, same partial-credit ladder.

## Setup

Requires Node 20+ and Google Chrome (the grader drives your installed Chrome).

```sh
npm install
npx playwright install ffmpeg      # for showcase videos (screenshots work without it)
```

## Workflow

**1. Give a model the tasks.** Use a short, folder-safe model name, e.g. `qwen3-32b-q4`.

- *Chat models:* copy a prompt from the dashboard (Tasks › Copy prompt) or run
  `node arena.mjs prompt cloth-sim | pbcopy`. Save the reply as
  `submissions/<model>/<task>/index.html`.
- *Coding agents:* scaffold a workspace with one folder and one `PROMPT.md` per task, **outside**
  this repo so the agent can't read the graders in `tasks/*/task.mjs`:

  ```sh
  node arena.mjs new qwen3-32b-q4 --out ~/arena-runs/qwen3-32b-q4
  # run the agent in each folder: "Follow PROMPT.md, write index.html here"
  node arena.mjs import qwen3-32b-q4 ~/arena-runs/qwen3-32b-q4
  ```

- *Local models over an API:* point the arena at any OpenAI-compatible server (llama.cpp's
  `llama-server`, Ollama, LM Studio, vLLM). It sends each prompt, saves the page and records
  how long it took and how many tokens it used:

  ```sh
  node arena.mjs run qwen3.8-27b-q4 --base-url http://homeserver:8080/v1 --grade
  node arena.mjs run qwen3.8-27b-q8 --base-url http://homeserver:11434/v1 \
    --api-model qwen3.8:27b-q8_0 --temperature 0.6 --top-p 0.95 --max-tokens 32768
  ```

  See [Local models](#local-models) for what is measured and how to compare quantizations.

  Tool-use tasks (Tally, Relay) also copy their `workspace/` data files into each task folder,
  so the agent can read/decode them with its tools. The submitted `index.html` must embed the
  data — the graded page has no access to the workspace or the network.

**2. Grade.**

```sh
npm run grade                          # grades only new or changed submissions
npm run grade -- --model qwen3-32b-q4 --task cloth-sim --force
npm run grade -- --concurrency 4       # grade 4 jobs at once (short: -c 4)
```

Each task takes 1–2 minutes. Progress prints per check, followed by the standings.
`--concurrency N` runs N grading jobs in parallel (default 1) when your machine can handle
it; each line is then prefixed with `[model/task]`. The v2 tasks are correctness-only and
parallelise cleanly; the core tasks' frame-rate checks are load-sensitive, so use
`--concurrency 1` when you need comparable timing numbers.

**3. Look and judge.**

```sh
npm run serve                          # http://localhost:4173
```

- **Standings:** Arena, Auto and Preference scores plus Arena v2 / Auto v2 (full suite), with a score per task.
- **Tasks:** the prompt, then every submission with its video, screenshots and every check.
  Expand a check to see its sub-assertions, what the grader actually observed, and a screenshot
  of the page when it failed. "Open live" runs the app.
- **Judge:** two anonymous submissions of the same task run live side by side (keys `1` A,
  `2` B, `3` tie, `4` both bad, `N` next). Names are revealed after you vote, and pairs with
  the fewest votes come first.

## Local models

`node arena.mjs run <model>` streams each task from an OpenAI-compatible
`/v1/chat/completions` endpoint and writes, per task:

```
submissions/<model>/<task>/index.html   the page, taken from the reply's ```html block
submissions/<model>/<task>/run.json     time and token measurements
submissions/<model>/<task>/reply.md     the raw reply (and thinking.md for reasoning models)
```

- **Options:** `--base-url` (default `$ARENA_BASE_URL` or `http://localhost:8080/v1`),
  `--api-model` (optional when the server serves exactly one model, as `llama-server` does),
  `--task`, `--resume` to continue a stopped run at the task it was on, `--force` to run every
  task again (a model that already has pages needs one of the two), `--grade` to grade afterwards,
  `--retries N` (default 5: a server that is busy, down or still loading the model is asked
  again after 10, 20, 40, 80 and 120 s; a task that still fails gets an `error.txt`),
  `--thinking off|low|medium|high` (sent as `reasoning_effort`, Ollama's `think` and
  `chat_template_kwargs`, so one flag works across servers; Qwen only switches thinking on or off),
  and sampling settings `--temperature`, `--top-p`, `--seed`, `--max-tokens`. `--extra '<json>'`
  merges anything else into the request, e.g. `'{"chat_template_kwargs":{"enable_thinking":false}}'`
  to turn off Qwen's thinking on llama-server. A server that needs a key reads `$ARENA_API_KEY`.
- **The request:** the task's `PROMPT.md` as the user message, plus one short system message
  asking for the whole file in a single ```` ```html ```` block. It is identical for every model.
- **Measured:** wall time, time to first token (mostly prompt processing), output tokens
  including thinking tokens, generation speed in tokens/s, and prompt speed when the server
  reports it. Numbers come from the server's `usage` (and llama-server's `timings`); a server
  that reports nothing gets counts estimated from the stream, shown with `~`.
- **Shown:** a Generation column in the standings and `npm run board` (totals over the tasks
  that have a `run.json`), and per-task figures on each submission card, with links to the
  raw reply and the thinking.
- **Truncation:** a reply cut off by the token limit is flagged. Its page is still graded and
  usually scores low, so give reasoning models a large `--max-tokens` and context (`-c` on
  llama-server); a full app plus thinking can need 20–40k tokens.
- **Chat models:** for a page you pasted in by hand, you can write a `run.json` yourself with any
  of `wallMs`, `completionTokens`, `reasoningTokens` and `genTokensPerSec` to show it too.

**Comparing models and quantizations.** Give each configuration its own name, e.g.
`qwen3.8-27b-q4_k_m` and `qwen3.8-27b-q8_0`. Speed differences are measured precisely, but a
single reply per task is a noisy measure of quality: two runs of the *same* model can differ by
more than q4 and q8 do. Before concluding that one quantization is better, run each
configuration two or three times under separate names (`…-q4_k_m-r2`) and compare the spread,
and grade everything on the same machine.

**OpenRouter.** Use `--base-url https://openrouter.ai/api/v1` with the key in `$ARENA_API_KEY`;
`--thinking` is sent as OpenRouter's own `reasoning` field. OpenRouter picks a provider per
request, and providers serve different quantizations, so pin one when the precision matters:

```sh
node arena.mjs run qwen3.8-27b-bf16-or --base-url https://openrouter.ai/api/v1 \
  --api-model qwen/qwen3.8-27b --extra '{"provider":{"quantizations":["bf16"],"allow_fallbacks":false}}'
```

The provider that answered is saved in `run.json` and shown on the submission card. Its time and
speed measure that provider's hardware, so compare quality, not speed, against a local run.

## Legacy experimental suite (`--v2`)

> Superseded by the integrated v2 tasks above (Tally, Relay, Enigma), which are counted in
> Auto v2 / Arena v2 on the main board. This earlier experiment is kept for reference only.

A second, harder suite of six tasks lives in `v2/`: Flux (four-state logic lab), Latch
(unit-delay logic bench), Octet (CHIP-8 console), Tessera (guideline block stacking), Gambit
(chess with perft-verified move generation) and Keystone (2D CAD constraint solver). Each was
written from public documentation by a different AI lab's model, then audited and fixed here.
The originals are kept in `docs/Tasks-for-v2/`.

Add `--v2` to any command. It has its own tasks, submissions, results and votes, so the same
model name can appear in both suites without mixing:

```sh
node arena.mjs run qwen3.8-flash-next-low --v2 --base-url http://homeserver:8080/v1 --thinking low --grade
node arena.mjs board --v2
node arena.mjs serve --v2             # http://localhost:4174, next to v1 on 4173
```

## Scoring

- A **check** has points and is made of weighted *parts*. For example, "Functions and ranges"
  has ten formulas, and getting 8/10 right earns 80% of its points.
- A **task score** is points earned / points possible × 100. Every task also has three health
  checks: no uncaught exceptions, no console errors, no network requests. These only count in
  full once a page earns 25% of the core points, so a blank page scores ~0.
- **Auto** is the mean over the **core (non-v2)** tasks anyone attempted. A task a model skipped
  counts as 0. This is the historical score: it does not change when v2 tasks are added.
  **The standings are ranked by Auto** (how well the apps work), not by Arena.
- **Auto v2** is the mean over **all tasks (core + v2)** anyone attempted, but it is only
  reported once a model has been graded on **every active v2 task**. Until then it shows `—`,
  so a model that never ran the new tasks is not penalised and its v1 numbers stay comparable.
- **Preference** is the expected win rate against an average (Elo 1500) model, fitted from
  votes with Bradley–Terry plus a one-win/one-loss prior. It's shown after 5 votes.
- **Arena** is `0.7 × Auto + 0.3 × Preference` once Preference exists, otherwise Auto.
  **Arena v2** is the same blend using Auto v2 (and is `—` whenever Auto v2 is). Arena is kept
  for reference but does not drive the ranking, since preference leans visual. The weights
  live in `lib/scoring.mjs`.

Frame-rate checks depend on the machine, so grade all models on the same computer.
`--force` re-grades everything after you change hardware or a task.

## Adding a task

Create `tasks/<id>/PROMPT.md` (exactly what the model sees) and `tasks/<id>/task.mjs`:

```js
export const meta = { title: 'Name', subtitle: 'What it is', order: 7, summary: '…', skills: [], judging: ['…'] };

export const checks = [
  {
    id: 'thing', title: 'Does the thing', points: 6,
    context: { deviceScaleFactor: 2 },          // optional Playwright context overrides
    async run(t) {                               // fresh page per check, already loaded
      await t.page.click('#go');
      await t.part('counter increments', async () =>
        t.ok((await t.page.textContent('#n')) === '1', 'observed text'));   // weight 1
      await t.part('fast', async () => ((await t.fps(1000)).fps >= 55 ? 1 : 0.5), 2);
    },
  },
];

export async function showcase(t) { /* scripted demo; t.shot('name') saves a screenshot */ }
```

Set `suite: 'v2'` in `meta` to add the task to the v2 scores only (it then counts toward
Auto v2 / Arena v2, never the historical Auto / Arena). To ship data files the agent must
read with its tools, put them under `tasks/<id>/workspace/`; `arena.mjs new` copies them into
the task folder and their contents are hashed into the task, so editing them re-grades.

Helpers on `t`: `part`, `ok`, `poll`, `sleep`, `eval`, `setInput`, `drag`, `shortcut`, `box`,
`count`, `visible`, `screenshot` / `stableShot` with `t.image.diff | stats | coverage | pixel`,
`fps`, `reload`, and `probe()`. `probe()` reports the canvas contexts created and every Web
Audio `start(when)` call, captured by `lib/probe.js` before the page's own scripts run.

Changing a task's `task.mjs`, `PROMPT.md` or any `workspace/` file marks its results stale, so
they are re-graded on the next `npm run grade`.

## Layout

```
arena.mjs            CLI: tasks, prompt, new, import, run, grade, board, serve
lib/grader.mjs       per-check browser contexts, network isolation, health checks, video
lib/harness.mjs      the `t` helper object
lib/probe.js         init script: canvas + Web Audio instrumentation
lib/runner.mjs       `run`: OpenAI-compatible streaming client, token/time metrics, HTML extraction
lib/scoring.mjs      leaderboard and Bradley–Terry
lib/server.mjs       dashboard API; each submission is served from its own *.localhost origin
dashboard/           standings, task results, blind judging
tasks/<id>/          PROMPT.md + task.mjs (+ workspace/ data files for tool-use tasks)
v2/                  suite v2: tasks/, submissions/, results/ (`--v2`)
submissions/<model>/<task>/index.html   (+ run.json, reply.md, thinking.md from `run`)
results/<model>/<task>/   result.json, showcase.webm, shots/, checks/ (failure screenshots)
results/votes.json   judge votes
```
