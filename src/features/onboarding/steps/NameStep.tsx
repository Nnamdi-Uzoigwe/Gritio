import { AppText } from "@/components/ui/AppText";
import { AppTextInput } from "@/components/ui/AppTextInput";
import { getGreeting } from "@/lib/greeting";
import { spacing } from "@/theme/tokens";
import { useMemo } from "react";
import { StyleSheet, View } from "react-native";
import { StepFrame } from "../components/StepFrame";
import { useOnboardingStore } from "../store";

export function NameStep() {
  const name = useOnboardingStore((s) => s.name);
  const setName = useOnboardingStore((s) => s.setName);
  const greeting = useMemo(() => getGreeting(name), [name]);

  return (
    <StepFrame
      title="What should we call you?"
      subtitle="Optional. It stays on your device and is only used to greet you."
    >
      <AppTextInput
        variant="displayM"
        value={name}
        onChangeText={setName}
        placeholder="Your name"
        autoCapitalize="words"
        autoCorrect={false}
        maxLength={30}
        returnKeyType="done"
        accessibilityLabel="Your name"
      />
      <View style={styles.preview}>
        <AppText variant="caption" tone="muted">
          PREVIEW
        </AppText>
        <AppText variant="titleL" tone="accent">
          {greeting}
        </AppText>
      </View>
    </StepFrame>
  );
}

const styles = StyleSheet.create({
  preview: { marginTop: spacing.xl, gap: spacing.xs },
});
