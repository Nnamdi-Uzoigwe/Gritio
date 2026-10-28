import { AppText } from "@/components/ui/AppText";
import { AppTextInput } from "@/components/ui/AppTextInput";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { Button } from "@/components/ui/Button";
import { ValidationError } from "@/lib/validation";
import { spacing } from "@/theme/tokens";
import type { MilestoneItem } from "@/types/steps";
import { useEffect, useRef, useState } from "react";
import { Alert, StyleSheet, View } from "react-native";

type Props = {
  visible: boolean;
  milestone: MilestoneItem | null; // null means creating a new one
  onClose: () => void;
  onSave: (title: string) => Promise<void>;
  onDelete: (milestone: MilestoneItem) => void;
};

export function MilestoneSheet({
  visible,
  milestone,
  onClose,
  onSave,
  onDelete,
}: Props) {
  const last = useRef<MilestoneItem | null>(milestone);
  if (milestone) last.current = milestone;
  const editing = visible
    ? milestone !== null
    : last.current !== null && milestone !== null;
  const shown = milestone ?? last.current;

  const [title, setTitle] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setTitle(milestone?.title ?? "");
    setError(null);
    setSaving(false);
  }, [visible, milestone?.id]);

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      await onSave(title);
      onClose();
    } catch (e) {
      if (e instanceof ValidationError) setError(e.message);
      else {
        console.warn("Could not save milestone", e);
        setError("Could not save. Please try again.");
      }
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = () => {
    if (!shown) return;
    const count = shown.steps.length;
    const detail =
      count > 0
        ? ` This also deletes its ${count} ${count === 1 ? "step" : "steps"}.`
        : "";
    Alert.alert("Delete this milestone?", `This cannot be undone.${detail}`, [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => onDelete(shown) },
    ]);
  };

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title={editing ? "Edit milestone" : "New milestone"}
    >
      <View style={styles.body}>
        <AppTextInput
          variant="titleL"
          value={title}
          onChangeText={setTitle}
          placeholder="Name this milestone"
          maxLength={120}
          autoFocus
          returnKeyType="done"
          onSubmitEditing={save}
          accessibilityLabel="Milestone title"
        />
        {error ? (
          <AppText variant="bodySmall" tone="error" accessibilityRole="alert">
            {error}
          </AppText>
        ) : null}
        <Button
          label={editing ? "Save changes" : "Add milestone"}
          onPress={save}
          loading={saving}
          disabled={title.trim().length === 0}
        />
        {editing ? (
          <Button
            label="Delete milestone"
            variant="ghost"
            onPress={confirmDelete}
          />
        ) : null}
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({ body: { gap: spacing.md } });
