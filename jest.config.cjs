module.exports = {
  testEnvironment: 'node',
  extensionsToTreatAsEsm: ['.ts'],
  transform: {
    '^.+\.ts$': [
      'ts-jest',
      {
        useESM: true,
        tsconfig: {
          target: 'ES2022',
          module: 'ES2022',
          moduleResolution: 'node',
          esModuleInterop: true,
          strict: true,
          noUnusedLocals: false,
          noUnusedParameters: false,
        },
      },
    ],
  },
  moduleNameMapper: {
    '^(\.{1,2}/.*)\.js$': '$1',
  },
  testMatch: ['**/*.test.ts'],
  collectCoverageFrom: [
    'mcp-server/handlers/**/*.ts',
    '!mcp-server/handlers/**/*.test.ts',
  ],
};
