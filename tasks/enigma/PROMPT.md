# Task: Enigma — a faithful Enigma M3 machine simulator

Build a single-file, interactive simulator of the three-rotor Enigma I / M3 machine. This
is a correctness task first: the grader compares your ciphertext against a reference
implementation, letter for letter, across rotor choices, ring settings, plugboards and
long messages that cross multiple turnovers. The historically tricky details — the
double-stepping anomaly and ring-setting offsets — are where most implementations break.

## Ground rules

- Deliver **one file: `index.html`** with all HTML, CSS and JavaScript inline.
- **No external resources of any kind**: no CDNs, libraries, frameworks, web fonts or remote
  images. Network access is blocked during grading.
- Target: latest desktop Google Chrome at a 1280×800 viewport; adapt to window resizing.
- No errors in the console. Never use `alert`, `confirm` or `prompt`.
- You are scored two ways: an automated grader drives the controls with real input events
  (follow the *Grader contract* exactly — ids are case-sensitive), and blind human judging
  compares design and feel side by side with other submissions.

## The machine

### Rotors (wiring maps A→letter, and turnover notch)

| Rotor | Wiring (index A…Z)             | Notch |
|-------|--------------------------------|-------|
| I     | `EKMFLGDQVZNTOWYHXUSPAIBRCJ`   | Q     |
| II    | `AJDKSIRUXBLHWTMCQGZNPYFVOE`   | E     |
| III   | `BDFHJLCPRTXVZNYEIWGAKMUSQO`   | V     |
| IV    | `ESOVPZJAYQUIRHXLNFTGKDCMWB`   | J     |
| V     | `VZBRGITYUPSDNHLXAWMJQOFECK`   | Z     |

Reflectors: **B** = `YRUHQSLDPXNGOKMIEBFZCWVJAT`, **C** = `FVPJIAOYEDRZXWGCTKUQSBNMHL`.

### Stepping (before each letter is encrypted)

Let the rotors be left / middle / right, each showing a window letter (its position):

1. If the **middle** rotor is at its notch: advance **left and middle** (the double-step).
2. Otherwise, if the **right** rotor is at its notch: advance **middle**.
3. Always advance **right**.

Classic check with rotors I-II-III (notches Q/E/V), windows starting `ADU`, encrypting one
letter at a time: `ADU → ADV → AEW → BFX → BFY`. Note the middle rotor steps twice in a
row around its notch — that is the anomaly you must reproduce.

### Signal path

For each input letter (A–Z, case-insensitive):

1. Step the rotors as above.
2. Plugboard swap.
3. Right rotor → middle rotor → left rotor (forward wiring).
4. Reflector.
5. Left → middle → right (inverse wiring).
6. Plugboard swap again → output letter (uppercase).

Non-letters pass through unchanged and **do not step the rotors**.

### Ring settings

Each rotor has a ring setting 1–26 (1 = A). With position `p` (0–25, the window letter),
ring `r` (0–25) and input letter `x` (0–25), the forward pass is

```
y = ( wiring[(x + p − r) mod 26] − p + r ) mod 26
```

and the inverse pass uses the inverse wiring the same way. Turnover is decided by the
**window letter** `p`, not by the ring-adjusted position.

### Plugboard

Space-separated letter pairs, e.g. `AB CD EF`: each pair swaps two letters, applied before
and after the rotor stack. Case-insensitive, each letter appears at most once, empty
string = no swaps.

### Worked example

Rotors I-II-III, reflector B, rings 1-1-1, start position AAA, no plugboard:

```
AAAAA      → BDZGO
HELLOWORLD → ILBDAAMTAZ
```

## UI and behavior

- Configuration controls:
  - `#rotor-left`, `#rotor-middle`, `#rotor-right` — `<select>` with options `I II III IV V`
    (defaults I, II, III).
  - `#reflector` — `<select>` with options `B`, `C` (default B).
  - `#ring-left`, `#ring-middle`, `#ring-right` — number inputs 1–26 (default 1).
  - `#pos-left`, `#pos-middle`, `#pos-right` — `<select>` with options `A`–`Z` (default A),
    the start positions.
  - `#plugboard` — text input, pairs as above (default empty).
- `#machine-input` (textarea) and `#machine-output` (readonly textarea).
- **Live re-encryption:** whenever the input changes, reset the rotor state to the
  configured start positions, encrypt the *entire* input left to right, and write the full
  ciphertext to `#machine-output`. Letters come out uppercase; non-letters pass through.
- Lampboard: 26 elements `[data-lamp="A"]` … `[data-lamp="Z"]`. After encryption, exactly
  one lamp — the **last letter encrypted** — has class `lit`. After a reset, none do.
- Rotor windows: `[data-window="left"]`, `[data-window="middle"]`, `[data-window="right"]`,
  each showing one uppercase letter: the current position **after** the last encryption
  (i.e. after all steps).
- `#reset-btn` and any configuration change: clear input and output, return the windows to
  the `#pos-*` start letters, extinguish all lamps.

### Polish (judged by humans)
- Make it feel like a machine: a convincing lampboard glow, rotor windows that read like
  odometers, satisfying key feedback, a layout that references the real device without
  cosplay. Typography and restraint over skeuomorphic clutter.

## Grader contract

1. All control ids above exist; selects and number inputs react to `input`/`change` events
   (the grader sets values programmatically and fires both).
2. `#machine-output.value` is the ciphertext of the whole `#machine-input.value` under the
   current configuration, recomputed on every input event.
3. Windows and lamps reflect the state defined above; `lit` is a class on the lamp element.
4. The grader types real keys as well as setting values; both paths must work.