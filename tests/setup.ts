// Native modules and background services are replaced with harmless stand-ins in tests.
jest.mock("expo-constants", () => ({
  __esModule: true,
  default: { expoConfig: { version: "1.0.0" } },
}));

jest.mock("@/features/notifications/service", () => ({
  requestReconcile: jest.fn(),
  reconcileNow: jest.fn(async () => ({
    permission: "granted",
    scheduled: 0,
    cancelled: 0,
    kept: 0,
  })),
}));

jest.mock("@/features/celebrations/evaluate", () => ({
  requestCelebrationCheck: jest.fn(),
  previewCelebration: jest.fn(async () => undefined),
}));
