# Model Arena

A local benchmark for comparing AI models on **visual, interactive web apps**. Every model gets
the same six demanding prompts and builds a single-file `index.html` for each. The arena then scores
each app two ways:

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

**2. Grade.**

```sh
npm run grade                          # grades only new or changed submissions
npm run grade -- --model qwen3-32b-q4 --task cloth-sim --force
```

Each task takes 1–2 minutes. Progress prints per check, followed by the standings.

**3. Look and judge.**

```sh
npm run serve                          # http://localhost:4173
```

- **Standings:** Arena, Auto and Preference scores, with a score per task.
- **Tasks:** the prompt, then every submission with its video, screenshots and every check.
  Expand a check to see its sub-assertions, what the grader actually observed, and a screenshot
  of the page when it failed. "Open live" runs the app.
- **Judge:** two anonymous submissions of the same task run live side by side (keys `1` A,
  `2` B, `3` tie, `4` both bad, `N` next). Names are revealed after you vote.

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
  `--task`, `--force` to re-run tasks that already have a page, `--grade` to grade afterwards,
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

## Scoring

- A **check** has points and is made of weighted *parts*. For example, "Functions and ranges"
  has ten formulas, and getting 8/10 right earns 80% of its points.
- A **task score** is points earned / points possible × 100. Every task also has three health
  checks: no uncaught exceptions, no console errors, no network requests. These only count in
  full once a page earns 25% of the core points, so a blank page scores ~0.
- **Auto** is the mean over all tasks anyone attempted. A task a model skipped counts as 0.
- **Preference** is the expected win rate against an average (Elo 1500) model, fitted from
  votes with Bradley–Terry plus a one-win/one-loss prior. It's shown after 5 votes.
- **Arena** is `0.7 × Auto + 0.3 × Preference` once Preference exists, otherwise Auto. The
  weights live in `lib/scoring.mjs`.

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

Helpers on `t`: `part`, `ok`, `poll`, `sleep`, `eval`, `setInput`, `drag`, `shortcut`, `box`,
`count`, `visible`, `screenshot` / `stableShot` with `t.image.diff | stats | coverage | pixel`,
`fps`, `reload`, and `probe()`. `probe()` reports the canvas contexts created and every Web
Audio `start(when)` call, captured by `lib/probe.js` before the page's own scripts run.

Changing a task's `task.mjs` or `PROMPT.md` marks its results stale, so they are re-graded on
the next `npm run grade`.

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
tasks/<id>/          PROMPT.md + task.mjs
submissions/<model>/<task>/index.html   (+ run.json, reply.md, thinking.md from `run`)
results/<model>/<task>/   result.json, showcase.webm, shots/, checks/ (failure screenshots)
results/votes.json   judge votes
```
