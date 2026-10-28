import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

export type PermissionState = "granted" | "denied" | "undetermined";

function toState(
  result: Notifications.NotificationPermissionsStatus,
): PermissionState {
  if (result.granted) return "granted";
  if (
    result.status === Notifications.PermissionStatus.UNDETERMINED &&
    result.canAskAgain
  ) {
    return "undetermined";
  }
  return "denied";
}

export async function getNotificationPermission(): Promise<PermissionState> {
  try {
    return toState(await Notifications.getPermissionsAsync());
  } catch (error) {
    console.warn("Could not read notification permission", error);
    return "undetermined";
  }
}

export async function requestNotificationPermission(): Promise<PermissionState> {
  try {
    if (Platform.OS === "android") {
      // Android 13+ needs a channel to exist before the prompt can appear.
      await Notifications.setNotificationChannelAsync("default", {
        name: "Reminders",
        importance: Notifications.AndroidImportance.DEFAULT,
      });
    }
    return toState(await Notifications.requestPermissionsAsync());
  } catch (error) {
    console.warn("Could not request notification permission", error);
    return "undetermined";
  }
}
