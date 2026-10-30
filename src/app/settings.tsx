import { AppText } from "@/components/ui/AppText";
import { AppTextInput } from "@/components/ui/AppTextInput";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { Button } from "@/components/ui/Button";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import {
  deleteSetting,
  getSetting,
  setSetting,
} from "@/db/repositories/settings";
import { useOnboardingStore } from "@/features/onboarding/store";
import { useTheme } from "@/theme/ThemeProvider";
import { radii, spacing, touch } from "@/theme/tokens";
import type { ThemeMode } from "@/types/domain";
import { Ionicons } from "@expo/vector-icons";
import Constants from "expo-constants";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";

const THEME_OPTIONS: ReadonlyArray<{ value: ThemeMode; label: string }> = [
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
  { value: "system", label: "System" },
];

function Group({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  const { colors } = useTheme();
  return (
    <View style={styles.group}>
      <AppText variant="caption" tone="muted">
        {label}
      </AppText>
      <View
        style={[
          styles.groupBody,
          { backgroundColor: colors.surface, borderColor: colors.border },
        ]}
      >
        {children}
      </View>
    </View>
  );
}

function Row({
  title,
  value,
  onPress,
  last = false,
}: {
  title: string;
  value?: string;
  onPress?: () => void;
  last?: boolean;
}) {
  const { colors } = useTheme();
  const content = (
    <View
      style={[
        styles.row,
        !last && { borderBottomWidth: 1, borderBottomColor: colors.border },
      ]}
    >
      <AppText variant="titleM" style={styles.rowTitle}>
        {title}
      </AppText>
      {value ? (
        <AppText tone="secondary" numberOfLines={1} style={styles.rowValue}>
          {value}
        </AppText>
      ) : null}
      {onPress ? (
        <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
      ) : null}
    </View>
  );
  if (!onPress) return content;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${title}${value ? `, ${value}` : ""}`}
      onPress={onPress}
    >
      {content}
    </Pressable>
  );
}

export default function SettingsScreen() {
  const { colors, mode, setMode } = useTheme();
  const router = useRouter();
  const [name, setName] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      getSetting("user_name")
        .then(setName)
        .catch((e) => console.warn("Could not read name", e));
    }, []),
  );

  const openEdit = () => {
    setDraft(name ?? "");
    setError(null);
    setEditing(true);
  };

  const saveName = async () => {
    setSaving(true);
    setError(null);
    try {
      const trimmed = draft.trim();
      if (trimmed) await setSetting("user_name", trimmed);
      else await deleteSetting("user_name");
      setName(trimmed || null);
      setEditing(false);
    } catch (e) {
      console.warn("Could not save name", e);
      setError("Could not save. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const resetForTesting = async () => {
    await setSetting("onboarding_completed", "0");
    await setSetting("splash_seen", "0");
    useOnboardingStore.getState().reset();
    router.replace("/");
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ScreenHeader title="Settings" />
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Group label="APPEARANCE">
          <View style={styles.appearance}>
            <SegmentedControl
              options={THEME_OPTIONS}
              value={mode}
              onChange={setMode}
            />
            <AppText variant="bodySmall" tone="muted">
              Light is the default. System follows your phone.
            </AppText>
          </View>
        </Group>

        <Group label="PERSONALIZATION">
          <Row title="Name" value={name ?? "Not set"} onPress={openEdit} />
          <Row title="Personal rules" onPress={() => router.push("/rules")} />
          <Row
            title="Reflection history"
            onPress={() => router.push("/reflection-history")}
            last
          />
        </Group>

        <Group label="NOTIFICATIONS">
          <Row
            title="Reminders"
            onPress={() => router.push("/notification-settings")}
            last
          />
        </Group>

        <Group label="ABOUT">
          <Row
            title="Version"
            value={Constants.expoConfig?.version ?? "1.0.0"}
            last
          />
        </Group>

        {__DEV__ ? (
          <Group label="DEVELOPMENT">
            <View style={styles.appearance}>
              <Button
                label="Reset onboarding"
                variant="secondary"
                onPress={resetForTesting}
              />
            </View>
          </Group>
        ) : null}
      </ScrollView>

      <BottomSheet
        visible={editing}
        onClose={() => setEditing(false)}
        title="What should we call you?"
      >
        <View style={styles.sheetBody}>
          <AppTextInput
            variant="displayM"
            value={draft}
            onChangeText={setDraft}
            placeholder="Your name"
            autoCapitalize="words"
            autoCorrect={false}
            maxLength={30}
            autoFocus
            accessibilityLabel="Your name"
          />
          {error ? (
            <AppText variant="bodySmall" tone="error">
              {error}
            </AppText>
          ) : null}
          <Button label="Save" onPress={saveName} loading={saving} />
        </View>
      </BottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxxl,
    gap: spacing.xl,
  },
  group: { gap: spacing.sm },
  groupBody: { borderRadius: radii.lg, borderWidth: 1, overflow: "hidden" },
  appearance: { padding: spacing.lg, gap: spacing.md },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    minHeight: touch.minTarget + 8,
    paddingHorizontal: spacing.lg,
  },
  rowTitle: { flex: 1 },
  rowValue: { maxWidth: "50%" },
  sheetBody: { gap: spacing.lg },
});
