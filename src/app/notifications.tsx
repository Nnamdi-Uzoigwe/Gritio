import { AppText } from "@/components/ui/AppText";
import { Button } from "@/components/ui/Button";
import { HeaderIconButton } from "@/components/ui/HeaderIconButton";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { SwipeableRow } from "@/components/ui/SwipeableRow";
import {
  clearInbox,
  deleteInboxItem,
  listInbox,
  markAllRead,
  markRead,
  type InboxItem,
} from "@/db/repositories/inbox";
import { onInboxChanged } from "@/features/notifications/inboxEvents";
import { reconcileNow } from "@/features/notifications/service";
import type { IconName } from "@/lib/focusAreas";
import { formatRelative } from "@/lib/time";
import { useTheme } from "@/theme/ThemeProvider";
import { radii, spacing } from "@/theme/tokens";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";

const KIND_ICON: Record<string, IconName> = {
  habit: "repeat-outline",
  task: "checkbox-outline",
  step: "flag-outline",
  planning: "sunny-outline",
  reflection: "moon-outline",
};

export default function NotificationsScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const [items, setItems] = useState<InboxItem[] | null>(null);
  const [failed, setFailed] = useState(false);

  const load = useCallback(async () => {
    try {
      setFailed(false);
      setItems(await listInbox());
    } catch (error) {
      console.warn("Could not load notifications", error);
      setFailed(true);
      setItems((prev) => prev ?? []);
    }
  }, []);

  // Opening the center also picks up reminders that have gone off since the app was last open.
  useFocusEffect(
    useCallback(() => {
      load();
      reconcileNow()
        .then(() => load())
        .catch((error) => console.warn("Reconcile failed", error));
    }, [load]),
  );

  useEffect(
    () =>
      onInboxChanged(() => {
        load();
      }),
    [load],
  );

  const hasUnread = items?.some((i) => !i.read) ?? false;

  const readOne = async (item: InboxItem) => {
    if (item.read) return;
    setItems(
      (prev) =>
        prev?.map((i) => (i.id === item.id ? { ...i, read: true } : i)) ?? prev,
    );
    try {
      await markRead(item.id);
    } catch (error) {
      console.warn("Could not mark as read", error);
    }
  };

  const open = async (item: InboxItem) => {
    await readOne(item);
    if (item.kind === "habit" && item.refId)
      router.push(`/habit/${item.refId}`);
    else if (item.kind === "reflection") router.push("/reflection");
    else router.navigate("/today");
  };

  const readAll = async () => {
    setItems((prev) => prev?.map((i) => ({ ...i, read: true })) ?? prev);
    try {
      await markAllRead();
    } catch (error) {
      console.warn("Could not mark all as read", error);
      load();
    }
  };

  const remove = async (item: InboxItem) => {
    setItems((prev) => prev?.filter((i) => i.id !== item.id) ?? prev);
    try {
      await deleteInboxItem(item.id);
    } catch (error) {
      console.warn("Could not delete notification", error);
      load();
    }
  };

  const confirmClear = () => {
    Alert.alert(
      "Clear all notifications?",
      "This only clears this list. Your reminders and data are not affected.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear all",
          style: "destructive",
          onPress: async () => {
            setItems([]);
            try {
              await clearInbox();
            } catch (error) {
              console.warn("Could not clear notifications", error);
              load();
            }
          },
        },
      ],
    );
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ScreenHeader
        title="Notifications"
        right={
          items && items.length > 0 ? (
            <HeaderIconButton
              icon="trash-outline"
              label="Clear all notifications"
              onPress={confirmClear}
            />
          ) : undefined
        }
      />
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {items === null ? (
          <ActivityIndicator color={colors.primary} style={styles.loader} />
        ) : null}

        {failed && items !== null && items.length === 0 ? (
          <View style={styles.empty}>
            <AppText variant="titleM">Could not load notifications</AppText>
            <Button label="Try again" onPress={load} />
          </View>
        ) : null}

        {items !== null && items.length === 0 && !failed ? (
          <View style={styles.empty}>
            <View
              style={[
                styles.emptyIcon,
                { backgroundColor: colors.primarySoft },
              ]}
            >
              <Ionicons
                name="notifications-outline"
                size={28}
                color={colors.primaryText}
              />
            </View>
            <AppText variant="displayM" style={styles.center}>
              All quiet.
            </AppText>
            <AppText tone="secondary" style={styles.center}>
              Reminders appear here after they go off, so you can look back at
              them.
            </AppText>
          </View>
        ) : null}

        {hasUnread ? (
          <Button label="Mark all as read" variant="ghost" onPress={readAll} />
        ) : null}

        {items?.map((item) => (
          <SwipeableRow
            key={item.id}
            postponeLabel="Delete"
            postponeIcon="trash-outline"
            postponeTone="warning"
            onPostpone={() => remove(item)}
          >
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`${item.title}. ${item.read ? "Read" : "Unread"}. Swipe left to delete.`}
              onPress={() => open(item)}
              style={styles.row}
            >
              <View
                style={[
                  styles.rowIcon,
                  {
                    backgroundColor: item.read
                      ? colors.surfaceSunken
                      : colors.primarySoft,
                  },
                ]}
              >
                <Ionicons
                  name={KIND_ICON[item.kind] ?? "notifications-outline"}
                  size={20}
                  color={item.read ? colors.textMuted : colors.primaryText}
                />
              </View>
              <View style={styles.rowText}>
                <AppText
                  variant="titleM"
                  tone={item.read ? "secondary" : "default"}
                >
                  {item.title}
                </AppText>
                {item.body ? (
                  <AppText variant="bodySmall" tone="secondary">
                    {item.body}
                  </AppText>
                ) : null}
                <AppText variant="caption" tone="muted">
                  {formatRelative(item.createdAt)}
                </AppText>
              </View>
              {!item.read ? (
                <View
                  style={[styles.unread, { backgroundColor: colors.primary }]}
                />
              ) : null}
            </Pressable>
          </SwipeableRow>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxxl,
    gap: spacing.sm,
  },
  loader: { marginTop: spacing.xxxl },
  empty: { alignItems: "center", gap: spacing.md, paddingTop: spacing.xxxl },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  center: { textAlign: "center" },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radii.lg,
  },
  rowIcon: {
    width: 40,
    height: 40,
    borderRadius: radii.md,
    alignItems: "center",
    justifyContent: "center",
  },
  rowText: { flex: 1, gap: 2 },
  unread: { width: 10, height: 10, borderRadius: 5 },
});
