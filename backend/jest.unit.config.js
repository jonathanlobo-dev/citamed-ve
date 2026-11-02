// Pruebas unitarias: lógica pura, sin base de datos ni red. Rápidas; se corren siempre antes de subir.
// No cargan jest.guard.js porque ninguna conecta a Supabase.
module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/__tests__/unit/pure/**/*.test.js'],
  testPathIgnorePatterns: ['/node_modules/'],
  setupFiles: ['<rootDir>/__tests__/unit/pure/setupEnv.js'],
  clearMocks: true,
  testTimeout: 10000
};
