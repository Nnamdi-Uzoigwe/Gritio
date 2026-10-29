import { Alert, Linking } from "react-native";
import { getPermissionInfo, requestPermission } from "./permissions";

/**
 * Called the first time a reminder is switched on. Asks at that moment, never earlier.
 * Returns false (and explains) if notifications are not allowed, so the app stays fully usable.
 */
export async function ensureReminderPermission(): Promise<boolean> {
  const info = await getPermissionInfo();
  if (info.state === "granted") return true;

  if (info.canAskAgain) {
    const result = await requestPermission();
    if (result.state === "granted") return true;
    if (result.canAskAgain) return false; // dismissed without a final answer, stay quiet
  }

  Alert.alert(
    "Notifications are off",
    "Reminders need notifications to be allowed. Gritio works fully without them, and you can turn them on in your phone settings any time.",
    [
      { text: "Not now", style: "cancel" },
      {
        text: "Open settings",
        onPress: () => {
          Linking.openSettings().catch(() => {});
        },
      },
    ],
  );
  return false;
}
