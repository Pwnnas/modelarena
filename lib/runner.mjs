// Runs a task prompt against any OpenAI-compatible chat endpoint (llama.cpp's
// llama-server, Ollama, LM Studio, vLLM, …), streams the reply and measures
// how long it took and how many tokens it used.
import http from 'node:http';
import https from 'node:https';

// Sent with every prompt so replies can be saved without hand editing. It is
// the same for every model, so it doesn't favor anyone.
export const SYSTEM_PROMPT =
  'You are completing a coding task. Reply with the complete contents of index.html in a single ```html fenced code block. Never abbreviate or omit parts of the file.';

function request(url, { method = 'GET', headers = {}, body } = {}) {
  const u = new URL(url);
  const lib = u.protocol === 'https:' ? https : http;
  return new Promise((resolve, reject) => {
    // No timeouts: a large model on a home server can think for many minutes.
    const req = lib.request(u, { method, headers }, resolve);
    req.on('error', (e) => {
      // A refused connection to "localhost" tries IPv6 and IPv4 and fails with
      // an AggregateError that has no message of its own.
      if (!e.message) e.message = `${e.code ?? 'connection failed'}: ${u.host}`;
      reject(e);
    });
    if (body) req.write(body);
    req.end();
  });
}

async function readAll(res) {
  let s = '';
  for await (const c of res) s += c;
  return s;
}

const headersFor = (apiKey) => ({
  'Content-Type': 'application/json',
  ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
});

// llama-server serves one model; use it when the user didn't name one.
export async function listApiModels(baseUrl, apiKey) {
  const res = await request(`${baseUrl.replace(/\/$/, '')}/models`, { headers: headersFor(apiKey) });
  const text = await readAll(res);
  if (res.statusCode >= 400) throw new Error(`GET /models: HTTP ${res.statusCode} ${text.slice(0, 200)}`);
  return (JSON.parse(text).data ?? []).map((m) => m.id);
}

const looksLikePage = (s) => /<(html|head|body|script|!doctype)\b/i.test(s);

// Pull index.html out of a chat reply. Pages often contain ``` themselves (in
// a string or a template literal), so a block only closes at a fence on a line
// of its own, and preferably after the page's </html>. Takes the longest such
// block, else a bare document, else an unclosed block (a reply cut off by the
// token limit).
export function extractHtml(reply) {
  const lines = reply.split('\n');
  const opener = /^\s*```+\s*([\w+#.-]*)\s*$/;
  const closer = /^\s*```+\s*$/;
  const blocks = [];
  let unclosed = null;
  for (let i = 0; i < lines.length; i++) {
    const lang = opener.exec(lines[i])?.[1]?.toLowerCase();
    if (lang == null) continue;
    if (!['', 'html', 'htm', 'xhtml'].includes(lang)) {
      // Another language's block (```css, ```js): skip to its closing fence.
      while (i + 1 < lines.length && !closer.test(lines[i + 1])) i++;
      i++;
      continue;
    }
    const closes = [];
    for (let j = i + 1; j < lines.length; j++) if (closer.test(lines[j])) closes.push(j);
    const body = (j) => lines.slice(i + 1, j).join('\n');
    const end = closes.find((j) => /<\/html>/i.test(body(j))) ?? closes[0];
    if (end == null) {
      if (looksLikePage(body(lines.length))) unclosed ??= body(lines.length);
      break;
    }
    if (looksLikePage(body(end))) blocks.push(body(end));
    i = end;
  }
  blocks.sort((a, b) => b.length - a.length);
  if (blocks.length) return { html: blocks[0].trim() + '\n', how: 'fenced' };
  const doc = /<!doctype html[\s\S]*<\/html>/i.exec(reply) ?? /<html[\s\S]*<\/html>/i.exec(reply);
  if (doc) return { html: doc[0] + '\n', how: 'document' };
  if (unclosed) return { html: unclosed.trim() + '\n', how: 'unclosed fence (truncated?)' };
  return { html: null, how: 'none' };
}

// Worth asking again: the server is down, busy or still loading the model
// (common right after a long reply, or when a model is swapped in), or this
// machine's network dropped for a moment (Wi-Fi, sleep). A 400 is
// not; it means the request itself is wrong, e.g. --max-tokens over the context.
export const isRetryable = (e) =>
  e.status ? [408, 409, 425, 429, 500, 502, 503, 504].includes(e.status) : /ECONNREFUSED|ECONNRESET|EPIPE|ETIMEDOUT|EHOSTUNREACH|ENETUNREACH|ENETDOWN|EAI_AGAIN|ESTREAMCUT|socket hang up|aborted/i.test(`${e.code} ${e.message}`);

export const THINKING_LEVELS = ['off', 'low', 'medium', 'high'];

// Servers spell "how much to think" differently, so every spelling is sent and
// each server ignores the ones it doesn't know: `reasoning_effort` (OpenAI;
// Ollama and vLLM accept it, as does llama-server for templates that use it),
// `think` (Ollama's own switch) and `chat_template_kwargs` (llama-server and
// vLLM pass these to the chat template; Qwen's reads `enable_thinking`).
// Qwen models only switch thinking on or off, so low/medium/high may change
// nothing there; compare the thinking tokens in run.json to find out.
// OpenRouter forwards requests to many providers and has its own `reasoning`
// field, which it translates for each of them.
export function thinkingFields(level, baseUrl = '') {
  if (level == null) return {};
  if (/openrouter\.ai/i.test(baseUrl)) return { reasoning: level === 'off' ? { enabled: false } : { effort: level } };
  if (level === 'off') return { reasoning_effort: 'none', think: false, chat_template_kwargs: { enable_thinking: false } };
  return { reasoning_effort: level, think: level, chat_template_kwargs: { enable_thinking: true, reasoning_effort: level } };
}

export async function runPrompt({ baseUrl, apiKey, apiModel, prompt, params = {}, thinking, extra = {}, onProgress = () => {} }) {
  const effort = thinkingFields(thinking, baseUrl);
  const body = {
    model: apiModel,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: prompt },
    ],
    stream: true,
    stream_options: { include_usage: true },
    ...params,
    ...effort,
    ...extra,
    // Merge rather than replace, so --extra can add template options of its own.
    ...(effort.chat_template_kwargs || extra.chat_template_kwargs
      ? { chat_template_kwargs: { ...effort.chat_template_kwargs, ...extra.chat_template_kwargs } }
      : {}),
  };
  const started = Date.now();
  const t0 = performance.now();
  const res = await request(`${baseUrl.replace(/\/$/, '')}/chat/completions`, { method: 'POST', headers: headersFor(apiKey), body: JSON.stringify(body) });
  if (res.statusCode >= 400) {
    const e = new Error(`HTTP ${res.statusCode}: ${(await readAll(res)).slice(0, 300)}`);
    e.status = res.statusCode;
    throw e;
  }

  let reply = '', reasoning = '', buf = '';
  let firstAt = null, firstContentAt = null, lastAt = null;
  let contentChunks = 0, reasoningChunks = 0;
  let usage = null, timings = null, finishReason = null, servedModel = null, provider = null, done = false;

  const handle = (data) => {
    if (data === '[DONE]') return void (done = true);
    let j;
    try {
      j = JSON.parse(data);
    } catch {
      return;
    }
    if (j.error) throw new Error(j.error.message ?? JSON.stringify(j.error));
    servedModel ??= j.model;
    provider ??= j.provider; // OpenRouter: which provider actually served it
    if (j.usage) usage = j.usage;
    if (j.timings) timings = j.timings; // llama-server's own measurements
    const ch = j.choices?.[0];
    if (!ch) return;
    if (ch.finish_reason) finishReason = ch.finish_reason;
    const d = ch.delta ?? {};
    const think = d.reasoning_content ?? d.reasoning ?? '';
    const now = performance.now();
    if (think) {
      reasoning += think;
      reasoningChunks++;
    }
    if (d.content) {
      reply += d.content;
      contentChunks++;
      firstContentAt ??= now;
    }
    if (think || d.content) {
      firstAt ??= now;
      lastAt = now;
      onProgress({ phase: d.content ? 'writing' : 'thinking', chunks: contentChunks + reasoningChunks, chars: reply.length + reasoning.length, elapsedMs: now - t0, firstAt: firstAt - t0 });
    }
  };

  for await (const c of res) {
    buf += c;
    let i;
    while ((i = buf.indexOf('\n')) >= 0) {
      const line = buf.slice(0, i).trim();
      buf = buf.slice(i + 1);
      if (line.startsWith('data:')) handle(line.slice(5).trim());
    }
  }
  if (buf.trim().startsWith('data:')) handle(buf.trim().slice(5).trim());
  const end = performance.now();
  // A stream that stops with neither a finish reason nor [DONE] was cut off
  // (server restarted, connection dropped). That is not the model's answer, so
  // it must not replace an earlier page; ask again instead.
  if (!finishReason && !done) {
    const e = new Error(`stream ended without a finish reason after ${Math.round((end - t0) / 1000)} s and ~${contentChunks + reasoningChunks} tokens (connection dropped or server restarted)`);
    e.code = 'ESTREAMCUT';
    throw e;
  }

  // Prefer what the server reports. Streaming servers send about one token per
  // chunk, so chunk counts are a close estimate when they report nothing.
  const reported = usage?.completion_tokens ?? timings?.predicted_n;
  const completionTokens = reported ?? contentChunks + reasoningChunks;
  const reasoningTokens =
    usage?.completion_tokens_details?.reasoning_tokens ??
    (reasoningChunks && completionTokens ? Math.round((completionTokens * reasoningChunks) / (contentChunks + reasoningChunks)) : 0);
  // Some providers count thinking tokens but don't stream the text. The thinking
  // then happens before the first visible chunk, so time it from the request.
  const reasoningHidden = reasoningTokens > 0 && !reasoning.length;
  const genFrom = reasoningHidden ? 0 : firstAt;
  const genSeconds = genFrom != null && lastAt > genFrom ? (lastAt - genFrom) / 1000 : null;
  const round = (n, d = 1) => (n == null || !Number.isFinite(n) ? null : Math.round(n * 10 ** d) / 10 ** d);

  return {
    reply,
    reasoning,
    metrics: {
      source: 'arena run',
      endpoint: new URL(baseUrl).host,
      apiModel,
      servedModel,
      provider,
      params: { ...params, ...(thinking ? { thinking } : {}), ...extra },
      startedAt: new Date(started).toISOString(),
      wallMs: Math.round(end - t0),
      ttftMs: firstAt == null ? null : Math.round(firstAt - t0),
      thinkingMs: firstContentAt == null || !reasoningChunks ? null : Math.round(firstContentAt - firstAt),
      promptTokens: usage?.prompt_tokens ?? timings?.prompt_n ?? null,
      completionTokens,
      reasoningTokens,
      tokensEstimated: reported == null,
      genTokensPerSec: round(timings?.predicted_per_second ?? (genSeconds ? completionTokens / genSeconds : null)),
      promptTokensPerSec: round(timings?.prompt_per_second),
      finishReason,
      replyChars: reply.length,
      reasoningChars: reasoning.length,
      reasoningHidden,
    },
  };
}
