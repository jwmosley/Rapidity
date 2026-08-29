/**
 * The panel page layer — ACCESSIBILITY.md §4 and §5 made concrete, using the
 * model verified against real readers in the Phase 0 spikes.
 *
 * One polite live region for the whole page, holding crew clock and current
 * mode only (invariant 12). One assertive channel that speaks nothing below
 * caution. Both rate-limited to 1 Hz, ever. Everything else is query-driven:
 * a letter key moves focus to the instrument, and focus announcement — which
 * every reader does natively — is the query response. Nothing is pushed.
 *
 * role="application" is scoped to the instrument region only, never the
 * document; Escape moves focus back out to the panel title, restoring browse
 * navigation. The mode indicator is visible and mirrored into the polite
 * region so the active mode is never a mystery in either channel.
 */
import type { Quality } from '@rapidity/protocol';

export interface PanelStrings {
  /** Announced and shown when focus enters the instrument region. */
  readonly panelMode: string;
  /** Announced and shown when focus returns to the document. */
  readonly documentMode: string;
}

const ENGLISH_STRINGS: PanelStrings = {
  panelMode: 'Panel mode. Letter keys query instruments. Escape leaves.',
  documentMode: 'Document mode.',
};

export interface PanelOptions {
  /** Accessible name of the panel and its application region. */
  readonly label: string;
  readonly strings?: PanelStrings;
}

export type AlertTier = Extract<Quality, 'caution' | 'warning'>;

export interface Panel {
  readonly element: HTMLElement;
  /** Mount an instrument and bind a single-letter query key to it. */
  addInstrument(key: string, instrument: HTMLElement): void;
  /** Update the crew clock shown and spoken in the one polite region. */
  setClock(text: string): void;
  /** Speak an alert. Nothing below caution announces automatically (§5.3). */
  announceAlert(tier: AlertTier, text: string): void;
}

const MIN_INTERVAL_MS = 1000;

/** No live region updates faster than 1 Hz, ever (invariant 12). Writes inside
 *  the window coalesce; the newest text lands when the window reopens. */
const throttledWriter = (target: Element): ((text: string) => void) => {
  let lastWrite = Number.NEGATIVE_INFINITY;
  let pending: string | null = null;
  let timer: ReturnType<typeof setTimeout> | null = null;

  const flush = (): void => {
    timer = null;
    if (pending !== null) {
      target.textContent = pending;
      pending = null;
      lastWrite = Date.now();
    }
  };

  return (text) => {
    const now = Date.now();
    if (timer === null && now - lastWrite >= MIN_INTERVAL_MS) {
      target.textContent = text;
      lastWrite = now;
      return;
    }
    pending = text;
    if (timer === null) {
      timer = setTimeout(flush, MIN_INTERVAL_MS - (now - lastWrite));
    }
  };
};

export const createPanel = (documentRef: Document, options: PanelOptions): Panel => {
  const strings = options.strings ?? ENGLISH_STRINGS;

  const root = documentRef.createElement('section');
  root.className = 'panel';
  root.innerHTML = `
    <h2 class="panel-title" tabindex="-1"></h2>
    <p class="panel-status" aria-live="polite"></p>
    <p class="panel-alert" aria-live="assertive"></p>
    <div class="panel-region" role="application"></div>
  `;

  const pick = <T extends Element>(selector: string): T => {
    const found = root.querySelector(selector);
    if (!found) throw new Error(`panel template is missing ${selector}`);
    return found as T;
  };

  const title = pick<HTMLHeadingElement>('.panel-title');
  const status = pick<HTMLParagraphElement>('.panel-status');
  const alert = pick<HTMLParagraphElement>('.panel-alert');
  const region = pick<HTMLDivElement>('.panel-region');

  title.textContent = options.label;
  region.setAttribute('aria-label', options.label);

  const writeStatus = throttledWriter(status);
  const writeAlert = throttledWriter(alert);

  let clock = '';
  let mode = strings.documentMode;
  const showStatus = (): void => {
    writeStatus(clock === '' ? mode : `${clock} — ${mode}`);
  };

  region.addEventListener('focusin', () => {
    mode = strings.panelMode;
    showStatus();
  });
  region.addEventListener('focusout', (event) => {
    if (!region.contains(event.relatedTarget as Node | null)) {
      mode = strings.documentMode;
      showStatus();
    }
  });

  const bindings = new Map<string, HTMLElement>();
  region.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      title.focus();
      event.preventDefault();
      return;
    }
    const bound = bindings.get(event.key.toLowerCase());
    if (bound && !event.altKey && !event.ctrlKey && !event.metaKey) {
      bound.focus();
      event.preventDefault();
    }
  });

  return {
    element: root,
    addInstrument: (key, instrument) => {
      const normalized = key.toLowerCase();
      if (!/^[a-z]$/.test(normalized)) {
        throw new Error(`query key must be a single letter, got "${key}"`);
      }
      if (bindings.has(normalized)) {
        throw new Error(`query key "${normalized}" is already bound`);
      }
      bindings.set(normalized, instrument);
      region.appendChild(instrument);
    },
    setClock: (text) => {
      clock = text;
      showStatus();
    },
    announceAlert: (tier, text) => {
      // The tier is in the signature so no call site can ever push an
      // advisory through the assertive channel without the type system
      // objecting; at runtime the text speaks for itself.
      void tier;
      writeAlert(text);
    },
  };
};
