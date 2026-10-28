import { AppText } from "@/components/ui/AppText";
import { Button } from "@/components/ui/Button";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import {
    listInbox,
    markAllRead,
    markRead,
    type InboxItem,
} from "@/db/repositories/inbox";
import type { IconName } from "@/lib/focusAreas";
import { formatRelative } from "@/lib/time";
import { useTheme } from "@/theme/ThemeProvider";
import { radii, spacing } from "@/theme/tokens";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import {
    ActivityIndicator,
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
  const [items, setItems] = useState<InboxItem[] | null>(null);
  const [failed, setFailed] = useState(false);

  const load = useCallback(async () => {
    try {
      setFailed(false);
      setItems(await listInbox());
    } catch (error) {
      console.warn("Could not load notifications", error);
      setFailed(true);
      setItems([]);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
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

  const readAll = async () => {
    setItems((prev) => prev?.map((i) => ({ ...i, read: true })) ?? prev);
    try {
      await markAllRead();
    } catch (error) {
      console.warn("Could not mark all as read", error);
      load();
    }
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ScreenHeader title="Notifications" />
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {items === null ? (
          <ActivityIndicator color={colors.primary} style={styles.loader} />
        ) : null}

        {failed ? (
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
              Your reminders and updates will show up here.
            </AppText>
          </View>
        ) : null}

        {hasUnread ? (
          <Button label="Mark all as read" variant="ghost" onPress={readAll} />
        ) : null}

        {items?.map((item) => (
          <Pressable
            key={item.id}
            accessibilityRole="button"
            accessibilityLabel={`${item.title}. ${item.read ? "Read" : "Unread"}.`}
            onPress={() => readOne(item)}
            style={[
              styles.row,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
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
    gap: spacing.md,
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
    borderWidth: 1,
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
