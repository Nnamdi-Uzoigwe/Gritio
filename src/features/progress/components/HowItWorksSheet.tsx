import { AppText } from "@/components/ui/AppText";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { spacing } from "@/theme/tokens";
import { ScrollView, StyleSheet, View } from "react-native";

const LINES: ReadonlyArray<string> = [
  "A commitment is a task dated that day, a habit scheduled that day, or a goal step scheduled that day.",
  "It counts as done once you complete it. A percentage is done items out of all items.",
  "Today only counts what you have finished so far, so an unfinished day never lowers your numbers.",
  "Habit rates count the scheduled days that have passed since the habit started.",
  "If you move a task or step to another day, it counts on its new day. Gritio does not keep a log of moves.",
  "If you change a habit's schedule, the new schedule applies to its whole history.",
  "Deleted items disappear from history. Archived habits count up to the day they were archived.",
  "Everything is calculated from the records on this device. Nothing is estimated, guessed or filled in.",
];

export function HowItWorksSheet({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title="How these numbers work"
    >
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.body}>
          {LINES.map((line) => (
            <AppText key={line} tone="secondary">
              {line}
            </AppText>
          ))}
        </View>
      </ScrollView>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  scroll: { maxHeight: 420 },
  body: { gap: spacing.md, paddingBottom: spacing.md },
});
