// Revisión estática mínima del servidor: encuentra nombres que no existen (como un import olvidado)
// y otros descuidos que solo explotan cuando el servidor arranca o cuando se usa esa ruta.
const globals = require('globals');

module.exports = [
  { ignores: ['node_modules/**', 'backups/**', 'logs/**', 'coverage/**', 'uploads/**'] },
  {
    files: ['**/*.js'],
    languageOptions: { ecmaVersion: 2022, sourceType: 'commonjs', globals: { ...globals.node, ...globals.jest } },
    rules: {
      'no-undef': 'error',
      'no-dupe-keys': 'error',
      'no-dupe-args': 'error',
      'no-unreachable': 'error',
      'no-redeclare': 'error',
      'no-func-assign': 'error',
      'no-import-assign': 'error',
      'no-self-assign': 'error',
      'no-unsafe-finally': 'error',
      'valid-typeof': 'error',
      'use-isnan': 'error',
      'no-const-assign': 'error'
    }
  }
];
