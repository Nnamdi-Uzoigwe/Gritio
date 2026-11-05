import { Pressable, StyleSheet, Text, View } from "react-native";

type Props = { error: Error; retry: () => Promise<unknown> };

/**
 * Shown if a screen ever throws while rendering. It does not use the theme or app fonts, because
 * those may be the very thing that failed, so it only uses plain, high contrast styles.
 */
export function AppErrorBoundary({ error, retry }: Props) {
  return (
    <View style={styles.root}>
      <Text accessibilityRole="header" style={styles.title}>
        Something went wrong
      </Text>
      <Text style={styles.body}>
        Gritio ran into a problem. Your data is safe on this device.
      </Text>
      {__DEV__ ? <Text style={styles.dev}>{error.message}</Text> : null}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Try again"
        onPress={() => {
          retry().catch(() => {});
        }}
        style={styles.button}
      >
        <Text style={styles.buttonText}>Try again</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#F7F6F2",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    gap: 12,
  },
  title: {
    color: "#222222",
    fontSize: 26,
    fontWeight: "700",
    textAlign: "center",
  },
  body: { color: "#5F5B54", fontSize: 16, textAlign: "center", maxWidth: 320 },
  dev: { color: "#B83A3A", fontSize: 12, textAlign: "center" },
  button: {
    marginTop: 12,
    minHeight: 52,
    minWidth: 180,
    borderRadius: 999,
    backgroundColor: "#C49A45",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  buttonText: { color: "#222222", fontSize: 17, fontWeight: "600" },
});
