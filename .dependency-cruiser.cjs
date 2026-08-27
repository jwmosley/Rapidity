'use strict';

/**
 * The dependency graph in ARCHITECTURE.md §2, made executable.
 *
 * Package boundaries are subagent ownership boundaries, so this file is the
 * enforcement mechanism for both. It runs blocking on every PR.
 */
module.exports = {
  forbidden: [
    {
      name: 'panel-not-to-sim',
      comment:
        'ARCHITECTURE.md §2.1. @rapidity/panel binds to @rapidity/protocol only. If the ' +
        'panel could read simulation state it would eventually render a value that never ' +
        'passed through the telemetry schema, and the schema is what guarantees label, ' +
        'shortLabel and spoken exist. This is the accessibility boundary made structural.',
      severity: 'error',
      from: { path: '^packages/panel/' },
      to: { path: '^packages/sim/' },
    },
    {
      name: 'audio-not-to-sim',
      comment:
        'ARCHITECTURE.md §2.1. @rapidity/audio is bound by the same rule as the panel, ' +
        'for the same reason.',
      severity: 'error',
      from: { path: '^packages/audio/' },
      to: { path: '^packages/sim/' },
    },

    {
      name: 'units-is-a-leaf',
      comment: 'ARCHITECTURE.md §2: @rapidity/units has zero dependencies.',
      severity: 'error',
      from: { path: '^packages/units/' },
      to: { path: '^packages/(?!units/)' },
    },
    {
      name: 'physics-only-units',
      comment: 'ARCHITECTURE.md §2: physics → units.',
      severity: 'error',
      from: { path: '^packages/physics/' },
      to: { path: '^packages/(?!physics/|units/)' },
    },
    {
      name: 'protocol-only-units',
      comment: 'ARCHITECTURE.md §2: protocol → units.',
      severity: 'error',
      from: { path: '^packages/protocol/' },
      to: { path: '^packages/(?!protocol/|units/)' },
    },
    {
      name: 'sim-only-physics-protocol',
      comment: 'ARCHITECTURE.md §2: sim → physics, protocol.',
      severity: 'error',
      from: { path: '^packages/sim/' },
      to: { path: '^packages/(?!sim/|physics/|protocol/)' },
    },
    {
      name: 'panel-only-protocol',
      comment: 'ARCHITECTURE.md §2: panel → protocol.',
      severity: 'error',
      from: { path: '^packages/panel/' },
      to: { path: '^packages/(?!panel/|protocol/)' },
    },
    {
      name: 'audio-only-protocol',
      comment: 'ARCHITECTURE.md §2: audio → protocol.',
      severity: 'error',
      from: { path: '^packages/audio/' },
      to: { path: '^packages/(?!audio/|protocol/)' },
    },
    {
      name: 'catalog-only-units',
      comment: 'ARCHITECTURE.md §2: catalog → units.',
      severity: 'error',
      from: { path: '^packages/catalog/' },
      to: { path: '^packages/(?!catalog/|units/)' },
    },
    {
      name: 'packages-not-to-apps',
      comment: 'Only apps/ composes. A package reaching into the app shell is inverted.',
      severity: 'error',
      from: { path: '^packages/' },
      to: { path: '^apps/' },
    },

    {
      name: 'no-circular',
      severity: 'error',
      from: {},
      to: { circular: true },
    },
    {
      name: 'not-to-unresolvable',
      comment:
        'An import that does not resolve is usually an undeclared cross-package reach. ' +
        'Declare the dependency, or open the contract question.',
      severity: 'error',
      from: {},
      to: { couldNotResolve: true },
    },
  ],

  options: {
    doNotFollow: { path: 'node_modules' },
    exclude: { path: '(^|/)dist/' },
    tsConfig: { fileName: 'tsconfig.depcruise.json' },
    tsPreCompilationDeps: true,
    combinedDependencies: false,
    enhancedResolveOptions: {
      exportsFields: ['exports'],
      conditionNames: ['import', 'require', 'node', 'default', 'types'],
      mainFields: ['module', 'main', 'types'],
      extensions: ['.ts', '.js', '.mjs', '.cjs'],
    },
  },
};
