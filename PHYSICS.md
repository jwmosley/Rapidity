# Rapidity — Physics Reference

Authoritative source for `@rapidity/physics`. Any disagreement between code and this
document is a bug in the code.

## 1. Rapidity as the state variable

Store rapidity `η` (dimensionless). Never store velocity.

```
β = v/c = tanh η
γ       = cosh η
βγ      = sinh η

η = artanh β = arcosh γ = arsinh(βγ)
```

**Why.** Under constant proper acceleration `a`, rapidity is *linear in proper time*:
`η(τ) = η₀ + aτ/c`. Propagation becomes addition. Velocity composition becomes
addition. And `β` stored as a float loses all meaningful precision approaching 1,
while `η` has no such degeneracy — `β = 0.999999999` is `η ≈ 10.8`, an ordinary number.

## 2. Segment propagation

A flight plan is an ordered list of segments. Each segment has constant proper
acceleration and a proper duration. State is evaluated in closed form at any `τ`.
**Nothing is ever numerically integrated.**

### 2.1 Burn segment — constant proper acceleration `a`, duration `Δτ`

```
η₁ = η₀ + a·Δτ/c
Δt = (c/a)·(sinh η₁ − sinh η₀)
Δx = (c²/a)·(cosh η₁ − cosh η₀)
```

### 2.2 Coast segment — `a = 0`, rapidity constant, duration `Δτ`

```
η₁ = η₀
Δt = Δτ · cosh η₀
Δx = c · Δτ · sinh η₀
```

### 2.3 Numerically stable forms — use these, not the ones above

The differences of hyperbolics above cancel catastrophically for small `Δη`. Implement
with the sum-to-product identities:

```
sinh η₁ − sinh η₀ = 2 · cosh((η₁+η₀)/2) · sinh((η₁−η₀)/2)
cosh η₁ − cosh η₀ = 2 · sinh((η₁+η₀)/2) · sinh((η₁−η₀)/2)
```

`(η₁−η₀)/2` is exactly `a·Δτ/(2c)`, known without subtraction. This is a hard
requirement, and a property test must cover the small-`Δη` regime specifically.

## 3. Flip-and-burn (brachistochrone)

Accelerate for half the distance, flip, decelerate for the other half.

```
η_peak = arcosh(1 + a·d / (2c²))
τ_total = 2c·η_peak / a
t_total = 2(c/a)·sinh(η_peak)
Δη_total = 2·η_peak
```

### Reference case — pin these in tests

Sol → Alpha Centauri, `d = 4.37 ly`, `a = 1 g`:

| Quantity | Value |
| --- | --- |
| `η_peak` | 1.8490 |
| Proper (crew) time | 3.582 yr |
| Coordinate (Earth) time | 6.003 yr |
| Peak `γ` | 3.2556 |
| Peak `β` | 0.9517 |
| `Δη_total` | 3.6981 |

Useful scale constants: `c²/g = 0.9687 ly`, `c/g = 0.9687 yr`.

## 4. Propellant — the relativistic rocket equation

```
Δη = (v_e/c) · ln(m₀/m₁)
m₁ = m₀ · exp(−Δη·c/v_e)
```

Rapidity budget is the currency. Mass ratios for the reference case
(`Δη_total = 3.6981`):

| Exhaust velocity | Mass ratio |
| --- | --- |
| 0.1 c | 1.15 × 10¹⁶ |
| 0.3 c | 2.26 × 10⁵ |
| 0.5 c | 1 630 |
| 0.9 c | 60.9 |

**This is the core gameplay tension.** High acceleration gives short crew time at
impossible mass ratios. A lower peak rapidity with a long coast is affordable but
costs decades. The flight planner exists to expose this trade.

## 5. Thermal

Jet power for thrust `F` at exhaust velocity `v_e`: `P = ½·F·v_e`.

Radiator flux by Stefan–Boltzmann: `q = σT⁴`, `σ = 5.670374419×10⁻⁸ W·m⁻²·K⁻⁴`.

Worked case — 1 000 t hull at 1 g, `v_e = 0.1c`:

- Jet power `1.47 × 10¹⁴ W`
- At 0.1 % waste, `1.47 × 10¹¹ W` to reject
- Radiator area at 1 200 K: 1.25 × 10⁶ m²
- At 1 500 K: 5.12 × 10⁵ m²
- At 2 000 K: 1.62 × 10⁵ m²

Radiator area is a hull property. It sets a hard ceiling on sustainable thrust, which
is what makes the Thermal page load-bearing rather than decorative.

## 6. Warp — fictional, rule-bound

Warp is not derivable. These rules are chosen from properties the Alcubierre metric
actually implies and are then treated as fixed engine behaviour:

1. **No proper-time dilation inside the bubble.** Crew and Earth clocks stay
   synchronised. This is the exact inverse of relativistic cruise and is the whole
   reason warp is strategically different.
2. **No steering while enclosed.** The vector is set before formation and cannot change.
3. **No sensing while enclosed.** The bubble is causally disconnected. Instruments
   show last-known state with an explicit staleness flag.
4. **Formation and collapse require low local gravitational gradient.** Defined by a
   threshold field, checked before entry and before exit.
5. **Exit particle load.** Blueshifted particulate accumulated at the bubble wall
   discharges on collapse, scaling with dwell time. This is what makes exit precision
   a procedure rather than a button.

Warp is Phase 7. Do not implement stubs before then.

## 7. Constants — exact values

```ts
export const C          = 299_792_458;              // m/s, exact by definition
export const G0         = 9.806_65;                 // m/s², exact by definition
export const LIGHT_YEAR = 9_460_730_472_580_800;    // m, exact
export const AU         = 149_597_870_700;          // m, exact
export const PARSEC     = 3.085_677_581_491_367_3e16; // m
export const SIGMA_SB   = 5.670_374_419e-8;         // W/m²/K⁴
```

## 8. Units and numerical policy

- **SI internally, everywhere, without exception.** Metres, seconds, kilograms,
  kelvin, watts. Conversion happens only at the display boundary.
- **`f64` throughout.** No decimal or bignum types.
- Times are seconds since scenario epoch. Ten years is `3.15×10⁸ s`; `f64` holds this
  with sub-microsecond resolution.
- Positions are metres in a barycentric Cartesian frame. ULP at 4.37 ly is **9.2 m**;
  at 1 AU it is **3.3×10⁻⁵ m**. Acceptable at both scales. Document it, don't fix it.
- Use `Math.asinh`, `Math.acosh`, `Math.atanh`. Do not hand-roll from `log`.
- **These functions are implementation-defined across engines.** Results are not
  bit-identical between browsers. This is why the sim is host-authoritative and why
  saves checkpoint at segment boundaries. See `ARCHITECTURE.md` §5.

## 9. Invariants — property test targets

Test with `fast-check` against identities, not hand-computed values.

| Invariant | Statement |
| --- | --- |
| Hyperbolic identity | `cosh²η − sinh²η = 1` |
| Rapidity additivity | Composing boosts `η₁`, `η₂` equals the relativistic velocity-addition result for `β₁`, `β₂` |
| Time ordering | `τ ≤ t` always, for any segment sequence |
| Lorentz floor | `γ ≥ 1` and `0 ≤ β < 1` always |
| Reversibility | Propagate `+Δτ` then `−Δτ` returns to origin within tolerance |
| Newtonian limit | For `aτ/c → 0`, `Δx → ½aτ²` and `Δt → Δτ` within tolerance |
| Flip symmetry | Both legs of a flip-and-burn mirror in `Δη`, `Δτ`, and `Δx` |
| Small-Δη stability | §2.3 forms agree with high-precision reference across `Δη ∈ [1e-12, 1]` |
| Rocket monotonicity | `m₁` strictly decreases in `Δη` for fixed `v_e` |

## 10. Coordinate frame

"Earth clock" means **coordinate time in the departure inertial frame**, not time at
a location. The label is correct for players and must not lead the implementation
toward treating it as positional. There is no gravitational time dilation model in
v1; the effect is negligible at these scales and its absence is deliberate.
