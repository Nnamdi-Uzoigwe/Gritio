import { Button } from "@/components/ui/Button";
import { getSetting, setSetting } from "@/db/repositories/settings";
import { BRAND } from "@/features/splash/AnimatedSplash";
import { spacing, typography } from "@/theme/tokens";
import { Ionicons } from "@expo/vector-icons";
import { useCallback, useEffect, useRef, useState } from "react";
import {
    Alert,
    AppState,
    StyleSheet,
    Text,
    View,
    type AppStateStatus,
} from "react-native";
import { authenticate, getLockSupport, type AuthFailure } from "../auth";
import { LOCK_CONFIG } from "../config";
import { useLockStore } from "../store";
import { isLockSuspended } from "../suspend";

const CREAM = "#F3F1EC";

const MESSAGES: Record<Exclude<AuthFailure, "unavailable">, string> = {
  cancelled: "Unlock was cancelled. Tap Unlock when you are ready.",
  lockout: "Too many attempts. Wait a moment, or use your phone passcode.",
  failed: "That did not work. Please try again.",
};

/**
 * Covers the whole app while it is locked, and also while the app is not in the foreground,
 * so its contents are hidden in the app switcher. Mounted once, above everything else.
 */
export function LockGate() {
  const loaded = useLockStore((s) => s.loaded);
  const enabled = useLockStore((s) => s.enabled);
  const locked = useLockStore((s) => s.locked);
  const [appState, setAppState] = useState<AppStateStatus>(
    AppState.currentState,
  );
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const backgroundedAt = useRef<number | null>(null);
  const prompted = useRef(false);
  const running = useRef(false);

  // Read the saved choice once. A cold start is locked when App Lock is on.
  useEffect(() => {
    let active = true;
    getSetting("app_lock_enabled")
      .then((value) => {
        if (active) useLockStore.getState().init(value === "1");
      })
      .catch((error) => {
        console.warn("Could not read App Lock setting", error);
        if (active) useLockStore.getState().init(false);
      });
    return () => {
      active = false;
    };
  }, []);

  // Lock again after more than a minute in the background.
  useEffect(() => {
    const sub = AppState.addEventListener("change", (next) => {
      setAppState(next);
      if (next === "background") {
        backgroundedAt.current = Date.now();
        prompted.current = false;
        return;
      }
      if (next === "active") {
        const since = backgroundedAt.current;
        backgroundedAt.current = null;
        const state = useLockStore.getState();
        if (
          state.enabled &&
          !state.locked &&
          since !== null &&
          Date.now() - since > LOCK_CONFIG.graceMs &&
          !isLockSuspended()
        ) {
          state.setLocked(true);
        }
      }
    });
    return () => sub.remove();
  }, []);

  // If the phone no longer has any lock or biometrics, locking is pointless and could trap the person.
  const turnOffBecauseUnavailable = useCallback(async () => {
    try {
      await setSetting("app_lock_enabled", "0");
    } catch (error) {
      console.warn("Could not turn off App Lock", error);
    }
    useLockStore.getState().setEnabled(false);
    Alert.alert(
      "App Lock turned off",
      "This phone no longer has a screen lock or biometrics set up, so Gritio could not lock itself. You can turn App Lock on again after setting one up.",
    );
  }, []);

  const unlock = useCallback(async () => {
    if (running.current) return;
    running.current = true;
    setBusy(true);
    setMessage(null);
    try {
      if ((await getLockSupport()) !== "ready") {
        await turnOffBecauseUnavailable();
        return;
      }
      const outcome = await authenticate("Unlock Gritio");
      if (outcome.ok) {
        useLockStore.getState().setLocked(false);
        return;
      }
      if (outcome.reason === "unavailable") {
        await turnOffBecauseUnavailable();
        return;
      }
      setMessage(MESSAGES[outcome.reason]);
    } finally {
      running.current = false;
      setBusy(false);
    }
  }, [turnOffBecauseUnavailable]);

  // Ask once automatically each time the app is locked and in front of the person.
  useEffect(() => {
    if (!locked) {
      prompted.current = false;
      return;
    }
    if (!enabled || appState !== "active" || prompted.current) return;
    prompted.current = true;
    unlock();
  }, [enabled, locked, appState, unlock]);

  const visible = !loaded || (enabled && (locked || appState !== "active"));
  if (!visible) return null;

  const showUnlock = loaded && enabled && locked;

  return (
    <View
      style={[StyleSheet.absoluteFill, styles.cover]}
      accessibilityViewIsModal
      importantForAccessibility="yes"
    >
      <View style={styles.center}>
        <Text
          style={[typography.displayXL, styles.mark]}
          accessibilityRole="header"
        >
          Gritio
        </Text>
        {showUnlock ? (
          <>
            <Ionicons name="lock-closed-outline" size={28} color={BRAND.gold} />
            <Text style={[typography.titleM, styles.title]}>
              Gritio is locked
            </Text>
            <Text
              style={[typography.bodySmall, styles.body]}
              accessibilityLiveRegion="polite"
            >
              {message ??
                "Use your biometrics or your phone passcode to continue."}
            </Text>
            <View style={styles.button}>
              <Button label="Unlock" onPress={unlock} loading={busy} />
            </View>
          </>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  cover: { backgroundColor: BRAND.charcoal, zIndex: 2000, elevation: 2000 },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.xl,
    gap: spacing.md,
  },
  mark: { color: BRAND.gold, marginBottom: spacing.lg },
  title: { color: CREAM, textAlign: "center" },
  body: { color: BRAND.tagline, textAlign: "center", maxWidth: 300 },
  button: { alignSelf: "stretch", marginTop: spacing.lg },
});
