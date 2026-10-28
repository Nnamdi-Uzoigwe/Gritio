import { AppText } from "@/components/ui/AppText";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { Button } from "@/components/ui/Button";
import { DatePickerPanel } from "@/components/ui/DatePickerPanel";
import { addDays, formatShortDate, nextMonday } from "@/lib/dates";
import { useTheme } from "@/theme/ThemeProvider";
import { spacing, touch } from "@/theme/tokens";
import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";

type Props = {
  visible: boolean;
  today: string;
  onClose: () => void;
  onPick: (date: string) => void;
};

export function RescheduleSheet({ visible, today, onClose, onPick }: Props) {
  const { colors } = useTheme();
  const [calendar, setCalendar] = useState(false);

  useEffect(() => {
    if (visible) setCalendar(false);
  }, [visible]);

  const options = [
    { label: "Tomorrow", date: addDays(today, 1) },
    { label: "In 2 days", date: addDays(today, 2) },
    { label: "Next Monday", date: nextMonday(today) },
  ];

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title="Move to another day"
    >
      {calendar ? (
        <View style={styles.body}>
          <DatePickerPanel value={null} today={today} onSelect={onPick} />
        </View>
      ) : (
        <View style={styles.body}>
          {options.map((option) => (
            <Pressable
              key={option.label}
              accessibilityRole="button"
              accessibilityLabel={`${option.label}, ${formatShortDate(option.date)}`}
              onPress={() => onPick(option.date)}
              style={[styles.option, { backgroundColor: colors.surfaceSunken }]}
            >
              <AppText variant="titleM">{option.label}</AppText>
              <AppText variant="bodySmall" tone="muted">
                {formatShortDate(option.date)}
              </AppText>
            </Pressable>
          ))}
          <Button
            label="Pick a date"
            variant="secondary"
            onPress={() => setCalendar(true)}
          />
          <View style={styles.hint}>
            <Ionicons
              name="information-circle-outline"
              size={16}
              color={colors.textMuted}
            />
            <AppText variant="caption" tone="muted">
              Nothing is lost. It will simply appear on the new day.
            </AppText>
          </View>
        </View>
      )}
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  body: { gap: spacing.md },
  option: {
    minHeight: touch.minTarget + 8,
    paddingHorizontal: spacing.lg,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  hint: { flexDirection: "row", alignItems: "center", gap: spacing.xs },
});
