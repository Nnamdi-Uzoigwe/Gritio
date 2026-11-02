import * as LocalAuthentication from "expo-local-authentication";
import { withLockSuspended } from "./suspend";

export type LockSupport = "ready" | "unsupported" | "not_enrolled";
export type AuthFailure = "cancelled" | "lockout" | "unavailable" | "failed";
export type AuthOutcome = { ok: true } | { ok: false; reason: AuthFailure };

/**
 * App Lock works with biometrics or the phone's own passcode. It needs one of them to exist,
 * otherwise there is nothing to unlock with.
 */
export async function getLockSupport(): Promise<LockSupport> {
  try {
    const level = await LocalAuthentication.getEnrolledLevelAsync();
    return level === LocalAuthentication.SecurityLevel.NONE
      ? "not_enrolled"
      : "ready";
  } catch (error) {
    console.warn("Could not check device security", error);
    return "unsupported";
  }
}

export function authenticate(promptMessage: string): Promise<AuthOutcome> {
  return withLockSuspended(async (): Promise<AuthOutcome> => {
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage,
        cancelLabel: "Cancel",
        fallbackLabel: "Use passcode",
      });
      if (result.success) return { ok: true };

      switch (result.error) {
        case "user_cancel":
        case "system_cancel":
        case "app_cancel":
          return { ok: false, reason: "cancelled" };
        case "lockout":
          return { ok: false, reason: "lockout" };
        case "not_enrolled":
        case "passcode_not_set":
        case "not_available":
          return { ok: false, reason: "unavailable" };
        default:
          return { ok: false, reason: "failed" };
      }
    } catch (error) {
      console.warn("Authentication failed", error);
      return { ok: false, reason: "failed" };
    }
  });
}
