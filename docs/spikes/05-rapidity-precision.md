# Spike 5 — Rapidity precision at γ = 1000

**Claim under test** (`ROADMAP.md` Phase 0): rapidity math holds precision at
γ = 1000 where β would lose six digits.

**Verdict: confirmed.** Storing β as f64 loses 6.3 digits to leading 9s at
γ = 1000 and recovers γ to only ~10 significant digits — a floor set by the
representation itself, not by arithmetic. Storing η recovers γ to ≤ 1 ulp.
The gap is a factor of ~125,000 in state resolution and it widens without
bound: at η ≈ 19.06 (γ ≈ 9.5 × 10⁷), f64 β rounds to exactly 1.0 and carries
zero information, while η remains an ordinary number.

## Method

Three stages, so every f64 result is measured against exact values rather than
against other f64 arithmetic:

1. `reference.py` — mpmath at 50 decimal digits produces the *correctly
   rounded* doubles for η and β at each test point (so results do not depend
   on any engine's `acosh`), plus 50-digit true values.
2. `spike.mjs` — the f64 experiments, on Node 24.19.0 / V8 13.6.233 (the
   engine family that will run the game). Every result is serialized as its
   shortest round-trip decimal.
3. `verify.py` — mpmath recovers the exact binary value of every f64 result
   and measures errors at 50 digits.

Run from the (gitignored, throwaway) spike directory:

```
uv run --no-project --with mpmath python reference.py
node spike.mjs
uv run --no-project --with mpmath python verify.py
```

Measured 2026-08-27 on Windows 11 x64. The representation-floor numbers are
engine-independent (computed with exact arithmetic on the stored doubles);
only the "(JS)" rows could vary by last-ulp amounts across engines, per
`PHYSICS.md` §8.

## Results

### What one f64 of storage resolves, in rapidity terms

| γ | η | 1 − β | leading 9s in β | η-resolution storing η | η-resolution storing β | β coarser by |
| - | - | ----- | --------------- | ---------------------- | ---------------------- | ------------ |
| 10 | 2.9932 | 5.01 × 10⁻³ | 2.3 digits | 4.4 × 10⁻¹⁶ | 1.1 × 10⁻¹⁴ | 25× |
| 1000 | 7.6009 | 5.00 × 10⁻⁷ | **6.3 digits** | 8.9 × 10⁻¹⁶ | 1.1 × 10⁻¹⁰ | **125,000×** |
| 10⁵ | 12.206 | 5.00 × 10⁻¹¹ | 10.3 digits | 1.8 × 10⁻¹⁵ | 1.1 × 10⁻⁶ | 6.3 × 10⁸× |

The 6.3 digits at γ = 1000 is the roadmap's "six digits", measured: that is
how much of β's 16-digit budget is spent writing leading 9s.

### Recovering γ from the stored state (γ = 1000)

| Path | Relative error | Digits |
| ---- | -------------- | ------ |
| γ = cosh(stored η), f64 | 0 (exact; ≤ 1 ulp in general) | ~16 |
| γ = 1/√(1 − β²) from stored β, f64 | 4.1 × 10⁻¹¹ | 10.4 |
| same, but with *exact* arithmetic on the stored β | 3.0 × 10⁻¹¹ | 10.5 |

The third row is the point: giving the β path perfect arithmetic barely
helps. The six-digit loss is in the stored bits.

### Round trip η → tanh → atanh

| γ | error vs stored η | in ulps of η |
| - | ----------------- | ------------ |
| 10 | 1.3 × 10⁻¹⁵ | 3 |
| 1000 | 3.0 × 10⁻¹¹ | 33,871 |
| 10⁵ | 4.1 × 10⁻⁸ | 23,282,306 |

Any internal path that passes state through β pays this, once, every time.

### Propagating to γ ≈ 1000 in 10,000 equal steps

| Method | Relative error in final γ | Digits |
| ------ | ------------------------- | ------ |
| η closed form (one multiply, the engine's actual method) | 2.8 × 10⁻¹⁶ | 15.6 |
| η by 10⁴ repeated f64 additions | 1.0 × 10⁻¹² | 12.0 |
| β by 10⁴ relativistic velocity additions | 3.4 × 10⁻⁸ | 7.5 |

Velocity addition lands ~1000× *worse* than even the β representation floor —
iteration accumulates on top of the storage loss. Even the deliberately naive
repeated-addition η path beats it by four digits and change.

### The cliff

`Math.tanh(η) === 1.0` exactly from η ≈ 19.0615 (γ ≈ 9.5 × 10⁷). Past that
point a β-based state is unrepresentable — `atanh(β)` is `Infinity` — while
η sits at 19, four orders of magnitude of headroom below f64's exponent range.

### Engine observation

At all three test points, V8's `Math.acosh`, `Math.tanh`, and `Math.atanh`
returned the correctly rounded double (+0 ulp vs mpmath). No correction terms
are needed on this engine family; `PHYSICS.md` §8's cross-engine caveat stands
regardless.

## Implications for Phase 1

- Invariant 5 (store rapidity, never velocity) is confirmed with enormous
  margin. The v1 reference voyage peaks at γ = 3.26; the representation is
  clean past γ = 10⁵ and the design point of γ = 1000 has six digits to spare.
- β may be *produced* at the display boundary (`0.9517 c` is 4 significant
  digits against a 10-digit floor even at γ = 1000) but must never be read
  back: no internal path may pass state through β and return.
- The closed-form propagation rule (`PHYSICS.md` §2, invariant 6) is also a
  precision rule, worth ~3.6 digits over repeated addition in this experiment.
- Reasonable property-test tolerances at γ ≤ 1000: reversibility and identity
  invariants should hold to ~10⁻¹³ relative comfortably; the small-Δη §2.3
  stability test is a separate Phase 1 item and was not exercised here.
