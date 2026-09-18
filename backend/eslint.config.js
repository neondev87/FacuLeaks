const security = require('eslint-plugin-security');

module.exports = [
  {
    files: ['src/**/*.js'],
    plugins: { security },
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'commonjs',
    },
    rules: {
      ...security.configs.recommended.rules,
    },
  },
];
