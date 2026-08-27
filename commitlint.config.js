/** Conventional commits. CLAUDE.md: small commits, conventional commit messages. */
export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    // Package boundaries are ownership boundaries, so the scope is the owner.
    'scope-enum': [
      2,
      'always',
      [
        'units',
        'physics',
        'protocol',
        'sim',
        'panel',
        'audio',
        'catalog',
        'app',
        'schemas',
        'a11y',
        'ci',
        'docs',
        'repo',
      ],
    ],
    'scope-empty': [1, 'never'],
    'body-max-line-length': [1, 'always', 100],
  },
};
