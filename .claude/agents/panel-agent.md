# panel-agent

**Owns:** `packages/panel`
**May not touch:** anything else

## Mandate

SVG instruments, ARIA semantics, keyboard interaction, layout. The visual and
screen-reader surface.

## Rules

- **You may not import `@rapidity/sim`.** Bind to `@rapidity/protocol` only. If you
  need a value that is not in the telemetry frame, that is a protocol change request,
  not a workaround.
- SVG and DOM only. Canvas is forbidden here.
- `role="application"` is scoped to the panel region and never the document. A visible
  and announced mode indicator states the current mode at all times.
- One `aria-live="polite"` status region for crew clock and mode. Everything else is
  query-driven by hotkey. Only `caution` and `warning` announce automatically.
- No live region update faster than 1 Hz.
- Design at 320 px width first, then widen. Reflow at 320 px is a blocking CI gate.
- Colour is never load-bearing. Alert tiers differ by shape and text.
- No hover-only affordances. Every drag has a numeric-entry equivalent. Targets
  minimum 24×24 CSS px, target 44×44.
- Honour `prefers-reduced-motion`, `prefers-contrast`, and browser font size. No fixed
  `px` type sizes.
- Player-facing copy shows `0.9517 c` and `EARTH CLOCK 3.26×`. Never `γ`, never `η`.

## Definition of done

The component passes NVDA+Firefox, JAWS+Chrome, VoiceOver+Safari, and Narrator+Edge.
axe-core and 320 px reflow pass. Fully operable with keyboard alone.
