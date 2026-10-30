import { AppText } from "@/components/ui/AppText";
import { AppTextInput } from "@/components/ui/AppTextInput";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { DraggableList } from "@/components/ui/DraggableList";
import { HeaderIconButton } from "@/components/ui/HeaderIconButton";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { SwipeableRow } from "@/components/ui/SwipeableRow";
import {
    addRule,
    deleteRule,
    listRules,
    reorderRules,
    updateRule,
    type PersonalRule,
} from "@/db/repositories/rules";
import { RuleSheet } from "@/features/rules/components/RuleSheet";
import { ValidationError } from "@/lib/validation";
import { useTheme } from "@/theme/ThemeProvider";
import { radii, spacing, touch } from "@/theme/tokens";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    View,
} from "react-native";

const REORDER_ROW_HEIGHT = 64;

/** Bundled starting points, tap one to add it. */
const SUGGESTIONS: ReadonlyArray<string> = [
  "Plan tomorrow before going to bed",
  "Read every day, even if only for a few minutes",
  "Avoid unnecessary phone use during study time",
  "Complete important tasks before entertainment",
];

export default function RulesScreen() {
  const { colors } = useTheme();
  const [rules, setRules] = useState<PersonalRule[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [draft, setDraft] = useState("");
  const [reorderMode, setReorderMode] = useState(false);
  const [scrollLocked, setScrollLocked] = useState(false);
  const [editing, setEditing] = useState<PersonalRule | null>(null);

  const load = useCallback(async () => {
    try {
      setFailed(false);
      setRules(await listRules());
    } catch (error) {
      console.warn("Could not load rules", error);
      setFailed(true);
      setRules((prev) => prev ?? []);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const fail = (error: unknown) => {
    if (error instanceof ValidationError)
      Alert.alert("Check the rule", error.message);
    else {
      console.warn("Rule update failed", error);
      Alert.alert("Something went wrong", "Please try again.");
    }
  };

  const add = async (text: string) => {
    try {
      await addRule(text);
      await load();
      return true;
    } catch (error) {
      fail(error);
      return false;
    }
  };

  const submitDraft = async () => {
    const value = draft.trim();
    if (!value) return;
    setDraft("");
    if (!(await add(value))) setDraft(value);
  };

  const remove = async (rule: PersonalRule) => {
    setEditing(null);
    try {
      await deleteRule(rule.id);
    } catch (error) {
      fail(error);
    }
    await load();
  };

  const confirmRemove = (rule: PersonalRule) => {
    Alert.alert("Delete this rule?", "This cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => remove(rule) },
    ]);
  };

  const commitReorder = async (ids: string[]) => {
    try {
      await reorderRules(ids);
    } catch (error) {
      fail(error);
    }
    await load();
  };

  const hasRules = rules !== null && rules.length > 0;
  const canReorder = rules !== null && rules.length > 1;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ScreenHeader
        title="Personal rules"
        right={
          canReorder || reorderMode ? (
            <HeaderIconButton
              icon={reorderMode ? "checkmark" : "swap-vertical-outline"}
              label={reorderMode ? "Done reordering" : "Reorder rules"}
              onPress={() => {
                setReorderMode((v) => !v);
                setScrollLocked(false);
              }}
            />
          ) : undefined
        }
      />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          scrollEnabled={!scrollLocked}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {!reorderMode ? (
            <>
              <AppText tone="secondary">
                A few short principles you want to live by. Keep them simple.
                You will see one of them on Today each day.
              </AppText>

              <View style={styles.addRow}>
                <AppTextInput
                  value={draft}
                  onChangeText={setDraft}
                  placeholder="Add a rule"
                  maxLength={200}
                  returnKeyType="done"
                  submitBehavior="submit"
                  onSubmitEditing={submitDraft}
                  style={styles.flex}
                  accessibilityLabel="Add a rule"
                />
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Add rule"
                  disabled={draft.trim().length === 0}
                  onPress={submitDraft}
                  style={[
                    styles.addButton,
                    {
                      backgroundColor:
                        draft.trim().length > 0
                          ? colors.primary
                          : colors.surfaceSunken,
                    },
                  ]}
                >
                  <Ionicons
                    name="add"
                    size={24}
                    color={
                      draft.trim().length > 0
                        ? colors.onPrimary
                        : colors.textMuted
                    }
                  />
                </Pressable>
              </View>
            </>
          ) : (
            <AppText tone="secondary">
              Press and hold the handle, then drag. Tap the check when you have
              finished.
            </AppText>
          )}

          {rules === null ? (
            <ActivityIndicator color={colors.primary} style={styles.loader} />
          ) : null}

          {failed && rules !== null && rules.length === 0 ? (
            <View style={styles.gap}>
              <AppText variant="titleM">Could not load your rules</AppText>
              <Button label="Try again" onPress={load} />
            </View>
          ) : null}

          {rules !== null && rules.length === 0 && !failed ? (
            <View style={styles.gap}>
              <AppText variant="caption" tone="muted">
                START WITH ONE
              </AppText>
              <View style={styles.chips}>
                {SUGGESTIONS.map((s) => (
                  <Chip key={s} label={s} onPress={() => add(s)} />
                ))}
              </View>
            </View>
          ) : null}

          {hasRules && !reorderMode ? (
            <View style={styles.list}>
              {rules.map((rule, index) => (
                <SwipeableRow
                  key={rule.id}
                  postponeLabel="Delete"
                  postponeIcon="trash-outline"
                  postponeTone="warning"
                  onPostpone={() => confirmRemove(rule)}
                >
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Rule ${index + 1}: ${rule.text}. Tap to edit. Swipe left to delete.`}
                    onPress={() => setEditing(rule)}
                    style={styles.row}
                  >
                    <View
                      style={[
                        styles.number,
                        { backgroundColor: colors.primarySoft },
                      ]}
                    >
                      <AppText variant="label" tone="accent">
                        {index + 1}
                      </AppText>
                    </View>
                    <AppText style={styles.flex}>{rule.text}</AppText>
                  </Pressable>
                </SwipeableRow>
              ))}
            </View>
          ) : null}

          {hasRules && reorderMode && rules ? (
            <DraggableList
              items={rules}
              keyOf={(r) => r.id}
              rowHeight={REORDER_ROW_HEIGHT}
              onDragStateChange={setScrollLocked}
              onReorder={(next) => commitReorder(next.map((r) => r.id))}
              renderRow={(rule, handle) => (
                <View style={styles.reorderOuter}>
                  <View
                    style={[
                      styles.reorderRow,
                      {
                        backgroundColor: colors.surface,
                        borderColor: colors.border,
                      },
                    ]}
                  >
                    <AppText
                      variant="titleM"
                      numberOfLines={1}
                      style={styles.flex}
                    >
                      {rule.text}
                    </AppText>
                    {handle}
                  </View>
                </View>
              )}
            />
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>

      <RuleSheet
        visible={editing !== null}
        rule={editing}
        onClose={() => setEditing(null)}
        onSave={async (rule, text) => {
          await updateRule(rule.id, text);
          await load();
        }}
        onDelete={remove}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  flex: { flex: 1 },
  content: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxxl,
    gap: spacing.lg,
  },
  addRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  addButton: {
    width: touch.minTarget,
    height: touch.minTarget,
    borderRadius: touch.minTarget / 2,
    alignItems: "center",
    justifyContent: "center",
  },
  loader: { marginTop: spacing.xl },
  gap: { gap: spacing.md },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  list: { gap: spacing.sm },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.lg,
  },
  number: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  reorderOuter: { flex: 1, paddingVertical: 4 },
  reorderRow: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingLeft: spacing.lg,
    paddingRight: spacing.xs,
    borderRadius: radii.lg,
    borderWidth: 1,
  },
});
