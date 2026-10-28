import { addDays, nextMonday } from "@/lib/dates";
import { spacing } from "@/theme/tokens";
import { StyleSheet, View } from "react-native";
import { Chip } from "./Chip";
import { MonthCalendar } from "./MonthCalendar";

type Props = {
  value: string | null;
  today: string;
  onSelect: (date: string) => void;
};

export function DatePickerPanel({ value, today, onSelect }: Props) {
  const tomorrow = addDays(today, 1);
  const monday = nextMonday(today);

  return (
    <View style={styles.wrap}>
      <View style={styles.chips}>
        <Chip
          label="Today"
          selected={value === today}
          onPress={() => onSelect(today)}
        />
        <Chip
          label="Tomorrow"
          selected={value === tomorrow}
          onPress={() => onSelect(tomorrow)}
        />
        <Chip
          label="Next Monday"
          selected={value === monday}
          onPress={() => onSelect(monday)}
        />
      </View>
      <MonthCalendar value={value} minDate={today} onSelect={onSelect} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.lg },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
});
