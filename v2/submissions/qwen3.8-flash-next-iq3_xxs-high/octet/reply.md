```html
<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Octet — CHIP-8 Console</title>
<style>
  :root {
    --bg0: #10151c;
    --bg1: #05070a;
    --panel: #151c26;
    --panel2: #0b1017;
    --edge: #293445;
    --edge2: #18202b;
    --text: #dce7f5;
    --muted: #8d9bb0;
    --phos: #a8ffd7;
    --accent: #57d8d0;
    --led: #ff6b5a;
  }

  * { box-sizing: border-box; }
  html, body {
    height: 100%;
    margin: 0;
    background:
      radial-gradient(ellipse at 50% 0%, #1a2330 0%, #090c12 55%, #050608 100%),
      linear-gradient(var(--bg1), var(--bg1));
    color: var(--text);
    font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif;
    overflow: hidden;
  }

  #app {
    width: 100%;
    height: 100vh;
    max-width: 1280px;
    margin: 0 auto;
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding: 12px;
  }

  #top {
    display: flex;
    align-items: center;
    gap: 14px;
    flex: 0 0 auto;
    padding: 2px 4px;
  }

  .title {
    font-size: 26px;
    font-weight: 900;
    letter-spacing: 0.06em;
    color: #f2fbff;
    text-shadow: 0 0 12px rgba(87, 216, 208, .22);
  }

  .subtitle {
    color: var(--muted);
    font-size: 12px;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  .spacer { flex: 1; }

  .ledwrap {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .led {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: #253040;
    box-shadow: inset 0 0 5px rgba(0,0,0,.8);
    transition: background .18s, box-shadow .18s;
  }

  .led.on {
    background: var(--led);
    box-shadow: 0 0 8px var(--led), 0 0 20px rgba(255,107,90,.32);
  }

  .ledlabel {
    font-size: 11px;
    color: var(--muted);
    letter-spacing: 0.08em;
  }

  .status {
    min-width: 74px;
    padding: 6px 9px;
    border-radius: 7px;
    background: linear-gradient(var(--panel), var(--panel2));
    border: 1px solid var(--edge2);
    color: var(--accent);
    font: 700 12px/1 ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
    letter-spacing: 0.1em;
    text-align: center;
  }

  #main {
    min-height: 0;
    display: grid;
    grid-template-columns: minmax(420px, 1fr) 330px;
    gap: 14px;
    overflow: auto;
  }

  #left {
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  #screen {
    position: relative;
    width: min(512px, 100%);
    padding: 16px;
    border-radius: 18px;
    background:
      linear-gradient(145deg, #17202d 0%, #0a0e15 60%, #070a0f 100%);
    box-shadow:
      0 0 0 1px var(--edge),
      0 16px 36px rgba(0,0,0,.55),
      inset 0 2px 12px rgba(0,0,0,.75),
      inset 0 0 3px rgba(255,255,255,.03);
    overflow: hidden;
  }

  #display {
    display: block;
    width: 100%;
    height: auto;
    aspect-ratio: 2 / 1;
    image-rendering: pixelated;
    background: transparent;
    filter:
      drop-shadow(0 0 2px rgba(168, 255, 215, .72))
      drop-shadow(0 0 9px rgba(168, 255, 215, .24))
      drop-shadow(0 0 24px rgba(168, 255, 215, .10));
  }

  #screen .scan,
  #screen .curve {
    position: absolute;
    inset: 16px;
    pointer-events: none;
    border-radius: 10px;
  }

  #screen .scan {
    background-image: repeating-linear-gradient(
      to bottom,
      rgba(0,0,0,.20) 0 1px,
      rgba(0,0,0,0) 1px 3px
    );
    opacity: .55;
    mix-blend-mode: overlay;
  }

  #screen .curve {
    background:
      radial-gradient(ellipse at center, transparent 58%, rgba(0,0,0,.28) 100%),
      linear-gradient(to bottom, rgba(255,255,255,.035), transparent 18%);
    box-shadow: inset 0 0 24px rgba(0,0,0,.68);
  }

  #controls {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
    padding: 10px 12px;
    border-radius: 12px;
    background: linear-gradient(var(--panel), var(--panel2));
    border: 1px solid var(--edge2);
  }

  .btn {
    appearance: none;
    border: 1px solid var(--edge);
    border-radius: 9px;
    padding: 8px 12px;
    color: var(--text);
    background: linear-gradient(#263143, #101622);
    box-shadow: 0 3px 0 var(--edge2), inset 0 1px 0 rgba(255,255,255,.05);
    font-weight: 800;
    cursor: pointer;
    user-select: none;
  }

  .btn:hover { filter: brightness(1.08); }
  .btn:active { transform: translateY(2px); box-shadow: 0 1px 0 var(--edge2); }

  #mute[aria-pressed="true"] {
    color: #f4c8c8;
    background: linear-gradient(#3d2226, #201418);
    border-color: #5b3238;
  }

  .field {
    display: flex;
    align-items: center;
    gap: 7px;
    color: var(--muted);
    font-size: 12px;
    font-weight: 700;
    letter-spacing: .04em;
  }

  #speed {
    width: 142px;
    accent-color: var(--accent);
  }

  #speedValue {
    min-width: 42px;
    color: var(--accent);
    font: 700 12px/1 ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  }

  #rom {
    min-width: 128px;
    color: var(--text);
    background: linear-gradient(#263143, #101622);
    border: 1px solid var(--edge);
    border-radius: 8px;
    padding: 7px 8px;
  }

  .hint {
    min-height: 20px;
    color: var(--muted);
    font-size: 12px;
    line-height: 1.35;
  }

  #keypad {
    display: grid;
    grid-template-columns: repeat(4, minmax(54px, 1fr));
    gap: 8px;
    width: min(300px, 100%);
    margin-top: 2px;
  }

  .key {
    appearance: none;
    aspect-ratio: 1 / 1;
    border: 1px solid #35445a;
    border-radius: 11px;
    background: linear-gradient(#303c50, #111824);
    color: #ecf5ff;
    font: 900 21px/1 ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
    box-shadow: 0 4px 0 #080b10, inset 0 1px 0 rgba(255,255,255,.08);
    cursor: pointer;
    user-select: none;
    touch-action: manipulation;
  }

  .key[aria-pressed="true"] {
    transform: translateY(3px);
    color: #eafff7;
    background: linear-gradient(#427a6b, #1e3c33);
    box-shadow: inset 0 3px 8px rgba(0,0,0,.72), 0 1px 0 #080b10;
  }

  #right {
    min-width: 0;
    padding: 10px 12px;
    border-radius: 12px;
    background: linear-gradient(var(--panel), var(--panel2));
    border: 1px solid var(--edge2);
  }

  #right h2 {
    margin: 0 0 10px;
    font-size: 13px;
    letter-spacing: .14em;
    text-transform: uppercase;
    color: var(--muted);
  }

  .reghead {
    display: grid;
    grid-template-columns: repeat(8, minmax(0, 1fr));
    gap: 4px;
    margin-bottom: 5px;
    color: var(--muted);
    font: 700 10px/1.1 ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
    letter-spacing: .04em;
  }

  .reghead span { text-align: center; }

  .regs {
    display: grid;
    grid-template-columns: repeat(8, minmax(0, 1fr));
    gap: 4px;
    margin-bottom: 10px;
  }

  .reg {
    text-align: center;
    padding: 5px 2px;
    border-radius: 6px;
    background: #070c12;
    border: 1px solid #18202c;
    font: 700 12px/1 ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  }

  .info {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 6px 10px;
    margin-bottom: 10px;
    font: 700 12px/1.35 ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  }

  .info b { color: var(--muted); font-weight: 800; }
  .info span { color: var(--accent); }

  #disasm {
    margin: 0;
    max-height: 180px;
    overflow: auto;
    padding: 9px 10px;
    border-radius: 8px;
    background: #070c12;
    border: 1px solid #18202c;
    color: #c7f3e6;
    font: 700 12px/1.45 ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
    white-space: pre;
  }

  @media (max-width: 900px) {
    #main { grid-template-columns: 1fr; }
    #right { display: none; }
  }
</style>
</head>
<body>
  <div id="app">
    <header id="top">
      <div class="title">Octet</div>
      <div class="subtitle">CHIP-8 core</div>
      <div class="spacer"></div>
      <div class="ledwrap"><span id="led" class="led"></span><span class="ledlabel">Power</span></div>
      <div id="status" class="status">PAUSED</div>
    </header>

    <main id="main">
      <section id="left">
        <div id="screen">
          <canvas id="display" width="64" height="32"></canvas>
          <div class="scan"></div>
          <div class="curve"></div>
        </div>

        <div id="controls">
          <button id="play" class="btn" type="button" aria-pressed="false">Run</button>
          <button id="step" class="btn" type="button">Step</button>
          <button id="reset" class="btn" type="button">Reset</button>

          <label class="field" for="speed">
            Speed
            <input id="speed" type="range" min="60" max="3600" step="10" value="600">
            <span id="speedValue">600</span>
          </label>

          <label class="field" for="rom">
            ROM
            <select id="rom">
              <option value="0">Pong</option>
              <option value="1">Targets</option>
            </select>
          </label>

          <button id="mute" class="btn" type="button" aria-pressed="false">Mute</button>
        </div>

        <div id="hint" class="hint">Ready.</div>

        <div id="keypad">
          <button class="key" type="button" data-key="1" aria-label="Key 1" aria-pressed="false">1</button>
          <button class="key" type="button" data-key="2" aria-label="Key 2" aria-pressed="false">2</button>
          <button class="key" type="button" data-key="3" aria-label="Key 3" aria-pressed="false">3</button>
          <button class="key" type="button" data-key="C" aria-label="Key C" aria-pressed="false">C</button>

          <button class="key" type="button" data-key="4" aria-label="Key 4" aria-pressed="false">4</button>
          <button class="key" type="button" data-key="5" aria-label="Key 5" aria-pressed="false">5</button>
          <button class="key" type="button" data-key="6" aria-label="Key 6" aria-pressed="false">6</button>
          <button class="key" type="button" data-key="D" aria-label="Key D" aria-pressed="false">D</button>

          <button class="key" type="button" data-key="7" aria-label="Key 7" aria-pressed="false">7</button>
          <button class="key" type="button" data-key="8" aria-label="Key 8" aria-pressed="false">8</button>
          <button class="key" type="button" data-key="9" aria-label="Key 9" aria-pressed="false">9</button>
          <button class="key" type="button" data-key="E" aria-label="Key E" aria-pressed="false">E</button>

          <button class="key" type="button" data-key="A" aria-label="Key A" aria-pressed="false">A</button>
          <button class="key" type="button" data-key="0" aria-label="Key 0" aria-pressed="false">0</button>
          <button class="key" type="button" data-key="B" aria-label="Key B" aria-pressed="false">B</button>
          <button class="key" type="button" data-key="F" aria-label="Key F" aria-pressed="false">F</button>
        </div>
      </section>

      <aside id="right">
        <h2>Debugger</h2>
        <div class="reghead" id="reghead"></div>
        <div id="regs" class="regs"></div>
        <div class="info">
          <div><b>I</b> <span id="dbgI">0200</span></div>
          <div><b>PC</b> <span id="dbgPc">0200</span></div>
          <div><b>SP</b> <span id="dbgSp">0</span></div>
          <div><b>State</b> <span id="dbgState">PAUSE</span></div>
          <div><b>Delay</b> <span id="dbgDelay">0</span></div>
          <div><b>Sound</b> <span id="dbgSound">0</span></div>
        </div>
        <pre id="disasm"></pre>
      </aside>
    </main>
  </div>

<script>
(function () {
  "use strict";

  const FONT = new Uint8Array([
    0xF0, 0x90, 0x90, 0x90, 0xF0,
    0x20, 0x60, 0x20, 0x20, 0x70,
    0xF0, 0x10, 0xF0, 0x80, 0xF0,
    0xF0, 0x10, 0xF0, 0x10, 0xF0,
    0x90, 0x90, 0xF0, 0x10, 0x10,
    0xF0, 0x80, 0xF0, 0x10, 0xF0,
    0xF0, 0x80, 0xF0, 0x90, 0xF0,
    0xF0, 0x10, 0x20, 0x40, 0x40,
    0xF0, 0x90, 0xF0, 0x90, 0xF0,
    0xF0, 0x90, 0xF0, 0x10, 0xF0,
    0xF0, 0x90, 0xF0, 0x90, 0x90,
    0xE0, 0x90, 0xE0, 0x90, 0xE0,
    0xF0, 0x80, 0x80, 0x80, 0xF0,
    0xE0, 0x90, 0x90, 0x90, 0xE0,
    0xF0, 0x80, 0xF0, 0x80, 0xF0,
    0xF0, 0x80, 0xF0, 0x80, 0x80
  ]);

  const MAX_ROM_BYTES = 0x1000 - 0x200;

  let mem = new Uint8Array(4096);
  const V = new Uint8Array(16);
  const stack = new Uint16Array(16);
  const display = new Uint8Array(2048);

  let I = 0;
  let pc = 0x200;
  let sp = 0;
  let delay = 0;
  let sound = 0;
  let halted = false;
  let waitingKey = false;
  let waitingX = -1;
  let currentRom = new Uint8Array(0);

  const keyDown = new Uint8Array(16);
  const keySrc = new Uint8Array(16);
  const API_FLAG = 1;
  const PHYS_FLAG = 2;
  const POINTER_FLAG = 4;

  const pointerMap = new Map();
  const pointerCount = new Uint8Array(16);

  let runningFlag = false;
  let runTimer = null;
  let lastRun = 0;
  let instrAcc = 0;
  let timerAcc = 0;
  let speed = 600;
  let mute = false;
  let currentIndex = 0;

  function hex2(n) {
    return (n & 255).toString(16).toUpperCase().padStart(2, "0");
  }
  function hex3(n) {
    return (n & 4095).toString(16).toUpperCase().padStart(3, "0");
  }
  function hex4(n) {
    return (n & 4095).toString(16).toUpperCase().padStart(4, "0");
  }
  function hexReg(n) {
    return (n & 15).toString(16).toUpperCase();
  }

  function assembleROM(src) {
    const labels = new Map();
    const items = [];
    let addr = 0x200;

    function isReg(t) {
      return typeof t === "string" && /^[Vv][0-9a-fA-F]{1,2}$/.test(t);
    }

    function parseReg(t) {
      if (!t) return 0;
      t = String(t).toUpperCase();
      if (t[0] === "V") t = t.slice(1);

      let v = NaN;
      if (/^[0-9a-fA-F]$/.test(t)) v = parseInt(t, 16);
      else if (/^[0-9]+$/.test(t)) v = parseInt(t, 10);
      else if (/^[0-9a-fA-F]+$/.test(t)) v = parseInt(t, 16);

      if (!Number.isFinite(v) || v < 0 || v > 15) return 0;
      return v & 15;
    }

    function parseNum(t) {
      if (t === null || t === undefined) return 0;
      if (labels.has(t)) return labels.get(t);
      t = String(t);
      if (t[0] === "$") {
        let s = t.slice(1);
        if (/^0x/i.test(s)) s = s.slice(2);
        else if (/^x/i.test(s)) s = s.slice(1);
        const v = parseInt(s, 16);
        return Number.isFinite(v) ? v : 0;
      }
      const v = parseInt(t, 10);
      return Number.isFinite(v) ? v : 0;
    }

    function parseByte(t) {
      return parseNum(t) & 255;
    }

    function parseAddr(t) {
      return parseNum(t) & 0xFFF;
    }

    function encode(mn, args) {
      const a = args[0] || "";
      const b = args[1] || "";
      const c = args[2] || "";

      switch (mn) {
        case "CLS": return 0x00E0;
        case "RET": return 0x00EE;
        case "JP": return 0x1000 | parseAddr(a);
        case "CALL": return 0x2000 | parseAddr(a);

        case "SE":
          return isReg(b)
            ? 0x5000 | (parseReg(a) << 8) | (parseReg(b) << 4)
            : 0x3000 | (parseReg(a) << 8) | parseByte(b);

        case "SNE":
          return isReg(b)
            ? 0x9000 | (parseReg(a) << 8) | (parseReg(b) << 4)
            : 0x4000 | (parseReg(a) << 8) | parseByte(b);

        case "LDI": return 0x6000 | (parseReg(a) << 8) | parseByte(b);
        case "ADDI": return 0x7000 | (parseReg(a) << 8) | parseByte(b);

        case "MOV": return 0x8000 | (parseReg(a) << 8) | (parseReg(b) << 4);
        case "OR": return 0x8000 | (parseReg(a) << 8) | (parseReg(b) << 4) | 0x01;
        case "AND": return 0x8000 | (parseReg(a) << 8) | (parseReg(b) << 4) | 0x02;
        case "XOR": return 0x8000 | (parseReg(a) << 8) | (parseReg(b) << 4) | 0x03;
        case "ADD": return 0x8000 | (parseReg(a) << 8) | (parseReg(b) << 4) | 0x04;
        case "SUB": return 0x8000 | (parseReg(a) << 8) | (parseReg(b) << 4) | 0x05;
        case "SHR": return 0x8000 | (parseReg(a) << 8) | (parseReg(b) << 4) | 0x06;
        case "SUBR": return 0x8000 | (parseReg(a) << 8) | (parseReg(b) << 4) | 0x07;
        case "SHL": return 0x8000 | (parseReg(a) << 8) | (parseReg(b) << 4) | 0x0E;

        case "RAND": return 0xC000 | (parseReg(a) << 8) | parseByte(b);
        case "DRW": return 0xD000 | (parseReg(a) << 8) | (parseReg(b) << 4) | (parseByte(c) & 15);

        case "SKIP_DOWN": return 0xE000 | (parseReg(a) << 8) | 0x9E;
        case "SKIP_UP": return 0xE000 | (parseReg(a) << 8) | 0xA1;

        case "GTD": return 0xF000 | (parseReg(a) << 8) | 0x07;
        case "KEY": return 0xF000 | (parseReg(a) << 8) | 0x0A;
        case "SETD": return 0xF000 | (parseReg(a) << 8) | 0x15;
        case "SETS": return 0xF000 | (parseReg(a) << 8) | 0x18;
        case "IADD": return 0xF000 | (parseReg(a) << 8) | 0x1E;
        case "FONT": return 0xF000 | (parseReg(a) << 8) | 0x29;
        case "BCD": return 0xF000 | (parseReg(a) << 8) | 0x33;
        case "STORE": return 0xF000 | (parseReg(a) << 8) | 0x55;
        case "LOAD": return 0xF000 | (parseReg(a) << 8) | 0x65;

        case "ANI": return 0xA000 | parseAddr(a);
        default: return 0x0000;
      }
    }

    const lines = src.split(/\r?\n/);
    for (const raw of lines) {
      let line = raw;
      const comment = line.indexOf(";");
      if (comment >= 0) line = line.slice(0, comment);
      line = line.trim();
      if (!line) continue;

      const tokens = line.split(/[\s,]+/).filter(Boolean);
      let start = 0;

      if (tokens[0] && tokens[0].endsWith(":")) {
        labels.set(tokens[0].slice(0, -1), addr);
        start = 1;
      }

      if (start >= tokens.length) continue;

      const mn = tokens[start].toUpperCase();
      const args = tokens.slice(start + 1);
      let size = 2;
      if (mn === "DB") size = args.length;

      items.push({ mn, args, size });
      addr += size;
    }

    const total = Math.max(0, addr - 0x200);
    const out = new Uint8Array(total);
    let off = 0;

    for (const item of items) {
      if (item.mn === "DB") {
        for (const arg of item.args) {
          if (off < out.length) out[off++] = parseByte(arg);
        }
        continue;
      }

      const code = encode(item.mn, item.args);
      if (off < out.length) out[off++] = (code >>> 8) & 255;
      if (off < out.length) out[off++] = code & 255;
    }

    return out;
  }

  function fallbackROM() {
    return new Uint8Array([0x00, 0xE0, 0x12, 0x02]);
  }

  const PONG_SOURCE = `
CLS
LDI V2,$00
LDI V3,$3F
LDI V0,$20
LDI V1,$10
LDI V4,$01
LDI V5,$01
LDI V6,$10
LDI V7,$10
LDI V10,$04 ; key 4 up
LDI V11,$0D ; key D down
LDI V12,$00 ; right score
LDI V13,$01 ; frame delay
LDI V14,$00 ; left score
JP LOOP

WAIT:
 SETD V13
WAIT1:
 GTD V8
 SE V8,$00
 JP WAIT1
 RET

PLAYER_MOVE:
 SKIP_UP V10
 CALL P_UP
 SKIP_UP V11
 CALL P_DOWN
 RET

P_UP:
 SE V6,$00
 ADDI V6,$FF
 RET

P_DOWN:
 SE V6,$1F
 ADDI V6,$01
 RET

CPU_MOVE:
 MOV V8,V7
 SUB V8,V1
 SNE VF,$00
 CALL CPU_DOWN
 SNE VF,$01
 CALL CPU_UP
 RET

CPU_DOWN:
 SE V7,$1F
 ADDI V7,$01
 RET

CPU_UP:
 SE V7,$00
 ADDI V7,$FF
 RET

DRAW_PADDLES:
 ANI PADDLE
 DRW V2,V6,$04
 DRW V3,V7,$04
 RET

BALL_STEP:
 SNE V1,$00
 LDI V5,$01
 SNE V1,$1F
 LDI V5,$FF
 ADD V0,V4
 ADD V1,V5
 ANI BALL
 DRW V0,V1,$01
 SNE VF,$01
 JP HIT_SIDE
 JP CHECK_MISS
HIT_SIDE:
 SNE V0,$00
 LDI V4,$01
 SNE V0,$3F
 LDI V4,$FF
 JP END_STEP
CHECK_MISS:
 SNE V0,$00
 JP MISS_LEFT
 SNE V0,$3F
 JP MISS_RIGHT
 JP END_STEP
MISS_LEFT:
 ADDI V12,$01
 SNE V12,$0A
 LDI V12,$00
 JP RESET_BALL
MISS_RIGHT:
 ADDI V14,$01
 SNE V14,$0A
 LDI V14,$00
RESET_BALL:
 LDI V0,$20
 LDI V1,$10
 LDI V4,$01
 LDI V5,$01
END_STEP:
 RET

SCORE_DRAW:
 FONT V14
 LDI V8,$10
 LDI V9,$18
 DRW V8,V9,$05
 FONT V12
 LDI V8,$2C
 LDI V9,$18
 DRW V8,V9,$05
 RET

LOOP:
 CALL WAIT
 CALL PLAYER_MOVE
 CALL CPU_MOVE
 CLS
 CALL DRAW_PADDLES
 CALL BALL_STEP
 CALL SCORE_DRAW
 JP LOOP

BALL:
DB $80
PADDLE:
DB $80,$80,$80,$80
`;

  const SHOOTER_SOURCE = `
CLS
LDI V0,$1E
LDI V1,$1E
LDI V2,$00
LDI V3,$FF
LDI V10,$04 ; key 4 left
LDI V11,$0D ; key D right
LDI V12,$08 ; key 8 fire
LDI V13,$01 ; frame delay
CALL DRAW_ENEMIES
ANI PLAYER
DRW V0,V1,$01
JP LOOP

WAIT:
 SETD V13
WAIT1:
 GTD V8
 SE V8,$00
 JP WAIT1
 RET

MOVE_PLAYER:
 SKIP_UP V10
 CALL TRY_LEFT
 SKIP_UP V11
 CALL TRY_RIGHT
 RET

TRY_LEFT:
 SNE V0,$00
 RET
 ANI PLAYER
 DRW V0,V1,$01
 ADDI V0,$FF
 DRW V0,V1,$01
 RET

TRY_RIGHT:
 SNE V0,$3D ; max x = 61
 RET
 ANI PLAYER
 DRW V0,V1,$01
 ADDI V0,$01
 DRW V0,V1,$01
 RET

START_LASER:
 SE V3,$FF
 RET
 MOV V2,V0
 ADDI V2,$02
 MOV V3,V1
 ADDI V3,$FF
 ANI LASER
 DRW V2,V3,$01
 RET

UPDATE_LASER:
 SNE V3,$FF
 RET
 CALL DRAW_LASER_OLD
 ADDI V3,$FF
 SE V3,$FF
 JP LASER_ACTIVE
 RET
LASER_ACTIVE:
 CALL DRAW_LASER_NEW
 SNE VF,$01
 JP HIT
 RET
HIT:
 LDI V8,$08
 SETS V8
 LDI V3,$FF
 RET

DRAW_LASER_OLD:
 ANI LASER
 DRW V2,V3,$01
 RET

DRAW_LASER_NEW:
 ANI LASER
 DRW V2,V3,$01
 RET

DRAW_ENEMIES:
 ANI DOT
 LDI V9,$04
ENEMY_Y:
 LDI V8,$08
ENEMY_X:
 DRW V8,V9,$01
 ADDI V8,$0C
 SE V8,$38
 JP ENEMY_X
 ADDI V9,$08
 SE V9,$24
 JP ENEMY_Y
 RET

LOOP:
 CALL WAIT
 SKIP_UP V12
 CALL START_LASER
 CALL UPDATE_LASER
 JP LOOP

DOT:
DB $80
LASER:
DB $80
PLAYER:
DB $F0
`;

  function buildROMs() {
    const defs = [
      {
        name: "Pong",
        hint: "Pong: hold key 4 or D to move the left paddle (physical Q/R). Right CPU tracks the ball.",
        src: PONG_SOURCE
      },
      {
        name: "Targets",
        hint: "Targets: hold key 4 or D to move (physical Q/R), key 8 fires a laser (physical S).",
        src: SHOOTER_SOURCE
      }
    ];

    return defs.map(def => {
      let bytes;
      try {
        bytes = assembleROM(def.src);
      } catch (e) {
        bytes = fallbackROM();
      }
      if (!bytes || bytes.length === 0) bytes = fallbackROM();
      return { name: def.name, hint: def.hint, bytes };
    });
  }

  const ROMS = buildROMs();

  const displayCanvas = document.getElementById("display");
  const ctx = displayCanvas ? displayCanvas.getContext("2d") : null;

  const playBtn = document.getElementById("play");
  const stepBtn = document.getElementById("step");
  const resetBtn = document.getElementById("reset");
  const speedInput = document.getElementById("speed");
  const speedValue = document.getElementById("speedValue");
  const romSel = document.getElementById("rom");
  const muteBtn = document.getElementById("mute");
  const statusEl = document.getElementById("status");
  const ledEl = document.getElementById("led");
  const hintEl = document.getElementById("hint");

  const dbgI = document.getElementById("dbgI");
  const dbgPc = document.getElementById("dbgPc");
  const dbgSp = document.getElementById("dbgSp");
  const dbgState = document.getElementById("dbgState");
  const dbgDelay = document.getElementById("dbgDelay");
  const dbgSound = document.getElementById("dbgSound");
  const disasmEl = document.getElementById("disasm");
  const regsEl = document.getElementById("regs");
  const regheadEl = document.getElementById("reghead");

  const keyButtons = new Array(16).fill(null);
  document.querySelectorAll("button[data-key]").forEach(btn => {
    const k = parseInt(String(btn.dataset.key), 16) & 15;
    keyButtons[k] = btn;
  });

  const regCells = [];
  if (regheadEl) {
    for (let i = 0; i < 16; i++) {
      const s = document.createElement("span");
      s.textContent = "V" + hexReg(i);
      regheadEl.appendChild(s);
    }
  }
  if (regsEl) {
    for (let i = 0; i < 16; i++) {
      const s = document.createElement("span");
      s.className = "reg";
      s.textContent = "00";
      regsEl.appendChild(s);
      regCells.push(s);
    }
  }

  function normalizeKey(k) {
    if (typeof k === "string") {
      const s = k.trim().toLowerCase();
      if (/^[0-9a-f]$/.test(s)) return parseInt(s, 16) & 15;
    }
    const n = Number(k);
    if (!Number.isFinite(n)) return 0;
    return n & 15;
  }

  function updateKeyButton(k) {
    const btn = keyButtons[k];
    if (btn) btn.setAttribute("aria-pressed", keyDown[k] ? "true" : "false");
  }

  function setKeyDown(k) {
    const down = (keySrc[k] & 255) !== 0 ? 1 : 0;
    if (keyDown[k] !== down) {
      keyDown[k] = down;
      updateKeyButton(k);
    }
  }

  function pressInternal(k, flag) {
    const key = normalizeKey(k);
    keySrc[key] = (keySrc[key] | flag) & 255;
    setKeyDown(key);

    if (waitingKey && waitingX >= 0) {
      V[waitingX] = key;
      pc = (pc + 2) & 0xFFF;
      waitingKey = false;
      waitingX = -1;
      updateUI();
      updateDebugger();
    }
  }

  function releaseInternal(k, flag) {
    const key = normalizeKey(k);
    keySrc[key] = (keySrc[key] & ~flag) & 255;
    setKeyDown(key);
  }

  function pressPointer(k) {
    const key = normalizeKey(k);
    pointerCount[key] = Math.min(255, pointerCount[key] + 1);
    keySrc[key] = (keySrc[key] | POINTER_FLAG) & 255;
    setKeyDown(key);
  }

  function releasePointer(k) {
    const key = normalizeKey(k);
    if (pointerCount[key] > 0) pointerCount[key]--;
    if (pointerCount[key] === 0) {
      keySrc[key] = (keySrc[key] & ~POINTER_FLAG) & 255;
      setKeyDown(key);
    }
  }

  function syncKeyButtons() {
    for (let i = 0; i < 16; i++) updateKeyButton(i);
  }

  function normalizeRom(bytes) {
    if (!bytes) return new Uint8Array(0);
    let len = bytes.length;
    if (typeof len !== "number" || !Number.isFinite(len) || len < 0) len = 0;
    len = Math.min(len, MAX_ROM_BYTES);
    const out = new Uint8Array(len);
    for (let i = 0; i < len; i++) out[i] = bytes[i] & 255;
    return out;
  }

  function stopRun() {
    if (runTimer !== null) {
      clearTimeout(runTimer);
      runTimer = null;
    }
  }

  function startRun() {
    if (!runningFlag) return;
    if (runTimer === null) {
      lastRun = performance.now();
      instrAcc = 0;
      timerAcc = 0;
      runTimer = setTimeout(runTick, Math.max(1, 1000 / 60));
    }
  }

  function tickTimers() {
    if (delay > 0) delay--;
    if (sound > 0) sound--;
  }

  function internalReset() {
    runningFlag = false;
    stopRun();

    mem.fill(0);
    mem.set(FONT, 0x50);
    if (currentRom.length) mem.set(currentRom, 0x200);

    V.fill(0);
    stack.fill(0);
    display.fill(0);

    I = 0;
    pc = 0x200;
    sp = 0;
    delay = 0;
    sound = 0;
    halted = false;
    waitingKey = false;
    waitingX = -1;

    instrAcc = 0;
    timerAcc = 0;

    syncKeyButtons();
    updateBeeper();
    render();
    updateUI();
    updateDebugger();
  }

  function loadBytes(bytes) {
    currentRom = normalizeRom(bytes);
    internalReset();
  }

  function executeInstructions(n) {
    if (!Number.isFinite(n)) n = 0;
    n = Math.max(0, Math.floor(n));
    if (n > 100000000) n = 100000000;

    let p = pc;
    let iv = I;
    let spL = sp;
    let del = delay;
    let snd = sound;
    let halt = halted;
    let wait = waitingKey;
    let wx = waitingX;

    const m = mem;
    const v = V;
    const d = display;
    const s = stack;
    const keys = keyDown;

    let executed = 0;

    for (let left = n; left > 0; left--) {
      if (halt || wait) break;

      const old = p;
      const next = (old + 2) & 0xFFF;
      const skip4 = (old + 4) & 0xFFF;
      const instr = (m[old] << 8) | m[(old + 1) & 0xFFF];

      const byte1 = instr >>> 8;
      const opcode = byte1 >>> 4;
      const x = byte1 & 15;
      const lo = instr & 255;
      const y = (lo >>> 4) & 15;
      const nn = lo;
      const op = lo & 15;
      const nnn = instr & 0xFFF;

      switch (opcode) {
        case 0: {
          if (byte1 === 0x00 && lo === 0xE0) {
            d.fill(0);
            p = next;
          } else if (byte1 === 0x00 && lo === 0xEE) {
            if (spL > 0) {
              spL--;
              p = s[spL] & 0xFFF;
            } else {
              halt = true;
              p = old;
            }
          } else {
            p = next;
          }
          break;
        }

        case 1:
          p = nnn;
          break;

        case 2:
          if (spL >= 16) {
            halt = true;
            p = old;
          } else {
            s[spL] = next;
            spL++;
            p = nnn;
          }
          break;

        case 3:
          p = (v[x] === nn) ? skip4 : next;
          break;

        case 4:
          p = (v[x] !== nn) ? skip4 : next;
          break;

        case 5:
          if (op !== 0) {
            halt = true;
            p = old;
          } else {
            p = (v[x] === v[y]) ? skip4 : next;
          }
          break;

        case 6:
          v[x] = nn;
          p = next;
          break;

        case 7:
          v[x] = (v[x] + nn) & 255;
          p = next;
          break;

        case 8: {
          const vx = v[x];
          const vy = v[y];

          if (op === 0) {
            v[x] = vy;
            p = next;
          } else if (op === 1) {
            v[x] = (vx | vy) & 255;
            v[15] = 0;
            p = next;
          } else if (op === 2) {
            v[x] = (vx & vy) & 255;
            v[15] = 0;
            p = next;
          } else if (op === 3) {
            v[x] = (vx ^ vy) & 255;
            v[15] = 0;
            p = next;
          } else if (op === 4) {
            const t = vx + vy;
            v[x] = t & 255;
            v[15] = (t > 255) ? 1 : 0;
            p = next;
          } else if (op === 5) {
            const flag = (vx >= vy) ? 1 : 0;
            const nv = (vx - vy) & 255;
            if (x === 15) {
              v[15] = flag;
              v[15] = nv;
            } else {
              v[15] = flag;
              v[x] = nv;
            }
            p = next;
          } else if (op === 6) {
            const flag = vy & 1;
            const nv = vy >> 1;
            if (x === 15) {
              v[15] = flag;
              v[15] = nv;
            } else {
              v[15] = flag;
              v[x] = nv;
            }
            p = next;
          } else if (op === 7) {
            const flag = (vy >= vx) ? 1 : 0;
            const nv = (vy - vx) & 255;
            if (x === 15) {
              v[15] = flag;
              v[15] = nv;
            } else {
              v[15] = flag;
              v[x] = nv;
            }
            p = next;
          } else if (op === 14) {
            const flag = vy >> 7;
            const nv = (vy << 1) & 255;
            if (x === 15) {
              v[15] = flag;
              v[15] = nv;
            } else {
              v[15] = flag;
              v[x] = nv;
            }
            p = next;
          } else {
            halt = true;
            p = old;
          }
          break;
        }

        case 9:
          if (op !== 0) {
            halt = true;
            p = old;
          } else {
            p = (v[x] !== v[y]) ? skip4 : next;
          }
          break;

        case 10:
          iv = nnn;
          p = next;
          break;

        case 11:
          p = (nnn + v[0]) & 0xFFF;
          break;

        case 12: {
          const rnd = Math.floor(Math.random() * 256);
          v[x] = rnd & nn;
          p = next;
          break;
        }

        case 13: {
          const startX = v[x] & 63;
          const startY = v[y] & 31;
          const rows = op === 0 ? 16 : op;
          let collision = 0;

          for (let r = 0; r < rows; r++) {
            const sy = startY + r;
            if (sy >= 32) break;

            const byte = m[(iv + r) & 0xFFF];
            if (byte === 0) continue;

            for (let c = 0; c < 8; c++) {
              const bit = 128 >>> c;
              if ((byte & bit) === 0) continue;

              const sx = startX + c;
              if (sx >= 64) break;

              const idx = (sy << 6) + sx;
              if (d[idx]) {
                d[idx] = 0;
                collision = 1;
              } else {
                d[idx] = 1;
              }
            }
          }

          v[15] = collision ? 1 : 0;
          p = next;
          break;
        }

        case 14: {
          const key = v[x] & 15;
          if (lo === 0x9E) {
            p = keys[key] ? skip4 : next;
          } else if (lo === 0xA1) {
            p = !keys[key] ? skip4 : next;
          } else {
            halt = true;
            p = old;
          }
          break;
        }

        case 15: {
          if (lo === 0x07) {
            v[x] = del;
            p = next;
          } else if (lo === 0x0A) {
            let key = -1;
            for (let k = 0; k < 16; k++) {
              if (keys[k]) {
                key = k;
                break;
              }
            }
            if (key >= 0) {
              v[x] = key;
              p = next;
            } else {
              wait = true;
              wx = x;
              p = old;
            }
          } else if (lo === 0x15) {
            del = v[x];
            p = next;
          } else if (lo === 0x18) {
            snd = v[x];
            p = next;
          } else if (lo === 0x1E) {
            iv = (iv + v[x]) & 0xFFF;
            p = next;
          } else if (lo === 0x29) {
            iv = 0x50 + 5 * (v[x] & 15);
            p = next;
          } else if (lo === 0x33) {
            const val = v[x];
            m[iv & 0xFFF] = Math.floor(val / 100);
            m[(iv + 1) & 0xFFF] = Math.floor((val % 100) / 10);
            m[(iv + 2) & 0xFFF] = val % 10;
            p = next;
          } else if (lo === 0x55) {
            for (let k = 0; k <= x; k++) m[(iv + k) & 0xFFF] = v[k];
            iv = (iv + x + 1) & 0xFFF;
            p = next;
          } else if (lo === 0x65) {
            for (let k = 0; k <= x; k++) v[k] = m[(iv + k) & 0xFFF];
            iv = (iv + x + 1) & 0xFFF;
            p = next;
          } else {
            halt = true;
            p = old;
          }
          break;
        }

        default:
          halt = true;
          p = old;
          break;
      }

      executed++;
    }

    pc = p;
    I = iv;
    sp = spL;
    delay = del;
    sound = snd;
    halted = halt;
    waitingKey = wait;
    waitingX = wx;

    return executed;
  }

  function runTick() {
    if (!runningFlag) {
      runTimer = null;
      return;
    }

    const now = performance.now();
    let dt = now - lastRun;
    if (!Number.isFinite(dt) || dt < 0) dt = 0;
    if (dt > 1000) dt = 1000;
    lastRun = now;

    timerAcc += dt * 0.060;
    while (timerAcc >= 1) {
      timerAcc -= 1;
      tickTimers();
    }

    if (!halted && !waitingKey) {
      instrAcc += speed * dt / 1000;
      const exec = Math.floor(instrAcc);
      if (exec > 0) {
        instrAcc -= exec;
        executeInstructions(exec);
      }
    } else {
      instrAcc = 0;
    }

    updateBeeper();
    render();
    updateDebugger();
    updateUI();

    if (runningFlag) {
      runTimer = setTimeout(runTick, Math.max(1, 1000 / 60));
    } else {
      runTimer = null;
    }
  }

  let audioCtx = null;
  let audioOsc = null;
  let audioGain = null;
  let lastGainTarget = null;

  function ensureAudio() {
    try {
      if (audioCtx) {
        if (audioCtx.state === "suspended") audioCtx.resume().catch(() => {});
        return;
      }

      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;

      audioCtx = new AC();
      audioOsc = audioCtx.createOscillator();
      audioOsc.type = "square";
      audioOsc.frequency.value = 440;

      audioGain = audioCtx.createGain();
      audioGain.gain.value = 0;

      audioOsc.connect(audioGain);
      audioGain.connect(audioCtx.destination);
      audioOsc.start(0);

      updateBeeper(true);
    } catch (e) {
      audioCtx = null;
      audioOsc = null;
      audioGain = null;
    }
  }

  function updateBeeper(force) {
    if (!audioCtx || !audioGain) return;
    try {
      const target = (!mute && runningFlag && sound > 0) ? 0.14 : 0;
      if (!force && target === lastGainTarget) return;
      lastGainTarget = target;
      audioGain.gain.setTargetAtTime(target, audioCtx.currentTime, 0.015);
    } catch (e) {}
  }

  function render() {
    if (!ctx) return;
    ctx.clearRect(0, 0, 64, 32);
    ctx.fillStyle = "#a8ffd7";

    for (let y = 0, base = 0; y < 32; y++, base += 64) {
      for (let x = 0; x < 64; x++) {
        if (display[base + x]) ctx.fillRect(x, y, 1, 1);
      }
    }
  }

  function disassembleAt(addr) {
    const a = addr & 0xFFF;
    const b = (a + 1) & 0xFFF;
    const instr = (mem[a] << 8) | mem[b];
    const byte1 = instr >>> 8;
    const opcode = byte1 >>> 4;
    const x = byte1 & 15;
    const lo = instr & 255;
    const y = (lo >>> 4) & 15;
    const nn = lo;
    const op = lo & 15;
    const nnn = instr & 0xFFF;

    if (opcode === 0) {
      if (instr === 0x00E0) return "CLS";
      if (instr === 0x00EE) return "RET";
      return "NOP 0x" + hex3(nn);
    }
    if (opcode === 1) return "JP 0x" + hex3(nnn);
    if (opcode === 2) return "CALL 0x" + hex3(nnn);
    if (opcode === 3) return "SE V" + hexReg(x) + ",0x" + hex2(nn);
    if (opcode === 4) return "SNE V" + hexReg(x) + ",0x" + hex2(nn);
    if (opcode === 5) return op === 0 ? "SE V" + hexReg(x) + ",V" + hexReg(y) : "HALT 0x" + hex4(instr);
    if (opcode === 6) return "LDI V" + hexReg(x) + ",0x" + hex2(nn);
    if (opcode === 7) return "ADDI V" + hexReg(x) + ",0x" + hex2(nn);
    if (opcode === 8) {
      const reg = " V" + hexReg(x) + ",V" + hexReg(y);
      if (op === 0) return "MOV" + reg;
      if (op === 1) return "OR" + reg;
      if (op === 2) return "AND" + reg;
      if (op === 3) return "XOR" + reg;
      if (op === 4) return "ADD" + reg;
      if (op === 5) return "SUB" + reg;
      if (op === 6) return "SHR" + reg;
      if (op === 7) return "SUBR" + reg;
      if (op === 14) return "SHL" + reg;
      return "HALT 0x" + hex4(instr);
    }
    if (opcode === 9) return op === 0 ? "SNE V" + hexReg(x) + ",V" + hexReg(y) : "HALT 0x" + hex4(instr);
    if (opcode === 10) return "I = 0x" + hex3(nnn);
    if (opcode === 11) return "JP 0x" + hex3(nnn) + " + V0";
    if (opcode === 12) return "RAND V" + hexReg(x) + ",0x" + hex2(nn);
    if (opcode === 13) return "DRW V" + hexReg(x) + ",V" + hexReg(y) + "," + (op === 0 ? 16 : op);
    if (opcode === 14) {
      if (lo === 0x9E) return "SKIP DOWN V" + hexReg(x);
      if (lo === 0xA1) return "SKIP UP V" + hexReg(x);
      return "HALT 0x" + hex4(instr);
    }
    if (opcode === 15) {
      if (lo === 0x07) return "V" + hexReg(x) + " = delay";
      if (lo === 0x0A) return "KEY V" + hexReg(x);
      if (lo === 0x15) return "delay = V" + hexReg(x);
      if (lo === 0x18) return "sound = V" + hexReg(x);
      if (lo === 0x1E) return "I += V" + hexReg(x);
      if (lo === 0x29) return "FONT V" + hexReg(x);
      if (lo === 0x33) return "BCD V" + hexReg(x);
      if (lo === 0x55) return "STORE V" + hexReg(x);
      if (lo === 0x65) return "LOAD V" + hexReg(x);
      return "HALT 0x" + hex4(instr);
    }

    return "HALT 0x" + hex4(instr);
  }

  function stateText() {
    if (halted) return "HALT";
    if (waitingKey) return "KEY";
    if (runningFlag) return "RUN";
    return "PAUSE";
  }

  function updateDebugger() {
    for (let i = 0; i < 16; i++) {
      if (regCells[i]) regCells[i].textContent = hex2(V[i]);
    }

    if (dbgI) dbgI.textContent = hex4(I);
    if (dbgPc) dbgPc.textContent = hex4(pc);
    if (dbgSp) dbgSp.textContent = String(sp);
    if (dbgState) dbgState.textContent = stateText();
    if (dbgDelay) dbgDelay.textContent = String(delay);
    if (dbgSound) dbgSound.textContent = String(sound);

    if (disasmEl) {
      disasmEl.textContent = disassembleAt(pc) + "\n" + disassembleAt(pc + 2) + "\n" + disassembleAt(pc + 4);
    }
  }

  function updateUI() {
    if (statusEl) statusEl.textContent = stateText();
    if (playBtn) {
      playBtn.textContent = runningFlag ? "Pause" : "Run";
      playBtn.setAttribute("aria-pressed", runningFlag ? "true" : "false");
    }
    if (ledEl) ledEl.classList.toggle("on", runningFlag && !halted);
    if (muteBtn) muteBtn.setAttribute("aria-pressed", mute ? "true" : "false");
    if (speedValue) speedValue.textContent = String(speed);
    if (hintEl && ROMS[currentIndex]) hintEl.textContent = ROMS[currentIndex].hint;
  }

  function loadSettings() {
    try {
      const s = localStorage.getItem("octet.speed");
      if (s !== null) {
        const parsed = parseInt(s, 10);
        if (Number.isFinite(parsed)) speed = Math.max(60, Math.min(3600, parsed));
      }

      const m = localStorage.getItem("octet.mute");
      if (m !== null) mute = m === "1";

      const r = localStorage.getItem("octet.rom");
      if (r !== null) {
        const parsed = parseInt(r, 10);
        if (Number.isFinite(parsed) && parsed >= 0 && parsed < ROMS.length) currentIndex = parsed;
      }
    } catch (e) {}

    if (speedInput) {
      speedInput.value = String(speed);
    }
    if (romSel) {
      romSel.value = String(currentIndex);
    }
    updateUI();
  }

  function saveSettings() {
    try {
      localStorage.setItem("octet.speed", String(speed));
      localStorage.setItem("octet.mute", mute ? "1" : "0");
      localStorage.setItem("octet.rom", String(currentIndex));
    } catch (e) {}
  }

  function loadSelectedRom() {
    if (!romSel) return;
    const parsed = parseInt(romSel.value, 10);
    if (!Number.isFinite(parsed) || parsed < 0 || parsed >= ROMS.length) parsed = 0;
    currentIndex = parsed;
    romSel.value = String(currentIndex);
    updateUI();
    loadBytes(ROMS[currentIndex].bytes);
    saveSettings();
  }

  const api = {
    load: function (bytes) {
      loadBytes(bytes);
    },
    reset: function () {
      internalReset();
    },
    step: function (n) {
      if (n === undefined) n = 1;
      const executed = executeInstructions(Number(n));
      updateBeeper();
      render();
      updateDebugger();
      updateUI();
      return executed;
    },
    play: function () {
      if (!runningFlag) {
        runningFlag = true;
        startRun();
        updateUI();
        updateDebugger();
      }
    },
    pause: function () {
      if (runningFlag) {
        runningFlag = false;
        stopRun();
        updateBeeper();
        render();
        updateDebugger();
        updateUI();
      }
    },
    running: function () {
      return runningFlag;
    },
    state: function () {
      return {
        v: Array.from(V),
        i: I,
        pc: pc,
        sp: sp,
        stack: Array.from(stack),
        delay: delay,
        sound: sound,
        halted: halted,
        waitingKey: waitingKey
      };
    },
    memory: function () {
      return mem.slice();
    },
    display: function () {
      return Array.from(display);
    },
    press: function (k) {
      pressInternal(k, API_FLAG);
    },
    release: function (k) {
      releaseInternal(k, API_FLAG);
    },
    keysDown: function () {
      const out = [];
      for (let i = 0; i < 16; i++) {
        if (keyDown[i]) out.push(i);
      }
      return out;
    }
  };

  window.__arena = api;

  function togglePlay() {
    ensureAudio();
    if (runningFlag) api.pause();
    else api.play();
    updateUI();
    updateDebugger();
  }

  function onPointerDown(e) {
    ensureAudio();

    if (e.button !== undefined && e.button !== 0) return;

    const btn = e.target && typeof e.target.closest === "function"
      ? e.target.closest("button[data-key]")
      : null;
    if (!btn) return;

    const key = parseInt(String(btn.dataset.key), 16) & 15;
    if (!Number.isFinite(key)) return;

    if (pointerMap.has(e.pointerId)) {
      const old = pointerMap.get(e.pointerId);
      releasePointer(old);
      pointerMap.delete(e.pointerId);
    }

    pointerMap.set(e.pointerId, key);
    pressPointer(key);
  }

  function onPointerUpOrCancel(e) {
    const key = pointerMap.get(e.pointerId);
    if (key !== undefined) {
      releasePointer(key);
      pointerMap.delete(e.pointerId);
    }
  }

  document.addEventListener("pointerdown", onPointerDown, { passive: true });
  document.addEventListener("pointerup", onPointerUpOrCancel, { passive: true });
  document.addEventListener("pointercancel", onPointerUpOrCancel, { passive: true });

  const KEY_MAP = {
    "1": 1,
    "2": 2,
    "3": 3,
    "4": 12,
    "q": 4,
    "w": 5,
    "e": 6,
    "r": 13,
    "a": 7,
    "s": 8,
    "d": 9,
    "f": 14,
    "z": 10,
    "x": 0,
    "c": 11,
    "v": 15
  };

  function isTextEntry(el) {
    if (!el || !el.tagName) return false;
    const tag = el.tagName.toUpperCase();
    if (tag === "TEXTAREA") return true;
    if (tag === "INPUT") {
      const type = String(el.type || "").toLowerCase();
      return type === "text" || type === "search" || type === "email" ||
             type === "url" || type === "password" || type === "tel";
    }
    return false;
  }

  document.addEventListener("keydown", e => {
    const target = e.target;

    if (isTextEntry(target)) return;

    if (e.key === " ") {
      if (e.repeat) return;
      ensureAudio();
      e.preventDefault();
      togglePlay();
      return;
    }

    if (target && target.tagName && target.tagName.toUpperCase() === "SELECT") return;
    if (e.repeat) return;

    const key = KEY_MAP[String(e.key || "").toLowerCase()];
    if (key === undefined) return;

    ensureAudio();
    e.preventDefault();

    if (!(keySrc[key] & PHYS_FLAG)) pressInternal(key, PHYS_FLAG);
  });

  document.addEventListener("keyup", e => {
    const target = e.target;
    if (isTextEntry(target)) return;

    const key = KEY_MAP[String(e.key || "").toLowerCase()];
    if (key === undefined) return;

    if (keySrc[key] & PHYS_FLAG) releaseInternal(key, PHYS_FLAG);
  });

  window.addEventListener("blur", () => {
    for (let i = 0; i < 16; i++) {
      if (keySrc[i] & (PHYS_FLAG | POINTER_FLAG)) {
        keySrc[i] = (keySrc[i] & ~(PHYS_FLAG | POINTER_FLAG)) & 255;
        setKeyDown(i);
      }
    }
    pointerMap.clear();
    pointerCount.fill(0);
  });

  if (playBtn) playBtn.addEventListener("click", togglePlay);

  if (stepBtn) stepBtn.addEventListener("click", () => {
    if (runningFlag) api.pause();
    api.step(1);
  });

  if (resetBtn) resetBtn.addEventListener("click", () => {
    api.reset();
  });

  if (muteBtn) muteBtn.addEventListener("click", () => {
    ensureAudio();
    mute = !mute;
    updateBeeper(true);
    updateUI();
    saveSettings();
  });

  if (speedInput) speedInput.addEventListener("input", () => {
    const parsed = parseInt(speedInput.value, 10);
    if (Number.isFinite(parsed)) {
      speed = Math.max(60, Math.min(3600, parsed));
      speedInput.value = String(speed);
      updateUI();
      saveSettings();
    }
  });

  if (romSel) romSel.addEventListener("change", () => {
    loadSelectedRom();
  });

  function init() {
    loadSettings();
    loadSelectedRom();
    render();
    updateDebugger();
    updateUI();
  }

  init();
})();
</script>
</body>
</html>
```