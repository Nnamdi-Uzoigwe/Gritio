import { useTheme } from "@/theme/ThemeProvider";
import { spacing } from "@/theme/tokens";
import { StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AppText } from "./AppText";
import { Chip } from "./Chip";

type Props = { title: string; description: string };

/** Holding screen for a tab whose feature ships in a later build phase. */
export function ComingSoon({ title, description }: Props) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <View
      style={[
        styles.root,
        {
          backgroundColor: colors.background,
          paddingTop: insets.top + spacing.xl,
        },
      ]}
    >
      <AppText variant="displayL">{title}</AppText>
      <AppText tone="secondary">{description}</AppText>
      <Chip label="Coming in a later build phase" />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, paddingHorizontal: spacing.xl, gap: spacing.md },
});
