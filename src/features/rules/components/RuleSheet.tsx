import { AppText } from "@/components/ui/AppText";
import { AppTextInput } from "@/components/ui/AppTextInput";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { Button } from "@/components/ui/Button";
import type { PersonalRule } from "@/db/repositories/rules";
import { ValidationError } from "@/lib/validation";
import { spacing } from "@/theme/tokens";
import { useEffect, useRef, useState } from "react";
import { Alert, StyleSheet, View } from "react-native";

type Props = {
  visible: boolean;
  rule: PersonalRule | null;
  onClose: () => void;
  onSave: (rule: PersonalRule, text: string) => Promise<void>;
  onDelete: (rule: PersonalRule) => void;
};

export function RuleSheet({ visible, rule, onClose, onSave, onDelete }: Props) {
  // Keep the last rule so content does not vanish while the sheet slides away.
  const last = useRef<PersonalRule | null>(rule);
  if (rule) last.current = rule;
  const shown = rule ?? last.current;

  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!visible || !rule) return;
    setText(rule.text);
    setError(null);
    setSaving(false);
  }, [visible, rule?.id]);

  if (!shown) return null;

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      await onSave(shown, text);
      onClose();
    } catch (e) {
      if (e instanceof ValidationError) setError(e.message);
      else {
        console.warn("Could not save rule", e);
        setError("Could not save. Please try again.");
      }
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = () => {
    Alert.alert("Delete this rule?", "This cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => onDelete(shown) },
    ]);
  };

  return (
    <BottomSheet visible={visible} onClose={onClose} title="Edit rule">
      <View style={styles.body}>
        <AppTextInput
          value={text}
          onChangeText={setText}
          placeholder="Write your rule"
          multiline
          maxLength={200}
          autoFocus
          style={styles.input}
          accessibilityLabel="Rule text"
        />
        {error ? (
          <AppText variant="bodySmall" tone="error" accessibilityRole="alert">
            {error}
          </AppText>
        ) : null}
        <Button
          label="Save changes"
          onPress={save}
          loading={saving}
          disabled={text.trim().length === 0}
        />
        <Button label="Delete rule" variant="ghost" onPress={confirmDelete} />
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  body: { gap: spacing.md },
  input: { minHeight: 56, maxHeight: 130 },
});
