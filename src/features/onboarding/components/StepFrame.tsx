import { AppText } from "@/components/ui/AppText";
import { spacing } from "@/theme/tokens";
import React from "react";
import {
    ScrollView,
    StyleSheet,
    View,
    useWindowDimensions,
} from "react-native";

type Props = { title: string; subtitle?: string; children?: React.ReactNode };

export function StepFrame({ title, subtitle, children }: Props) {
  const { width } = useWindowDimensions();
  return (
    <View style={{ width }}>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <AppText variant="displayL">{title}</AppText>
        {subtitle ? (
          <AppText tone="secondary" style={styles.subtitle}>
            {subtitle}
          </AppText>
        ) : null}
        <View style={styles.body}>{children}</View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xxl,
  },
  subtitle: { marginTop: spacing.md },
  body: { marginTop: spacing.xl, gap: spacing.md },
});
