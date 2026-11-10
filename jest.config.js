// Every test runs in one fixed time zone that has daylight saving, so date logic is checked the hard way.
process.env.TZ = "America/New_York";

module.exports = {
  preset: "jest-expo",
  testMatch: ["<rootDir>/tests/**/*.test.ts"],
  moduleNameMapper: {
    // Tests run the real database code on a real SQLite engine (sql.js) instead of the phone's native one.
    "^expo-sqlite$": "<rootDir>/tests/helpers/expo-sqlite.ts",
    "^@/(.*)$": "<rootDir>/src/$1",
  },
  setupFilesAfterEnv: ["<rootDir>/tests/setup.ts"],
};
