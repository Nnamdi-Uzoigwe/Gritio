import { AppTextInput } from "@/components/ui/AppTextInput";
import { useTheme } from "@/theme/ThemeProvider";
import { spacing, touch } from "@/theme/tokens";
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";

type Props = { onAdd: (title: string) => Promise<void>; placeholder?: string };

/** Type a step, press done, the next one is ready. The keyboard stays open. */
export function StepQuickAdd({ onAdd, placeholder = "Add a step" }: Props) {
  const { colors } = useTheme();
  const [text, setText] = useState("");

  const submit = async () => {
    const value = text.trim();
    if (!value) return;
    setText("");
    try {
      await onAdd(value);
    } catch {
      setText(value); // the caller already told the person what went wrong
    }
  };

  const ready = text.trim().length > 0;

  return (
    <View style={styles.row}>
      <AppTextInput
        value={text}
        onChangeText={setText}
        placeholder={placeholder}
        maxLength={120}
        returnKeyType="done"
        submitBehavior="submit"
        onSubmitEditing={submit}
        style={styles.input}
        accessibilityLabel={placeholder}
      />
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Add step"
        disabled={!ready}
        onPress={submit}
        style={[
          styles.add,
          { backgroundColor: ready ? colors.primary : colors.surfaceSunken },
        ]}
      >
        <Ionicons
          name="add"
          size={24}
          color={ready ? colors.onPrimary : colors.textMuted}
        />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  input: { flex: 1 },
  add: {
    width: touch.minTarget,
    height: touch.minTarget,
    borderRadius: touch.minTarget / 2,
    alignItems: "center",
    justifyContent: "center",
  },
});
