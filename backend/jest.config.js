module.exports = {
  testEnvironment: "node",
  setupFiles: ["<rootDir>/tests/jest.env.js"],
  setupFilesAfterEnv: ["<rootDir>/tests/jest.setup.js"],
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
  testPathIgnorePatterns: ["/node_modules/", "/test-reports/"]
};
