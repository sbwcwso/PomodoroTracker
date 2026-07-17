const js = require('@eslint/js');

module.exports = [
  {
    ignores: [
      'node_modules/**',
      'dist/**',
      'android/app/src/main/assets/public/**',
      'android/**/build/**',
      'src/renderer/vendor/**',
    ],
  },
  js.configs.recommended,
  {
    files: ['eslint.config.js'],
    languageOptions: { globals: { require: 'readonly', module: 'readonly' } },
  },
  {
    files: ['src/**/*.js', 'test/**/*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'commonjs',
      globals: {
        window: 'readonly',
        document: 'readonly',
        HTMLElement: 'readonly',
        Notification: 'readonly',
        Audio: 'readonly',
        process: 'readonly',
        require: 'readonly',
        module: 'readonly',
        __dirname: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        URL: 'readonly',
        Event: 'readonly',
        console: 'readonly',
      },
    },
    rules: {
      eqeqeq: 'error',
      curly: ['error', 'all'],
      'no-var': 'error',
      'prefer-const': 'error',
    },
  },
];
