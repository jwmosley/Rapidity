/**
 * Tier 3. ACCESSIBILITY.md §2: Guidepup drives NVDA and VoiceOver from CI, needs
 * Windows and macOS runners at roughly ten times the minute cost, and is flaky enough
 * that PR-gating it means it gets switched off within a month. Nightly, non-blocking,
 * treated as signal rather than a stop.
 *
 * The suite itself lands with the first instrument in Phase 2. Until then this exits
 * clean so the nightly workflow is wired and visible rather than absent.
 */
process.stdout.write(
  'screen-reader suite: no cases yet — the five critical announcements arrive with the Phase 2 gauge\n',
);
