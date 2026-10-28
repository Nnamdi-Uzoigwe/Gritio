import { AppText } from "@/components/ui/AppText";
import { Button } from "@/components/ui/Button";
import { useTheme } from "@/theme/ThemeProvider";
import { radii, spacing } from "@/theme/tokens";
import { ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function DesignCheck() {
  const { colors, mode, setMode } = useTheme();
  const insets = useSafeAreaInsets();

  const swatches = [
    ["primary", colors.primary],
    ["success", colors.success],
    ["warning", colors.warning],
    ["error", colors.error],
    ["surface", colors.surface],
    ["sunken", colors.surfaceSunken],
  ] as const;

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={[
        styles.content,
        {
          paddingTop: insets.top + spacing.xl,
          paddingBottom: insets.bottom + spacing.xxl,
        },
      ]}
    >
      <AppText variant="caption" tone="accent">
        DESIGN CHECK
      </AppText>
      <AppText variant="displayXL">Gritio</AppText>
      <AppText tone="secondary">
        Every goal leads to an action. Theme: {mode}.
      </AppText>

      <View style={styles.swatchRow}>
        {swatches.map(([name, color]) => (
          <View key={name} style={styles.swatchItem}>
            <View
              style={[
                styles.swatch,
                { backgroundColor: color, borderColor: colors.border },
              ]}
            />
            <AppText variant="caption" tone="muted">
              {name}
            </AppText>
          </View>
        ))}
      </View>

      <AppText variant="displayM">Theme</AppText>
      <View style={styles.row}>
        <Button
          label="Light"
          variant={mode === "light" ? "primary" : "secondary"}
          onPress={() => setMode("light")}
          style={styles.flex}
        />
        <Button
          label="Dark"
          variant={mode === "dark" ? "primary" : "secondary"}
          onPress={() => setMode("dark")}
          style={styles.flex}
        />
        <Button
          label="System"
          variant={mode === "system" ? "primary" : "secondary"}
          onPress={() => setMode("system")}
          style={styles.flex}
        />
      </View>

      <Button label="Primary button" onPress={() => {}} />
      <Button label="Secondary button" variant="secondary" onPress={() => {}} />
      <Button label="Ghost button" variant="ghost" onPress={() => {}} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: spacing.xl, gap: spacing.lg },
  row: { flexDirection: "row", gap: spacing.sm },
  flex: { flex: 1 },
  swatchRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.md },
  swatchItem: { alignItems: "center", gap: spacing.xs },
  swatch: { width: 48, height: 48, borderRadius: radii.md, borderWidth: 1 },
});
