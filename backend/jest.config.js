module.exports = {
  testEnvironment: "node",
  testMatch: ["<rootDir>/tests/**/*.test.js"],
  setupFiles: ["<rootDir>/tests/jest.env.js"],
  setupFilesAfterEnv: ["<rootDir>/tests/jest.setup.js"],
  testTimeout: 60000,
  reporters: [
    "default",
    [
      "jest-junit",
      {
        outputDirectory: "test-reports",
        outputName: "junit.xml",
      },
    ],
  ],
  collectCoverageFrom: [
    "controllers/**/*.js",
    "middleware/**/*.js",
    "services/**/*.js",
    "routes/**/*.js",
  ],
  coverageDirectory: "test-reports/coverage",
};
