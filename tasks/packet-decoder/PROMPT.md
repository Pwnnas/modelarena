# Task: Relay — a binary telemetry decoder and capture explorer

Build a single-file app with two halves:

1. **A decoder** for the small binary packet protocol specified below, exposed as
   `window.decodePacket` and driven by a hex-input UI.
2. **A capture explorer** for the telemetry capture shipped in this task's workspace —
   recovered, embedded and rendered with per-packet detail and aggregate stats.

## Ground rules

- Deliver **one file: `index.html`** with all HTML, CSS and JavaScript inline.
- **No external resources of any kind**: no CDNs, libraries, frameworks, web fonts or remote
  images. Network access is blocked during grading.
- The workspace folder next to this PROMPT.md contains:
  - `capture/` — the capture bundle. Read `capture/README.md`: the capture is a gzip stream
    split into three base64 parts, with a `manifest.json` of checksums to verify against.
    **Recover it with your tools** (decode, concatenate, gunzip, parse) and embed the
    packets in `index.html`.
  - `vectors.json` — test vectors (`{name, hex, expect}`) for the decoder. Use them to
    self-test while you build.

  If you cannot read the workspace files, still implement the decoder and both UIs from
  this spec with sample packets of your own: the decoder and UI checks are scored
  independently, but the capture checks require the exact bundle contents.
- Target: latest desktop Google Chrome at a 1280×800 viewport; adapt to window resizing.
- No errors in the console. Never use `alert`, `confirm` or `prompt`.
- You are scored two ways: an automated grader (follow the *Grader contract* exactly — ids
  and attributes are case-sensitive) and blind human judging of design and feel.

## The protocol

A packet is a byte string, usually written as lowercase hex:

```
offset  field
0       magic      0xA7
1       version    0x02
2       flags      bit0 temperature, bit1 humidity, bit2 battery, bit3 GPS.
                   Bits 4–7 must be zero.
3       seq        uint8 sequence number
4       N          device name length in bytes (1–15)
5…4+N   device     ASCII device name
```

Then the optional fields, **in this order**, each present only if its flag bit is set:

| field       | encoding                                                        |
|-------------|-----------------------------------------------------------------|
| temperature | zigzag varint, decidegrees °C (value ÷ 10, one decimal)         |
| humidity    | one raw byte, percent 0–100                                     |
| battery     | unsigned varint, millivolts                                     |
| gps         | two zigzag varints: latitude then longitude, degrees × 100000   |

The **last two bytes** are a CRC-16/CCITT-FALSE checksum over every preceding byte,
big-endian (high byte first).

- **Unsigned varint** = LEB128: 7 payload bits per byte, least-significant group first,
  high bit set means "another byte follows". At most 5 bytes per varint.
- **Zigzag**: encode `n ≥ 0 → 2n`, `n < 0 → −2n − 1`; decode `v → (v >>> 1) ^ −(v & 1)`.
- **CRC-16/CCITT-FALSE**: polynomial `0x1021`, initial value `0xFFFF`, no input/output
  reflection, no final XOR. Process each byte MSB-first.

### `window.decodePacket(hexString)`

Returns a plain object:

- Success: `{ ok: true, seq, device, temperature?, humidity?, battery?, gps? }` — include
  only the fields whose flag bits are set. `temperature` in °C (e.g. `-12.3`), `gps` as
  `{ lat, lon }` in degrees (e.g. `59.3293`).
- Failure: `{ ok: false, error }` where `error` is one of the codes below. **Apply the
  checks in exactly this order** (first failure wins):
  1. `"format"` — empty string, odd length, or non-hex characters.
  2. `"magic"` — first byte is not `0xA7`.
  3. `"version"` — second byte is not `0x02`.
  4. `"flags"` — any of bits 4–7 of the flags byte is set.
  5. `"truncated"` — the packet ends mid-header, mid-field, or a varint exceeds 5 bytes.
     (The final two bytes belong to the CRC, not to the fields.)
  6. `"trailing"` — bytes remain between the last field and the CRC.
  7. `"crc"` — the checksum does not match.

### Worked examples

```
a702000101611b7c
→ { ok: true, seq: 1, device: "a" }

a702010707626574612d303209089e
→ { ok: true, seq: 7, device: "beta-02", temperature: -0.5 }
```

(`vectors.json` in the workspace has 17 vectors covering every field and error code.)

## Decoder UI

- `#hex-input` (textarea) + `#decode-btn` (button). Clicking decodes the trimmed hex:
  - Success: `#decode-result` becomes visible and contains one `tr[data-field="<name>"]`
    per decoded field (`seq`, `device`, `temperature`, `humidity`, `battery`, `gps`), each
    with a `td.value` holding the value. GPS renders as `"<lat>, <lon>"` with five decimals;
    temperature with one decimal. `#decode-error` is hidden.
  - Failure: `#decode-error` becomes visible and its text contains the error code;
    `#decode-result` is hidden.
- Decoding again replaces the previous result.

## Capture explorer

- `#capture-list` shows one element per captured packet, in capture order:
  `[data-packet="<seq>"]`, where seq is the byte at offset 3 whenever the packet has at
  least 4 bytes. `data-device="<device name>"` is the name read from the header whenever
  the magic byte is correct and the full name fits in the packet — even if the packet
  later fails validation — otherwise `""`. Packets that fail to decode carry
  `data-invalid="true"`. Each item visibly shows at least the seq and device.
- Clicking an item renders its full decode into `#packet-detail`: the same
  `tr[data-field]` / `td.value` structure as the decoder UI for valid packets, or the
  error code text for invalid ones.
- Stats bar: `#stat-total`, `#stat-valid`, `#stat-invalid` (numbers in text),
  `#stat-min-temp` and `#stat-max-temp` — the min/max temperature **among valid packets
  that have a temperature**, one decimal — and one `[data-device-count="<device>"]` per
  device, whose text is the number of **valid** packets from that device.

### Polish (judged by humans)
- An instrument-panel feel: monospace hex, crisp field tables, clear valid/invalid states,
  a stats bar that reads at a glance. Dark or light, but commit to it.

## Grader contract

1. `window.decodePacket` is a function callable with a hex string, returning the objects
   above (numbers compared with tolerance 1e-6).
2. Decoder UI ids: `#hex-input`, `#decode-btn`, `#decode-result`, `#decode-error`; field
   rows `tr[data-field]` with `td.value`.
3. Capture items: `[data-packet]` with `data-device` and `data-invalid` attributes;
   detail pane `#packet-detail`; stats ids as listed.
4. "Hidden" means removed from the DOM, `display:none`, `hidden` or `visibility:hidden`.
5. Setting the textarea's value and firing `input`, then clicking the button, must decode.