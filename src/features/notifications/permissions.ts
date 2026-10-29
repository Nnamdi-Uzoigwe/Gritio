import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { NOTIFICATION_CONFIG } from "./config";

export type PermissionState = "granted" | "denied" | "undetermined";
export type PermissionInfo = { state: PermissionState; canAskAgain: boolean };

function toInfo(
  result: Notifications.NotificationPermissionsStatus,
): PermissionInfo {
  if (result.granted) return { state: "granted", canAskAgain: true };
  if (
    result.status === Notifications.PermissionStatus.UNDETERMINED &&
    result.canAskAgain
  ) {
    return { state: "undetermined", canAskAgain: true };
  }
  return { state: "denied", canAskAgain: result.canAskAgain };
}

/** Android 13+ needs a channel to exist before the prompt can appear and before anything is scheduled. */
export async function ensureAndroidChannel(): Promise<void> {
  if (Platform.OS !== "android") return;
  await Notifications.setNotificationChannelAsync(
    NOTIFICATION_CONFIG.channelId,
    {
      name: "Reminders",
      importance: Notifications.AndroidImportance.DEFAULT,
    },
  );
}

export async function getPermissionInfo(): Promise<PermissionInfo> {
  try {
    return toInfo(await Notifications.getPermissionsAsync());
  } catch (error) {
    console.warn("Could not read notification permission", error);
    return { state: "undetermined", canAskAgain: true };
  }
}

export async function requestPermission(): Promise<PermissionInfo> {
  try {
    await ensureAndroidChannel();
    return toInfo(await Notifications.requestPermissionsAsync());
  } catch (error) {
    console.warn("Could not request notification permission", error);
    return { state: "undetermined", canAskAgain: true };
  }
}

export async function getNotificationPermission(): Promise<PermissionState> {
  return (await getPermissionInfo()).state;
}

export async function requestNotificationPermission(): Promise<PermissionState> {
  return (await requestPermission()).state;
}
